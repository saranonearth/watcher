import { Inject, Service } from "typedi";

import logger from "../utils/logger.js";
import { EVENTS } from "../types/event.js";
import EventStore from "../db/models/EventStore.js";
import { TripPorposalJob } from "../types/index.js";
import { SwitchBoardService } from "../services/SwitchboardService.js";
import { NETWORK, NETWORK_CONFIG } from "../constants/network.js";

@Service()
export class SwitchboardTask {
    constructor(@Inject() private switchBoardService: SwitchBoardService) {}
    public async tripProposal(payload: TripPorposalJob) {
        logger.info("Process Trip Proposal", { payload });

        try {
            const events = await EventStore.getEventByEventIdRefId(payload.eventId, payload.packetId);
            const isCompleted = events.find((e) => e.event === EVENTS.PROPOSAL_TRIP_COMPLETED);
            if (isCompleted) {
                logger.info("In SwitchboardTask - Job already processed", { payload });
                return;
            }

            const isProcessing = events.find((e) => e.event === EVENTS.PROPOSAL_TRIP_PROCESSING);
            if (!isProcessing) {
                await EventStore.addEvent({
                    event: EVENTS.PROPOSAL_TRIP_PROCESSING,
                    eventId: payload.eventId,
                    refId: payload.packetId,
                    network: payload.localChain,
                    data: payload,
                });
            }

            // do the transaction
            const tx = await this.switchBoardService.tripProposal(
                payload.switchboard,
                NETWORK_CONFIG[payload.srcChain as NETWORK].chainId,
                NETWORK_CONFIG[payload.localChain as NETWORK].chainId,
                payload.packetId,
                Number(payload.proposalCount.toString())
            );

            await EventStore.addEvent({
                event: EVENTS.PROPOSAL_TRIP_COMPLETED,
                eventId: payload.eventId,
                refId: payload.packetId,
                network: payload.localChain,
                data: { ...payload, tx },
            });
        } catch (error) {
            logger.error("Error in SwitchboardTask - tripProposal", { payload }, error);
            throw error;
        }
    }
}
