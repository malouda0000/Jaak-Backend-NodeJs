import mongoose, { Schema } from 'mongoose'
const AutoIncrement = require('mongoose-sequence')(mongoose);

let orderSchema = new Schema({
    orderNo: {
        type: Number
    },
    numberOfRetry: {
        type: Number,default:1
    },
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    outletId: {
        type: Schema.Types.ObjectId,
        ref: "RestaurantOutlet",
        required: true
    },
    driverId: {
        type: Schema.Types.ObjectId,
        ref: "Driver"
    },
    address: {
        address: String,
        latitude: Number,
        longitude: Number,
        zipcode: String
    },
    items: [{
        itemId: { type: Schema.Types.ObjectId, ref: 'FoodItem' },
        quantity: Number,
        amount: Number,
        totalAmount: Number,
        addOn: [{
            addOnId: { type: Schema.Types.ObjectId, ref: 'AddOns' },
            amount: Number,
            name: String,
        }],
    }],
    note: String,
    couponCode: String,
    verticalType: {
        type: Number,
        default: 0 // 0 for restaurant, 1 for shops, 2 for taxi, 3 shuttle
    },
    couponDiscount: String,
    deliveryFee: {
        type: Number,
        default: 0
    },
    serviceFee: {
        type: Number,
        default: 0
    },
    distance: {
        type: Number,
        default: 0
    },
    totalDiscount: {
        type: Number,
        default: 0
    },
    subTotalAmount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    preprationTime: {
        type: Number,
        default: 30
    },
    tax: {
        type: Number,
        default: 0
    },
    path: {
        type: String,
        default: ''
    },
    paymentMode: {
        type: String,
        default: 'Cash'
    },
    currency: {
        type: String
    },
    transactionId: String,
    date: {
        type: Number
    },
    deliveryDate: {
        type: Number,
        default: 0
    },
    userRating: {
        type: Number,
        default: 0
    },
    restaurantRating: {
        type: Number,
        default: 0
    },
    driverRating: {
        type: Number,
        default: 0
    },
    orderType: {
        type: Number,
        default: 0 // 0 for delivery and 1 for self pickup
    },
    status: {
        type: Number,
        default: 0 // 0 pending, 1 accept, 2 for reached/prepared, 3 pickup, 4 delivered, 5 rate, 6 skip, 11 cancel By user,12 cancel By restaurant
    }
},
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    });

orderSchema.plugin(AutoIncrement, { inc_field: 'orderNo', start_seq: 1000 });

let RestaurantOrder = mongoose.model('RestaurantOrder', orderSchema)

export default RestaurantOrder