import { Container, Service } from "typedi";
import { Job, Worker } from "bullmq";

import { ENV } from "../config/env.js";
import logger from "../utils/logger.js";
import { SwitchboardTask } from "../tasks/SwitchboardTask.js";

export enum JobKey {
    TRIP_PROPOSAL = "trip_proporal",
}

@Service()
export class JobWorkerService {
    private jobWorker: Worker;

    public async createWorker(): Promise<void> {
        this.jobWorker = new Worker(
            JobKey.TRIP_PROPOSAL,
            async (job: Job) => {
                await this.processJob(job.id as string, job.name, job.data, job);
            },
            {
                connection: {
                    host: ENV.redisHost,
                    port: +ENV.redisPort,
                },
                concurrency: 5,
            }
        );
        logger.info("Job Worker Created!");
    }

    public async close(): Promise<void> {
        await this.jobWorker.close();
    }

    private async processJob(jobId: string, key: string, msg: any, job: Job): Promise<void> {
        logger.info("In JobWorker - processJob", { jobId, msg });
        switch (key) {
            case JobKey.TRIP_PROPOSAL:
                await Container.get(SwitchboardTask).tripProposal(msg);
                break;
            default:
                logger.error("Unable to resolve a task", { msg, jobId });
        }
    }
}
