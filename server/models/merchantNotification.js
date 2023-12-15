const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const MerchantNotificationModel = new Schema({
    notificationSound : {
        type : String
    },
    booking_placed:{
        isSms : {type: Boolean, default: false},
        isEmail : {type: Boolean, default: false},
        isNotification : {type: Boolean, default: false},
    },
    booking_cancelled:{
        isSms : {type: Boolean, default: false},
        isEmail : {type: Boolean, default: false},
        isNotification : {type: Boolean, default: false},
    },
    payment_done:{
        isSms : {type: Boolean, default: false},
        isEmail : {type: Boolean, default: false},
        isNotification : {type: Boolean, default: false},
    },
    schedule_booking_reminder:{
        isSms : {type: Boolean, default: false},
        isEmail : {type: Boolean, default: false},
        isNotification : {type: Boolean, default: false},
    },
    new_signup:{
        isSms : {type: Boolean, default: false},
        isEmail : {type: Boolean, default: false},
        isNotification : {type: Boolean, default: false},
    },
    add_store_form_dashboard:{
        isSms : {type: Boolean, default: false},
        isEmail : {type: Boolean, default: false},
        isNotification : {type: Boolean, default: false},
    },
    forgot_password:{
        isSms : {type: Boolean, default: false},
        isEmail : {type: Boolean, default: false},
        isNotification : {type: Boolean, default: false},
    },
    booking_reminder:{
        isSms : {type: Boolean, default: false},
        isEmail : {type: Boolean, default: false},
        isNotification : {type: Boolean, default: false},
    },
    merchant_commission_invoice:{
        isSms : {type: Boolean, default: false},
        isEmail : {type: Boolean, default: false},
        isNotification : {type: Boolean, default: false},
    },
    Booking_wallet_failed:{
        isSms : {type: Boolean, default: false},
        isEmail : {type: Boolean, default: false},
        isNotification : {type: Boolean, default: false},
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

const MerchantNotification = mongoose.model('MerchantNotification', MerchantNotificationModel);
module.exports = MerchantNotification;
