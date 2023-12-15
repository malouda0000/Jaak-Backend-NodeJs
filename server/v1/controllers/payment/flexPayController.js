import model from "../../../models/index";
import Constant from "../../../constant";
const Service = require("../../../services");
import moment from "moment";
import mongoose from "mongoose";
import multilingualService from "../../../services/multilingualService";
import { number } from "joi";
import { ModelBuildContext } from "twilio/lib/rest/autopilot/v1/assistant/modelBuild";
var axios = require("axios");
const flexPaySecretKey = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJcL2xvZ2luIiwicm9sZXMiOlsiTUVSQ0hBTlQiXSwiZXhwIjoxNjk5OTA1MzYwLCJzdWIiOiI0NjI3YmEzNjAzZTRhOWRjNWVmNThmYmVmMWRmOTA2ZCJ9.H2CdcYgcmnvvO81vGs6475FOsKLQlJdnwyQA3ERmha0"

module.exports = {
    async paymentService(req, res){
       try {

        var data = JSON.stringify({
          "merchant": req.body.merchant,
          "amount": req.body.amount,
          "type": req.body.type,
          "reference":req.body.reference,
          "currency": req.body.currency,
          "phone":req.body.phone,
          "callbackUrl": req.body.callbackUrl,
          });

          var config = {
          method: 'post',
          url: 'https://backend.flexpay.cd/api/rest/v1/paymentService',
          headers: { 
              'Authorization': `${flexPaySecretKey}`, 
              'Content-Type': 'application/json'
          },
          data : data
          };

          axios(config)
          .then(function (response) {
            console.log("success",)
              return res.send({
                message:"flexPay success",
                data:response.data,
                status:200
              })
          })
          .catch(function (error) {
              console.log("error",error);
             return res.send({
                  message:"flexPay error",
                  error:error
              })
          });      
         } catch (e) {
           console.log(e);
           return res.send({
             message:"Error at add card"+e,
             status:501
           });
         }
   },
   
   async getTranscation(req, res) {

    try{
       let orderNumber = req.query.orderId

      var config = {
        method: 'get',
        url: `http://41.243.7.46:3006/api/rest/v1/check/${orderNumber}`,
        headers: { 
            'Authorization': `${flexPaySecretKey}`, 
            'Content-Type': 'application/json'
        },
        };

        axios(config)
        .then(function (response) {
          console.log("success",)
            return res.send({
              message:"flexPay success",
              data:response.data,
              status:200
            })
        })
        .catch(function (error) {
            console.log("error",error);
           return res.send({
                message:"flexPay error",
                error:error
            })
        }); 



    } catch (e) {
           console.log(e);
           return res.send({
             message:"Error at add card"+e,
             status:501
           });
         }

   },
   async payOutService(req, res){
    try {

     var data = JSON.stringify({
       "merchant": req.body.merchant,
       "amount": req.body.amount,
       "type": req.body.type,
       "reference":req.body.reference,
       "currency": req.body.currency,
       "phone":req.body.phone,
       "callbackUrl": req.body.callbackUrl,
       });

       var config = {
       method: 'post',
       url: 'http://41.243.7.46:3006/api/rest/v1/merchantPayOutService',
       headers: { 
           'Authorization': `${flexPaySecretKey}`, 
           'Content-Type': 'application/json'
       },
       data : data
       };

       axios(config)
       .then(function (response) {
         console.log("success",)
           return res.send({
             message:"flexPay success",
             data:response.data,
             status:200
           })
       })
       .catch(function (error) {
           console.log("error",error);
          return res.send({
               message:"flexPay error",
               error:error
           })
       });      
      } catch (e) {
        console.log(e);
        return res.send({
          message:"Error at add card"+e,
          status:501
        });
      }
},
  
   
   }