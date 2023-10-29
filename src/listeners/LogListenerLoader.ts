import { Inject, Service } from "typedi";

import { NETWORK } from "../constants/network.js";
import { CONFIG } from "../config/config.js";
import { LogListener } from "./LogListener.js";

// Loads websocket connections to Socket contracts on repective chains
// to listen for Sealed and PacketProposed logs
@Service()
export class LogListenerLoader {
    constructor(@Inject() private arbitrumListener: LogListener, @Inject() private OptimismListener: LogListener) {}
    // can load other chains also here
    public async load() {
        // listen for OPTIMISM logs
        this.OptimismListener.start(NETWORK.OPTIMISM, CONFIG.socket[10]);

        // // listen for ARBITRUM logs
        this.arbitrumListener.start(NETWORK.ARBITRUM, CONFIG.socket[42161]);
    }
}
