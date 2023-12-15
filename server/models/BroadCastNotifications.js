import Constant from "../constant";
import mongoose, { Schema } from "mongoose";

// const { Schema } = require("mongoose");
let broadCastNotificationSchema = new Schema({
    userId: [{
      type: Schema.Types.ObjectId,
      ref: "User"
    }],
    storeId: [{
      type: Schema.Types.ObjectId,
      ref: "Store",
    }],
    title: {
      type: String,
      default: "",
    },
    notimessage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

let BroadCastNotification = mongoose.model("BroadCastNotification", broadCastNotificationSchema);

export default BroadCastNotification;
