import Model from "../../../models/index";
const moment = require('moment')
const mongoose = require('mongoose')
const Service = require("../../../services");
let emailRegax = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
class storeOtp {
   
    async generatePhoneOtp(countryCode, phone, store, otpCode = generateRandom(4), expiredAt = moment().add(10, 'minutes').toDate()) {
        await Model.StoreOtp.deleteMany({
            phone: phone,
            countryCode: countryCode
        }); //Clear Old Send otp message
        let data = {
            phone: phone,
            countryCode: countryCode,
            code: otpCode,
            expiredAt: expiredAt
        }
        if (store) {
            data.storeId = storeId._id
        }
        await Service.selectOtpServiceAndSend.send(countryCode,phone, otpCode)
        let otp = await Model.StoreOtp.create(data);
        return otp;
    }

    async generateEmailVerification(email, store, firstName, code = generateRandom(4), expiredAt = moment().add(60, 'minutes').toDate()) {
        await Model.StoreOtp.deleteMany({
            email: email,
        }); //Clear Old Send otp message
        let data = {
            email: email,
            code: code,
            expiredAt: expiredAt
        }
        if (store) {
            data.storeId = storeId._id
        }
        let payload = {
            email: data.email ,
            password: data.password,
          };
          Service.EmailService.sendUserPasswordMail(payload);
        let otp = await Model.StoreOtp.create(data);
        return otp;
    }

    async verifyEmailCode(email, code, removeOtp = true, storeId, isForEmail =true) {
        let qry = {
            code: code,
            expiredAt: {
                $gte: new Date()
            }
        }
        if (isForEmail) {
            qry.email = email;
        } 
        if (storeId) {
            qry.storeId = mongoose.Types.ObjectId(storeId)
        }
        let otp = await Model.StoreOtp.findOne(qry, {
            _id: 1
        })
        if (otp && removeOtp) {
            otp.remove()
        }
        return otp;
    }

    async resendOtpIfExpire(countryCode, key, firstName) {
        let qry = {
            expiredAt: {
                $gte: new Date()
            }
        }
        if ( emailRegax.test(String(key).toLowerCase())) { // isEmail
            qry.email = key.toLowerCase();
        } else {
            qry.phone = key;
        }
        let otp = await Model.StoreOtp.findOne(qry, {
            _id: 1
        })
        if (!otp) {
            if ( emailRegax.test(String(key).toLowerCase())) { // isEmail
               await this.generateEmailVerification(key, null, firstName, "1234");
            } else {
                await this.generatePhoneOtp(countryCode, key, null, "1234");
            }

        }
    }

    async verifyPhoneOtp(countryCode, key, otpCode, removeOtp = true, storeId, isForEmail = false) {
        let qry = {
            code: otpCode,
            expiredAt: {
                $gte: new Date()
            }
        }
        if (isForEmail) {
            qry.email = key;
        } else {
            qry.phone = key;
        }
        if (storeId) {
            qry.storeId = mongoose.Types.ObjectId(storeId)
        }
        if (countryCode) {
            qry.countryCode = countryCode
        }
        let otp = await Model.StoreOtp.findOne(qry, {
            _id: 1
        })
        if (otp && removeOtp) {
            otp.remove()
        }
        return otp;
    }

    async generateRandom(n) {
        var add = 1, max = 12 - add;   // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.   

        if (n > max) {
            return generate(max) + generate(n - max);
        }

        max = Math.pow(10, n + add);
        var min = max / 10; // Math.pow(10, n) basically
        var number = Math.floor(Math.random() * (max - min + 1)) + min;

        return ("" + number).substring(add);
    }

    async isEmail(value) {
        return emailRegax.test(String(value).toLowerCase());
    }

    async isPhone(value) {
        let intRegex = /[0-9 -()+]+$/;
        return intRegex.test(value)
    }

    async sendPhoneOtp(countryCode, phone, otpCode ) {
          await Service.selectOtpServiceAndSend.send(countryCode,phone, otpCode)
    }
}

export default storeOtp;