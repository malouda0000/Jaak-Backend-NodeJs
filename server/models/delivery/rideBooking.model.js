import mongoose, { Schema } from "mongoose";

const AutoIncrement = require('mongoose-sequence')(mongoose);

const addressSchema = new Schema(
    {}
)

let rideBookingSchema = new Schema(
    {
       ofuser : {
           type : Schema.Types.ObjectId
       },
       commenceLocation : {},
       destinationLocation : {}
    },
    { timestamps: true, }
);

rideBookingSchema.plugin(AutoIncrement, { inc_field: 'rideBookingNo', start_seq: 1000 });
let RideBooking = mongoose.model("rideBooking", rideBookingSchema);

export default RideBooking;
