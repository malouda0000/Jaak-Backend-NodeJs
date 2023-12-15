import dotenv from "dotenv";
dotenv.config();
import model from "../../models/index";
import Constant from "../../constant";
const Service = require("../../services");
import moment from "moment";
import mongoose from "mongoose";
import {
  reject,
  constant
} from "async";
import multilingualService from "../../services/multilingualService";
import {
  assignWith,
  result
} from "lodash";
import generateReferralCode from "../../services/randomService";
const request = require("request");
import {
  responseMessages
} from "../../v1/controllers/languages/english";
const {
  Types
} = mongoose
//import { ConfigurationServicePlaceholders } from "aws-sdk/lib/config_service_placeholders";
import {
  normalUpload
} from "../../services/FileUploadService"
import services from "../../services";

class userController {
  uploadToS3(data, lang) {
    return new Promise(async (resolve, reject) => {
      try {
        const url = await services.uploadS3.uploadFile(data.files.file);
        resolve({
          message: multilingualService.getResponseMessage(
            "TRUEMSG",
            lang
          ),
          data: url
        })

      } catch (e) {
        console.log(e);
      }
    })
  }
  checkPhone(data, lang) {
    return new Promise(async (resolve, reject) => {
      try {
        let otp = Math.floor(1000 + Math.random() * 9000);
        let checkUser = await model.user.findOne({
          phone: data.phone,
          countryCode: data.countryCode
        })
        if (checkUser == null) {
          data.loginType = Constant.LOGIN_TYPE.WITHOTP
          data.adminOTP = "1567"
          await model.user(data).save();
          const optData = await model.Otp.findOne({
            user: data.phone
          });
          if (optData) await model.Otp.deleteMany({
            user: data.phone
          });

          const Otp = await model.Otp({
            otp: otp,
            user: data.phone,
            phone: data.phone,
            countryCode: data.countryCode,
          }).save();
          Service.selectOtpServiceAndSend.send(data.countryCode, data.phone, otp)
          return resolve({
            message: multilingualService.getResponseMessage(
              "OTPSEND",
              lang
            ),
            data: {
              verificationType: Constant.LOGIN_TYPE.WITHOTP
            }
          })
        }
        const optData = await model.Otp.findOne({
          user: data.phone
        });
        if (optData) await model.Otp.deleteMany({
          user: data.phone
        });

        const Otp = await model.Otp({
          otp: otp,
          user: data.phone,
          phone: data.phone,
          countryCode: data.countryCode,
        }).save();
        Service.selectOtpServiceAndSend.send(data.countryCode, data.phone, otp)
        return resolve({
          message: multilingualService.getResponseMessage(
            "OTPSEND",
            lang
          ),
          data: {
            verificationType: Constant.LOGIN_TYPE.WITHOTP
          }
        })
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    })
  }
  verifyOtpForLogin(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        let payload = data;
        payload.phoneNo = data.phone
        const otpData = await Service.OtpService.verifyOtp(payload);
        if (!otpData) {
          let checkUser = await model.user.findOneAndUpdate({
            adminOTP: payload.otpCode,
            phone: payload.phoneNo,
            countryCode: payload.countryCode
          }, {
            isPhoneVerified: true,
            isApprove: true,
            resetOtpToken: payload.otpCode,
          }, {
            new: true
          });
          if (checkUser != null) {
            return done({
              message: multilingualService.getResponseMessage("OTP_VERIFIED"),
              data: checkUser,
            });
          }
          return reject({
            message: multilingualService.getResponseMessage(
              "INVALID_OTP",
              lang
            ),
          });
        }
        let authToken = null;
        if (otpData) {
          let userData = await model.user.findOneAndUpdate({
            phone: data.phone,
            countryCode: data.countryCode
          }, {
            $set: {
              isPhoneVerified: true,
              isApprove: true,
              resetOtpToken: payload.otpCode,
              deviceId: data.deviceId,
              deviceType: data.deviceType
            }
          }, {
            new: true
          });
          authToken = Service.JwtService.issue({
            _id: userData._id
          });
        }
        const user = await model.user
          .findOneAndUpdate({
            phone: data.phoneNo,
            countryCode: data.countryCode
          }, {
            $set: {
              authToken: authToken
            }
          }, {
            new: true
          })
          .lean()
          .exec();
        done({
          message: multilingualService.getResponseMessage("OTP_VERIFIED"),
          data: user,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }
  addEvent(data, lang) {
    return new Promise(async (resolve, reject) => {
      try {
        const isAdd = await model.event.create(data);

        resolve({
          message: multilingualService.getResponseMessage(
            "TRUEMSG",
            lang
          ),
          data: isAdd
        })

      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    })
  }
  eventsList(data, lang) {
    return new Promise(async (resolve, reject) => {
      try {

        const isList = await model.event.find({
          isDeleted: false
        });

        resolve({
          message: multilingualService.getResponseMessage(
            "TRUEMSG",
            lang
          ),
          data: isList
        })

      } catch (e) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    })
  }
  approveDissapproveEvent(data, lang) {
    return new Promise(async (resolve, reject) => {
      try {
        const query = data.query;
        const body = data.body;

        const qry = {
          _id: Types.ObjectId(query.eventId)
        }
        const criteria = {
          $set: {
            isAdminApproved: (query.toApprove == 'true') ? true : false,
            assignedSubAdmin: body.assignedSubAdmin
          }
        }
        const options = {}

        model.event.findOneAndUpdate(qry, criteria, options)
          .then(async () => {
            resolve({
              message: multilingualService.getResponseMessage(
                "TRUEMSG",
                lang
              ),
              data: `event ${(query.toApprove === 'true') ? 'approved' : (query.toApprove === 'false') ? 'rejected' : 'updated'}`
            })
          })

      } catch (e) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    })
  }
  deleteEvent(data, lang) {
    return new Promise(async (done, reject) => {
      try { } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    })
  }
  preRegister(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        if (data.phone && data.countryCode) {
          let User = await model.user.findOne({
            phone: data.phoneNo,
            countryCode: data.countryCode,
          });
          if (User) {
            return reject({
              message: multilingualService.getResponseMessage(
                "USER_ALREADY_EXIST",
                lang
              ),
            });
          }
          await model.Otp.deleteMany({
            phone: data.phone,
            countryCode: data.countryCode,
          });
          data.otp = 1234;
          let user = await model.Otp.create(data);
          done({
            message: multilingualService.getResponseMessage("OTP_SEND"),
            data: user,
          });
        }
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    })
  }
  verifyPreRegister(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        const otpData = await Service.OtpService.verifyOtp(data);
        if (!otpData) {
          return reject({
            message: multilingualService.getResponseMessage(
              "INVALID_OTP",
              lang
            ),
          });
        }

        let code = generateReferralCode();
        let user = await model.user.create({
          phone: data.phone,
          countryCode: data.countryCode,
          isPhoneVerified: true,
          isApprove: true,
          referralCode: code
        });

        user.authToken = await Service.JwtService.issue({
          _id: user._id
        });
        done({
          message: multilingualService.getResponseMessage("OTP_VERIFIED"),
          data: user,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }
  completeRegister(data, file, lang, auth, finalFileName) {
    return new Promise(async (done, reject) => {
      // let check = {};
      // if (data.email) {
      //   check = await model.user.findOne({ email: data.email });
      // }

      // if (data.username) {
      //   check = await model.user.findOne({ username: data.username });
      // }
      // if (check) {
      //   return reject({
      //     message: check.email
      //       ? multilingualService.getResponseMessage("EMAILEXISTS", lang)
      //       : multilingualService.getResponseMessage("USERNAMEEXISTS", lang),
      //   });
      // }
      let user;
      if (auth) {
        if (data.password)
          data.hash = Service.HashService.encrypt(data.password);
        data.profilePic = process.env.S3URL + finalFileName;

        user = await model.user.findByIdAndUpdate(auth._id, data, {
          new: true,
        });
        user = await model.user.findOne({
          _id: auth._id
        }, {
          username: 1,
          userType: 1,
          firstName: 1,
          lastName: 1,
          address: 1,
          email: 1,
          phone: 1
        });
        if (data.referredBy) {
          let dataToAdd = await model.AppSetting.findOne({}).lean().exec();
          if (dataToAdd.referralType === "loyalityPoints") {
            let data_ = await model.user.findOneAndUpdate({
              referralCode: data.referredBy
            }, {
              $inc: {
                earnedLPReferrals: dataToAdd.referralValue,
                availableLP: dataToAdd.referralValue,
                totalEarnedLP: dataToAdd.referralValue
              },
              $push: {
                referralUser: user._id
              }
            }).exec();
          }
          if (dataToAdd.referralType === "amount") {
            await model.user.findOneAndUpdate({
              referralCode: data.referredBy
            }, {
              $inc: {
                wallet: dataToAdd.referralValue
              },
              $push: {
                referralUser: user._id
              }
            }).exec();
            await model.Transaction({
              userId: user._id,
              transactionType: "referralReward",
              amount: dataToAdd.referralValue,
              creditDebitType: "credit"
            }).save();
          }
        }
      }
      done({
        message: "",
        data: user
      });
    })
      .catch((err) => {
        if (err.errors)
          return reject({
            message: Service.Handler.mongoErrorHandler(err)
          });

        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG"),
        });
      });
  }
  verifyOtp(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        let payload = data;
        const otpData = await Service.OtpService.verifyOtp(payload);
        if (!otpData) {
          let checkUser = await model.user.findOneAndUpdate({
            adminOTP: payload.otpCode,
            phone: payload.phoneNo,
            countryCode: payload.countryCode
          }, {
            isPhoneVerified: true,
            isApprove: true,
            resetOtpToken: payload.otpCode,
          }, {
            new: true
          });
          if (checkUser != null) {
            return done({
              message: multilingualService.getResponseMessage("OTP_VERIFIED"),
              data: checkUser,
            });
          }
          return reject({
            message: multilingualService.getResponseMessage(
              "INVALID_OTP",
              lang
            ),
          });
        }
        if (otpData) {
          await model.user.findOneAndUpdate({
            isPhoneVerified: true,
            isApprove: true,
            resetOtpToken: payload.otpCode,
          });
        }
        const user = await model.user
          .findOne({
            phone: data.phoneNo,
            countryCode: data.countryCode
          })
          .lean()
          .exec();
        done({
          message: multilingualService.getResponseMessage("OTP_VERIFIED"),
          data: user,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }
  transactionHistory(data, lang, userId) {
    return new Promise(async (done, reject) => {
      try {
        let dataToSend = await model.Transaction.find({
          userId: userId
        }).sort({
          createdAt: -1
        })
        const message =
          dataToSend.length <= 0 ?
            multilingualService.getResponseMessage("EMPTY_LIST", lang) :
            multilingualService.getResponseMessage(
              "FETCHED_SUCCESSFULLY",
              lang
            );
        let userData = await model.user.findOne({
          _id: userId
        }).lean().exec();
        done({
          message: message,
          data: {
            totalAmount: Number((userData.wallet).toFixed(2)),
            dataToSend
          },
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }
  invitation(data, lang, userId) {
    return new Promise(async (done, reject) => {
      try {
        if (!data.phone && !data.countryCode) {
          return reject({
            message: multilingualService.getResponseMessage(
              "PARAMETERMISSING",
              lang
            ),
          });
        }

        let userData = await model.user.findOne({
          _id: userId
        }).lean().exec();

        Service.OtpService.sendSMS(
          data.countryCode,
          data.phone,
          `Heyy, Download this great app enter my code ${userData.referralCode} to get amazing property ideas https://www.google.com/${userData.referralCode}.`
        );
        done({
          message: "Invitation sent successfully"
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }
  getItemAddOns(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        let result = await model.storeItem.findOne({
          _id: mongoose.Types.ObjectId(data.itemId)
        }, {
          addOn: 1,
          toppings: 1
        }).populate("addOn")
          .populate("toppings")
          .exec();
        if (!result.addOn.length > 0 && !result.toppings.length > 0) {
          return reject({
            message: multilingualService.getResponseMessage(
              "NO_ADDON_ASSOCIATED",
              lang
            ),
          });
        }
        done({
          message: multilingualService.getResponseMessage(
            "FETCHED_SUCCESSFULLY",
            lang
          ),
          data: result,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }
  getDealById(data, userId, lang) {
    return new Promise(async (done, reject) => {
      try {
        let result = await model.promocode.aggregate([{
          $match: {
            _id: mongoose.Types.ObjectId(data.dealId),
            code: "DEAL",
          },
        },
        {
          $lookup: {
            from: "storeitems",
            localField: "productId",
            foreignField: "productKey",
            as: "productId",
          },
        },
        {
          $unwind: "$productId"
        },
        {
          $group: {
            _id: "$productId.productKey",
            productName: {
              $first: "$productId.productName"
            },
            productName_ar: {
              $first: "$productId.productName_ar"
            },
            storeItemSubTypeId: {
              $first: "$productId.storeItemSubTypeId"
            },
            storeItemTypeId: {
              $first: "$productId.storeItemTypeId"
            },
            brandId: {
              $first: "$productId.brandId"
            },
            // storeId: { $first: "$productId.storeId" },
            createdAt: {
              $first: "$productId.createdAt"
            },
            variants: {
              $push: {
                color: "$productId.color",
                price: "$productId.price",
                marketPrice: "$productId.marketPrice",
                originalPrice: "$productId.originalPrice",
                discount: "$productId.discount",
                discountType: "$productId.discountType",
                description_ar: "$productId.description_ar",
                description: "$productId.description",
                image1: "$productId.image1",
                image2: "$productId.image2",
                image3: "$productId.image3",
                image4: "$productId.image4",
                image5: "$productId.image5",
                video: "$productId.video",
                tickets: "$productId.tickets",
                name_ar: "$productId.name_ar",
                quantity: "$productId.quantity",
                purchaseLimit: "$productId.purchaseLimit",
                name: "$productId.name",
                size: "$productId.size",
                unit: "$productId.unit",
                addOn: "$productId.addOn",
                additional1: "$productId.additional1",
                additional2: "$productId.additional2",
                additional1_ar: "$productId.additional1_ar",
                additional2_ar: "$productId.additional2_ar",
                unitValue: "$productId.unitValue",
                variantId: "$productId.variantId",
                _id: "$productId._id",
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
          $unwind: "$brandId"
        },
        ]);
        for (const z in result) {
          result[z]["isFav"] = false;
          if (global.favs[userId.toString() + result[z]._id])
            result[z]["isFav"] = true;
        }
        done({
          message: multilingualService.getResponseMessage(
            "FETCHED_SUCCESSFULLY",
            lang
          ),
          data: result,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }
  addCartStore(data, userId, lang) {
    try{
      return new Promise(async (done, reject) => {
        const product = await model.storeItem.findOne({
          _id: mongoose.Types.ObjectId(data.productId)
        })
          .lean()
          .exec();
        if (!product)
          return reject({
            message: multilingualService.getResponseMessage(
              "WRONG_PRODUCT_ID",
              lang
            ),
          });
        if (product.tags) {
          await model.user.findByIdAndUpdate(userId, {
            $addToSet: {
              tags: product.tags
            },
          });
        }
  
        var store = await model.store
          .findOne({
            _id: mongoose.Types.ObjectId(data.storeId),
            $and: [{
              status: {
                $ne: 2
              }
            }, {
              status: {
                $ne: 3
              }
            }],
          })
          .lean()
          .exec();
        if (!store)
          return reject({
            message: multilingualService.getResponseMessage(
              "WRONG_STORE_ID",
              lang
            ),
          });
        if (!data.serialNumber) data.serialNumber = 0;
        let cart = await model.storeCart.find({
          userId: userId
        }).exec();
        let itemIds = cart.map((item) => String(item.itemId));
        await model.storeCart.updateMany({
          userId
        }, {
          exceedingMaximumDiscountLimit: false,
        });
        let totalAddonsAmount = 0;
        if (data.addOns) {
          for (let i = 0; i < data.addOns.length; i++) {
            totalAddonsAmount += data.addOns[i].price * data.addOns[i].qty;
          }
        }
  
        // let cartItem_presenceChecker= await model.store
  
        if (itemIds.includes(data.productId) && (data.serialNumber == 0 || data.serialNumber == 0)) {
          cart = await model.storeCart.findOneAndUpdate({
            userId: userId,
            itemId: data.productId
          }, {
            $set: {
              itemQuantity: data.itemQuantity,
              totalAddonsAmount
            }
          }, {
            new: true
          });
        } else {
          cart = await model
            .storeCart({
              itemArabicDesciption: product.description_ar,
              itemArabicName: product.productName_ar,
              itemColor: data.itemColor,
              itemDesciption: product.description,
              itemId: data.productId,
              itemImage1: product.image1,
              itemImage2: product.image2,
              itemImage3: product.image3,
              itemImage4: product.image4,
              itemImage5: product.image5,
              itemName: `${product.productName} - ${product.name}`,
              itemPurchaseLimit: product.purchaseLimit,
              itemQuantity: data.itemQuantity,
              itemSize: data.itemSize,
              itemUnit: product.unit,
              itemUnitValue: product.unitValue,
              itemVariantArabicName: product.name_ar,
              itemVariantName: product.name,
              itemVideo: product.video,
              itemCategoryId: data.itemCategoryId,
              itemSubCategoryId: data.itemSubCategoryId,
              itemBrandId: data.itemBrandId,
              outletId: data.outletId,
              quantity: product.quantity,
              discount: data.discount,
              discountType: data.discountType,
              originalPrice: data.originalPrice,
              storeArabicName: store.name_ar,
              storeAddress: data.storeAddress,
              storeId: data.storeId,
              storeName: store.name,
              userId: userId,
              tags: product.tags,
              tickets: product.tickets,
              LP: product.LP,
              amount: data.originalPrice,
              isPromoApplied: false,
              promoDiscount: 0,
              totalAddonsAmount,
              exceedingMaximumDiscountLimit: false,
              isOpen: data.isOpen,
              addOns: data.addOns,
              price: product.price,
              marketPrice: product.marketPrice
            })
            .save();
        }
        const item = await model.storeItem.findById(data.productId)
        let promoItem;
        if (item)
          promoItem = await model.promocode.find({
            $or: [{
              storeId: {
                $in: [item.storeId]
              }
            },
            {
              productId: {
                $in: [item.itemId]
              }
            },
            {
              brandId: {
                $in: [item.brandId]
              }
            },
            {
              categoryId: {
                $in: [item.categoryId]
              }
            },
            {
              subCategoryId: {
                $in: [item.subCategoryId]
              }
            }
            ],
            startdate: {
              $lte: new Date(moment().endOf("day"))
            },
            endDate: {
              $gte: new Date(moment().endOf("day"))
            },
            status: {
              $in: [1, 3]
            }
          })
        let isDeal = false
        if (promoItem.length > 0) {
          isDeal = true
        }
        if (cart.itemQuantity > 0) {
          await model.storeCart.findOneAndUpdate({
            userId: userId,
            itemId: data.productId
          }, {
            $set: {
              totalAmount: cart.itemQuantity * (cart.amount + cart.totalAddonsAmount),
              exceedingMaximumDiscountLimit: false,
            },
            isDeal: isDeal
          }, {
            new: true
          });
        }
  
        // }
  
        
        let cartlabel = {};
        if (data.itemQuantity === 0) {
          cart = await model.storeCart.deleteMany({
            userId: mongoose.Types.ObjectId(userId),
            itemId: data.productId,
          });
        }
  
        let finalCart = await model.storeCart.find({
          userId: userId
        })
        let qry12 = {
          code: {
            $eq: "DEAL"
          },
          store: data.storeId,
          startDate: {
            $lte: new Date(moment().startOf("date")),
          },
          endDate: {
            $gte: new Date(moment().startOf("date")),
          },
          status: {
            $in: [1, 3]
          }
        }
        let promos = await model.promocode.find(qry12)
        for (let item of finalCart) {
          for (let promo of promos) {
            if (promo.storeIds.includes(item.storeId) ||
              promo.categoryId.includes(item.itemCategoryId) ||
              promo.subCategoryId.includes(item.itemSubCategoryId) ||
              promo.brandId.includes(item.itemBrandId) ||
              promo.itemId.includes(item.itemId)) {
              if (promo.discountType.toLowerCase() === "flat") {
                item.price = Number(item.price - promo.discount);
                if(item.price<0){
                  item.price = 0
                }
              } else {
                item.price = item.price - ((promo.discount * 1) / 100) * item.price;
              }
              break
            }
          }
        }
        cartlabel.items = 0;
        cartlabel.cartAmount = 0;
        let cartItemCount = 0;
        let cartAmount = 0;
        let totalItemsAmount = 0;
        let deliveryCharge = 0;
        let tags = [];
        for (let item in finalCart) {
          cartItemCount += Number(finalCart[item].itemQuantity);
          totalItemsAmount += Number(
            finalCart[item].itemQuantity *
            (finalCart[item].price + finalCart[item].totalAddonsAmount)
          );
          cartAmount +=  totalItemsAmount //Number(finalCart[item].totalAmount);
        }
        await model.user.findByIdAndUpdate(userId, {
          $addToSet: {
            tags: tags
          }
        }).exec();
        totalItemsAmount.toFixed(2);
        cartAmount.toFixed(2);
        deliveryCharge += finalCart.length ?
          Number(finalCart[0].deliveryCharge) :
          0;
        cartAmount += deliveryCharge;
  
        cartlabel.cartAmount = cartAmount;
        cartlabel.deliveryCharge = deliveryCharge;
        cartlabel.totalItemsAmount = totalItemsAmount;
        cartlabel.items = cartItemCount;
        done({
          message: multilingualService.getResponseMessage("CART_ADDED", lang),
          data: {
            cartDetails: cartlabel,
            cart: finalCart
          },
        });
      });
    }
    catch(err){
      console.log(err)
    }
  }
  getCartStore(userId, lang) {
    return new Promise(async (done, reject) => {
      const cart = await model.storeCart.find({
        userId: userId
      }, {
        _id: 1,
        id: 0,
        __v: 0,
      } //storeId : 1 }
      );
      if (cart.length === 0)
        return reject({
          message: multilingualService.getResponseMessage("EMPTYCART", lang),
        });
      let cartId = cart[0]._id;
      let cartItemCount = 0;
      let cartAmount = 0;
      let totalItemsAmount = 0;
      let deliveryCharge = 0;
      let taxPercent = 0;
      let packingCharge = 0;
      let item2 = cart[0];
	let storeMinOrderAmount=0;
      let qry12 = {
        code: {
          $eq: "DEAL"
        },
        store: item2.storeId,
        startDate: {
          $lte: new Date(moment().startOf("date")),
        },
        endDate: {
          $gte: new Date(moment().startOf("date")),
        },
        status: {
          $in: [1, 3]
        }
      }
      let promos = await model.promocode.find(qry12)
      for (let item of cart) {
        for (let promo of promos) {
          if (promo.storeIds.includes(item.storeId) ||
            promo.categoryId.includes(item.itemCategoryId) ||
            promo.subCategoryId.includes(item.itemSubCategoryId) ||
            promo.brandId.includes(item.itemBrandId) ||
            promo.itemId.includes(item.itemId)) {
            if (promo.discountType.toLowerCase() === "flat") {
              item.price = Number(item.price - promo.discount);
              if(item.price<0){
                item.price = 0
              }
            } else {
              item.price = item.price - ((promo.discount * 1) / 100) * item.price;
            }
            break
          }
        }
      }
      for (let item in cart) {
        cartItemCount += Number(cart[item].itemQuantity);
        totalItemsAmount += Number(
          cart[item].itemQuantity *
          (cart[item].price + cart[item].totalAddonsAmount)
        );
        //cartAmount += totalItemsAmount //Number(cart[item].totalAmount);
      }
      cartAmount = totalItemsAmount
      totalItemsAmount.toFixed(2);
      cartAmount.toFixed(2);
      //TILL HERE cartAmount AND totalItemsAmount ARE EXACTLY SAME
      let storeData = await model.store.findById(item2.storeId);
      let category = await model.storeItemType.findById(item2.itemCategoryId);
      let storeType = await model.storeCategory.findById(
        category.storeCategoryId
      );
      taxPercent = storeType != null ? storeType.tax : 0;
      if (storeData != null && storeData.serviceTax != 0) {
        taxPercent = storeData.serviceTax;
      }
if(storeData){
//console.log("In storeOrderAmount");
	storeMinOrderAmount = storeData.minOrderAmount;
	}
      let taxTotal = Number(cartAmount.toFixed(2)) * (taxPercent / 100);
      taxTotal.toFixed(2);
      cartAmount += taxTotal;
      // let deliverFee = await model.AppSetting.findOne({}).lean().exec();
      // deliveryCharge = Number(deliverFee.driverPerKmCharge);
      if (storeData != null && storeData.deliveryCharges > 0) {
        deliveryCharge = Number(storeData.deliveryCharges);
      }
      cartAmount += deliveryCharge;
      packingCharge = storeType != null ? storeType.packingCharge : 0;
      if (storeData != null && storeData.packingCharges > 0) {
        packingCharge = storeData.packingCharges;
      }
      cartAmount += packingCharge;
      if (cart[0].exceedingMaximumDiscountLimit) {
        cartAmount -= cart[0].maximumDiscount;
      }
      let userWalletAmount = await model.user.findById(userId).select('wallet')
      userWalletAmount = userWalletAmount.wallet

      done({
        message: multilingualService.getResponseMessage(
          "FETCHED_SUCCESSFULLY",
          lang
        ),
        data: {
          cart,
          cartDetails: {
            cartId,
            cartItemCount,
            deliveryCharge,
            totalItemsAmount,
            cartAmount,
            taxTotal,
            packingCharge: packingCharge,
            exceedingMaximumDiscountLimit: cart[0].exceedingMaximumDiscountLimit,
            maximumDiscount: cart[0].maximumDiscount,
          },
          userWalletAmount,
	storeMinOrderAmount,
        },
      });
    });
  }

  // getCartStore(userId, lang) {
  //   return new Promise(async (done, reject) => {
  //     const cart1 = await model.storeCart.aggregate([
  //       {
  //         $match: {
  //           userId: userId
  //         }
  //       },
  //       {
  //         $group: {
  //           _id: "$storeId",
  //           totalItemsAmount: { "$sum": "$totalAmount" },
  //           cartItemCount: { "$sum": "$itemQuantity" },
  //           itemCategoryId: { "$first": "$itemCategoryId" },
  //           exceedingMaximumDiscountLimit: { "$first": "$exceedingMaximumDiscountLimit" },
  //           maximumDiscount: { "$first": "$maximumDiscount" }
  //         },

  //       }
  //     ])
  //     const cart = await model.storeCart.find(
  //       { userId: userId },
  //       { _id: 1, id: 0, __v: 0, } //storeId : 1 }
  //     );
  //     if (cart.length === 0){
  //       return reject({
  //         message: multilingualService.getResponseMessage("EMPTYCART", lang),
  //       });
  //     }

  //     let cartId = cart[0]._id;
  //     let cartItemCountFinal = 0;
  //     let cartAmountFinal = 0;
  //     let totalItemsAmountFinal = 0;
  //     let deliveryChargeFinal = 0;
  //     let taxPercentFinal = 0;
  //     let packingChargeFinal = 0;
  //     let taxTotalFinal = 0
  //     // let item2 = cart[0];
  //     for (let item2 of cart1) {
  //       let cartItemCount = 0;
  //       let cartAmount = 0;
  //       let totalItemsAmount = 0;
  //       let deliveryCharge = 0;
  //       let taxPercent = 0;
  //       let packingCharge = 0;
  //       cartItemCount = Number(item2.cartItemCount);
  //       totalItemsAmount = Number(item2.totalItemsAmount);
  //       cartAmount = Number(item2.totalItemsAmount);
  //       totalItemsAmount.toFixed(2);
  //       cartAmount.toFixed(2);
  //       //TILL HERE cartAmount AND totalItemsAmount ARE EXACTLY SAME
  //       let storeData = await model.store.findById(item2._id);
  //       let category = await model.storeItemType.findById(item2.itemCategoryId);
  //       let storeType = await model.storeCategory.findById(
  //         category.storeCategoryId
  //       );
  //       taxPercent = storeType != null ? storeType.tax : 0;
  //       if (storeData != null && storeData.serviceTax != 0) {
  //         taxPercent = storeData.serviceTax;
  //       }
  //       let taxTotal = Number(cartAmount.toFixed(2)) * (taxPercent / 100);
  //       taxTotal.toFixed(2);
  //       cartAmount += taxTotal;
  //       // let deliverFee = await model.AppSetting.findOne({}).lean().exec();
  //       // deliveryCharge = Number(deliverFee.driverPerKmCharge);
  //       if (storeData != null && storeData.deliveryCharges > 0) {
  //         deliveryCharge = Number(storeData.deliveryCharges);
  //       }
  //       cartAmount += deliveryCharge;
  //       packingCharge = storeType != null ? storeType.packingCharge : 0;
  //       if (storeData != null && storeData.packingCharges > 0) {
  //         packingCharge = storeData.packingCharges;
  //       }
  //       cartAmount += packingCharge;
  //       console.log(packingCharge, "packingCharge", deliveryCharge, "deliveryCharge")
  //       if (cart[0].exceedingMaximumDiscountLimit) {
  //         cartAmount -= cart[0].maximumDiscount;
  //       }
  //       cartItemCountFinal += cartItemCount
  //       cartAmountFinal += cartAmount
  //       totalItemsAmountFinal += totalItemsAmount
  //       deliveryChargeFinal += deliveryCharge
  //       packingChargeFinal += packingCharge
  //       taxTotalFinal += taxTotal
  //     }
  //     let userWalletAmount = await model.user.findById(userId).select('wallet')
  //     userWalletAmount = userWalletAmount.wallet
  //     let promos = await model.promocode.find({
  //       code: {
  //         $ne: "DEAL"
  //       },
  //       startdate: { $lte: new Date(moment().endOf("day")) },
  //       endDate: { $gte: new Date(moment().endOf("day")) },
  //       status: { $in: [1, 3] }
  //     })
  //     for (let item of cart) {
  //       for (let promo of promos) {
  //         if (promo.storeId.includes(item.storeId) ||
  //           promo.categoryId.includes(item.itemCategoryId) ||
  //           promo.subCategoryId.includes(item.itemSubCategoryId) ||
  //           promo.brandId.includes(item.itemBrandId) ||
  //           promo.itemId.includes(item._id)) {
  //           if (promo.discountType.toLowerCase() === "flat") {
  //             item.price = Number(item.price - promo.discount);
  //           } else {
  //             item.price = item.price - ((promo.discount * 1) / 100) * item.price;
  //           }
  //         }
  //       }
  //     }
  //     done({
  //       message: multilingualService.getResponseMessage(
  //         "FETCHED_SUCCESSFULLY",
  //         lang
  //       ),
  //       data: {
  //         cart,
  //         cartDetails: {
  //           cartId, cartItemCountFinal, cartAmountFinal, deliveryChargeFinal, totalItemsAmountFinal,
  //           taxTotalFinal, packingCharge: packingChargeFinal, exceedingMaximumDiscountLimit:
  //             cart[0].exceedingMaximumDiscountLimit, maximumDiscount: cart[0].maximumDiscount,
  //         },
  //         userWalletAmount
  //       },
  //     });
  //   });
  // }

  checkStoreClose(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        const store = await model.store.findOne({
          _id: mongoose.Types.ObjectId(data.storeId),
          $and: [{
            status: {
              $ne: 2
            }
          }],
        }).lean().exec();
        done({
          message: multilingualService.getResponseMessage("EMPTYCART", lang),
          data: {
            isOpen: store.isOpen
          }
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    })
  }
  clearCartStore(userId, lang) {
    return new Promise(async (done, reject) => {
      try {
        await model.storeCart.deleteMany({
          userId: userId
        }).exec();
        // await model.addOnCart.deleteMany({ userId: userId }).exec();

        done({
          message: multilingualService.getResponseMessage("EMPTYCART", lang),
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }
  checkLoginParams(data, lang) {
    return new Promise(async (done, reject) => {
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

      await model.user.findOne(qry).then(async (result) => {
        if(result != null){
          return reject({
            message: data.email ?
              multilingualService.getResponseMessage("EMAILEXISTS", lang) : multilingualService.getResponseMessage("PHONEEXISTS", lang),
          });
        }
        if (data.isRegister) {
            const optData = await model.Otp.findOne({
              user: data.phone
            });
            if (optData) await model.Otp.deleteMany({
              user: data.phone
            });

            const Otp = await model
              .Otp({
                otp: Math.floor(1000 + Math.random() * 9000),
                user: data.phone,
                phone: data.phone,
                countryCode: data.body,
              })
              .save();

            if (0) {
              return reject({
                message: data.email ?
                  multilingualService.getResponseMessage("EMAILEXISTS", lang) : multilingualService.getResponseMessage("PHONEEXISTS", lang),
              });
            } else if (data.fireOtp == false) // if fireOtp false it means otp send from front end
            {
              done({
                message: Constant.SUCCESSCODE,
                data: {
                  success: true
                }
              })
            } else {
              await Service.selectOtpServiceAndSend.send(data.countryCode, data.phone, Otp.otp)
              done({
                message: Constant.OTPSEND,
                data: {
                  otpId: Otp._id,
                  otp: Otp.otp
                },
              });
            }
        } else {
            if (result && result.isSocialRegister)
              return reject({
                message: multilingualService.getResponseMessage(
                  "SOCIALREGISTERMSG",
                  lang
                ),
              });

            if (!result)
              return reject({
                message: multilingualService.getResponseMessage(
                  "NOACCOUNTMSG",
                  lang
                ),
              });

            done({});
        }
        })
        .catch((err) =>
          reject({
            message: multilingualService.getResponseMessage("ERRMSG", lang),
          })
        );
    });
  }
  register(data, file, lang, auth, finalFileName) {
    return new Promise(async (done, reject) => {
      let check = {};
      let or = [];
      let criteria = {
        _id: {
          $nin: auth._id
        }
      };
      if (data.email) {
        or.push({
          email: data.email
        })
      }
      if (data.phone) {
        or.push({
          phone: data.phone
        })
      }
      if (or.length > 0) {
        criteria.$or = or
      }
      check = await model.user.findOne(criteria);

      // if (data.phone) {
      //   check = await model.user.findOne({ phone: data.phone });
      // }
      if (check != null) {
        if(check.email == data.email){

          return reject({
            message: multilingualService.getResponseMessage("EMAILEXISTS", lang)
        })
      }
        if(check.phone == data.phone){

        return reject({
          message: multilingualService.getResponseMessage("PHONEEXISTS", lang),
        })
      }
      }
      if (auth) {
        data.status = 1;
        if (data.password)
          data.hash = Service.HashService.encrypt(data.password);
        data.profilePic = process.env.S3URL + finalFileName;
        data.referralCode = generateReferralCode();

        let user = await model.user.findByIdAndUpdate(auth._id, data, {
          new: true,
        });
        if (data.referredBy) {
          let dataToAdd = await model.AppSetting.findOne({}).lean().exec();
          if (dataToAdd.referralType === "loyalityPoints") {
            let data_ = await model.user.findOneAndUpdate({
              referralCode: data.referredBy
            }, {
              $inc: {
                earnedLPReferrals: dataToAdd.referralValue,
                availableLP: dataToAdd.referralValue,
                totalEarnedLP: dataToAdd.referralValue
              },
              $push: {
                referralUser: user._id
              }
            }).exec();
          }
          if (dataToAdd.referralType === "amount") {
            await model.user.findOneAndUpdate({
              referralCode: data.referredBy
            }, {
              $inc: {
                wallet: dataToAdd.referralValue
              },
              $push: {
                referralUser: user._id
              }
            }).exec();
            await model.Transaction({
              userId: user._id,
              transactionType: "referralReward",
              amount: dataToAdd.referralValue,
              creditDebitType: "credit"
            }).save();
          }
        }
        if (data.applyReferralCode) {
          let isUserReferrel = await model.user.findOne({
            referralCode: data.applyReferralCode
          })
          let isMerchant = await model.store.findOne({
            myReferrelCode: data.applyReferralCode
          })
          let isDriver = await model.driver.findOne({
            referralCode: data.applyReferralCode
          });
          //const moneyToSend = await model.Referral.findOne({}) 
          const moneyToSend = await model.Referral.findOne({})
          if (isUserReferrel) {
            isUserReferrel.walletAmount = isUserReferrel.walletAmount + moneyToSend.customerToCustomer
            isUserReferrel.save()
          }
          if (isMerchant) {
            isMerchant.earnings = isMerchant.earnings + moneyToSend.merchantToCustomer
            isMerchant.save()
          }
          if (isDriver) {
            isDriver.earnings = isDriver.earnings + moneyToSend.driverToCustomer
            isDriver.save()
          }
        }
        user.authToken = await Service.JwtService.issue({
          _id: user._id
        });
        done({
          message: "",
          data: user
        });
        return;
      }
      let user = this.createUser(data, finalFileName);
      user.authToken = await Service.JwtService.issue({
        _id: user._id
      });
      user.adminOTP = "1567"
      if (data.referredBy) {
        let dataToAdd = await model.AppSetting.findOne({}).lean().exec();
        if (dataToAdd.referralType === "loyalityPoints") {
          let data_ = await model.user.findOneAndUpdate({
            referralCode: data.referredBy
          }, {
            $inc: {
              earnedLPReferrals: dataToAdd.referralValue,
              availableLP: dataToAdd.referralValue,
              totalEarnedLP: dataToAdd.referralValue
            },
            $push: {
              referralUser: user._id
            }
          }).exec();
        }
        if (dataToAdd.referralType === "amount") {
          await model.user.findOneAndUpdate({
            referralCode: data.referredBy
          }, {
            $inc: {
              wallet: dataToAdd.referralValue
            },
            $push: {
              referralUser: user._id
            }
          }).exec();
          await model.Transaction({
            userId: user._id,
            transactionType: "referralReward",
            amount: dataToAdd.referralValue,
            creditDebitType: "credit"
          }).save();
        }
      }
      user
        .save()
        .then(async (result) => {
          done({
            message: "",
            data: result
          });
        })
        .catch((err) => {
          if (err.errors)
            return reject({
              message: Service.Handler.mongoErrorHandler(err)
            });

          return reject({
            message: multilingualService.getResponseMessage("FALSEMSG"),
          });
        });
    });
  }
  createUser(data, finalFileName) {
    let user = new model.user({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      countryCode: data.countryCode,
      phone: data.phone,
      emergencyPhone: data.emergencyPhone,
      address: data.address,
      facebookId: data.facebookId,
      googleId: data.googleId,
      appIeId: data.appIeId,
      isSocialRegister: data.isSocialRegister,
      deviceId: data.deviceId,
      deviceType: data.deviceType,
      date: moment().valueOf(),
      location: [data.address.longitude, data.address.latitude]
    });
    return user;
  }
  logout(userId) {
    return new Promise(async (done, reject) => {
      let update = {
        authToken: "",
        deviceId: "",
        deviceType: "",
      };
      model.user
        .findByIdAndUpdate(userId, update, {
          new: true
        })
        .then((result) => {
          done({
            data: result
          });
        });
    });
  }
  createAddress(data) {
    let address = new model.address({
      userId: data.userId,
      address: data.address,
      location: data.location,
      zipcode: data.zipcode,
      latitude: data.latitude,
      longitude: data.longitude,
      cordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
      date: moment().valueOf(),
      countryCode: data.countryCode,
      phone: data.phone,
      addressType: data.addressType || "",
      bulidingNo: data.bulidingNo || "",
      completeAddress: data.completeAddress || ""
    });
    return address;
  }
  login(data, lang, auth) {
    return new Promise(async (done, reject) => {
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
      model.user.findOne(qry)
        .select("+hash +authToken")
        .then(async (user) => {
          try {
            if (
              !user ||
              Service.HashService.decrypt(user.hash) !== data.password
            )
              return reject({
                message: multilingualService.getResponseMessage(
                  "INVALIDPARAMS",
                  lang
                ),
              });
          } catch (e) {
            return reject({
              message: "YOU HAVE LOGGED IN THROuGH SOCIAL LOGIN",
            });
          }

          let update = {
            deviceId: data.deviceId,
            deviceType: data.deviceType,
          };
          if (!user.authToken) {
            update.authToken = Service.JwtService.issue({
              _id: user._id
            });
          }

          if (auth && auth._id) {
            let cartData = await model.storeCart
              .find({
                userId: auth._id
              })
              .select("-_id")
              .lean();

            await model.storeCart.deleteMany({
              userId: auth._id
            });
            await model.storeCart.insertMany(
              cartData.map((item) => {
                item.userId = user._id;
                return item;
              })
            );
          }
          model.user
            .findByIdAndUpdate(user._id, update, {
              new: true
            })
            .select("+authToken")
            .then((result) => {
              done({
                data: result
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
  async socialLogin(data, lang, auth) {
    return new Promise(async (done, reject) => {
      let qry = {};

      if (data.facebookId) qry.facebookId = data.facebookId;
      else if (data.googleId) qry.googleId = data.googleId;
      else if (data.appleId) qry.appleId = data.appleId;
      else
        return reject({
          message: multilingualService.getResponseMessage(
            "PARAMETERMISSING",
            lang
          ),
        });
      model.user.findOne(qry).then(async (user) => {
        if (!user && (data.email || data.phone)) {
          let qryArr = [];
          if (data.email) qryArr.push({
            email: data.email.toLowerCase()
          });
          if (data.phone)
            qryArr.push({
              countryCode: data.countryCode,
              phone: data.phone
            });

          model.user.find({
            $or: qryArr
          }).then(async (users) => {
            if (users.length == 1) {
              let update = {
                deviceId: data.deviceId,
                deviceType: data.deviceType,
                authToken: await Service.JwtService.issue({
                  _id: users[0]._id,
                }),
              };
              if (data.facebookId) update.facebookId = data.facebookId;
              else if (data.appleId) update.appleId = data.appleId;
              else update.googleId = data.googleId;
              if (data.profilePic) update.profilePic = data.profilePic;
              update.referralCode = generateReferralCode();
              let result = await Service.db.updateWithId(
                model.user,
                users[0]._id,
                update,
                [],
                "+authToken"
              );
              if (auth && auth._id) {
                let cartData = await model.storeCart
                  .find({
                    userId: auth._id
                  })
                  .select("-_id")
                  .lean();
                await model.storeCart.deleteMany({
                  userId: auth._id
                });
                await model.storeCart.insertMany(
                  cartData.map((item) => {
                    item.userId = users[0]._id;
                    return item;
                  })
                );
              }
              done({
                data: result,
                isUser: 1
              });
            } else {
              await model.user.create(data)
                .then(async (user) => {
                  let authToken = await Service.JwtService.issue({
                    _id: user._id
                  })
                  await model.user.findByIdAndUpdate({
                    _id: user._id
                  }, {
                    authToken: authToken
                  }, {
                    new: true
                  }).then(async (user) => {
                    done({
                      isUser: 1,
                      data: user
                    })
                  })
                })
              done({
                isUser: 0
              });
            }
          });
        } else if (!user) {
          done({
            isUser: 0
          });
        } else {
          let update = {
            deviceId: data.deviceId,
            deviceType: data.deviceType,
            authToken: await Service.JwtService.issue({
              _id: user._id
            }),
          };
          if (data.profilePic) update.profilePic = data.profilePic;
          update.referralCode = generateReferralCode();
          let result = await Service.db.updateWithId(
            model.user,
            user._id,
            update,
            [],
            "+authToken"
          );
          if (auth && auth._id) {
            let cartData = await model.storeCart
              .find({
                userId: auth._id
              })
              .select("-_id")
              .lean();
            await model.storeCart.deleteMany({
              userId: auth._id
            });
            let heheh = cartData.map((item) => {
              item.userId = user._id;
              return item;
            });
            await model.storeCart.insertMany(heheh);
          }
          done({
            data: result,
            isUser: 1
          });
        }
      });
    });
  }
  checkBeforeUpdate(data, lang, userId) {
    return new Promise((done, reject) => {
      if (!data.email || !data.countryCode || !data.phone)
        return reject({
          message: "PARAMETERMISSING"
        });

      let qry = {
        $and: [{
          _id: {
            $ne: userId
          }
        },
        {
          $or: [{
            email: data.email.toLowerCase()
          },
          {
            countryCode: data.countryCode,
            phone: data.phone
          },
          ],
        },
        ],
      };

      model.user
        .findOne(qry)
        .then(async (result) => {
          if (result)
            return reject({
              message: data.email && data.email.toLowerCase() == result.email ?
                multilingualService.getResponseMessage("EMAILEXISTS", lang) : multilingualService.getResponseMessage("PHONEEXISTS", lang),
            });
          const Otp = await model
            .Otp({
              otp: Math.floor(1000 + Math.random() * 9000),
              user: data.phone,
              phone: data.phone,
              countryCode: data.countryCode,
            })
            .save();
          await Service.selectOtpServiceAndSend.send(data.countryCode, data.phone, Otp.otp)
          done({
            data: {
              otp: Otp.otp
            }
          });
        })
        .catch((err) => {
          reject({
            message: multilingualService.getResponseMessage("ERRMSG", lang),
          })
        });
    });
  }
  getProfile(userId) {
    return new Promise(async (done, reject) => {
      let appSetting = await model.AppSetting.find({})
      appSetting = appSetting[0]
      let user = await model.user.findById(userId).select("+authToken").lean();
      user.authToken = await Service.JwtService.issue({
        _id: user._id
      });
      let transaction = await model.transactions.find({
        userId: userId,
        transactionType: "redeemLoyalityPoints"
      }).sort({
        createdAt: -1
      })
      if (transaction.length > 0 && moment(transaction[0].createdAt).from(new Date) > appSetting.loyalityExpiryDate) {
        await model.user.findByIdAndUpdate(userId, {
          $set: {
            availableLP: 0
          }
        })
      }
      done({
        data: user
      });
    });
  }
  updateProfile(data, file, lang, userId, finalFileName) {
    return new Promise((done, reject) => {
      let qry = {
        $and: [{
          _id: {
            $ne: userId
          }
        },
        {
          $or: [{
            email: data.email.toLowerCase()
          },
          {
            countryCode: data.countryCode,
            phone: data.phone
          },
          ],
        },
        ],
      };

      model.user.findOne(qry).then((user) => {
        if (user)
          return reject({
            message: data.email.toLowerCase() == user.email ?
              multilingualService.getResponseMessage("EMAILEXISTS", lang) : multilingualService.getResponseMessage("PHONEEXISTS", lang),
          });
        if (finalFileName)
          data.profilePic = process.env.S3URL + finalFileName;

        model.user
          .findByIdAndUpdate(userId, data, {
            new: true
          })
          .select("+authToken")
          .then((result) => {
            done({
              message: multilingualService.getResponseMessage(
                "UPDATEMSG",
                lang
              ),
              data: result,
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
  ChangeForgotPassword(data, lang) {
    return new Promise((done, reject) => {
      data.hash = Service.HashService.encrypt(data.password);
      model.user
        .findOneAndUpdate({
          countryCode: data.countryCode,
          phone: data.phone
        },
          data, {
          new: true
        }
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
  async changePassword(data, lang, userId) {
    return new Promise(async (done, reject) => {
      model.user
        .findById(userId)
        .select("+hash")
        .then((user) => {
          if (Service.HashService.decrypt(user.hash) !== data.oldPassword)
            return reject({
              message: multilingualService.getResponseMessage(
                "WRONGOLDPASSWORD",
                lang
              ),
            });

          let update = {
            hash: Service.HashService.encrypt(data.password)
          };

          model.user
            .findByIdAndUpdate(userId, update, {
              new: true
            })
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
  changeAvailability(data, userId, lang) {
    return new Promise(async (done, reject) => {
      model.user
        .findByIdAndUpdate(
          userId, {
          isAvailable: data.isAvailable
        }, {
          new: true
        }
        )
        .then((result) => {
          done({
            data: result
          });
        });
    });
  }
  addAddress(data, userId, lang) {
    return new Promise(async (done, reject) => {
      data.userId = userId;
      let address = this.createAddress(data);
      address
        .save()
        .then(async (result) => {
          await model.address.update({
            userId: userId,
            _id: {
              $ne: result._id
            }
          }, {
            isPreffered: 0
          }, {
            multi: true
          }).then((updated) => {
            done({
              message: multilingualService.getResponseMessage("ADDMSG", lang),
              data: result,
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
  getAddress(userId, data, lang) {
    return new Promise(async (done, reject) => {
      model.address
        .aggregate([{
          $match: {
            userId: mongoose.Types.ObjectId(userId),
            status: {
              $ne: 2
            },
          },
        },
        {
          $project: {
            _id: 1,
            isPreffered: 1,
            address: 1,
            location: 1,
            zipcode: 1,
            latitude: 1,
            longitude: 1,
            distance: 1,
            addressType: 1,
            bulidingNo: 1,
            completeAddress: 1,
            isDeliver: {
              $cond: [{
                $lt: ["$distance", Constant.RADIUSCIRCLE / 1000]
              },
                1,
                0,
              ],
            },
          },
        },
        ])
        .then((result) => {
          done({
            message: "",
            data: result
          });
        })
        .catch((err) => {
          reject({
            message: multilingualService.getResponseMessage("ERRMSG", lang),
          });
        });
    });
  }
  updateAddress(data, userId, lang) {
    return new Promise(async (done, reject) => {
      if (data.isDeleted) {
        model.address.findByIdAndDelete(data.updateId).then((result) => {
          done({
            message: multilingualService.getResponseMessage("DELETEMSG", lang),
            data: result,
          });
        });
      } else {
        if (data.latitude && data.longitude)
          data.cordinates = [
            parseFloat(data.longitude),
            parseFloat(data.latitude),
          ];

        model.address
          .findByIdAndUpdate(data.updateId, data, {
            new: true
          })
          .then(async (result) => {
            if (data.isPreffered)
              await model.address.findOneAndUpdate({
                userId: userId,
                isPreffered: 1,
                _id: {
                  $ne: data.updateId
                }
              }, {
                isPreffered: 0
              });

            done({
              message: multilingualService.getResponseMessage(
                "UPDATEMSG",
                lang
              ),
              data: result,
            });
          })
          .catch((err) => {
            reject({
              message: multilingualService.getResponseMessage("ERRMSG", lang),
            });
          });
      }
    });
  }
  applyPromocode(data, userId, lang) {
    return new Promise(async (done, reject) => {
      let isPromoApplicable = false;
      let total_discount = 0;
      let promo = await model.promocode.findOne({
        code: data.promocode,
        status: {
          $in: [1, 3]
        },
        startDate: {
          $lte: new Date(moment().startOf('date'))
        },
        endDate: {
          $gte: new Date(moment().startOf('date'))
        },
        verticalType: data.verticalType,
      });
      let cartItems = await model.storeCart.find({
        userId
      }).lean();
      if (!promo) {
        return reject({
          message: multilingualService.getResponseMessage("INVALIDCODE", lang),
        });
      }
      if (promo.endDate && promo.endDate < moment().valueOf()) {
        return reject({
          message: multilingualService.getResponseMessage(
            "CODENOTEXISTSNOW",
            lang
          ),
        });
      }
      let usedPromo = await model.Promouser.findOne({
        userId,
        promoId: promo._id,
      }).lean();

      if (promo.useLimit) {
        if (usedPromo && usedPromo.usedCount >= promo.useLimit) {
          return reject({
            message: "You have exceeded the limit of use",
          });
        }
      }
      let dailyUsePromo = await model.DailyUsePromo.findOne({
        userId,
        promoId: promo._id,
      }).lean();

      if (dailyUsePromo) {
        if (promo.perDayLimit <= dailyUsePromo.no_of_use_in_last_24hours) {
          return reject({
            message: "You have exceeded the daily limit of use",
          });
        }
      }

      let minAmountCheckCart = await model.storeCart.find({
        userId
      });
      let minAmountTotal = 0;
      for (let item in minAmountCheckCart) {
        minAmountTotal += Number(
          minAmountCheckCart[item].itemQuantity *
          (minAmountCheckCart[item].amount +
            minAmountCheckCart[item].totalAddonsAmount)
        );
      }

      if (promo.minAmountToApply > minAmountTotal) {
        return reject({
          message: "Min Amount for this promo code is " + promo.minAmountToApply,
        });
      }

      let qry = {};

      if (promo.isUser) {
        if (promo.userId.includes(userId)) {
          isPromoApplicable = true;
          cartItems.forEach((item) => {
            let isDeal = false
            if (item.isDeal) {
              isDeal = true
            }
            if (isDeal == false) {
              item.isPromoApplied = true;
              if (promo.discountType.toLowerCase() === "flat")
                item.promoDiscount = promo.discount * item.itemQuantity;
              else {
                item.promoDiscount = ((promo.discount * 1) / 100) * item.amount * item.itemQuantity;
              }
              item.totalAmount -= item.promoDiscount;
              total_discount += item.promoDiscount;
            }
          });
        }
      }
      if (promo.isBrand) {
        let cartBrands = new Set();
        let promoBrands = new Set();
        cartItems.forEach((item) => {
          cartBrands.add(item.itemBrandId.toString());
        });
        promo.brandId.forEach((item) => {
          promoBrands.add(item.toString());
        });
        const intersection = new Set(
          [...cartBrands].filter((x) => promoBrands.has(x))
        );

        cartItems.forEach((item) => {
          if (intersection.has(item.itemBrandId.toString())) {
            isPromoApplicable = true;
            item.isPromoApplied = true;
            if (promo.discountType.toLowerCase() === "flat")
              item.promoDiscount = promo.discount * item.itemQuantity;
            else {
              item.promoDiscount =
                (promo.discount / 100) * item.amount * item.itemQuantity;
            }

            item.totalAmount -= item.promoDiscount;
            total_discount += item.promoDiscount;
          }
        });
      }

      if (promo.isStore) {
        let cartStores = new Set();
        let promoStores = new Set();
        cartItems.forEach((item) => {
          cartStores.add(item.storeId.toString());
        });
        promo.storeIds.forEach((item) => {
          promoStores.add(item.toString());
        });
        const intersection = new Set(
          [...cartStores].filter((x) => promoStores.has(x))
        );

        cartItems.forEach((item) => {
          if (intersection.has(item.storeId.toString())) {
            isPromoApplicable = true;

            item.isPromoApplied = true;
            if (promo.discountType.toLowerCase() === "flat")
              item.promoDiscount = promo.discount * item.itemQuantity;
            else {
              item.promoDiscount =
                ((promo.discount * 1) / 100) * item.amount * item.itemQuantity;
            }
            item.totalAmount -= item.promoDiscount;
            total_discount += item.promoDiscount;
          }
        });
      }

      if (promo.isCategory) {
        let cartCategorys = new Set();
        let promoCategorys = new Set();
        cartItems.forEach((item) => {
          cartCategorys.add(item.itemCategoryId.toString());
        });
        promo.categoryId.forEach((item) => {
          promoCategorys.add(item.toString());
        });
        const intersection = new Set(
          [...cartCategorys].filter((x) => promoCategorys.has(x))
        );

        cartItems.forEach((item) => {
          if (intersection.has(item.itemCategoryId.toString())) {
            isPromoApplicable = true;

            item.isPromoApplied = true;
            if (promo.discountType.toLowerCase() === "flat")
              item.promoDiscount = promo.discount * item.itemQuantity;
            else {
              item.promoDiscount =
                ((promo.discount * 1) / 100) * item.amount * item.itemQuantity;
            }
            item.totalAmount -= item.promoDiscount;
            total_discount += item.promoDiscount;
          }
        });
      }

      if (promo.isSubCategory) {
        let cartSubCategorys = new Set();
        let promoSubCategorys = new Set();
        cartItems.forEach((item) => {
          cartSubCategorys.add(item.itemSubCategoryId.toString());
        });
        promo.subCategoryId.forEach((item) => {
          promoSubCategorys.add(item.toString());
        });
        const intersection = new Set(
          [...cartSubCategorys].filter((x) => promoSubCategorys.has(x))
        );

        cartItems.forEach((item) => {
          if (intersection.has(item.itemSubCategoryId.toString())) {
            isPromoApplicable = true;
            item.isPromoApplied = true;
            if (promo.discountType.toLowerCase() === "flat")
              item.promoDiscount = promo.discount * item.itemQuantity;
            else {
              item.promoDiscount =
                (promo.discount / 100) * item.amount * item.itemQuantity;
            }
            item.totalAmount -= item.promoDiscount;
            total_discount += item.promoDiscount;
          }
        });
      }

      if (promo.isProduct) {
        let cartProducts = new Set();
        let promoProducts = new Set();

        for (let i = 0; i < cartItems.length; i++) {
          let data = await model.storeItem.findById(cartItems[i].itemId);
          cartProducts.add(data.productKey);
        }
        cartItems.forEach(async (item) => { });
        promo.productId.forEach((item) => {
          promoProducts.add(item.toString());
        });
        const intersection = new Set(
          [...cartProducts].filter((x) => promoProducts.has(x))
        );

        for (let i = 0; i < cartItems.length; i++) {
          let data = await model.storeItem.findById(
            cartItems[i].itemId.toString()
          );
          if (intersection.has(data.productKey)) {
            isPromoApplicable = true;

            cartItems[i].isPromoApplied = true;
            if (promo.discountType.toLowerCase() === "flat")
              cartItems[i].promoDiscount =
                promo.discount * cartItems[i].itemQuantity;
            else {
              cartItems[i].promoDiscount =
                (promo.discount / 100) *
                cartItems[i].amount *
                cartItems[i].itemQuantity;
            }
            cartItems[i].totalAmount -= cartItems[i].promoDiscount;
            total_discount += cartItems[i].promoDiscount;
          }
        }
        cartItems.forEach((item) => { });
      }

      if (!isPromoApplicable)
        return reject({
          message: "Sorry, This PromoCode is Not Applicable for You.",
        });

      if (total_discount > promo.maxDiscount) {
        await model.storeCart.updateMany({
          userId
        }, {
          exceedingMaximumDiscountLimit: true,
          maximumDiscount: promo.maxDiscount,
        });

        // return reject({
        //   status: 20,
        //   message:
        //     "Maximum Discount limit exceeded please hit GET Cart api again",
        // });
      } else {
        await model.storeCart.updateMany({
          userId
        }, {
          exceedingMaximumDiscountLimit: false,
        });
      }
      await model.Promouser.findOneAndUpdate({
        userId,
        promoId: promo._id
      }, {
        $inc: {
          usedCount: 1
        }
      }, {
        upsert: true
      });
      if (dailyUsePromo) {
        if (
          dailyUsePromo.first_time_use_in_last_24hours >
          Date.now() - 24 * 60 * 60 * 1000
        ) {

          await model.DailyUsePromo.findOneAndUpdate({
            userId,
            promoId: promo._id
          }, {
            $inc: {
              no_of_use_in_last_24hours: 1
            }
          });
        } else {

          await model.DailyUsePromo.findOneAndUpdate({
            userId,
            promoId: promo._id
          }, {
            $set: {
              first_time_use_in_last_24hours: new Date(),
              no_of_use_in_last_24hours: 1,
            },
          });
        }
      } else {

        await model.DailyUsePromo.findOneAndUpdate({
          userId,
          promoId: promo._id
        }, {
          $set: {
            first_time_use_in_last_24hours: new Date(),
            no_of_use_in_last_24hours: 1,
          },
        }, {
          upsert: true
        });
      }

      const query = [];
      cartItems.forEach((item) => {
        if (!item.isPromoApplied) item.isPromoApplied = false;
        if (!item.promoDiscount) item.promoDiscount = 0;
        query.push({
          updateOne: {
            filter: {
              _id: item._id
            }, // this is _id of cart data
            update: {
              $set: item
            },
          },
        });
      });
      await model.storeCart.bulkWrite(query);
      let cart = await model.storeCart.find({
        userId
      });
      let cartItemCount = 0;
      let amountTax = 0
      let cartAmount = 0;
      let totalItemsAmount = 0;
      let deliveryCharge = 0;
      let item2 = cart[0];
      for (let item in cart) {
        cartItemCount += Number(cart[item].itemQuantity);
        totalItemsAmount += Number(
          cart[item].itemQuantity *
          (cart[item].amount + cart[item].totalAddonsAmount)
        );
        cartAmount += Number(cart[item].totalAmount);
        amountTax += Number(cart[item].amount)
        // itemToGetStoreType = item;
      }
      totalItemsAmount.toFixed(2);
      cartAmount.toFixed(2);
      let storeData = await model.store.findById(item2.storeId);
      let category = await model.storeItemType.findById(item2.itemCategoryId);
      let storeType = await model.storeCategory.findById(
        category.storeCategoryId
      );
      let taxPercent = storeType != null ? storeType.tax : 0;
      if (storeData != null && storeData.serviceTax != 0) {
        taxPercent = storeData.serviceTax;
      }
      /* 
          
            let taxTotal = Number(amountTax.toFixed(2)) * (taxPercent / 100);
            taxTotal.toFixed(2); */
      let taxTotal = Number(cartAmount.toFixed(2)) * (taxPercent / 100);
      taxTotal.toFixed(2);


      let deliverFee = await model.AppSetting.findOne({}).lean().exec();
      deliveryCharge = Number(deliverFee.driverPerKmCharge);
      if (storeData != null && storeData.deliveryCharges > 0) {
        deliveryCharge = Number(storeData.deliveryCharges);
      }
      let packingCharge = storeType != null ? storeType.packingCharge : 0;
      if (storeData != null && storeData.packingCharges != 0) {
        packingCharge = storeData.packingCharges;
      }
      cartAmount += Number(deliveryCharge);
      cartAmount += taxTotal;
      cartAmount += packingCharge;
      done({
        message: "",
        data: {
          promo,
          cart,
          cartAmount,
          deliveryCharge,
          totalItemsAmount,
          taxTotal,
        },
      });
    });
  }

  applyPromocodeNew(data, userId, lang) {
    return new Promise(async (done, reject) => {
      let cart = await model.storeCart.find({
        userId
      });
      let cartItemCount = 0;
      let amountTax = 0
      let cartAmount = 0;
      let totalItemsAmount = 0;
      let deliveryCharge = 0;
      let item2 = cart[0];
      for (let item in cart) {
        cartItemCount += Number(cart[item].itemQuantity);
        totalItemsAmount += Number(
          cart[item].itemQuantity *
          (cart[item].amount + cart[item].totalAddonsAmount)
        );
        cartAmount += Number(cart[item].totalAmount);
        amountTax += Number(cart[item].amount)
        // itemToGetStoreType = item;
      }
      totalItemsAmount.toFixed(2);
      cartAmount.toFixed(2);
      let storeData = await model.store.findById(item2.storeId);
      let category = await model.storeItemType.findById(item2.itemCategoryId);
      let storeType = await model.storeCategory.findById(
        category.storeCategoryId
      );
      let taxPercent = storeType != null ? storeType.tax : 0;
      if (storeData != null && storeData.serviceTax != 0) {
        taxPercent = storeData.serviceTax;
      }
      /* 
          
            let taxTotal = Number(amountTax.toFixed(2)) * (taxPercent / 100);
            taxTotal.toFixed(2); */
      let taxTotal = Number(cartAmount.toFixed(2)) * (taxPercent / 100);
      taxTotal.toFixed(2);


      let deliverFee = await model.AppSetting.findOne({}).lean().exec();
      deliveryCharge = Number(deliverFee.driverPerKmCharge);
      if (storeData != null && storeData.deliveryCharges > 0) {
        deliveryCharge = Number(storeData.deliveryCharges);
      }
      let packingCharge = storeType != null ? storeType.packingCharge : 0;
      if (storeData != null && storeData.packingCharges != 0) {
        packingCharge = storeData.packingCharges;
      }
      cartAmount += Number(deliveryCharge);
      cartAmount += taxTotal;
      cartAmount += packingCharge;

      let isPromoApplicable = false;
      let total_discount = 0;
      let promo = await model.promocode.findOne({
        code: new RegExp("^" + data.promocode + "$", "i"),
        status: {
          $in: [1, 3]
        },
        startDate: {
          $lte: new Date(moment().startOf('date'))
        },
        endDate: {
          $gte: new Date(moment().startOf('date'))
        },
        verticalType: data.verticalType,
      });
      let cartItems = await model.storeCart.find({
        userId
      }).lean();
      if (!promo) {
        return reject({
          message: multilingualService.getResponseMessage("INVALIDCODE", lang),
        });
      }
      if (promo.endDate && promo.endDate < moment().valueOf()) {
        return reject({
          message: multilingualService.getResponseMessage(
            "CODENOTEXISTSNOW",
            lang
          ),
        });
      }
      let usedPromo = await model.Promouser.findOne({
        userId,
        promoId: promo._id,
      }).lean();

      if (promo.useLimit) {
        if (usedPromo && usedPromo.usedCount >= promo.useLimit) {
          return reject({
            message: "You have exceeded the limit of use",
          });
        }
      }
      let dailyUsePromo = await model.DailyUsePromo.findOne({
        userId,
        promoId: promo._id,
      }).lean();

      if (dailyUsePromo) {
        if (promo.perDayLimit <= dailyUsePromo.no_of_use_in_last_24hours) {
          return reject({
            message: "You have exceeded the daily limit of use",
          });
        }
      }

      let minAmountCheckCart = await model.storeCart.find({
        userId
      });
      let minAmountTotal = 0;
      for (let item in minAmountCheckCart) {
        minAmountTotal += Number(
          minAmountCheckCart[item].itemQuantity *
          (minAmountCheckCart[item].amount +
            minAmountCheckCart[item].totalAddonsAmount)
        );
      }

      if (promo.minAmountToApply > minAmountTotal) {
        return reject({
          message: "Min Amount for this promo code is " + promo.minAmountToApply,
        });
      }

      let qry = {};
      let promoAmount = 0
      let promoDiscount = 0
      if (promo.isUser) {
        if (promo.userId.includes(userId)) {
          isPromoApplicable = true;
          cartItems.forEach((item) => {
            let isDeal = false
            if (item.isDeal) {
              isDeal = true
            }
            if (isDeal == false) {
              // item.isPromoApplied = true;
              // if (promo.discountType.toLowerCase() === "flat")
              //   item.promoDiscount = promo.discount * item.itemQuantity;
              // else {
              promoAmount += item.amount * item.itemQuantity;
              //}
              // item.totalAmount -= item.promoDiscount;
              // total_discount += item.promoDiscount;
            }
          });
          if (promo.discountType.toLowerCase() === "flat")
            if (promoAmount < promoDiscount)
              promoDiscount = promoAmount
            else promoDiscount = promo.discount
          else {
            promoDiscount = (promoAmount * promo.discount) / 100
          }
        }
      }
      else if (promo.isBrand) {
        const cart1 = await model.storeCart.aggregate([
          {
            $match: {
              userId: mongoose.Types.ObjectId(userId)
            }
          },
          {
            $group: {
              _id: "$itemBrandId",
              totalAmount: { "$sum": "$totalAmount" },
              itemQuantity: { "$sum": "$itemQuantity" },
              itemCategoryId: { "$first": "$itemCategoryId" },
              exceedingMaximumDiscountLimit: { "$first": "$exceedingMaximumDiscountLimit" },
              maximumDiscount: { "$first": "$maximumDiscount" },
              isDeal: { "$first": "isDeal" }
            },

          }
        ])
        cart1.forEach((item) => {
          if (promo.brandId.includes(item._id.toString())) {
            isPromoApplicable = true
            if (promo.discountType.toLowerCase() === "flat")
              if (item.totalAmount < promoDiscount)
                promoDiscount += item.totalAmount
              else promoDiscount += promo.discount
            else {
              promoDiscount =
                (promo.discount / 100) * item.totalAmount
            }
            promoAmount += item.totalAmount;
          }
        });
      }
      else if (promo.isStore) {
        const cart1 = await model.storeCart.aggregate([
          {
            $match: {
              userId: mongoose.Types.ObjectId(userId)
            }
          },
          {
            $group: {
              _id: "$storeId",
              totalAmount: { "$sum": "$totalAmount" },
              itemQuantity: { "$sum": "$itemQuantity" },
              itemCategoryId: { "$first": "$itemCategoryId" },
              exceedingMaximumDiscountLimit: { "$first": "$exceedingMaximumDiscountLimit" },
              maximumDiscount: { "$first": "$maximumDiscount" },
              isDeal: { "$first": "isDeal" }
            },

          }
        ])
        cart1.forEach((item) => {
          if (promo.storeIds.includes(item._id.toString())) {
            isPromoApplicable = true
            if (promo.discountType.toLowerCase() === "flat")
              if (item.totalAmount < promoDiscount)
                promoDiscount += item.totalAmount
              else promoDiscount += promo.discount
            else {
              promoDiscount =
                (promo.discount / 100) * item.totalAmount
            }
            promoAmount += item.totalAmount;
          }

        });
      }

      else if (promo.isCategory) {
        const cart1 = await model.storeCart.aggregate([
          {
            $match: {
              userId: mongoose.Types.ObjectId(userId)
            }
          },
          {
            $group: {
              _id: "$itemCategoryId",
              totalAmount: { "$sum": "$totalAmount" },
              itemQuantity: { "$sum": "$itemQuantity" },
              itemCategoryId: { "$first": "$itemCategoryId" },
              exceedingMaximumDiscountLimit: { "$first": "$exceedingMaximumDiscountLimit" },
              maximumDiscount: { "$first": "$maximumDiscount" },
              isDeal: { "$first": "isDeal" }
            },
          }
        ])
        cart1.forEach((item) => {
          if (promo.categoryId.includes(item._id.toString())) {
            isPromoApplicable = true
            if (promo.discountType.toLowerCase() === "flat") {
              if (item.totalAmount < promoDiscount)
                promoDiscount += item.totalAmount
              else promoDiscount += promo.discount
            }
            else {
              promoDiscount =
                (promo.discount / 100) * item.totalAmount
            }
            promoAmount += item.totalAmount;
          }
        });
      }

      else if (promo.isSubCategory) {
        const cart1 = await model.storeCart.aggregate([
          {
            $match: {
              userId: mongoose.Types.ObjectId(userId)
            }
          },
          {
            $group: {
              _id: "$itemSubCategoryId",
              totalAmount: { "$sum": "$totalAmount" },
              itemQuantity: { "$sum": "$itemQuantity" },
              itemCategoryId: { "$first": "$itemCategoryId" },
              exceedingMaximumDiscountLimit: { "$first": "$exceedingMaximumDiscountLimit" },
              maximumDiscount: { "$first": "$maximumDiscount" },
              isDeal: { "$first": "isDeal" }
            },

          }
        ])
        cart1.forEach((item) => {
          if (promo.subCategoryId.includes(item._id.toString())) {
            isPromoApplicable = true
            if (promo.discountType.toLowerCase() === "flat") {
              if (item.totalAmount < promoDiscount)
                promoDiscount += item.totalAmount
              else promoDiscount += promo.discount
            }
            else {
              promoDiscount =
                (promo.discount / 100) * item.totalAmount
            }
            promoAmount += item.totalAmount;
          }
        });
      }

      else if (promo.isProduct) {
        let cartProducts = new Set();
        let promoProducts = new Set();

        for (let i = 0; i < cartItems.length; i++) {
          let data = await model.storeItem.findById(cartItems[i].itemId);
          cartProducts.add(data.productKey);
        }
        cartItems.forEach(async (item) => { });
        promo.productId.forEach((item) => {
          promoProducts.add(item.toString());
        });
        const intersection = new Set(
          [...cartProducts].filter((x) => promoProducts.has(x))
        );

        for (let i = 0; i < cartItems.length; i++) {
          let data = await model.storeItem.findById(
            cartItems[i].itemId.toString()
          );
          if (intersection.has(data.productKey)) {
            isPromoApplicable = true;

            cartItems[i].isPromoApplied = true;
            if (promo.discountType.toLowerCase() === "flat")
              cartItems[i].promoDiscount =
                promo.discount * cartItems[i].itemQuantity;
            else {
              cartItems[i].promoDiscount =
                (promo.discount / 100) *
                cartItems[i].amount *
                cartItems[i].itemQuantity;
            }
            cartItems[i].totalAmount -= cartItems[i].promoDiscount;
            total_discount += cartItems[i].promoDiscount;
          }
        }
        cartItems.forEach((item) => { });
      }

      if (!isPromoApplicable)
        return reject({
          message: "Sorry, This PromoCode is Not Applicable for You.",
        });

      if (promoDiscount > promo.maxDiscount) {
        await model.storeCart.updateMany({
          userId
        }, {
          exceedingMaximumDiscountLimit: true,
          maximumDiscount: promo.maxDiscount,
        });

        // return reject({
        //   status: 20,
        //   message:
        //     "Maximum Discount limit exceeded please hit GET Cart api again",
        // });
      } else {
        await model.storeCart.updateMany({
          userId
        }, {
          exceedingMaximumDiscountLimit: false,
        });
      }


      // const query = [];
      // cartItems.forEach((item) => {
      //   if (!item.isPromoApplied) item.isPromoApplied = false;
      //   if (!item.promoDiscount) item.promoDiscount = 0;
      //   query.push({
      //     updateOne: {
      //       filter: {
      //         _id: item._id
      //       }, // this is _id of cart data
      //       update: {
      //         $set: item
      //       },
      //     },
      //   });
      // });
      // await model.storeCart.bulkWrite(query);
      if(totalItemsAmount>=promoDiscount)
      cartAmount -= promoDiscount
      else
      cartAmount -= totalItemsAmount

      done({
        message: "",
        data: {
          promo,
          cart,
          cartAmount,
          deliveryCharge,
          totalItemsAmount,
          taxTotal,
          promoDiscount
        },
      });
    });
  }
  async getUserNotificationById(data) {
    return await model.notification.findById(data.id);
  }
  removePromoCode(data, userId) {
    return new Promise(async (done, reject) => {
      let promo = await model.promocode.findOneAndUpdate({
        code: new RegExp("^" + data.promocode + "$", "i"),
        status: {
          $in: [1, 3]
        },
        verticalType: data.verticalType,
      }, {
        $pull: {
          usedUserId: userId
        }
      });
      await model.Promouser.findOneAndUpdate({
        userId,
        promoId: promo._id
      }, {
        $inc: {
          usedCount: -1
        }
      });
      let cartItems = await model.storeCart.find({
        userId
      }).lean();
      cartItems.forEach((item) => {
        item.isPromoApplied = false;
        item.totalAmount += item.promoDiscount;
        item.promoDiscount = 0;
      });

      const query = [];
      cartItems.forEach((item) => {
        query.push({
          updateOne: {
            filter: {
              _id: item._id
            },
            update: {
              $set: item
            },
          },
        });
      });
      await model.storeCart.bulkWrite(query);
      let cart = await model.storeCart.find({
        userId
      });
      let cartItemCount = 0;
      let cartAmount = 0;
      let totalItemsAmount = 0;
      let deliveryCharge = 0;
      let item2 = cart[0];
      for (let item in cart) {
        cartItemCount += Number(cart[item].itemQuantity);
        totalItemsAmount += Number(cart[item].itemQuantity * cart[item].amount);
        cartAmount += Number(cart[item].totalAmount);
      }
      totalItemsAmount.toFixed(2);
      cartAmount.toFixed(2);
      let storeData = await model.store.findById(item2.storeId);
      let category = await model.storeItemType.findById(item2.itemCategoryId);
      let storeType = await model.storeCategory.findById(
        category.storeCategoryId
      );

      let taxPercent = storeType != null ? storeType.tax : 0;
      if (storeData != null && storeData.serviceTax != 0) {
        taxPercent = storeData.serviceTax;
      }
      let taxTotal = Number(cartAmount.toFixed(2)) * (taxPercent / 100);
      taxTotal.toFixed(2);

      let deliverFee = await model.AppSetting.findOne({}).lean().exec();
      deliveryCharge = Number(deliverFee.driverPerKmCharge);
      if (storeData != null && storeData.deliveryCharges > 0) {
        deliveryCharge = Number(storeData.deliveryCharges);
      }
      let packingCharge = storeType != null ? storeType.packingCharge : 0;
      if (storeData != null && storeData.packingCharges != 0) {
        packingCharge = storeData.packingCharges;
      }
      cartAmount += Number(deliveryCharge);
      cartAmount += taxTotal;
      cartAmount += Number(packingCharge);
      done({
        message: "",
        data: {
          promo,
          cart,
          cartAmount,
          totalItemsAmount,
          deliveryCharge,
          cartItemCount,
          taxTotal,
        },
      });
    });
  }
  getAllNotifications(data, userId, lang) {
    return new Promise(async (done, reject) => {
      let skip =
        Number(data.page) > 1 ? (Number(data.page) - 1) * Constant.LIMIT : 0;
      model.notification
        .find({
          userId: userId,
          verticalType: data.verticalType
        })
        .sort({
          _id: -1
        })
        .skip(skip)
        .limit(Constant.LIMIT)
        .then(async (result) => {
          model.notification
            .countDocuments({
              userId: userId,
              verticalType: data.verticalType
            })
            .then(async (count) => {
              let recent = [],
                old = [];

              result.map((val) => {
                if (val.status) old.push(val);
                else recent.push(val);
              });
              if (!Number(data.page) || Number(data.page) == 1)
                await model.notification.update({
                  userId: userId,
                  status: 0,
                  verticalType: data.verticalType,
                }, {
                  status: 1
                }, {
                  multi: true
                });

              done({
                data: {
                  recentList: recent,
                  oldList: old,
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
  getCms(lang) {
    return new Promise(async (done, reject) => {
      let faqs = await model.Faq.find({});
      model.Cms.findOne({}).lean()
        .then((result) => {
          result.faqs = faqs;
          done({
            data: result
          });
        })
        .catch((err) => {
          return reject({
            message: multilingualService.getResponseMessage("FALSEMSG", lang),
          });
        });
    });
  }
  refresh() {
    return new Promise((done, reject) => {
      request(
        "http://localhost:3000/appSettings?app=5feda0e91155bf37592bd26c",
        function (error, response, body) {
          body = JSON.parse(body);
          //   global.senderId = body.senderId;
          global.currency = body.currency;
        }
      );
      done("Success");
      return;
    });
  }
  test() {
    return new Promise((done, reject) => {
      done(global.currency);
      return;
    });
  }
  forgotPassword(data, lang) {
    return new Promise(async (done, reject) => {
      const phone = data.phone;
      if (!phone) {
        return reject({
          message: multilingualService.getResponseMessage("PARAMETERMISSING", lang),
        });
      }
      let user = await model.user.findOne({
        phone: data.phone,
        countryCode: data.countryCode,
      });
      if (!user) {
        return reject({
          message: multilingualService.getResponseMessage("USERNOTFOUND", lang),
        });
      }
      if (user.isSocialRegister) {
        return reject({
          message: multilingualService.getResponseMessage("USERASSOCIATEWITHSOCIALACCOUNT", lang),
        });
      } else if (data.fireOtp == false) // if fireOtp false it means otp send from front end
      {
        done({
          message: Constant.SUCCESSCODE,
          data: {
            success: true
          }
        })
      } else {
        const otpData = await model.Otp.findOne({
          user: data.phone
        });
        if (otpData) await model.Otp.deleteMany({
          user: data.phone
        });

        const Otp = await model.Otp({
          otp: Math.floor(1000 + Math.random() * 9000),
          phone: data.phone,
          countryCode: data.body,
        }).save();

        await Service.selectOtpServiceAndSend.send(data.countryCode, data.phone, Otp.otp)
        done({
          message: multilingualService.getResponseMessage("FORGOTPASSWORDSENDSUCCESSFULLY", lang),
          data: {
            otpId: Otp._id,
            otp: Otp.otp
          },
        });
      }
    });
  }
  async customerSupport(req, res) {
    try {
      if (req.finalFileName) req.body.screenShot = process.env.S3URL + finalFileName;
      // if (req.body.length != 2) return multilingualService.sendResponse(req, res, false, 1, 0, responseMessages.PARAMETERMISSING, "")
      req.body.userId = req.user._id;
      // req.body = JSON.parse(req.body);
      let msg = await model.CustomerSupport.create(req.body);
      return multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.CUSTOMER_SUPPORT_MESSAGE_SEND_SUCCESSFULLY, msg)
    } catch (error) { }
  }
  async uploadPrescription(file, lang, finalFileName) {
    try {
      const isLink = process.env.S3URL + finalFileName;
      return {
        message: "uploaded",
        data: isLink
      }
    } catch (error) { }
  }

  async getBestSellingProducts(lang) {
    return new Promise(async (done, reject) => {
      try {
        let bestSellingProducts = await model.storeOrder.aggregate([
          {
            $lookup: {
              from: "storeitems",
              localField: "items.itemId",
              foreignField: "_id",
              as: "itemId"
            }
          },
          {
            $unwind: {
              path: "$itemId"
            }
          },
          {
            $group: {
              _id: "$itemId._id",
              count: { $sum: 1 },
              productName: {
                $first: "$itemId.productName",
              },
              productName_ar: {
                $first: "$itemId.productName_ar",
              },
              storeItemSubTypeId: {
                $first: "$itemId.storeItemSubTypeId",
              },
              storeItemTypeId: {
                $first: "$itemId.storeItemTypeId",
              },
              brandId: {
                $first: "$itemId.brandId",
              },
              createdAt: {
                $first: "$itemId.createdAt",
              },
              storeTypeId: {
                $first: "$itemId.storeTypeId",
              },
              label: {
                $first: "$itemId.label"
              },
              color: {
                $first: "$itemId.color"
              },
              marketPrice: {
                $first: "$itemId.marketPrice"
              },
              price: {
                $first: "$itemId.price"
              },
              originalPrice: {
                $first: "$itemId.originalPrice"
              },
              discount: {
                $first: "$itemId.discount"
              },
              discountType: {
                $first: "$itemId.discountType"
              },
              description_ar: {
                $first: "$itemId.description_ar"
              },
              description: {
                $first: "$itemId.description"
              },
              image1: {
                $first: "$itemId.image1"
              },
              image2: {
                $first: "$itemId.image2"
              },
              image3: {
                $first: "$itemId.image3"
              },
              image4: {
                $first: "$itemId.image4"
              },
              image5: {
                $first: "$itemId.image5"
              },
              video: {
                $first: "$itemId.video"
              },
              tickets: {
                $first: "$itemId.tickets"
              },
              LP: {
                $first: "$itemId.LP"
              },
              name_ar: {
                $first: "$itemId.name_ar"
              },
              quantity: {
                $first: "$itemId.quantity"
              },
              purchaseLimit: {
                $first: "$itemId.purchaseLimit"
              },
              name: {
                $first: "$itemId.name"
              },
              size: {
                $first: "$itemId.size"
              },
              unit: {
                $first: "$itemId.unit"
              },
              addOn: {
                $first: "$itemId.addOn"
              },
              additional1: {
                $first: "$itemId.additional1"
              },
              additional2: {
                $first: "$itemId.additional2"
              },
              additional1_ar: {
                $first: "$itemId.additional1_ar"
              },
              additional2_ar: {
                $first: "$itemId.additional2_ar"
              },
              unitValue: {
                $first: "$itemId.unitValue"
              },
              productKey: {
                $first: "$itemId.productKey"
              }
            },
          },
          {
            $sort: {
              count: -1
            }
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
              createdAt: {
                $first: "$createdAt",
              },
              storeTypeId: {
                $first: "$storeTypeId",
              },
              variants: {
                $push: {
                  label: "$$ROOT.label",
                  color: "$$ROOT.color",
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
          }
        ]);

        return done({
          message: multilingualService.getResponseMessage("BEST_SELLING_PRODUCTS_LISTED_SUCCESSFULLY", lang),
          data: bestSellingProducts
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }
  async getFeatures(req,res){
    try{
      const data = req.query
      const moduleKey = req.query.moduleKey
      let distance = Constant.RADIUSCIRCLE;
        if (data.moduleName == "ecommerce") {
          distance = 999999999999999;
        }
      let pipeline = [
        {
          $match:{
              code : "DEAL",
              moduleKey : moduleKey
          }
      },
      {
          $group: {
              _id : {
                  store : "$store"
              },
              count : {$sum : 1}
          }
      },
      {
          $project: {
              storeId : "$_id.store",
              _id:0
          }
      },
      {
          $sort : {count : -1}
      },
      {
          $limit : 3
      },
      {
          $lookup: {
                    from: "stores",
                    localField: "storeId",
                    foreignField: "_id",
                    as: "storeId",
          }
      },
      {
          $unwind:{
              path:"$storeId"
          }
      }
      ]
      const superDeals = await model.promocode.aggregate(pipeline)
      
      for(let i=0;i<superDeals.length;i++){
        superDeals[i] = superDeals[i].storeId
      }
        // also add double deal (buy one get one free) later here

        const freeDelivery = await model.store.find({
          "delivery_charges.isFree" : true
        })
        var d = new Date(new Date().setDate(new Date().getDate()-7))
        const newlyAdded = await model.store.find({
          createdAt : {$gte : d}
        })
        const superSavings = await model.promocode.find({
           code : "DEAL",
           discountType : "Percentage" ,
           discount : { $gte : 50},
           endDate : { $gte : new Date},
           moduelKey : moduleKey
           }).populate('storeId')

        const fastDelivery = await model.store.find({
          avgDeliveryTime : {$lte : 20}
        })
        pipeline = [
          {
              $lookup:{
                  from: "storeitems",
                  localField: "items.itemId",
                  foreignField: "_id",
                  as: "itemId"
              }
          },
          {
              $unwind:{
                  path : "$itemId"
              }
          },
          {
              $lookup:{
                  from: "brands",
                  localField: "itemId.brandId",
                  foreignField: "_id",
                  as: "brands"
              }
          },
          {
              $unwind:{
                  path : "$brands"
              }
          },
          {
              $group:{
                  _id:{
                      brands:"$brands._id"
                  },
                  count : {$sum : 1}
              }
          },
          {
               $sort : {count : -1}
          },
          {
              $limit : 4
          },
          {
              $project:{
                  brands : "$_id.brands",
                  _id : 0
              },
          },
          {
              $lookup:{
                  from: "brands",
                  localField: "brands",
                  foreignField: "_id",
                  as: "brands"
              }
          },
          {
              $unwind:{
                  path : "$brands"
              }
          }
          ]
        const popularBrands = await model.storeOrder.aggregate(pipeline)
        const takeaway = await model.store.find({
          delivery_type :{
            $in : ['TAKEAWAY']
          }
        })
        const delivery = await model.store.find({
          delivery_type :{
            $in : ['DELIVERY']
          }
        })
        const schedule = await model.store.find({
          delivery_type :{
            $in : ['SCHEDULE']
          }
        })
        const dineIn = await model.store.find({
          delivery_type :{
            $in : ['DINEIN']
          }
        })
        const recuring = await model.store.find({
          delivery_type :{
            $in : ['RECURING']
          }
        })
        const driveThru = await model.store.find({
          delivery_type :{
            $in : ['DRIVETHRU']
          }
        })
        const nearBy = await model.store.aggregate([
          {
                    $geoNear: {
                      near: {
                        type: "Point",
                        coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
                      },
                      distanceField: "distance",
                      spherical: true,
                      distanceMultiplier: 1e-3,
                      maxDistance: distance,
                    },
             },
             {
                 $lookup:{
                from: "stores",
                localField: "storeId",
                foreignField: "_id",
                as: "storeId",
              },
             },
             {
                 $unwind:{
                     path:"$storeId"
                 }
             }
          ])
        const popularNearBy = await model.storeOrder.aggregate([
          {
                   $group:{
                      _id:{
                             storeId:"$cartData.storeId"
                          },
                            count : {$sum : 1}
                        }
                    },
                    {
                         $sort : {count : -1}
                    },
                    {
               $lookup:{
                   from: "stores",
                   localField: "_id.storeId",
                   foreignField: "_id",
                   as: "storeId"
               }
          },
          {
               $unwind:{
                   path : "$storeId"
               }
          },
          ]) 
        let data1 = {
          superDeals,
          freeDelivery,
          newlyAdded,
          superSavings,
          fastDelivery,
          popularBrands,
          takeaway,
          delivery,
          schedule,
          dineIn,
          recuring,
          driveThru,
          nearBy,
          popularNearBy
        }
    return multilingualService.sendResponse(
      req,
      res,
      true,
      1,
      0,
      responseMessages.CUSTOMER_SUPPORT_MESSAGE_SEND_SUCCESSFULLY, 
      data1
     )

    }
    catch(err){
      console.log(err.message)
      return multilingualService.sendResponse(
        req,
        res,
        false,
        1,
        0,
        err.message, 
        {}
       )
    }
  }
}


export default userController;
