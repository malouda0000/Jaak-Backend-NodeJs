import mongoose, { Schema } from "mongoose";


let paymentSchema = new Schema(
    {
        paymentBy: {type: Schema.Types.ObjectId, ref: "User"},
        amount: {type: Number,  required: true},
        paymentMethod: {type: Number, required: true},    //1-wallet, 2-card , 3-netbanking   
        paymentTo: {type: Schema.Types.ObjectId, ref: "User", required: true},
        status: {type: Number, enum: [1,2], default: 1}          //1-pending, 2-completed
    });
let Finance = mongoose.model("Finance", paymentSchema);

export default Finance;