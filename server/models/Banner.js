import mongoose, { Schema } from 'mongoose';
import Constant from '../constant';
let BannerSchema = new Schema({
    adminId: {
        type: Schema.ObjectId,
        ref: "admin", default: null
    },
    promoCodeId: {
        type: Schema.ObjectId,
        ref: "PromoCode"
    },
    verticalType: { type: Number, default: 0 },
    name: {
        type: String,
        default: null
    },
    type: String,
    description: {
        type: String,
        default: null
    },
    image: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: Number,
        enum: [0, 1, 2],
        default: 1
    },
    indexAt: { type: Number, default: 0 },
}, {
    timestamps: true
});
let Banner = mongoose.model('Banner', BannerSchema)

export default Banner
