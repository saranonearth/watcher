import mongoose, { Document, Model, Schema } from "mongoose";
import { NETWORK } from "../../constants/network.js";
import { EVENTS } from "src/types/event.js";

export interface Event {
    event: EVENTS;
    eventId: string;
    refId: string;
    network: NETWORK;
    data?: any; // arbitary data
}

export interface EventStoreDocument extends Event, Document {}

export interface EventStoreModel extends Model<EventStoreDocument> {
    addEvent(event: Event): Promise<EventStoreDocument>;
    getEventByEventIdRefId(eventId: string, refId: string): Promise<EventStoreDocument[]>;
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
        refId: {
            type: String,
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

EventStoreSchema.statics.addEvent = async function (this: Model<EventStoreDocument>, event: Event) {
    return this.create(event);
};

EventStoreSchema.statics.getEventByEventIdRefId = async function (
    this: Model<EventStoreDocument>,
    eventId: string,
    refId: string
) {
    return this.find({ eventId, refId });
};

export default mongoose.model<Event, EventStoreModel>("eventStore", EventStoreSchema);
