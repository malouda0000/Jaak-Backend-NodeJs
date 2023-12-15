import mongoose, { Schema } from "mongoose";
import Constant from "../../constant";

let vehicleTypeSchema = new Schema(
  {
    geofenceId: { type: Schema.Types.ObjectId, ref: 'geofence',default : null },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    basefare: {
      type: Number,
      default: 10,
    },
    fare: {
      type: Number,
      // required: true
    },
    fareInHour: {
      type: Number,
      // required: true
    },
    waitingTime:{
      type: Number,
    },
    seats: {
      type: Number,
    },
    verticalType: {
      type: Number,
      default: 1, // 1 for food/Stationary,2 for taxi, 3 for shuttle
    },
    date: {
      type: Number,
      select: false,
    },
    status: {
      type: Number,
      default: 1, // 0 for disable, 2 for delete
    },
    moduleKey: {
      type: String,
      // required: true,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

vehicleTypeSchema.path("name").validate(function (value, done) {
  let qry = {
    name: new RegExp("^" + value + "$", "i"),
    status: { $ne: 2 },
    verticalType: this.verticalType,
  };

  return mongoose
    .model("VehicleType")
    .countDocuments(qry)
    .exec()
    .then(function (count) {
      return !count;
    })
    .catch(function (err) {
      throw err;
    });
}, Constant.VEHICLETYPEEXISTS);

let VehicleType = mongoose.model("VehicleType", vehicleTypeSchema);

export default VehicleType;
