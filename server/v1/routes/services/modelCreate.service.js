
import model from "../../../models/index";
import Constant from "../../../constant";
import mongoose from "mongoose";
require("dotenv").config();
import { responseMessages } from "../../controllers/languages/english";

var axios = require('axios');

class modelCreateClass {

    constructor(){}

    createTransaction(data,lang) {
        return new Promise(async (resolve,reject) => {
            try{

                const pp1 = {
                    paymentAccount:[{account:"acc_HpLihq7sWE6tyt",gatewayUsed:"RAZORPAY"}],
                    partyType:"MERCHANT",
                    userId:"",
                    partyCommissionType:"PERCENTAGE",
                    partyCommission:5
                }
                const pp2 = {
                    paymentAccount:[{account:"acc_HpM2NBRT48ljZd",gatewayUsed:"RAZORPAY"}],
                    partyType:"MERCHANT",
                    userId:"",
                    partyCommissionType:"PERCENTAGE",
                    partyCommission:7
                }
                
                //await model.paymentParties.insertMany([pp1,pp2])

                const paymentParty1 = await model.paymentParties.create(pp1)

                const paymentParty2 = await model.paymentParties.create(pp2)

                const sample = {
                    forOrder:"",
                    gatewayUsed:"RAZORPAY",
                    totalAmount:100,
                    transactionParties:[paymentParty1._id,paymentParty2._id]
                }

                const isAdd = await model.transactions.create(sample);

                if(isAdd){
                    resolve(isAdd)
                }

                reject(false)

            }
            catch(e){
                console.log(e)
            }
        })
    }

    splitTransaction(data,lang) {
        return new Promise(async(resolve,reject) => {
            try{

                const transaction = await model.transactions.findOne({
                    _id:"61271a12b321883a04061ee0"
                })
                .populate({path:'transactionParties'});


                for ( const party of transaction.transactionParties ) {

                    const commissionAmount = await this.getCommissionAmount(party,transaction.totalAmount)

                    console.log("commission",commissionAmount);

                    if(party.clearedToPay==true) {

                        await this.payUsingRazor({
                            account: "acc_HpLihq7sWE6tyt",
                            amount: commissionAmount*100,  //in subunits
                        })
                        .then(async(d)=>{
                            //console.log("payyyy",d)
                            await model.paymentParties.findOneAndUpdate(
                                {_id:party._id},
                                {$addToSet:{
                                    commissionsHistory:{
                                        commissionAmount:commissionAmount,
                                        onDate:new Date(),
                                        status:'SUCCESS'
                                    }
                                }}
                            )
                        })
                        .catch(async(error)=>{
                            await model.paymentParties.findOneAndUpdate(
                                {_id:party._id},
                                {$addToSet:{
                                    commissionsHistory:{
                                        commissionAmount:commissionAmount,
                                        onDate:new Date(),
                                        status:'FAILURE'
                                    }
                                }}
                            )
                            //console.log("axios error",error)
                        });
                    }
                }

                resolve(transaction);

            }
            catch(e){
                console.log(e)
            }
        })
    }

    getCommissionAmount(paymentParty,totalAmount) {
        return new Promise(async (resolve,reject) => {
            try{
                ////// paymentParty object is like
                
                //console.log("paymentParty",paymentParty,totalAmount)

                const {partyCommission} = paymentParty;

                let commissionAmount = 0;

                if(paymentParty.partyCommissionType=='PERCENTAGE') {
                    commissionAmount = totalAmount*partyCommission/100
                }
                if(paymentParty.partyCommissionType=='FLAT') {
                    commissionAmount = partyCommission
                }

                resolve(commissionAmount);
            }
            catch(e){
                console.log(e)
            }
        })
    }

    payUsingRazor(paymentInfo) {
        return new Promise(async (resolve,reject) => {
            try{
                const USERNAME = 'rzp_test_2okHLNpqPGOvEa'
                const PASSWORD = 'iYOq5fmijaRQKm9LXko7Q3pV'

                console.log("pay request data",paymentInfo)
        
                var data = JSON.stringify({
                    "account": paymentInfo.account,
                    "amount": paymentInfo.amount,
                    "currency": "INR"
                });

                // for basic auth
                const token = `${USERNAME}:${PASSWORD}`;
                const encodedToken = Buffer.from(token).toString('base64');
                const headers = { 
                    'content-type': 'application/json', 
                    'Authorization': 'Basic '+ encodedToken
                };

                var config = {
                    method: 'post',
                    url: 'https://api.razorpay.com/v1/transfers',
                    headers,
                    data : data
                };

                axios(config)
                .then(function (response) {
                    console.log(JSON.stringify(response.data));
                    resolve(JSON.stringify(response.data));
                })
                .catch(function (error) {
                    console.log(error);
                    reject(error);
                });

            }
            catch(e){
                console.log(e)
            }
        })
    }



}

module.exports = new modelCreateClass();