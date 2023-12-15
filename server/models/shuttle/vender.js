import mongoose, { Schema } from 'mongoose'
import Constant from '../constant'

let userSchema = new Schema({
    geofenceId: { type: Schema.Types.ObjectId, ref: 'geofence',default : null },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        lowercase: true
    },
    countryCode: {
        type: String
    },
    phone: {
        type: String
    },
    emergencyPhone: {
        countryCode: String,
        phone: String
    },
    address: String,
    latitude: Number,
    longitude: Number,
    profilePic: {
        type: String,
        default: ''
    },
    date: {
        type: Number,
        select: false
    },
    status: {
        type: Number,
        default: 1
    },
    hash: { type: String, select: false }
},
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    });


userSchema.path('email').validate((value, done) => {
    if (!value)
        return true;
    let qry = { email: value.toLowerCase() }

    return mongoose.model('Vender').countDocuments(qry).exec().then(function (count) {
        return !count;
    }).catch(function (err) {
        throw err;
    });
}, Constant.EMAILEXISTS)


userSchema.path('phone').validate(function (value, done) {
    if (!value)
        return true;
    let qry = { phone: value, countryCode: this.countryCode }

    return mongoose.model('Vender').countDocuments(qry).exec().then(function (count) {
        return !count;
    }).catch(function (err) {
        throw err;
    });
}, Constant.PHONEEXISTS)


let Vender = mongoose.model('Vender', userSchema)

export default Vender