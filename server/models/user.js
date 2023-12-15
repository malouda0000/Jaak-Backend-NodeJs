import {
  constant
} from "lodash";
import mongoose, {
  Schema
} from "mongoose";
import Constant from "../constant";

let userSchema = new Schema({
  geofenceId: {
    type: Schema.Types.ObjectId,
    ref: 'geofence',
    default: null
  },
  firstName: {
    type: String,
    // required: true,
  },
  lastName: {
    type: String,
    // required: true,
  },
  email: {
    type: String,
    lowercase: true,
    // unique: true,
  },
  countryCode: {
    type: String,
  },
  phone: {
    type: String,
  },
  emergencyPhone: {
    countryCode: String,
    phone: String,
  },
  address: {
    address: String,
    location: String,
    zipcode: String,
    latitude: Number,
    longitude: Number,
  },
  location: {
    type: [Number]
  },
  wallet: {
    type: Number,
    default: 0,
    // select: false,
  },
  profilePic: {
    type: String,
    default: "",
  },
  facebookId: {
    type: String,
    default: "",
    select: false,
  },
  googleId: {
    type: String,
    default: "",
    select: false,
  },
  appIeId: {
    type: String,
    default: "",
    select: false,
  },
  isSocialRegister: {
    type: Number,
    default: 0,
  },
  deviceId: {
    type: String,
    select: false,
  },
  deviceType: {
    type: String,
    select: false,
  },
  authToken: {
    type: String,
    // select: false,
  },
  sendNoti: {
    type: Number,
    default: 1,
    select: false,
  },
  date: {
    type: Number,
    select: false,
  },
  status: {
    type: Number,
    default: 1,
    select: false,
  },
  referralCode: {
    type: String,
  },
  referredBy: {
    type: String,
  },
  userType: {
    type: String,
    select: false,
  },
  username: {
    type: String,
    select: false,
  },
  referralUser: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],
  indexAt: {
    type: Number,
    default: 0
  },
  lang: {
    type: String,
    default: "en"
  },
  hash: {
    type: String,
    select: true
  },
  ticketsCount: {
    type: Number,
    default: 0
  },
  earnedMoney: {
    type: Number,
    default: 0
  },
  availableLP: {
    type: Number,
    default: 0
  },
  tags: [String],
  earnedLPPurchases: {
    type: Number,
    default: 0
  },
  earnedLPReferrals: {
    type: Number,
    default: 0
  },
  totalEarnedLP: {
    type: Number,
    default: 0
  },
  totalLPSpent: {
    type: Number,
    default: 0
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  isApprove: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Number,
    default: 1
  },
  resetOtpToken: {
    type: String,
    default: ''
  },
  walletAmount: {
    type: Number,
    default: 0
  },
  customerEntity: {
    type: Object,
    default: null
  },
  razorpayAccount: {
    type: String,
    default: "",
  },
  adminOTP: {
    type: String
  },
  loginType: {
    type: Number,
    enum: [Constant.LOGIN_TYPE.WITHOUTOTP, Constant.LOGIN_TYPE.WITHOTP],
    default: Constant.LOGIN_TYPE.WITHOUTOTP
  },
  companyReferalCode: {
    type: String
  },
  socketId: {
    type: String
  }
}, {
  timestamps: true,
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  },
});

// Foreign keys definitions
// userSchema.virtual('ratings', {
//     ref: 'UserRating',
//     localField: '_id',
//     foreignField: 'user'
// });
userSchema.index({
  location: "2dsphere"
})

userSchema.path("email").validate((value, done) => {
  if (!value) return true;
  let qry = {
    email: value.toLowerCase()
  };

  return mongoose
    .model("User")
    .countDocuments(qry)
    .exec()
    .then(function (count) {
      return !count;
    })
    .catch(function (err) {
      throw err;
    });
}, Constant.EMAILEXISTS);

userSchema.path("phone").validate(function (value, done) {
  if (!value) return true;
  let qry = {
    phone: value,
    countryCode: this.countryCode
  };

  return mongoose
    .model("User")
    .countDocuments(qry)
    .exec()
    .then(function (count) {
      return !count;
    })
    .catch(function (err) {
      throw err;
    });
}, Constant.PHONEEXISTS);

let User = mongoose.model("User", userSchema);

export default User;