import mongoose, { Document, Model, Schema } from "mongoose";
import { NETWORK } from "../../constants/network.js";

export interface Log {
    log: string;
    logId: string;
    network: NETWORK;
    packetId: string;
    data: any; // arbitary data
}

export interface LogDocument extends Log, Document {}

export interface LogModel extends Model<LogDocument> {
    addLog(log: Log): Promise<LogDocument>;
    getSealedLogFromPacketId(packetId: string): Promise<LogDocument>;
}

const LogSchema: Schema = new Schema(
    {
        log: {
            type: String,
            required: true,
        },
        logId: {
            type: String,
            required: true,
            unique: true,
        },
        network: {
            type: String,
            required: true,
            index: true,
        },
        packetId: {
            type: String,
            required: true,
        },
        data: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);
// @TODO: add a index for expiry of 30days depending on use case
// mostly its a hot data so we can remove it after sometime
// LogSchema.index({createdAt: 1}, {expireAfterSeconds: 604800});

LogSchema.statics.addLog = async function (this: Model<LogDocument>, log: Log) {
    return this.create(log);
};

LogSchema.statics.getSealedLogFromPacketId = async function (this: Model<LogDocument>, packetId: string) {
    return this.findOne({ log: "log.sealed", packetId });
};

export default mongoose.model<LogDocument, LogModel>("logs", LogSchema);
