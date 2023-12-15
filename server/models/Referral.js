const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ReferralModel = new Schema({
    referalName : {
        type : String,
        enum:["merchantToMerchant", "customerToCustomer", "customerToMerchant","merchantToCustomer","driverToCustomer","customerToDriver","driverToDriver", "driverToMerchant", "merchantToDriver"]
    },
    referalType : {
        type : String,
        enum:["FLAT", "PERCENTAGE"]
    },
    language:{ type: String},
    refererDiscount:{
        type: Number,
        default: false
    },
    refererMaximumDiscount:{
        type: Number,
        default: false
    },
    refererDiscription:{
        type: String,
        default: false
    },
    refereeDiscount:{
        type: Number,
        default: false
    },
    refereeMaximumDiscount:{
        type: Number,
        default: false
    },
    refereeDiscription:{
        type: String,
        default: false
    },
    minimumBookingAmount:{
        type: Number,
        default: false
    },
    minimumBookingAmount:{
        type: Number,
        default: false
    },
    isActive: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});

const Referral = mongoose.model('Referral', ReferralModel);
module.exports = Referral;
