import { Inject, Service } from "typedi";

import logger from "../utils/logger.js";
import { JobQueueService } from "./JobQueueService.js";
import { JobWorkerService } from "./JobWorkerService.js";

@Service()
export class JobLoader {
    constructor(@Inject() private jobQueueService: JobQueueService, @Inject() private jobWorkerService: JobWorkerService) {}
    public load() {
        this.jobQueueService.createQueue().catch((error) => {
            logger.error("Error while creating job queue", error);
        });

        this.jobWorkerService.createWorker().catch((error) => {
            logger.error("Error while creating job worker", error);
        });
    }
}
