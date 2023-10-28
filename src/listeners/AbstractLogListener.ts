import { Interface } from "@ethersproject/abi";
import { WebSocketProvider } from "@ethersproject/providers";

export interface IFilter {
    type: string;
    abi: string[];
    topic: string;
}

export abstract class AbstractLogListener {
    constructor() {}
    // on init a listener is set to listen to the eventTopic of a contract
    public init(rpc: string, contractAddress: string, filters: IFilter[], eventTopic: string[][] | string[]) {
        const provider = new WebSocketProvider(rpc);
        provider.on({ address: contractAddress, topics: eventTopic }, (log) => {
            // TODO: handle reorg in srcChain or localChain
            // parse the topics data of the log to readable format
            for (const filter of filters) {
                if (log.topics[0] === filter.topic) {
                    const parser = new Interface(filter.abi);
                    this.onEvent({ ...parser.parseLog(log).args, type: filter.type });
                }
            }
        });
    }

    // abstract function needs to be implemented
    protected abstract onEvent(data: Record<string, any>): void;
}
