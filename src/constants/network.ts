import { ENV } from "../config/env.js";
import { NetworkConfig } from "../types/index.js";

export enum NETWORK {
    ARBITRUM = "arbitrum",
    OPTIMISM = "optimism",
}

const ARBITRUM: NetworkConfig = {
    chainId: 42161,
    network: NETWORK.ARBITRUM,
    httpRpc: ENV.RPC.arbitrumHttpRPC,
    wssRpc: ENV.RPC.arbitrumWssRPC,
};

export const OPTIMISM = {
    chainId: 10,
    network: NETWORK.OPTIMISM,
    httpRpc: ENV.RPC.OptimismHttpRPC,
    wssRpc: ENV.RPC.OptimismWssRPC,
} as NetworkConfig;

export const NETWORK_CONFIG: Record<NetworkConfig["network"], NetworkConfig> = {
    [NETWORK.ARBITRUM]: ARBITRUM,
    [NETWORK.OPTIMISM]: OPTIMISM,
};

export const CHAINID_DATA: Record<NetworkConfig["chainId"], NetworkConfig> = {
    42161: ARBITRUM,
    10: OPTIMISM,
};

export const WATCHER_APPLICATION_SUPPORTED_NETWORKS = [10, 42161]; // add as and when other networks are configured
export const SOCKET_SUPPORTED_NETWORKS = [10, 56, 137, 2999, 42161, 421613, 1399904803];
