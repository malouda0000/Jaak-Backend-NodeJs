import { METHODS } from 'http';
import mongoose, { Schema } from 'mongoose'

const adminPricesSchema = new Schema({
    min_fare : { type : Number },
    max_fare : { type : Number },
    per_min_charges : { type : Number },
    zero_five : { type : Number },
    five_ten : { type : Number },
    ten_fifteen : { type : Number },
    fifteen_twenty : { type : Number },
    twenty_thirty : { type : Number },
    thirty_fifty : { type : Number },
    fifty_sixty : { type : Number },
});

const driverPayoutPrices = new Schema({
    min_distance : { type : Number },
    max_fare : { type : Number },
    per_min_charges : { type : Number },
    zero_five : { type : Number },
    five_ten : { type : Number },
    ten_fifteen : { type : Number },
    fifteen_twenty : { type : Number },
    twenty_thirty : { type : Number },
    thirty_fifty : { type : Number },
    fifty_sixty : { type : Number },
});

let adminSettingSchema = new Schema({

    deliveryPrices : {
        type : adminPricesSchema
    },
    driverPayout : {
        type : driverPayoutPrices
    },
    senderId: {
        type: String,
        default: ""
    },
    adminId: {
        type: Schema.Types.ObjectId,
        ref: "Admin",
    },
    driverPerKmCharge: {
        type: Number,
        default: 0
    },
},
    { timestamps: true }
); 


let AdminSetting = mongoose.model('AdminSetting', adminSettingSchema)

export default AdminSetting