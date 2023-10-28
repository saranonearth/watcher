import { ENV } from "../config/env.js";

import winston from "winston";

const { createLogger, format, transports } = winston;

const logger = createLogger({
    level: "info",
    format: format.combine(
        format.colorize(),
        format.timestamp({
            format: "DD-MM-YYYY HH:mm:ss",
        }),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
    ),
    defaultMeta: { service: ENV.appName },
    transports: [
        new transports.Console({
            format: format.combine(format.colorize(), format.simple(), format.timestamp(), format.errors({ stack: true })),
        }),
    ],
});

//TODO: file rotation depending on APM (if required)

export default logger;
