import mongoose, { Schema } from "mongoose";
import Constant from "../../constant";

let salesPersonSchema = new Schema(
  {
    geofenceId: { type: Schema.Types.ObjectId, ref: 'geofence',default : null },
    name: {
      type: String,
      required: true,
    },
    storesArray: [
      {
        type: Schema.Types.ObjectId,
        ref: "Store",
      },
    ],
    commission: Number,
    commissionType: String,
    email: String,
    phone: String,
    countryCode: String,
    password: { type: String, select: false },
    unpaid: Number,
    withdrawn: Number,
    earnings: Number,
    authToken: {
      type: String,
      select: false,
    },
    lastPayment: Number,
    moduleKey: String,
    moduleName: String,
    status: {
      type: Number,
      default: 1, // 0 for disable, 2 for delete
    },
    indexAt: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

// salesPersonSchema.path("name").validate((value, done) => {
//   let qry = { name: new RegExp("^" + value + "$", "i"), status: { $ne: 2 } };

//   return mongoose
//     .model("salesPerson")
//     .countDocuments(qry)
//     .exec()
//     .then(function (count) {
//       return !count;
//     })
//     .catch(function (err) {
//       throw err;
//     });
// }, Constant.ALREADYEXISTS);

let SalesPerson = mongoose.model("salesPerson", salesPersonSchema);

export default SalesPerson;
