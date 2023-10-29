import "reflect-metadata";
import { Container } from "typedi";
import { SwitchBoardService } from "../../src/services/SwitchboardService";

describe("SwitchboardService Integration Tests", () => {
    let switchboardService: SwitchBoardService;
    switchboardService = Container.get(SwitchBoardService);

    it("should return nonce", async () => {
        const switchboardAddress = "0x09A6e77912a6bcFc3abfDfb841A85380Bb2A8B97";
        const packetId = "0x0000000a1e8253de92f5ad79bd05feea72500d115955431e0000000000000651";

        const nonce = await switchboardService.tripProposal(switchboardAddress, 42161, 10, packetId, 0);
        expect(nonce).not.toEqual(100);
    });
});
function keccak256(arg0: any) {
    throw new Error("Function not implemented.");
}
