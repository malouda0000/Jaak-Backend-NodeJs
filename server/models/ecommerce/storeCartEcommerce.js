import mongoose, { Schema } from "mongoose";

let storeCartSchema = new Schema(
  {
    serialNumber: { type: Number, default: 0 },
    storeId: { type: Schema.Types.ObjectId, ref: "storeEcommerce", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    outletId: {
      type: Schema.Types.ObjectId,
      ref: "storeOutletsEcommerce",
      required: true,
    },
    hash: { type: String, default: null },
    itemId: { type: Schema.Types.ObjectId, ref: "storeItemsEcommerce", required: true },
    itemCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "storeItemTypeEcommerce",
      required: true,
    },
    itemSubCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "storeItemTypeEcommerce",
      required: true,
    },
    itemBrandId: { type: Schema.Types.ObjectId, ref: "storeBrandEcommerce", required: true },
    itemName: String,
    itemArabicName: String,
    itemVariantName: String,
    itemVariantArabicName: String,
    itemPurchaseLimit: Number,
    quantity: Number,
    itemUnit: String,
    itemUnitValue: Number,
    itemColor: String,
    itemVideo: String,
    itemImage1: String,
    itemImage2: String,
    itemImage3: String,
    itemImage4: String,
    itemImage5: String,
    itemSize: String,
    itemDesciption: String,
    itemArabicDesciption: String,
    storeName: String,
    storeArabicName: String,
    storeAddress: String,
    itemQuantity: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    marketPrice: { type: Number, default: 0 },
    discount: Number,
    discountType: String,
    originalPrice: Number,
    isPromoApplied: Boolean,
    promoDiscount: Number,
    tickets: Number,
    LP: Number,
    tags: [String],
    isOpen: Boolean,
    isDeal: { type: Boolean, default: false },
    totalAddonsAmount: { type: Number, default: 0 },
    exceedingMaximumDiscountLimit: { type: Boolean, default: false },
    maximumDiscount: { type: Number, default: 0 },
    isActive : {
      type: Boolean,
      default : true
    }
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

let storeCartEcommerce = mongoose.model("storeCartEcommerce", storeCartSchema);

export default storeCartEcommerce;
