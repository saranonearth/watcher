import { Queue } from "bullmq";
import { ENV } from "../config/env.js";
import logger from "../utils/logger.js";
import { Service } from "typedi";

@Service()
export class JobQueueService {
    private jobQueue: Queue;

    public async createQueue(): Promise<void> {
        this.jobQueue = new Queue("retry-queue", {
            connection: {
                host: ENV.redisHost,
                port: +ENV.redisPort,
            },
        });
        logger.info("Job Queue Created!");
    }

    /**
     * push job to queue to be processed by worker with retries
     * and exponential backoff
     * @param key arbitary key for job
     * @param msg message
     * @param delay delay in ms
     */
    public async push(key: string, msg: any, delay: number): Promise<void> {
        await this.jobQueue.add(key, msg, {
            delay,
            attempts: 7,
            backoff: {
                type: "exponential",
                delay,
            },
            removeOnComplete: true,
            removeOnFail: true,
        });
    }
}
