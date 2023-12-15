import mongoose, { Schema } from "mongoose";
const AutoIncrement = require('mongoose-sequence')(mongoose)

let shuttleBookingSchema = new Schema({
  shuttleOrderNo: {
    type: Number
  },
  geofenceId: { type: Schema.Types.ObjectId, ref: 'geofence',default : null },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User"
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
  bookingType: {
    type: Number,
    default: 0
  },
  note: String,
  couponCode: String,
  verticalType: {
    type: Number,
    default: 3 // 0 for restaurant, 1 for shops, 2 for taxi, 3 shuttle
  },
  couponDiscount: String,
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
  shuttleId: {
    type: Schema.Types.ObjectId,
    ref: "Shuttle",
    required: true,
  },
  driverId: {
    type: Schema.Types.ObjectId,
    ref: "Driver",
    required: true,
  },
  vehicleTypeId: {
    type: Schema.Types.ObjectId,
    ref: "VehicleType",
    required: true,
  },
  shuttleRouteId: {
    type: Schema.Types.ObjectId,
    ref: "ShuttleRoute",
    required: true,
  },
  tripId: {
    type: Schema.Types.ObjectId,
    ref: "RouteTrip"
  },
  source: {
    type: Schema.Types.ObjectId,
    ref: "Location",
    required: true,
  },
  destination: {
    type: Schema.Types.ObjectId,
    ref: "Location",
    required: true,
  },
  bookingFor: {
    type: Number,
    required: true,
  },
  seatNumber: [Number],
  bookingDate: {
    type: String,
    required: true
  },
  tripTime: {
    type: String
  },
  shuttleType: {
    type: String
  },
  startDateTime: Number,
  /** index 0 for start location and destination index according to stop points length +2 */
  sourceIndex: {
    type: Number,
    default: 0
  },
  destinationIndex: {
    type: Number,
  },
  bookingStartTime: {
    type: Number,
    required: true
  },
  bookingEndTime: {
    type: Number,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  date: Number,
  status: {
    type: Number,
    default: 0    // 0 for payment pending, 1 for paymentDone
  }
}, {
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});

shuttleBookingSchema.plugin(AutoIncrement, { inc_field: 'shuttleOrderNo', start_seq: 1000 })

let ShuttleBooking = mongoose.model("ShuttleBooking", shuttleBookingSchema);

export default ShuttleBooking;
