import mongoose, { Schema } from "mongoose";

let notificationSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
    },
    requestId: {
      type: Schema.Types.ObjectId,
      ref: "DriverRequest",
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
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
      default: 51,
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
    // toObject: { virtuals: true },
    // toJSON: { virtuals: true }
  }
);

let DriverNotification = mongoose.model(
  "DriverNotification",
  notificationSchema
);

export default DriverNotification;
