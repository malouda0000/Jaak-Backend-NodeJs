import Constant from "../constant";
import mongoose, { Schema } from "mongoose";
const AutoIncrement = require('mongoose-sequence')(mongoose);
let MembershipSchema = new Schema(
    {
        planId: { type: Number },
        name : {type : String},
        description : {type : String, default : ""},
        validationType : {
            type : Number,
            enum : [Constant.VALIDATION_TYPE.WEEK, Constant.VALIDATION_TYPE.MONTH, Constant.VALIDATION_TYPE.YEAR]
        },
        validationNumber : {
            type: Number, default : 0
        },
        planType : {
            type : String,
            enum : ["STORE", "DRIVER", "CUSTOMER"]
        },
        isAll: {
            type: Boolean,
            default : false
        },
        isDeleted: {
            type: Boolean,
            default : false
        },
        // moduleType : [{
        //     type : String,
        //     default : null
        // }],
        // storeId: [{ type: mongoose.Types.ObjectId, ref: "Store" }],
        // userId: [{ type: mongoose.Types.ObjectId, ref: "User" }],
        // driverId: [{ type: mongoose.Types.ObjectId, ref: "Driver" }],
        moduleKey : { type: String},
        moduleName : { type: String},
        image : { type: String},
        amount: { type: Number, default: 0 },
        orderCount: { type: Number, default: 0 },
        driverCount: { type: Number, default: 0 },
        productCount: { type: Number, default: 0 }
    },
    { timestamps: true, }
);

MembershipSchema.plugin(AutoIncrement, { inc_field: 'planId', start_seq: 1000 });
let MemberShip = mongoose.model("MemberShip", MembershipSchema);

export default MemberShip;
