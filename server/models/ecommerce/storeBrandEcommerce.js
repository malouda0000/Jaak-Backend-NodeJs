import mongoose, { Schema } from "mongoose";
import Constant from "../../constant";

let brandSchema = new Schema(
  {
    geofenceId: { type: Schema.Types.ObjectId, ref: 'geofence',default : null },
    name: {
      type: String,
      required: true,
      // unique: true,
    },
    name_ar: {
      type: String,
      // required: true,
    },
    image: {
      type: String,
      required: true,
    },
    date: {
      type: Number,
      select: false,
    },
    status: {
      type: Number,
      default: 3, // 0 for disable, 2 for delete
      // select: false,
    },
    indexAt: { type: Number, default: 0 },
    moduleKey: { type: String },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

// brandSchema.path("name").validate(function (value, done) {
//   let qry = {};
//   if (this.moduleKey) {
//     qry = { name: new RegExp("^" + value + "$", "i"), status: { $ne: 2 }, moduleKey: this.moduleKey };
//   } else {
//     qry = { name: new RegExp("^" + value + "$", "i"), status: { $ne: 2 } };
//   }
//   if(this.geofenceId){
//     qry.geofenceId = this.geofenceId
//   }
//   return mongoose.model("Brand").countDocuments(qry).exec().then(function (count) {
//     return !count;
//   }).catch(function (err) {
//     throw err;
//   });
// }, Constant.ALREADYEXISTS);

// brandSchema.path("name").validate((value, done) => {
//   let qry = { name: new RegExp("^" + value + "$", "i"), status: { $ne: 2 } };

//   return mongoose.model("Brand").countDocuments(qry).exec().then(function (count) {
//     return !count;
//   }).catch(function (err) {
//     throw err;
//   });
// }, Constant.ALREADYEXISTS);

let storeBrandEcommerce = mongoose.model("storeBrandEcommerce", brandSchema);

export default storeBrandEcommerce;
