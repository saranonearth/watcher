import { EVENTS } from "../types/event.js";
import { v4 as uuidv4 } from "uuid";
import { Inject, Service } from "typedi";
import { Interface } from "@ethersproject/abi";
import { JsonRpcProvider } from "@ethersproject/providers";

import logger from "../utils/logger.js";
import LogModel from "../db/models/Log.js";
import { CONFIG } from "../config/config.js";
import EventStore from "../db/models/EventStore.js";
import { JobKey } from "../job/JobWorkerService.js";
import { JobQueueService } from "../job/JobQueueService.js";
import { CHAINID_DATA, NETWORK } from "../constants/network.js";
import { SealedEventABI, SealedEventTopic } from "../constants/events.js";
import { IPacketProposedLog, ISealedLog, TripPorposalJob } from "../types/index.js";
import { SOCKET_SUPPORTED_NETWORKS, WATCHER_APPLICATION_SUPPORTED_NETWORKS, NETWORK_CONFIG } from "../constants/network.js";
@Service()
export class LogService {
    constructor(@Inject() private jobQueue: JobQueueService) {}
    public async processSealedLog(network: NETWORK, data: ISealedLog) {
        try {
            logger.info("In processSealedLog", { network, data });
            const log = {
                log: "log.sealed",
                logId: uuidv4(),
                packetId: data.packetId,
                network,
                data,
            };
            await LogModel.addLog(log);
            logger.info("In processSealedLog - Sealed log Added", { data });
        } catch (error) {
            logger.error("Error in processSealedLog", { data }, error);
        }
    }

    public async processPacketProposedLog(network: NETWORK, data: IPacketProposedLog): Promise<void> {
        logger.info("In processPacketProposedLog", { network, data });
        try {
            // store proposed log
            const log = {
                log: "log.packetProposed",
                logId: uuidv4(),
                packetId: data.packetId,
                network,
                data,
            };
            await LogModel.addLog(log);
            logger.info("In processPacketProposedLog - PacketProposed log Added", { data });
            const eventId = data.proposalCount + ":" + data.packetId;
            // get srcChainId from packetID
            const srcChainId = this.getChainSlugFromPacketId(data.packetId);
            const isSocketSupportedChain = SOCKET_SUPPORTED_NETWORKS.includes(srcChainId as number);

            // if the packetId is not decodable to a suitable chainSlug that is Socket supported, transmitter might
            // be throwing random data with packetId. TRIP!
            if (!srcChainId || !isSocketSupportedChain) {
                logger.info("In processPacketProposedLog - Unsupported source chain found", { data });
                // push the trip proposal job for the worker to process
                await this.jobQueue.push(
                    JobKey.TRIP_PROPOSAL,
                    {
                        eventId,
                        localChain: network,
                        packetId: data.packetId,
                        switchboard: data.switchboard,
                        proposalCount: data.proposalCount,
                        proposedTransmitter: data.transmitter,
                        root: data.root,
                    } as TripPorposalJob,
                    500000
                );
                await EventStore.addEvent({
                    event: EVENTS.PROPOSAL_TRIP_INITIATED,
                    eventId,
                    refId: data.packetId,
                    network,
                    data,
                });
                return;
            }

            // check if the the network is supported by watcher
            const isWatcherApplicationSupported = WATCHER_APPLICATION_SUPPORTED_NETWORKS.includes(srcChainId as number);
            if (!isWatcherApplicationSupported) {
                logger.error("Unsupported network by watcher detected", { localChain: network, packetId: data.packetId });
                throw new Error("Unsupported network by watcher detected");
            }

            // relavent sealed log from the sibling chain(scan db + use getLogs as fallback)
            const sealedLog = await this.getSealedLog(srcChainId, data.packetId);
            if (!sealedLog) {
                logger.error("In processPacketProposedLog - unable to find Sealed log", { data });
                throw new Error("Unable to find Sealed log");
            }

            // if inconsistent then add trip proposal job to job queue
            if (sealedLog.root !== data.root) {
                logger.info("In processPacketProposedLog - Root mismatch found", { data });
                await this.jobQueue.push(
                    JobKey.TRIP_PROPOSAL,
                    {
                        eventId,
                        sealedTransmitter: sealedLog.transmitter,
                        srcChain: CHAINID_DATA[srcChainId].network,
                        localChain: network,
                        packetId: data.packetId,
                        switchboard: data.switchboard,
                        proposalCount: data.proposalCount,
                        proposedTransmitter: data.transmitter,
                        root: data.root,
                    } as TripPorposalJob,
                    500000
                );
                await EventStore.addEvent({
                    event: EVENTS.PROPOSAL_TRIP_INITIATED,
                    eventId,
                    refId: data.packetId,
                    network,
                    data,
                });
                return;
            }
            await EventStore.addEvent({ event: EVENTS.PROPOSAL_OK, eventId, refId: data.packetId, network, data });
            logger.info("In processPacketProposedLog - no mismatch", { data });
        } catch (error) {
            logger.error("Error in processPacketProposedLog - " + network, error);
        }
    }

    public async getSealedLog(srcChainId: number, packetId: string): Promise<ISealedLog | null> {
        const sealedLogFromDB = await LogModel.getSealedLogFromPacketId(packetId);
        if (sealedLogFromDB) {
            return sealedLogFromDB.data;
        }
        // if the log is not present in the DB, fallback to check in srcChain
        // the log via getLogs()
        const srcChain = CHAINID_DATA[srcChainId].network;
        const socketAddress = (CONFIG.socket as { [key: number]: string })[`${srcChainId}`]; // little ts hack

        const sealedLogFromSrcChain = await this.getLogs(srcChain, socketAddress, [SealedEventTopic, null, packetId]);
        const parser = new Interface(SealedEventABI);
        if (!sealedLogFromSrcChain || !sealedLogFromSrcChain.length) {
            logger.info("In getSealedLog - unable to resolve", { packetId });
            return null;
        }
        // parse the topics data of the log to readable format
        const parsedSealedLogFromSrcChain = parser.parseLog(sealedLogFromSrcChain[0])?.args;
        const { transmitter, packetId: _packetId, batchSize, root, signature } = parsedSealedLogFromSrcChain;
        return {
            transmitter,
            packetId: _packetId,
            batchSize,
            root,
            signature,
        };
    }

    /**
     * Fetch logs for a given topic filter of a contract
     * Resource: https://docs.ethers.org/v5/api/providers/provider/#Provider-getLogs
     * @param network chain
     * @param address address of the contract
     * @param topics topics to filter
     * @param fromBlock block number to start from
     * @param toBlock block till which to search 'latest' for latest block
     * @returns
     */
    public async getLogs(
        network: NETWORK,
        address: string,
        topics: (string | string[] | null)[],
        fromBlock: number = 10000,
        toBlock: number | string = "latest"
    ) {
        const rpc = NETWORK_CONFIG[network].httpRpc;
        const provider = new JsonRpcProvider(rpc);
        const logs = await provider.getLogs({
            address,
            topics,
            fromBlock,
            toBlock,
        });
        return logs;
    }

    // pakcetId is encoded with chain slug, capacitor and packetCount
    // Resource: https://github.com/SocketDotTech/socket-DL/blob/b46e4aa09107e6d13a4c3ccace10c09cf7028223/contracts/socket/SocketSrc.sol#L344
    public getChainSlugFromPacketId(packetId: string): number | undefined {
        try {
            let _packetId = packetId;
            if (_packetId.startsWith("0x")) {
                _packetId = _packetId.slice(2);
            }
            const encodedBigInt = BigInt("0x" + _packetId);
            const chainSlug = (encodedBigInt >> 224n) & 0xffffffffn;
            return Number(chainSlug);
        } catch (error) {
            logger.error("Error in getChainSlugFromPacketId", { packetId }, error);
            return undefined;
        }
    }
}
