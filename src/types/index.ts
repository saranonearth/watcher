import { BigNumberish } from "@ethersproject/bignumber";
import { NETWORK } from "../constants/network.js";

export type NetworkConfig = {
    chainId: number;
    network: NETWORK;
    httpRpc: string;
    wssRpc: string;
};
export interface LogFields {
    type?: string;
    removed?: boolean;
}
export interface ISealedLog extends LogFields {
    transmitter: string;
    packetId: string;
    batchSize: BigNumberish;
    root: string;
    signature: string;
}

export interface IPacketProposedLog extends LogFields {
    transmitter: string;
    packetId: string;
    proposalCount: BigNumberish;
    root: string;
    switchboard: string;
}

export interface TripPorposalJob {
    eventId: string;
    sealedTransmitter?: string;
    proposedTransmitter: string;
    srcChain?: NETWORK;
    localChain: NETWORK;
    packetId: string;
    switchboard: string;
    root: string;
    proposalCount: BigNumberish;
}
