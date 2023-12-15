import mongoose, { Schema } from "mongoose";
import Constant from "../constant";

let promocodeSchema = new Schema(
  {
    // restaurantId: [{ type: Schema.Types.ObjectId, ref: 'Restaurant', default: null }],
    // storeTypeId: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isDeal: Boolean,
    // usedUserId: [{ type: Schema.Types.ObjectId, ref: "User" }],
    userId: [{ type: Schema.Types.ObjectId, ref: "User" }],
    productId: [String],
    itemId:[ {type: Schema.Types.ObjectId, ref: "StoreItem"}],
    storeIds: [{ type: Schema.Types.ObjectId, ref: "Store" }],
    brandId: [{ type: Schema.Types.ObjectId, ref: "Brand" }],
    categoryId: [{ type: Schema.Types.ObjectId, ref: "StoreItemType" }],
    subCategoryId: [{ type: Schema.Types.ObjectId, ref: "StoreItemType" }],
    verticalType: { type: Number, default: 1 }, // 0 for restaurant, 1 for shops, 2 for taxi, 3 shuttle
    name: { type: String, required: true },
    code: { type: String, required: true, default: "DEAL" },
    store: { type: Schema.Types.ObjectId, ref: "Store" },
    description: String,
    type: { type: Number, default: 0 }, // 0 for %, 1 for flat, 2 for both
    discount: { type: Number, default: 0 },
    discountType: {type:String,default : "Flat"},
    maxDiscount: { type: Number, default: 0 },
    useLimit: { type: Number, default: 0 },
    minAmountToApply: { type: Number, default: 0 },
    startDate: Date,
    endDate: Date,
    perDayLimit: { type: Number, default: 0 },
    status: { type: Number, default: 1 }, // 2 for deleted
    indexAt: { type: Number, default: 0 },
    isBrand: Boolean,
    isUser: Boolean,
    isStore: Boolean,
    isProduct: Boolean,
    isCategory: Boolean,
    isSubCategory: Boolean,
    geofenceId: { type: Schema.Types.ObjectId, ref: "geofence", default: null },
    image: {
      type: String,
      // required: true
    },
    label: {
      type: String,
      enum: ["product", "store", "category"],
    },
    moduleKey: { type: String },
    isApprove : {type : Boolean, default : true}
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

promocodeSchema.path("code").validate(function (value, done) {
  let qry = {
    $and: [
      { code: new RegExp("^" + value + "$", "i") },
      { code: { $ne: "DEAL" } },
    ],
    status: { $ne: 2 },
    verticalType: this.verticalType,
  };

  return mongoose
    .model("PromoCode")
    .countDocuments(qry)
    .exec()
    .then(function (count) {
      return !count;
    })
    .catch(function (err) {
      throw err;
    });
}, Constant.PROMOEXISTS);

let PromoCode = mongoose.model("PromoCode", promocodeSchema);

export default PromoCode;
