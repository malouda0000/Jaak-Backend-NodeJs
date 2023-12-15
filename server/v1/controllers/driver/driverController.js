import dotenv from "dotenv";
dotenv.config();
import model from "../../../models/index";
import Constant from "../../../constant";
const Service = require("../../../services");
import moment from "moment";
import multilingualService from "../../../services/multilingualService";
import generateReferralCode from "../../../services/randomService";
const mongoose = require("mongoose");
import { responseMessages } from "../languages/english";
class driverController {
  checkLoginParams(data, lang) {
    return new Promise((done, reject) => {
      try {
        let qry = {};

        if (data.email) qry.email = data.email.toLowerCase();
        else if (data.phone && data.countryCode) {
          qry.countryCode = data.countryCode;
          qry.phone = data.phone;
        } else
          return reject({ message: multilingualService.getResponseMessage("PARAMETERMISSING", lang), });

        model.driver.findOne(qry)
          .then(async (result) => {
            if (data.isRegister) {
              const optData = await model.DriverOtp.findOne({ driver: data.phone });

              if (optData) await model.DriverOtp.deleteMany({ driver: data.phone });

              const Otp = await model.DriverOtp({
                otp: Math.floor(1000 + Math.random() * 9000),
                driver: data.phone,
                phone: data.phone,
                countryCode: data.body,
              }).save();

              if (result) {
                return reject({
                  message: data.email
                    ? multilingualService.getResponseMessage("EMAILEXISTS", lang)
                    : multilingualService.getResponseMessage("PHONEEXISTS", lang),
                });
              }
              else if(data.fireOtp == false)   // if fireOtp false it means otp send from front end
              {
                done({ 
                  message : Constant.SUCCESSCODE,
                  data : {success : true} })
              } 
               else {
                await Service.selectOtpServiceAndSend.send(data.countryCode, data.phone, Otp.otp)
                done({ message: Constant.OTPSEND, data: { otpId: Otp._id, otp: Otp.otp } });
              }
            } else {
              if (result && result.isSocialRegister)
                return reject({ message: multilingualService.getResponseMessage("SOCIALREGISTERMSG", lang), });

              if (!result)
                return reject({ message: multilingualService.getResponseMessage("NOACCOUNTMSG", lang), });
              done({});
            }
          })
          .catch((err) =>
            reject({ message: multilingualService.getResponseMessage("ERRMSG", lang), })
          );
      } catch (e) {
        console.log(e);
      }
    });
  }

  getAllVehicleTypes(data, lang) {
    return new Promise(async (done, reject) => {
      model.vehicleType
        .find({ verticalType: data.type, status: { $ne: 2 } })
        .select("name image")
        .then((result) => {
          done({ data: result });
        });
    });
  }

  register(data, file, headers, finalFileName) {
    return new Promise(async (done, reject) => {
      let lang = headers.headersuage || "en"
      data.geofenceId = headers.geofenceid != "NA" ? headers.geofenceid : null;
      data.referralCode = generateReferralCode();
      if(data.applyReferralCode){
        let isUserReferrel = await model.user.findOne({referralCode : data.applyReferralCode})
        let isMerchant = await model.store.findOne({myReferrelCode : data.applyReferralCode})
        let isDriver = await model.driver.findOne({referralCode : data.applyReferralCode});
      //const moneyToSend = await model.Referral.findOne({}) 
      console.log("isUser isMerchant isDriver",isUserReferrel,isMerchant,isDriver)  
      const moneyToSend = await model.Referral.findOne({})
      if(isUserReferrel){
        isUserReferrel.walletAmount = isUserReferrel.walletAmount + moneyToSend.customerToDriver
        isUserReferrel.save()
      }
      if(isMerchant){
        isMerchant.earnings = isMerchant.earnings + moneyToSend.merchantToDriver
        isMerchant.save()
      }
       if(isDriver){
        isDriver.earnings = isDriver.earnings + moneyToSend.driverToDriver
        isDriver.save()
      }
    }
      let driver = this.createDriver(data, finalFileName);
      driver.authToken = await Service.JwtService.issue({ _id: driver._id });
      driver.save().then((result) => {
          done({ message: "", data: result });
        })
        .catch((err) => {
          console.log("eroor-=======",err)
          if (err.errors)
            
            return reject({ message: Service.Handler.mongoErrorHandler(err) });

          return reject({
            message: multilingualService.getResponseMessage("FALSEMSG"),
          });
        });
    });
  }

  createDriver(data, finalFileName) {
    let driver = new model.driver({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      countryCode: data.countryCode,
      phone: data.phone,
      geofenceId : data.geofenceId,
      referralCode:data.referralCode,
      currency: data.currency,
      emergencyPhone: data.emergencyPhone,
      address: data.address,
      deviceId: data.deviceId,
      deviceType: data.deviceType,
      vehicleName: data.vehicleName,
      vehicleNumber: data.vehicleNumber,
      verticalType: data.verticalType,
      vehicleTypeId: data.vehicleTypeId,
      storeId: data.storeId,
      storeTypeId: data.storeTypeId,
      commission: data.commission,
      commissionType: data.commissionType,
      userType: data.userType,
      isAvailbaleForAllStoreType: data.isAvailbaleForAllStoreType,
      moduleType: data.moduleType,
      moduleKey : data.moduleKey,
      date: moment().valueOf(),
    });

    if (data.password) driver.hash = Service.HashService.encrypt(data.password);
    if (finalFileName) driver.profilePic = process.env.S3URL + finalFileName;
    return driver;
  }

  login(data, lang) {
    return new Promise((done, reject) => {
      let qry = {};
      if (data.email) qry.email = data.email.toLowerCase();
      else if (data.phone) {
        qry.countryCode = data.countryCode;
        qry.phone = data.phone;
      } else
        return reject({
          message: multilingualService.getResponseMessage(
            "PARAMETERMISSING",
            lang
          ),
        });

      model.driver
        .findOne(qry)
        .select("+hash")
        .then((driver) => {
          if (
            !driver ||
            Service.HashService.decrypt(driver.hash) !== data.password
          )
            return reject({
              message: multilingualService.getResponseMessage(
                "INVALIDPARAMS",
                lang
              ),
            });

          let update = {
            deviceId: data.deviceId,
            deviceType: data.deviceType,
            authToken: Service.JwtService.issue({ _id: driver._id }),
          };

          model.driver
            .findByIdAndUpdate(driver._id, update, { new: true })
            .select("+authToken")
            .then((result) => {
              done({ data: result });
            })
            .catch((err) => {
              reject({
                message: multilingualService.getResponseMessage("ERRMSG", lang),
              });
            });
        });
    });
  }

  logout(driverId) {
    return new Promise(async (done, reject) => {
      let update = {
        authToken: "",
        deviceId: "",
        deviceType: "",
      };
      model.driver
        .findByIdAndUpdate(driverId, update, { new: true })
        .then((result) => {
          done({ data: result });
        });
    });
  }

  checkBeforeUpdate(data, lang, driverId) {
    return new Promise((done, reject) => {
      if (!data.email || !data.countryCode || !data.phone)
        return reject({ message: Constant.PARAMETERMISSING });

      let qry = {
        $and: [
          { _id: { $ne: driverId } },
          {
            $or: [
              { email: data.email.toLowerCase() },
              { countryCode: data.countryCode, phone: data.phone },
            ],
          },
        ],
      };

      model.driver
        .findOne(qry)
        .then((result) => {
          if (result)
            return reject({
              message:
                data.email && data.email.toLowerCase() == result.email
                  ? multilingualService.getResponseMessage("EMAILEXISTS", lang)
                  : multilingualService.getResponseMessage("PHONEEXISTS", lang),
            });

          done({});
        })
        .catch((err) =>
          reject({
            message: multilingualService.getResponseMessage("ERRMSG", lang),
          })
        );
    });
  }

  getProfile(driverId) {
    return new Promise(async (done, reject) => {
      let driverDetails = await model.driver
        .findById(driverId)
        .populate("vehicleTypeId");
      let vehicleTypeName = await driverDetails.vehicleTypeId.name;

      model.driver
        .findById(driverId)
        .select("+authToken")
        .then((result) => {
          model.driverRating
            .find({ driverId: driverId })
            .select("rating")
            .then((resp) => {
              let total = 0;
              resp.map((val) => {
                total = total + Number(val.rating);
              });
              if (total) total = Math.round((total / resp.length) * 100) / 100;
              result.set("ratings", total, { strict: false });
              result.set("vehicleTypeName", vehicleTypeName, { strict: false });
              done({ data: result });
            });
        });
    });
  }

  updateProfile(data, file, lang, driverId, finalFileName) {
    return new Promise(async (done, reject) => {
      // let driverDetails = await model.driver
      //   .findById(driverId).populate('vehicleTypeId');
      // let vehicleTypeName = await driverDetails.vehicleTypeId.name;

      let qry = {
        $and: [
          { _id: { $ne: driverId } },
          {
            $or: [
              { email: data.email.toLowerCase() },
              { countryCode: data.countryCode, phone: data.phone },
              { vehicleNumber: data.vehicleNumber },
            ],
          },
        ],
      };

      model.driver.findOne(qry).then((driver) => {
        if (driver)
          return reject({
            message:
              data.email && data.email.toLowerCase() == driver.email
                ? multilingualService.getResponseMessage("EMAILEXISTS", lang)
                : data.vehicleNumber == driver.vehicleNumber
                  ? multilingualService.getResponseMessage(
                    "VEHICLENUMBEREXISTS",
                    lang
                  )
                  : multilingualService.getResponseMessage("PHONEEXISTS", lang),
          });

        if (finalFileName) data.profilePic = process.env.S3URL + finalFileName;
        model.driver
          .findByIdAndUpdate(driverId, data, { new: true })
          .select("+authToken")
          .then((result) => {
            model.driverRating
              .find({ driverId: driverId })
              .select("rating")
              .then((resp) => {
                let total = 0;
                resp.map((val) => {
                  total = total + Number(val.rating);
                });
                if (total)
                  total = Math.round((total / resp.length) * 100) / 100;
                result.set("ratings", total, { strict: false });
                // result.set("vehicleTypeName", vehicleTypeName, { strict: false });
                done({
                  message: multilingualService.getResponseMessage(
                    "UPDATEMSG",
                    lang
                  ),
                  data: result,
                });
              });
          })
          .catch((err) => {
            console.log(err, "err");
            reject({
              message: multilingualService.getResponseMessage("ERRMSG", lang),
            });
          });
      });
    });
  }

  uploadDocument(data, file, lang, driverId, finalFileName) {
    return new Promise((done, reject) => {
      model.driverDocument.findOneAndUpdate({ name: data.name, driverId: driverId },
          {
            frontImage: process.env.S3URL + finalFileName,
            date: moment().valueOf(),
            status: 0,
        },{ new: true })
        .then((result) => {
          if (result) {
            model.driver.findByIdAndUpdate(driverId, { profileStatus: 0 }, { new: true })
              .then((driver) => {
                done({ message: Constant.ADDMSG, data: result });
              });
          } else {
            data.date = moment().valueOf();
            data.driverId = driverId;
            if (finalFileName){
              data.image = process.env.S3URL + finalFileName;
            }
            // data.documentId = data.documentId || null;
            let doc = new model.driverDocument(data);
            doc.save().then((document) => {
              done({ message: Constant.ADDMSG, data: document });
            });
          }
        })
        .catch((err) => {
          reject({ message: Constant.ERRMSG });
        });
    });
  }

  getUploadedDocument(id, lang) {
    return new Promise((done, reject) => {
      model.driverDocument
        .find({ driverId: id })
        .select("name image status")
        .then((docs) => {
          model.driver
            .findById(id)
            //.select("profileStatus")
            .then((driver) => {
              done({
                message: "",
                data: { profileStatus: driver.profileStatus, docsList: docs, driver:driver },
              });
            });
        });
    });
  }

  ChangeForgotPassword(data, lang) {
    return new Promise((done, reject) => {
      data.hash = Service.HashService.encrypt(data.password);
      model.driver
        .findOneAndUpdate(
          { countryCode: data.countryCode, phone: data.phone },
          data,
          { new: true }
        )
        .then((result) => {
          if (!result)
            return reject({
              message: multilingualService.getResponseMessage(
                "NOACCOUNTMSG",
                lang
              ),
            });

          done({
            message: multilingualService.getResponseMessage(
              "PASSCHANGEMSG",
              lang
            ),
          });
        })
        .catch((err) => {
          reject({
            message: multilingualService.getResponseMessage("ERRMSG", lang),
          });
        });
    });
  }

  async changePassword(data, lang, driverId) {
    return new Promise(async (done, reject) => {
      model.driver
        .findById(driverId)
        .select("+hash")
        .then((driver) => {
          if (Service.HashService.decrypt(driver.hash) !== data.oldPassword)
            return reject({
              message: multilingualService.getResponseMessage(
                "WRONGOLDPASSWORD",
                lang
              ),
            });

          let update = { hash: Service.HashService.encrypt(data.password) };

          model.driver
            .findByIdAndUpdate(driverId, update, { new: true })
            .then((result) => {
              done({
                message: multilingualService.getResponseMessage(
                  "PASSCHANGEMSG",
                  lang
                ),
              });
            })
            .catch((err) => {
              reject({
                message: multilingualService.getResponseMessage("ERRMSG", lang),
              });
            });
        });
    });
  }

  changeAvailability(data, driverId, lang) {
    return new Promise(async (done, reject) => {
      model.driver
        .findByIdAndUpdate(
          driverId,
          { isAvailable: data.isAvailable },
          { new: true }
        )
        .select("+authToken")
        .then((result) => {
          done({ data: result });
        });
    });
  }

  rateUser(data, lang, driverId) {
    return new Promise(async (done, reject) => {
      let rating = new model.driverRating(data);
      rating.driverId = driverId;
      rating.date = moment().valueOf();

      rating
        .save()
        .then((result) => {
          let qryModel;
          if (data.verticalType === 0) {
            qryModel = model.restaurantOrder.findByIdAndUpdate(
              data.orderId,
              { userRating: data.rating },
              { new: true }
            );
          } else if (data.verticalType === 1) {
            qryModel = model.storeOrder.findByIdAndUpdate(
              data.orderId,
              { userRating: data.rating },
              { new: true }
            );
          }
          qryModel.then((order) => {
            done({ message: Constant.RATEDMSG });
          });
        })
        .catch((err) => {
          return reject({ message: Constant.FALSEMSG });
        });
    });
  }

  addPathImage(data, file, lang, driverId, finalFileName) {
    return new Promise(async (done, reject) => {
      if (!file) return reject({ message: Constant.FILEMSG });
      let qryModel;
      if (data.verticalType == 0)
        qryModel = model.restaurantOrder.findByIdAndUpdate(
          data.orderId,
          // { path: Constant.PATHIMAGES + file.filename },
          { path: process.env.S3URL + finalFileName },
          { new: true }
        );
      else if (data.verticalType == 1)
        qryModel = model.storeOrder.findByIdAndUpdate(
          data.orderId,
          // { path: Constant.PATHIMAGES + file.filename },
          { path: process.env.S3URL + finalFileName },
          { new: true }
        );
      else if (data.verticalType == 2)
        qryModel = model.taxiBooking.findByIdAndUpdate(
          data.orderId,
          // { path: Constant.PATHIMAGES + file.filename },
          { path: process.env.S3URL + finalFileName },
          { new: true }
        );

      qryModel
        .then((result) => {
          done({ message: Constant.UPDATEMSG });
        })
        .catch((err) => {
          return reject({ message: Constant.FALSEMSG });
        });
    });
  }

  getDriverOrders(data, lang, driverId) {
    return new Promise(async (done, reject) => {
      let skip =
        Number(data.page) > 1 ? (Number(data.page) - 1) * Constant.LIMIT : 0;
      let qryModel;
      let qryModel1;
      let qry = { driverId: driverId, status: { $in: [4, 6] } };
      if (data.filter == 0)
        qry.date = { $gte: moment().startOf("day").valueOf() };
      else if (data.filter == 1)
        qry.date = { $gte: moment().startOf("week").add(1, "day").valueOf() };
      else if (data.filter == 2)
        qry.date = { $gte: moment().startOf("month").valueOf() };
      else if (data.filter == 3)
        qry.date = { $gte: moment().startOf("year").valueOf() };

      if (data.verticalType == 1) {
        if (data.type == 0) {
          qryModel = model.restaurantOrder
            .find(qry)
            .sort("-_id")
            .skip(skip)
            .limit(Constant.LIMIT);
          qryModel1 = model.restaurantOrder.countDocuments(qry);
        } else {
          qryModel = model.storeOrder
            .find(qry)
            .populate("storeId")
            .sort("-_id")
            .skip(skip)
            .limit(Constant.LIMIT);
          qryModel1 = model.storeOrder.countDocuments(qry);
        }

        qryModel = qryModel
          .populate("outletId", "address latitude longitude")
          .populate("userId", "firstName lastName profilePic countryCode phone")
          .populate("items.itemId", "name image")
          .select("-driverId");
      } else if (data.verticalType == 2) {
        qryModel = model.taxiBooking
          .find(qry)
          .populate("userId", "firstName lastName profilePic countryCode phone")
          .select("-driverId")
          .sort("-_id")
          .skip(skip)
          .limit(Constant.LIMIT);
        qryModel1 = model.taxiBooking.countDocuments(qry);
      } else if (data.verticalType == 3) {
        delete qry.driverId;
        qry.status = 2;
        qry.driver = driverId;
        qryModel = model.trip
          .find(qry)
          .populate(
            "startPoint endPoint stopPoints.coordinates",
            "address coordinates"
          )
          .populate("shuttleId")
          .select("-driverId")
          .sort("-_id")
          .skip(skip)
          .limit(Constant.LIMIT);
        qryModel1 = model.trip.countDocuments(qry);
      }

      qryModel
        .then((result) => {
          qryModel1.then((count) => {
            done({
              message: multilingualService.getResponseMessage(
                "FETCHED_SUCCESSFULLY",
                lang
              ),
              data: {
                bookings: result,
                count: Math.ceil(count / Constant.LIMIT),
              },
            });
          });
        })
        .catch((err) => {
          return reject({
            message: multilingualService.getResponseMessage("FALSEMSG", lang),
          });
        });
    });
  }

  getMultiRequestDriverOrders(data, lang, driverId) {
    return new Promise(async (done, reject) => {
      let skip = Number(data.page) > 1 ? (Number(data.page) - 1) * Constant.LIMIT : 0;
      let qryModel;
      let qryModel1;
      let qry = { driverId: driverId, status: { $in: [1, 2, 3, 4, 6] } };
      if (data.filter == 0)
        qry.date = { $gte: moment().startOf("day").valueOf() };
      else if (data.filter == 1)
        qry.date = { $gte: moment().startOf("week").add(1, "day").valueOf() };
      else if (data.filter == 2)
        qry.date = { $gte: moment().startOf("month").valueOf() };
      else if (data.filter == 3)
        qry.date = { $gte: moment().startOf("year").valueOf() };

      if (data.verticalType == 1) {
        if (data.type == 0) {
          qryModel = model.restaurantOrder
            .find(qry)
            .sort("-_id")
            .skip(skip)
            .limit(Constant.LIMIT);
          qryModel1 = model.restaurantOrder.countDocuments(qry);
        } else {
          qryModel = model.storeOrder
            .find(qry)
            .populate("storeId")
            .sort("-_id")
            .skip(skip)
            .limit(Constant.LIMIT);
          qryModel1 = model.storeOrder.countDocuments(qry);
        }
        qryModel = qryModel
          .populate("outletId", "address latitude longitude")
          .populate("userId", "firstName lastName profilePic countryCode phone")
          .populate("items.itemId", "name image productName")
          .select("-driverId");
      } else if (data.verticalType == 2) {
        qryModel = model.taxiBooking
          .find(qry)
          .populate("userId", "firstName lastName profilePic countryCode phone")
          .select("-driverId")
          .sort("-_id")
          .skip(skip)
          .limit(Constant.LIMIT);
        qryModel1 = model.taxiBooking.countDocuments(qry);
      } else if (data.verticalType == 3) {
        delete qry.driverId;
        qry.status = 2;
        qry.driver = driverId;
        qryModel = model.trip
          .find(qry)
          .populate(
            "startPoint endPoint stopPoints.coordinates",
            "address coordinates"
          )
          .populate("shuttleId")
          .select("-driverId")
          .sort("-_id")
          .skip(skip)
          .limit(Constant.LIMIT);
        qryModel1 = model.trip.countDocuments(qry);
      }

      qryModel
        .then((result) => {
          qryModel1.then((count) => {
            done({
              message: multilingualService.getResponseMessage(
                "FETCHED_SUCCESSFULLY",
                lang
              ),
              data: {
                bookings: result,
                count: Math.ceil(count / Constant.LIMIT),
              },
            });
          });
        })
        .catch((err) => {
          return reject({
            message: multilingualService.getResponseMessage("FALSEMSG", lang),
          });
        });
    });
  }

  getDriverEarning(data, lang, driverId) {
    return new Promise(async (done, reject) => {
      let skip =
        Number(data.page) > 1 ? (Number(data.page) - 1) * Constant.LIMIT : 0;
      let qryModel;
      let qryModel1;
      let qry = { driverId: driverId, status: { $in: [4, 6] } };
      if (data.filter == 0)
        qry.date = { $gte: moment().startOf("day").valueOf() };
      else if (data.filter == 1)
        qry.date = { $gte: moment().startOf("week").add(1, "day").valueOf() };
      else if (data.filter == 2)
        qry.date = { $gte: moment().startOf("month").valueOf() };
      else if (data.filter == 3)
        qry.date = { $gte: moment().startOf("year").valueOf() };

      if (data.verticalType == 1) {
        if (data.type == 0) {
          qryModel = model.restaurantOrder
            .find(qry)
            .populate("userId", "firstName lastName profilePic")
            .select("orderNo totalAmount status date")
            .sort("-_id")
            .skip(skip)
            .limit(Constant.LIMIT);
          qryModel1 = model.restaurantOrder
            .find(qry)
            .select("driverCommission");
        } else {
          qryModel = model.storeOrder
            .find(qry)
            .populate("userId", "firstName lastName profilePic")
            .select("orderNumber totalAmount status date driverCommission")
            .sort("-_id")
            .skip(skip)
            .limit(Constant.LIMIT);
          qryModel1 = model.storeOrder
            .find(qry)
            .select("driverCommission totalAmount");
        }
      }



      else if (data.verticalType == 2) {
        qryModel = model.taxiBooking.find(qry)
          .populate('userId', 'firstName lastName profilePic')
          .select('taxiOrderNo totalAmount status date bookingType userFirstName userLastName')
          .sort('-_id').skip(skip).limit(Constant.LIMIT)
        qryModel1 = model.taxiBooking.find(qry).select('totalAmount')

      }
      else if (data.verticalType == 3) {
        delete qry.driverId
        qry.driver = driverId
        qry.status = 2
        qryModel = model.trip.find(qry)
          .select('tripNo totalAmount status date name')
          .sort('-_id').skip(skip).limit(Constant.LIMIT)
        qryModel1 = model.trip.find(qry).select('totalAmount')
      }
      qryModel
        .then((result) => {
          qryModel1.then((result1) => {
            let driverCommission = 0;
            let totalAmount = 0;
            let totaltaxiCollection = 0;
            result1.map((val) => {
              driverCommission += Number(val.driverCommission);
              totalAmount += Number(val.totalAmount);
              totaltaxiCollection += Number(val.totalAmount);
            });
            done({
              message: multilingualService.getResponseMessage(
                "FETCHED_SUCCESSFULLY",
                lang
              ),
              data: {
                bookings: result,
                total: driverCommission,
                totalCollection: totalAmount,
                totalTaxiAmount: Math.round(totaltaxiCollection * 100) / 100,
                count: Math.ceil(result1.length / Constant.LIMIT),
              },
            });
          });
        })
        .catch((err) => {
          if (err.errors)
            return reject({ message: Service.Handler.mongoErrorHandler(err) });

          return reject({
            message: multilingualService.getResponseMessage("FALSEMSG", lang),
          });
        });
    });
  }

  async getDriverNotificationById(data) {
    return await model.driverNotification.findById(data.id);
  }

  getAllNotifications(data, driverId, lang) {
    return new Promise(async (done, reject) => {
      let skip =
        Number(data.page) > 1 ? (Number(data.page) - 1) * Constant.LIMIT : 0;

      model.driverNotification
        .find({ driverId: driverId })
        .then(async (result) => {
          result = result.map((item) => {
            if (item.data && typeof item.data.storeId == "object") {
              item.data.storeId = item.data.storeId._id;
            }
            return item;
          });
          model.driverNotification
            .countDocuments({ driverId: driverId })
            .then(async (count) => {
              if (!Number(data.page) || Number(data.page) == 1)
                await model.driverNotification.update(
                  { driverId: driverId, status: 0 },
                  { status: 1 },
                  { multi: true }
                );
              done({
                message: multilingualService.getResponseMessage(
                  "FETCHED_SUCCESSFULLY",
                  lang
                ),
                data: {
                  notiList: result,
                  count: Math.ceil(count / Constant.LIMIT),
                },
              });
            });
        })
        .catch((err) => {
          reject({
            message: multilingualService.getResponseMessage("ERRMSG", lang),
          });
        });
    });
  }

  notificationById(data, lang) {
    return new Promise((done, reject) => {
      model.driverNotification.findOne({ _id: mongoose.Types.ObjectId(data.notificationId) })
        .then((result) => {
          done({ data: result });
        })
        .catch((err) => {
          return reject({
            message: multilingualService.getResponseMessage("FALSEMSG", lang),
          });
        });
    });
  }

  forgotPassword(data,lang) {
    return new Promise(async (done, reject) => {
      const phone = data.phone;
      if (!phone) {
        return reject({ message: multilingualService.getResponseMessage("PARAMETERMISSING", lang), });
      }
      let user = await model.driver.findOne({
        phone: data.phone,
        countryCode: data.countryCode,
      });
      if (!user) {
        return reject({ message: multilingualService.getResponseMessage("USERNOTFOUND", lang), });
      }
      else if(data.fireOtp == false)   // if fireOtp false it means otp send from front end
      {
                done({ 
                  message : Constant.SUCCESSCODE,
                  data : {success : true} })
      } 
      else {
        const otpData = await model.Otp.findOne({ user: data.phone });
        if (otpData) await model.Otp.deleteMany({ user: data.phone });

        const Otp = await model.Otp({
          otp: Math.floor(1000 + Math.random() * 9000),
          phone: data.phone,
          countryCode: data.body,
        }).save();

        await Service.selectOtpServiceAndSend.send(data.countryCode,data.phone, Otp.otp)
        done({
          message: multilingualService.getResponseMessage("FORGOTPASSWORDSENDSUCCESSFULLY", lang),
          data: { otpId: Otp._id, otp: Otp.otp },
        });
      }
    });
  }
  async getDocumentList(req, res,next){
    try {
      let documentList = await model.document.find({
        isDeleted: false,
        userType : Constant.USER_TYPE.DRIVER
      })
      let count = await model.document.countDocuments({
        isDeleted: false,
        userType : Constant.USER_TYPE.DRIVER
      })
      return multilingualService.sendResponse(
        req,
        res,
        true,
        1,
        0,
        responseMessages.TRUEMSG,
        {documentList, count}
      );
    } catch (error) {
      next(error)
    }
  }
}

export default driverController;
