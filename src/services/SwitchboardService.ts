import { Service } from "typedi";
import { Wallet } from "@ethersproject/wallet";
import { Contract } from "@ethersproject/contracts";
import { keccak256 } from "@ethersproject/keccak256";
import { defaultAbiCoder } from "@ethersproject/abi";
import { JsonRpcProvider, TransactionResponse } from "@ethersproject/providers";

import { ENV } from "../config/env.js";
import { CHAINID_DATA } from "../constants/network.js";

@Service()
export class SwitchBoardService {
    public async tripProposal(
        switchboard: string,
        srcChain: number,
        localChain: number,
        packetId: string,
        proposalCount: number
    ): Promise<TransactionResponse> {
        const provider = new JsonRpcProvider(CHAINID_DATA[localChain].httpRpc);
        const switchboardContract = this.getSwitchboardContract(switchboard, provider);

        const privateKey = (ENV.PRIVATE_KEY as { [key: number]: string })[localChain];
        const signer = new Wallet(privateKey, provider);

        const nonce = await switchboardContract.nextNonce(signer.address);
        const TRIP_PROPOSAL_SIG_IDENTIFIER = "0x119101cda5c91f869cec4313411657e772bec4c5a184dd6ab7a60859e3d34783"; // keccak256(TRIP_PROPOSAL)
        const message = keccak256(
            defaultAbiCoder.encode(
                ["bytes32", "address", "uint32", "uint32", "uint256", "bytes32", "uint256"],
                [TRIP_PROPOSAL_SIG_IDENTIFIER, switchboard, srcChain, localChain, nonce, packetId, proposalCount]
            )
        );

        const signature = await signer.signMessage(message);
        switchboardContract.connect(signer);
        const params = [nonce, packetId, proposalCount, signature];
        return this.executeTrasnaction(switchboardContract, "tripProposal", params, signer.address, provider);
    }

    private async executeTrasnaction(
        contract: Contract,
        action: string,
        params: any[],
        walletAddress: string,
        provider: JsonRpcProvider
    ) {
        const feeData = await provider.getFeeData();
        const walletNonce = await provider.getTransactionCount(walletAddress);

        const args = {
            type: 2,
            nonce: walletNonce,
            gasLimit: "100000",
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        };

        const tx: TransactionResponse = await contract[action](...params, args);
        return tx;
    }

    private getSwitchboardContract(address: string, provider: JsonRpcProvider) {
        const abi = [
            "function tripProposal(uint256 nonce_, bytes32 packetId_, uint256 proposalCount_, bytes signature_)",
            "function nextNonce(address) view returns (uint256)",
        ];
        return new Contract(address, abi, provider);
    }
}
