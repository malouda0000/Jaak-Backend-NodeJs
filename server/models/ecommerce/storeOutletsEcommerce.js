import mongoose, { Schema } from "mongoose";

let outletSchema = new Schema(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "storeEcommerce",
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    countryCode: {
      type: String,
    },
    phone: {
      type: String,
    },
    landMark: {
      type: String,
      default: "",
    },
    location: {
      type: [Number],
    },
    date: {
      type: Number,
      select: false,
    },
    status: {
      type: Number,
      default: 1,
    },
    indexAt: { type: Number, default: 0 },
    deliveryArea: {
      type: Number,
      default: 0,
    },
    deliveryAreaType: {
      type: String,
      enum: ["fixed_area", "geo_fence"],
    },
    geoLongLat: {
      'type': {type: String, enum: 'Polygon', default: 'Polygon'},
      coordinates: {type: Array}
    }
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

outletSchema.index({ location: "2dsphere" });
let storeOutletsEcommerce = mongoose.model("storeOutletsEcommerce", outletSchema);

export default storeOutletsEcommerce;
