import mongoose, { Schema } from 'mongoose'
let DriverOtpSchema = new Schema({
    otp: {
        type: String
    },
    driver: {
        type: String
    },
    driverId: { type: mongoose.Types.ObjectId, ref: 'Driver' },
    phone: {
        type: String
    },
    countryCode: {
        type: String
    }
}, {
    timestamps: true
});
let DriverOtp = mongoose.model('DriverOtp', DriverOtpSchema)

export default DriverOtp