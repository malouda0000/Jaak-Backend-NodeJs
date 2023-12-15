import mongoose, { Schema } from "mongoose";
let TimeSlotSchema = new Schema(
  {
    storeId: { type: mongoose.Types.ObjectId, ref: "Store" },
    timeSlots: [{
      day: { type: String, default: "" },
      openTime: { type: String, default: "" },
      closeTime: { type: String, default: "" },
      open:{type:Boolean,default:false}
    }],
  },
  {
    timestamps: true,
  }
);
let TimeSlot = mongoose.model("TimeSlot", TimeSlotSchema);

export default TimeSlot;