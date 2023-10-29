import { Service } from "typedi";
import { Wallet } from "@ethersproject/wallet";
import { arrayify } from "@ethersproject/bytes";
import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";
import { keccak256 } from "@ethersproject/keccak256";
import { defaultAbiCoder } from "@ethersproject/abi";
import { JsonRpcProvider, TransactionReceipt, TransactionResponse } from "@ethersproject/providers";

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
    ): Promise<TransactionReceipt> {
        const provider = new JsonRpcProvider(CHAINID_DATA[localChain].httpRpc);
        const privateKey = (ENV.PRIVATE_KEY as { [key: number]: string })[localChain];
        const signer = new Wallet(privateKey, provider);

        const switchboardContract = this.getSwitchboardContract(switchboard, signer);
        const nonce = ((await switchboardContract.nextNonce(signer.address)) as BigNumber).toNumber();

        // keccak256(TRIP_PROPOSAL)
        const TRIP_PROPOSAL_SIG_IDENTIFIER = "0x119101cda5c91f869cec4313411657e772bec4c5a184dd6ab7a60859e3d34783";
        const message = keccak256(
            defaultAbiCoder.encode(
                ["bytes32", "address", "uint32", "uint32", "uint256", "bytes32", "uint256"],
                [TRIP_PROPOSAL_SIG_IDENTIFIER, switchboard, srcChain, localChain, nonce, packetId, proposalCount]
            )
        );
        const signature = await signer.signMessage(arrayify(message));

        const params = [nonce, packetId, proposalCount, signature];
        return this.executeTrasnaction(switchboardContract, "tripProposal", params, signer.address, provider);
    }

    /**
     *
     * @param contract Contract instance with signer attached
     * @param action method to be called
     * @param params function params []
     * @param walletAddress wallet address of signer
     * @param provider provider/signer
     * @returns
     */
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
        return await tx.wait(2);
    }

    private getSwitchboardContract(address: string, provider: Wallet) {
        const abi = [
            "function tripProposal(uint256 nonce_, bytes32 packetId_, uint256 proposalCount_, bytes signature_)",
            "function nextNonce(address) view returns (uint256)",
        ];
        return new Contract(address, abi, provider);
    }
}
