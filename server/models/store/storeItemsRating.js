import mongoose, { Schema } from 'mongoose'

let storeItemsRatingSchema = new Schema({
    items: [{
        itemId: { type: mongoose.Types.ObjectId, ref: 'StoreItem' }, //_id of variant
        rating: { type: Number, default: 0 },
        review: { type: String, default: "" }
    }],
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
    // review: {
    //     type: String
    // },
    // rating: {
    //     type: Number,
    //     required: false
    // },
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

let storeItemsRating = mongoose.model('storeItemsRating', storeItemsRatingSchema)

export default storeItemsRating