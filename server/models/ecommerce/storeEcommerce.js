import mongoose, {
  Schema
} from "mongoose";
import Constant from "../../constant";
import crypto from "crypto";

const adminPricesSchema = new Schema({
  min_distance: {
    type: Number
  },
  min_distance_charge: {
    type: Number
  },
  min_fare: {
    type: Number
  },
  max_fare: {
    type: Number
  },
  per_min_charges: {
    type: Number
  },
  zero_five: {
    type: Number
  },
  five_ten: {
    type: Number
  },
  ten_twenty: {
    type: Number
  },
  twenty_thirty: {
    type: Number
  },
  thirty_fifty: {
    type: Number
  },
  fifty_sixty: {
    type: Number
  },
});

const driverPayoutPrices = new Schema({
  min_distance: {
    type: Number
  },
  max_fare: {
    type: Number
  },
  per_min_charges: {
    type: Number
  },
  zero_five: {
    type: Number
  },
  five_ten: {
    type: Number
  },
  ten_twenty: {
    type: Number
  },
  twenty_thirty: {
    type: Number
  },
  thirty_fifty: {
    type: Number
  },
  fifty_sixty: {
    type: Number
  },
});

const deliveryChargesSchema = new Schema({
  isFree: {
    type: Boolean
  },
  fixed_delivery_charges: {
    type: Number
  },
  deliveryPrices: {
    type: adminPricesSchema,
  },
  driverPayout: {
    type: driverPayoutPrices,
  },
});

let storeSchema = new Schema({
  geofenceId: {
    type: Schema.Types.ObjectId,
    ref: "geofence",
    default: null
  },
  memberShipId: {
    type: Schema.Types.ObjectId,
    ref: "MemberShip",
    default: null
  },
  orderCount: {
    type: Number,
    default: 0
  },
  driverCount: {
    type: Number,
    default: 0
  },
  productCount: {
    type: Number,
    default: 0
  },
  // phone: { countryCode: String, phone: String },
  // emergencyPhone: { countryCode: String, phone: String },
  country_code: {
    type: String
  },
  phone_no: {
    type: String
  },
  emergency_countrycode: {
    type: String
  },
  emergency_phone_no: {
    type: String
  },
  delivery_charge_type: {
    type: String,
    enum: ["fixed", "in_range", "free"],
  },
  delivery_charges: {
    type: deliveryChargesSchema,
  },
  deliveryAreaType: {
    type: String,
    enum: ["fixed_area", "geo_fence"],
  },
  deliveryArea: {
    type: Number,
    default: 0
  },
  area_points: {
    type: {
      type: String,
      enum: "Polygon",
      default: "Polygon"
    },
    coordinates: {
      type: Array
    },
  },
  account_name: {
    type: String,
  },
  account_no: {
    type: Number,
  },
  bank_name: {
    type: String,
  },
  bank_code: {
    type: String,
  },
  restaurantName: {
    type: String,
  },
  name: {
    type: String,
    //   required: true,
  },
  name_ar: {
    type: String,
    // required: true,
  },
  ownerName: {
    type: String
  },
  email: {
    type: String,
    lowercase: true,
    // unique: true,
  },
  // phone: {
  //     type: String,
  // },
  description: {
    type: String,
  },
  description_ar: {
    type: String,
  },
  storeTypeId: {
    type: Schema.Types.ObjectId,
    ref: "storeCategoryEcommerce",
    //   required: true,
  },
  image: {
    type: String,
    //   required: true,
  },
  banner: {
    type: String,
  },
  currency: {
    type: String,
  },
  discount: {
    type: Number,
    default: 0, // discount in percentage
  },
  discountUpto: {
    type: Number,
    default: 0, // discount in percentage
  },
  minOrderAmount: {
    type: Number,
    default: 0, // discount in percentage
  },
  isRecommended: {
    type: Number,
    default: 0,
  },
  avgDeliveryTime: {
    type: Number,
    default: 30,
  },
  avgOrderPrice: {
    type: Number,
    default: 10,
  },
  onboardAmount: Number,
  date: {
    type: Number,
    select: false,
  },
  isFavourite: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
  storePackageType: {
    type: String,
    default: "percentage",
    enum: ["percentage", "flat", "membership"],
  },
  storePackageTypeValue: {
    type: Number,
    default: 0,
  },
  moduleKey: {
    type: String
  },
  packingCharges: {
    type: Number,
    default: 0
  },
  deliveryCharges: {
    type: Number,
    default: 0
  },
  // deliveryArea: { type: Number },
  serviceTax: {
    type: Number,
    default: 0
  },
  // openTime: {
  //   type: [[String]],
  //   default: [
  //     ["08:15", "10:40"],
  //     ["08:15", "10:40"],
  //     ["08:15", "10:40"],
  //     ["08:15", "10:40"],
  //     ["08:15", "10:40"],
  //     ["08:15", "10:40"],
  //     ["08:15", "10:40"],
  //   ],
  // },

  openTime: {
    type: Number,
    default: 0,
  },
  closeTime: {
    type: Number,
    default: 0,
  },
  status: {
    type: Number,
    default: 1, // 0 for disable, 2 for delete
    // select: false,
  },
  isHyperLocal: {
    type: Boolean,
    default: false
  },
  layout: {
    type: String,
    enum: ["grid", "list"],
    default: "list",
  },
  isBrandHidden: {
    type: Boolean,
    default: false,
  },
  minProductPrice: {
    type: Number,
    default: 0
  },
  maxProductPrice: {
    type: Number,
    default: 0
  },
  indexAt: {
    type: Number,
    default: 0
  },
  documents: [{
    type: String,
    default: null
  }],
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  resetToken: {
    type: String,
    default: null
  },
  resetTokenDate: {
    type: Date,
    default: null
  },
  verificationToken: {
    type: String,
    default: null
  },
  verificationTokenDate: {
    type: Date,
    default: null
  },
  verificationType: {
    type: Number,
    enum: [0, 1], //0 For Phone, 1 For email
  },
  authToken: {
    type: String,
    select: false,
  },
  //   countryCode: {
  //     type: String,
  //     trim: true,
  // },
  paidAmount: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    default: "Merchant"
  },
  hash: {
    type: String,
    select: false
  },
  resetPasswordExpires: String,
  unpaid: {
    type: Number,
    default: 0
  },
  withdrawn: {
    type: Number,
    default: 0
  },
  earnings: {
    type: Number,
    default: 0
  },
  lastPayment: {
    type: Number,
    default: 0
  },
  adminCommission: {
    type: Number,
    default: 0
  },
  salesPersonCommission: {
    type: Number,
    default: 0
  },
  isVisible: Boolean,
  isOpen: {
    type: Boolean,
    default: true
  },
  state: {
    type: String,
    enum: ["open", "close", "auto"]
  },
  veg_nonveg: {
    type: Boolean,
    default: false
  },
  deviceId: {
    type: String
  },
  isBestOffer: Boolean,
  deviceType: {
    type: String,
    enum: ["IOS", "ANDROID", "WEB"],
  },
  deviceToken: {
    type: String,
    default: "",
    select: false,
  },
  documentStatus: {
    type: Number,
    default: 0, // 0 for pending, 1 for accepted, 2 for rejected
  },
  myReferralCode: {
    type: String,
    default: "",
  },
  friendReferralCode: {
    type: Number,
    default: 0,
  },
  deliveryArea: {
    type: Number,
    default: 0,
  },
  deliveryCharges: {
    type: Number,
    default: 0,
  },
  packingCharges: {
    type: Number,
    default: 0,
  },
  walletAmount: {
    type: Number,
    default: 0
  },
  serviceTax: {
    type: Number,
    default: 0,
  },
  notif_msg_before_open: {
    type: String,
    default: "",
  },
  notif_msg_before_close: {
    type: String,
    default: "",
  },
  notif_open_time: {
    type: String,
    default: "",
  },
  notif_close_time: {
    type: String,
    default: "",
  },
  ownerId: {
    type: String,
    default: "",
  },
  ownerAddress: {
    type: String,
    default: "",
  },
  resturantCertificate: {
    type: String,
    default: "",
  },
  resturantAddress: {
    type: String,
    default: "",
  },
  ownerIdStatus: {
    type: Number,
    default: 0, // 0 for pending, 1 for accepted, 2 for rejected
  },
  ownerAddressStatus: {
    type: Number,
    default: 0, // 0 for pending, 1 for accepted, 2 for rejected
  },
  resturantCertificateStatus: {
    type: Number,
    default: 0, // 0 for pending, 1 for accepted, 2 for rejected
  },
  resturantAddressStatus: {
    type: Number,
    default: 0, // 0 for pending, 1 for accepted, 2 for rejected
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

// storeSchema.path("name").validate((value, done) => {
//   let qry = { name: new RegExp("^" + value + "$", "i"), status: { $ne: 2 } };

//   return mongoose.model("Store").countDocuments(qry).exec().then(function (count) {
//     return !count;
//   }).catch(function (err) {
//     throw err;
//   });
// }, Constant.STOREEXISTS);

storeSchema.path("name").validate(function (value, done) {
  let qry = {};
  if (this.moduleKey) {
    qry = {
      name: new RegExp("^" + value + "$", "i"),
      status: {
        $ne: 2
      },
      moduleKey: this.moduleKey,
    };
  } else {
    qry = {
      name: new RegExp("^" + value + "$", "i"),
      status: {
        $ne: 2
      }
    };
  }
  if (this.geofenceId) {
    qry.geofenceId = this.geofenceId;
  }
  return mongoose
    .model("storeEcommerce")
    .countDocuments(qry)
    .exec()
    .then(function (count) {
      return !count;
    })
    .catch(function (err) {
      throw err;
    });
}, Constant.STOREEXISTS);

storeSchema.methods.generatePasswordReset = function () {
  this.resetPasswordToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordExpires = Date.now() + 360000000; //expires in an hour
};

let storeEcommerce = mongoose.model("storeEcommerce", storeSchema);

export default storeEcommerce;