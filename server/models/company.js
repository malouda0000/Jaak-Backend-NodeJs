import { constant } from "lodash";
import mongoose, { Schema } from "mongoose";
import Constant from "../constant";

let companySchema = new Schema(
  {
    companyName: {
      type: String,
      // required: true,
    },
    ownerName: {
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
    address: {
      address: String,
      location: String,
      zipcode: String,
      latitude: Number,
      longitude: Number,
    },
    password: { type: String, select: false },
    profilePic: {
      type: String,
      default: "",
    },
    referralCode: {
      type: String,
    },
    isPhoneVerified: { type: Boolean, default: true },
    isApprove: { type: Boolean, default: true },
    resetOtpToken: { type: String, default: '' },
    loginType:{
      type: Number,
      enum:[Constant.LOGIN_TYPE.WITHOUTOTP, Constant.LOGIN_TYPE.WITHOTP],
      default : Constant.LOGIN_TYPE.WITHOUTOTP
    },
    isDeleted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

// Foreign keys definitions
// userSchema.virtual('ratings', {
//     ref: 'UserRating',
//     localField: '_id',
//     foreignField: 'user'
// });

companySchema.path("email").validate((value, done) => {
  if (!value) return true;
  let qry = { email: value.toLowerCase() };

  return mongoose
    .model("Company")
    .countDocuments(qry)
    .exec()
    .then(function (count) {
      return !count;
    })
    .catch(function (err) {
      throw err;
    });
}, Constant.EMAILEXISTS);

companySchema.path("phone").validate(function (value, done) {
  if (!value) return true;
  let qry = { phone: value, countryCode: this.countryCode };

  return mongoose
    .model("Company")
    .countDocuments(qry)
    .exec()
    .then(function (count) {
      return !count;
    })
    .catch(function (err) {
      throw err;
    });
}, Constant.PHONEEXISTS);

let Company = mongoose.model("Company", companySchema);

export default Company;
