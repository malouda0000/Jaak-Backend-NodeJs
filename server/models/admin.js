import mongoose, { Schema } from "mongoose";
import Constant from "../constant";
import crypto from "crypto";

let adminSchema = new Schema(
  {
    accessModuleId: { type: Schema.Types.ObjectId, ref: "AccessModule", default: null },
    appId:{
      type: String,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      lowercase: true,
    },
    countryCode: {
      type: String,
    },
    phone: {
      type: String,
    },
    profilePic: {
      type: String,
      default: "",
    },
    image: {
      type: String,
    },
    loginPageImage: {
      type: String,
    },
    adminRevenue: Number,
    role: {
      type: String,
      default: "Admin",
    },
    authToken: {
      type: String,
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
    hash: { type: String, select: false },
    resetToken: { type: String, default: null },
    resetTokenDate: { type: Date, default: null },
    verificationToken: { type: String, default: null },
    verificationTokenDate: { type: Date, default: null },
    resetPasswordToken: String,
    resetPasswordExpires: String,
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

adminSchema.path("email").validate((value, done) => {
  if (!value) return true;
  let qry = { email: value, status: { $nin: [2] } };

  return mongoose
    .model("Admin")
    .countDocuments(qry)
    .exec()
    .then(function (count) {
      return !count;
    })
    .catch(function (err) {
      throw err;
    });
}, Constant.EMAILEXISTS);

adminSchema.path("phone").validate(function (value, done) {
  if (!value) return true;
  let qry = { phone: value, countryCode: this.countryCode, status: { $nin: [2] } };

  return mongoose
    .model("Admin")
    .countDocuments(qry)
    .exec()
    .then(function (count) {
      return !count;
    })
    .catch(function (err) {
      throw err;
    });
}, Constant.PHONEEXISTS);

adminSchema.methods.generatePasswordReset = function () {
  this.resetPasswordToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordExpires = Date.now() + 360000000; //expires in an hour
};

let Admin = mongoose.model("Admin", adminSchema);

export default Admin;
