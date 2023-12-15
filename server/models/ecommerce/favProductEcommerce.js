import mongoose, { Schema } from "mongoose";

let favouriteSchema = new Schema(
  {
    geofenceId: { type: Schema.Types.ObjectId, ref: "geofence", default: null },
    productKey: {
      type: String,
      ref: "storeItemsEcommerce",
      required: true,
    }, // Item ProductKey
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

let favProductEcommerce = mongoose.model("favProductEcommerce", favouriteSchema);

export default favProductEcommerce;
