import { stubFalse } from "lodash";
import mongoose, {
  Schema
} from "mongoose";
const AutoIncrement = require("mongoose-sequence")(mongoose);

const recuringSchema = new Schema({
  recuringType: {
    type: String,
    enum: ['SEVENDAYS', 'ALTERNATEDAYS', 'EVERYWEEK', 'EVERY3RDDAY', 'MONTHLY']
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
});

const deliverySchema = new Schema({
  onDate: {
    type: Date
  },
});
const driveThruSchema = new Schema({
  onDate: {
    type: Date
  },
});
const takeawaySchema = new Schema({
  onDate: {
    type: Date
  },
});

let orderSchemaEcommerce = new Schema({
  geofenceId: {
    type: Schema.Types.ObjectId,
    ref: 'geofence',
    default: null
  },
  scheduleType: {
    type: String,
    enum: ['RECURING', 'DELIVERY', 'INSTANT', 'DRIVETHRU', 'DINEIN', 'SCHEDULE'],
  },
  isTakeAway : {
    type : Boolean,
    default : false
  },
  recuringCriteria: {
    type: recuringSchema
  },
  deliveryCriteria: {
    type: deliverySchema
  },
  drivaThruCriteria: {
    type: driveThruSchema
  },
  takeawayCriteria: {
    type: takeawaySchema
  },
  orderNo: {
    type: Number,
  },
  // numberOfRetry: {
  //     type: Number, default: 1
  // },
  storeId: {
    type: Schema.Types.ObjectId,
    ref: "storeEcommerce",
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  r_payment_id: String,
  outletId: {
    type: Schema.Types.ObjectId,
    ref: "storeOutletsEcommerce",
    required: true,
  },
  driverId: {
    type: Schema.Types.ObjectId,
    ref: "Driver",
  },
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: "employee",
  },
  address: {
    address: String,
    latitude: Number,
    longitude: Number,
    zipcode: String,
  },
  items: [{
    itemId: {
      type: mongoose.Types.ObjectId,
      ref: "storeItemsEcommerce"
    }, //_id of variant
    quantity: Number,
    amount: Number,
    totalAmount: Number,
  }, ],
  note: String,
  prescription: [String],
  couponCode: String,
  couponDiscount: String,
  preprationTime: {
    type: Number,
    default: 30,
  },
  deliveryFee: {
    type: Number,
    default: 0,
  },
  serviceFee: {
    type: Number,
    default: 0,
  },
  totalDiscount: {
    type: Number,
    default: 0,
  },
  subTotalAmount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
  totalTax: {
    type: Number,
    default: 0,
  },
  path: {
    type: String,
    default: "",
  },
  packingCharge: {
    type: Number,
    default: 0,
  },
  paymentMode: {
    type: String,
    default: "Cash",
  },
  currency: {
    type: String,
  },
  merchantCommission: {
    type: Number,
    default: 0,
  },
  driverCommission: {
    type: Number,
    default: 0,
  },
  adminCommission: {
    type: Number,
    default: 0,
  },
  verticalType: {
    type: Number,
    default: 1, // 0 for restaurant, 1 for shops, 2 for taxi, 3 shuttle
  },
  distance: {
    type: Number,
    default: 0,
  },
  transactionId: String,
  date: {
    type: Number,
  },
  deliveryDate: {
    type: Number,
    default: 0,
  },
  userRating: {
    type: Number,
    default: 0,
  },
  storeRating: {
    type: Number,
    default: 0,
  },
  storeReview: {
    type: String,
    default: "",
  },
  driverReview: {
    type: String,
    default: "",
  },
  driverRating: {
    type: Number,
    default: 0,
  },
  orderType: {
    type: Number,
    default: 0, // 0 for delivery and 1 for self pickup
  },
  location: {
    type: {
      type: String
    },
    coordinates: [Number]
  },
  balanceLeft: {
    type : Number,
    default : 0
  },
  tip:{
    type: Number,
    default :0
  },
  status: {
    type: Number,
    default: 0, // 0 pending, 1 accept, 2 reached store, 3 picked up, 4 delivered, 5 rate, 6 skip, 11 cancel By user,12 cancel By store
    // new status
    // 0 pending,10 driver ignore, 9 merchant accept,8 proceed ,1 accept,2 for reached Store, 3 pickup, 7 Reach location, 4 delivered,5 Rating rate, 6 skip,11 cancel By user,12 cancel By restaurant,13 cancel By admin,
    // 14 cancel By driver,15 time update By restaurant,16 time update By admin,17 Self Delivery,18 schedule booking
  },
  indexAt: {
    type: Number,
    default: 0
  },

  cartData: {
    type: Schema.Types.Mixed
  },
}, {
  timestamps: true,
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  },
});

// orderSchemaEcommerce.plugin(AutoIncrement, {
//   inc_field: "orderNo",
//   start_seq: 1000,
// });
orderSchemaEcommerce.index({
  "location": "2dsphere"
});


orderSchemaEcommerce.pre(/save|create|update/i, function (next) {
  // setting geo point
  if (this.get("address.latitude") && this.get("address.longitude")) {
    const longitude = this.get("address.longitude");
    const latitude = this.get("address.latitude");
    const location = {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    };
    this.set({
      location
    });
  }
  next();
});
let storeOrderEcommerce = mongoose.model("storeOrderEcommerce", orderSchemaEcommerce);

export default storeOrderEcommerce;