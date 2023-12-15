import mongoose, { Schema } from "mongoose";
import Constant from "../../constant";
// store type in Admin Panel
let categorySchema = new Schema(
  {
    geofenceId: { type: Schema.Types.ObjectId, ref: 'geofence',default : null },
    name: {
      type: String,
      required: true,
      // unique: true,
    },
    name_ar: {
      type: String,
      // required: true
    },
    image: {
      type: String,
      required: true,
    },
    isHyperLocal: {
      type: Boolean,
    },
    isBrandHidden: {
      type: Boolean,
      default:false
    },
    date: {
      type: Number,
      select: false,
    },
    status: {
      type: Number,
      default: 1, // 0 for disable, 2 for delete
      // select: false
    },
    isVisible: Boolean,
    indexAt: { type: Number, default: 0 },
    layout: {
      type: String,
      enum: ["grid", "list"],
      default: "grid",
    },
    tax: {
      type: Number,
      default: 18, // in percent
    },
    packingCharge: {
      type: Number,
      default: 40, // fixed
    },
    moduleType: {
      type: String,
      // enum: ["food", "grocery"],
      // default: "grocery"
    },
    moduleKey: {
      type: String,
      required : true
      // enum: ["food", "grocery"],
      // default: "grocery"
    }
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

categorySchema.path("name").validate(function (value, done) {
  let qry = {};
  if (this.moduleKey) {
    qry = { name: new RegExp("^" + value + "$", "i"), moduleKey: this.moduleKey };
  } /* else {
    qry = { name: new RegExp("^" + value + "$", "i") };
  } */
  if(this.geofenceId)
  qry.geofenceId = this.geofenceId
  return mongoose.model("storeCategoryEcommerce").countDocuments(qry).exec().then(function (count) {
    return !count;
  }).catch(function (err) {
    throw err;
  });
}, Constant.STORETYPEEXITS);

// categorySchema.path("name").validate(function (value, done) {
//   let qry = { name: new RegExp("^" + value + "$", "i") };
//   return mongoose.model("StoreCategory").countDocuments(qry).exec().then(function (count) {
//     return !count;
//   }).catch(function (err) {
//     throw err;
//   });
// }, Constant.STORETYPEEXITS);

let storeCategoryEcommerce = mongoose.model("storeCategoryEcommerce", categorySchema);

export default storeCategoryEcommerce;
