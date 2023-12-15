import mongoose, { Schema } from "mongoose";
let StoreCacheSchema = new Schema(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    data: Object,
    label: String,
  },
  {
    timestamps: true,
  }
);
let StoreCache = mongoose.model("StoreCache", StoreCacheSchema);

export default StoreCache;
