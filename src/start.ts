import { Container, Token } from "typedi";

import { app } from "./index.js";
import { ENV } from "./config/env.js";
import logger from "./utils/logger.js";
import { DBLoader } from "./db/DBLoader.js";
import { JobLoader } from "./job/JobLoader.js";
import { LogListenerLoader } from "./listeners/LogListenerLoader.js";

type LoaderType = LogListenerLoader | DBLoader | JobLoader;

(async () => {
    // loads the containers for reflection via DI
    [DBLoader, JobLoader, LogListenerLoader].forEach(async (loader) => {
        await Container.get(loader as Token<LoaderType>).load();
    });
    app.listen({ port: +ENV.port, host: ENV.host }, (error, address) => {
        if (error != null) {
            logger.error(error);
            process.exit(-1);
        }
        logger.info(`Application started and listening at ${address}`);
    });
})();
