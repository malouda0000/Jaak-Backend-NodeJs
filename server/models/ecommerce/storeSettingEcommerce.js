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
    deliveryFeeHike:{
        type: Number,
        default: 0
    }
})

let storeSettingEcommerce = mongoose.model('storeSettingEcommerce', settingSchema)

export default storeSettingEcommerce