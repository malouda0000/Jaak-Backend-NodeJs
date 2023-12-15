import mongoose, { Schema } from "mongoose";
const AutoIncrement = require('mongoose-sequence')(mongoose);
let TransactionSchema = new Schema(
    {
        userId: { type: mongoose.Types.ObjectId, ref: "User" },
        transactionType: { type: String, default: "" },
        amount: { type: Number, default: 0 },
        transactionNumber: { type: Number },
        creditDebitType: { type: String, default: "" },
        transactionId: { type: String , default: ""},
        fromUserId: { type: mongoose.Types.ObjectId, ref: "User" },
        toUserId: { type: mongoose.Types.ObjectId, ref: "User" },
        PaymentGatewayType: { type: String, default: "" },
        orderId : {type: mongoose.Types.ObjectId, ref : "StoreOrder"}

    },
    { timestamps: true, }
);

TransactionSchema.plugin(AutoIncrement, { inc_field: 'transactionNumber', start_seq: 1000 });
let Transaction = mongoose.model("Transaction", TransactionSchema);

export default Transaction;
