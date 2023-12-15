import mongoose, { Schema } from "mongoose";

let requestSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "UserId",
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    date: {
      type: Number,
    },
    requestData: Object,
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "StoreOrder"
    },
    status: {
      type: Number,
      default: 0, // 0 for pending, 1 for accepted, 2 for rejected
    },
    ignored: Boolean,
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

let DriverRequest = mongoose.model("DriverRequest", requestSchema);

export default DriverRequest;
