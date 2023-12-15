import mongoose, { Schema } from 'mongoose'
let preference = new Schema({
    currency: {
        type: String,
        default: ""
    },
    currencyFormatting: {
        type: String,
        default: ""
    },
    timezone: {
        type: String,
        default : ""
    },
    timeFormat: {
        type: String,
        enum: ['12h', '24h']
    },
    dateFormat: {
        type: String,
        default: ""
    },
    isServiceShare: {
        type: Boolean,
        default: false
    },
    isServiceAddressConfirmed: {
        type: Boolean,
        default: false
    },
    isAerialDistance: {
        type: Boolean,
        default: false
    },
    isFavouriteSalon: {
        type: Boolean,
        default: false
    },
    isAutoRefund: {
        type: Boolean,
        default: false
    },
    isPickupNotification: {
        type: Boolean,
        default: false
    },
    isOrderReadyStatus: {
        type: Boolean,
        default: false
    },
    distanceUnit: {
        type: String,
        enum: ["km", "mile", "meter"]
    },
    isConfigureCity: {
        type: Boolean,
        default: false
    },
    isShowCommission : { 
        type: Boolean,
        default: false
    },
    isCustomerRating: {
        type: Boolean,
        default: false
    },
    hideCutomerDetail : { 
        type: Boolean,
        default: false
    },
    showCustomerProfile: {
        type: Boolean,
        default: false
    },
    showCurrency: {
        type: Boolean,
        default: false
    },
    showGeofenceWithWalkInBooking: {
        type: Boolean,
        default: false
    },
    showGeofenceWithoutWalkInBooking: {
        type: Boolean,
        default: false
    },
    serverRadius: {
        type: Boolean,
        default: false
    },
    userTags: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

let Preference = mongoose.model('Preference', preference)

export default Preference
