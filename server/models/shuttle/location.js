import mongoose, { Schema } from "mongoose";

let locationSchema = new Schema({
  address: {
    type: String,
    required: true,
    unique: true
  },
  coordinates: {
    type: [Number],
    required: true
  },
  status: {
    type: Number,
    default: 1
  },
  _isDeleted: { type: Boolean, default: false },
  _createdDate: { type: Date, default: Date.now },
  _updatedDate: { type: Date, default: Date.now }
});

locationSchema.index({ "coordinates": "2dsphere" });

let LocationSchema = mongoose.model("Location", locationSchema);

export default LocationSchema;
