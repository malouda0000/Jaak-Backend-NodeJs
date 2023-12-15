import mongoose, { Schema } from "mongoose";
const AutoIncrement = require('mongoose-sequence')(mongoose)

let tripSchema = new Schema({
    tripNo: {
        type: Number
    },
    name: {
        type: String,
        required: true
    },
    startPoint: {
        type: Schema.Types.ObjectId,
        ref: "Location",
        required: true,
    },
    stopPoints: [
        {
            coordinates: {
                type: Schema.Types.ObjectId,
                ref: "Location",
            },
            time: {
                type: String
            },
            reachedTime: {
                type: Number
            },
            leaveTime: {
                type: Number
            },
            status: {
                type: Number,
                default: 0
            },
            fare: {
                type: Number,
                default: 0
            }
        },
    ],
    rideDate: String,
    onGoingIndex: { type: Number, default: 0 },
    path: { type: String, default: '' },
    endPoint: {
        type: Schema.Types.ObjectId,
        ref: "Location",
        required: true,
    },
    startDateTime: {
        type: Number,
        required: true,
    },
    endDateTime: {
        type: Number,
        required: true,
        default: 0
    },
    routeId: {
        type: Schema.Types.ObjectId,
        ref: "ShuttleRoute",
        required: true,
    },
    shuttleId: {
        type: Schema.Types.ObjectId,
        ref: "Shuttle",
        required: true,
    },
    driver: {
        type: Schema.Types.ObjectId,
        ref: "Driver",
        required: true,
    },
    startTime: {
        type: String,
        required: true,
    },
    endTime: {
        type: String,
        required: true,
    },
    status: {
        type: Number,
        default: 1
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    date: {
        type: Number
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

tripSchema.plugin(AutoIncrement, { inc_field: 'tripNo', start_seq: 1000 })
let RouteTrip = mongoose.model("RouteTrip", tripSchema);

export default RouteTrip;