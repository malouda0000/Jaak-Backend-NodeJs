
import mongoose, { Schema } from "mongoose";
import Constant from "../../constant";

const ratingSchema = new Schema({
    isDriverRated: { type: Boolean, default: null },
    isCustomerRated: { type: Boolean, default: null },
    driverRating: { type: Number, default: 0 },
    customerRating: { type: Number, default: 0 },
    driverReview: { type: String, default: "" },
    customerReview: { type: String, default: "" },
    isDriverReviewed: { type: Boolean, default: null },
    isCustomerReviewed: { type: Boolean, default: null },
}, { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } });

let DeliveryRating = mongoose.model("deliveryRating", ratingSchema);
export default DeliveryRating;