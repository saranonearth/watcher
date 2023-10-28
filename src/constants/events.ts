// keccak256 of PacketProposed(address,bytes32,uint256,bytes32,address)
export const PacketProposedTopic = "0x4b8e305abfc214d75df6e3d0b37dc1b2e6e93726d472df847f312d190dcf8704";

// keccak256 of Sealed(address,bytes32,uint256,bytes32,bytes)
export const SealedEventTopic = "0x4bf575a0e4ff12a13816954b1ce8b1e53f30e121ea4f107ac086ec29da524abe";

// event PacketProposed ABI
export const PacketProposedABI = [
    "event PacketProposed(address indexed transmitter, bytes32 indexed packetId, uint256 proposalCount, bytes32 root, address switchboard)",
];

// event Sealed ABI
export const SealedEventABI = [
    "event Sealed(address indexed transmitter, bytes32 indexed packetId, uint256 batchSize, bytes32 root, bytes signature)",
];
