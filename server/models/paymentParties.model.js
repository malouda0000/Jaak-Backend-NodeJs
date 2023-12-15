import mongoose, { Schema } from 'mongoose'
import Constant from '../constant'


const paymentAccountSchema = new Schema({
    account : { type : String },
    gatewayUsed : { type : String }, //RAZORPAY
});

const commissionsSchema = new Schema({
    commissionAmount : { type : Number },
    onDate: { type : Date },
    status : { type : String , enum :['SUCCESS','FAILURE'] }
});

let paymentPartiesSchema = new Schema(
    {
        paymentAccount : {
            type : [paymentAccountSchema]        
        }, 
        partyType : {
            type : String
        },
        userId : {
            type : String 
        },
        partyCommissionType : {
            type : String,
            //flat , percentage
        },
        partyCommission : {
            type : Number
        },
        clearedToPay : {
            type : Boolean,
            default:true
        },
        commissionsHistory : {
            type : [commissionsSchema]
        }
    },
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    }
);

let PaymentParties = mongoose.model('paymentParties', paymentPartiesSchema)

export default PaymentParties;