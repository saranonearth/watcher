import "reflect-metadata";
import { LogListenerLoader } from "../../src/listeners/LogListenerLoader";
import { NETWORK } from "../../src/constants/network";
import { CONFIG } from "../../src/config/config";
import { LogListener } from "../../src/listeners/LogListener";
import { JobQueueService } from "../../src/job/JobQueueService";
import { LogService } from "../../src/services/LogService";
import logger from "../../src/utils/logger";
import { Container } from "typedi";

// Mock the values of CHAINID_DATA and CONFIG.socket
const mockChainData = {
    42161: {
        chainId: 42161,
        network: "arbitrum",
        httpRpc: "",
        wssRpc: "",
    },
    10: {
        chainId: 10,
        network: "optimism",
        httpRpc: "",
        wssRpc: "",
    },
};

const mockSocketConfig = {
    socket: {
        42161: "0x37cc674582049b579571e2ffd890a4d99355f6ba",
        10: "0x301bD265F0b3C16A58CbDb886Ad87842E3A1c0a4",
    },
};

jest.mock("../../src/constants/network", () => ({
    CHAINID_DATA: mockChainData,
}));
jest.mock("../../src/config/config", () => ({
    CONFIG: {
        socket: mockSocketConfig,
    },
}));
describe("LogListenerLoader", () => {
    it("should call LogListener.start for each network", async () => {
        const mockLogListener = {
            start: jest.fn(),
        };

        const mockContainerGet = jest.spyOn(Container, "get");
        mockContainerGet.mockReturnValue(mockLogListener);

        const logListenerLoader = new LogListenerLoader();
        await logListenerLoader.load();

        Object.values(mockChainData).forEach((network) => {
            console.log(network);
            expect(mockContainerGet).toHaveBeenCalledWith(LogListener);
            expect(mockLogListener.start).toHaveBeenCalledWith(
                network.network,
                (mockSocketConfig.socket as { [key: number]: string })[network.chainId]
            );
        });
        mockContainerGet.mockRestore();
    });
});
