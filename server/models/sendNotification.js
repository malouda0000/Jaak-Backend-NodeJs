import Constant from "../constant";
import mongoose, { Schema } from "mongoose";

// const { Schema } = require("mongoose");
let sendNotificationSchema = new Schema(
  {
    onCreateOrder:{
        type : Boolean,
        default : false
    },
    OnCreateStore:{
        type : Boolean,
        default: false
    },
    onReviewRating:{
        type : Boolean,
        default: false
    },
    onProductAdd:{
        type : Boolean,
        default: false
    }
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

let sendNotification = mongoose.model("sendNotification", sendNotificationSchema);

export default sendNotification;
