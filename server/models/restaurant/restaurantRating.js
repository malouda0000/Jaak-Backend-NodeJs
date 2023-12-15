import mongoose, { Schema } from 'mongoose'

let ratingSchema = new Schema({
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    orderId: {
        type: Schema.Types.ObjectId,
        ref: "RestaurantOrder",
        required: true
    },
    review: {
        type: String
    },
    rating: {
        type: Number,
        required: true
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

let RestaurantRating = mongoose.model('RestaurantRating', ratingSchema)

export default RestaurantRating