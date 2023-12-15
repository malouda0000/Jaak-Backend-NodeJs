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

import {createSample} from '../../routes/services'

const fcm = new FCM(process.env.FCMSERVERKEY);

const dibsySecretKey = process.env.DIBSY_SECRET

class paymentController {

    testPaySplit(data,lang){

        return new Promise(async(resolve,reject)=>{
            try{

                // const added = createSample.createTransaction();

                // resolve(added);

                const split = createSample.splitTransaction();

                resolve(split);
                
            }
            catch(e){
                console.log(e)
            }
        })
    }

    requestPayment(dataa,lang){
        return new Promise(async(resolve,reject)=>{
            try{
                var data = JSON.stringify({
                "name": dataa.name,
                "amount": dataa.amount,
                "currency": "QAR",
                "description": dataa.description,
                "redirectUrl": dataa.redirectRoute,
                "reusable": false,
                "metadata": {}
                });

                var config = {
                method: 'post',
                url: 'https://api.dibsy.one/v1/payment-links',
                headers: { 
                    'Authorization': `Bearer ${dibsySecretKey}`, 
                    'Content-Type': 'application/json'
                },
                data : data
                };

                axios(config)
                .then(function (response) {
                    resolve({
                        message:"dibsy success",
                        data:response.data
                    })
                })
                .catch(function (error) {
                    console.log("error",error);
                    reject({
                        message:"dibsy error",
                        error:error
                    })
                });

    
            }
            catch(e){
                console.log(e)
            }
        })

    }

}

export default paymentController;

