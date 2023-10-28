import { Inject, Service } from "typedi";

import logger from "../utils/logger.js";
import { LogService } from "../services/LogService.js";
import { AbstractLogListener } from "./AbstractLogListener.js";
import { NETWORK, NETWORK_CONFIG } from "../constants/network.js";
import { IPacketProposedLog, ISealedLog } from "../types/index.js";
import { PacketProposedABI, PacketProposedTopic, SealedEventABI, SealedEventTopic } from "../constants/events.js";

const filters = [
    {
        type: "sealed",
        abi: SealedEventABI,
        topic: SealedEventTopic,
    },
    {
        type: "packetProposed",
        abi: PacketProposedABI,
        topic: PacketProposedTopic,
    },
];
// LogListeners are transient instances that subscribes to both Sealed and PacketProposed Logs
// Calls onEvent with the log data when an approporiate log event is received
@Service({ transient: true })
export class LogListener extends AbstractLogListener {
    public network: NETWORK | null = null;
    constructor(@Inject() private logService: LogService) {
        super();
    }

    public start(network: NETWORK, contractAddress: string) {
        try {
            this.network = network;
            const rpc = NETWORK_CONFIG[network].wssRpc;
            this.init(rpc, contractAddress, filters, [[SealedEventTopic, PacketProposedTopic]]);
            logger.info("Started LogListener - " + network);
        } catch (error) {
            logger.error("Error in LogListener - start - " + network, error);
        }
    }

    public onEvent(data: Record<string, any>): void {
        try {
            switch (data.type) {
                case "sealed":
                    return this.onSealed(data as ISealedLog);
                case "packetProposed":
                    return this.onPacketProposed(data as IPacketProposedLog);
                default:
                    throw new Error("unable to process event type");
            }
        } catch (error) {
            logger.error("In LogListener - onEvent", error);
        }
    }

    private onSealed(data: ISealedLog) {
        const { packetId, transmitter, batchSize, root, signature } = data;
        this.logService.processSealedEvent(this.network as NETWORK, {
            packetId,
            transmitter,
            batchSize,
            root,
            signature,
        });
    }

    private onPacketProposed(data: IPacketProposedLog) {
        const { packetId, transmitter, proposalCount, root, switchboard } = data;
        this.logService.processPacketProposedEvent(this.network as NETWORK, {
            packetId,
            transmitter,
            proposalCount,
            root,
            switchboard,
        });
    }
}
