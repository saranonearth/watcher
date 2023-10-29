import { Service } from "typedi";
import mongoose, { Mongoose } from "mongoose";

import { ENV } from "../config/env.js";
import logger from "../utils/logger.js";

@Service()
export class DBLoader {
    public database: Mongoose;
    constructor() {
        this.database = new Mongoose();
    }
    public async load() {
        try {
            if (this.database.connection.readyState === 1 || this.database.connection.readyState === 2) {
                return;
            }
            this.database = await mongoose.connect(ENV.mongoURL);
            logger.info("Database Started!");
        } catch (error) {
            logger.error("Error while connecting to MongoDB", error);
            process.exit(1);
        }
    }
}
