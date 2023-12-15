import mongoose, { Schema } from 'mongoose'

let favouriteSchema = new Schema({
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
},
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    });

let FavRestaurant = mongoose.model('FavRestaurant', favouriteSchema)

export default FavRestaurant