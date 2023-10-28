import { TripPorposalJob } from "../types/index.js";
import logger from "../utils/logger.js";
import { Service } from "typedi";

@Service()
export class SwitchboardTask {
    public async tripProposal(msg: TripPorposalJob) {
        logger.info("Process Trip Proposal", { msg });
    }
}
