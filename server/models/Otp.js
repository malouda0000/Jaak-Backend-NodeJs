import mongoose, { Schema } from 'mongoose'
let OtpSchema = new Schema({
    otp: {
        type: String
    },
    user: {
        type: String
    },
    userId: { type: mongoose.Types.ObjectId, ref: 'User' },
    phone: {
        type: String
    },
    countryCode: {
        type: String
    }
}, {
    timestamps: true
});
let Otp = mongoose.model('Otp', OtpSchema)

export default Otp
