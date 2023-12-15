const { default: Otp } = require('../models/Otp');
const OtpService = require('./OtpService')

module.exports ={

async send(countryCode , phone , otp){    
  if (process.env.SMSSERVICE === "TWILIO") {
    OtpService.sendTwilioSms(countryCode, phone, "Your otp code is " + otp);
  }
  if (process.env.SMSSERVICE === "SINCH") {
    OtpService.sendSMS(countryCode, phone, "Your otp code is " + otp);
  }
  if (process.env.SMSSERVICE === "TWOFACTOR") {
    OtpService.send2FactorSMS(phone, otp);
  }
  if (process.env.SMSSERVICE === "SMSBAZAR") {
    OtpService.sendSmsBazar(countryCode, phone, otp);
  }
  if(process.env.SMSSERVICE ===  "SMARTSMS"){
      OtpService.sendSmartSms(phone , "Your otp code is " + otp , countryCode)
  }
}
}
  