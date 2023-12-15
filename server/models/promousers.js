import mongoose, { Schema } from "mongoose";

let promousers = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    promoId: {
      type: Schema.Types.ObjectId,
      ref: "PromoCode",
      required: true,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

let Promouser = mongoose.model("Promouser", promousers);

export default Promouser;
