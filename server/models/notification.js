import Constant from "../constant";
import mongoose, { Schema } from "mongoose";

// const { Schema } = require("mongoose");
let notificationSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
    },
    verticalType: {
      type: Number,
      default: 0, // 0 for restaurant, 1 for shops, 2 for taxi, 3 shuttle
    },
    message: {
      type: String,
      // required: true,
    },
    data: Object,
    type: {
      type: Number,
      default: 1,
    },
    date: {
      type: Number,
      default: 0,
    },
    status: {
      type: Number, 
      default: 0, // 1 for read
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

let Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
