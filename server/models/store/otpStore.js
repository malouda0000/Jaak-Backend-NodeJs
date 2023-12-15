const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const OtpModel = new Schema({
    code: {
        type: String,
        default: "",
        trim: true
    },
    phone: {
        type: String,
        trim: true,
        default: ''
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        default: ''
    },
    countryCode: {
        type: String,
        trim: true,
    },
    expiredAt: {
        type: Date,
        default: new Date()
    },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store' }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
const Otp = mongoose.model('storeOtp', OtpModel);
module.exports = Otp;