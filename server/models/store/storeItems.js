import mongoose, { Number, Schema } from "mongoose";
import Constant from "../../constant";

let itemSchema = new Schema( // for manage catalogue from admin website
  {
    geofenceId: { type: Schema.Types.ObjectId, ref: "geofence", default: null },
    productKey: String,
    productName: String,
    productName_ar: String,
    storeId: { type: Schema.Types.ObjectId, ref: "Store" },
    companyId :  { type: Schema.Types.ObjectId, ref: "Company" },
    addOn: [{ type: Schema.Types.ObjectId, ref: "AddOns" }],
    toppings: [{ type: Schema.Types.ObjectId, ref: "AddOns" }],
    customizable: { type: Boolean, default: false }, // do we have addons in this variant or not
    // availablePack: { type: Number, default: 0 },
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", required: true },
    color: { type: Array },
    // currency: { type: String },
    date: { type: Number, select: true },
    description_ar: {
      type: String,
      //  required: true
    },
    description: { type: String, required: true },
    discount: { type: Number, default: 0 },
    discountType: { type: String, default: "none" },
    originalPrice: { type: Number, default: 0 }, // priceIncTax (MRP)
    discountedPriceExcTax: { type: Number, default: 0 },
    priceExcTax: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    isFav: { type: Boolean, default: false },
    // dealsApplied: [String],
    // frequency: { type: Number, default: 0 }, //increase the count after sale(status 4 than incease it)
    image1: { type: String, default: "" },
    image2: { type: String, default: "" },
    image3: { type: String, default: "" },
    image4: { type: String, default: "" },
    image5: { type: String, default: "" },
    maxUserQuantity: { type: Number, default: 0 },
    name_ar: {
      type: String,
      // required: true
    },
    name: { type: String, required: true },
    notAvailable: [{ type: Schema.Types.ObjectId, ref: "StoreOutlet" }],
    notInOutlet: [{ type: Schema.Types.ObjectId, ref: "StoreOutlet" }],
    packingTime: { type: Number },
    price: {
      // discountedPriceIncTax
      type: Number,
      default: 0,
    },
    purchaseLimit: { type: Number, default: 50 },
    quantity: { type: Number, default: 50 },
    mainQuantity:{type : Number},   // when first time item create or update it is equal to quantity . it cann't be decreaesed
    size: { type: Array },
    status: { type: Number, default: 1 }, // 1 for available, 0 for not available, 2 for delete
    storeItemSubTypeId: {
      type: Schema.Types.ObjectId,
      ref: "StoreItemType",
      // required: true,
    },
    storeItemTypeId: {
      type: Schema.Types.ObjectId,
      ref: "StoreItemType",
      required: true,
    },
    storeTypeId: {
      type: Schema.Types.ObjectId,
      ref: "StoreCategory",
    },
    indexAt: { type: Number, default: 0 },
    isTrending: Boolean,
    unit: { type: String },
    unitValue: { type: Number },
    additional1: { type: String, defaut: "" },
    additional2: { type: String, defaut: "" },
    additional1_ar: { type: String, defaut: "" },
    additional2_ar: { type: String, defaut: "" },
    video: { type: String, defaut: "" },
    LP: { type: Number, default: 0 }, // loyality Points
    // imagesSaved: Boolean,
    variantId: { type: Number, required: true },
    isProto: { type: Boolean, required: true },
    tickets: { type: Number, default: 0 },
    areClonesUpdated: Boolean,
    storeExclusive: Boolean,
    tagsUpdated: Boolean,
    tags: [String],
    imagesUpdated: Boolean,
    sku_number: { type: String, default: "" },
	visible:{type:Boolean,default:true},
    isRecommended: {
      type: Number,
      default: 4 /* 4--> removed recommended, 5-->  add Recommended */,
    },
    marketPrice: { type: Number, default: 0 },
    label: { type: String, default: "" },
    moduleKey: { type: String },
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

itemSchema.path("name").validate(function (value, done) {
  let qry = {};
  if (this.moduleKey) {
    qry = {
      name: value,
      storeId: this.storeId,
      productKey: this.productKey,
      moduleKey: this.moduleKey,
    };
  } else {
    qry = {
      name: value,
      storeId: this.storeId,
      productKey: this.productKey,
    };
  }
  if(this.companyId){
    qry.companyId = this.companyId
  }
  if (this.geofenceId) {
    qry.geofenceId = this.geofenceId;
  }
  return mongoose
    .model("StoreItem")
    .countDocuments(qry)
    .exec()
    .then(function (count) {
      return !count;
    })
    .catch(function (err) {
      throw err;
      ``;
    });
}, Constant.STOREITEMEXISTS);

// itemSchema.path("name").validate(function (value, done) {
//   let qry = { name: value, storeId: this.storeId, productKey: this.productKey, };

//   return mongoose.model("StoreItem").countDocuments(qry).exec().then(function (count) {
//     return !count;
//   }) .catch(function (err) {
//       throw err;
//       ``;
//     });
// }, Constant.STOREITEMEXISTS);

let StoreItem = mongoose.model("StoreItem", itemSchema);

export default StoreItem;
