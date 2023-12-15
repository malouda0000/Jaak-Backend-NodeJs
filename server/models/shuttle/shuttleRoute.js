import mongoose, { Schema } from "mongoose";

let shuttleRouteSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  startPoint: {
    type: Schema.Types.ObjectId,
    ref: "Location",
    required: true,
  },
  stopPoints: [
    {
      coordinates: {
        type: Schema.Types.ObjectId,
        ref: "Location",
      },
      fare: {
        type: Number,
      },
      time: {
        type: String
      },
      status: {
        type: Number,
        default: 0
      }
    },
  ],
  endPoint: {
    type: Schema.Types.ObjectId,
    ref: "Location",
    required: true,
  },
  venderId: {
    type: Schema.Types.ObjectId,
    ref: "Vender"
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  totalFare: {
    type: Number,
    required: true,
  },
  // shuttleId: {
  //   type: Schema.Types.ObjectId,
  //   ref: "Shuttle"
  // },
  status: {
    type: Number,
    default: 1
  },
  _isDeleted: { type: Boolean, default: false },
  _createdDate: { type: Date, default: Date.now },
  _updatedDate: { type: Date, default: Date.now },
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});


let ShuttleRouteRequest = mongoose.model("ShuttleRoute", shuttleRouteSchema);

export default ShuttleRouteRequest;
