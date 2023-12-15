import mongoose, { Schema } from 'mongoose'

let outletSchema = new Schema({
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },
    address: {
        type: String,
        required: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    countryCode: {
        type: String
    },
    phone: {
        type: String
    },
    landMark: {
        type: String,
        default: ''
    },
    location: {
        type: [Number]
    },
    date: {
        type: Number,
        select: false
    },
    status: {
        type: Number,
        default: 1
    }
},
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    });

outletSchema.index({ 'location': "2dsphere" })
let RestaurantOutlet = mongoose.model('RestaurantOutlet', outletSchema)

export default RestaurantOutlet