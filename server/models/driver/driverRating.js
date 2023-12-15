import mongoose, { Schema } from 'mongoose'

let ratingSchema = new Schema({
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
    orderId: {
        type: Schema.Types.ObjectId
    },
    verticalType: {
        type: Number,
        default: 0
    },
    review: {
        type: String
    },
    rating: {
        type: Number,
        required: false
    },
    likedPoints: {
        type: Array,
        default: []
    },
    date: {
        type: Number,
        select: false
    }
},
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    });

let DriverRating = mongoose.model('DriverRating', ratingSchema)

export default DriverRating