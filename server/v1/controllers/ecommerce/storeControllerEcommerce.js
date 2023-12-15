import model from "../../../models/index";
import Constant from "../../../constant";
const Service = require("../../../services");
import moment from "moment";
const {
  customAlphabet
} = require("nanoid");
import mongoose, {
  ObjectId
} from "mongoose";
import {
  concatSeries
} from "async";
import {
  JsonWebTokenError
} from "jsonwebtoken";
import multilingualService from "../../../services/multilingualService";
import userController from "../userController";
import {
  assignWith
} from "lodash";
import {
  KeyInstance
} from "twilio/lib/rest/api/v2010/account/key";
import storeValidation from "./storeValidationEcommerce";
import storeOtps from "./storeOtpEcommerce";
const _ = require("lodash");
let userRepo = new userController();
let storeOtp = new storeOtps();
// const ObjectId = mongoose.Types.ObjectId;
import {
  responseMessages
} from "../languages/english";
class storeEcommerceController {
  async login(req, res, next) {
    try {
      await storeValidation.validateLogIn(req);
      let lang = req.headers.language;
      let planPassword = req.body.password;
      delete req.body.password;
      let qry = {};

      if ((req.body.key && (await storeOtp.isEmail(req.body.key))) || req.body.email) {
        qry.email = req.body.key;
      } else if ((req.body.key && (await storeOtp.isPhone(req.body.key))) || req.body.phone) {
        qry.phone_no = req.body.key;
        if (req.body.countryCode) {
          qry.countryCode = req.body.countryCode;
        }
      }
      let user = await model.storeEcommerce.findOne(qry, {
        hash: 1,
      });
      if (!user) {
        let employe = await model.employee
          .findOne({
            email: qry.email,
          })
          .select("password");
        if (employe) {
          if ((await Service.HashService.decrypt(employe.password)) !== planPassword)
            return res.reject(multilingualService.getResponseMessage("INVALIDPARAMS", lang));

          let update = {
            authToken: Service.JwtService.issue({
              _id: employe._id,
            }),
          };
          employe = await model.employee
            .findOneAndUpdate({
                _id: mongoose.Types.ObjectId(employe._id),
              },
              setObj
            )
            .lean();
          employe = await model.employee
            .findByIdAndUpdate(employe._id, update, {
              new: true,
            })
            .select("+authToken");
          return res.success("OK", employe);
        }

        return res.reject(multilingualService.getResponseMessage("INVALIDCRED", lang));
      }
      if (Service.HashService.decrypt(user.hash) !== planPassword) return res.reject(multilingualService.getResponseMessage("INVALIDCRED", lang));

      let setObj = {
        deviceType: req.body.deviceType,
        deviceToken: req.body.deviceToken,
      };

      user = await model.store
        .findOneAndUpdate({
            _id: mongoose.Types.ObjectId(user._id),
          },
          setObj
        )
        .lean();
      if ((user.verificationType == 0 && user.isPhoneVerified) || (user.verificationType == 1 && user.isEmailVerified)) {
        let update = {
          authToken: Service.JwtService.issue({
            _id: user._id,
          }),
        };
        let data = await model.store
          .findByIdAndUpdate(user._id, update, {
            new: true,
          })
          .select("+authToken");
        data.role = "merchant";
        return res.success("OK", data);
      }
      if ((await storeOtp.isEmail(req.body.key)) && !user.isEmailVerified) {
        storeOtp.resendOtpIfExpire(null, req.body.key, user ? user.firstName : "");
      } else if (!user.isPhoneVerified) {
        storeOtp.resendOtpIfExpire(req.body.countryCode, req.body.key);
      }
      return res.success("OK", user);
    } catch (error) {
      next(error);
    }
  }

  async setPassword(req, res, next) {
    try {
      await storeValidation.validateChangePassword(req, "body", req.originalUrl.includes("setPassword"));
      await model.storeEcommerce.findByIdAndUpdate(req.user._id, {
        $set: {
          hash: await Service.HashService.encrypt(req.body.password),
        },
      });
      return res.success("OK");
    } catch (error) {
      next(error);
    }
  }

  async uploadDocument(req, files, res, next) {
    try {
      let ownerId;
      let ownerAddress;
      let resturantCertificate;
      let resturantAddress;
      if (files.ownerId) ownerId = files.ownerId[0].location;
      if (files.ownerAddress) ownerAddress = files.ownerAddress[0].location;
      if (files.resturantCertificate) resturantCertificate = files.resturantCertificate[0].location;
      if (files.resturantAddress) resturantAddress = files.resturantAddress[0].location;
      let store = await model.storeEcommerce.findByIdAndUpdate(
        req.query.store, {
          $set: {
            ownerId: ownerId,
            ownerAddress: ownerAddress,
            resturantCertificate: resturantCertificate,
            resturantAddress: resturantAddress,
          },
        }, {
          new: true,
        }
      );
      return res.success("OK", store);
    } catch (error) {
      next(error);
    }
  }

  async getStoresUploadedDocuments(req, res, next) {
    try {
      let store = await model.storeEcommerce.findByIdAndUpdate(req.query.id);
      return res.success("OK", store);
    } catch (error) {
      next(error);
    }
  }

  async verifyDocuments(req, res, next) {
    try {
      await storeValidation.statusChange(req);
      let type = req.body.type;
      let store;
      if (type === "ownerIdStatus") {
        store = await model.storeEcommerce.findByIdAndUpdate(
          req.body.id, {
            $set: {
              ownerIdStatus: req.body.status,
            },
          }, {
            new: true,
          }
        );
      } else if (type === "ownerAddressStatus") {
        store = await model.storeEcommerce.findByIdAndUpdate(
          req.body.id, {
            $set: {
              ownerAddressStatus: req.body.status,
            },
          }, {
            new: true,
          }
        );
      } else if (type === "resturantCertificateStatus") {
        store = await model.storeEcommerce.findByIdAndUpdate(
          req.body.id, {
            $set: {
              resturantCertificateStatus: req.body.status,
            },
          }, {
            new: true,
          }
        );
      } else if (type === "resturantAddressStatus") {
        store = await model.storeEcommerce.findByIdAndUpdate(
          req.body.id, {
            $set: {
              resturantAddressStatus: req.body.status,
            },
          }, {
            new: true,
          }
        );
      } else if (type === "All") {
        store = await model.storeEcommerce.findByIdAndUpdate(
          req.body.id, {
            $set: {
              documentStatus: req.body.status,
            },
          }, {
            new: true,
          }
        );
      }
      return res.success("OK", store);
    } catch (error) {
      next(error);
    }
  }

  async signup(req, res, next) {
    try {
      await storeValidation.validateSignUp(req);
      let lang = req.headers.language;
      if (!req.body.email && !req.body.phone) {
        return res.reject(multilingualService.getResponseMessage("EMAIL_OR_PHONE_REQUIRED", lang));
      }
      let find_store;
      if (req.body.email) {
        find_store = await model.storeEcommerce.findOne({
          email: req.body.email.toLowerCase(),
        });
        if (find_store) {
          return res.reject(multilingualService.getResponseMessage("EMAILEXISTS", lang));
        }
      }
      if (req.body.phone) {
        find_store = await model.storeEcommerce.findOne({
          phone_no: req.body.phone,
        });
        if (find_store) {
          return res.reject(multilingualService.getResponseMessage("PHONEEXISTS", lang));
        }
      }
      const nanoid = customAlphabet("1234567890abcdef", 10);
      req.body.myReferralCode = nanoid();
      req.body.hash = Service.HashService.encrypt(req.body.password);
      req.body.phone_no = req.body.phone;
      find_store = await model.storeEcommerce.create(req.body);
      if (data.applyReferralCode) {
        const isUserReferrel = await model.user.findOne({
          referralCode: data.applyRefrelCode
        })
        const isMerchant = await model.storeEcommerce.findOne({
          myReferrelCode: data.applyReferrelCode
        })
        const isDriver = await model.driver.findOne({
          referralCode: data.applyRefrelCode
        })
        const moneyToSend = await model.Referrel.findOne({})
        if (isUserReferral) {
          isUserReferrel.walletAmount = isUserReferrel.walletAmount + moneyToSend.customerToMerchant
          isUserReferrel.save()
        }
        if (isMerchant) {
          isMerchant.earnings = isMerchant.earnings + moneyToSend.merchantToMerchant
          isMerchant.save()
        }
        if (isDriver) {
          isDriver.earnings = isDriver.earnings + moneyToSend.driverToMerchant
          isDriver.save()
        }
      }
      if (req.body.email && req.body.verificationType == 1) {
        await storeOtp.generateEmailVerification(req.body.email, null, null, "1234");
      }

      if (req.body.phone && req.body.verificationType == 0) {
        await storeOtp.generatePhoneOtp(req.body.country_code, req.body.phone, null, "1234");
      }
      let resObj = {
        email: find_store.email,
        phone_no: find_store.phone,
        _id: find_store._id,
      };
      return res.success("OK", resObj);
    } catch (error) {
      next(error);
    }
  }

  async resendOtp(req, res, next) {
    let lang = req.headers.language;
    if ((req.body.key && (await storeOtp.isEmail(req.body.key))) || req.body.email) {
      let email = req.body.key || req.body.email;
      let user;
      if (req.body.id) {
        user = await model.storeEcommerce.findById(mongoose.Types.ObjectId(req.body.id));
        email = user.email;
      }

      let otp = await storeOtp.generateEmailVerification(email, user, user ? user.firstName : "", "1234");
      if (!otp) {
        return res.reject(multilingualService.getResponseMessage("PARAMETERMISSING", lang));
      }
    } else if ((req.body.key && (await storeOtp.isPhone(req.body.key))) || req.body.phone) {
      let phone = req.body.key || req.body.phone;
      let country_code = req.body.country_code;
      let user;
      if (req.body.id) {
        user = await model.storeEcommerce.findById(mongoose.Types.ObjectId(req.body.id));
        phone = user.phone_no;
        country_code = user.country_code;
      }
      let otp = await storeOtp.generatePhoneOtp(country_code, phone, user, "1234");
      if (!otp) {
        return res.reject(multilingualService.getResponseMessage("PARAMETERMISSING", lang));
      }
    } else {
      return res.reject(multilingualService.getResponseMessage("PARAMETERMISSING", lang));
    }
    return res.success("OK");
  }

  async resetPassword(req, res, next) {
    let lang = req.headers.language;
    if ((req.body.key && storeOtp.isEmail(req.body.key)) || req.body.email) {
      let email = req.body.key || req.body.email;
      let user = await model.storeEcommerce.findOne({
        email: email.toLowerCase(),
      });
      if (!user) {
        return res.reject(multilingualService.getResponseMessage("NOTREGISTEREDEMAIL", lang));
      }
      let otp = await storeOtp.generateEmailVerification(user.email, null, user ? user.firstName : "", "1234");
      if (!otp) {
        return res.reject(multilingualService.getResponseMessage("PARAMETERMISSING", lang));
      }
      return res.success("OK", {
        verificationType: 1,
      });
    } else if ((req.body.key && storeOtp.isPhone(req.body.key)) || req.body.phone) {
      let phone = req.body.key || req.body.phone;
      let user = await model.storeEcommerce.findOne({
        phone_no: phone,
      });
      if (!user) {
        return res.reject(multilingualService.getResponseMessage("NOACCOUNTMSG", lang));
      }
      let otp = await storeOtp.generatePhoneOtp(user.country_code, user.phone_no, null, "1234");
      if (!otp) {
        return res.reject(multilingualService.getResponseMessage("PARAMETERMISSING", lang));
      }
      return res.success("OK", {
        verificationType: 0,
      });
    } else {
      return res.reject(multilingualService.getResponseMessage("PARAMETERMISSING", lang));
    }
  }

  async verifyOtp(req, res, next) {
    let lang = req.headers.language;
    if (req.body.key && (await storeOtp.isEmail(req.body.key))) {
      req.body.email = req.body.key;
      let otp = await storeOtp.verifyEmailCode(req.body.email, req.body.code, true, null);
      if (!otp) {
        return res.reject(multilingualService.getResponseMessage("NOTREGISTEREDEMAIL", lang));
      }
      let qry = {
        email: req.body.email,
      };

      let resultUser = await model.storeEcommerce.findOneAndUpdate(qry, {
        isEmailVerified: true,
        email: req.body.email,
      });
      let update = {
        authToken: Service.JwtService.issue({
          _id: resultUser._id,
        }),
      };
      let data = await model.store
        .findByIdAndUpdate(resultUser._id, update, {
          new: true,
        })
        .select("+authToken");
      return res.success("OK", data);
    } else if (req.body.key && storeOtp.isPhone(req.body.key)) {
      req.body.phone = req.body.key;
      let otp = await storeOtp.verifyPhoneOtp(req.body.country_code, req.body.phone, req.body.code, true, null);
      if (!otp) {
        return res.reject(multilingualService.getResponseMessage("INVALID_OTP", lang));
      }
      let qry = {
        phone_no: req.body.phone,
      };
      if (req.body.country_code) {
        qry.country_code = req.body.country_code;
      }
      let resultUser = await model.storeEcommerce.findOneAndUpdate(qry, {
        isPhoneVerified: true,
        phone_no: req.body.phone,
        country_code: req.body.country_code,
      });
      if (!resultUser) {
        return res.reject(multilingualService.getResponseMessage("USERNOTFOUND", lang));
      }
      let update = {
        authToken: Service.JwtService.issue({
          _id: resultUser._id,
        }),
      };
      let data = await model.store
        .findByIdAndUpdate(resultUser._id, update, {
          new: true,
        })
        .select("+authToken");
      return res.success("OK", data);
    } else {
      return res.reject(multilingualService.getResponseMessage("PARAMETERMISSING", lang));
    }
  }

  async notifications(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const skip = Math.max(0, (req.query.page << 0) - 1) * limit;
      let pipeline = [];
      // pipeline.push({ $match: { storeId : mongoose.Types.ObjectId("6057052e5dfadb35f2b6b927") } });
      pipeline.push({
        $match: {
          storeId: req.query.store,
        },
      });
      //   pipeline.push({ $match: { storeId: mongoose.Types.ObjectId(req.query.store) } });
      if (req.query.filter) {
        if (req.query.filter && req.query.filter === "Delivery") {
          pipeline.push({
            $match: {
              message: /Deliver/,
            },
          });
        } else if (req.query.filter === "Pickup") {
          pipeline.push({
            $match: {
              message: /Pickup/,
            },
          });
        } else if (req.query.filter === "Complete") {
          pipeline.push({
            $match: {
              message: /Complete/,
            },
          });
        } else if (req.query.filter === "Cancel") {
          pipeline.push({
            $match: {
              message: /Cancel/,
            },
          });
        } else if (req.query.filter === "Payment") {
          pipeline.push({
            $match: {
              message: /Payment/,
            },
          });
        }
      }
      let data = await model.notification.aggregate(pipeline);
      let count = data.length;
      pipeline.push({
        $skip: skip,
      }, {
        $limit: limit,
      });
      data = await model.notification.aggregate(pipeline);
      return res.success("OK", {
        totalCount: count,
        count: data.length,
        data: data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRatingReview(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const skip = Math.max(0, (req.query.page << 0) - 1) * limit;
      let pipeline = [];
      pipeline.push({
        $match: {
          storeId: mongoose.Types.ObjectId(req.query.id),
        },
      });
      pipeline.push({
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      }, {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: false,
        },
      });
      if (req.query.userId) {
        pipeline.push({
          $match: {
            "user._id": mongoose.Types.ObjectId(req.query.userId),
          },
        });
      }
      pipeline.push({
        $project: {
          orderId: 1,
          rating: 1,
          review: 1,
          createdAt: 1,
          "user._id": 1,
          "user.profilePic": 1,
          "user.firstName": 1,
          "user.lastName": 1,
          rating_date: {
            $dateToString: {
              format: "%d-%m-%Y",
              date: "$createdAt",
            },
          },
        },
      });
      let data = await model.storeRating.aggregate(pipeline);
      let count = data.length;
      pipeline.push({
        $skip: skip,
      }, {
        $limit: limit,
      });
      data = await model.storeRating.aggregate(pipeline);
      let user = await model.storeRating.aggregate([{
          $match: {
            storeId: mongoose.Types.ObjectId(req.query.id),
          },
        },
        {
          $group: {
            _id: {
              userId: null,
            },
            count: {
              $sum: 1,
            },
          },
        },
      ]);
      let totalRating = await model.storeRating.aggregate([{
          $match: {
            storeId: mongoose.Types.ObjectId(req.query.id),
          },
        },
        {
          $group: {
            _id: {
              userId: null,
            },
            count: {
              $sum: "$rating",
            },
          },
        },
      ]);
      let ratingUserCout = 0;
      let ratingTotal = 0;
      let averageRating = 0;
      if (user[0]) {
        ratingUserCout = user[0].count;
      }
      if (totalRating[0]) {
        ratingTotal = totalRating[0].count;
      }
      if (ratingUserCout == 0 && ratingUserCout == 0) {
        averageRating = 0;
      } else {
        averageRating = Number(ratingTotal / ratingUserCout).toFixed(1);
      }

      var one = 0;
      var two = 0;
      var th = 0;
      var four = 0;
      var five = 0;
      let oneGroup = await model.storeRating.aggregate([{
          $match: {
            storeId: mongoose.Types.ObjectId(req.query.id),
          },
        },
        {
          $match: {
            rating: {
              $gt: 0,
              $lte: 1,
            },
          },
        },
        {
          $group: {
            _id: null,
            Count: {
              $sum: 1,
            },
          },
        },
      ]);
      if (oneGroup.length > 0) {
        one = oneGroup[0].Count;
      }
      let twoGroup = await model.storeRating.aggregate([{
          $match: {
            storeId: mongoose.Types.ObjectId(req.query.id),
          },
        },
        {
          $match: {
            rating: {
              $gt: 1,
              $lte: 2,
            },
          },
        },
        {
          $group: {
            _id: null,
            Count: {
              $sum: 1,
            },
          },
        },
      ]);
      if (twoGroup.length > 0) {
        two = twoGroup[0].Count;
      }
      let thGroup = await model.storeRating.aggregate([{
          $match: {
            storeId: mongoose.Types.ObjectId(req.query.id),
          },
        },
        {
          $match: {
            rating: {
              $gt: 2,
              $lte: 3,
            },
          },
        },
        {
          $group: {
            _id: null,
            Count: {
              $sum: 1,
            },
          },
        },
      ]);
      if (thGroup.length > 0) {
        th = thGroup[0].Count;
      }
      let fourGroup = await model.storeRating.aggregate([{
          $match: {
            storeId: mongoose.Types.ObjectId(req.query.id),
          },
        },
        {
          $match: {
            rating: {
              $gt: 3,
              $lte: 4,
            },
          },
        },
        {
          $group: {
            _id: null,
            Count: {
              $sum: 1,
            },
          },
        },
      ]);
      if (fourGroup.length > 0) {
        four = fourGroup[0].Count;
      }
      let fiveGroup = await model.storeRating.aggregate([{
          $match: {
            storeId: mongoose.Types.ObjectId(req.query.id),
          },
        },
        {
          $match: {
            rating: {
              $gt: 4,
              $lte: 5,
            },
          },
        },
        {
          $group: {
            _id: null,
            Count: {
              $sum: 1,
            },
          },
        },
      ]);
      if (fiveGroup.length > 0) {
        five = fiveGroup[0].Count;
      }
      //   if (AllData) {
      //     for (let i = 0; i < AllData.length; i++) {
      //         const row = AllData[i];
      //         const rate = row.rating;
      //         if (rate <=1) {
      //             one = Number(one) + Number(rate)
      //         } else if (rate <=2) {
      //             two = Number(two) + Number(rate)
      //         } else if (rate <=3) {
      //             th = Number(th) + Number(rate)
      //         } else if (rate <=4) {
      //             four = Number(four) + Number(rate)
      //         } else if (rate <=5) {
      //             five = Number(five) + Number(rate)
      //         }
      //     }
      //   }
      //   if(one > 0){
      //     one = one / AllData.length
      //   }
      //   if(two > 0){
      //     two = two / AllData.length
      //   }
      //   if(th > 0){
      //     th = th / AllData.length
      //   }
      //   if(four > 0){
      //     four = four / AllData.length
      //   }
      //   if(five > 0){
      //     five = five / AllData.length
      //   }
      return res.success("OK", {
        totalCount: count,
        count: data.length,
        ratingUser: ratingUserCout,
        averageRating: averageRating,
        // oneAvg : one,
        // twoAvg : two,
        // thrdAvg : th,
        // fourAvg : four,
        // fiveAvg : five,
        oneCount: one,
        twoCount: two,
        thrdCount: th,
        fourCount: four,
        fiveCount: five,
        data: data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEarningList(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const skip = Math.max(0, (req.query.page << 0) - 1) * limit;
      let pipeline = [];
      pipeline.push({
        $match: {
          _id: req.user._id,
        },
      });
      pipeline.push({
        $match: {
          paidAmount: {
            $gt: 0,
          },
        },
      }, {
        $project: {
          name: 1,
          paidAmount: 1,
          image: 1,
          updatedAt: 1,
          createdAt: 1,
          isVisible: 1,
          earning_date: {
            $dateToString: {
              format: "%d-%m-%Y",
              date: "$updatedAt",
            },
          },
        },
      }, {
        $sort: {
          updatedAt: -1,
        },
      });
      let data = await model.storeEcommerce.aggregate(pipeline);
      let count = data.length;

      pipeline.push({
        $skip: skip,
      }, {
        $limit: limit,
      });
      data = await model.storeEcommerce.aggregate(pipeline);

      return res.success("OK", {
        totalCount: count,
        count: data.length,
        data: data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getNewStore(req, res, next) {
    try {
      let filter = {};
      let pipeline = [];
      // if(req.query.modkey) filter.moduleKey = req.query.modkey;
      // if(req.query.geofenceid !="NA") filter.geofenceId =  req.headers.geofenceid;
      // filter.storeTypeId =  {$eq : null}
      if (req.query.modkey) {
        pipeline.push({
          $match: {
            moduleKey: req.query.modkey,
          },
        });
      }
      if (req.query.geofenceid != "NA") {
        pipeline.push({
          $match: {
            geofenceId: mongoose.Types.ObjectId(req.headers.geofenceid),
          },
        });
      }
      pipeline.push({
        $match: {
          storeTypeId: {
            $eq: null,
          },
        },
      });
      let orders = await model.storeEcommerce.aggregate(pipeline);
      // let orders = await model.storeEcommerce.find(filter);
      return res.success("OK", orders);
    } catch (error) {
      next(error);
    }
  }

  async getGeoFenceList(req, res, next) {
    try {
      let geofence = await model.geoFence.find({
        isDeleted: false,
        zoneId: req.query.zoneId,
      });
      return res.success("OK", geofence);
    } catch (error) {
      next(error);
    }
  }
  async getZoneList(req, res, next) {
    try {
      let zones = await model.zone.find({
        isDeleted: false,
      });
      return res.success("OK", zones);
    } catch (error) {
      next(error);
    }
  }

  async addExtraTimeOrder(req, res, next) {
    try {
      let lang = req.headers.language;
      let order = await model.storeOrderEcommerce.findOne({
        _id: req.body.orderId,
      });
      if (!order) {
        return res.reject(multilingualService.getResponseMessage("ORDERNOTFOUND", lang));
      }
      let time = (Number.isNaN(Number(order.preprationTime)) ? 0 : Number(order.preprationTime)) + Number.parseInt(req.body.time);
      order = await model.storeOrderEcommerce.findOneAndUpdate({
        _id: req.body.orderId,
      }, {
        $set: {
          preprationTime: time,
        },
      }, {
        New: true,
      });
      return res.success("OK", order);
    } catch (error) {
      next(error);
    }
  }

  async getGeoFenceList(req, res, next) {
    try {
      let geofence = await model.geoFence.find({
        isDeleted: false,
        zoneId: req.query.zoneId,
      });
      return res.success("OK", geofence);
    } catch (error) {
      next(error);
    }
  }

  async getZoneList(req, res, next) {
    try {
      let zones = await model.zone.find({
        isDeleted: false,
      });
      return res.success("OK", zones);
    } catch (error) {
      next(error);
    }
  }

  async areaWiseSale(req, res, next) {
    try {
      let lang = req.headers.language;
      let pipeline = [];
      pipeline.push({
        // $geoNear: {
        //   near: { type: "Point", coordinates: [parseFloat(data.longitude),parseFloat(data.latitude)] },
        // near: { type: "Point", coordinates: [parseFloat("address.longitude"),parseFloat("address.latitude")] },
        //   key: "location",
        //   distanceField: "calculatedRange",
        //   minDistance: 0.0,
        // distanceMultiplier: 1e-3,
        // maxDistance: Constant.RADIUSCIRCLE,
        //   spherical: true
        // }
      });
      let data = await model.storeOrderEcommerce.aggregate(pipeline);
      return res.success("OK", data);
    } catch (error) {
      next(error);
    }
  }

  async selfDelivery(req, res, next) {
    try {
      let lang = req.headers.language;
      let order = await model.storeOrderEcommerce.findOne({
        _id: mongoose.Types.ObjectId(req.body.id),
      });
      if (!order) {
        return res.reject(multilingualService.getResponseMessage("ORDERNOTFOUND", lang));
      }
      if (req.body.type !== 1) {
        return res.reject(multilingualService.getResponseMessage("INVALIDSTATUS", lang));
      }
      let data = await model.storeOrderEcommerce.findByIdAndUpdate({
        _id: mongoose.Types.ObjectId(req.body.id),
      }, {
        $set: {
          orderType: 1,
        },
      }, {
        new: true,
      });

      return res.success("OK", data);
    } catch (error) {
      next(error);
    }
  }

  async orderStatusChage(req, res, next) {
    try {
      let lang = req.headers.language;
      let order = await model.storeOrderEcommerce.findOne({
        _id: mongoose.Types.ObjectId(req.body.id),
      });
      if (!order) {
        return res.reject(multilingualService.getResponseMessage("ORDERNOTFOUND", lang));
      }
      if (req.body.status > 6) {
        return res.reject(multilingualService.getResponseMessage("INVALIDSTATUS", lang));
      }
      let data = await model.storeOrderEcommerce.findByIdAndUpdate({
        _id: mongoose.Types.ObjectId(req.body.id),
      }, {
        $set: {
          status: req.body.status,
        },
      }, {
        new: true,
      });
      return res.success("Status updated successfully", data);
    } catch (error) {
      next(error);
    }
  }

  async getCategoryWiseOrder(req, res, next) {
    try {
      let pipeline = [];
      if (req.query.id) {
        pipeline.push({
          $match: {
            storeId: req.query.id,
          },
        });
      }
      pipeline.push({
        $lookup: {
          from: "stores",
          localField: "storeId",
          foreignField: "_id",
          as: "store",
        },
      }, {
        $unwind: {
          path: "$store",
          preserveNullAndEmptyArrays: true,
        },
      }, {
        $group: {
          _id: "$store.storeTypeId",
          count: {
            $sum: 1,
          },
        },
      }, {
        $lookup: {
          from: "storecategories",
          localField: "_id",
          foreignField: "_id",
          as: "storeCategory",
        },
      }, {
        $unwind: {
          path: "$storeCategory",
          preserveNullAndEmptyArrays: true,
        },
      });
      let data = await model.storeOrderEcommerce.aggregate(pipeline);
      return res.success("OK", data);
    } catch (error) {
      next(error);
    }
  }

  async getEarningGraph(req, res, next) {
    try {
      let days = [{
          day: "Mo",
          name: "M",
        },
        {
          day: "Tu",
          name: "T",
        },
        {
          day: "We",
          name: "W",
        },
        {
          day: "Th",
          name: "T",
        },
        {
          day: "Fr",
          name: "F",
        },
        {
          day: "Sa",
          name: "S",
        },
        {
          day: "Su",
          name: "S",
        },
      ];
      let months = [{
          month: "01",
          name: "Jan",
        },
        {
          month: "02",
          name: "Fab",
        },
        {
          month: "03",
          name: "Mar",
        },
        {
          month: "04",
          name: "Apr",
        },
        {
          month: "05",
          name: "May",
        },
        {
          month: "06",
          name: "Jun",
        },
        {
          month: "07",
          name: "Jul",
        },
        {
          month: "08",
          name: "Aug",
        },
        {
          month: "09",
          name: "Sep",
        },
        {
          month: "10",
          name: "Oct",
        },
        {
          month: "11",
          name: "Nov",
        },
        {
          month: "12",
          name: "Dec",
        },
      ];
      let dataToSend = [];
      let pipeline = [];
      if (req.query.type === "weekly") {
        pipeline.push({
          $match: {
            updatedAt: {
              $gte: new Date(moment().startOf("week").add(1, "d")),
              $lte: new Date(moment().endOf("week").add(1, "d")),
            },
          },
        });
      } else if (req.query.type === "monthly") {
        pipeline.push({
          $match: {
            updatedAt: {
              $gte: new Date(moment().startOf("year")),
              $lte: new Date(moment().endOf("year")),
            },
          },
        });
      }
      pipeline.push({
        $group: {
          _id: null,
          total: {
            $sum: "$paidAmount",
          },
        },
      });
      let totalSale = await model.storeEcommerce.aggregate(pipeline);

      let pipelineEarning = [];
      if (req.query.type === "weekly") {
        pipelineEarning.push({
          $match: {
            updatedAt: {
              $gte: new Date(moment().startOf("week").add(1, "d")),
              $lte: new Date(moment().endOf("week").add(1, "d")),
            },
          },
        }, {
          $group: {
            _id: {
              $dateToString: {
                format: "%d",
                date: "$updatedAt",
              },
            },
            date: {
              $first: "$updatedAt",
            },
            totalAmount: {
              $sum: "$paidAmount",
            },
          },
        });
        let weakData = await model.storeEcommerce.aggregate(pipelineEarning);
        let finalWeekData = [];
        for (let i = 0; i < weakData.length; i++) {
          finalWeekData.push({
            day: moment(weakData[i].date).format("dd"),
            totalAmount: weakData[i].totalAmount,
          });
        }
        for (let i = 0; i < days.length; i++) {
          let obj = _.find(finalWeekData, {
            day: days[i].day,
          });
          if (obj) {
            dataToSend.push({
              name: days[i].name,
              totalAmount: obj.totalAmount,
            });
          } else {
            dataToSend.push({
              name: days[i].name,
              totalAmount: 0,
            });
          }
        }
      } else if (req.query.type === "monthly") {
        pipelineEarning.push({
          $match: {
            updatedAt: {
              $gte: new Date(moment().startOf("year")),
              $lte: new Date(moment().endOf("year")),
            },
          },
        }, {
          $group: {
            _id: {
              $dateToString: {
                format: "%m",
                date: "$updatedAt",
              },
            },
            month: {
              $first: {
                $dateToString: {
                  format: "%m",
                  date: "$updatedAt",
                },
              },
            },
            totalAmount: {
              $sum: "$paidAmount",
            },
          },
        });
        let monthData = await model.storeEcommerce.aggregate(pipelineEarning);
        for (let i = 0; i < months.length; i++) {
          let obj = _.find(monthData, {
            month: months[i].month,
          });
          if (obj) {
            dataToSend.push({
              name: months[i].name,
              totalAmount: obj.totalAmount,
            });
          } else {
            dataToSend.push({
              name: months[i].name,
              totalAmount: 0,
            });
          }
        }
      }

      let pipeline_user = [];
      pipeline.push({
        $match: {
          storeId: req.user._id,
        },
      });
      pipeline_user.push({
        $match: {
          totalAmount: {
            $gt: 0,
          },
        },
      }, {
        $match: {
          status: 4,
        },
      }); // delivered
      if (req.query.type === "monthly") {
        pipeline_user.push({
          $match: {
            updatedAt: {
              $gte: new Date(moment().startOf("year")),
              $lte: new Date(moment().endOf("year")),
            },
          },
        });
      } else if (req.query.type === "weekly") {
        pipeline_user.push({
          $match: {
            updatedAt: {
              $gte: new Date(moment().startOf("week").add(1, "d")),
              $lte: new Date(moment().endOf("week").add(1, "d")),
            },
          },
        });
      }
      pipeline_user.push({
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      }, {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: false,
        },
      }, {
        $addFields: {
          fullName: {
            $concat: ["$user.firstName", " ", "$user.lastName"],
          },
        },
      }, {
        $project: {
          "user.profilePic": 1,
          fullName: 1,
          orderNumber: 1,
          totalAmount: 1,
        },
      });
      let user_earning = await model.storeOrderEcommerce.aggregate(pipeline_user);

      let data = {
        totalEarning: totalSale,
        // totalEarning:totalEarning,
        earning: dataToSend,
        user_order: user_earning,
      };
      return res.success("OK", data);
    } catch (error) {
      next(error);
    }
  }

  async storeSubscription(data) {
    return new Promise(async (done, reject) => {
      try {
        const qry = {};
        qry.subscription = data.subscription;
        let saved;
        if (data.admin && data.admin == true) {
          qry.adminId = data.adminId;
          saved = await model.webSubscription.findOneAndUpdate({
              adminId: data.adminId,
            },
            qry, {
              upsert: true,
            }
          );
        } else {
          qry.storeId = data.storeId;
          saved = await model.webSubscription.findOneAndUpdate({
              storeId: mongoose.Types.ObjectId(data.storeId),
            },
            qry, {
              upsert: true,
            }
          );
        }
        done({
          data: {
            subscription: saved,
          },
        });
      } catch (err) {
        reject({
          message: err,
        });
      }
    });
  }

  getStoreCouponList(lang) {
    return new Promise(async (done, reject) => {
      try {
        let storeIds = await model.storeItemsEcommerce.find({}).distinct("storeId");
        let storePromoCodesList = await model.promocode
          .find({
            storeId: {
              $in: storeIds,
            },
          })
          .exec();

        const message =
          storePromoCodesList.length <= 0 ?
          multilingualService.getResponseMessage("EMPTY_LIST", lang) :
          multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang);

        return done({
          message: message,
          data: storePromoCodesList,
        });
      } catch (e) {
        return reject({
          message: e,
        });
      }
    });
  }

  getCategoryCouponList(lang) {
    return new Promise(async (done, reject) => {
      try {
        let categoryIds = await model.storeItemsEcommerce.find({}).distinct("storeItemTypeId");
        let categoryPromoCodesList = await model.promocode
          .find({
            categoryId: {
              $in: categoryIds,
            },
          })
          .exec();

        const message =
          categoryPromoCodesList.length <= 0 ?
          multilingualService.getResponseMessage("EMPTY_LIST", lang) :
          multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang);

        return done({
          message: message,
          data: categoryPromoCodesList,
        });
      } catch (e) {
        return reject({
          message: e,
        });
      }
    });
  }

  getSubCategoryCouponList(lang) {
    return new Promise(async (done, reject) => {
      try {
        let subCategoryIds = await model.storeItemsEcommerce.find({}).distinct("storeItemSubTypeId");
        let subCategoryPromoCodesList = await model.promocode
          .find({
            subCategoryId: {
              $in: subCategoryIds,
            },
          })
          .exec();

        const message =
          subCategoryPromoCodesList.length <= 0 ?
          multilingualService.getResponseMessage("EMPTY_LIST", lang) :
          multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang);

        return done({
          message: message,
          data: subCategoryPromoCodesList,
        });
      } catch (e) {
        return reject({
          message: e,
        });
      }
    });
  }

  getBrandCouponList(lang) {
    return new Promise(async (done, reject) => {
      try {
        let brandIds = await model.storeItemsEcommerce.find({}).distinct("brandId");
        let brandPromoCodesList = await model.promocode
          .find({
            brandId: {
              $in: brandIds,
            },
          })
          .exec();

        const message =
          brandPromoCodesList.length <= 0 ?
          multilingualService.getResponseMessage("EMPTY_LIST", lang) :
          multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang);

        return done({
          message: message,
          data: brandPromoCodesList,
        });
      } catch (e) {
        return reject({
          message: e,
        });
      }
    });
  }

  getProductCouponList(lang) {
    return new Promise(async (done, reject) => {
      try {
        let itemIds = await model.storeItemsEcommerce.find({}).distinct("productKey");
        let itemPromoCodesList = await model.promocode
          .find({
            productId: {
              $in: itemIds,
            },
          })
          .exec();

        const message =
          itemPromoCodesList.length <= 0 ?
          multilingualService.getResponseMessage("EMPTY_LIST", lang) :
          multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang);

        return done({
          message: message,
          data: itemPromoCodesList,
        });
      } catch (e) {
        return reject({
          message: e,
        });
      }
    });
  }

  getProductDealsList(lang) {
    return new Promise(async (done, reject) => {
      try {
        let itemIds = await model.storeItemsEcommerce.find({}).distinct("_id");
        let itemDealsList = await model.promocode
          .find({
            productId: {
              $in: itemIds,
            },
            code: "DEAL",
          })
          .exec();

        const message =
          itemDealsList.length <= 0 ?
          multilingualService.getResponseMessage("EMPTY_LIST", lang) :
          multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang);

        return done({
          message: message,
          data: itemDealsList,
        });
      } catch (e) {
        return reject({
          message: e,
        });
      }
    });
  }

  async getCouponsByStore(storeId) {
    let storeItemTypes = model.storeItem
      .find({
        storeId,
      })
      .distinct("storeItemTypeId")
      .exec();
    let storeItemSubTypes = model.storeItem
      .find({
        storeId,
      })
      .distinct("storeItemSubTypeId")
      .exec();
    let brands = await model.storeItem
      .find({
        storeId,
      })
      .distinct("brandId")
      .exec();
    let store = await model.store
      .findOne({
        _id: storeId,
      })
      .exec();
    let resp = await Promise.all([storeItemTypes, storeItemSubTypes, brands, store]);
    storeItemTypes = resp[0];
    storeItemSubTypes = resp[1];
    brands = resp[2];
    let coupons = await model.promocode
      .find({
        code: {
          $ne: "DEAL",
        },
        startDate: {
          $lte: new Date(moment().startOf("date")),
        },
        endDate: {
          $gte: new Date(moment().startOf("date")),
        },
        status: {
          $in: [1, 3],
        },
        $or: [{
            categoryId: {
              $in: storeItemTypes,
            },
          },
          {
            storeId: storeId,
          },
          {
            subCategoryId: {
              $in: storeItemSubTypes,
            },
          },
          {
            brandId: {
              $in: brands,
            },
          },
        ],
      })
      .select("-brandId -categoryId -subCategoryId -brandId -usedUserId -productId -storeId -userId");

    for (const coupon of coupons) {
      coupon.banner = store.banner;
    }
    return {
      data: coupons,
    };
  }

  async getListofCouponsByProduct(data) {
    let coupons = await model.promocode
      .find({
        isProduct: true,
        productId: data.productKey,
        code: {
          $ne: "DEAL",
        },
      })
      .select("-brandId -categoryId -subCategoryId -brandId -usedUserId -productId -storeId -userId");
    return {
      data: coupons,
    };
  }
  async getListofCouponsByStore(data) {
    let coupons = await model.promocode
      .find({
        isProduct: true,
        productId: data.productKey,
      })
      .select("code name description discount");
    return {
      data: coupons,
    };
  }
  async homeRecommended(req, userId) {
    req.userId = userId;
    let data = {
      latitude: req.latitude,
      longitude: req.longitude,
      moduleKey: "",
      userId: userId,
    };
    let response = [];
    if (req.isGeofenceActive && (req.isGeofenceActive == true || req.isGeofenceActive == "true")) {
      data.isGeofenceActive = true;
      const geofenceData = await findGeofenceId(data.longitude, data.latitude);
      if (geofenceData != null || geofenceData != undefined) {
        data.geofenceId = geofenceData._id;
      } else data.geofenceId = null;
    }
    for (let i = 0; i < req.moduleKeys.length; i++) {
      data.moduleKey = req.moduleKeys[i];
      let recommended = await this.getRecommendedStores(data, 0, 7);
      let obj = {
        moduleKey: data.moduleKey,
        list: recommended,
      };
      response.push(obj);
    }
    return {
      message: Constant.TRUEMSG,
      data: response,
    };
  }
  async homeData(data, userId, lang, user) {
    try {
      return new Promise(async (done, reject) => {
        let startTime = new Date().getTime();
        let currentDate = new Date();
        data.userId = userId;
        let saved = this.getSavedStores(data, 0, 5);
        /***********BRANDS*****************/
        let storeItemBrandIds;
        if (data.isGeofenceActive && (data.isGeofenceActive == true || data.isGeofenceActive == "true")) {
          const geofenceData = await findGeofenceId(data.longitude, data.latitude);
          if (geofenceData != null || geofenceData != undefined) {
            data.geofenceId = geofenceData._id;
          } else data.geofenceId = null;
        }
        let qry = {
          status: {
            $ne: 2,
          },
        };
        if (data.moduleKey) {
          qry.moduleKey = data.moduleKey;
        }
        if (data.isGeofenceActive) qry.geofenceId = data.geofenceId;
        storeItemBrandIds = await model.storeItemsEcommerce.find(qry).distinct("brandId");
        let storeBrands;
        qry = {
          $and: [{
              status: {
                $ne: 2,
              },
            },
            {
              status: {
                $ne: 0,
              },
            },
            {
              _id: {
                $in: storeItemBrandIds,
              },
            },
          ],
        };
        if (data.moduleKey) {
          qry.$and.push({
            moduleKey: data.moduleKey,
          });
        }
        if (data.isGeofenceActive) {
          qry.$and.push({
            geofenceId: data.geofenceId,
          });
        }
        storeBrands = model.brand.find(qry).lean().exec();
        let deals = [];
        qry = {
          code: "DEAL",
          status: 3,
          $and: [{
              startDate: {
                $lte: currentDate,
              },
            },
            {
              endDate: {
                $gte: currentDate,
              },
            },
          ],
        };
        if (data.moduleKey) {
          qry.$and.push({
            moduleKey: data.moduleKey,
          });
        }
        if (data.isGeofenceActive) qry.geofenceId = mongoose.Types.ObjectId(data.geofenceId);
        deals = await model.promocode.find(qry).exec();
        let outlets = [],
          outlet = {};
        for (let i = 0; i < deals.length; i++) {
          outlet = await model.storeOutletsEcommerce.findOne({
            storeId: deals[i].store,
            status: 1,
            location: {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
                },
                $maxDistance: Constant.RADIUSCIRCLE,
              },
            },
          });
          // if (outlet) outlets.push(outlet);
          // if (outlets.length == 0) {
          if (!outlet) {
            deals.splice(i, 1);
            // } else outlets.pop();
          }
        }

        // let outlets = model.storeOutletsEcommerce.

        /*********************BEST OFFERS****** */
        let bestOffers = this.getBestOffers(data, 0, 5);

        /****************************RECOMMENDED*********** */
        let recommended = this.getRecommendedStores(data, 0, 5);

        /***************************************NOTIFICATION ***********/
        let notiCount = this.notiUnreadCount(userId);

        /**********************************STORETYPES LIST **************/

        // I WAS TRYING TO REMOVE THE FOR LOOP FOR HYPERLOCAL
        //PLEASE DONT DELETE THE COMMENTED CODE BEL0W -ADHISH

        // let storeTypes = await model.storeCategory
        //   .aggregate([
        //     { $match: { $expr: { $eq: ["$isVisible", true] } } },
        //     { $match: { $expr: { $in: ["$status", [1, 3]] } } },
        //     {
        //       $lookup: {
        //         from: "stores",
        //         let: { storeTypeId: "$_id" },
        //         pipeline: [
        //           {
        //             $match: {
        //               storeTypeId: storeTypes[i]._id,
        //               $and: [{ status: { $ne: 2 } }, { status: { $ne: 3 } }],
        //               isVisible: true,
        //             },
        //           },
        //           {
        //             $lookup: {
        //               from: "storeoutlets",
        //               let: { storeId: "$_id" },
        //               pipeline: [
        //                 {
        //                   $geoNear: {
        //                     near: {
        //                       type: "Point",
        //                       coordinates: [
        //                         parseFloat(data.longitude),
        //                         parseFloat(data.latitude),
        //                       ],
        //                     },
        //                     distanceField: "distance",
        //                     spherical: true,
        //                     distanceMultiplier: 1e-3,
        //                     maxDistance: Constant.RADIUSCIRCLE,
        //                   },
        //                 },
        //                 {
        //                   $match: {
        //                     $expr: { $eq: ["$storeId", "$$storeId"] },
        //                   },
        //                 },
        //                 { $match: { $expr: { $eq: ["$status", 1] } } },
        //               ],
        //               as: "storeOutlets",
        //             },
        //           },
        //           {
        //             $project: {
        //               _id: 1,
        //               storeOutlets_size: { $size: "$storeOutlets" },
        //               storeOutlets: 1,
        //             },
        //           },
        //           {
        //             $match: {
        //               $and: [{ storeOutlets_size: { $gte: 1 } }],
        //             },
        //           },
        //         ],
        //         as: "stores",
        //       },
        //     },
        //     {
        //       $project: {}, // here store types project with storeSize leanght of stores
        //     },
        //     {
        //       $match: {}, // here storeSize greater than one
        //     },
        //   ])
        //   .lean();
        let storeTypes;
        qry = {
          $and: [{
              status: {
                $ne: 2,
              },
            },
            {
              status: {
                $ne: 0,
              },
            },
            // { isVisible: true }
          ],
        };
        if (data.moduleKey) {
          qry.$and.push({
            moduleKey: data.moduleKey,
          });
        }
        if (data.isGeofenceActive) {
          qry.$and.push({
            geofenceId: data.geofenceId,
          });
        }
        storeTypes = model.storeCategoryEcommerce.find(qry).lean().exec();
        // let storeTypes = model.storeCategory
        //   .find({
        //     $and: [
        //       { status: { $ne: 2 } },
        //       { status: { $ne: 0 } },
        //       { isVisible: true },
        //       { moduleType: data.moduleType }
        //     ],
        //   })
        //   .lean()
        //   .exec();

        // let storeTypes = await model.storeCategoryEcommerce.find().lean();

        let recommendedProducts = this.getRecommendedProducts(data, user, {});
        let result = await Promise.all([saved, bestOffers, recommended, notiCount, storeTypes, recommendedProducts, deals, storeBrands]);

        saved = result[0];
        bestOffers = result[1];
        recommended = result[2];
        notiCount = result[3];
        storeTypes = result[4];
        recommendedProducts = result[5];
        deals = result[6];
        storeBrands = result[7];
        let emptyStoreTypesIndices = [];

        for (let i = 0; i < storeTypes.length; i++) {
          //if (storeTypes[i].isHyperLocal) {
          let store = await model.storeEcommerce.aggregate([{
              $match: {
                storeTypeId: storeTypes[i]._id,
                $and: [{
                    status: {
                      $ne: 2,
                    },
                  },
                  {
                    status: {
                      $ne: 3,
                    },
                  },
                ],
                isVisible: true,
              },
            },
            {
              $lookup: {
                from: "storeoutlets",
                let: {
                  storeId: "$_id",
                },
                pipeline: [{
                    $geoNear: {
                      near: {
                        type: "Point",
                        coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
                      },
                      distanceField: "distance",
                      spherical: true,
                      distanceMultiplier: 1e-3,
                      maxDistance: Constant.RADIUSCIRCLE,
                    },
                  },
                  {
                    $match: {
                      $expr: {
                        $eq: ["$storeId", "$$storeId"],
                      },
                    },
                  },
                  {
                    $match: {
                      $expr: {
                        $eq: ["$status", 1],
                      },
                    },
                  },
                ],
                as: "storeOutlets",
              },
            },
            {
              $project: {
                _id: 1,
                storeOutlets_size: {
                  $size: "$storeOutlets",
                },
                storeOutlets: 1,
              },
            },
            {
              $match: {
                $and: [{
                  storeOutlets_size: {
                    $gte: 1,
                  },
                }, ],
              },
            },
          ]);
          if (store[0]) {
            storeTypes[i]["hyperLocalStoreId"] = store[0]._id;
          } else {
            //THIS IS THE CASE WHEN
            // HYPELOCAL IS ON BUT NO STORE NEAR BY
            emptyStoreTypesIndices.push(i);
          }
          // } else {
          //   storeTypes[i]["hyperLocalStoreId"] = "";
          // }
        }

        for (let k = emptyStoreTypesIndices.length - 1; k >= 0; k--) storeTypes.splice(emptyStoreTypesIndices[k], 1);
        done({
          data: {
            storeType: storeTypes,
            saved: saved,
            deals: deals,
            bestOffers: bestOffers,
            recommended: recommended,
            notiCount: notiCount,
            recommendedProducts,
            brands: [],
          },
        });
      });
    } catch (error) {
      console.log("Error----------->", error);
    }
  }

  notiUnreadCount(userId) {
    return model.notification.countDocuments({
      userId: userId,
      status: 0,
      verticalType: 1,
    });
  }

  // async getSavedStores(data, skip, limit) {
  //     let fav;
  //     if (data.moduleKey) {
  //         fav = await model.favStore.find({
  //             userId: data.userId,
  //             moduleKey: data.moduleKey,
  //         });
  //     } else {
  //         fav = await model.favStore.find({ userId: data.userId });
  //     }
  //     // fav =
  //     // let fav = await model.favStore.find({ userId: data.userId });
  //     if (!fav.length) return [];

  //     let Arr = [];
  //     fav.map((val) => {
  //         Arr.push(mongoose.Types.ObjectId(val.storeId));
  //     });

  //     saved = result[0];
  //     bestOffers = result[1];
  //     recommended = result[2];
  //     notiCount = result[3];
  //     storeTypes = result[4];
  //     recommendedProducts = result[5];
  //     deals = result[6];
  //     storeBrands = result[7];
  //     let emptyStoreTypesIndices = [];
  //     // console.log(new Date().getTime() - startTime, "recommended");

  //     for (let i = 0; i < storeTypes.length; i++) {
  //       // console.log(storeTypes, "<<<<<<<<<<<<");
  //       //if (storeTypes[i].isHyperLocal) {
  //         let store = await model.storeEcommerce.aggregate([
  //             {
  //               $match: {
  //                 storeTypeId: storeTypes[i]._id,
  //                 $and: [{ status: { $ne: 2 } }, { status: { $ne: 3 } }],
  //                 isVisible: true,
  //               },
  //             },
  //             {
  //               $lookup: {
  //                 from: "storeoutlets",
  //                 let: { storeId: "$_id" },
  //                 pipeline: [
  //                   {
  //                     $geoNear: {
  //                       near: {
  //                         type: "Point",
  //                         coordinates: [
  //                           parseFloat(data.longitude),
  //                           parseFloat(data.latitude),
  //                         ],
  //                       },
  //                       distanceField: "distance",
  //                       spherical: true,
  //                       distanceMultiplier: 1e-3,
  //                       maxDistance: Constant.RADIUSCIRCLE,
  //                     },
  //                   },
  //                   {
  //                     $match: {
  //                       $expr: { $eq: ["$storeId", "$$storeId"] },
  //                     },
  //                   },
  //                   { $match: { $expr: { $eq: ["$status", 1] } } },
  //                 ],
  //                 as: "storeOutlets",
  //               },
  //             },
  //             {
  //               $project: {
  //                 _id: 1,
  //                 storeOutlets_size: { $size: "$storeOutlets" },
  //                 storeOutlets: 1,
  //               },
  //             },
  //             {
  //               $match: {
  //                 $and: [{ storeOutlets_size: { $gte: 1 } }],
  //               },
  //             },
  //           ]);

  //           // console.log(store, ">>>>>>>>>>>>>>>>>");
  //           // console.log(JSON.stringify(store));
  //           // console.log("6515151sd5a1s5d1sa5d13asd1sa2d1as321dsad1sa23d1sasda", store[0]._id);
  //           if (store[0]) {
  //             storeTypes[i]["hyperLocalStoreId"] = store[0]._id;
  //           } else {
  //             //THIS IS THE CASE WHEN
  //             // HYPELOCAL IS ON BUT NO STORE NEAR BY
  //             emptyStoreTypesIndices.push(i);
  //           }
  //         // } else {
  //         //   storeTypes[i]["hyperLocalStoreId"] = "";
  //         // }
  //       }

  //     //   else {
  //         // storeTypes[i]["hyperLocalStoreId"] = "";
  //     //   }

  // }
  async getSavedStores(data, skip, limit) {
    let fav;
    if (data.moduleKey) {
      fav = await model.favStore.find({
        userId: data.userId,
        moduleKey: data.moduleKey,
      });
    } else {
      fav = await model.favStore.find({
        userId: data.userId,
      });
    }
    // fav =
    // let fav = await model.favStore.find({ userId: data.userId });
    if (!fav.length) return [];
    let Arr = [];
    fav.map((val) => {
      Arr.push(mongoose.Types.ObjectId(val.storeId));
    });
    /*********FILTERING LOGIC*********** */
    let sortBy = "ratings";
    let sortType = 1;
    if (data.sortBy) sortBy = data.sortBy; //
    if (data.sortType === "descending") sortType = -1;
    let ratingFilter = {
      ratings: {
        $gte: 0,
        $lte: 5,
      },
    };
    if (data.rating) {
      data.rating = Number(data.rating);
      ratingFilter = {
        ratings: {
          $gte: data.rating,
          $lt: data.rating + 1,
        },
      };
    }
    let priceFilter = {
      avgOrderPrice: {
        $gte: -1,
      },
    };
    if (data.minPrice && data.maxPrice) {
      data.minPrice = Number(data.minPrice);
      data.maxPrice = Number(data.maxPrice);
      priceFilter = {
        avgOrderPrice: {
          $gte: data.minPrice,
          $lte: data.maxPrice,
        },
      };
    }
    let sort = {};
    sort[sortBy] = sortType;
    let pipeline = [{
        $match: {
          _id: {
            $in: Arr,
          },
          $and: [{
              status: {
                $ne: 2,
              },
            },
            {
              status: {
                $ne: 3,
              },
            },
          ],
          isVisible: true,
          isHyperLocal: false,
        },
      },
      {
        $lookup: catLookup,
      },
      {
        $lookup: ratingLookup,
      },
      {
        $lookup: await this.favLookup(data.userId),
      },
      {
        $lookup: await this.outletLookup(data),
      },
      // { $skip: skip },
      // { $limit: limit },
      {
        $project: project,
      },
      {
        $match: {
          outletSize: {
            $gte: 1,
          },
        },
      },
      {
        $sort: sort,
      },
      {
        $match: ratingFilter,
      },
      {
        $match: priceFilter,
      },
    ];
    if (data.newSort == "popularity")
      pipeline.push({
        $lookup: {
          from: "storeorders",
          let: {
            storeId: "$_id",
          },
          pipeline: [{
            $match: {
              $expr: {
                $eq: ["$storeId", "$$storeId"],
              },
            },
          }, ],
          as: "storeOrder",
        },
      }, {
        $unwind: {
          path: "$storeOrder",
          preserveNullAndEmptyArrays: true,
        },
      }, {
        $group: {
          _id: "$_id",
          orderCount: {
            $sum: 1,
          },
        },
      }, {
        $sort: {
          orderCount: -1,
        },
      });
    const beforeSevenDays = new Date(new Date() - 7 * 60 * 60 * 24 * 1000).toISOString();
    const today = new Date().toISOString();
    if (data.newSort == "newFirst")
      pipeline.push({
        $lookup: {
          from: "storeitems",
          let: {
            storeId: "$_id",
          },
          pipeline: [{
            $match: {
              $expr: {
                $eq: ["$storeId", "$$storeId"],
              },
            },
          }, ],
          as: "storeItems",
        },
      }, {
        $unwind: {
          path: "$storeItems",
          preserveNullAndEmptyArrays: true,
        },
      }, {
        $group: {
          _id: "$_id",
          createdAt: {
            $first: "$storeItems.createdAt",
          },
        },
      }, {
        $match: {
          $and: [{
              createdAt: {
                $lte: today,
              },
            },
            {
              createdAt: {
                $gte: beforeSevenDays,
              },
            },
          ],
        },
      }, {
        $sort: {
          createdAt: -1,
        },
      });
    /*************************** FILTERING LOGIC END***************** */
    return await model.storeEcommerce.aggregate(pipeline).exec();
  }
  async getNearByOutlets(data) {
    if (data.isGeofenceActive && (data.isGeofenceActive == true || data.isGeofenceActive == "true")) {
      let geofenceData = await findGeofenceId(data.longitude, data.latitude);
      if (geofenceData) data.geofenceId = geofenceData._id;
    }
    let qry = {
      _id: mongoose.Types.ObjectId(data.storeId),
    };
    if (data.isGeofenceActive) qry.geofenceId = data.geofenceId;
    let outlets = await model.storeEcommerce.aggregate([{
        $match: qry,
      },
      {
        $lookup: this.outletLookup(data),
      },
    ]);
    return {
      data: {
        store: outlets[0],
      },
    };
  }

  // async getRedeemOptions(data) {
  //   let user = await model.user.findById(data.id);
  //   let option = [];
  //   let earnedLP = user.earnedLP;
  //   let i = 1;
  //   while (earnedLP >= 500) {
  //     option.push(500 * i);
  //     earnedLP -= 500;
  //     i++;
  //   }

  //   if (option.length == 0) {
  //     throw new Error("Not Enough Loyalty Points Minimum " + 500 + "required");
  //   }
  //   return { data: option };
  // }

  async getRedeemOptions(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        let user = await model.user
          .findOne({
            _id: data.userId,
          })
          .lean()
          .exec();
        let availableLP = user.availableLP || 0;
        let wallet = 0;
        let appData = await model.AppSetting.findOne({}).lean().exec();
        if (availableLP === 0) {
          reject({
            message: "Sorry! You dont have enough loyalty point in your account for redeem",
          });
        }

        wallet += (availableLP * appData.loyalityPointsValue).toFixed(2);
        await model.user
          .findOneAndUpdate({
            _id: data.userId,
          }, {
            $inc: {
              wallet: wallet,
            },
          })
          .exec();
        await model.user
          .findOneAndUpdate({
            _id: data.userId,
          }, {
            $inc: {
              totalLPSpent: availableLP,
            },
          })
          .exec();
        await model.user
          .findOneAndUpdate({
            _id: data.userId,
          }, {
            $set: {
              availableLP: 0,
            },
          })
          .exec();
        await model
          .Transaction({
            userId: data.userId,
            transactionType: "redeemLoyalityPoints",
            amount: wallet,
            creditDebitType: "credit",
          })
          .save();
        let userDetails = await model.user
          .findOne({
            _id: data.userId,
          })
          .lean()
          .exec();
        done({
          message: "Congratulations loyalty points are redeemed to your wallet",
          data: userDetails,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  async getStoresByProduct(data) {
    let stores = await model.storeItem
      .find({
        productKey: data.id,
      })
      .distinct("storeId");
    stores = await model.store
      .aggregate([{
          $match: {
            _id: {
              $in: stores,
            },
            isOpen: true,
            // $and: [{ status: { $ne: 2 } }, { status: { $ne: 3 } }],
            // isVisible: true,
          },
        },
        {
          $lookup: catLookup,
        },
        {
          $lookup: ratingLookup,
        },
        {
          $lookup: await this.favLookup(data.userId),
        },
        {
          $lookup: await this.outletLookup(data),
        },
        {
          $project: project,
        },
        {
          $match: {
            outletSize: {
              $gte: 1,
            },
          },
        },
      ])
      .exec();
    let storeType = await model.storeCategoryEcommerce.findById(stores[0].storeTypeId);
    return {
      data: {
        isHyperLocal: storeType.isHyperLocal,
        storeTypeStores: stores,
      },
    };
  }

  async getStoresByBrand(data) {
    let stores = await model.storeItem
      .find({
        brandId: data.id,
      })
      .distinct("storeId");
    stores = await model.store
      .aggregate([{
          $match: {
            _id: {
              $in: stores,
            },
            isOpen: true,
            // $and: [{ status: { $ne: 2 } }, { status: { $ne: 3 } }],
            // isVisible: true,
          },
        },
        {
          $lookup: catLookup,
        },
        {
          $lookup: ratingLookup,
        },
        {
          $lookup: await this.favLookup(data.userId),
        },
        {
          $lookup: await this.outletLookup(data),
        },
        {
          $project: project,
        },
        {
          $match: {
            outletSize: {
              $gte: 1,
            },
          },
        },
      ])
      .exec();
    // let storeType = await model.storeCategoryEcommerce.findById(stores[0].storeTypeId);
    return {
      data: {
        // isHyperLocal: storeType.isHyperLocal,
        storeTypeStores: stores,
      },
    };
  }
  async searchNew(data) {
    let qry = {
      $exists: true,
    };
    let storeIds = [];
    if (data.latitude != null && data.longitude != null) {
      let storeIdData = await model.storeEcommerce.aggregate([{
          $lookup: {
            from: "storeoutlets",
            let: {
              storeId: "$_id",
            },
            pipeline: [{
                $geoNear: {
                  near: {
                    type: "Point",
                    coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
                  },
                  distanceField: "distance",
                  spherical: true,
                  distanceMultiplier: 1e-3,
                  maxDistance: Constant.RADIUSCIRCLE,
                },
              },
              {
                $match: {
                  $expr: {
                    $eq: ["$storeId", "$$storeId"],
                  },
                },
              },
              {
                $match: {
                  $expr: {
                    $eq: ["$status", 1],
                  },
                },
              },
            ],
            as: "storeOutlets",
          },
        },
        {
          $unwind: {
            path: "$storeOutlets",
          },
        },
        {
          $match: {
            storeOutlets: {
              $ne: [],
            },
          },
        },
        {
          $project: {
            "storeOutlets.storeId": 1,
            _id: 0,
          },
        },
      ]);
      if (storeIdData.length > 0) {
        for (const i of storeIdData) {
          if (i.storeOutlets != null && i.storeOutlets.storeId != null) {
            storeIds.push(i.storeOutlets.storeId);
          }
        }
      }
    }
    if (data.storeId) {
      qry = mongoose.Types.ObjectId(data.storeId);
    } else if (storeIds.length > 0) {
      qry = {
        $in: storeIds,
      };
    } else if (data.latitude != null && data.longitude != null) {
      qry = qry;
    }
    let products = model.storeItem
      .aggregate([{
          $match: {
            productName: {
              $regex: `^${data.search}`,
              $options: "i",
            },
            storeId: qry,
            moduleKey: data.moduleKey,
            // $or: [{ isProto: false }, { storeExclusive: true }], // this means it is in some store
          },
        },
        /* {
              $addFields: {
                storeId: "$_id"
              }
            }, */
        {
          $group: {
            _id: "$productKey",
            productName: {
              $first: "$productName",
            },
            productName_ar: {
              $first: "$productName_ar",
            },
            storeItemSubTypeId: {
              $first: "$storeItemSubTypeId",
            },
            storeItemTypeId: {
              $first: "$storeItemTypeId",
            },
            storeId: {
              $first: "$storeId",
            },
            brandId: {
              $first: "$brandId",
            },
            label: {
              $first: "$label",
            },
            createdAt: {
              $first: "$createdAt",
            },
            variants: {
              $push: {
                label: "$$ROOT.label",
                color: "$$ROOT.color",
                customizable: "$$ROOT.customizable",
                marketPrice: "$$ROOT.marketPrice",
                price: "$$ROOT.price",
                originalPrice: "$$ROOT.originalPrice",
                discount: "$$ROOT.discount",
                discountType: "$$ROOT.discountType",
                description_ar: "$$ROOT.description_ar",
                description: "$$ROOT.description",
                image1: "$$ROOT.image1",
                image2: "$$ROOT.image2",
                image3: "$$ROOT.image3",
                image4: "$$ROOT.image4",
                image5: "$$ROOT.image5",
                video: "$$ROOT.video",
                tickets: "$$ROOT.tickets",
                LP: "$$ROOT.LP",
                name_ar: "$$ROOT.name_ar",
                quantity: "$$ROOT.quantity",
                purchaseLimit: "$$ROOT.purchaseLimit",
                name: "$$ROOT.name",
                size: "$$ROOT.size",
                addOn: "$$ROOT.addOn",
                unit: "$$ROOT.unit",
                additional1: "$$ROOT.additional1",
                additional2: "$$ROOT.additional2",
                additional1_ar: "$$ROOT.additional1_ar",
                additional2_ar: "$$ROOT.additional2_ar",
                unitValue: "$$ROOT.unitValue",
                variantId: "$$ROOT.variantId",
                _id: "$$ROOT._id",
              },
            },
          },
        },
        /* {
              $set: {
                 _id: "$storeId" }
            }, */
        {
          $limit: 10,
        },
      ])
      .exec();
    let storeItemType = model.storeItem
      .aggregate([{
          $match: {
            storeId: qry,
            moduleKey: data.moduleKey,
            // $or: [{ isProto: false }, { storeExclusive: true }], // this means it is in some store
          },
        },
        {
          $group: {
            _id: "$productKey",
            productName: {
              $first: "$productName",
            },
            productName_ar: {
              $first: "$productName_ar",
            },
            storeItemSubTypeId: {
              $first: "$storeItemSubTypeId",
            },
            storeItemTypeId: {
              $first: "$storeItemTypeId",
            },
            brandId: {
              $first: "$brandId",
            },
            label: {
              $first: "$label",
            },
            createdAt: {
              $first: "$createdAt",
            },
            variants: {
              $push: {
                label: "$$ROOT.label",
                color: "$$ROOT.color",
                customizable: "$$ROOT.customizable",
                marketPrice: "$$ROOT.marketPrice",
                price: "$$ROOT.price",
                originalPrice: "$$ROOT.originalPrice",
                discount: "$$ROOT.discount",
                discountType: "$$ROOT.discountType",
                description_ar: "$$ROOT.description_ar",
                description: "$$ROOT.description",
                image1: "$$ROOT.image1",
                image2: "$$ROOT.image2",
                image3: "$$ROOT.image3",
                image4: "$$ROOT.image4",
                image5: "$$ROOT.image5",
                video: "$$ROOT.video",
                tickets: "$$ROOT.tickets",
                LP: "$$ROOT.LP",
                name_ar: "$$ROOT.name_ar",
                quantity: "$$ROOT.quantity",
                purchaseLimit: "$$ROOT.purchaseLimit",
                name: "$$ROOT.name",
                size: "$$ROOT.size",
                addOn: "$$ROOT.addOn",
                unit: "$$ROOT.unit",
                additional1: "$$ROOT.additional1",
                additional2: "$$ROOT.additional2",
                additional1_ar: "$$ROOT.additional1_ar",
                additional2_ar: "$$ROOT.additional2_ar",
                unitValue: "$$ROOT.unitValue",
                variantId: "$$ROOT.variantId",
                _id: "$$ROOT._id",
              },
            },
          },
        },
        {
          $limit: 10,
        },
        {
          $lookup: {
            from: "storeitemtypes",
            localField: "storeItemTypeId",
            foreignField: "_id",
            as: "storeItemTypeId",
          },
        },
        {
          $unwind: {
            path: "$storeItemTypeId",
          },
        },
        {
          $match: {
            "storeItemTypeId.name": {
              $regex: `^${data.search}`,
              $options: "i",
            },
          },
        },
      ])
      .exec();
    let storeItemSubType = model.storeItem
      .aggregate([{
          $match: {
            storeId: qry,
            moduleKey: data.moduleKey,
            // $or: [{ isProto: false }, { storeExclusive: true }], // this means it is in some store
          },
        },
        {
          $group: {
            _id: "$productKey",
            productName: {
              $first: "$productName",
            },
            productName_ar: {
              $first: "$productName_ar",
            },
            storeItemSubTypeId: {
              $first: "$storeItemSubTypeId",
            },
            storeItemTypeId: {
              $first: "$storeItemTypeId",
            },
            brandId: {
              $first: "$brandId",
            },
            label: {
              $first: "$label",
            },
            createdAt: {
              $first: "$createdAt",
            },
            variants: {
              $push: {
                label: "$$ROOT.label",
                color: "$$ROOT.color",
                customizable: "$$ROOT.customizable",
                marketPrice: "$$ROOT.marketPrice",
                price: "$$ROOT.price",
                originalPrice: "$$ROOT.originalPrice",
                discount: "$$ROOT.discount",
                discountType: "$$ROOT.discountType",
                description_ar: "$$ROOT.description_ar",
                description: "$$ROOT.description",
                image1: "$$ROOT.image1",
                image2: "$$ROOT.image2",
                image3: "$$ROOT.image3",
                image4: "$$ROOT.image4",
                image5: "$$ROOT.image5",
                video: "$$ROOT.video",
                tickets: "$$ROOT.tickets",
                LP: "$$ROOT.LP",
                name_ar: "$$ROOT.name_ar",
                quantity: "$$ROOT.quantity",
                purchaseLimit: "$$ROOT.purchaseLimit",
                name: "$$ROOT.name",
                size: "$$ROOT.size",
                addOn: "$$ROOT.addOn",
                unit: "$$ROOT.unit",
                additional1: "$$ROOT.additional1",
                additional2: "$$ROOT.additional2",
                additional1_ar: "$$ROOT.additional1_ar",
                additional2_ar: "$$ROOT.additional2_ar",
                unitValue: "$$ROOT.unitValue",
                variantId: "$$ROOT.variantId",
                _id: "$$ROOT._id",
              },
            },
          },
        },
        {
          $limit: 10,
        },
        {
          $lookup: {
            from: "storeitemtypes",
            localField: "storeItemSubTypeId",
            foreignField: "_id",
            as: "storeItemSubTypeId",
          },
        },
        {
          $unwind: {
            path: "$storeItemSubTypeId",
          },
        },
        {
          $match: {
            "storeItemSubTypeId.name": {
              $regex: `^${data.search}`,
              $options: "i",
            },
          },
        },
      ])
      .exec();
    let stores;
    if (data.storeId == "" || data.storeId == null)
      stores = model.store
      .find({
        _id: {
          $in: storeIds,
        },
        name: {
          $regex: `${data.search}`,
          $options: "i",
        },
        $or: [{
            isHyperLocal: false,
          },
          {
            isHyperLocal: {
              $exists: false,
            },
          },
        ],
        isOpen: true,
        moduleKey: data.moduleKey,
      })
      .limit(3)
      .exec();

    let brands = model.brand
      .aggregate([{
          $match: {
            name: {
              $regex: `${data.search}`,
              $options: "i",
            },
            moduleKey: data.moduleKey,
          },
        },
        {
          $lookup: {
            from: "storeitems",
            let: {
              brandId: "$_id",
            },
            pipeline: [{
                $match: {
                  $expr: {
                    $or: [{
                      $eq: ["$brandId", "$$brandId"],
                    }, ],
                  },
                },
              },
              {
                $project: {
                  storeId: {
                    $ifNull: ["$storeId", "Unspecified"],
                  },
                },
              },
              {
                $match: {
                  $expr: {
                    $not: {
                      $eq: ["$storeId", "Unspecified"],
                    },
                  },
                },
              },
            ],
            as: "storeitems",
          },
        },
        {
          $project: {
            name: 1,
            name_ar: 1,
            image: 1,
            _id: 1,
            items: {
              $size: "$storeitems",
            },
          },
        },
        {
          $match: {
            items: {
              $gte: 1,
            },
          },
        },
        {
          $limit: 3,
        },
      ])
      .exec();

    let response = [];
    data = await Promise.all([products, stores, brands, storeItemType, storeItemSubType]);
    products = data[0];
    brands = data[2];
    stores = data[1] ? data[1] : null;
    storeItemType = data[3];
    storeItemSubType = data[4];
    products.forEach((item) => {
      let image = "";
      let data = {};
      for (let i = 1; i <= 5; i++) {
        if (item.variants[0][`image${i}`] && item.variants[0][`image${i}`].length > 0) {
          image = item.variants[0][`image${i}`];
          break;
        }
      }
      data.name = item.productName;
      data.image = image;
      data.id = item._id;
      data.type = "product";
      data.type_ar = "arabic";
      data.name_ar = item.variants[0].name_ar;
      response.push(data);
    });
    brands.forEach((item) => {
      let data = {};
      data.name = item.name;
      data.image = item.image;
      data.id = item._id;
      data.type = "brand";
      data.name_ar = item.name_ar;
      data.type_ar = "arabic";
      response.push(data);
    });
    if (stores != null && stores.length > 0) {
      stores.forEach((item) => {
        let data = {};
        data.name = item.name;
        data.image = item.image;
        data.id = item._id;
        data.type = "store";
        data.name_ar = item.name_ar;
        data.type_ar = "arabic";
        response.push(data);
      });
    }
    if (storeItemSubType.length > 0) {
      storeItemSubType.forEach((item) => {
        let data = {};
        item = item.storeItemSubTypeId;
        data.name = item.name;
        data.image = item.image;
        data.id = item._id;
        data.type = "subCategory";
        data.name_ar = item.name_ar;
        data.type_ar = "arabic";
        response.push(data);
      });
    }
    if (storeItemType.length > 0) {
      storeItemType.forEach((item) => {
        let data = {};
        item = item.storeItemTypeId;
        data.name = item.name;
        data.image = item.image;
        data.id = item._id;
        data.type = "category";
        data.name_ar = item.name_ar;
        data.type_ar = "arabic";
        response.push(data);
      });
    }

    return {
      data: response,
    };
  }

  async searchInVendor(data) {
    let products = model.storeItem
      .aggregate([{
          $match: {
            productName: {
              $regex: `^${data.search}`,
              $options: "i",
            },
            storeId: {
              $exists: true,
            },
            // $or: [{ isProto: false }, { storeExclusive: true }], // this means it is in some store
          },
        },
        {
          $group: {
            _id: "$productKey",
            productName: {
              $first: "$productName",
            },
            productName_ar: {
              $first: "$productName_ar",
            },
            storeItemSubTypeId: {
              $first: "$storeItemSubTypeId",
            },
            storeItemTypeId: {
              $first: "$storeItemTypeId",
            },
            brandId: {
              $first: "$brandId",
            },
            label: {
              $first: "$label",
            },
            createdAt: {
              $first: "$createdAt",
            },
            variants: {
              $push: {
                label: "$$ROOT.label",
                color: "$$ROOT.color",
                customizable: "$$ROOT.customizable",
                marketPrice: "$$ROOT.marketPrice",
                price: "$$ROOT.price",
                originalPrice: "$$ROOT.originalPrice",
                discount: "$$ROOT.discount",
                discountType: "$$ROOT.discountType",
                description_ar: "$$ROOT.description_ar",
                description: "$$ROOT.description",
                image1: "$$ROOT.image1",
                image2: "$$ROOT.image2",
                image3: "$$ROOT.image3",
                image4: "$$ROOT.image4",
                image5: "$$ROOT.image5",
                video: "$$ROOT.video",
                tickets: "$$ROOT.tickets",
                LP: "$$ROOT.LP",
                name_ar: "$$ROOT.name_ar",
                quantity: "$$ROOT.quantity",
                purchaseLimit: "$$ROOT.purchaseLimit",
                name: "$$ROOT.name",
                size: "$$ROOT.size",
                addOn: "$$ROOT.addOn",
                unit: "$$ROOT.unit",
                additional1: "$$ROOT.additional1",
                additional2: "$$ROOT.additional2",
                additional1_ar: "$$ROOT.additional1_ar",
                additional2_ar: "$$ROOT.additional2_ar",
                unitValue: "$$ROOT.unitValue",
                variantId: "$$ROOT.variantId",
                _id: "$$ROOT._id",
              },
            },
          },
        },
        // {
        //   $project: {
        //     productKey: 1,
        //     productName: 1,
        //     name_ar: 1,
        //     image1: 1,
        //     image2: 1,
        //     image3: 1,
        //     image4: 1,
        //     image5: 1,
        //     _id: 1,
        //   },
        // },
        {
          $limit: 10,
        },
      ])
      .exec();

    let stores = model.store
      .find({
        name: {
          $regex: `${data.search}`,
          $options: "i",
        },
        $or: [{
            isHyperLocal: false,
          },
          {
            isHyperLocal: {
              $exists: false,
            },
          },
        ],
      })
      .limit(3)
      .exec();
    let brands = model.brand
      .aggregate([{
          $match: {
            name: {
              $regex: `${data.search}`,
              $options: "i",
            },
          },
        },
        {
          $lookup: {
            from: "storeitems",
            let: {
              brandId: "$_id",
            },
            pipeline: [{
                $match: {
                  $expr: {
                    $or: [{
                      $eq: ["$brandId", "$$brandId"],
                    }, ],
                  },
                },
              },
              {
                $project: {
                  storeId: {
                    $ifNull: ["$storeId", "Unspecified"],
                  },
                },
              },
              {
                $match: {
                  $expr: {
                    $not: {
                      $eq: ["$storeId", "Unspecified"],
                    },
                  },
                },
              },
            ],
            as: "storeitems",
          },
        },
        {
          $project: {
            name: 1,
            name_ar: 1,
            image: 1,
            _id: 1,
            items: {
              $size: "$storeitems",
            },
          },
        },
        {
          $match: {
            items: {
              $gte: 1,
            },
          },
        },
        {
          $limit: 3,
        },
      ])
      .exec();

    let response = [];
    data = await Promise.all([products, stores, brands]);
    products = data[0];
    brands = data[2];
    stores = data[1];
    products.forEach((item) => {
      let image = "";
      let data = {};
      for (let i = 1; i <= 5; i++) {
        if (item.variants[0][`image${i}`] && item.variants[0][`image${i}`].length > 0) {
          image = item.variants[0][`image${i}`];
          break;
        }
      }
      data.name = item.productName;
      data.image = image;
      data.id = item._id;
      data.type = "product";
      data.type_ar = "arabic";
      data.name_ar = item.variants[0].name_ar;

      response.push(data);
    });
    // } else {
    //   storeTypes[i]["hyperLocalStoreId"] = "";
    // }

    brands.forEach((item) => {
      let data = {};

      data.name = item.name;
      data.image = item.image;
      data.id = item._id;
      data.type = "brand";
      data.name_ar = item.name_ar;
      data.type_ar = "arabic";

      response.push(data);
    });

    stores.forEach((item) => {
      let data = {};

      data.name = item.name;
      data.image = item.image;
      data.id = item._id;
      data.type = "store";
      data.name_ar = item.name_ar;
      data.type_ar = "arabic";

      response.push(data);
    });

    return {
      data: response,
    };
  }

  async getBestOffers(data, skip, limit) {
    // let qry = { status: 1, discount: { $gt: 0 } }
    let qry = {
      $and: [{
          status: {
            $ne: 2,
          },
        },
        {
          status: {
            $ne: 3,
          },
        },
        {
          isHyperLocal: false,
        },
      ],
    };
    if (data.moduleKey) {
      qry.$and.push({
        moduleKey: data.moduleKey,
      });
    }
    if (data.isGeofenceActive == true || data.isGeofenceActive == "true") {
      qry.$and.push({
        geofenceId: data.geofenceId,
      });
    }
    /**********FILTERING LOGIC************ */
    let sortBy = "ratings";
    let sortType = 1;
    if (data.sortBy) sortBy = data.sortBy; //
    if (data.sortType === "descending") sortType = -1;

    let ratingFilter = {
      ratings: {
        $gte: 0,
        $lte: 5,
      },
    };
    if (data.rating) {
      data.rating = Number(data.rating);
      ratingFilter = {
        ratings: {
          $gte: data.rating,
          $lt: data.rating + 1,
        },
      };
    }
    let priceFilter = {
      avgOrderPrice: {
        $gte: -1,
      },
    };
    if (data.minPrice && data.maxPrice) {
      data.minPrice = Number(data.minPrice);
      data.maxPrice = Number(data.maxPrice);
      priceFilter = {
        avgOrderPrice: {
          $gte: data.minPrice,
          $lte: data.maxPrice,
        },
      };
    }
    let sort = {};
    sort[sortBy] = sortType;

    let popularityLookup = [];
    let pipeline = [{
        $match: {
          isOpen: true,
        },
      },
      {
        $match: qry,
      },
      {
        $lookup: await this.outletLookup(data),
      },
      {
        $project: preProject,
      },
      {
        $match: {
          outlet_Size: {
            $gte: 1,
          },
        },
      },
      {
        $lookup: ratingLookup,
      },
      {
        $lookup: await this.favLookup(data.userId),
      },
      // { $skip: skip },
      // { $limit: limit },
      {
        $project: project,
      },
      {
        $match: {
          outletSize: {
            $gte: 1,
          },
        },
      },
      {
        $sort: sort,
      },
      {
        $match: ratingFilter,
      },
      {
        $match: priceFilter,
      },
    ];
    if (data.newSort == "popularity")
      pipeline.push({
        $lookup: {
          from: "storeorders",
          let: {
            storeId: "$_id",
          },
          pipeline: [{
            $match: {
              $expr: {
                $eq: ["$storeId", "$$storeId"],
              },
            },
          }, ],
          as: "storeOrder",
        },
      }, {
        $unwind: {
          path: "$storeOrder",
          preserveNullAndEmptyArrays: true,
        },
      }, {
        $group: {
          _id: "$_id",
          orderCount: {
            $sum: 1,
          },
        },
      }, {
        $sort: {
          orderCount: -1,
        },
      });
    const beforeSevenDays = new Date(new Date() - 7 * 60 * 60 * 24 * 1000).toISOString();
    const today = new Date().toISOString();
    if (data.newSort == "newFirst")
      pipeline.push({
        $lookup: {
          from: "storeitems",
          let: {
            storeId: "$_id",
          },
          pipeline: [{
            $match: {
              $expr: {
                $eq: ["$storeId", "$$storeId"],
              },
            },
          }, ],
          as: "storeItems",
        },
      }, {
        $unwind: {
          path: "$storeItems",
          preserveNullAndEmptyArrays: true,
        },
      }, {
        $group: {
          _id: "$_id",
          createdAt: {
            $first: "$storeItems.createdAt",
          },
        },
      }, {
        $match: {
          $and: [{
              createdAt: {
                $lte: today,
              },
            },
            {
              createdAt: {
                $gte: beforeSevenDays,
              },
            },
          ],
        },
      }, {
        $sort: {
          createdAt: -1,
        },
      });
    /*************************** FILTERING LOGIC END***************** */

    let returnDatata = await model.storeEcommerce.aggregate(pipeline).exec();
    return returnDatata;
  }

  async getBestOffersCount(data) {
    let qry = {
      $and: [{
          status: {
            $ne: 2,
          },
        },
        {
          status: {
            $ne: 3,
          },
        },
      ],
      discount: {
        $gt: 0,
      },
      isOpen: true,
    };
    return model.store
      .aggregate([{
          $match: qry,
        },
        {
          $lookup: await this.outletLookup(data),
        },
        {
          $project: preProject,
        },
        {
          $match: {
            outlet_Size: {
              $gte: 1,
            },
          },
        },
      ])
      .exec();
  }

  async getRecommendedStores(data, skip, limit) {
    let qry = {
      $and: [{
          $and: [{
              status: {
                $ne: 2,
              },
            },
            {
              status: {
                $ne: 3,
              },
            },
          ],
        },
        {
          $and: [{
            isRecommended: 1,
          }, ],
        },
        {
          isVisible: true,
        },
        {
          isHyperLocal: false,
        },
      ],
    };
    if (data.moduleKey) {
      qry.$and.push({
        moduleKey: data.moduleKey,
      });
    }
    if (data.isGeofenceActive == true || data.isGeofenceActive == "true"){
      qry.$and.push({
        geofenceId: mongoose.Types.ObjectId(data.geofenceId),
      });
    }
    /**********FILTERING LOGIC************ */
    let sortBy = "ratings";
    let sortType = 1;
    if (data.sortBy) sortBy = data.sortBy; //
    if (data.sortType === "descending") sortType = -1;

    let ratingFilter = {
      ratings: {
        $gte: 0,
        $lte: 5,
      },
    };
    if (data.rating) {
      data.rating = Number(data.rating);
      ratingFilter = {
        ratings: {
          $gte: data.rating,
          $lt: data.rating + 1,
        },
      };
    }
    let priceFilter = {
      avgOrderPrice: {
        $gte: -1,
      },
    };
    if (data.minPrice && data.maxPrice) {
      data.minPrice = Number(data.minPrice);
      data.maxPrice = Number(data.maxPrice);
      priceFilter = {
        avgOrderPrice: {
          $gte: data.minPrice,
          $lte: data.maxPrice,
        },
      };
    }
    let sort = {};
    sort[sortBy] = sortType;
    let pipeline = [{
        $match: qry,
      },
      {
        $lookup: await this.outletLookup(data),
      },
      {
        $project: preProject,
      },
      {
        $match: {
          outlet_Size: {
            $gte: 1,
          },
        },
      },
      // { $lookup: catLookup },
      {
        $lookup: ratingLookup,
      },
      {
        $lookup: await this.favLookup(data.userId),
      },
      // { $skip: skip },
      // { $limit: limit },
      {
        $project: project,
      },
      {
        $match: {
          outletSize: {
            $gte: 1,
          },
        },
      },
      {
        $sort: sort,
      },
      {
        $match: ratingFilter,
      },
      {
        $match: priceFilter,
      },
    ];
    if (data.newSort == "popularity")
      pipeline.push({
        $lookup: {
          from: "storeorders",
          let: {
            storeId: "$_id",
          },
          pipeline: [{
            $match: {
              $expr: {
                $eq: ["$storeId", "$$storeId"],
              },
            },
          }, ],
          as: "storeOrder",
        },
      }, {
        $unwind: {
          path: "$storeOrder",
          preserveNullAndEmptyArrays: true,
        },
      }, {
        $group: {
          _id: "$_id",
          orderCount: {
            $sum: 1,
          },
        },
      }, {
        $sort: {
          orderCount: -1,
        },
      });
    const beforeSevenDays = new Date(new Date() - 7 * 60 * 60 * 24 * 1000).toISOString();
    const today = new Date().toISOString();
    if (data.newSort == "newFirst")
      pipeline.push({
        $lookup: {
          from: "storeitems",
          let: {
            storeId: "$_id",
          },
          pipeline: [{
            $match: {
              $expr: {
                $eq: ["$storeId", "$$storeId"],
              },
            },
          }, ],
          as: "storeItems",
        },
      }, {
        $unwind: {
          path: "$storeItems",
          preserveNullAndEmptyArrays: true,
        },
      }, {
        $group: {
          _id: "$_id",
          createdAt: {
            $first: "$storeItems.createdAt",
          },
        },
      }, {
        $match: {
          $and: [{
              createdAt: {
                $lte: today,
              },
            },
            {
              createdAt: {
                $gte: beforeSevenDays,
              },
            },
          ],
        },
      }, {
        $sort: {
          createdAt: -1,
        },
      });
    /*************************** FILTERING LOGIC END***************** */
    return model.storeEcommerce.aggregate(pipeline).exec();
  }

  async getRecommendedStoreCount(data) {
    let qry = {
      $and: [{
          $and: [{
              status: {
                $ne: 2,
              },
            },
            {
              status: {
                $ne: 3,
              },
            },
          ],
        },
        {
          $and: [{
            isRecommended: 1,
          }, ],
        },
      ],
    };
    return model.store
      .aggregate([{
          $match: qry,
        },
        {
          $lookup: await this.outletLookup(data),
        },
        {
          $project: preProject,
        },
        {
          $match: {
            outlet_Size: {
              $gte: 1,
            },
          },
        },
      ])
      .exec();
  }

  async getRecommendedProducts(data, user, lang) {
    if (user && user.tags && user.tags.length) {
      let product = await model.storeItemsEcommerce.aggregate([{
            $match: {
              moduleKey: data.moduleKey,
              tags: {
                $in: user.tags,
              }
            },
          },
          {
            $group: {
              _id: "$productKey",
              productName: {
                $first: "$productName",
              },
              productName_ar: {
                $first: "$productName_ar",
              },
              storeItemSubTypeId: {
                $first: "$storeItemSubTypeId",
              },
              storeItemTypeId: {
                $first: "$storeItemTypeId",
              },
              brandId: {
                $first: "$brandId",
              },
              label: {
                $first: "$label",
              },
              createdAt: {
                $first: "$createdAt",
              },
              storeId: {
                $first: "$storeId",
              },
              variants: {
                $push: {
                  label: "$$ROOT.label",
                  color: "$$ROOT.color",
                  customizable: "$$ROOT.customizable",
                  marketPrice: "$$ROOT.marketPrice",
                  price: "$$ROOT.price",
                  originalPrice: "$$ROOT.originalPrice",
                  discount: "$$ROOT.discount",
                  discountType: "$$ROOT.discountType",
                  description_ar: "$$ROOT.description_ar",
                  description: "$$ROOT.description",
                  image1: "$$ROOT.image1",
                  image2: "$$ROOT.image2",
                  image3: "$$ROOT.image3",
                  image4: "$$ROOT.image4",
                  image5: "$$ROOT.image5",
                  video: "$$ROOT.video",
                  tickets: "$$ROOT.tickets",
                  LP: "$$ROOT.LP",
                  name_ar: "$$ROOT.name_ar",
                  quantity: "$$ROOT.quantity",
                  purchaseLimit: "$$ROOT.purchaseLimit",
                  name: "$$ROOT.name",
                  size: "$$ROOT.size",
                  unit: "$$ROOT.unit",
                  addOn: "$$ROOT.addOn",
                  additional1: "$$ROOT.additional1",
                  additional2: "$$ROOT.additional2",
                  additional1_ar: "$$ROOT.additional1_ar",
                  additional2_ar: "$$ROOT.additional2_ar",
                  unitValue: "$$ROOT.unitValue",
                  variantId: "$$ROOT.variantId",
                  _id: "$$ROOT._id",
                },
              },
            },
          },
          {
            $lookup: {
              from: "brands",
              localField: "brandId",
              foreignField: "_id",
              as: "brandId",
            },
          },
          {
            $unwind: "$brandId",
          },
        ])
        .exec();
      return product;
      // return { data: product };
    } else {
      return [];
    }
  }

  // async getStoresByBrand(data) {
  //   let stores = await model.storeItemsEcommerce.find({
  //     brandId: data.id
  //   }).distinct("storeId");
  //   stores = await model.store
  //     .aggregate([{
  //         $match: {
  //           _id: {
  //             $in: stores
  //           },
  //           // $and: [{ status: { $ne: 2 } }, { status: { $ne: 3 } }],
  //           // isVisible: true,
  //         },
  //       },
  //       {
  //         $lookup: catLookup
  //       },
  //       {
  //         $lookup: ratingLookup
  //       },
  //       {
  //         $lookup: await this.favLookup(data.userId)
  //       },
  //       {
  //         $lookup: await this.outletLookup(data)
  //       },
  //       {
  //         $project: project
  //       },
  //       {
  //         $match: {
  //           outletSize: {
  //             $gte: 1
  //           }
  //         }
  //       },
  //     ])
  //     .exec();
  //   // let storeType = await model.storeCategoryEcommerce.findById(stores[0].storeTypeId);
  //   return {
  //     data: {
  //       // isHyperLocal: storeType.isHyperLocal,
  //       storeTypeStores: stores,
  //     },
  //   };
  // }
  // async searchNew(data) {
  //   let products = model.storeItem
  //     .aggregate([
  //       {
  //         $match: {
  //           productName: { $regex: `^${data.search}`, $options: "i" },
  //           storeId: { $exists: true },
  //           // $or: [{ isProto: false }, { storeExclusive: true }], // this means it is in some store
  //         },
  //       },
  //       {
  //         $group: {
  //           _id: "$productKey",
  //           productName: { $first: "$productName" },
  //           productName_ar: { $first: "$productName_ar" },
  //           storeItemSubTypeId: { $first: "$storeItemSubTypeId" },
  //           storeItemTypeId: { $first: "$storeItemTypeId" },
  //           brandId: { $first: "$brandId" },
  //           label: { $first: "$label" },
  //           createdAt: { $first: "$createdAt" },
  //           variants: {
  //             $push: {
  //               label: "$$ROOT.label",
  //               color: "$$ROOT.color",
  //               customizable: "$$ROOT.customizable",
  //               marketPrice: "$$ROOT.marketPrice",
  //               price: "$$ROOT.price",
  //               originalPrice: "$$ROOT.originalPrice",
  //               discount: "$$ROOT.discount",
  //               discountType: "$$ROOT.discountType",
  //               description_ar: "$$ROOT.description_ar",
  //               description: "$$ROOT.description",
  //               image1: "$$ROOT.image1",
  //               image2: "$$ROOT.image2",
  //               image3: "$$ROOT.image3",
  //               image4: "$$ROOT.image4",
  //               image5: "$$ROOT.image5",
  //               video: "$$ROOT.video",
  //               tickets: "$$ROOT.tickets",
  //               LP: "$$ROOT.LP",
  //               name_ar: "$$ROOT.name_ar",
  //               quantity: "$$ROOT.quantity",
  //               purchaseLimit: "$$ROOT.purchaseLimit",
  //               name: "$$ROOT.name",
  //               size: "$$ROOT.size",
  //               addOn: "$$ROOT.addOn",
  //               unit: "$$ROOT.unit",
  //               additional1: "$$ROOT.additional1",
  //               additional2: "$$ROOT.additional2",
  //               additional1_ar: "$$ROOT.additional1_ar",
  //               additional2_ar: "$$ROOT.additional2_ar",
  //               unitValue: "$$ROOT.unitValue",
  //               variantId: "$$ROOT.variantId",
  //               _id: "$$ROOT._id",
  //             },
  //           },
  //         },
  //       },
  //       // {
  //       //   $project: {
  //       //     productKey: 1,
  //       //     productName: 1,
  //       //     name_ar: 1,
  //       //     image1: 1,
  //       //     image2: 1,
  //       //     image3: 1,
  //       //     image4: 1,
  //       //     image5: 1,
  //       //     _id: 1,
  //       //   },
  //       // },
  //       {
  //         $limit: 10,
  //       },
  //     ])
  //     .exec();

  //   let stores = model.store
  //     .find({
  //       name: { $regex: `${data.search}`, $options: "i" },
  //       $or: [{ isHyperLocal: false }, { isHyperLocal: { $exists: false } }],
  //     })
  //     .limit(3)
  //     .exec();
  //   let brands = model.brand
  //     .aggregate([
  //       { $match: { name: { $regex: `${data.search}`, $options: "i" } } },
  //       {
  //         $lookup: {
  //           from: "storeitems",
  //           let: { brandId: "$_id" },
  //           pipeline: [
  //             {
  //               $match: {
  //                 $expr: {
  //                   $or: [{ $eq: ["$brandId", "$$brandId"] }],
  //                 },
  //               },
  //             },
  //             {
  //               $project: {
  //                 storeId: { $ifNull: ["$storeId", "Unspecified"] },
  //               },
  //             },
  //             {
  //               $match: {
  //                 $expr: { $not: { $eq: ["$storeId", "Unspecified"] } },
  //               },
  //             },
  //           ],
  //           as: "storeitems",
  //         },
  //       },
  //       {
  //         $project: {
  //           name: 1,
  //           name_ar: 1,
  //           image: 1,
  //           _id: 1,
  //           items: { $size: "$storeitems" },
  //         },
  //       },
  //       { $match: { items: { $gte: 1 } } },
  //       {
  //         $limit: 3,
  //       },
  //     ])
  //     .exec();

  //   let response = [];
  //   data = await Promise.all([products, stores, brands]);
  //   products = data[0];
  //   brands = data[2];
  //   stores = data[1];
  //   products.forEach((item) => {
  //     let image = "";
  //     let data = {};
  //     for (let i = 1; i <= 5; i++) {
  //       if (
  //         item.variants[0][`image${i}`] &&
  //         item.variants[0][`image${i}`].length > 0
  //       ) {
  //         image = item.variants[0][`image${i}`];
  //         break;
  //       }
  //     }
  //     data.name = item.productName;
  //     data.image = image;
  //     data.id = item._id;
  //     data.type = "product";
  //     data.type_ar = "arabic";
  //     data.name_ar = item.variants[0].name_ar;

  //     response.push(data);
  //   });

  //   brands.forEach((item) => {
  //     let data = {};

  //     data.name = item.name;
  //     data.image = item.image;
  //     data.id = item._id;
  //     data.type = "brand";
  //     data.name_ar = item.name_ar;
  //     data.type_ar = "arabic";

  //     response.push(data);
  //   });

  //   stores.forEach((item) => {
  //     let data = {};

  //     data.name = item.name;
  //     data.image = item.image;
  //     data.id = item._id;
  //     data.type = "store";
  //     data.name_ar = item.name_ar;
  //     data.type_ar = "arabic";

  //     response.push(data);
  //   });

  //   return { data: response };
  // }

  // async getRecommendedStores(data, skip, limit) {
  //   let qry = {
  //     $and: [{
  //         $and: [{
  //             status: {
  //               $ne: 2,
  //             },
  //           },
  //           {
  //             status: {
  //               $ne: 3,
  //             },
  //           },
  //         ],
  //       },
  //       {
  //         $and: [{
  //           isRecommended: 1,
  //         }, ],
  //       },
  //       {
  //         isVisible: true,
  //       },
  //       {
  //         isHyperLocal: false,
  //       },
  //     ],
  //   };
  //   if (data.moduleKey) {
  //     qry.$and.push({
  //       moduleKey: data.moduleKey,
  //     });
  //   }
  //   if (data.isGeofenceActive) {
  //     qry.$and.push({
  //       geofenceId: data.geofenceId,
  //     });
  //   }
  //   /**********FILTERING LOGIC************ */
  //   let sortBy = "ratings";
  //   let sortType = 1;
  //   if (data.sortBy) sortBy = data.sortBy; //
  //   if (data.sortType === "descending") sortType = -1;

  //   let ratingFilter = {
  //     ratings: {
  //       $gte: 0,
  //       $lte: 5,
  //     },
  //   };
  //   if (data.rating) {
  //     data.rating = Number(data.rating);
  //     ratingFilter = {
  //       ratings: {
  //         $gte: data.rating,
  //         $lt: data.rating + 1,
  //       },
  //     };
  //   }
  //   let priceFilter = {
  //     avgOrderPrice: {
  //       $gte: -1,
  //     },
  //   };
  //   if (data.minPrice && data.maxPrice) {
  //     data.minPrice = Number(data.minPrice);
  //     data.maxPrice = Number(data.maxPrice);
  //     priceFilter = {
  //       avgOrderPrice: {
  //         $gte: data.minPrice,
  //         $lte: data.maxPrice,
  //       },
  //     };
  //   }
  //   let sort = {};
  //   sort[sortBy] = sortType;

  //   /*************************** FILTERING LOGIC END***************** */
  //   return model.store
  //     .aggregate([{
  //         $match: qry,
  //       },
  //       {
  //         $lookup: await this.outletLookup(data),
  //       },
  //       {
  //         $project: preProject,
  //       },
  //       {
  //         $match: {
  //           outlet_Size: {
  //             $gte: 1,
  //           },
  //         },
  //       },
  //       // { $lookup: catLookup },
  //       {
  //         $lookup: ratingLookup,
  //       },
  //       {
  //         $lookup: await this.favLookup(data.userId),
  //       },
  //       // { $skip: skip },
  //       // { $limit: limit },
  //       {
  //         $project: project,
  //       },
  //       {
  //         $match: {
  //           outletSize: {
  //             $gte: 1,
  //           },
  //         },
  //       },
  //       {
  //         $sort: sort,
  //       },
  //       {
  //         $match: ratingFilter,
  //       },
  //       {
  //         $match: priceFilter,
  //       },
  //     ])
  //     .exec();
  // }

  async getRecommendedStoreCount(data) {
    let qry = {
      $and: [{
          $and: [{
              status: {
                $ne: 2,
              },
            },
            {
              status: {
                $ne: 3,
              },
            },
          ],
        },
        {
          $and: [{
            isRecommended: 1,
          }, ],
        },
      ],
    };
    return model.store
      .aggregate([{
          $match: qry,
        },
        {
          $lookup: await this.outletLookup(data),
        },
        {
          $project: preProject,
        },
        {
          $match: {
            outlet_Size: {
              $gte: 1,
            },
          },
        },
      ])
      .exec();
  }

  async getCategoryStores(data, skip, limit) {
    let qry = {
      $and: [{
          status: {
            $ne: 2,
          },
        },
        {
          status: {
            $ne: 3,
          },
        },
      ],
      storeTypeId: mongoose.Types.ObjectId(data.storeTypeId),
      isVisible: true,
    };

    /**********FILTERING LOGIC************ */
    let sortBy = "ratings";
    let sortType = 1;
    if (data.sortBy) sortBy = data.sortBy; //
    if (data.sortType === "descending") sortType = -1;

    let ratingFilter = {
      ratings: {
        $gte: 0,
        $lte: 5,
      },
    };
    if (data.rating) {
      data.rating = Number(data.rating);
      ratingFilter = {
        ratings: {
          $gte: data.rating,
          $lt: data.rating + 1,
        },
      };
    }
    let priceFilter = {
      avgOrderPrice: {
        $gte: -1,
      },
    };
    if (data.minPrice && data.maxPrice) {
      data.minPrice = Number(data.minPrice);
      data.maxPrice = Number(data.maxPrice);
      priceFilter = {
        avgOrderPrice: {
          $gte: data.minPrice,
          $lte: data.maxPrice,
        },
      };
    }
    if (data.isGeofenceActive == "true" || data.isGeofenceActive == true) {
      qry.geofenceId = mongoose.Types.ObjectId(data.geofenceId);
    }
    let sort = {};
    sort[sortBy] = sortType;
    let pipeline = [{
        $match: qry,
      },
      {
        $lookup: await this.outletLookup(data),
      },
      {
        $project: preProject,
      },
      {
        $match: {
          outlet_Size: {
            $gte: 1,
          },
        },
      },
      {
        $lookup: catLookup,
      },
      {
        $lookup: ratingLookup,
      },
      {
        $lookup: await this.favLookup(data.userId),
      },
      // { $skip: skip },
      // { $limit: limit },
      {
        $project: project,
      },
      {
        $sort: sort,
      },
      //{ $match: ratingFipreProjectlter },
      {
        $match: priceFilter,
      },
    ];
    if (data.newSort == "popularity")
      pipeline.push({
        $lookup: {
          from: "storeorders",
          let: {
            storeId: "$_id",
          },
          pipeline: [{
            $match: {
              $expr: {
                $eq: ["$storeId", "$$storeId"],
              },
            },
          }, ],
          as: "storeOrder",
        },
      }, {
        $unwind: {
          path: "$storeOrder",
          preserveNullAndEmptyArrays: true,
        },
      }, {
        $group: {
          _id: "$_id",
          orderCount: {
            $sum: 1,
          },
        },
      }, {
        $sort: {
          orderCount: -1,
        },
      });
    const beforeSevenDays = new Date(new Date() - 7 * 60 * 60 * 24 * 1000).toISOString();
    const today = new Date().toISOString();
    if (data.newSort == "newFirst")
      pipeline.push({
        $lookup: {
          from: "storeitems",
          let: {
            storeId: "$_id",
          },
          pipeline: [{
            $match: {
              $expr: {
                $eq: ["$storeId", "$$storeId"],
              },
            },
          }, ],
          as: "storeItems",
        },
      }, {
        $unwind: {
          path: "$storeItems",
          preserveNullAndEmptyArrays: true,
        },
      }, {
        $group: {
          _id: "$_id",
          createdAt: {
            $first: "$storeItems.createdAt",
          },
        },
      }, {
        $match: {
          $and: [{
              createdAt: {
                $lte: today,
              },
            },
            {
              createdAt: {
                $gte: beforeSevenDays,
              },
            },
          ],
        },
      }, {
        $sort: {
          createdAt: -1,
        },
      });
    /*************************** FILTERING LOGIC END***************** */

    return model.storeEcommerce.aggregate(pipeline).exec();
  }

  // async

  async getCategoryStoresCount(data) {
    let qry = {
      $and: [{
          status: {
            $ne: 2,
          },
        },
        {
          status: {
            $ne: 3,
          },
        },
      ],
      storeTypeId: mongoose.Types.ObjectId(data.storeTypeId),
    };
    return model.store
      .aggregate([{
          $match: qry,
        },
        {
          $lookup: await this.outletLookup(data),
        },
        {
          $project: preProject,
        },
        {
          $match: {
            outlet_Size: {
              $gte: 1,
            },
          },
        },
      ])
      .exec();
  }

  async allSaved(data, userId, lang) {
    return new Promise(async (done, reject) => {
      data.userId = userId;

      let skip = Number(data.page) > 1 ? (Number(data.page) - 1) * Constant.LIMIT : 0;
      if (data.isGeofenceActive && (data.isGeofenceActive == true || data.isGeofenceActive == "true" || data.isGeofenceActive == 1)) {
        const geofenceData = await findGeofenceId(data.longitude, data.latitude);
        if (geofenceData) data.geofenceId = geofenceData._id;
      }
      let saved = await this.getSavedStores(data, skip, Constant.LIMIT);
      let count = await model.favStore.countDocuments({
        userId: data.userId,
      });
      done({
        data: {
          saved: saved,
          totalPages: Math.ceil(count / Constant.LIMIT),
        },
      });
    });
  }

  async allBestOffer(data, userId, lang) {
    return new Promise(async (done, reject) => {
      data.userId = userId;
      let skip = Number(data.page) > 1 ? (Number(data.page) - 1) * Constant.LIMIT : 0;
      if (data.isGeofenceActive && (data.isGeofenceActive == true || data.isGeofenceActive == "true" || data.isGeofenceActive == 1)) {
        const geofenceData = await findGeofenceId(data.longitude, data.latitude);
        if (geofenceData) data.geofenceId = geofenceData._id;
      }
      let stores = await this.getBestOffers(data, skip, Constant.LIMIT);
      let count = await this.getBestOffersCount(data);
      done({
        data: {
          bestOffers: stores,
          totalPages: count.length ? Math.ceil(count.length / Constant.LIMIT) : 1,
        },
      });
    });
  }

  async allRecommened(data, userId, lang) {
    return new Promise(async (done, reject) => {
      data.userId = userId;
      if (data.isGeofenceActive && (data.isGeofenceActive == true || data.isGeofenceActive == "true")) {
        const geofenceData = await findGeofenceId(data.longitude, data.latitude);
        if (geofenceData != null || geofenceData != undefined) {
          data.geofenceId = geofenceData._id;
        } else data.geofenceId = null;
      }
      let skip = Number(data.page) > 1 ? (Number(data.page) - 1) * Constant.LIMIT : 0;

      let stores = await this.getRecommendedStores(data, skip, Constant.LIMIT);

      let count = await this.getRecommendedStoreCount(data);

      done({
        data: {
          recommended: stores,
          totalPages: count.length ? Math.ceil(count.length / Constant.LIMIT) : 1,
        },
      });
    });
  }

  async storeData(storeId, data) {
    let qry = {
      _id: mongoose.Types.ObjectId(storeId),
    };
    let store = await model.store
      .aggregate([{
          $match: qry,
        },
        {
          $lookup: await this.outletLookupWithoutGeoNear(),
        },
        {
          $lookup: ratingLookup,
        },
        {
          $project: ratingFavProject,
        },
        {
          $limit: 1,
        },
      ])
      .exec();
    let storeNew = await model.storeEcommerce.findById(storeId).lean();
    let storeType = await model.storeCategoryEcommerce.findById(storeNew.storeTypeId).lean();
    let category = await model.storeItemTypeEcommerce
      .find({
        storeCategoryId: storeType._id,
      })
      .lean();
    let emptyCategories = [];
    for (let i = 0; i < category.length; i++) {
      let subCategory = await model.storeItemTypeEcommerce
        .find({
          parentId: category[i]._id,
        })
        .lean();
      let emptySubCategories = [];
      if (subCategory && subCategory.length) {
        for (let j = 0; j < subCategory.length; j++) {
          let pipeline = [{
              $match: {
                storeItemSubTypeId: mongoose.Types.ObjectId(subCategory[j]._id),
                isProto: false,
                storeId: mongoose.Types.ObjectId(storeId),
              },
            },
            {
              $group: {
                _id: "$productKey",
                productName: {
                  $first: "$productName",
                },
                productName_ar: {
                  $first: "$productName_ar",
                },
                storeItemSubTypeId: {
                  $first: "$storeItemSubTypeId",
                },
                storeItemTypeId: {
                  $first: "$storeItemTypeId",
                },
                brandId: {
                  $first: "$brandId",
                },
                label: {
                  $first: "$label",
                },
                createdAt: {
                  $first: "$createdAt",
                },
                variants: {
                  $push: {
                    label: "$$ROOT.label",
                    color: "$$ROOT.color",
                    customizable: "$$ROOT.customizable",
                    marketPrice: "$$ROOT.marketPrice",
                    price: "$$ROOT.price",
                    originalPrice: "$$ROOT.originalPrice",
                    discount: "$$ROOT.discount",
                    discountType: "$$ROOT.discountType",
                    description_ar: "$$ROOT.description_ar",
                    description: "$$ROOT.description",
                    image1: "$$ROOT.image1",
                    image2: "$$ROOT.image2",
                    image3: "$$ROOT.image3",
                    image4: "$$ROOT.image4",
                    image5: "$$ROOT.image5",
                    video: "$$ROOT.video",
                    tickets: "$$ROOT.tickets",
                    LP: "$$ROOT.LP",
                    name_ar: "$$ROOT.name_ar",
                    quantity: "$$ROOT.quantity",
                    purchaseLimit: "$$ROOT.purchaseLimit",
                    name: "$$ROOT.name",
                    size: "$$ROOT.size",
                    addOn: "$$ROOT.addOn",
                    unit: "$$ROOT.unit",
                    additional1: "$$ROOT.additional1",
                    additional2: "$$ROOT.additional2",
                    additional1_ar: "$$ROOT.additional1_ar",
                    additional2_ar: "$$ROOT.additional2_ar",
                    unitValue: "$$ROOT.unitValue",
                    variantId: "$$ROOT.variantId",
                    _id: "$$ROOT._id",
                  },
                },
              },
            },
            {
              $lookup: {
                from: "brands",
                localField: "brandId",
                foreignField: "_id",
                as: "brandId",
              },
            },
            {
              $unwind: "$brandId",
            },
            {
              $limit: 2,
            },
          ];

          if (data && data.label && data.label != "all") {
            pipeline.pop();
            pipeline.push({
              $match: {
                label: data.label,
              },
            }, {
              $limit: 2,
            });
          }
          let products = await model.storeItemsEcommerce.aggregate(pipeline);
          if (products.length == 0) emptySubCategories.push(j);

          let ratingFilter = {
            ratings: {
              $gte: 0,
              $lte: 5,
            },
          };
          if (data.rating) {
            data.rating = Number(data.rating);
            ratingFilter = {
              ratings: {
                $gte: data.rating,
                $lt: data.rating + 1,
              },
            };
          }
          let priceFilter = {
            avgOrderPrice: {
              $gte: -1,
            },
          };
          if (data.minPrice && data.maxPrice) {
            data.minPrice = Number(data.minPrice);
            data.maxPrice = Number(data.maxPrice);
            priceFilter = {
              avgOrderPrice: {
                $gte: data.minPrice,
                $lte: data.maxPrice,
              },
            };
          }
          let sort = {};
          sort[sortBy] = sortType;

          /*************************** FILTERING LOGIC END***************** */
          return model.store
            .aggregate([{
                $match: qry,
              },
              {
                $lookup: await this.outletLookup(data),
              },
              {
                $project: preProject,
              },
              {
                $match: {
                  outlet_Size: {
                    $gte: 1,
                  },
                },
              },
              {
                $lookup: catLookup,
              },
              {
                $lookup: ratingLookup,
              },
              {
                $lookup: await this.favLookup(data.userId),
              },
              // { $skip: skip },
              // { $limit: limit },
              {
                $project: project,
              },
              {
                $sort: sort,
              },
              {
                $match: ratingFilter,
              },
              {
                $match: priceFilter,
              },
            ])
            .exec();
        }
      }
    }
  }

  // async

  async getCategoryStoresCount(data) {
    let qry = {
      $and: [{
          status: {
            $ne: 2,
          },
        },
        {
          status: {
            $ne: 3,
          },
        },
      ],
      storeTypeId: mongoose.Types.ObjectId(data.storeTypeId),
    };
    return model.store
      .aggregate([{
          $match: qry,
        },
        {
          $lookup: await this.outletLookup(data),
        },
        {
          $project: preProject,
        },
        {
          $match: {
            outlet_Size: {
              $gte: 1,
            },
          },
        },
      ])
      .exec();
  }

  async getCategories(data, skip, limit) {
    let storeTypes;
    let qry = {
      $and: [{
          status: {
            $ne: 2,
          },
        },
        {
          status: {
            $ne: 0,
          },
        },
        // { isVisible: true }
      ],
    };
    if (data.isGeofenceActive && (data.isGeofenceActive == true || data.isGeofenceActive == "true" || data.isGeofenceActive == 1)) {
      const geofenceData = await findGeofenceId(data.longitude, data.latitude);
      if (geofenceData) data.geofenceId = geofenceData._id;
    }

    if (data.moduleKey) {
      qry.$and.push({
        moduleKey: data.moduleKey,
      });
    }
    if (data.isGeofenceActive) {
      qry.$and.push({
        geofenceId: data.geofenceId,
      });
    }
    storeTypes = await model.storeCategoryEcommerce.find(qry).lean().exec();
    let emptyStoreTypesIndices = [];
    for (let i = 0; i < storeTypes.length; i++) {
      if (storeTypes[i].isHyperLocal) {
        let store = await model.storeEcommerce.aggregate([{
            $match: {
              storeTypeId: storeTypes[i]._id,
              $and: [{
                  status: {
                    $ne: 2,
                  },
                },
                {
                  status: {
                    $ne: 3,
                  },
                },
              ],
              isVisible: true,
            },
          },
          {
            $lookup: {
              from: "storeoutlets",
              let: {
                storeId: "$_id",
              },
              pipeline: [{
                  $geoNear: {
                    near: {
                      type: "Point",
                      coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
                    },
                    distanceField: "distance",
                    spherical: true,
                    distanceMultiplier: 1e-3,
                    maxDistance: Constant.RADIUSCIRCLE,
                  },
                },
                {
                  $match: {
                    $expr: {
                      $eq: ["$storeId", "$$storeId"],
                    },
                  },
                },
                {
                  $match: {
                    $expr: {
                      $eq: ["$status", 1],
                    },
                  },
                },
              ],
              as: "storeOutlets",
            },
          },
          {
            $project: {
              _id: 1,
              storeOutlets_size: {
                $size: "$storeOutlets",
              },
              storeOutlets: 1,
            },
          },
          {
            $match: {
              $and: [{
                storeOutlets_size: {
                  $gte: 1,
                },
              }, ],
            },
          },
        ]);
        if (store[0]) {
          storeTypes[i]["hyperLocalStoreId"] = store[0]._id;
        } else {
          //THIS IS THE CASE WHEN
          // HYPELOCAL IS ON BUT NO STORE NEAR BY
          emptyStoreTypesIndices.push(i);
        }
      } else {
        storeTypes[i]["hyperLocalStoreId"] = "";
      }
    }
    for (let k = emptyStoreTypesIndices.length - 1; k >= 0; k--) storeTypes.splice(emptyStoreTypesIndices[k], 1);

    return storeTypes;
  }
  async allCategories(data, userId, lang) {
    return new Promise(async (done, reject) => {
      data.userId = userId;
      let query = {};
      let skip = Number(data.page) > 1 ? (Number(data.page) - 1) * Constant.LIMIT : 0;
      // if(data.latitude != null && data.latitude != "" && data.longitude != null && data.longitude != ""){

      // }

      let categories = await this.getCategories(data, skip, Constant.LIMIT);
      let count = await model.storeCategoryEcommerce.countDocuments({
        $and: [{
            status: {
              $ne: 2,
            },
          },
          {
            status: {
              $ne: 0,
            },
          },
        ],
      });
      done({
        data: {
          categories: categories,
          totalPages: Math.ceil(count / Constant.LIMIT),
        },
      });
    });
  }

  allStoresByStoreType(data, userId, lang) {
    return new Promise(async (done, reject) => {
      data.userId = userId;
      let skip = Number(data.page) > 1 ? (Number(data.page) - 1) * Constant.LIMIT : 0;
      if (data.isGeofenceActive && (data.isGeofenceActive == true || data.isGeofenceActive == "true")) {
        const geofenceData = await findGeofenceId(data.longitude, data.latitude);

        if (geofenceData) data.geofenceId = geofenceData._id;
      }
      let stores = await this.getCategoryStores(data, skip, Constant.LIMIT);
      // no pagination in app side that is why commenting this

      // console.log(stores);
      // let emptyStores = [];
      // for (let j = 0; j < stores.length; j++) {
      //   let products = await model.storeItem
      //     .find({ storeId: stores[j]._id, isProto: false })
      //     .lean();
      //   if (products.length == 0) emptyStores.push(j);
      // }
      // for (let k = emptyStores.length - 1; k >= 0; k--)
      //   stores.splice(emptyStores[k], 1);
      // let count = await this.getCategoryStoresCount(data);
      done({
        data: {
          storeTypeStores: stores,
          // totalPages: count.length
          //   ? Math.ceil(count.length / Constant.LIMIT)
          //   : 1,
        },
      });
    });
  }

  async allSaved(data, userId, lang) {
    return new Promise(async (done, reject) => {
      data.userId = userId;

      let skip = Number(data.page) > 1 ? (Number(data.page) - 1) * Constant.LIMIT : 0;

      let saved = await this.getSavedStores(data, skip, Constant.LIMIT);
      let count = await model.favStore.countDocuments({
        userId: data.userId,
      });
      done({
        data: {
          saved: saved,
          totalPages: Math.ceil(count / Constant.LIMIT),
        },
      });
    });
  }

  // async allBestOffer(data, userId, lang) {
  //   return new Promise(async (done, reject) => {
  //     data.userId = userId;

  //     let skip = Number(data.page) > 1 ? (Number(data.page) - 1) * Constant.LIMIT : 0;

  //     let stores = await this.getBestOffers(data, skip, Constant.LIMIT);
  //     let count = await this.getBestOffersCount(data);

  //     done({
  //       data: {
  //         bestOffers: stores,
  //         totalPages: count.length ? Math.ceil(count.length / Constant.LIMIT) : 1,
  //       },
  //     });
  //   });
  // }



  async storeData(storeId, data) {
    let qry = {
      _id: mongoose.Types.ObjectId(storeId),
    };
    let store = await model.store
      .aggregate([{
          $match: qry,
        },
        {
          $lookup: await this.outletLookupWithoutGeoNear(),
        },
        {
          $lookup: ratingLookup,
        },
        {
          $project: ratingFavProject,
        },
        {
          $limit: 1,
        },
      ])
      .exec();
    let storeNew = await model.storeEcommerce.findById(storeId).lean();
    let storeType = await model.storeCategoryEcommerce.findById(storeNew.storeTypeId).lean();
    let category = await model.storeItemTypeEcommerce
      .find({
        storeCategoryId: storeType._id,
      })
      .lean();

    let emptyCategories = [];
    for (let i = 0; i < category.length; i++) {
      let subCategory = await model.storeItemTypeEcommerce
        .find({
          parentId: category[i]._id,
        })
        .lean();
      let emptySubCategories = [];
      if (subCategory && subCategory.length) {
        for (let j = 0; j < subCategory.length; j++) {
          let pipeline = [{
              $match: {
                storeItemSubTypeId: mongoose.Types.ObjectId(subCategory[j]._id),
                isProto: false,
                storeId: mongoose.Types.ObjectId(storeId),
              },
            },
            {
              $group: {
                _id: "$productKey",
                productName: {
                  $first: "$productName",
                },
                productName_ar: {
                  $first: "$productName_ar",
                },
                storeItemSubTypeId: {
                  $first: "$storeItemSubTypeId",
                },
                storeItemTypeId: {
                  $first: "$storeItemTypeId",
                },
                brandId: {
                  $first: "$brandId",
                },
                label: {
                  $first: "$label",
                },
                createdAt: {
                  $first: "$createdAt",
                },
                variants: {
                  $push: {
                    label: "$$ROOT.label",
                    color: "$$ROOT.color",
                    customizable: "$$ROOT.customizable",
                    marketPrice: "$$ROOT.marketPrice",
                    price: "$$ROOT.price",
                    originalPrice: "$$ROOT.originalPrice",
                    discount: "$$ROOT.discount",
                    discountType: "$$ROOT.discountType",
                    description_ar: "$$ROOT.description_ar",
                    description: "$$ROOT.description",
                    image1: "$$ROOT.image1",
                    image2: "$$ROOT.image2",
                    image3: "$$ROOT.image3",
                    image4: "$$ROOT.image4",
                    image5: "$$ROOT.image5",
                    video: "$$ROOT.video",
                    tickets: "$$ROOT.tickets",
                    LP: "$$ROOT.LP",
                    name_ar: "$$ROOT.name_ar",
                    quantity: "$$ROOT.quantity",
                    purchaseLimit: "$$ROOT.purchaseLimit",
                    name: "$$ROOT.name",
                    size: "$$ROOT.size",
                    addOn: "$$ROOT.addOn",
                    unit: "$$ROOT.unit",
                    additional1: "$$ROOT.additional1",
                    additional2: "$$ROOT.additional2",
                    additional1_ar: "$$ROOT.additional1_ar",
                    additional2_ar: "$$ROOT.additional2_ar",
                    unitValue: "$$ROOT.unitValue",
                    variantId: "$$ROOT.variantId",
                    _id: "$$ROOT._id",
                  },
                },
              },
            },
            {
              $lookup: {
                from: "brands",
                localField: "brandId",
                foreignField: "_id",
                as: "brandId",
              },
            },
            {
              $unwind: "$brandId",
            },
            {
              $limit: 2,
            },
          ];

          if (data && data.label && data.label != "all") {
            pipeline.pop();
            pipeline.push({
              $match: {
                label: data.label,
              },
            }, {
              $limit: 2,
            });
          }
          let products = await model.storeItemsEcommerce.aggregate(pipeline);
          if (products.length == 0) emptySubCategories.push(j);

          subCategory[j].products = products;
        }
        for (let k = emptySubCategories.length - 1; k >= 0; k--) subCategory.splice(emptySubCategories[k], 1);
      }

      if (!subCategory || subCategory.length == 0) emptyCategories.push(i);
      category[i].subCategory = subCategory;
    }

    for (let k = emptyCategories.length - 1; k >= 0; k--) category.splice(emptyCategories[k], 1);
    // category.push(category.shift());
    store[0].category = category;
    let brandsArray = await model.storeItem
      .find({
        storeId,
      })
      .distinct("brandId");
    let brands = await model.brand.find({
      _id: {
        $in: brandsArray,
      },
    });
    // .limit(2);

    if (data && data.label) {
      await model.StoreCache.findOneAndUpdate({
        storeId: store[0]._id,
        label: data.label,
      }, {
        data: {
          store: store[0],
          brands,
        },
        storeId: store[0]._id,
      }, {
        upsert: true,
      });
    } else {
      await model.StoreCache.findOneAndUpdate({
        storeId: store[0]._id,
      }, {
        data: {
          store: store[0],
          brands,
        },
        storeId: store[0]._id,
      }, {
        upsert: true,
      });
    }
    return {
      store: store[0],
      brands,
    };
  }

  async viewAllProducts(data, userId, lang) {
    let pipeline = [{
        $match: {
          isProto: false,
          storeId: mongoose.Types.ObjectId(data.storeId),
        },
      },
      {
        $match: {
          isProto: false,
          storeItemTypeId: mongoose.Types.ObjectId(data.catId),
        },
      },
    ];
    if (data.subCatId) {
      pipeline.push({
        $match: {
          storeItemSubTypeId: mongoose.Types.ObjectId(data.subCatId),
        },
      });
    }
    if (data && data.label && data.label != "all") {
      let obj = pipeline.shift();
      obj.$match.label = data.label;
      pipeline.unshift(obj);
    }
    pipeline.push({
      $group: {
        _id: "$productKey",
        productName: {
          $first: "$productName",
        },
        productName_ar: {
          $first: "$productName_ar",
        },
        storeItemSubTypeId: {
          $first: "$storeItemSubTypeId",
        },
        storeItemTypeId: {
          $first: "$storeItemTypeId",
        },
        brandId: {
          $first: "$brandId",
        },
        label: {
          $first: "$label",
        },
        createdAt: {
          $first: "$createdAt",
        },
        variants: {
          $push: {
            label: "$$ROOT.label",
            color: "$$ROOT.color",
            customizable: "$$ROOT.customizable",
            marketPrice: "$$ROOT.marketPrice",
            price: "$$ROOT.price",
            originalPrice: "$$ROOT.originalPrice",
            discount: "$$ROOT.discount",
            discountType: "$$ROOT.discountType",
            description_ar: "$$ROOT.description_ar",
            description: "$$ROOT.description",
            image1: "$$ROOT.image1",
            image2: "$$ROOT.image2",
            image3: "$$ROOT.image3",
            image4: "$$ROOT.image4",
            image5: "$$ROOT.image5",
            video: "$$ROOT.video",
            tickets: "$$ROOT.tickets",
            LP: "$$ROOT.LP",
            name_ar: "$$ROOT.name_ar",
            quantity: "$$ROOT.quantity",
            purchaseLimit: "$$ROOT.purchaseLimit",
            name: "$$ROOT.name",
            size: "$$ROOT.size",
            addOn: "$$ROOT.addOn",
            unit: "$$ROOT.unit",
            additional1: "$$ROOT.additional1",
            additional2: "$$ROOT.additional2",
            additional1_ar: "$$ROOT.additional1_ar",
            additional2_ar: "$$ROOT.additional2_ar",
            unitValue: "$$ROOT.unitValue",
            variantId: "$$ROOT.variantId",
            _id: "$$ROOT._id",
          },
        },
      },
    }, {
      $lookup: {
        from: "brands",
        localField: "brandId",
        foreignField: "_id",
        as: "brandId",
      },
    }, {
      $unwind: "$brandId",
    });
    let products = await model.storeItemsEcommerce.aggregate(pipeline);

    for (const z in products) {
      products[z]["isFav"] = false;
      if (global.favs[userId.toString() + products[z]._id]) products[z]["isFav"] = true;
    }
    
    return {
      products,
    };
  }
  async storeCacheUpdate() {
    let stores = await model.storeEcommerce.find({});
    for (let i = 0; i < stores.length; i++) {
      await this.storeData(stores[i]._id);
    }
    return {
      data: "UPDATED",
    };
  }
  async storeDetail(storeId, queryData, userId, lang) {
    return new Promise(async (done, reject) => {
      if (storeId === "singleVendor") {
        let store = await model.storeEcommerce.findOne({
          status: {
            $in: [1, 4],
          },
        });
        if (!store) {
          return reject({
            message: "No Activated Store",
          });
        }
        storeId = store._id;
      }
      let data = {};
      if (queryData.label && queryData.label != "all") {
        data = await model.StoreCache.findOne({
          storeId: storeId,
          label: queryData.label,
        });
      } else {
        data = await model.StoreCache.findOne({
          storeId: storeId,
          label: {
            $exists: false,
          },
        });
      }
      let {
        store,
        brands
      } = data.data;
      let storeOpen = await model.storeEcommerce.findById(storeId);
      store.isOpen = storeOpen.isOpen;
      store.isBrandHidden = storeOpen.isBrandHidden;

      let fav = await model.favStore.find({
        storeId,
        userId,
      });
      store.isFavourite = 0;
      if (fav) store.isFavourite = 1;
      store = [store];
      for (const x in store[0].category) {
        for (const y in store[0].category[x].subCategory) {
          for (const z in store[0].category[x].subCategory[y].products) {
            store[0].category[x].subCategory[y].products[z]["isFav"] = false;
            if (global.favs[userId.toString() + store[0].category[x].subCategory[y].products[z]._id]) {
              store[0].category[x].subCategory[y].products[z]["isFav"] = true;
            }
          }
        }
      }
      done({
        data: {
          store: store[0],
          brands,
        },
      });
    });
  }

  async storeDetail2(storeId, data, userId, lang) {
    return new Promise(async (done, reject) => {
      let store = model.store
        .aggregate([{
            $match: {
              _id: mongoose.Types.ObjectId(storeId),
            },
          },
          {
            $lookup: await this.outletLookup(data),
          },
          // { $project: preProject },
          // { $match: { outlet_Size: { $gte: 1 } } },
          {
            $lookup: ratingLookup,
          },
          {
            $lookup: await this.favLookup(userId),
          },
          {
            $project: ratingFavProject,
          },
          {
            $match: {
              outletSize: {
                $gte: 1,
              },
            },
          },
        ])
        .exec();
      let filter = {
        storeId: mongoose.Types.ObjectId(storeId),
      };
      if (data && data.label && data.label != "all") filter.label = data.label;
      let cats = (async () => {
        let cats = await model.storeItemsEcommerce.find(filter).distinct("storeItemTypeId").exec();
        cats = await model.storeItemTypeEcommerce
          .find({
            _id: {
              $in: cats,
            },
          })
          .exec();
        return cats;
      })();
      let brands = (async () => {
        let brands = await model.storeItemsEcommerce.find(filter).distinct("brandId");
        brands = await model.brand
          .find({
            _id: {
              $in: brands,
            },
          })
          .limit(4);
        return brands;
      })();
      /* let promotionalItems = (async () => {
        let productKeys = await model.storeItemsEcommerce.find(filter).distinct("productKey");
        let deals = await model.promocode.find({ productId: { $in: productKeys } });
        let result = [];
        for (var i = 0; i < deals.length; i++) result = [...result, ...deals[i].productId];
        // let key = []
        // for (var i = 0; i < result.length; i++) {
        //   for (var j = 0; j < productKeys; j++) {
        //     if (result[i] == productKeys[j]) {
        //       key.push(result[i])
        //       break;
        //     }
        //   }
        // }
        promotionalItems = await model.storeItemsEcommerce.aggregate([
          {
            $match: {
              productKey: { $in: result },
              storeId: mongoose.Types.ObjectId(storeId),
            },
          },
          {
            $group: {
              _id: "$productKey",
              productName: { $first: "$productName" },
              productName_ar: { $first: "$productName_ar" },
              storeItemSubTypeId: { $first: "$storeItemSubTypeId" },
              storeItemTypeId: { $first: "$storeItemTypeId" },
              brandId: { $first: "$brandId" },
              label: { $first: "$label" },
              createdAt: { $first: "$createdAt" },
              variants: {
                $push: {
                  label: "$$ROOT.label",
                  color: "$$ROOT.color",
                  customizable: "$$ROOT.customizable",
                  marketPrice: "$$ROOT.marketPrice",
                  price: "$$ROOT.price",
                  originalPrice: "$$ROOT.originalPrice",
                  discount: "$$ROOT.discount",
                  discountType: "$$ROOT.discountType",
                  description_ar: "$$ROOT.description_ar",
                  description: "$$ROOT.description",
                  image1: "$$ROOT.image1",
                  image2: "$$ROOT.image2",
                  image3: "$$ROOT.image3",
                  image4: "$$ROOT.image4",
                  image5: "$$ROOT.image5",
                  video: "$$ROOT.video",
                  tickets: "$$ROOT.tickets",
                  LP: "$$ROOT.LP",
                  name_ar: "$$ROOT.name_ar",
                  quantity: "$$ROOT.quantity",
                  purchaseLimit: "$$ROOT.purchaseLimit",
                  name: "$$ROOT.name",
                  size: "$$ROOT.size",
                  addOn: "$$ROOT.addOn",
                  unit: "$$ROOT.unit",
                  additional1: "$$ROOT.additional1",
                  additional2: "$$ROOT.additional2",
                  additional1_ar: "$$ROOT.additional1_ar",
                  additional2_ar: "$$ROOT.additional2_ar",
                  unitValue: "$$ROOT.unitValue",
                  variantId: "$$ROOT.variantId",
                  _id: "$$ROOT._id",
                },
              },
            },
          },
        ]);
        return promotionalItems;
      })(); */
      let res;
      if (data.layout) {
        res = await Promise.all([store, cats, brands /* , promotionalItems */ ]);
        store = res[0][0];
        store.category = res[1];
        brands = res[2];
        // store.promotionalItems = res[3];
        done({
          data: {
            store,
            brands,
          },
        });
      } else {
        res = await Promise.all([store, cats, brands /* , [] */ ]);
        store = res[0][0];
        store.category = res[1];
        brands = res[2];
        // store.promotionalItems = res[3];
        done({
          data: {
            store,
            brands,
          },
        });
      }
    });
  }

  // async getProductsBySubCategory(data) {
  //   let products = await model.storeItemsEcommerce.aggregate(pipeline).exec();
  //   return products;
  // }
  async getProductsByCategory(data, userId) {
    if (data.dynamicLayout == "one" || data.dynamicLayout == "three") {
      try {
        let pipeline = [{
          $match: {
            $expr: {
              $and: [{
                  $eq: ["$storeId", mongoose.Types.ObjectId(data.storeId)],
                },
                {
                  $eq: ["$storeItemSubTypeId", "$$storeItemSubTypeId"],
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: "$productKey",
            productName: {
              $first: "$productName",
            },
            productName_ar: {
              $first: "$productName_ar",
            },
            storeItemSubTypeId: {
              $first: "$storeItemSubTypeId",
            },
            storeItemTypeId: {
              $first: "$storeItemTypeId",
            },
            brandId: {
              $first: "$brandId",
            },
            label: {
              $first: "$label",
            },
            createdAt: {
              $first: "$createdAt",
            },
            variants: {
              $push: {
                label: "$$ROOT.label",
                color: "$$ROOT.color",
                customizable: "$$ROOT.customizable",
                marketPrice: "$$ROOT.marketPrice",
                price: "$$ROOT.price",
                originalPrice: "$$ROOT.originalPrice",
                discount: "$$ROOT.discount",
                discountType: "$$ROOT.discountType",
                description_ar: "$$ROOT.description_ar",
                description: "$$ROOT.description",
                image1: "$$ROOT.image1",
                image2: "$$ROOT.image2",
                image3: "$$ROOT.image3",
                image4: "$$ROOT.image4",
                image5: "$$ROOT.image5",
                video: "$$ROOT.video",
                tickets: "$$ROOT.tickets",
                LP: "$$ROOT.LP",
                name_ar: "$$ROOT.name_ar",
                quantity: "$$ROOT.quantity",
                purchaseLimit: "$$ROOT.purchaseLimit",
                name: "$$ROOT.name",
                size: "$$ROOT.size",
                addOn: "$$ROOT.addOn",
                toppings: "$$ROOT.toppings",
                unit: "$$ROOT.unit",
                additional1: "$$ROOT.additional1",
                additional2: "$$ROOT.additional2",
                additional1_ar: "$$ROOT.additional1_ar",
                additional2_ar: "$$ROOT.additional2_ar",
                unitValue: "$$ROOT.unitValue",
                variantId: "$$ROOT.variantId",
                _id: "$$ROOT._id",
              },
            },
          },
        },
        {
          $limit: 20,
        },
        {
          $lookup: {
            from: "brands",
            localField: "brandId",
            foreignField: "_id",
            as: "brandId",
          },
        },
        {
          $unwind: "$brandId",
        },
      ];
      if (data && data.label && data.label != "all") {
        pipeline.unshift({
          $match: {
            label: data.label,
          },
        });
      }
      let filter = {
        storeId: mongoose.Types.ObjectId(data.storeId),
        storeItemTypeId: mongoose.Types.ObjectId(data.categoryId),
      };
      if (data && data.label && data.label != "all") filter.label = data.label;
      let subCategory = await model.storeItemsEcommerce.distinct("storeItemSubTypeId", filter);
      let subCategoryPipeline = [{
          $match: {
            _id: {
              $in: subCategory,
            },
          },
        },
        {
          $lookup: {
            from: "storeitems",
            let: {
              storeItemSubTypeId: "$_id",
            },
            pipeline: pipeline,
            as: "products",
          },
        },
        {
          $lookup: {
            from: "promocodes",
            let: {
              storeItemSubTypeId: "$_id",
              categoryId: "$parentId",
            },
            pipeline: [{
                $match: {
                  $or: [{
                      $and: [{
                        $expr: {
                          $in: ["$$categoryId", "$categoryId"],
                        },
                      }, ],
                    },
                    {
                      $and: [{
                        $expr: {
                          $in: ["$$storeItemSubTypeId", "$subCategoryId"],
                        },
                      }, ],
                    },/* 
                    {
                      $and: [{
                        $expr: {
                          $in: ["$$", "$itemId"],
                        },
                      }, ],
                    }, */
                  ],
                  status: {
                    $in: [1, 3],
                  },
                  startDate: {
                    $lte: new Date(moment().startOf("date")),
                  },
                  endDate: {
                    $gte: new Date(moment().startOf("date")),
                  },
                },
              },
              {
                $project: {
                  name: 1,
                  code: 1,
                  description: 1,
                  image: 1,
                  discount: 1,
                  discountType: 1,
                  useLimit: 1,
                  perDayLimit: 1,
                  endDate: 1,
                  startDate: 1,
                },
              },
            ],
            as: "promos",
          },
        },
      ];
      if (data.search != null && data.search != "") {
        search = data.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        subCategoryPipeline.push({
          $match: {
            $or: [{
                "products.productName": {
                  $regex: search,
                  $options: "i",
                },
              },
              {
                "products.productName_ar": {
                  $regex: search,
                  $options: "i",
                },
              },
              {
                "products.brandId.name": {
                  $regex: search,
                  $options: "i",
                },
              },
            ],
          },
        });
      }
      subCategory = await model.storeItemTypeEcommerce.aggregate(subCategoryPipeline);
      let promos = await model.promocode.find({
        code: {
          $ne: "DEAL",
        },
        categoryId: {
          $in: [mongoose.Types.ObjectId(data.categoryId)]
        },
        status: {
          $in: [1, 3],
        },
        startDate: {
          $lte: new Date(moment().startOf("date")),
        },
        endDate: {
          $gte: new Date(moment().startOf("date")),
        },
      }).select("name code description discount discountType image useLimit perDayLimit").exec();
      let catDeal = await model.promocode.find({
        code: {
          $eq: "DEAL",
        },
        categoryId: {
          $in: [mongoose.Types.ObjectId(data.categoryId)]
        },
        status: {
          $in: [1, 3],
        },
        startDate: {
          $lte: new Date(moment().startOf("date")),
        },
        endDate: {
          $gte: new Date(moment().startOf("date")),
        },
      })

      // let resp = await Promise.all([subCategory, promos]);
      // subCategory = resp[0];
      // promos = resp[1];
      for (let i = 0; i < subCategory.length; i++) {
        for (let j = 0; j < subCategory[i].products.length; j++) {
          subCategory[i].products[j]["isFav"] = false;
          if (global.favs[userId.toString() + subCategory[i].products[j]._id]) {
            subCategory[i].products[j]["isFav"] = true;
          }
          let subCatDeal = await model.promocode.find({
            code: "DEAL",
            subCategoryId: {
              $in: [mongoose.Types.ObjectId(subCategory[i].products[j].storeItemSubTypeId)]
            },
            status: {
              $in: [1, 3],
            },
            startDate: {
              $lte: new Date(moment().startOf("date")),
            },
            endDate: {
              $gte: new Date(moment().startOf("date")),
            },
          })
          //if (subCategory[0].promos.length > 0) {
          for (let q of subCategory[i].products[j].variants) {
            // for (let p of subCategory[i].promos) {
            //   if (p.code.toLowerCase() === "deal") {
            //     if (p.discountType.toLowerCase() === "flat") {
            //       q.price = Number(q.price - p.discount);
            //     } else {
            //       q.price = q.price - ((p.discount * 1) / 100) * q.price;
            //     }
            //     break;
            //   }
            // }
            let varientDeal = await model.promocode.find({
              code: {
                $eq: "DEAL",
              },
              itemId: {
                $in: [mongoose.Types.ObjectId(q._id)]
              },
              status: {
                $in: [1, 3],
              },
              startDate: {
                $lte: new Date(moment().startOf("date")),
              },
              endDate: {
                $gte: new Date(moment().startOf("date")),
              }
            })
            if (varientDeal.length > 0) {
              if (varientDeal[0].discountType.toLowerCase() === "flat") {
                q.price = Number(q.price - varientDeal[0].discount);
              } else {
                q.price = q.price - ((varientDeal[0].discount * 1) / 100) * q.price;
              }
            } else if (subCatDeal.length > 0) {
              if (subCatDeal[0].discountType.toLowerCase() === "flat") {
                q.price = Number(q.price - subCatDeal[0].discount);
              } else {
                q.price = q.price - ((subCatDeal[0].discount * 1) / 100) * q.price;
              }
            } else if (catDeal.length > 0) {
              if (catDeal[0].discountType.toLowerCase() === "flat") {
                q.price = Number(q.price - catDeal[0].discount);
              } else {
                q.price = q.price - ((catDeal[0].discount * 1) / 100) * q.price;
              }
            }
            q.price = q.price < 0 ? 0 : q.price
          }
        }
      }
      return {
        data: {
          suCategories: subCategory,
          promos,
        },
      };
      } catch (error) {
        console.log(error.message,"errrorr")
      }
      
    } else if (data.dynamicLayout == "two") {
      let filter = {
        storeId: data.storeId,
      };
      let productKeys = await model.storeItemsEcommerce.find(filter).distinct("productKey");
      let deals = await model.promocode.find({
        productId: {
          $in: productKeys,
        },
      });
      let result = [];
      for (var i = 0; i < deals.length; i++) result = [...result, ...deals[i].productId];
      let promotionalItems = await model.storeItemsEcommerce.aggregate([{
          $match: {
            productKey: {
              $in: result,
            },
            storeId: mongoose.Types.ObjectId(data.storeId),
          },
        },
        {
          $group: {
            _id: "$productKey",
            productName: {
              $first: "$productName",
            },
            productName_ar: {
              $first: "$productName_ar",
            },
            storeItemSubTypeId: {
              $first: "$storeItemSubTypeId",
            },
            storeItemTypeId: {
              $first: "$storeItemTypeId",
            },
            brandId: {
              $first: "$brandId",
            },
            label: {
              $first: "$label",
            },
            createdAt: {
              $first: "$createdAt",
            },
            variants: {
              $push: {
                label: "$$ROOT.label",
                color: "$$ROOT.color",
                customizable: "$$ROOT.customizable",
                marketPrice: "$$ROOT.marketPrice",
                price: "$$ROOT.price",
                originalPrice: "$$ROOT.originalPrice",
                discount: "$$ROOT.discount",
                discountType: "$$ROOT.discountType",
                description_ar: "$$ROOT.description_ar",
                description: "$$ROOT.description",
                image1: "$$ROOT.image1",
                image2: "$$ROOT.image2",
                image3: "$$ROOT.image3",
                image4: "$$ROOT.image4",
                image5: "$$ROOT.image5",
                video: "$$ROOT.video",
                tickets: "$$ROOT.tickets",
                LP: "$$ROOT.LP",
                name_ar: "$$ROOT.name_ar",
                quantity: "$$ROOT.quantity",
                purchaseLimit: "$$ROOT.purchaseLimit",
                name: "$$ROOT.name",
                size: "$$ROOT.size",
                addOn: "$$ROOT.addOn",
                unit: "$$ROOT.unit",
                additional1: "$$ROOT.additional1",
                additional2: "$$ROOT.additional2",
                additional1_ar: "$$ROOT.additional1_ar",
                additional2_ar: "$$ROOT.additional2_ar",
                unitValue: "$$ROOT.unitValue",
                variantId: "$$ROOT.variantId",
                _id: "$$ROOT._id",
              },
            },
          },
        },
        {
          $lookup: {
            from: "brands",
            localField: "brandId",
            foreignField: "_id",
            as: "brandId",
          },
        },
        {
          $unwind: "$brandId",
        },
      ]);
      if (promotionalItems.length < 1) {
        return {
          data: {
            suCategories: promotionalItems,
            promos: [],
          },
        };
      }
      for (let j = 0; j < promotionalItems.length; j++) {
        promotionalItems[j]["isFav"] = false;
        if (global.favs[userId.toString() + promotionalItems[j]._id]) promotionalItems[j]["isFav"] = true;
      }
      let promos = await model.promocode.find({
          code: {
            $ne: "DEAL",
          },
          categoryId: {
            $in: [mongoose.Types.ObjectId(data.categoryId)]
          },
          status: {
            $in: [1, 3],
          },
          startDate: {
            $lte: new Date(moment().startOf("date")),
          },
          endDate: {
            $gte: new Date(moment().startOf("date")),
          },
        }).select("name code description discount discountType image useLimit perDayLimit")
        .exec();
      let suCategories = [{
        _id: "",
        isSubCategory: true,
        isParent: false,
        tax: 0,
        status: 0,
        noChildCategory: false,
        indexAt: 0,
        parentId: "",
        name: "Promotional Items",
        name_ar: "Promotional Items",
        moduleKey: "",
        date: 1624511313887,
        image: "",
        createdAt: "2021-06-24T05:08:33.897Z",
        updatedAt: "2021-06-24T05:08:33.897Z",
        __v: 0,
        products: promotionalItems,
      }];
      return {
        data: {
          suCategories: suCategories,
          promos: promos,
        },
      };
    }
  }

  async getProductsByNoChildCategory(data, userId) {
    if (!data.storeId || !data.categoryId) throw new Error("Params Missing");
    let pipeline = [{
        $match: {
          storeId: mongoose.Types.ObjectId(data.storeId),
          storeItemTypeId: mongoose.Types.ObjectId(data.categoryId),
        },
      },
      {
        $group: {
          _id: "$productKey",
          productName: {
            $first: "$productName",
          },
          productName_ar: {
            $first: "$productName_ar",
          },
          storeItemSubTypeId: {
            $first: "$storeItemSubTypeId",
          },
          storeItemTypeId: {
            $first: "$storeItemTypeId",
          },
          brandId: {
            $first: "$brandId",
          },
          label: {
            $first: "$label",
          },
          createdAt: {
            $first: "$createdAt",
          },
          variants: {
            $push: {
              label: "$$ROOT.label",
              color: "$$ROOT.color",
              customizable: "$$ROOT.customizable",
              marketPrice: "$$ROOT.marketPrice",
              price: "$$ROOT.price",
              originalPrice: "$$ROOT.originalPrice",
              discount: "$$ROOT.discount",
              discountType: "$$ROOT.discountType",
              description_ar: "$$ROOT.description_ar",
              description: "$$ROOT.description",
              image1: "$$ROOT.image1",
              image2: "$$ROOT.image2",
              image3: "$$ROOT.image3",
              image4: "$$ROOT.image4",
              image5: "$$ROOT.image5",
              video: "$$ROOT.video",
              tickets: "$$ROOT.tickets",
              LP: "$$ROOT.LP",
              name_ar: "$$ROOT.name_ar",
              quantity: "$$ROOT.quantity",
              purchaseLimit: "$$ROOT.purchaseLimit",
              name: "$$ROOT.name",
              size: "$$ROOT.size",
              addOn: "$$ROOT.addOn",
              unit: "$$ROOT.unit",
              additional1: "$$ROOT.additional1",
              additional2: "$$ROOT.additional2",
              additional1_ar: "$$ROOT.additional1_ar",
              additional2_ar: "$$ROOT.additional2_ar",
              unitValue: "$$ROOT.unitValue",
              variantId: "$$ROOT.variantId",
              _id: "$$ROOT._id",
            },
          },
        },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: "brands",
          localField: "brandId",
          foreignField: "_id",
          as: "brandId",
        },
      },
      {
        $unwind: "$brandId",
      },
    ];
    if (data.viewAll) pipeline.splice(3, 1);
    let finaldata = await model.storeItemsEcommerce.aggregate(pipeline);
    for (let i = 0; i < finaldata.length; i++) {
      finaldata[i].isFav = false;
      if (global.favs[userId + finaldata[i].productKey]) finaldata[i].isFav = true;
    }
  }

  async favProductsList(data, userId) {
    let products = await model.favProduct.find({
      userId,
    }).distinct("productKey");
    products = await model.storeItemsEcommerce.aggregate([{
        $match: {
          moduleKey: data.moduleKey,
          $expr: {
            $in: ["$productKey", products],
          },
        },
      },
      {
        $match: {
          $expr: {
            $or: [{
                $eq: ["$isProto", true],
              },
              {
                $eq: ["$storeExclusive", true],
              },
            ],
          },
        },
      },
      {
        $group: productGroup,
      },
      {
        $lookup: {
          from: "brands",
          localField: "brandId",
          foreignField: "_id",
          as: "brandId",
        },
      },
      {
        $unwind: "$brandId",
      },
    ]);
    return {
      data: products,
    };
  }
  rateStore(data, userId, lang) {
    return new Promise(async (done, reject) => {
      let rating = new model.storeRating(data);
      rating.userId = userId;
      rating.review = data.review;
      rating
        .save()
        .then((result) => {
          let update = {
            storeRating: data.rating,
            status: 6,
            storeReview: data.review,
            driverReview: data.review,
          };

          if (data.driverRating) {
            let drating = new model.driverRating(data);
            drating.userId = userId;
            drating.rating = data.driverRating;
            drating.review = data.review;
            drating.save().then({});
            update.driverRating = data.driverRating;
          }

          if (data && data.itemRating && data.itemRating.length > 0) {
            let irating = new model.storeItemRatingEcommerce(data);
            irating.userId = userId;
            data.itemRating.forEach((x) => {
              irating.items.push({
                itemId: x.itemId,
                rating: x.rating,
                review: x.review,
              });
            });
            irating.save().then({});
          }
          model.storeOrderEcommerce
            .findByIdAndUpdate(data.orderId, update, {
              new: true,
            })
            .then((order) => {
              done({
                message: Constant.RATEDMSG,
              });
            });
        })
        .catch((err) => {
          return reject({
            message: Constant.FALSEMSG,
          });
        });
    });
  }

  markFavourite(data, userId, lang) {
    return new Promise(async (done, reject) => {
      data.userId = userId;
      model.favStore.findOneAndRemove(data).then((removed) => {
        if (removed) {
          done({
            message: Constant.UNMARKFAVMSG,
          });
        } else {
          let fav = new model.favStore(data);
          fav
            .save()
            .then((result) => {
              done({
                message: Constant.MARKFAVMSG,
              });
            })
            .catch((err) => {
              return reject({
                message: Constant.FALSEMSG,
              });
            });
        }
      });
    });
  }

  markProductFavourite(data, userId, lang) {
    return new Promise(async (done, reject) => {
      data.userId = userId;
      let criteria = {
        userId: data.userId,
        productKey: data.productKey,
      };
      model.favProduct.findOneAndRemove(criteria).then((removed) => {
        if (removed) {
          global.favs[removed.userId.toString() + removed.productKey] = false;

          done({
            message: multilingualService.getResponseMessage("UNMARKFAVMSG", lang),
          });
        } else {
          let fav = new model.favProduct(data);
          fav
            .save()
            .then((result) => {
              global.favs[result.userId.toString() + result.productKey] = true;
              done({
                message: multilingualService.getResponseMessage("MARKFAVMSG", lang),
              });
            })
            .catch((err) => {
              return reject({
                message: multilingualService.getResponseMessage("FALSEMSG", lang),
              });
            });
        }
      });
    });
  }

  async createOrder(data, userId, lang) {
    return new Promise(async (done, reject) => {
      try {
        let tip = data.tip || 0;
        data.userId = userId;
        data.date = moment().valueOf();
        data.items = [];
        data.cartData = await userRepo.getCartStore(userId, lang);
        data.cartData = data.cartData.data.cart;

        /*********************************CART CALCULATIONS******************/
        let cartItemCount = 0;
        let cartAmount = 0;
        let totalItemsAmount = 0;
        let deliveryCharge = 0;
        let tax = 0;
        for (let item in data.cartData) {
          cartItemCount += Number(data.cartData[item].itemQuantity);
          totalItemsAmount += Number(data.cartData[item].itemQuantity * data.cartData[item].amount);
          cartAmount += Number(data.cartData[item].totalAmount);
        }
        totalItemsAmount.toFixed(2);
        cartAmount.toFixed(2);

        deliveryCharge += Number(data.cartData[0].deliveryCharge);
        cartAmount += deliveryCharge;
        cartAmount += Number(tip);

        /*********************************CART CALCULATIONS END***************** */

        const cartDetails = await model.storeCartEcommerce.find({
          userId: userId,
        });
        let geofenceId = null;
        if (cartDetails.length > 0) {
          let itemDataGeofence = await model.storeItemsEcommerce.findById(cartDetails[0].itemId);
          if (itemDataGeofence.geofenceId != null) {
            geofenceId = itemDataGeofence.geofenceId;
          }
        }
        cartDetails.forEach((x) => {
          data.items.push({
            itemId: x.itemId,
            amount: x.amount,
            totalAmount: x.totalAmount,
            quantity: x.itemQuantity,
          });
        });

        let appSetting = await model.AppSetting.find({});
        appSetting = appSetting[0];
        let loyalityPoints = 0;
        if (appSetting.loyalityPointsType == "ORDER") {
          const val = appSetting.loyalityPointsValueForOrder;
          loyalityPoints = Number(data.totalAmount / val);
          const userDetails = await model.user
            .findOneAndUpdate({
              _id: userId,
            }, {
              $inc: {
                earnedLPPurchases: loyalityPoints,
                availableLP: loyalityPoints,
                totalEarnedLP: loyalityPoints,
              },
            })
            .exec();
        } else {
          cartDetails.forEach(async (x) => {
            // let item = await model.storeItemsEcommerce.findById(x.itemId);
            loyalityPoints += x.itemQuantity * x.LP;
          });
          const userDetails = await model.user
            .findOneAndUpdate({
              _id: userId,
            }, {
              $inc: {
                earnedLPPurchases: loyalityPoints,
                availableLP: loyalityPoints,
                totalEarnedLP: loyalityPoints,
              },
            })
            .exec();
        }

        let ticketsCount = 0;
        cartDetails.forEach(async (x) => {
          let item = await model.storeItemsEcommerce.findById(x.itemId);
          if (item.geofenceId != null) {
            geofenceId = item.geofenceId;
          }
          ticketsCount += x.itemQuantity * item.tickets;
          const qnty = item.quantity;
          const mainQnty = item.mainQuantity;
          let cal = qnty / mainQnty;
          cal = cal * 100;
          if (cal <= 20) {
            let payload12 = {
              title: `Store has quantity limit less than 20 percentage`,
              message: `Store has quantity limit less than 20 percentage`,
              type: 1,
              storeId: item.storeId,
              orderStatus: 0,
              verticalType: 1,
            };
            await Service.Notification.webPushNotification(payload12);
            process.emit("lessItemQuantity", payload12);
          }
        });
        var ticketsData = [];
        var length = ticketsCount;

        for (let i = 0; i < length; i++) {
          ticketsData.push({
            storeId: mongoose.Types.ObjectId(data.storeId),
            userId: userId,
          });
        }
        await model.Ticket.insertMany(ticketsData);
        let store = await model.storeEcommerce.findOne({
          _id: mongoose.Types.ObjectId(data.storeId),
        });
        if (store.storePackageType == "membership") {
          if (store.orderCount == 0) {
            reject({
              message: multilingualService.getResponseMessage("STORE_MEMBERSHIP_EXPIRED", lang),
              data: {},
            });
          }
          store.orderCount = store.orderCount - 1;
          await model.storeEcommerce.findByIdAndUpdate(store._id, {
            $set: {
              orderCount: store.orderCount,
            },
          });
        }
        if (store.avgOrderPrice > 0 && data.totalAmount < store.avgOrderPrice) {
          return reject({
            message: `Order amount should be greater than ${store.avgOrderPrice}`,
            /* multilingualService.getResponseMessage("ORDERAMOUNTINCREASE", lang), */
          });
        }
        if (geofenceId != null) {
          data.geofenceId = geofenceId;
        }
        if (data.isWallet) {
          let wallet = userDetails.wallet;
          if (userDetails.wallet) {
            data.balanceLeft = cartAmount - wallet;
            if (data.balanceLeft < 0) {
              data.balanceLeft = 0;
              wallet = wallet - cartAmount;
            } else {
              wallet = 0;
            }
            await model.user.findByIdAndUpdate(userId, {
              $set: {
                wallet: wallet,
              },
            });
          }
        }
        data.location = [data.address.longitude, data.address.latitude];
        // let timeScheduled = Number(store.avgDeliveryTime) + 10;
        if (
          data.deliveryCriteria &&
          data.deliveryCriteria.onDate &&
          moment(data.deliveryCriteria.onDate).diff(moment(), "m") < Number(store.avgDeliveryTime)
        ) {
          return reject({
            message: multilingualService.getResponseMessage("YOUNEEDTOCHANGE", lang),
            isNotScheduled: true,
          });
        }
        const order = await model.storeOrderEcommerce(data).save();
        await model.storeOrderEcommerce
          .findOne({
            _id: order._id,
          })
          .then(async (result) => {
            if (result.paymentMode === "Gpay") {
              await model
                .Transaction({
                  userId: data.userId,
                  transactionType: "redeemReward",
                  amount: Number(result.totalAmount - result.balanceLeft),
                  creditDebitType: "credit",
                })
                .save();
            }
            let payload = {
              title: `New Order`,
              message: `You placed order with <strong>${data.storeName}</strong>`,
              message: `You placed order with ${data.storeName}`,
              type: 1,
              storeId: data.storeId,
              orderId: result._id,
              orderStatus: 0,
              verticalType: 1,
              userId: userId,
            };
            let payload2 = {
              title: `New Order`,
              message: `New order received`,
              message: `New order received`,
              type: 1,
              storeId: data.storeId,
              orderId: result._id,
              orderStatus: 0,
              verticalType: 1,
              userId: userId,
            };
            if (store.storePackageType.toLowerCase() === "percentage") {
              let adminCommission = Number(result.subTotalAmount * store.storePackageTypeValue * 0.01) + Number(result.deliveryFee);
              Number(result.tax) + Number(result.packagingCharge);

              let merchantCommission = Number(result.subTotalAmount * (1 - store.storePackageTypeValue * 0.01));
              await model.storeOrderEcommerce.findOneAndUpdate({
                _id: mongoose.Types.ObjectId(result._id),
              }, {
                $set: {
                  adminCommission,
                  merchantCommission,
                },
              });
            }
            if (store.storePackageType.toLowerCase() === "flat") {
              let adminCommission = Number(store.storePackageTypeValue) + Number(result.deliveryFee);
              Number(result.tax) + Number(result.packagingCharge);

              let merchantCommission = Number(result.subTotalAmount - store.storePackageTypeValue);

              await model.storeOrderEcommerce.findOneAndUpdate({
                _id: mongoose.Types.ObjectId(result._id),
              }, {
                $set: {
                  adminCommission,
                  merchantCommission,
                },
              });
            }
            model.storeOrderEcommerce
              .findById(result._id)
              .populate(
                "items.itemId outletId storeId driverId",
                "firstName lastName profilePic countryCode phone name address image latitude longitude name_ar"
              )
              .then(async (resp) => {
                payload = payload;
                payload2 = payload2;
                /*****CART CALCULATIONS */
                resp.totalItemsAmount = totalItemsAmount;
                resp.cartAmount = cartAmount;
                resp.deliveryCharge = deliveryCharge;
                resp.cartItemCount = cartItemCount;
                // await Service.Notification.driversend(payload);
                if (data.scheduleType && (data.scheduleType == "DRIVETHRU" || data.scheduleType == "TAKEAWAY" || data.scheduleType == "DINEIN")) {
                  cartAmount -= deliveryCharge;
                  deliveryCharge = 0;
                }
                if (resp.deliveryCriteria != null && resp.deliveryCriteria.onDate != null) {
                  await model.storeOrderEcommerce.findOneAndUpdate({
                    _id: resp._id,
                  }, {
                    $set: {
                      status: 18,
                    },
                  }, {
                    nw: true,
                  });
                  let timeScheduled = Number(store.avgDeliveryTime) + 10;
                  // if (moment(resp.deliveryCriteria.onDate).diff(moment().add(330, "m"), "m") < Number(store.avgDeliveryTime)) {
                  //   return reject({
                  //     message: multilingualService.getResponseMessage("YOUNEEDTOCHANGE", lang),
                  //     isNotScheduled: true,
                  //   });
                  // }
                  process.emit("scheduleEvents", {
                    resp,
                    timeScheduled,
                  });
                }
                await Service.Notification.webPushNotification(payload2);
                done({
                  message: multilingualService.getResponseMessage("ORDERPLACED", lang),
                  data: resp,
                });
              });
          })
          .catch((err) => {
            return reject({
              message: multilingualService.getResponseMessage("FALSEMSG", lang),
            });
          });
      } catch (error) {
        console.log(error, "error");
      }
    });
  }

  getAllOrders(data, userId, lang) {
    return new Promise(async (done, reject) => {
      let qry = {
        userId: userId,
      };
      qry.status = data.status == "pending" ? {
        $in: [0,1,2,3,4,18]
      } : {
        $nin: [0,1,2,3,4,18]
      };
      let skip = Number(data.page) > 1 ? (Number(data.page) - 1) * Constant.LIMIT : 0;

      model.storeOrderEcommerce
        .find(qry)
        .populate(
          "items.itemId outletId storeId driverId",
          "firstName lastName profilePic countryCode phone name address image latitude longitude name_ar"
        )
        .skip(skip)
        .limit(Constant.LIMIT)
        .sort({
          _id: -1,
        })
        .lean()
        .then((result) => {
          model.storeOrderEcommerce.countDocuments(qry).then(async (count) => {
            let notiCount = await this.notiUnreadCount(userId);
            // const message = result.length <= 0 ? multilingualService.getResponseMessage('FETCHED_SUCCESSFULLY', lang) : multilingualService.getResponseMessage('FETCHED_SUCCESSFULLY', lang)

            done({
              message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
              data: {
                orderList: result,
                count: Math.ceil(count / Constant.LIMIT),
                notiCount: notiCount,
              },
            });
          });
        })
        .catch((err) => {
          return reject({
            message: message.multilingualService.getResponseMessage("FALSEMSG", lang),
          });
        });
    });
  }

  getBrandById(data, userId, lang) {
    return new Promise(async (done, reject) => {
      try {
        // const limit = Number(data.limit) || Constant.ADMINLIMIT;
        // const page = Math.max(1, Number(data.page) || 0);
        const sort = {
          _id: -1,
        };
        // const skip = Math.max(0, page - 1) * limit;

        // const query = { limit, page, skip };
        let pipeline = [{
          $match: {
            brandId: mongoose.Types.ObjectId(data.brandId),
            storeId: mongoose.Types.ObjectId(data.storeId),
          },
        }, ];

        if (data && data.label && data.label != "all") {
          pipeline = [{
            $match: {
              brandId: mongoose.Types.ObjectId(data.brandId),
              storeId: mongoose.Types.ObjectId(data.storeId),
              label: data.label,
            },
          }, ];
        }
        pipeline.push({
          $group: {
            _id: "$productKey",
            productName: {
              $first: "$productName",
            },
            productName_ar: {
              $first: "$productName_ar",
            },
            storeItemSubTypeId: {
              $first: "$storeItemSubTypeId",
            },
            storeItemTypeId: {
              $first: "$storeItemTypeId",
            },
            brandId: {
              $first: "$brandId",
            },
            label: {
              $first: "$label",
            },
            storeId: {
              $first: "$storeId",
            },
            createdAt: {
              $first: "$createdAt",
            },
            variants: {
              $push: {
                label: "$$ROOT.label",
                color: "$$ROOT.color",
                customizable: "$$ROOT.customizable",
                marketPrice: "$$ROOT.marketPrice",
                price: "$$ROOT.price",
                originalPrice: "$$ROOT.originalPrice",
                discount: "$$ROOT.discount",
                discountType: "$$ROOT.discountType",
                description_ar: "$$ROOT.description_ar",
                description: "$$ROOT.description",
                image1: "$$ROOT.image1",
                image2: "$$ROOT.image2",
                image3: "$$ROOT.image3",
                image4: "$$ROOT.image4",
                image5: "$$ROOT.image5",
                video: "$$ROOT.video",
                tickets: "$$ROOT.tickets",
                LP: "$$ROOT.LP",
                addOn: "$$ROOT.addOn",
                name_ar: "$$ROOT.name_ar",
                quantity: "$$ROOT.quantity",
                purchaseLimit: "$$ROOT.purchaseLimit",
                name: "$$ROOT.name",
                size: "$$ROOT.size",
                unit: "$$ROOT.unit",
                additional1: "$$ROOT.additional1",
                additional2: "$$ROOT.additional2",
                additional1_ar: "$$ROOT.additional1_ar",
                additional2_ar: "$$ROOT.additional2_ar",
                unitValue: "$$ROOT.unitValue",
                variantId: "$$ROOT.variantId",
                _id: "$$ROOT._id",
              },
            },
          },
        }, {
          $lookup: {
            from: "brands",
            localField: "brandId",
            foreignField: "_id",
            as: "brandId",
          },
        }, {
          $unwind: "$brandId",
        });

        pipeline.push({
          $sort: sort,
        });
        const products = await model.storeItemsEcommerce.aggregate(pipeline);

        for (const x in products) {
          let item = await model.favProduct
            .findOne({
              userId,
              productKey: products[x]._id,
            })
            .lean();
          products[x]["isFav"] = false;
          if (item) {
            products[x]["isFav"] = true;
          }
        }
        // let count = 0;
        // if (productData && productData.length) count = productData.length;

        // let pageCount = Math.ceil(count / limit) || 0;
        // let itemCount = count || 0;
        const message =
          products.length <= 0 ?
          multilingualService.getResponseMessage("EMPTY_LIST", lang) :
          multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang);
        done({
          message: message,
          data: {
            products,
          },
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  // async searchResult(data, lang) {
  //   return new Promise(async (done, reject) => {
  //     try {
  //       let storeTypes = await model.storeCategory
  //         .find({
  //           $and: [
  //             { name: { $regex: data.search, $options: "i" } },
  //             { status: { $ne: 2 } },
  //             { status: { $ne: 0 } },
  //             { status: { $ne: 3 } },
  //             { isVisible: true },
  //           ],
  //         })
  //         .lean();

  //       for (let i = 0; i < storeTypes.length; i++) {
  //         if (storeTypes[i].isHyperLocal) {
  //           let store = await model.storeEcommerce.aggregate([
  //             {
  //               $match: {
  //                 storeTypeId: storeTypes[i]._id,
  //                 $and: [{ status: { $ne: 2 } }, { status: { $ne: 3 } }],
  //                 isVisible: true,
  //               },
  //             },
  //             {
  //               $lookup: {
  //                 from: "storeoutlets",
  //                 let: { storeId: "$_id" },
  //                 pipeline: [
  //                   {
  //                     $geoNear: {
  //                       near: {
  //                         type: "Point",
  //                         coordinates: [
  //                           parseFloat(data.longitude),
  //                           parseFloat(data.latitude),
  //                         ],
  //                       },
  //                       distanceField: "distance",
  //                       spherical: true,
  //                       distanceMultiplier: 1e-3,
  //                       maxDistance: Constant.RADIUSCIRCLE,
  //                     },
  //                   },
  //                   { $match: { $expr: { $eq: ["$storeId", "$$storeId"] } } },
  //                   { $match: { $expr: { $eq: ["$status", 1] } } },
  //                 ],
  //                 as: "storeOutlets",
  //               },
  //             },
  //             {
  //               $project: {
  //                 _id: 1,
  //                 storeOutlets_size: { $size: "$storeOutlets" },
  //                 storeOutlets: 1,
  //               },
  //             },
  //             { $match: { $and: [{ storeOutlets_size: { $gte: 1 } }] } },
  //           ]);
  //           if (store[0]) {
  //             storeTypes[i]["hyperLocalStoreId"] = store[0]._id;
  //           } else {
  //             storeTypes[i]["hyperLocalStoreId"] = "";
  //           }
  //         }
  //       }

  //       let store = await model.store
  //         .aggregate([
  //           {
  //             $match: {
  //               name: { $regex: data.search, $options: "i" },
  //               $and: [{ status: { $ne: 2 } }, { status: { $ne: 3 } }],
  //             },
  //           },
  //           { $lookup: await this.outletLookup(data) },
  //           {
  //             $project: {
  //               name: 1,
  //               name_ar: 1,
  //               image: 1,
  //               currency: 1,
  //               description: 1,
  //               avgDeliveryTime: 1,
  //               avgOrderPrice: 1,
  //               isRecommended: 1,
  //               discountUpto: 1,
  //               categories: 1,
  //               discount: 1,
  //               openTime: 1,
  //               closeTime: 1,
  //               storeItemType: 1,
  //               storeTypeId: 1,
  //               storePackageType: 1,
  //               storePackageTypeValue: 1,
  //               isFavourite: 1,
  //               ratings: 1,
  //               status: 1,
  //               outlet_Size: { $size: "$outlets" },
  //               outlets: 1,
  //               isHyperLocal: 1,
  //             },
  //           },
  //         ])
  //         .exec();

  //       for (const x in store) {
  //         let storeType = await model.storeCategory
  //           .find({
  //             $and: [
  //               { status: { $ne: 3 } },
  //               { status: { $ne: 2 } },
  //               { _id: mongoose.Types.ObjectId(store[x].storeTypeId) },
  //             ],
  //           })
  //           .exec();
  //         for (const y in storeType) {
  //           if (storeType[y].isHyperLocal) {
  //             store[x]["isHyperLocal"] = true;
  //           } else {
  //             store[x]["isHyperLocal"] = false;
  //           }
  //         }
  //       }

  //       let product = await model.storeItem
  //         .aggregate([
  //           { $match: { productName: { $regex: data.search, $options: "i" } } },
  //           {
  //             $group: {
  //               _id: "$productKey",
  //               productName: { $first: "$productName" },
  //               productName_ar: { $first: "$productName_ar" },
  //               storeItemSubTypeId: { $first: "$storeItemSubTypeId" },
  //               storeItemTypeId: { $first: "$storeItemTypeId" },
  //               brandId: { $first: "$brandId" },
  // label:{$first:"$label"},
  //               createdAt: { $first: "$createdAt" },
  //               storeId: { $first: "$storeId" },
  //               variants: {
  //                 $push: {
  //                   color: "$$ROOT.color",
  // customizable:"$$ROOT.customizable",
  // marketPrice: "$$ROOT.marketPrice"
  //                   price: "$$ROOT.price",
  //                   originalPrice: "$$ROOT.originalPrice",
  //                   discount: "$$ROOT.discount",
  //                   discountType: "$$ROOT.discountType",
  //                   description_ar: "$$ROOT.description_ar",
  //                   description: "$$ROOT.description",
  //                   image1: "$$ROOT.image1",
  //                   image2: "$$ROOT.image2",
  //                   image3: "$$ROOT.image3",
  //                   image4: "$$ROOT.image4",
  //                   image5: "$$ROOT.image5",
  //                   video: "$$ROOT.video",
  //                   tickets: "$$ROOT.tickets",
  //                   LP: "$$ROOT.LP",
  //                   name_ar: "$$ROOT.name_ar",
  //                   quantity: "$$ROOT.quantity",
  //                   purchaseLimit: "$$ROOT.purchaseLimit",
  //                   name: "$$ROOT.name",
  //                   size: "$$ROOT.size",
  //                   unit: "$$ROOT.unit",
  //                   additional1: "$$ROOT.additional1",
  //                   additional2: "$$ROOT.additional2",
  //                   additional1_ar: "$$ROOT.additional1_ar",
  //                   additional2_ar: "$$ROOT.additional2_ar",
  //                   unitValue: "$$ROOT.unitValue",
  //                   variantId: "$$ROOT.variantId",
  //                   _id: "$$ROOT._id",
  //                 },
  //               },
  //             },
  //           },
  //         ])
  //         .exec();

  //       for (const p in product) {
  //         for (const q in product[p].variants) {
  //           if (product[p].variants[q].image1.length > 0) {
  //             product[p]["image"] = product[p].variants[q].image1;
  //           }
  //           if (product[p].variants[q].image2.length > 0) {
  //             product[p]["image"] = product[p].variants[q].image2;
  //           }
  //           if (product[p].variants[q].image3.length > 0) {
  //             product[p]["image"] = product[p].variants[q].image3;
  //           }
  //           if (product[p].variants[q].image4.length > 0) {
  //             product[p]["image"] = product[p].variants[q].image4;
  //           }
  //           if (product[p].variants[q].image5.length > 0) {
  //             product[p]["image"] = product[p].variants[q].image5;
  //           }
  //         }
  //       }

  //       let category = await model.storeItemTypeEcommerce
  //         .find({
  //           $and: [
  //             { status: { $ne: 2 } },
  //             { status: { $ne: 3 } },
  //             { isParent: true },
  //             { name: { $regex: data.search, $options: "i" } },
  //           ],
  //         })
  //         .exec();

  //       for (const a in category) {
  //         let storeTypes = await model.storeCategory
  //           .find({ _id: category[a].storeCategoryId })
  //           .exec();
  //         for (let i = 0; i < storeTypes.length; i++) {
  //           if (storeTypes[i].isHyperLocal) {
  //             let store = await model.storeEcommerce.aggregate([
  //               { $match: { storeTypeId: storeTypes[i]._id } },
  //               {
  //                 $lookup: {
  //                   from: "storeoutlets",
  //                   let: { storeId: "$_id" },
  //                   pipeline: [
  //                     {
  //                       $geoNear: {
  //                         near: {
  //                           type: "Point",
  //                           coordinates: [
  //                             parseFloat(data.longitude),
  //                             parseFloat(data.latitude),
  //                           ],
  //                         },
  //                         distanceField: "distance",
  //                         spherical: true,
  //                         distanceMultiplier: 1e-3,
  //                         maxDistance: Constant.RADIUSCIRCLE,
  //                       },
  //                     },
  //                     { $match: { $expr: { $eq: ["$storeId", "$$storeId"] } } },
  //                     { $match: { $expr: { $eq: ["$status", 1] } } },
  //                   ],
  //                   as: "storeOutlets",
  //                 },
  //               },
  //               {
  //                 $project: {
  //                   _id: 1,
  //                   storeOutlets_size: { $size: "$storeOutlets" },
  //                   storeOutlets: 1,
  //                 },
  //               },
  //               { $match: { $and: [{ storeOutlets_size: { $gte: 1 } }] } },
  //             ]);
  //             if (store[0]) {
  //               category[a]["hyperLocalStoreId"] = store[0]._id;
  //             } else {
  //               category[a]["hyperLocalStoreId"] = "";
  //             }
  //           } else {
  //             category[a]["hyperLocalStoreId"] = "";
  //           }
  //         }
  //       }

  //       let subCategory = await model.storeItemTypeEcommerce
  //         .find({
  //           $and: [
  //             { status: { $ne: 2 } },
  //             { status: { $ne: 3 } },
  //             { isSubCategory: true },
  //             { name: { $regex: data.search, $options: "i" } },
  //           ],
  //         })
  //         .exec();
  //       for (const m in subCategory) {
  //         let categoryData = await model.storeItemTypeEcommerce
  //           .find({
  //             $and: [
  //               { status: { $ne: 2 } },
  //               { status: { $ne: 3 } },
  //               { isParent: true },
  //               { _id: subCategory[m].parentId },
  //             ],
  //           })
  //           .exec();
  //         for (const n in categoryData) {
  //           let storeTypes = await model.storeCategory
  //             .find({ _id: categoryData[n].storeCategoryId })
  //             .exec();
  //           for (let i = 0; i < storeTypes.length; i++) {
  //             if (storeTypes[i].isHyperLocal) {
  //               let store = await model.storeEcommerce.aggregate([
  //                 { $match: { storeTypeId: storeTypes[i]._id } },
  //                 {
  //                   $lookup: {
  //                     from: "storeoutlets",
  //                     let: { storeId: "$_id" },
  //                     pipeline: [
  //                       {
  //                         $geoNear: {
  //                           near: {
  //                             type: "Point",
  //                             coordinates: [
  //                               parseFloat(data.longitude),
  //                               parseFloat(data.latitude),
  //                             ],
  //                           },
  //                           distanceField: "distance",
  //                           spherical: true,
  //                           distanceMultiplier: 1e-3,
  //                           maxDistance: Constant.RADIUSCIRCLE,
  //                         },
  //                       },
  //                       {
  //                         $match: { $expr: { $eq: ["$storeId", "$$storeId"] } },
  //                       },
  //                       { $match: { $expr: { $eq: ["$status", 1] } } },
  //                     ],
  //                     as: "storeOutlets",
  //                   },
  //                 },
  //                 {
  //                   $project: {
  //                     _id: 1,
  //                     storeOutlets_size: { $size: "$storeOutlets" },
  //                     storeOutlets: 1,
  //                   },
  //                 },
  //                 { $match: { $and: [{ storeOutlets_size: { $gte: 1 } }] } },
  //               ]);
  //               if (store[0]) {
  //                 subCategory[m]["hyperLocalStoreId"] = store[0]._id;
  //               } else {
  //                 subCategory[m]["hyperLocalStoreId"] = "";
  //               }
  //             } else {
  //               subCategory[m]["hyperLocalStoreId"] = "";
  //             }
  //           }
  //         }
  //       }

  //       const output = []
  //         .concat(
  //           storeTypes.map((item) => ({
  //             _id: item._id,
  //             status: item.status,
  //             indexAt: item.indexAt,
  //             name: item.name,
  //             name_ar: item.name_ar,
  //             image: item.image,
  //             isHyperLocal: item.isHyperLocal,
  //             createdAt: item.createdAt,
  //             updatedAt: item.updatedAt,
  //             isVisible: item.isVisible,
  //             hyperLocalStoreId: item.hyperLocalStoreId,
  //             type: "storeType",
  //             typeArabic: "arabicName",
  //           })),
  //           store.map((item) => ({
  //             _id: item._id,
  //             status: item.status,
  //             discount: item.discount,
  //             discountUpto: item.discountUpto,
  //             isRecommended: item.isRecommended,
  //             avgDeliveryTime: item.avgDeliveryTime,
  //             avgOrderPrice: item.avgOrderPrice,
  //             isFavourite: item.isFavourite,
  //             storePackageTypeValue: item.storePackageTypeValue,
  //             openTime: item.openTime,
  //             closeTime: item.closeTime,
  //             name: item.name,
  //             name_ar: item.name_ar,
  //             storeTypeId: item.storeTypeId,
  //             storePackageType: item.storePackageType,
  //             image: item.image,
  //             outlets: item.outlets,
  //             outlet_Size: item.outlet_Size,
  //             typeArabic: "arabicName",
  //             type: "store",
  //             hyperLocalStoreId: "",
  //           })),
  //           product.map((item) => ({
  //             _id: item._id,
  //             name: item.productName,
  //             name_ar: item.productName_ar,
  //             storeItemSubTypeId: item.storeItemSubTypeId,
  //             storeItemTypeId: item.storeItemTypeId,
  //             brandId: item.brandId,
  //             createdAt: item.createdAt,
  //             storeId: item.storeId,
  //             variants: item.variants,
  //             image: item.image,
  //             type: "product",
  //             typeArabic: "arabicName",
  //             hyperLocalStoreId: "",
  //           })),
  //           category.map((item) => ({
  //             _id: item._id,
  //             status: item.status,
  //             indexAt: item.indexAt,
  //             name: item.name,
  //             name_ar: item.name_ar,
  //             image: item.image,
  //             tax: item.tax,
  //             isParent: item.isParent,
  //             createdAt: item.createdAt,
  //             updatedAt: item.updatedAt,
  //             storeCategoryId: item.storeCategoryId,
  //             hyperLocalStoreId: item.hyperLocalStoreId,
  //             type: "category",
  //             typeArabic: "arabicName",
  //           })),
  //           subCategory.map((item) => ({
  //             _id: item._id,
  //             status: item.status,
  //             indexAt: item.indexAt,
  //             name: item.name,
  //             name_ar: item.name_ar,
  //             image: item.image,
  //             tax: item.tax,
  //             createdAt: item.createdAt,
  //             updatedAt: item.updatedAt,
  //             parentId: item.parentId,
  //             isSubCategory: item.isSubCategory,
  //             hyperLocalStoreId: item.hyperLocalStoreId,
  //             type: "subCategory",
  //             typeArabic: "arabicName",
  //           }))
  //         )
  //         .slice(0, 10);
  //       done({ message: "Done", data: output });
  //     } catch (error) {
  //       console.log(error, "8878787878787887887");
  //       return reject({
  //         message: multilingualService.getResponseMessage("FALSEMSG", lang),
  //       });
  //     }
  //   });
  // }

  // async keywordSearch(data, lang) {
  //   let storeTypes = await model.storeCategory
  //     .find({ isHyperLocal: false })
  //     .distinct("_id");

  //   // let stores = await model.store
  //   //   .find({ storeTypeId: { $in: storeTypes } })
  //   //   .select("_id name image")
  //   //   .lean();

  //   let storesResult = await model.store
  //     .find({
  //       storeTypeId: { $in: storeTypes },
  //       name: { $regex: data.keyword, $options: "i" },
  //     })
  //     .select("_id name name_ar image")
  //     .limit(2)
  //     .lean();

  //   let cats = await model.storeItemTypeEcommerce
  //     .find({
  //       storeCategoryId: { $in: storeTypes },
  //     })
  //     .distinct("_id");

  //   let catResults = await model.storeItemTypeEcommerce.aggregate([
  //     {
  //       $match: {
  //         name: { $regex: data.keyword, $options: "i" },

  //         storeCategoryId: { $in: storeTypes },
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: "storeitems",
  //         let: { catId: "$_id" },
  //         pipeline: [
  //           {
  //             $match: {
  //               $expr: {
  //                 $and: [
  //                   { $eq: ["$storeItemTypeId", "$$catId"] },
  //                   // { $eq: ["isProto", false] },
  //                 ],
  //               },
  //             },
  //           },
  //           { $group: { _id: "$storeId" } },
  //         ],
  //         as: "stores",
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: "stores",
  //         localField: "stores._id",
  //         foreignField: "_id",
  //         as: "storeDetails",
  //       },
  //     },
  //     {
  //       $project: {
  //         _id: 1,
  //         name: 1,
  //         image: 1,
  //         "storeDetails.name": 1,
  //         "storeDetails._id": 1,
  //         storelength: { $size: "$storeDetails" },
  //       },
  //     },
  //     { $match: { storelength: { $gte: 1 } } },
  //     { $limit: 2 },
  //   ]);
  //   let brandResults = await model.storeItemTypeEcommerce.aggregate([
  //     {
  //       $match: {
  //         name: { $regex: data.keyword, $options: "i" },
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: "storeitems",
  //         let: { catId: "$_id" },
  //         pipeline: [
  //           {
  //             $match: {
  //               $expr: {
  //                 $and: [
  //                   { $eq: ["$storeItemTypeId", "$$catId"] },
  //                   // { $eq: ["isProto", false] },
  //                 ],
  //               },
  //             },
  //           },
  //           { $group: { _id: "$storeId" } },
  //         ],
  //         as: "stores",
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: "stores",
  //         localField: "stores._id",
  //         foreignField: "_id",
  //         as: "storeDetails",
  //       },
  //     },
  //     {
  //       $project: {
  //         _id: 1,
  //         name: 1,
  //         "storeDetails.name": 1,
  //         "storeDetails._id": 1,
  //         storelength: { $size: "$storeDetails" },
  //       },
  //     },
  //     { $match: { storelength: { $gte: 1 } } },
  //   ]);

  //   let subCatResults = await model.storeItemTypeEcommerce.aggregate([
  //     {
  //       $match: {
  //         name: { $regex: data.keyword, $options: "i" },

  //         parentId: { $in: cats },
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: "storeitems",
  //         let: { catId: "$_id" },
  //         pipeline: [
  //           {
  //             $match: {
  //               $expr: {
  //                 $and: [
  //                   { $eq: ["$storeItemSubTypeId", "$$catId"] },
  //                   // { $eq: ["isProto", false] },
  //                 ],
  //               },
  //             },
  //           },
  //           { $group: { _id: "$storeId" } },
  //         ],
  //         as: "stores",
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: "stores",
  //         localField: "stores._id",
  //         foreignField: "_id",
  //         as: "storeDetails",
  //       },
  //     },
  //     {
  //       $project: {
  //         _id: 1,
  //         name: 1,
  //         "storeDetails.name": 1,
  //         "storeDetails._id": 1,
  //         storelength: { $size: "$storeDetails" },
  //       },
  //     },
  //     { $match: { storelength: { $gte: 1 } } },
  //     { $limit: 2 },
  //   ]);
  //   let products = await model.storeItemsEcommerce.aggregate([
  //     {
  //       $match: {
  //         name: { $regex: data.keyword, $options: "i" },

  //         status: 1,
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: "stores",
  //         localField: "storeId",
  //         foreignField: "_id",
  //         as: "storeDetails",
  //       },
  //     },
  //     {
  //       $project: {
  //         _id: 1,
  //         name: 1,
  //         "storeDetails.name": 1,
  //         "storeDetails._id": 1,
  //         storelength: { $size: "$storeDetails" },
  //       },
  //     },
  //     { $match: { storelength: { $gte: 1 } } },
  //     { $limit: 2 },
  //   ]);
  //   let hyperlocalData = {};
  //   {
  //     let storeTypes = await model.storeCategory
  //       .find({ isHyperLocal: true })
  //       .distinct("_id");

  //     let storeTypesData = await model.storeCategoryEcommerce.find({}).lean();
  //     let storeTypesMap = {};
  //     storeTypesData.forEach((item) => {
  //       storeTypesMap[item._id] = item.name;
  //     });
  //     console.log(storeTypesMap);
  //     let stores = await model.store
  //       .find({ storeTypeId: { $in: storeTypes } })
  //       .select("_id name");
  //     let cats = await model.storeItemTypeEcommerce
  //       .find({
  //         storeCategoryId: { $in: storeTypes },
  //       })
  //       .distinct("_id");

  //     let catData = await model.storeItemTypeEcommerce.find({}).lean();

  //     let catMap = {};

  //     catData.forEach((item) => {
  //       catMap[item._id] = item.storeCategoryId;
  //     });

  //     let catResults = await model.storeItemTypeEcommerce.aggregate([
  //       {
  //         $match: {
  //           name: { $regex: data.keyword, $options: "i" },

  //           storeCategoryId: { $in: storeTypes },
  //         },
  //       },
  //       {
  //         $lookup: {
  //           from: "storecategories",
  //           localField: "storeCategoryId",
  //           foreignField: "_id",
  //           as: "storeType",
  //         },
  //       },
  //       { $unwind: "$storeType" },
  //       {
  //         $project: {
  //           name: 1,
  //           _id: 1,
  //           "storeType.name": 1,
  //           "storeType._id": 1,
  //         },
  //       },
  //       {
  //         $limit: 2,
  //       },
  //     ]);
  //     console.log(catMap);

  //     // let brandResults = await model.storeItemTypeEcommerce.aggregate([
  //     //   {
  //     //     $match: {
  //     //       brands: { $in: storeTypes },
  //     //     },
  //     //   },
  //     //   {
  //     //     $lookup: {
  //     //       from: "storeitems",
  //     //       let: { catId: "$_id" },
  //     //       pipeline: [
  //     //         {
  //     //           $match: {
  //     //             $expr: {
  //     //               $and: [
  //     //                 { $eq: ["$storeItemTypeId", "$$catId"] },
  //     //                 // { $eq: ["isProto", false] },
  //     //               ],
  //     //             },
  //     //           },
  //     //         },
  //     //         { $group: { _id: "$storeId" } },
  //     //       ],
  //     //       as: "stores",
  //     //     },
  //     //   },
  //     //   {
  //     //     $lookup: {
  //     //       from: "stores",
  //     //       localField: "stores._id",
  //     //       foreignField: "_id",
  //     //       as: "storeDetails",
  //     //     },
  //     //   },
  //     //   {
  //     //     $unwind: "$storeDetails",
  //     //   },
  //     //   {
  //     //     $group: {
  //     //       _id:"storeTypeId"
  //     //     }
  //     //   },
  //     //   {
  //     //       $lookup: {
  //     //       from: "storecategories",
  //     //       localField: "_id",
  //     //       foreignField: "_id",
  //     //       as: "storeDetails",
  //     //     },
  //     //   },
  //     //   {
  //     //     $project: {
  //     //       _id: 1,
  //     //       name: 1,
  //     //       "storeDetails.name": 1,
  //     //       "storeDetails._id": 1,
  //     //       storelength: { $size: "$storeDetails" },
  //     //     },
  //     //   },
  //     //   { $match: { storelength: { $gte: 1 } } },
  //     // ]);

  //     let subCatResults = await model.storeItemTypeEcommerce
  //       .find({
  //         name: { $regex: data.keyword, $options: "i" },

  //         parentId: { $in: cats },
  //       })
  //       .limit(2)
  //       .lean();

  //     subCatResults = subCatResults.map((item) => {
  //       let data = {};
  //       console.log(item.parentId, "a3a1s351");
  //       data.storeType = storeTypesMap[catMap[item.parentId.toString()]];
  //       data.name = item.name;
  //       data._id = item._id;
  //       data.type = "SUBCAT";
  //       return data;
  //     });

  //     let products = await model.storeItemsEcommerce.aggregate([
  //       {
  //         $match: {
  //           name: { $regex: data.keyword, $options: "i" },

  //           status: 1,
  //         },
  //       },
  //       {
  //         $limit: 2,
  //       },
  //     ]);

  //     products = products.map((item) => {
  //       let data = {};
  //       data.storeType = storeTypesMap[catMap[item.storeItemTypeId.toString()]];

  //       console.log(item.storeItemTypeId, "aaaaaaa");
  //       data.name = item.name;
  //       data._id = item._id;
  //       data.type = "PRODUCT";
  //       return data;
  //     });

  //     catResults = catResults.map((item) => {
  //       item.storeType = item.storeType.name;
  //       item.type = "CAT";
  //       return item;
  //     });
  //     hyperlocalData = [].concat(subCatResults, products, catResults);
  //   }
  //   catResults = catResults.map((item) => {
  //     item.type = "CAT";
  //     return item;
  //   });
  //   subCatResults = subCatResults.map((item) => {
  //     item.type = "SUBCAT";
  //     return item;
  //   });
  //   products = products.map((item) => {
  //     item.type = "PRODUCT";
  //     return item;
  //   });
  //   storesResult = storesResult.map((item) => {
  //     item.type = "STORE";
  //     return item;
  //   });
  //   let arr = [].concat(subCatResults, products, catResults, storesResult);
  //   return {
  //     message: "",
  //     data: {
  //       arr,
  //       hyperlocalData,
  //     },
  //     // data: { catResults },
  //   };
  // }
  getSearchStores(data, userId, lang) {
    return new Promise(async (done, reject) => {
      //       {
      //    filter: {
      //      avgTime: '100',
      //      cost: '-1',
      //      foodType: '2',
      //      maxprice: '100',
      //      minprice: '56',
      //      preparationTime: '',
      //      rating: '2'
      //    },
      //    latitude: 30.7133538,
      //    longitude: 76.7097837,
      //    search: ''
      //  }
      model.store
        .aggregate([{
            $lookup: await this.outletLookup(data),
          },
          {
            $project: preProject,
          },
          {
            $match: {
              outlet_Size: {
                $gte: 1,
              },
            },
          },
          {
            $lookup: ratingLookup,
          },
          {
            $lookup: await this.favLookup(userId),
          },
          {
            $project: project,
          },
          {
            $match: {
              outletSize: {
                $gte: 1,
              },
            },
          },
        ])
        .then((resp) => {
          done({
            data: resp,
          });
        });
    });
  }

  checkOrderAddress(data, userId, lang) {
    return new Promise(async (done, reject) => {
      try {
        let deliveryRadius = Constant.RADIUSCIRCLE;
        let cartAmount = 0;
        let deliveryCharge = 0;
        let storeId = null;
        try {
          let cartData = await userRepo.getCartStore(userId, lang);
          if (cartData) cartAmount = cartData.data.cartDetails.cartAmount;
          if (cartData) deliveryCharge = cartData.data.cartDetails.deliveryCharge;
          if (cartData) storeId = cartData.data.cart[0].storeId;
        } catch (error) {}

        const perKmCharge = await model.AppSetting.findOne({}).exec();
        if (storeId != null) {
          let radius = await model.storeEcommerce.findOne({
            _id: storeId,
            deliveryAreaType: "fixed_area",
          }, {
            deliveryArea: 1,
          });
          if (radius != null && radius.deliveryArea != 0) {
            deliveryRadius = radius.deliveryArea;
          }
        }
        await model.storeOutletsEcommerce
          .aggregate([{
              $geoNear: {
                near: {
                  type: "Point",
                  coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
                },
                distanceField: "distance",
                spherical: true,
                distanceMultiplier: 1e-3,
                maxDistance: deliveryRadius,
              },
            },
            {
              $match: {
                _id: mongoose.Types.ObjectId(data.outletId),
              },
            },
          ])
          .then(async (result) => {
            if (result.length) {
              let deliveryFee = 0;
              // deliveryFee = Number(
              //   (result[0].distance * perKmCharge.driverPerKmCharge).toFixed(2)
              // );
              deliveryFee = perKmCharge.driverPerKmCharge || deliveryCharge;
              if (deliveryCharge)
                await model.storeCartEcommerce.updateMany({
                  userId: userId,
                }, {
                  $set: {
                    deliveryCharge: Math.ceil(deliveryFee),
                  },
                });
              if (!deliveryCharge) cartAmount += Math.ceil(deliveryFee);
              done({
                message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
                data: {
                  result,
                  deliverCharge: Math.ceil(deliveryFee),
                  cartAmount,
                },
              });
            } else
              reject({
                message: multilingualService.getResponseMessage("NOTDELIVERHERE", lang),
                // data: result,
              });
          })
          .catch((e) => {
            reject({
              message: multilingualService.getResponseMessage("FALSEMSG", lang),
              // data: result,
            });
          });
      } catch (error) {
        reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
          // data: result,
        });
      }
    });
  }

  async getProductById(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        let deliveryRadius = Constant.RADIUSCIRCLE;
        let product = await model.storeItemsEcommerce.aggregate([{
            $match: {
              productKey: data.itemId,
              isProto: false,
            },
          },
          {
            $group: {
              _id: "$productKey",
              productName: {
                $first: "$productName",
              },
              productName_ar: {
                $first: "$productName_ar",
              },
              storeItemSubTypeId: {
                $first: "$storeItemSubTypeId",
              },
              storeItemTypeId: {
                $first: "$storeItemTypeId",
              },
              brand_Id: {
                $first: "$brandId",
              },
              createdAt: {
                $first: "$createdAt",
              },
              storeId: {
                $first: "$storeId",
              },
              variants: {
                $push: {
                  label: "$$ROOT.label",
                  color: "$$ROOT.color",
                  customizable: "$$ROOT.customizable",
                  marketPrice: "$$ROOT.marketPrice",
                  price: "$$ROOT.price",
                  originalPrice: "$$ROOT.originalPrice",
                  discount: "$$ROOT.discount",
                  discountType: "$$ROOT.discountType",
                  description_ar: "$$ROOT.description_ar",
                  description: "$$ROOT.description",
                  image1: "$$ROOT.image1",
                  image2: "$$ROOT.image2",
                  image3: "$$ROOT.image3",
                  image4: "$$ROOT.image4",
                  image5: "$$ROOT.image5",
                  video: "$$ROOT.video",
                  tickets: "$$ROOT.tickets",
                  LP: "$$ROOT.LP",
                  addOn: "$$ROOT.addOn",
                  name_ar: "$$ROOT.name_ar",
                  quantity: "$$ROOT.quantity",
                  purchaseLimit: "$$ROOT.purchaseLimit",
                  name: "$$ROOT.name",
                  size: "$$ROOT.size",
                  unit: "$$ROOT.unit",
                  additional1: "$$ROOT.additional1",
                  additional2: "$$ROOT.additional2",
                  additional1_ar: "$$ROOT.additional1_ar",
                  additional2_ar: "$$ROOT.additional2_ar",
                  unitValue: "$$ROOT.unitValue",
                  variantId: "$$ROOT.variantId",
                  _id: "$$ROOT._id",
                },
              },
            },
          },
          {
            $lookup: {
              from: "brands",
              localField: "brand_Id",
              foreignField: "_id",
              as: "brandId",
            },
          },
          {
            $unwind: "$brandId",
          },
        ]);
        for (const x in product) {
          // if(storeId != null){
          //   let radius = await model.storeEcommerce.findOne({
          //     _id: mongoose.Types.ObjectId(product[x].storeId),
          //     deliveryAreaType : "fixed_area"
          //   },{deliveryArea:1})
          //   if(radius != null && radius.deliveryArea != 0){
          //     deliveryRadius = Number(radius.deliveryArea)
          //   }
          // }
          let store = await model.storeEcommerce.aggregate([{
              $match: {
                _id: mongoose.Types.ObjectId(product[x].storeId),
              },
            },
            {
              $lookup: {
                from: "storeoutlets",
                let: {
                  storeId: "$_id",
                },
                pipeline: [{
                    $geoNear: {
                      near: {
                        type: "Point",
                        coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
                      },
                      distanceField: "distance",
                      spherical: true,
                      distanceMultiplier: 1e-3,
                      maxDistance: deliveryRadius,
                    },
                  },
                  {
                    $match: {
                      $expr: {
                        $eq: ["$storeId", "$$storeId"],
                      },
                    },
                  },
                  // { $match: { $expr: { $eq: ["$status", 1] } } },
                ],
                as: "storeOutlets",
              },
            },
            {
              $project: {
                _id: 1,
                storeOutlets_size: {
                  $size: "$storeOutlets",
                },
                storeOutlets: 1,
              },
            },
            // { $match: { $and: [{ storeOutlets_size: { $gte: 1 } }] } },
          ]);

          for (const y in store) {
            product[x]["storeAddress"] = store[y].storeOutlets[0].address || "";
            product[x]["outletId"] = store[y].storeOutlets[0]._id;
            product[x]["storeId"] = store[y]._id;
          }
        }
        done({
          message: "fetched Successfully",
          data: product,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  async getProductByKeyAndStoreId(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        let product = await model.storeItemsEcommerce.aggregate([{
            $match: {
              productKey: data.productKey,
              storeId: mongoose.Types.ObjectId(data.storeId),
            },
          },
          {
            $group: {
              _id: "$productKey",
              productName: {
                $first: "$productName",
              },
              productName_ar: {
                $first: "$productName_ar",
              },
              storeItemSubTypeId: {
                $first: "$storeItemSubTypeId",
              },
              storeItemTypeId: {
                $first: "$storeItemTypeId",
              },
              brand_Id: {
                $first: "$brandId",
              },
              createdAt: {
                $first: "$createdAt",
              },
              storeId: {
                $first: "$storeId",
              },
              variants: {
                $push: {
                  label: "$$ROOT.label",
                  color: "$$ROOT.color",
                  customizable: "$$ROOT.customizable",
                  marketPrice: "$$ROOT.marketPrice",
                  price: "$$ROOT.price",
                  originalPrice: "$$ROOT.originalPrice",
                  discount: "$$ROOT.discount",
                  discountType: "$$ROOT.discountType",
                  description_ar: "$$ROOT.description_ar",
                  description: "$$ROOT.description",
                  image1: "$$ROOT.image1",
                  image2: "$$ROOT.image2",
                  image3: "$$ROOT.image3",
                  image4: "$$ROOT.image4",
                  image5: "$$ROOT.image5",
                  video: "$$ROOT.video",
                  tickets: "$$ROOT.tickets",
                  LP: "$$ROOT.LP",
                  addOn: "$$ROOT.addOn",
                  name_ar: "$$ROOT.name_ar",
                  quantity: "$$ROOT.quantity",
                  purchaseLimit: "$$ROOT.purchaseLimit",
                  name: "$$ROOT.name",
                  size: "$$ROOT.size",
                  unit: "$$ROOT.unit",
                  additional1: "$$ROOT.additional1",
                  additional2: "$$ROOT.additional2",
                  additional1_ar: "$$ROOT.additional1_ar",
                  additional2_ar: "$$ROOT.additional2_ar",
                  unitValue: "$$ROOT.unitValue",
                  variantId: "$$ROOT.variantId",
                  _id: "$$ROOT._id",
                },
              },
            },
          },
          {
            $lookup: {
              from: "brands",
              localField: "brand_Id",
              foreignField: "_id",
              as: "brandId",
            },
          },
          {
            $unwind: "$brandId",
          },
        ]);
        product = product[0];
        product.isFav = false;
        if (global.favs[userId + data.productKey]) product.isFav = true;
        done({
          message: "fetched Successfully",
          data: product,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  favLookup(userId) {
    return {
      from: "favstores",
      let: {
        storeId: "$_id",
      },
      pipeline: [{
          $match: {
            $expr: {
              $and: [{
                  $eq: ["$storeId", "$$storeId"],
                },
                {
                  $eq: ["$userId", mongoose.Types.ObjectId(userId)],
                },
              ],
            },
          },
        },
        {
          $project: {
            storeId: 1,
            _id: 0,
          },
        },
      ],
      as: "favourites",
    };
  }

  outletLookupWithoutGeoNear(data) {
    return {
      from: "storeoutlets",
      let: {
        storeId: "$_id",
      },
      pipeline: [{
          $match: {
            $expr: {
              $eq: ["$storeId", "$$storeId"],
            },
          },
        },
        {
          $match: {
            $expr: {
              $eq: ["$status", 1],
            },
          },
        },
        {
          $addFields: {
            isSelected: false,
          },
        },
        {
          $project: {
            address: 1,
            _id: 1,
            latitude: 1,
            longitude: 1,
            isSelected: 1,
            distance: 1 /*{ $round: ["$distance", 1] } */ ,
          },
        },
      ],
      as: "outlets",
    };
  }

  outletLookup(data) {
    return {
      from: "storeoutlets",
      let: {
        storeId: "$_id",
      },
      pipeline: [{
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
            },
            distanceField: "distance",
            spherical: true,
            distanceMultiplier: 1e-3,
            maxDistance: Constant.RADIUSCIRCLE,
          },
        },
        {
          $match: {
            $expr: {
              $eq: ["$storeId", "$$storeId"],
            },
          },
        },
        {
          $match: {
            $expr: {
              $eq: ["$status", 1],
            },
          },
        },
        {
          $addFields: {
            isSelected: false,
          },
        },
        {
          $sort: {
            distance: 1,
          },
        },
        {
          $project: {
            address: 1,
            _id: 1,
            latitude: 1,
            longitude: 1,
            isSelected: 1,
            distance: 1 /*{ $round: ["$distance", 1] } */ ,
          },
        },
      ],
      as: "outlets",
    };
  }

  async getStoresByCategoryOrSubCategory(req, res, next) {
    try {
      let data = req.query;
      let pipeline = [{
          $group: {
            _id: "$storeId",
            productName: {
              $first: "$productName",
            },
            productName_ar: {
              $first: "$productName_ar",
            },
            storeItemSubTypeId: {
              $first: "$storeItemSubTypeId",
            },
            storeItemTypeId: {
              $first: "$storeItemTypeId",
            },
            storeId: {
              $first: "$storeId",
            },
            brandId: {
              $first: "$brandId",
            },
            label: {
              $first: "$label",
            },
            createdAt: {
              $first: "$createdAt",
            },
            variants: {
              $push: {
                label: "$$ROOT.label",
                color: "$$ROOT.color",
                customizable: "$$ROOT.customizable",
                marketPrice: "$$ROOT.marketPrice",
                price: "$$ROOT.price",
                originalPrice: "$$ROOT.originalPrice",
                discount: "$$ROOT.discount",
                discountType: "$$ROOT.discountType",
                description_ar: "$$ROOT.description_ar",
                description: "$$ROOT.description",
                image1: "$$ROOT.image1",
                image2: "$$ROOT.image2",
                image3: "$$ROOT.image3",
                image4: "$$ROOT.image4",
                image5: "$$ROOT.image5",
                video: "$$ROOT.video",
                tickets: "$$ROOT.tickets",
                LP: "$$ROOT.LP",
                name_ar: "$$ROOT.name_ar",
                quantity: "$$ROOT.quantity",
                purchaseLimit: "$$ROOT.purchaseLimit",
                name: "$$ROOT.name",
                size: "$$ROOT.size",
                addOn: "$$ROOT.addOn",
                unit: "$$ROOT.unit",
                additional1: "$$ROOT.additional1",
                additional2: "$$ROOT.additional2",
                additional1_ar: "$$ROOT.additional1_ar",
                additional2_ar: "$$ROOT.additional2_ar",
                unitValue: "$$ROOT.unitValue",
                variantId: "$$ROOT.variantId",
                _id: "$$ROOT._id",
              },
            },
          },
        },
        {
          $unwind: "$brandId",
        },
        {
          $lookup: {
            from: "stores",
            localField: "storeId",
            foreignField: "_id",
            as: "storeId",
          },
        },
        {
          $unwind: "$storeId",
        },
        {
          $lookup: {
            from: "storeoutlets",
            let: {
              storeId: "$storeId._id",
            },
            pipeline: [{
                $geoNear: {
                  near: {
                    type: "Point",
                    coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
                  },
                  distanceField: "distance",
                  spherical: true,
                  distanceMultiplier: 1e-3,
                  maxDistance: 30000,
                },
              },
              {
                $match: {
                  $expr: {
                    $eq: ["$storeId", "$$storeId"],
                  },
                },
              },
              {
                $match: {
                  $expr: {
                    $eq: ["$status", 1],
                  },
                },
              },
            ],
            as: "storeOutlets",
          },
        },
        {
          $lookup: {
            from: "storeratings",
            let: {
              storeId: "$storeId._id",
            },
            pipeline: [{
                $match: {
                  $expr: {
                    $eq: ["$storeId", "$$storeId"],
                  },
                },
              },
              {
                $group: {
                  _id: "$storeId",
                  avgRating: {
                    $avg: "$rating",
                  },
                  count: {
                    $sum: 1,
                  },
                  storeId: {
                    $first: "$storeId",
                  },
                  storeOutlets: {
                    $first: "$storeOutlets",
                  },
                },
              },
            ],
            as: "storeRatings",
          },
        },
        {
          $unwind: {
            path: "$storeRatings",
            preserveNullAndEmptyArrays: true,
          },
        },
        // {
        //     $group:{
        //       _id : "$storeRatings.storeId",
        //       avgRating : {$avg : "$storeRatings.rating"},
        //       storeId : { $first : "$storeId"},
        //       storeOutlets :{ $first : "$storeOutlets"}
        //     }
        // }
      ];
      if (data.type == "subCategory") {
        let obj = {
          $match: {
            storeItemSubTypeId: mongoose.Types.ObjectId(data.id),
          },
        };
        pipeline.unshift(obj);
      }
      if (data.type == "category") {
        let obj = {
          $match: {
            storeItemTypeId: mongoose.Types.ObjectId(data.id),
          },
        };
        pipeline.unshift(obj);
      }
      // if (data.isGeofenceActive && (data.isGeofenceActive == true || data.isGeofenceActive == "true")) {
      //   const geofenceData = await findGeofenceId(data.longitude, data.latitude)
      //   if (geofenceData != null) {
      //     pipeline.push({
      //       $match: {
      //         "storeId.geofenceId": mongoose.Types.ObjectId(geofenceData._id)
      //       }
      //     })
      //   }
      // }
      // else
      if (data.latitude && data.longitude) {
        const store = await model.storeOutletsEcommerce
          .find({
            status: 1,
            location: {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
                },
                $maxDistance: Constant.RADIUSCIRCLE,
              },
            },
          })
          .distinct("storeId");
        pipeline.push({
          $match: {
            "storeId._id": {
              $in: store,
            },
          },
        });
      }
      let products = await model.storeItemsEcommerce.aggregate(pipeline);
      let stores = [];
      for (const z in products) {
        // products[z]["isFav"] = false;
        // if (global.favs[userId.toString() + products[z]._id]) products[z]["isFav"] = true;
        if (products[z]["storeRatings"] && products[z]["storeRatings"]["count"]) {
          products[z]["storeId"]["avgRating"] = products[z]["storeRatings"]["avgRating"];
          products[z]["storeId"]["ratingCount"] = products[z]["storeRatings"]["count"];
        }
        products[z]["storeId"]["storeOutlets"] = products[z]["storeOutlets"];
        stores.push(products[z]["storeId"]);
      }
      return multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.TRUEMSG, stores);
    } catch (err) {
      next(err);
    }
  }
}

async function findGeofenceId(latitude, longitude) {
  const geofenceData = await model.geoFence.find({
    geoLongLat: {
      $geoIntersects: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(latitude), parseFloat(longitude)],
        },
      },
    },
  });
  return geofenceData[0];
}
let preProject = {
  name: 1,
  name_ar: 1,
  image: 1,
  currency: 1,
  description: 1,
  avgDeliveryTime: 1,
  avgOrderPrice: 1,
  isRecommended: 1,
  discountUpto: 1,
  categories: 1,
  discount: 1,
  openTime: 1,
  isOpen: 1,
  closeTime: 1,
  storeItemType: 1,
  storeTypeId: 1,
  storePackageType: 1,
  storePackageTypeValue: 1,
  isFavourite: 1,
  ratings: 1,
  status: 1,
  outlet_Size: {
    $size: "$outlets",
  },
  outlets: 1,
};

let ratingFavProject = {
  name: 1,
  name_ar: 1,
  image: 1,
  currency: 1,
  isRecommended: 1,
  banner: 1,
  layout: 1,
  isHyperLocal: 1,
  isOpen: 1,
  veg_nonveg: 1,
  isBrandHidden: 1,
  storeTypeId: 1,
  avgDeliveryTime: 1,
  avgOrderPrice: 1,
  storePackageType: 1,
  storePackageTypeValue: 1,
  status: 1,
  outletSize: {
    $size: "$outlets",
  },
  isFavourite: {
    $cond: [
      "$favourites",
      {
        $cond: [{
            $size: "$favourites",
          },
          1,
          0,
        ],
      },
      0,
    ],
  },
  outlets: 1,
  ratingCount: {
    $size: "$ratings",
  },
  ratings: {
    $cond: [{
        $size: "$ratings",
      },
      {
        $divide: [{
            $sum: "$ratings.rating",
          },
          {
            $size: "$ratings",
          },
        ],
      },
      0,
    ],
  },
};

let project = {
  name: 1,
  name_ar: 1,
  image: 1,
  currency: 1,
  description: 1,
  avgDeliveryTime: 1,
  avgOrderPrice: 1,
  discountUpto: 1,
  categories: 1,
  discount: 1,
  openTime: 1,
  closeTime: 1,
  storeItemType: 1,
  storeTypeId: 1,
  status: 1,
  isRecommended: 1,
  isOpen: 1,
  outletSize: {
    $size: "$outlets",
  },
  isFavourite: {
    $cond: [
      "$favourites",
      {
        $cond: [{
            $size: "$favourites",
          },
          1,
          0,
        ],
      },
      0,
    ],
  },
  outlets: 1,
  ratingCount: {
    $size: "$ratings",
  },
  ratings: {
    $cond: [{
        $size: "$ratings",
      },
      {
        $divide: [{
            $sum: "$ratings.rating",
          },
          {
            $size: "$ratings",
          },
        ],
      },
      0,
    ],
  },
};

let ratingLookup = {
  from: "storeratings",
  let: {
    storeId: "$_id",
  },
  pipeline: [{
      $match: {
        $expr: {
          $eq: ["$storeId", "$$storeId"],
        },
      },
    },
    {
      $project: {
        rating: 1,
        _id: 0,
      },
    },
  ],
  as: "ratings",
};

let catLookup = {
  from: "storecategories",
  let: {
    storeTypeId: "$storeTypeId",
  },
  pipeline: [{
      $match: {
        $expr: {
          $eq: ["$_id", "$$storeTypeId"],
        },
      },
    },
    {
      $match: {
        $expr: {
          $and: [{
              $ne: ["$status", 2],
            },
            {
              $ne: ["$status", 0],
            },
          ],
        },
      },
    },
    {
      $project: {
        name: 1,
        name_ar: 1,
        _id: 0,
      },
    },
  ],
  as: "categories",
};

let catProject1 = {
  name: 1,
  name_ar: 1,
  image: 1,
  stores: {
    $arrayElemAt: ["$storeTypeList", 0],
  },
};

let catProject2 = {
  name: 1,
  name_ar: 1,
  image: 1,
  stores: {
    $cond: {
      if: {
        $gte: ["$stores", 0],
      },
      then: "$stores.count",
      else: 0,
    },
  },
  // stores: '$stores.count'
};

let productGroup = {
  _id: "$productKey",
  productName: {
    $first: "$productName",
  },
  productName_ar: {
    $first: "$productName_ar",
  },
  storeItemSubTypeId: {
    $first: "$storeItemSubTypeId",
  },
  storeItemTypeId: {
    $first: "$storeItemTypeId",
  },
  brandId: {
    $first: "$brandId",
  },
  label: {
    $first: "$label",
  },
  createdAt: {
    $first: "$createdAt",
  },
  storeId: {
    $first: "$storeId",
  },
  variants: {
    $push: {
      label: "$$ROOT.label",
      color: "$$ROOT.color",
      customizable: "$$ROOT.customizable",
      marketPrice: "$$ROOT.marketPrice",
      price: "$$ROOT.price",
      originalPrice: "$$ROOT.originalPrice",
      discount: "$$ROOT.discount",
      discountType: "$$ROOT.discountType",
      description_ar: "$$ROOT.description_ar",
      description: "$$ROOT.description",
      image1: "$$ROOT.image1",
      image2: "$$ROOT.image2",
      image3: "$$ROOT.image3",
      image4: "$$ROOT.image4",
      image5: "$$ROOT.image5",
      video: "$$ROOT.video",
      tickets: "$$ROOT.tickets",
      LP: "$$ROOT.LP",
      addOn: "$$ROOT.addOn",
      name_ar: "$$ROOT.name_ar",
      quantity: "$$ROOT.quantity",
      purchaseLimit: "$$ROOT.purchaseLimit",
      name: "$$ROOT.name",
      size: "$$ROOT.size",
      unit: "$$ROOT.unit",
      additional1: "$$ROOT.additional1",
      additional2: "$$ROOT.additional2",
      additional1_ar: "$$ROOT.additional1_ar",
      additional2_ar: "$$ROOT.additional2_ar",
      unitValue: "$$ROOT.unitValue",
      variantId: "$$ROOT.variantId",
      _id: "$$ROOT._id",
      marketPrice: "$$ROOT.marketPrice",
    },
  },
};

export default storeEcommerceController;