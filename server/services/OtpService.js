import dotenv from "dotenv";
dotenv.config();
const axios = require("axios");
const config = require("../config/config");
import model from "../models/index";
import multilingualService from "./multilingualService";
// const axios = require("axios");
// const APIKEY = "C20018365c0b16f2aced57.68811342";
// const sender_id = "YUMMYHYD";
// const BudgetSMSAPI = require("budgetsms-node");
// const BudgetSMS = new BudgetSMSAPI({
//   username: "Hatidnijuan",
//   userid: "21895",
//   handle: "33cd7eb817c07572e29a537c940d444c"
// })
const twilio = require("twilio");
const accountSid = process.env.TWILIOACCOUNTSID; // Your Account SID from www.twilio.com/console
const authToken = process.env.TWILIOAUTHTOKEN; // Your Auth Token from www.twilio.com/console
const client = require("twilio")(accountSid, authToken) // { lazyLoading: true });
const TwoFactor = new (require("2factor"))(process.env.TWOFACTORAPIKEY);
// var smsglobal = require('smsglobal')(process.env.SMSGLOBALKEY, process.env.SMSGLOBALSECRET);

async function requestSend(url, postData, axiosConfig) {
  axios
    .post(url, postData, axiosConfig)
    .then((json) => {
      console.log('OTP send successfully."');
    })
    .catch((error) => {
      console.error(error);
    });
}

module.exports = {
  issue() {
    return Math.floor(1000 + Math.random() * 9000);
  },
  async sendSMS(countryCode, phone, messages) {
    return new Promise(async (resolve, reject) => {
      const axiosConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.SINCH_APITOKEN,
        },
      };
      const postData = {
        from: process.env.SINCH_FROM_NUMBER,
        to: [countryCode + phone],
        body: messages,
      };
      requestSend(process.env.SINCH_RESTAPIURL, postData, axiosConfig);
      resolve(messages);
    });
  },
  async sendTwilioSms(countryCode, phone, message) {
    console.log(countryCode, phone, message, "countryCode, phone, message");
    return new Promise(async (resolve, reject) => {
      const smsOptions = {
        from: process.env.TWILIOSENDERNUMBER,
        to: countryCode + (phone ? phone.toString() : ""),
        body: message,
      };
      client.messages.create(smsOptions);
      return resolve(message);
    });
  },

  async sendSmsBazar(countryCode, phone, otp) {
    console.log(countryCode, phone, otp, "countryCode, phone, message");
    return new Promise(async (resolve, reject) => {
      let url = "http://api.smsbazar.in/sms/1/text/query?"
      const username = process.env.SMSBAZAR_USERNAME;
      const password = process.env.SMSBAZAR_PASSWORD;
      const fromPhone = process.env.SMSBAZAR_PHONE;
      const dltTemplate = process.env.DLT_TEMPLATE;
      const from = process.env.SMSBAZAR_FROM
      const PEID = process.env.PEID
      if (!username || !password || !dltTemplate || !from || !PEID)  
        return reject({
          message: multilingualService.getResponseMessage("INVALIDCRED", "en"),
        });
      url = url + "username=" + username + "&password=" + password + "&from=";
      url = url + from + "&to=" + countryCode + phone + "&text=" + `Your OTP is ${otp} - FOODIELAL`  + "&type=longSMS&output=json";
      url = url + "&indiaDltContentTemplateId=" + dltTemplate + "&indiaDltPrincipalEntityId=" + PEID
      axios
        .post(url)
        .then((json) => {
          console.log('OTP send successfully."');
        })
        .catch((error) => {
          console.error(error);
        });
        const message = `Your otp is ${otp}`
      return resolve(message);
    });
  },
  async sendSMSGlobal(countryCode, phone, message) {
    const payload1 = {
        origin: 'SMSGlobal',
        destination: countryCode + phone,
        message:message
       };
        return new Promise((resolve, reject) =>{
          try{
           smsglobal.sms.send(payload1, function(error, response) {
             if(error) return reject(error)
             if(response) {console.log(response)}
             return resolve(response)

           }); 
        }catch (e) {
            return reject(Constant.error.serverError);
        }
      });
    },
  async verifyOtp(payload) {
    try {
      if (payload && payload.otpCode && payload.phoneNo && payload.countryCode) {
        let otpCode = await model.Otp.findOne({
          otp: payload.otpCode,
          phone: payload.phoneNo,
          countryCode: payload.countryCode,
        });
        await model.Otp.deleteMany({ 
          otp: payload.otpCode,
          phone: payload.phoneNo,
          countryCode: payload.countryCode,
        });
        return otpCode;
      } else {
        return payload;
      }
    } catch (error) {}
  },
  async send2FactorSMS(phoneNo, message) {
    console.log(phoneNo, message, "phoneNo, message");
    return new Promise(async (resolve, reject) => {
      TwoFactor.sendOTP(`${phoneNo}`, { otp: `${message}` });
      return resolve(message);
    });
  },
  async sendSmartSms(phoneNo,message, countryCode){
    return new Promise(async (resolve, reject) => {
      let url = "https://smartsmsgateway.com/api/api_json.php?"
      const username = process.env.SMARTSMS_USERNAME;
      const password = process.env.SMARTSMS_PASSWORD;
      const senderId = process.env.SMARTSMS_SENDERID;
  
      if (!username || !password || !senderId )  
        return reject({
          message: multilingualService.getResponseMessage("INVALIDCRED", "en"),
        }); 
      url = url + "username=" + username + "&password=" + password + "&senderid=" + senderId ;
      url = url + "&to=" + countryCode + phoneNo + `&text=` + message + "&type=text"
      axios
        .post(url)
        .then((json) => {
          console.log('OTP send successfully."');
        })
        .catch((error) => {
          console.error(error);
        });
      return resolve(message);
    });
  },
};


/*
SMSBAZAR_USERNAME="foodielal"
SMSBAZAR_PASSWORD="foodielal"
DLT_TEMPLATE="1207162815632153028"
SMSBAZAR_FROM="FODIAL"
PEID="1201162739789168097"

*/