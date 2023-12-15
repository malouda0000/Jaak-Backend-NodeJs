import mongoose, { Schema } from 'mongoose'

let settingSchema = new Schema({
    deliveryFee: {
        type: Number,
        default: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    serviceFee: {
        type: Number,
        default: 0
    },
    deliveryFeeHike: {
        type: Number,
        default: 0
    }
})

let RestaurantSetting = mongoose.model('RestaurantSetting', settingSchema)

export default RestaurantSetting