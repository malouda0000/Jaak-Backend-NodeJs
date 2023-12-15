import mongoose, { Schema } from "mongoose";
let shuttleSchema = new Schema({
  geofenceId: { type: Schema.Types.ObjectId, ref: 'geofence',default : null },
  name: {
    type: String,
    required: true,
    unique: true
  },
  driver: {
    type: Schema.Types.ObjectId,
    ref: "Driver",
    required: true
  },
  shuttleType: {
    type: String,
    required: true,
  },
  seatType: {
    type: Number // 0,1,2,3
  },
  shuttleRoute: [{
    type: Schema.Types.ObjectId,
    ref: "ShuttleRoute",
    required: true
  }],
  venderId: {
    type: Schema.Types.ObjectId,
    ref: "Vender"
  },
  seatsAvailable: {
    type: Number
  },
  busnumber: {
    type: String,
},
  status: {
    type: Number,
    default: 1
  },
  _isDeleted: { type: Boolean, default: false },
  _createdDate: { type: Date, default: Date.now },
  _updatedDate: { type: Date, default: Date.now }
});
let ShuttleRequest = mongoose.model("Shuttle", shuttleSchema);
export default ShuttleRequest;