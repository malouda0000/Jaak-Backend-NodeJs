import mongoose, { Schema } from 'mongoose'
import Constant from '../constant'

let transactionsModel = new Schema(
    {
        forOrder : {
            //type : Schema.Types.ObjectId
            type : String
        },
        gatewayUsed : {
            type:String,
        },
        totalAmount : {
            type : Number
        },
        transactionParties : {
            type : [Schema.Types.ObjectId],
            ref:'paymentParties'
        }
    },
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    }
);

let Transactions = mongoose.model('transactionsModel', transactionsModel)

export default Transactions
