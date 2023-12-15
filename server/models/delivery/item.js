import mongoose, { Schema } from "mongoose";
import Constant from "../../constant";

const itemSchema = new Schema({
quantity: {type: Number, default: 1},
description: { type: String },
packageType: { type: Schema.Types.ObjectId, ref: "PackageType"},
},{ timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } });

let DeliveryItems = mongoose.model("deliveryItems", itemSchema);
export default DeliveryItems;