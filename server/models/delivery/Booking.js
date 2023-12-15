import mongoose, { Schema } from "mongoose";
import Constant from "../../constant";
const AutoIncrement = require("mongoose-sequence")(mongoose);

const BookingSchema = new Schema({
    itemName: { type: String, default: null },
    bookingNo: { type: Number, default: 1000 },
    driverId: { type: Schema.Types.ObjectId, ref: "Driver", },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, },
    items: [{type:Schema.Types.ObjectId, ref: "deliveryItems"}],
    packageSizeId: { type: Schema.Types.ObjectId, ref: "PackageSize" },
    bookingAcceptedDate: { type: Date, default: null },
    bookingCompleteDate: { type: Date, default: null },
    bookingCancelDate: { type: Date, default: null },
    bookingStatus: {
        type: Number,
        enum: [
            Constant.BOOKING_STATUS.DEFAULT,
            Constant.BOOKING_STATUS.PENDING,
            Constant.BOOKING_STATUS.COMPLETED,
            Constant.BOOKING_STATUS.STARTED,
            Constant.BOOKING_STATUS.CANCELED,
            Constant.BOOKING_STATUS.ACCEPTED,
            Constant.BOOKING_STATUS.TRANSIT,
            Constant.BOOKING_STATUS.PARTIAL,
            Constant.BOOKING_STATUS.SCHEDULED,
        ],
        default: Constant.BOOKING_STATUS.PENDING
    },
    bookingType: {
        type: Number,
        enum: [Constant.BOOKING_TYPE.RIDE, Constant.BOOKING_TYPE.DELIVERY],
        default: Constant.BOOKING_TYPE.DELIVERY
    },
    paymentMode: {
        type: Number,
        enum: [Constant.PAYMENT_MODE.CASH, Constant.PAYMENT_MODE.CARD, Constant.PAYMENT_MODE.WALLET],
        default: Constant.PAYMENT_MODE.CASH
    },
    paymentStatus: {
        type: Number,
        enum: [Constant.PAYMENT_STATUS.PENDING, Constant.PAYMENT_STATUS.COMPLETED],
        default: Constant.PAYMENT_STATUS.PENDING
    },
    totalDistanceInKm: { type: Number, default: 0 },
    authorityToLeave: {type: Boolean, default: false},
    additionalDetails: {type: String},
    weight: { type: Number, required: true},
    size: { type: String, required: true },
    height: { type: Number, required: true},
    length: { type: Number, required: true},
    address: {type: Schema.Types.ObjectId, ref: "deliveryAddress"},
    bookingAmount: { type: Number, default: 1 },

    isDeleted: { type: Boolean, default: false },
    packageType:{type: String},
    packageItem:{type: String},
    itemDimension:{type: String}

}, { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } });

BookingSchema.plugin(AutoIncrement, {
    inc_field: "bookingNo",
    start_seq: 1000,
});
let DeliveryBooking = mongoose.model("deliveryBooking", BookingSchema);
export default DeliveryBooking;