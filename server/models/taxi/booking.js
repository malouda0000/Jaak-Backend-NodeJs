import mongoose, { Schema } from 'mongoose'
const AutoIncrement = require('mongoose-sequence')(mongoose)

let bookingSchema = new Schema(
  {
    geofenceId: { type: Schema.Types.ObjectId, ref: 'geofence',default : null },
    taxiOrderNo: {
      type: Number
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver'
    },
    userFirstName: {
      type: String,
      required: true
    },
    userLastName: {
      type: String
    },
    countryCode: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    source: {
      address: String,
      latitude: Number,
      longitude: Number,
      cordinates: [Number]
    },
    destination: {
      address: String,
      latitude: Number,
      longitude: Number,
      cordinates: [Number]
    },
    seats: {
      type: Number,
      default: 1
    },
    bookingType: {
      type: Number,
      default: 0
    },
    note: String,
    couponCode: String,
    verticalType: {
      type: Number,
      default: 2 // 0 for restaurant, 1 for shops, 2 for taxi, 3 shuttle
    },
    couponDiscount: String,
    distance: {
      type: Number,
      default: 0
    },
    driverReachTime: {
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
    tax: {
      type: Number,
      default: 0
    },
    paymentMode: {
      type: String,
      default: 'Cash'
    },
    currency: {
      type: String,
  },
    transactionId: String,
    path: {
      type: String,
      default: ''
    },
    date: {
      type: Number
    },
    bookingStartDate: {
      type: Number,
      default: 0
    },
    bookingEndDate: {
      type: Number,
      default: 0
    },
    userRating: {
      type: Number,
      default: 0
    },
    driverRating: {
      type: Number,
      default: 0
    },
    status: {
      type: Number,
      default: 0 // 0 on the way, 1 reached, 2 start, 3 completed, 4 paid, 5 rate, 6 skip, 11 cancel By user,12 cancel By driver
    }
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
)

bookingSchema.plugin(AutoIncrement, { inc_field: 'taxiOrderNo', start_seq: 1000 })

let TaxiBooking = mongoose.model('TaxiBooking', bookingSchema)

export default TaxiBooking
