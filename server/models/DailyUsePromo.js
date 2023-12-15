import mongoose, { Schema } from "mongoose";
let DailyUsePromoSchema = new Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "User" },
    promoId: { type: mongoose.Types.ObjectId, ref: "PromoCode" },
    first_time_use_in_last_24hours: {
      type: Date,
      default: new Date(+new Date() - 30 * 24 * 60 * 60 * 1000),
    },
    no_of_use_in_last_24hours: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);
let DailyUsePromo = mongoose.model("DailyUsePromo", DailyUsePromoSchema);

export default DailyUsePromo;
