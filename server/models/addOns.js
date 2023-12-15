import mongoose, { Schema } from "mongoose";

let addOnsSchema = new Schema(
  {
    image: { type: String },
    name: { type: String, required: true },
    name_ar: { type: String },
    price: { type: Number, required: true },
    itemId: { type: String, ref: "StoreItem" }, // Item _id
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    type: { type: String },
    purchaseLimit: { type: Number, default: 10 },
    quantity: { type: Number, default: 10 },
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

let AddOns = mongoose.model("AddOns", addOnsSchema);

export default AddOns;
