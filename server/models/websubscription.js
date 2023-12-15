import mongoose, { Schema } from "mongoose";
let webSubscriptionSchema = new Schema(
  {
    storeId: { type: mongoose.Types.ObjectId, ref: "Store" },
    adminId : {type : mongoose.Types.ObjectId, ref: "Admin" , default : null},
    subscription:{
        endpoint : {
            type : String,
        },
        keys : {
            p256dh : {
                type : String,
            },
            auth: {
                type : String,
            },
        },
    },
  },
  {
    timestamps: true,
  }
);
let webSubscription = mongoose.model("webSubscription", webSubscriptionSchema);

export default webSubscription;
