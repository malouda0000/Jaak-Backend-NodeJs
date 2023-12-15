import mongoose, { Schema } from 'mongoose'

let messageSchema = new Schema({
    trackingId: {
        type: String
    },
    driverId: {
        type: Schema.Types.ObjectId,
        ref: "Driver",
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    sendBy:{
        type: Number,
        default: 1 // 1 for User, 2 for driver
    },
    verticalType: {
        type: Number,
        default: 0 // 0 for restaurant, 1 for shops, 2 for taxi, 3 shuttle
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: Number,
        default: 1
    },
    date: {
        type: Number,
        default: 0
    },
    status: {
        type: Number,
        default: 0   // 1 for read
    }
},
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    });

let Message = mongoose.model('Message', messageSchema)

export default Message