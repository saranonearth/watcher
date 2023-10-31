import { Inject, Service } from "typedi";

import { CHAINID_DATA } from "../constants/network.js";
import { CONFIG } from "../config/config.js";
import { LogListener } from "./LogListener.js";
import { Container } from "typedi";

// Loads websocket connections to Socket contracts on repective chains
// to listen for Sealed and PacketProposed logs
@Service()
export class LogListenerLoader {
    constructor() {}
    // can load other chains also here
    public async load() {
        Object.values(CHAINID_DATA).forEach((network) => {
            const container = Container.get(LogListener);
            container.start(network.network, (CONFIG.socket as { [key: number]: string })[network.chainId]);
        });
    }
}
