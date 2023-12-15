
import mongoose, { Schema } from "mongoose";
import Constant from "../../constant";

const addressSchema = new Schema({

    phoneNo: { type: String, required: true },
    countryCode: { type: String, required: true},
    address: { type: String, required: true },
    suite: { type: String,  required: true },
    zipCode: { type: Number,  required: true },
    city: { type: String , required: true},
    state: { type: String, required: true },
    completeAddress: { type: String, default: "" },
    bulidingNo: { type: String, default: "" },
    addressType : {
      type : String,
      enum : ["HOME", "WORK", "OTHER"]
  },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, },
    location: {
        type: { type: String, enum: ['Point', 'Polygon'], default: 'Point' },
        coordinates: [{ type: [Number], default: [0, 0] }],
      },
    additionalDetails: { type: String, default: 0 },
},
   { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } });

  let DeliveryAddress = mongoose.model("deliveryAddress", addressSchema);
  export default DeliveryAddress;