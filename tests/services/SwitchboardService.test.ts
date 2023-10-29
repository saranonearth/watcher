import "reflect-metadata";
import { Container } from "typedi";

import { SwitchBoardService } from "../../src/services/SwitchboardService";
import { NETWORK, NETWORK_CONFIG } from "../../src/constants/network";

describe("SwitchboardService Integration Tests", () => {
    let switchboardService: SwitchBoardService;

    beforeAll(() => {
        switchboardService = Container.get(SwitchBoardService);
    });

    it("should make tripProposal in arbitrum", async () => {
        const switchboardAddress = "0xd5e829827F665c42326EAF68Da3360bd59b42f2f";
        const packetId = "0x0000000a1e8253de92f5ad79bd05feea72500d115955431e0000000000000651";
        const proposalCount = 3;
        const srcChain = NETWORK_CONFIG[NETWORK.OPTIMISM].chainId;
        const localChain = NETWORK_CONFIG[NETWORK.ARBITRUM].chainId;

        const txReceipt = await switchboardService.tripProposal(
            switchboardAddress,
            srcChain,
            localChain,
            packetId,
            proposalCount
        );
        expect(txReceipt).not.toEqual(null);
        expect(txReceipt?.blockHash).not.toEqual(null);
        expect(txReceipt?.blockHash).not.toEqual(null);
    }, 30000);
});
