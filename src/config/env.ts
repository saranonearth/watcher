import dotenv from "dotenv";
dotenv.config();

//@TODO: add validation on app start
export const ENV = {
    appName: process.env.APP_NAME || "socket-watcher", // tripper :)
    port: process.env.PORT || 3003,
    host: process.env.HOST || "127.0.0.1",
    mongoURL: process.env.MONGO_URL || "",
    redisHost: process.env.REDIS_HOST || "localhost",
    redisPort: process.env.REDIS_PORT || 6379,
    RPC: {
        arbitrumHttpRPC: process.env.ARBITRUM_HTTP_RPC || "",
        arbitrumWssRPC: process.env.ARBITRUM_WSS_RPC || "",
        OptimismHttpRPC: process.env.OPTIMISM_HTTP_RPC || "",
        OptimismWssRPC: process.env.OPTIMISM_WSS_RPC || "",
    },
    PRIVATE_KEY: {
        arbitrum: process.env.ARBITRUM_WALLET || "",
        optimism: process.env.OPTIMISM_WALLET || "",
    },
};
