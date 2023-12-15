import mongoose, { Schema } from 'mongoose'

let ratingSchema = new Schema({
    storeId: {
        type: Schema.Types.ObjectId,
        ref: "Store",
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    orderId: {
        type: Schema.Types.ObjectId,
        ref: "StoreOrder",
        required: true
    },
    review: {
        type: String
    },
    rating: {
        type: Number,
        required: false
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

let StoreRating = mongoose.model('StoreRating', ratingSchema)

export default StoreRating