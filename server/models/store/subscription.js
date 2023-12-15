import mongoose, { Schema } from "mongoose";

let schema = new Schema({
  image: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
    enum: [1,3,6,12] //number of months
  },
  orderCount: {
    type: Number,
    required: true,
  },
  feature: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

let Subscription = mongoose.model("subscription", schema);

export default Subscription;
