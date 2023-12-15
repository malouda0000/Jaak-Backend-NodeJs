const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const PayHistoryModel = new Schema({
    payTo : {
        type : String,
        enum:["salesperson", "driver", "merchant"]
    },
    salesPersonId : {
        type : mongoose.Types.ObjectId,
        ref : "salesPerson"
    },
    driverId : {
        type : mongoose.Types.ObjectId,
        ref : "Driver"
    },
    merchantId : {
        type : mongoose.Types.ObjectId,
        ref : "Store"
    },
    payAmount : {
        type : Number
    },
    payDate : {
        type : Date
    }
}, {
    timestamps: true,
});

const PayHistory = mongoose.model('PayHistory', PayHistoryModel);
module.exports = PayHistory;
