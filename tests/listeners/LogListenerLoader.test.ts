import "reflect-metadata";
import { LogListenerLoader } from "../../src/listeners/LogListenerLoader";
import { NETWORK } from "../../src/constants/network";
import { CONFIG } from "../../src/config/config";
import { LogListener } from "../../src/listeners/LogListener";
import { JobQueueService } from "../../src/job/JobQueueService";
import { LogService } from "../../src/services/LogService";
import logger from "../../src/utils/logger";

// Mocks
jest.mock("../../src/listeners/LogListener");
jest.mock("../../src/job/JobQueueService");
jest.mock("../../src/services/LogService");
jest.mock("../../src/utils/logger");
describe("LogListenerLoader", () => {
    let logListenerLoader: LogListenerLoader;
    let mockArbitrumListener: LogListener;
    let mockOptimismListener: LogListener;

    beforeEach(() => {
        let mockedLogService = new LogService(new JobQueueService());
        mockArbitrumListener = new LogListener(mockedLogService);
        mockOptimismListener = new LogListener(mockedLogService);
        logListenerLoader = new LogListenerLoader(mockArbitrumListener, mockOptimismListener);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should start listening for OPTIMISM and ARBITRUM logs", async () => {
        // Mock the start method of LogListener instances
        mockArbitrumListener.start = jest.fn();
        mockOptimismListener.start = jest.fn();

        await logListenerLoader.load();

        // Expect the start method to be called with the correct parameters
        expect(mockArbitrumListener.start).toHaveBeenCalledWith(NETWORK.ARBITRUM, CONFIG.socket[42161]);
        expect(mockOptimismListener.start).toHaveBeenCalledWith(NETWORK.OPTIMISM, CONFIG.socket[10]);
    });
});
