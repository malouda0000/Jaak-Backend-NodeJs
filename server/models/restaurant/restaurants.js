import mongoose, { Schema } from 'mongoose'
import Constant from '../../constant'
import crypto from 'crypto';

let restaurantSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    name_ar: {
        type: String,
        // required: true
    },
    email: {
        type: String,
        lowercase: true
    },
    description: {
        type: String
    },
    categories: [{
        type: Schema.Types.ObjectId,
        ref: "FoodCategory",
        required: true
    }],
    image: {
        type: String,
        required: true
    },
    currency: {
        type: String,
    },
    foodType: {
        type: Number,
        default: 2 // 0 for veg, 1 for non-veg, 2 for both
    },
    discount: {
        type: Number,
        default: 0 // discount in percentage
    },
    discountUpto: {
        type: Number,
        default: 0 // discount in percentage
    },
    minOrderAmount: {
        type: Number,
        default: 0 // discount in percentage
    },
    isRecommended: {
        type: Number,
        default: 0 // discount in percentage
    },
    avgDeliveryTime: {
        type: Number,
        default: 30
    },
    avgOrderPrice: {
        type: Number,
        default: 10
    },
    date: {
        type: Number,
        select: false
    },
    isFavourite: {
        type: Number,
        default: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    openTime: {
        type: String,
        default: "10:00"
    },
    closeTime: {
        type: String,
        default: "20:00"
    },
    resetPasswordToken: String,
    resetPasswordExpires: String,
    status: {
        type: Number,
        default: 1, // 0 for disable, 2 for delete
        select: false
    },
    hash: { type: String, select: false },
},
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    });


restaurantSchema.path('name').validate((value, done) => {

    let qry = { name: new RegExp('^' + value + '$', "i"), status: { $ne: 2 } }

    return mongoose.model('Restaurant').countDocuments(qry).exec().then(function (count) {
        return !count;
    }).catch(function (err) {
        throw err;
    });
}, Constant.RESTAURANTEXISTS)

restaurantSchema.path('email').validate((value, done) => {
    if (!value)
        return true;
    let qry = { email: value }

    return mongoose.model('Restaurant').countDocuments(qry).exec().then(function (count) {
        return !count;
    }).catch(function (err) {
        throw err;
    });
}, Constant.EMAILEXISTS)


restaurantSchema.methods.generatePasswordReset = function () {
    this.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordExpires = Date.now() + 360000000; //expires in an hour

};

let Restaurant = mongoose.model('Restaurant', restaurantSchema)

export default Restaurant