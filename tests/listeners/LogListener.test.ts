import "reflect-metadata";
import { LogListener } from "../../src/listeners/LogListener";
import { LogService } from "../../src/services/LogService";
import logger from "../../src/utils/logger";
import { NETWORK, NETWORK_CONFIG } from "../../src/constants/network";
import { PacketProposedABI, PacketProposedTopic, SealedEventABI, SealedEventTopic } from "../../src/constants/events";
import { JobQueueService } from "../../src/job/JobQueueService";

// Mocks
jest.mock("../../src/job/JobQueueService");
jest.mock("../../src/services/LogService");
jest.mock("../../src/utils/logger");
describe("LogListener", () => {
    let mockedLogService = new LogService(new JobQueueService());
    let logListener: LogListener;

    beforeEach(() => {
        logListener = new LogListener(mockedLogService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should initialize LogListener", () => {
        logListener.init = jest.fn();

        logListener.start(NETWORK.ARBITRUM, "0x37cc674582049b579571e2ffd890a4d99355f6ba");

        expect(logListener.init).toHaveBeenCalledWith(
            NETWORK_CONFIG[NETWORK.ARBITRUM].wssRpc,
            "0x37cc674582049b579571e2ffd890a4d99355f6ba",
            [
                {
                    type: "sealed",
                    abi: SealedEventABI,
                    topic: SealedEventTopic,
                },
                {
                    type: "packetProposed",
                    abi: PacketProposedABI,
                    topic: PacketProposedTopic,
                },
            ],
            [[SealedEventTopic, PacketProposedTopic]]
        );

        expect(logger.info).toHaveBeenCalledWith("Started LogListener - arbitrum");
    });

    it('should handle an event of type "sealed"', () => {
        logListener.init = jest.fn();
        logListener.start(NETWORK.ARBITRUM, "0x37cc674582049b579571e2ffd890a4d99355f6ba");

        const data = {
            type: "sealed",
            packetId: "12345",
            transmitter: "0xTransmitter",
            batchSize: 10,
            root: "0xRoot",
            signature: "0xSignature",
        };

        mockedLogService.processSealedLog = jest.fn();

        logListener.onEvent(data);

        expect(mockedLogService.processSealedLog).toHaveBeenCalledWith(NETWORK.ARBITRUM, {
            packetId: "12345",
            transmitter: "0xTransmitter",
            batchSize: 10,
            root: "0xRoot",
            signature: "0xSignature",
        });
    });

    it('should handle an event of type "packetProposed"', () => {
        logListener.init = jest.fn();
        logListener.start(NETWORK.ARBITRUM, "0x37cc674582049b579571e2ffd890a4d99355f6ba");

        const data = {
            type: "packetProposed",
            packetId: "67890",
            transmitter: "0xTransmitter",
            proposalCount: 5,
            root: "0xRoot",
            switchboard: "0xSwitchboard",
        };

        mockedLogService.processPacketProposedLog = jest.fn();

        logListener.onEvent(data);

        expect(mockedLogService.processPacketProposedLog).toHaveBeenCalledWith(NETWORK.ARBITRUM, {
            packetId: "67890",
            transmitter: "0xTransmitter",
            proposalCount: 5,
            root: "0xRoot",
            switchboard: "0xSwitchboard",
        });
    });

    it("should handle an unknown event type", () => {
        const data = {
            type: "unknown",
        };

        logListener.onEvent(data);
        expect(logger.error).toHaveBeenCalledWith("In LogListener - onEvent", expect.any(Error));
    });

    it("should handle errors gracefully in onEvent", () => {
        const data = {
            type: "sealed",
            packetId: "12345",
            transmitter: "0xTransmitter",
            batchSize: 10,
            root: "0xRoot",
            signature: "0xSignature",
        };

        mockedLogService.processSealedLog = jest.fn(() => {
            throw new Error("An error occurred");
        });

        logListener.onEvent(data);
        expect(logger.error).toHaveBeenCalledWith("In LogListener - onEvent", expect.any(Error));
    });
});
