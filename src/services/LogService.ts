import { Service } from "typedi";
import { v4 as uuidv4 } from "uuid";
import { JsonRpcProvider } from "@ethersproject/providers";

import logger from "../utils/logger.js";
import LogModel from "../db/models/Log.js";
import { CONFIG } from "../config/config.js";
import { Interface } from "@ethersproject/abi";
import { NETWORK_CONFIG, SOCKET_SUPPORTED_NETWORKS, WATCHER_APPLICATION_SUPPORTED_NETWORKS } from "../constants/network.js";
import { CHAINID_DATA, NETWORK } from "../constants/network.js";
import { IPacketProposedLog, ISealedLog } from "../types/index.js";
import { SealedEventABI, SealedEventTopic } from "../constants/events.js";

@Service()
export class LogService {
    public async processSealedEvent(network: NETWORK, data: ISealedLog) {
        try {
            logger.info("In processSealedEvent", { network, data });
            const log = {
                log: "log.sealed",
                logId: uuidv4(),
                packetId: data.packetId,
                network,
                data,
            };
            await LogModel.addLog(log);
            logger.info("Sealed Event Added", { data });
        } catch (error) {
            logger.error("Error in processSealedEvent", { data }, error);
        }
    }

    public async processPacketProposedEvent(network: NETWORK, data: IPacketProposedLog): Promise<void> {
        logger.info("In processPacketProposedEvent", { network, data });
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

            // get srcChainId from packetID
            const srcChainId = this.getChainSlugFromPacketId(data.packetId);
            const isSocketSupportedChain = SOCKET_SUPPORTED_NETWORKS.includes(srcChainId as number);

            // if the packetId is not decodable to a suitable chainSlug that is Socket supported, transmitter might
            // be throwing random data with packetId. TRIP!
            if (!srcChainId || !isSocketSupportedChain) {
                logger.info("TripProposal Job!");
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
                logger.error("In processPacketProposedEvent - unable to find Sealed log", { data });
                throw new Error("Unable to find Sealed log");
            }

            // if inconsistent then add trip proposal job to job queue
            if (sealedLog.root !== data.root) {
                // add to queue
            }
        } catch (error) {
            logger.error("Error in processPacketProposedEvent - " + network, error);
        }
    }

    public async getSealedLog(srcChainId: number, packetId: string): Promise<ISealedLog | null> {
        const sealedLogFromDB = await LogModel.getSealedLogFromPacketId(packetId);
        if (sealedLogFromDB) {
            return sealedLogFromDB.data;
        }
        // if the log is not present in the DB, fallback to check in srcChain
        // the log
        const srcChain = CHAINID_DATA[srcChainId].network;
        const socketAddress = (CONFIG.socket as { [key: number]: string })[`${srcChainId}`]; // little ts hack

        const sealedLogFromSrcChain = await this.getLogs(srcChain, socketAddress, [SealedEventTopic, null, packetId]);
        const parser = new Interface(SealedEventABI);
        if (!sealedLogFromSrcChain || !sealedLogFromSrcChain.length) {
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
