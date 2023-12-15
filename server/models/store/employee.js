const mongoose = require("mongoose");
const Schema1 = mongoose.Schema;
const SchemaEmp = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true },
  storeTypeId: [
    {
      type: mongoose.Types.ObjectId,
      ref: "StoreCategory",
    },
  ],
  storeId: { type: mongoose.Types.ObjectId, ref: "Store" },
  //   permissions: [
  //     {
  //       parent: {
  //         type: Boolean,
  //       },
  //       name: {
  //         type: String,
  //       },
  //       childs: [
  //         {
  //           childName: {
  //             type: String,
  //           },
  //           view: {
  //             type: Boolean,
  //             default: false,
  //           },
  //           edit: {
  //             type: Boolean,
  //             default: false,
  //           },
  //           delete: {
  //             type: Boolean,
  //             default: false,
  //           },
  //         },
  //       ],
  //     },
  //   ],
  password: { type: String },
  countryCode: { type: Number },
  phone: { type: String },
  profilePic: { type: String },
  role: { type: String, default: "employee" },
  deviceType: {
    type: String,
    enum: ["IOS", "ANDROID", "WEB"],
  },
  deviceToken: {
    type: String,
    default: "",
    select: false,
  },
  authToken: {
    type: String,
    select: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

let employee = mongoose.model("employee", SchemaEmp);

export default employee;
