import model from "../../../models/index";
import Constant from "../../../constant";
const Service = require("../../../services");
import moment from "moment";
import mongoose from "mongoose";
import multilingualService from "../../../services/multilingualService";
import { reject } from "async";
import templateAdmin from "../../../template/template-admin";
import templateRestaurant from "../../../template/template-restaurant";
import templateStore from "../../../template/template-store";
import templateAccountDetail from "../../../template/email";
import MailService from "../../../services/EmailService";
const FCM = require("fcm-node");
import dotenv from "dotenv";
dotenv.config();
require("dotenv").config();
var axios = require('axios');
const fcm = new FCM(process.env.FCMSERVERKEY);

const dibsySecretKey = process.env.DIBSY_SECRET;

const Razorpay = require('razorpay')

var instance = new Razorpay({
    key_id: 'rzp_test_FNp1GzoHIV6h9V',
    key_secret: 'zeZuvCJGOdOvxUm3YVhKTQ4S',
  });
var crypto = require("crypto");

class razorpayController {
    trialFunction (dataa,lang){
        return new Promise(async(resolve,reject)=>{
            try{
            }
            catch(e){
                console.log(e)
            }
        })

    }

    createOrder (data,lang){

        return new Promise(async(resolve,reject)=>{
            try{

                var options = {
                    amount: 50000,  // amount in the smallest currency unit
                    currency: "INR",
                    receipt: "order_rcptid_11"
                };

                instance.orders.create(options, async function(err, order) {
                    await model.razor.create({order:order})
                    resolve({
                        message:"order made",
                        data:order
                    })

                });

            }catch(e){
                console.log(e)
            }
        })
    }

    successCallback (data,lang){
        return new Promise(async(resolve,reject)=>{
            try{
                
                // data will be like 
                // {
                //     "razorpay_payment_id": "pay_29QQoUBi66xm2f",
                //     "razorpay_order_id": "order_9A33XWu170gUtm",
                //     "razorpay_signature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d"
                //   }

            }catch(e){
                console.log(e)
            }
        })
    }

    paymentSignature(data,lang){
        return new Promise(async(resolve,reject)=>{

            let body=req.body.response.razorpay_order_id + "|" + req.body.response.razorpay_payment_id;
           
            var expectedSignature = crypto.createHmac('sha256', 'Wok5mJv2F0pa5HKLeXZfUr9r')
                                             .update(body.toString())
                                             .digest('hex');
            var response = {"signatureIsValid":"false"}
            if(expectedSignature === req.body.response.razorpay_signature)
            response={"signatureIsValid":"true"}
            res.send(response);
        })
    }

}

export default razorpayController;

