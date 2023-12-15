const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const BookingRequestModel = new Schema(
  {
    sentTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Receiver id is required."],
    }, // Receiver id
    sentBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender id is required."],
    },
    isPaymentDone: {
      type: Boolean,
      default: false,
    },
    isUserCompleted: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "Ongoing",
        "Canceled",
        "Rejected",
        "Completed",
        "Expired",
        "Terminated",
      ],
      default: "Pending",
    },
    subTotalAmount: {
      type: Number,
      default: 0.0,
    },
    terminateDate: {
      type: Date,
      default: null,
    },
    r_order_id: String,
    orderId: {
      type: String,
    },
    reason: {
      type: String,
      default: "",
    },
    acceptedDate: {
      type: Date,
      default: Date,
    },
    commission: {
      type: Number,
    },
    commissionType: {
      type: String,
    },
    rejectDate: {
      type: Date,
      default: null,
    },
    cancelDate: {
      type: Date,
      default: null,
    },
    invoice: {
      type: String,
      default: "",
    },
    startDate: {
      type: Date,
      default: null,
    },
    completedDate: {
      type: Date,
      default: null,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required."],
    },
    negotiateAmount: {
      type: Number,
      default: 0,
    },
    priceType: {
      type: String,
      enum: ["Fixed", "Negotiate"],
      required: [true, "Price type is required."],
    },
    bookingType: {
      type: String,
      enum: ["Now", "Schedule", "Flexible"],
    },
    tax: {
      type: Number,
    },
    transactionId: {
      type: String,
    },
    transactionHash: {
      type: String,
    },
    scheduleTime: [
      {
        type: Schema.Types.ObjectID,
        ref: "TimeSlot",
      },
    ],
    desc: {
      type: String,
    },
    location: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
      address: {
        type: String,
      },
      city: {
        type: String,
      },
    },
    services: [
      {
        service: {
          type: Schema.Types.ObjectId,
          ref: "Work",
        },
        amount: {
          type: Number,
        },
        offerAmount: {
          type: Number,
        },
        quantity: {
          type: Number,
        },
      },
    ],
    r_payment_id: String,
  },
  {
    timestamps: true,
  }
);
const BookingRequest = mongoose.model("BookingRequest", BookingRequestModel);
module.exports = BookingRequest;
