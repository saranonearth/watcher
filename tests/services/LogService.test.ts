import { SealedEventTopic } from "../../src/constants/events";
import { CONFIG } from "../../src/config/config";
import { NETWORK } from "../../src/constants/network";
import { LogService } from "../../src/services/LogService";
import mongoose from "mongoose";

describe("LogService Integration Tests", () => {
    const logService = new LogService();

    beforeAll(async () => {
        // Connect to the MongoDB testing database
        mongoose.connect("mongodb://localhost:27017");
    });

    afterAll(async () => {
        // Close the MongoDB connection when all tests are finished
        await mongoose.connection.close();
    });

    it("should fetch Sealed logs for a given contract", async () => {
        const network = NETWORK.ARBITRUM;
        const address = CONFIG.socket[42161];
        const topics = [SealedEventTopic];
        const fromBlock = 144781243;
        const toBlock = 144795252;

        const logs = await logService.getLogs(network, address, topics, fromBlock, toBlock);
        expect(logs).toHaveLength(14);
    });

    it("should get chain slug from packet ID", () => {
        const packetId = "0x0000000a1e8253de92f5ad79bd05feea72500d115955431e0000000000000651";

        const chainSlug = logService.getChainSlugFromPacketId(packetId);
        expect(chainSlug).toBe(10);
    });

    it("should get sealed log", async () => {
        const packetId = "00000bb7a9d32248962b8675438d488bbb28974081fd477900000000000005dc";

        const srcChainId = logService.getChainSlugFromPacketId(packetId);
        const sealedLog = await logService.getSealedLog(srcChainId as number, packetId);
        expect(sealedLog).not.toEqual(null);
        expect(sealedLog?.packetId).toEqual(packetId);
    });

    it("should return null if sealed log not found both in DB and on-chain", async () => {
        const packetId = "0x0000a4b158f06b216b41aa562dc6e93a5251ed4303441abe0000000000000d10";

        const srcChainId = logService.getChainSlugFromPacketId(packetId);
        const sealedLog = await logService.getSealedLog(srcChainId as number, packetId);
        expect(sealedLog).toEqual(null);
    });
});
