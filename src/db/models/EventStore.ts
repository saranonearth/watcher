import mongoose, { Document, Schema } from "mongoose";
import { NETWORK } from "../../constants/network.js";

export interface IEventStore extends Document {
    event: string;
    eventId: string;
    network: NETWORK;
    data?: any; // arbitary data
}

/**
 * Maintains eventstore of events for audits
 * and reconcilation
 */
const EventStoreSchema: Schema = new Schema(
    {
        event: {
            type: String,
            required: true,
            index: true,
        },
        eventId: {
            type: String,
            required: true,
            unique: true,
        },
        network: {
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

export default mongoose.model<IEventStore>("eventStore", EventStoreSchema);
