import model from "../../../models/index";
import Constant from "../../../constant";
const Service = require("../../../services");
import moment from "moment";
import mongoose from "mongoose";
import multilingualService from "../../../services/multilingualService";
import {
  reject
} from "async";
import templateAdmin from "../../../template/template-admin";
import templateRestaurant from "../../../template/template-restaurant";
import templateStore from "../../../template/template-store";
import templateAccountDetail from "../../../template/email";
import MailService from "../../../services/EmailService";
const FCM = require("fcm-node");
const fs = require("fs");
// const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const es = require("event-stream");
import dotenv from "dotenv";
dotenv.config();
require("dotenv").config();
const fcm = new FCM(process.env.FCMSERVERKEY);
import storeAdminController from "./storeAdminController";
import {
  responseMessages
} from "../../controllers/languages/english";

let storeAdminRepo = new storeAdminController();
class adminController {
  addTimeSlot(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        if (!data.slots.length)
          return reject({
            message: "Required",
          });
        await model.TimeSlot.deleteMany({
          storeId: data.storeId,
        });
        let timeSlots = await model.TimeSlot.insertMany({
          timeSlots: data.slots,
          storeId: data.storeId,
        });
        done({
          message: multilingualService.getResponseMessage("ADDMSG", lang),
          data: timeSlots,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  getTimeSlot(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        let timeSlots = await model.TimeSlot.findOne({
            storeId: data.storeId,
          })
          .lean()
          .exec();
        done({
          message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
          data: timeSlots,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  getMerchantDashboardStatusRevPipeline(data, pre, sumField) {
    let pipeline = [];
    if (pre) {
      pipeline.push(pre);
    }
    if (data.startDate && data.endDate) {
      pipeline.push({
        $match: {
          createdAt: {
            $gte: new Date(moment(data.startDate).startOf("day")),
            $lte: new Date(moment(data.endDate).endOf("day")),
          },
        },
      });
    }
    pipeline.push({
      $match: {
        status: {
          $eq: 4,
        },
      },
    });
    if (data.userId) {
      pipeline.push({
        $match: {
          userId: mongoose.Types.ObjectId(data.userId),
        },
      });
    }
    if (data.driverId) {
      pipeline.push({
        $match: {
          driverId: mongoose.Types.ObjectId(data.driverId),
        },
      });
    }
    if (data.storeId) {
      pipeline.push({
        $match: {
          storeId: mongoose.Types.ObjectId(data.storeId),
        },
      });
    }
    pipeline.push({
      $facet: {
        cashSum: [{
            $match: {
              paymentMode: "Cash",
            },
          },
          {
            $group: {
              _id: null,
              count: {
                $sum: 1,
              },
              amount: {
                $sum: sumField,
              },
            },
          },
          {
            $project: {
              _id: 0,
            },
          },
        ],
        walletSum: [{
            $match: {
              paymentMode: 1,
            },
          },
          {
            $group: {
              _id: null,
              count: {
                $sum: 1,
              },
              amount: {
                $sum: sumField,
              },
            },
          },
          {
            $project: {
              _id: 0,
            },
          },
        ],
        onlineSum: [{
            $match: {
              paymentMode: "Online",
            },
          },
          {
            $group: {
              _id: null,
              count: {
                $sum: 1,
              },
              amount: {
                $sum: sumField,
              },
            },
          },
          {
            $project: {
              _id: 0,
            },
          },
        ],
        totalCount: [{
            $group: {
              _id: null,
              total: {
                $sum: 1,
              },
            },
          },
          {
            $project: {
              _id: 0,
            },
          },
        ],
        totalAmt: [{
            $group: {
              _id: null,
              total: {
                $sum: sumField,
              },
            },
          },
          {
            $project: {
              _id: 0,
            },
          },
        ],
      },
    }, {
      $project: {
        payments: 1,
        cash: {
          $arrayElemAt: ["$cashSum", 0],
        },
        online: {
          $arrayElemAt: ["$onlineSum", 0],
        },
        wallet: {
          $arrayElemAt: ["$walletSum", 0],
        },
        totalCount: {
          $arrayElemAt: ["$totalCount", 0],
        },
        totalAmt: {
          $arrayElemAt: ["$totalAmt", 0],
        },
      },
    }, {
      $project: {
        payments: 1,
        cash: 1,
        online: 1,
        wallet: 1,
        totalCount: "$totalCount.total",
        totalAmt: "$totalAmt.total",
      },
    });
    return pipeline;
  }

  getDashboardStatsRev(data) {
    return new Promise(async (done, reject) => {
      let totalRevenueStore = await model.storeOrder.aggregate(this.getMerchantDashboardStatusRevPipeline(data, null, "$merchantCommission"));
      let totalRevenueDriver = await model.storeOrder.aggregate(this.getMerchantDashboardStatusRevPipeline(data, null, "$driverCommission"));
      let totalRevenueUser = await model.user.aggregate(this.getMerchantDashboardStatusRevPipeline(data, null, "$wallet"));
      done({
        data: {
          totalRevenueStore: totalRevenueStore,
          totalRevenueDriver: totalRevenueDriver,
          totalRevenueUser: totalRevenueUser,
        },
      });
    });
  }

  getUserAllOrders(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        const limit = Number(data.limit) || Constant.ADMINLIMIT;
        const page = Math.max(1, Number(data.page) || 0);
        const skip = Math.max(0, page - 1) * limit;
        const sort = {
          createdAt: -1,
        };

        const query = {
          limit,
          page,
          skip,
          search: data.search,
        };
        let filter;
        if (data.status == 0)
          filter = {
            userId: data.userId,
            status: {
              $in: [0],
            },
          };
        else if (data.status == 1)
          filter = {
            userId: data.userId,
            status: {
              $in: [1],
            },
          };
        else if (data.status == 2)
          filter = {
            userId: data.userId,
            status: {
              $in: [2, 3],
            },
          };
        else if (data.status == 11)
          filter = {
            userId: data.userId,
            status: {
              $in: [11, 12],
            },
          };
        else if (data.status == 4)
          filter = {
            userId: data.userId,
            status: {
              $in: [4, 6],
            },
          };
        else
          filter = {
            userId: data.userId,
          };

        const itemCount = await model.storeOrder.countDocuments(filter);
        const pageCount = Math.ceil(itemCount / limit);
        const orderList = await model.storeOrder.find(filter).populate("storeId userId driverId outletId").sort(sort).skip(skip).limit(limit).lean();
        const message =
          orderList.length <= 0 ?
          multilingualService.getResponseMessage("EMPTY_LIST", lang) :
          multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang);

        done({
          message: message,
          data: {
            query,
            orderList,
            itemCount,
            pageCount,
          },
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  getUserOrderCount(lang) {
    return new Promise(async (done, reject) => {
      try {
        let userIds = await model.user.find({}).exec();
        userIds = [].concat(userIds).map((item) => item._id);
        let userOrderDetails = await model.storeOrder.aggregate([{
            $match: {
              userId: {
                $in: userIds,
              },
            },
          },
          {
            $group: {
              _id: "$userId",
              acceptCount: {
                $sum: {
                  $cond: [{
                      $eq: ["$status", 1],
                    },
                    1,
                    0,
                  ],
                },
              },
              completeCount: {
                $sum: {
                  $cond: [{
                      $eq: ["$status", 4],
                    },
                    1,
                    0,
                  ],
                },
              },
              cancelCount: {
                $sum: {
                  $cond: [{
                      $eq: ["$status", 12],
                    },
                    1,
                    0,
                  ],
                },
              },
              allOrderCount: {
                $sum: 1,
              },
            },
          },
        ]);
        done({
          message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
          data: userOrderDetails,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  createSalesPerson(data, lang) {
    return new Promise(async (done, reject) => {
      data.password = data.name.split(" ")[0] + data.phone;

      let emailExist = await model.SalesPerson.findOne({
          email: data.email,
        })
        .lean()
        .exec();
      if (emailExist)
        return reject({
          message: multilingualService.getResponseMessage("EMAILEXISTS", lang),
        });

      let nameExist = await model.SalesPerson.findOne({
          name: data.name,
        })
        .lean()
        .exec();
      if (nameExist)
        return reject({
          message: multilingualService.getResponseMessage("ALREADYEXISTS", lang),
        });
      const password = data.password;
      data.password = await Service.HashService.encrypt(data.password);
      await new model.SalesPerson(data).save();
      // let payload = {
      //   email: data.email,
      //   password: data.password,
      // };
      let msg = await templateAccountDetail.accountDetail({
        email: data.email,
        password: password,
        redirectUrl: process.env.SALESPERSONURL,
      });
      let subject = "Account Details";
      let mailer = await MailService.mailer({
        to: data.email,
        text: msg,
        subject: subject,
      });
      // await Service.EmailService.sendUserPasswordMail(payload);

      done({
        message: multilingualService.getResponseMessage("ADDMSG", lang),
        data: data,
      });
    });
  }

  deleteSalesPerson(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        await model.SalesPerson.findByIdAndDelete(data.id);
        done({
          message: multilingualService.getResponseMessage("DELETEMSG", lang),
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  pay(data, lang) {
    return new Promise(async (done, reject) => {
      if (!data.amount || !data.receiver || !data.id) {
        return reject({
          message: multilingualService.getResponseMessage("PARAMETERMISSING", lang),
        });
      }
      let resp = {};
      let user = await model[data.receiver].findById(data.id);

      if (user.unpaid && user.unpaid >= data.amount) {
        resp = await model[data.receiver].findByIdAndUpdate(
          data.id,

          {
            $inc: {
              unpaid: -1 * data.amount,
              withdrawn: data.amount,
            },
          }, {
            new: true,
          }
        );
        return done({
          data: resp,
        });
      } else
        return reject({
          message: "INVALID AMOUNT",
        });
    });
  }

  getAdminModules(data, lang) {
    return new Promise(async (done, reject) => {
      let result = Constant.MODULES || [];
      done({
        message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
        data: result,
      });
    });
  }

  findLotteryWinner(data, lang) {
    return new Promise(async (done, reject) => {
      let users = await model.user.find({
        ticketsCount: {
          $gt: 0,
        },
      });
      let probablity = [];

      let _sum = await model.user.aggregate([{
          $match: {
            ticketsCount: {
              $gt: 0,
            },
          },
        },
        {
          $group: {
            _id: null,
            sum: {
              $sum: "$ticketsCount",
            },
          },
        },
      ]);
      let {
        sum
      } = _sum[0];
      let start = 0;

      for (let i = 0; i < users.length; i++) {
        probablity.push({
          start: start,
          end: start + users[i].ticketsCount / sum,
          user: users[i]._id.toString(),
        }); // start<=x<end
        start += users[i].ticketsCount / sum;
      }
      let luck = Math.random();
      let winner = "let's see";
      for (let i = 0; i < probablity.length; i++) {
        if (probablity[i].start <= luck && probablity[i].end > luck) {
          winner = probablity[i].user;
          break;
        }
      }
      winner = await model.user.findById(winner);
      done({
        data: winner,
      });
    });
  }

  addAccessModule(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        const accessName = data.accessName || null;
        const access = data.access || null;
        if (!accessName || !access) {
          return reject({
            message: multilingualService.getResponseMessage("PARAMETERMISSING", lang),
          });
        }
        let moduleData = await model.AccessModule.findOne({
          accessName: data.accessName,
          status: {
            $nin: [2],
          },
        });
        if (moduleData)
          return reject({
            message: multilingualService.getResponseMessage("ACCESSNAMEALREADYEXIST", lang),
          });
        let result = await model.AccessModule(data).save();
        done({
          message: multilingualService.getResponseMessage("ADDACCESSMODULE", lang),
          data: {
            result,
          },
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  editAccessModule(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        if (data.accessName) {
          let moduleData = await model.AccessModule.findOne({
            _id: {
              $nin: [mongoose.Types.ObjectId(data.updateId)],
            },
            accessName: data.accessName,
            status: {
              $nin: [2],
            },
          });
          if (moduleData)
            return reject({
              message: multilingualService.getResponseMessage("ACCESSNAMEALREADYEXIST", lang),
            });
        }
        let result = await model.AccessModule.findByIdAndUpdate(data.updateId, data, {
          new: true,
        });
        done({
          message: data.status && data.status == 2 ?
            multilingualService.getResponseMessage("DELETEMSG", lang) :
            multilingualService.getResponseMessage("UPDATEMSG", lang),
          data: result,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  getAccessModule(data, lang) {
    return new Promise(async (done, reject) => {
      let skip = Number(data.page) && Number(data.page) > 1 ? (Number(data.page) - 1) * Constant.ADMINLIMIT : 0;
      let Arr = [{
        status: {
          $ne: 2,
        },
      }, ];
      if (data.accessName && data.accessName != "") {
        Arr.push({
          $or: [{
            accessName: new RegExp(data.accessName, "i"),
          }, ],
        });
      }
      let qry =
        Arr.length == 1 ?
        Arr[0] :
        {
          $and: Arr,
        };
      model.AccessModule.find(qry)
        .skip(skip)
        .sort({
          _id: -1,
        })
        .limit(Constant.ADMINLIMIT)
        .then((result) => {
          model.AccessModule.countDocuments(qry).then((count) => {
            done({
              message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
              data: {
                list: result,
                count: count,
              },
            });
          });
        });
    });
  }

  deleteAccessModule(id, lang) {
    return new Promise(async (done, reject) => {
      await model.AccessModule.findByIdAndUpdate({
        _id: mongoose.Types.ObjectId(id),
      }, {
        $set: {
          _status: 2,
        },
      });

      await model.AccessModule.updateMany({
        accessModuleId: mongoose.Types.ObjectId(id),
      }, {
        $set: {
          accessModuleId: null,
        },
      });

      done({
        message: multilingualService.getResponseMessage("DELETEMSG", lang),
      });
    });
  }

  getAccessModuleId(accessModuleId, lang) {
    return new Promise(async (done, reject) => {
      let result = await model.AccessModule.findById(accessModuleId);
      done({
        message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
        data: result,
      });
    });
  }

  addAdmin(data, file, lang) {
    return new Promise(async (done, reject) => {
      try {
        const email = data.email || null;
        const phone = data.phone || null;
        const countryCode = data.countryCode || null;
        const password = data.password || null;
        if (!email || !password || !phone || !countryCode) {
          return reject({
            message: multilingualService.getResponseMessage("PARAMETERMISSING", lang),
          });
        }

        data.date = moment().valueOf();
        data.hash = await Service.HashService.encrypt(password);
        const adminData = await model.admin(data).save();
        if (!adminData) {
          return reject({
            message: multilingualService.getResponseMessage("FALSEMSG", lang),
          });
        }
        let payload = {
          email: email,
          password: password,
        };
        Service.EmailService.sendUserPasswordMail(payload);
        done({
          message: multilingualService.getResponseMessage("SUCCESS", lang),
          data: {
            adminData,
          },
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  editAdmin(data, file, lang) {
    return new Promise(async (done, reject) => {
      try {
        if (file) data.image = Constant.ADMINIMAGE + file.filename;
        let adminData = await model.admin.findById(data.updateId);
        if (data.password) {
          let payload = {
            email: data.email ? data.email : adminData.email,
            password: data.password,
          };
          Service.EmailService.sendUserPasswordMail(payload);
          data.hash = await Service.HashService.encrypt(data.password);
        }
        let result = await model.admin.findByIdAndUpdate(data.updateId, data, {
          new: true,
        });
        done({
          message: data.status && data.status == 2 ?
            multilingualService.getResponseMessage("DELETEMSG", lang) :
            multilingualService.getResponseMessage("UPDATEMSG", lang),
          data: result,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  getAdmin(data, lang) {
    return new Promise(async (done, reject) => {
      let skip = Number(data.page) && Number(data.page) > 1 ? (Number(data.page) - 1) * Constant.ADMINLIMIT : 0;
      let Arr = [{
        status: {
          $ne: 2,
        },
      }, ];
      if (data.name && data.name != "") {
        Arr.push({
          $or: [{
              firstName: new RegExp(data.name, "i"),
            },
            {
              lastName: new RegExp(data.name, "i"),
            },
          ],
        });
      }
      let qry =
        Arr.length == 1 ?
        Arr[0] :
        {
          $and: Arr,
        };
      model.admin
        .find(qry)
        .skip(skip)
        .sort({
          _id: -1,
        })
        .limit(Constant.ADMINLIMIT)
        .then((result) => {
          model.admin.countDocuments(qry).then((count) => {
            done({
              message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
              data: {
                list: result,
                count: count,
              },
            });
          });
        });
    });
  }

  getAdminId(adminId, lang) {
    return new Promise(async (done, reject) => {
      let result = await model.admin.findById(adminId);
      done({
        message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
        data: result,
      });
    });
  }

  addBanner(data, file, lang, finalFileName) {
    return new Promise(async (done, reject) => {
      try {
        let bannerData = await model.Banner.findOne({
          name: new RegExp("^" + data.name + "$", "i"),
          status: {
            $ne: 2,
          },
        });
        if (bannerData)
          return reject({
            message: multilingualService.getResponseMessage("BANNERNAMEALREADYEXISTS", lang),
          });
        if (finalFileName) data.image = process.env.S3URL + finalFileName;
        let banner = new model.Banner(data);
        await banner.save();
        done({
          message: multilingualService.getResponseMessage("BANNERNADDSUCCESSFULLY", lang),
          data: {},
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  editBanner(data, file, lang, finalFileName) {
    return new Promise(async (done, reject) => {
      try {
        if (data.name) {
          let bannerData = await model.Banner.findOne({
            name: new RegExp("^" + data.name + "$", "i"),
            _id: {
              $ne: data.bannerId,
            },
            status: {
              $ne: 2,
            },
          });
          if (bannerData)
            return reject({
              message: multilingualService.getResponseMessage("BANNERNAMEALREADYEXISTS", lang),
            });
        }

        if (finalFileName) data.image = process.env.S3URL + finalFileName;
        await model.Banner.findByIdAndUpdate(data.bannerId, data, {
          new: true,
        });
        done({
          message: data.status && data.status == 2 ?
            multilingualService.getResponseMessage("DELETEMSG", lang) :
            multilingualService.getResponseMessage("UPDATEMSG", lang),
          data: {},
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  getBanner(data, lang) {
    return new Promise(async (done, reject) => {
      let skip = Number(data.page) && Number(data.page) > 1 ? (Number(data.page) - 1) * Constant.ADMINLIMIT : 0;
      let Arr = [{
        status: {
          $ne: 2,
        },
      }, ];
      if (data.name && data.name != "") {
        Arr.push({
          $or: [{
            firstName: new RegExp(data.name, "i"),
          }, ],
        });
      }
      let qry =
        Arr.length == 1 ?
        Arr[0] :
        {
          $and: Arr,
        };
      await model.Banner.find(qry)
        .skip(skip)
        .sort({
          _id: -1,
        })
        .limit(Constant.ADMINLIMIT)
        .then(async (result) => {
          await model.Banner.countDocuments(qry).then((count) => {
            done({
              message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
              data: {
                list: result,
                count: count,
              },
            });
          });
        });
    });
  }

  getBannerId(bannerId, lang) {
    return new Promise(async (done, reject) => {
      let result = await model.Banner.findById(bannerId);
      done({
        message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
        data: result,
      });
    });
  }

  register(data, file, lang) {
    return new Promise(async (done, reject) => {
      let user = this.createAdmin(data);
      user.authToken = await Service.JwtService.issue({
        _id: user._id,
      });

      user
        .save()
        .then((result) => {
          done({
            message: "",
            data: result,
          });
        })
        .catch((err) => {
          if (err.errors)
            return reject({
              message: Service.Handler.mongoErrorHandler(err),
            });

          return reject({
            message: multilingualService.getResponseMessage("FALSEMSG", lang),
          });
        });
    });
  }

  createAdmin(data, file) {
    let user = new model.admin({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      countryCode: data.countryCode,
      phone: data.phone,
      role: data.role,
      date: moment().valueOf(),
    });

    if (data.password) user.hash = Service.HashService.encrypt(data.password);
    if (file) user.profilePic = Constant.userImage + file.filename;
    return user;
  }

  login(data, lang) {
    return new Promise(async (done, reject) => {
      let qry = {};
      qry.email = data.email.toLowerCase();
      console.log("Inside Login");
      let salesPerson = await model.SalesPerson.findOne({
        email: data.email,
      });
      if (salesPerson) {
        let data = Object.assign({}, salesPerson);
        data.role = "sp";
        if (Service.HashService.decrypt(salesPerson.password) !== data.password)
          return reject({
            message: multilingualService.getResponseMessage("INVALIDPARAMS", lang),
          });

        let update = {
          authToken: Service.JwtService.issue({
            _id: salesPerson._id,
          }),
        };
        await model.salesPerson
          .findByIdAndUpdate(salesPerson._id, update, {
            new: true,
          })
          .select("+authToken")
          .then((result) => {
            done({
              data: result,
            });
          })
          .catch((err) => {
            reject({
              message: multilingualService.getResponseMessage("ERRMSG", lang),
            });
          });
      }

      let gfSubAdmin = await model.subAdmin
        .findOne({
          email: qry.email,
        })
        .select("password");
      if (gfSubAdmin) {
        if (Service.HashService.decrypt(gfSubAdmin.password) !== data.password)
          return reject({
            message: multilingualService.getResponseMessage("INVALIDPARAMS", lang),
          });

        let update = {
          authToken: Service.JwtService.issue({
            _id: gfSubAdmin._id,
          }),
        };
        await model.subAdmin
          .findByIdAndUpdate(gfSubAdmin._id, update, {
            new: true,
          })
          .select("+authToken")
          .then((result) => {
            done({
              data: result,
            });
          })
          .catch((err) => {
            reject({
              message: multilingualService.getResponseMessage("ERRMSG", lang),
            });
          });
      }

      let SubAdmin2 = await model.SubAdmin2.findOne({
        email: qry.email,
      });
      if (SubAdmin2) {
        if (Service.HashService.decrypt(SubAdmin2.password) !== data.password)
          return reject({
            message: multilingualService.getResponseMessage("INVALIDPARAMS", lang),
          });
        let update = {
          authToken: Service.JwtService.issue({
            _id: SubAdmin2._id,
          }),
        };
        await model.SubAdmin2.findByIdAndUpdate(SubAdmin2._id, update, {
            new: true,
          })
          .then((result) => {
            done({
              data: result,
            });
          })
          .catch((err) => {
            reject({
              message: multilingualService.getResponseMessage("ERRMSG", lang),
            });
          });
      }
      await model.admin.findOne({
          email: qry.email,
        })
        .select("+hash")
        .then(async (user) => {
          if (!user || Service.HashService.decrypt(user.hash) !== data.password)
            return reject({
              message: multilingualService.getResponseMessage("INVALIDPARAMS", lang),
            });
            
          let update = {
            authToken: Service.JwtService.issue({
              _id: user._id,
            }),
          };
          await model.admin
            .findByIdAndUpdate(user._id, update, {
              new: true,
            })
            .select("+authToken")
            .then((result) => {
              done({
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

  panelLogin(data, lang) {
    return new Promise((done, reject) => {
      let qry = {
        email: data.email.toLowerCase(),
      };
      let qryModel;
      if (data.verticalType === 0) {
        qryModel = model.restaurant.findOne(qry).select("+hash +authToken");
      } else if (data.verticalType === 1) {
        qryModel = model.store
          .findOneAndUpdate(qry, {
            deviceId: data.deviceId,
          })
          .select("+hash +authToken");
      } else if (data.verticalType === 3) {
        qryModel = model.vender.findOne(qry).select("+hash +authToken");
      }

      qryModel
        .then((user) => {
          if (!user || Service.HashService.decrypt(user.hash) !== data.password)
            return reject({
              message: multilingualService.getResponseMessage("INVALIDPARAMS", lang),
            });

          done({
            data: user
          });
        })
        .catch((err) => {
          reject({
            message: multilingualService.getResponseMessage("ERRMSG", lang),
          });
        });
    });
  }

  adminChangePassword(data, lang) {
    return new Promise((done, reject) => {
      let qryModel;

      qryModel = model.admin.findById(data.id).select("hash");

      qryModel
        .then((user) => {
          if (Service.HashService.decrypt(user.hash) !== data.oldPassword)
            return reject({
              message: multilingualService.getResponseMessage("OLDPASSMSG", lang),
            });

          if (Service.HashService.decrypt(user.hash) == data.newPassword)
            return reject({
              message: multilingualService.getResponseMessage("NEWPASSSAME", lang),
            });

          if (data.newPassword) user.hash = Service.HashService.encrypt(data.newPassword);
          qryModel = model.admin.findByIdAndUpdate(data.id, user, {
            new: true,
          });
          qryModel.then((result) => {
            done({
              message: multilingualService.getResponseMessage("UPDATEMSG", lang),
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

  getAdminProfile(id, lang) {
    return new Promise((done, reject) => {
      model.admin.findById(id).then((result) => {
        done({
          data: result,
        });
      });
    });
  }

  editAdminProfile(data, files, lang, finalFileName) {
    return new Promise((done, reject) => {
      //  if (finalFileName) data.image = process.env.S3URL + finalFileName;

      for (let item in files) {
        data[item] = process.env.S3URL + files[item][0].key;
      }
      model.admin
        .findByIdAndUpdate({
            _id: mongoose.Types.ObjectId(data.updateId),
          },
          data, {
            new: true,
          }
        )
        .then((result) => {
          done({
            message: multilingualService.getResponseMessage("UPDATEMSG", lang),
            data: result,
          });
        })
        .catch((err) => {
          return reject({
            message: multilingualService.getResponseMessage("FALSEMSG", lang),
          });
        });
    });
  }
  panelChangePassword(data, lang) {
    return new Promise((done, reject) => {
      let qryModel;

      if (data.verticalType === 0) {
        qryModel = model.restaurant.findById(data.id).select("hash");
      } else if (data.verticalType === 1) {
        qryModel = model.store.findById(data.id).select("hash");
      } else if (data.verticalType === 3) {
        qryModel = model.vender.findById(data.id).select("hash");
      }

      qryModel
        .then(async (user) => {
          if ((await Service.HashService.decrypt(user.hash)) !== data.oldPassword)
            return reject({
              message: "Old Password is incorrect",
            });

          if ((await Service.HashService.decrypt(user.hash)) == data.newPassword)
            return reject({
              message: "New Password Should Not Be Same As Old",
            });

          if (data.newPassword) user.hash = await Service.HashService.encrypt(data.newPassword);

          if (data.verticalType === 0) {
            qryModel = model.restaurant.findByIdAndUpdate(data.id, user, {
              new: true,
            });
          } else if (data.verticalType === 1) {
            qryModel = model.store.findByIdAndUpdate(data.id, user, {
              new: true,
            });
          } else if (data.verticalType === 3) {
            qryModel = model.vender.findByIdAndUpdate(data.id, user, {
              new: true,
            });
          }
          qryModel.then((result) => {
            done({
              message: multilingualService.getResponseMessage("PASSWORDUPDATEDSUCCESSFULLY", lang),
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

  async addPromoCode(req, res, next) {
    try {
      const data = req.body;
      if(data.startDate){
        data.startDate = moment(data.startDate).add(1,'day').startOf('day')
      }
      if(data.endDate){
        data.endDate = moment(data.endDate).endOf('day')
      }
      const lang = req.headers.language || "en";
      const geofenceId = req.headers.geofenceid;
      if (data.brandId && data.brandId.length) data.isBrand = true;
      if (data.userId && data.userId.length) data.isUser = true;
      if (data.storeId && data.storeId.length) {
        data.isStore = true
        data.storeIds = data.storeId
      }
      if (data.productId && data.productId.length) data.isProduct = true;
      if (data.categoryId && data.categoryId.length) data.isCategory = true;
      if (data.subCategoryId && data.subCategoryId.length) data.isSubCategory = true;

      // if (file) data.image = Constant.PROMOCODEIMAGE + file.filename;
      // data.image = process.env.S3URL + finalFileName;
      if (geofenceId != "NA") data.geofenceId = geofenceId;
      let flag = 0;
      if (data.deal == true || data.deal == "true") {
        if (data.itemId && data.itemId.length > 0 && flag == 0) {
          for (const itemId of data.itemId) {
            if (flag == 0) {
              let existPromo = await model.promocode.find({
                store: mongoose.Types.ObjectId(data.store),
                endDate: {
                  $gte: new Date(moment().startOf("date")),
                },
                itemId: {
                  $in: mongoose.Types.ObjectId(itemId),
                },
              });
              if (existPromo.length > 0) {
                flag = 1;
                return res.send({
                  response: {
                    status: 200,
                    success: false,
                    message: multilingualService.getResponseMessage("DEAL_ALREADY_APPLIED_ON_ITEM", lang),
                  },
                });
              } else {
                const item = await model.storeItem.findById(itemId, {
                  storeItemTypeId: 1,
                  storeItemSubTypeId: 1,
                  brandId: 1,
                });
                let checkExist = await model.promocode.findOne({
                  store: mongoose.Types.ObjectId(data.store),
                  endDate: {
                    $gte: new Date(moment().startOf("date")),
                  },
                  $or: [{
                      categoryId: mongoose.Types.ObjectId(item.storeItemTypeId),
                    },
                    {
                      subCategoryId: mongoose.Types.ObjectId(item.storeItemSubTypeId),
                    },
                    {
                      brandId: mongoose.Types.ObjectId(item.brandId),
                    },
                  ],
                });
                if (checkExist != null) {
                  flag = 1;
                  return res.send({
                    response: {
                      status: 200,
                      success: false,
                      message: multilingualService.getResponseMessage("DEAL_ALREADY_APPLIED_ON_ITEM", lang),
                    },
                  });
                }
              }
            }
          }
        }
        if (data.categoryId && data.categoryId.length > 0 && flag == 0) {
          for (const catId of data.categoryId) {
            if (flag == 0) {
              let existPromo = await model.promocode.findOne({
                store: mongoose.Types.ObjectId(data.store),
                endDate: {
                  $gte: new Date(moment().startOf("date")),
                },
                categoryId: mongoose.Types.ObjectId(catId),
              });
              if (existPromo) {
                return res.send({
                  response: {
                    status: 200,
                    success: false,
                    message: multilingualService.getResponseMessage("DEAL_ALREADY_APPLIED_ON_ITEM", lang),
                  },
                });
              } else {
                const items = await model.storeItem.find({
                  storeItemTypeId: mongoose.Types.ObjectId(catId),
                });
                for (const item of items) {
                  let existPromo = await model.promocode.findOne({
                    store: mongoose.Types.ObjectId(data.store),
                    endDate: {
                      $gte: new Date(moment().startOf("date")),
                    },
                    $or: [{
                        subCategoryId: item.storeItemSubTypeId
                      },
                      {
                        brandId: item.brandId
                      },
                      {
                        itemId: item._id
                      },
                    ],
                  });
                  if (existPromo) {
                    return res.send({
                      response: {
                        status: 200,
                        success: false,
                        message: multilingualService.getResponseMessage("DEAL_ALREADY_APPLIED_ON_ITEM", lang),
                      },
                    });
                  }
                }
              }
            }
          }
        }
        if (data.subCategoryId && data.subCategoryId.length > 0 && flag == 0) {
          for (const subCategoryId of data.subCategoryId) {
            if (flag == 0) {
              let existPromo = await model.promocode.findOne({
                store: mongoose.Types.ObjectId(data.store),
                endDate: {
                  $gte: new Date(moment().startOf("date")),
                },
                subCategoryId: mongoose.Types.ObjectId(subCategoryId)
              });
              if (existPromo) {
                return res.send({
                  response: {
                    status: 200,
                    success: false,
                    message: multilingualService.getResponseMessage("DEAL_ALREADY_APPLIED_ON_ITEM", lang),
                  },
                });
              } else {
                const items = await model.storeItem.find({
                  storeItemSubTypeId: mongoose.Types.ObjectId(subCategoryId),
                });
                for (const item of items) {
                  let existPromo = await model.promocode.findOne({
                    store: mongoose.Types.ObjectId(data.store),
                    endDate: {
                      $gte: new Date(moment().startOf("date")),
                    },
                    $or: [{
                        categoryId: mongoose.Types.ObjectId(item.storeItemTypeId)
                      },
                      {
                        brandId: item.brandId
                      },
                      {
                        itemId: item._id
                      },
                    ],
                  });
                  if (existPromo) {
                    return res.send({
                      response: {
                        status: 200,
                        success: false,
                        message: multilingualService.getResponseMessage("DEAL_ALREADY_APPLIED_ON_ITEM", lang),
                      },
                    });
                  }
                }
              }
            }
          }
        }
        if (data.brandId && data.brandId.length > 0 && flag == 0) {
          for (const brandId of data.brandId) {
            if (flag == 0) {
              let existPromo = await model.promocode.findOne({
                store: mongoose.Types.ObjectId(data.store),
                endDate: {
                  $gte: new Date(moment().startOf("date")),
                },
                brandId: mongoose.Types.ObjectId(brandId)
              });
              if (existPromo) {
                return res.send({
                  response: {
                    status: 200,
                    success: false,
                    message: multilingualService.getResponseMessage("DEAL_ALREADY_APPLIED_ON_ITEM", lang),
                  },
                });
              }
              const items = await model.storeItem.distinct("_id", {
                brandId: mongoose.Types.ObjectId(brandId),
                storeId: mongoose.Types.ObjectId(data.store)
              })
              for (const itemId of items) {
                let existPromo = await model.promocode.findOne({
                  store: mongoose.Types.ObjectId(data.store),
                  endDate: {
                    $gte: new Date(moment().startOf("date")),
                  },
                  itemId: mongoose.Types.ObjectId(itemId)
                });
                if (existPromo) {
                  return res.send({
                    response: {
                      status: 200,
                      success: false,
                      message: multilingualService.getResponseMessage("DEAL_ALREADY_APPLIED_ON_ITEM", lang),
                    },
                  });
                }
                const item = await model.storeItem.findById(itemId);
                existPromo = await model.promocode.findOne({
                  store: mongoose.Types.ObjectId(data.store),
                  endDate: {
                    $gte: new Date(moment().startOf("date")),
                  },
                  $or: [{
                      categoryId: item.storeItemTypeId
                    },
                    {
                      subCategoryId: item.storeItemSubTypeId
                    },
                  ],
                });
                if (existPromo) {
                  return res.send({
                    response: {
                      status: 200,
                      success: false,
                      message: multilingualService.getResponseMessage("DEAL_ALREADY_APPLIED_ON_ITEM", lang),
                    },
                  });
                }
              }
            }
          }
        }
      }
      let dealExist = await model.promocode.findOne({
        name: {
          $regex: data.name,
          $options: "i",
        },
      });
      if (dealExist && flag == 0) {
        return res.send({
          response: {
            status: 200,
            success: false,
            message: multilingualService.getResponseMessage("DEAL_ALREADY_EXIST_WITH_SAME_NAME", lang),
          },
        });
      }
      let result = await model.promocode(data).save();
      if (result.code == "DEAL") {
        if (result.isProduct) {
          await model.storeItem.updateMany({
            _id: {
              $in: result.itemId,
            },
          }, {
            $set: {
              discount: result.discount,
              discountType: result.discountType,
              // dealAppliedBy: "admin",
            },
          });
          let clones = await model.storeItem
            .find({
              productKey: {
                $in: result.productId,
              },
            })
            .lean();
          for (let i = 0; i < clones.length; i++) {
            let item = storeAdminRepo.calculatingTaxAndDiscount(clones[i]);
            await model.storeItem.findByIdAndUpdate(item._id, item);
          }
        }
        if (result.isCategory) {
          let qry = {
            storeItemTypeId: {
              $in: result.categoryId,
            },
            storeId: result.store,
          }
          const itemIds = await model.storeItem.find(qry).distinct('_id')
          await model.storeItem.updateMany({
            _id: {
              $in: itemIds,
            },
          }, {
            $set: {
              discount: result.discount,
              discountType: result.discountType,
              // dealAppliedBy: "admin",
            },
          });
          let clones = await model.storeItem.find({
              productKey: {
                $in: result.productId,
              },
            })
            .lean();
          for (let i = 0; i < clones.length; i++) {
            let item = storeAdminRepo.calculatingTaxAndDiscount(clones[i]);
            await model.storeItem.findByIdAndUpdate(item._id, item);
          }
        }
        if (result.isSubCategory) {
          const itemIds = await model.storeItem.find({
            storeItemSubTypeId: {
              $in: result.subCategoryId,
            },
            storeId: result.store,
          }).distinct("_id");

          await model.storeItem.updateMany({
            _id: {
              $in: itemIds,
            },
          }, {
            $set: {
              discount: result.discount,
              discountType: result.discountType,
              // dealAppliedBy: "admin",
            },
          });
          let clones = await model.storeItem
            .find({
              productKey: {
                $in: result.productId,
              },
            })
            .lean();
          for (let i = 0; i < clones.length; i++) {
            let item = storeAdminRepo.calculatingTaxAndDiscount(clones[i]);
            await model.storeItem.findByIdAndUpdate(item._id, item);
          }
        }
        if (result.isBrand) {
          const itemIds = await model.storeItem.find({
            brandId: {
              $in: result.brandId,
            },
            storeId: result.store,
          }).distinct('_id');

          await model.storeItem.updateMany({
            _id: {
              $in: itemIds,
            },
          }, {
            $set: {
              discount: result.discount,
              discountType: result.discountType,
              // dealAppliedBy: "admin",
            },
          });
          let clones = await model.storeItem
            .find({
              productKey: {
                $in: result.productId,
              },
            })
            .lean();
          for (let i = 0; i < clones.length; i++) {
            let item = storeAdminRepo.calculatingTaxAndDiscount(clones[i]);
            await model.storeItem.findByIdAndUpdate(item._id, item);
          }
        }
      }
      return res.send({
        response: {
          status: 200,
          success: true,
          message: multilingualService.getResponseMessage("ADDMSG", lang),
        },
        data: result,
      });
    } catch (error) {
      console.log(error.message, error)
    }
    // return new Promise(async (done, reject) => {

  }

  async editPromoCode(req, res, next) {
    try {
      const data = req.body;
      const lang = req.headers.language || "en";
      if (data.brandId && data.brandId.length) {
        data.isBrand = true;
        data.isUser = false;
        data.isStore = false;
        data.isProduct = false;
        data.isCategory = false;
        data.isSubCategory = false;
      }
      if (data.userId && data.userId.length) {
        data.isBrand = false;
        data.isUser = true;
        data.isStore = false;
        data.isProduct = false;
        data.isCategory = false;
        data.isSubCategory = false;
      }
      if (data.storeId && data.storeId.length) {
        data.isBrand = false;
        data.isUser = false;
        data.isStore = true;
        data.isProduct = false;
        data.isCategory = false;
        data.isSubCategory = false;
        data.storeIds = data.storeId
      }
      if (data.productId && data.productId.length) {
        data.isBrand = false;
        data.isUser = false;
        data.isStore = false;
        data.isProduct = true;
        data.isCategory = false;
        data.isSubCategory = false;
      }
      if (data.categoryId && data.categoryId.length) {
        data.isBrand = false;
        data.isUser = false;
        data.isStore = false;
        data.isProduct = false;
        data.isCategory = true;
        data.isSubCategory = false;
      }
      if (data.subCategoryId && data.subCategoryId.length) {
        data.isBrand = false;
        data.isUser = false;
        data.isStore = false;
        data.isProduct = false;
        data.isCategory = false;
        data.isSubCategory = true;
      }
      if(data.startDate){
        data.startDate = moment(data.startDate).add(1,'day').startOf('day')
      }
      if(data.endDate){
        data.endDate = moment(data.endDate).endOf('day')
      }
      let flag = 0;
      if (data.deal == true || data.deal == "true") {
        if (data.itemId && data.itemId.length > 0 && flag == 0) {
          for (const itemId of data.itemId) {
            if (flag == 0) {
              let existPromo = await model.promocode.find({
                _id: {
                  $ne: mongoose.Types.ObjectId(data.updateId)
                },
                store: mongoose.Types.ObjectId(data.store),
                endDate: {
                  $gte: new Date(moment().startOf("date")),
                },
                itemId: mongoose.Types.ObjectId(itemId)
              });
              if (existPromo.length > 0) {
                flag = 1;
                return res.send({
                  response: {
                    status: 200,
                    success: false,
                    message: multilingualService.getResponseMessage("DEAL_ALREADY_APPLIED_ON_ITEM", lang),
                  },
                });
              } else {
                const item = await model.storeItem.findById(itemId, {
                  storeItemTypeId: 1,
                  storeItemSubTypeId: 1,
                  brandId: 1,
                });
                let checkExist = await model.promocode.findOne({
                  _id: {
                    $ne: mongoose.Types.ObjectId(data.updateId)
                  },
                  store: mongoose.Types.ObjectId(data.store),
                  endDate: {
                    $gte: new Date(moment().startOf("date")),
                  },
                  $or: [{
                      categoryId: mongoose.Types.ObjectId(item.storeItemTypeId),
                    },
                    {
                      subCategoryId: mongoose.Types.ObjectId(item.storeItemSubTypeId),
                    },
                    {
                      brandId: mongoose.Types.ObjectId(item.brandId),
                    },
                  ],
                });
                if (checkExist != null) {
                  flag = 1;
                  return res.send({
                    response: {
                      status: 200,
                      success: false,
                      message: multilingualService.getResponseMessage("DEAL_ALREADY_APPLIED_ON_ITEM", lang),
                    },
                  });
                }
              }
            }
          }
        }
        if (data.categoryId && data.categoryId.length > 0 && flag == 0) {
          for (const catId of data.categoryId) {
            if (flag == 0) {
              let existPromo = await model.promocode.findOne({
                _id: {
                  $ne: mongoose.Types.ObjectId(data.updateId)
                },
                store: mongoose.Types.ObjectId(data.store),
                endDate: {
                  $gte: new Date(moment().startOf("date")),
                },
                categoryId: mongoose.Types.ObjectId(catId),
              });
              if (existPromo) {
                return res.send({
                  response: {
                    status: 200,
                    success: false,
                    message: multilingualService.getResponseMessage("DEAL_ALREADY_APPLIED_ON_ITEM", lang),
                  },
                });
              } else {
                const items = await model.storeItem.find({
                  storeItemTypeId: mongoose.Types.ObjectId(catId),
                });
                for (const item of items) {
                  let existPromo = await model.promocode.findOne({
                    _id: {
                      $ne: mongoose.Types.ObjectId(data.updateId)
                    },
                    store: mongoose.Types.ObjectId(data.store),
                    endDate: {
                      $gte: new Date(moment().startOf("date")),
                    },
                    $or: [{
                        subCategoryId: item.storeItemSubTypeId
                      },
                      {
                        brandId: item.brandId
                      },
                      {
                        itemId: item._id
                      },
                    ],
                  });
                  if (existPromo) {
                    return res.send({
                      response: {
                        status: 200,
                        success: false,
                        message: multilingualService.getResponseMessage("DEAL_ALREADY_APPLIED_ON_ITEM", lang),
                      },
                    });
                  }
                }
              }
            }
          }
        }
        if (data.subCategoryId && data.subCategoryId.length > 0 && flag == 0) {
          for (const subCategoryId of data.subCategoryId) {
            if (flag == 0) {
              let existPromo = await model.promocode.findOne({
                _id: {
                  $ne: mongoose.Types.ObjectId(data.updateId)
                },
                store: mongoose.Types.ObjectId(data.store),
                endDate: {
                  $gte: new Date(moment().startOf("date")),
                },
                subCategoryId: mongoose.Types.ObjectId(subCategoryId)
              });
              if (existPromo) {
                flag = 1;
                return res.send({
                  response: {
                    status: 200,
                    success: false,
                    message: multilingualService.getResponseMessage("DEAL_ALREADY_APPLIED_ON_ITEM", lang),
                  },
                });
              } else {
                const items = await model.storeItem.find({
                  storeItemSubTypeId: mongoose.Types.ObjectId(subCategoryId),
                });
                for (const item of items) {
                  let existPromo = await model.promocode.findOne({
                    _id: {
                      $ne: mongoose.Types.ObjectId(data.updateId)
                    },
                    store: mongoose.Types.ObjectId(data.store),
                    endDate: {
                      $gte: new Date(moment().startOf("date")),
                    },
                    $or: [{
                        categoryId: mongoose.Types.ObjectId(item.storeItemTypeId)
                      },
                      {
                        brandId: item.brandId
                      },
                      {
                        itemId: item._id
                      },
                    ],
                  });
                  if (existPromo) {
                    flag = 1;
                    return res.send({
                      response: {
                        status: 200,
                        success: false,
                        message: multilingualService.getResponseMessage("DEAL_ALREADY_APPLIED_ON_ITEM", lang),
                      },
                    });
                  }
                }
              }
            }
          }
        }
        if (data.brandId && data.brandId.length > 0 && flag == 0) {
          for (const brandId of data.brandId) {
            if (flag == 0) {
              let existPromo = await model.promocode.findOne({
                _id: {
                  $ne: mongoose.Types.ObjectId(data.updateId)
                },
                store: mongoose.Types.ObjectId(data.store),
                endDate: {
                  $gte: new Date(moment().startOf("date")),
                },
                brandId: mongoose.Types.ObjectId(brandId)
              });
              if (existPromo) {
                flag = 1;
                return res.send({
                  response: {
                    status: 200,
                    success: false,
                    message: multilingualService.getResponseMessage("DEAL_ALREADY_APPLIED_ON_ITEM", lang),
                  },
                });
              }
              const items = await model.storeItem.distinct("_id", {
                brandId: mongoose.Types.ObjectId(brandId),
                storeId: mongoose.Types.ObjectId(data.store)
              })
              for (const itemId of items) {
                let existPromo = await model.promocode.findOne({
                  _id: {
                    $ne: mongoose.Types.ObjectId(data.updateId)
                  },
                  store: mongoose.Types.ObjectId(data.store),
                  endDate: {
                    $gte: new Date(moment().startOf("date")),
                  },
                  itemId: mongoose.Types.ObjectId(itemId)
                });
                if (existPromo) {
                  return res.send({
                    response: {
                      status: 200,
                      success: false,
                      message: multilingualService.getResponseMessage("DEAL_ALREADY_APPLIED_ON_ITEM", lang),
                    },
                  });
                }
                const item = await model.storeItem.findById(itemId);
                existPromo = await model.promocode.findOne({
                  _id: {
                    $ne: mongoose.Types.ObjectId(data.updateId)
                  },
                  store: mongoose.Types.ObjectId(data.store),
                  endDate: {
                    $gte: new Date(moment().startOf("date")),
                  },
                  $or: [{
                      categoryId: item.storeItemTypeId
                    },
                    {
                      subCategoryId: item.storeItemSubTypeId
                    },
                  ],
                });
                if (existPromo) {
                  return res.send({
                    response: {
                      status: 200,
                      success: false,
                      message: multilingualService.getResponseMessage("DEAL_ALREADY_APPLIED_ON_ITEM", lang),
                    },
                  });
                }
              }
            }
          }
        }
      }
      let oldData = await model.promocode.findOne({
        _id: mongoose.Types.ObjectId(data.updateId)
      });
      if (oldData != null && oldData.code == "DEAL") {
        if (oldData.isProduct) {
          await model.storeItem.updateMany({
            _id: {
              $in: oldData.itemId,
            },
            isProto: true,
          }, {
            $set: {
              discount: oldData.discount,
              discountType: oldData.discountType
            },
          });
        }

        if (oldData.isCategory) {
          const itemIds = await model.storeItem.find({
            storeItemTypeId: {
              $in: oldData.storeItemTypeId,
            },
            storeId: oldData.store,
          }).distinct('_id');

          await model.storeItem.updateMany({
            _id: {
              $in: itemIds,
            },
            isProto: true,
          }, {
            $set: {
              discount: oldData.discount,
              discountType: oldData.discountType,
              // areClonesUpdated: false,                       
              // dealAppliedBy: "none",
            },
          });
        }

        if (oldData.isSubCategory) {
          const itemIds = await model.storeItem.find({
            storeItemSubTypeId: {
              $in: oldData.subCategoryId,
            },
            storeId: oldData.store,
          }).distinct('_id');

          await model.storeItem.updateMany({
            _id: {
              $in: itemIds,
            },
            isProto: true,
          }, {
            $set: {
              discount: oldData.discount,
              discountType: oldData.discountType,
              // areClonesUpdated: false,                       
              // dealAppliedBy: "none",
            },
          });
        }

        if (oldData.isBrand) {
          const itemIds = await model.storeItem.find({
            brandId: {
              $in: oldData.brandId,
            },
            storeId: oldData.store,
          }).distinct('_id');

          await model.storeItem.updateMany({
            _id: {
              $in: itemIds,
            },
            isProto: true,
          }, {
            $set: {
              discount: oldData.discount,
              discountType: oldData.discountType,
              // areClonesUpdated: false,                       
              // dealAppliedBy: "none",
            },
          });
        }
      }
      const result = await model.promocode.findByIdAndUpdate(data.updateId, data, {
        new: true
      })
      if (result.code == "DEAL") {
        if (result.isProduct) {
          await model.storeItem.updateMany({
            _id: {
              $in: result.itemId,
            },
          }, {
            $set: {
              discount: result.discount,
              discountType: result.discountType,
              // dealAppliedBy: "admin",
            },
          });
          let clones = await model.storeItem
            .find({
              productKey: {
                $in: result.productId,
              },
            })
            .lean();
          for (let i = 0; i < clones.length; i++) {
            let item = storeAdminRepo.calculatingTaxAndDiscount(clones[i]);
            await model.storeItem.findByIdAndUpdate(item._id, item);
          }
        }
        if (result.isCategory) {
          let qry = {
            storeItemTypeId: {
              $in: result.categoryId,
            },
            storeId: result.store,
          }
          const itemIds = await model.storeItem.find(qry).distinct('_id')
          await model.storeItem.updateMany({
            _id: {
              $in: itemIds,
            },
          }, {
            $set: {
              discount: result.discount,
              discountType: result.discountType,
              // dealAppliedBy: "admin",
            },
          });
          let clones = await model.storeItem.find({
              productKey: {
                $in: result.productId,
              },
            })
            .lean();
          for (let i = 0; i < clones.length; i++) {
            let item = storeAdminRepo.calculatingTaxAndDiscount(clones[i]);
            await model.storeItem.findByIdAndUpdate(item._id, item);
          }
        }
        if (result.isSubCategory) {
          const itemIds = await model.storeItem.find({
            storeItemSubTypeId: {
              $in: result.subCategoryId,
            },
            storeId: result.store,
          }).distinct("_id");

          await model.storeItem.updateMany({
            _id: {
              $in: itemIds,
            },
          }, {
            $set: {
              discount: result.discount,
              discountType: result.discountType,
              // dealAppliedBy: "admin",
            },
          });
          let clones = await model.storeItem
            .find({
              productKey: {
                $in: result.productId,
              },
            })
            .lean();
          for (let i = 0; i < clones.length; i++) {
            let item = storeAdminRepo.calculatingTaxAndDiscount(clones[i]);
            await model.storeItem.findByIdAndUpdate(item._id, item);
          }
        }
        if (result.isBrand) {
          const itemIds = await model.storeItem.find({
            brandId: {
              $in: result.brandId,
            },
            storeId: result.store,
          }).distinct('_id');

          await model.storeItem.updateMany({
            _id: {
              $in: itemIds,
            },
          }, {
            $set: {
              discount: result.discount,
              discountType: result.discountType,
              // dealAppliedBy: "admin",
            },
          });
          let clones = await model.storeItem
            .find({
              productKey: {
                $in: result.productId,
              },
            })
            .lean();
          for (let i = 0; i < clones.length; i++) {
            let item = storeAdminRepo.calculatingTaxAndDiscount(clones[i]);
            await model.storeItem.findByIdAndUpdate(item._id, item);
          }
        }
      }
      if (data.status === 2) {
        return res.send({
          response: {
            status: 200,
            success: true,
            message: multilingualService.getResponseMessage("DELETEMSG", lang),
          },
          data: result,
        });
      }
      if (data.status === 1) {
        return res.send({
          response: {
            status: 200,
            success: true,
            message: multilingualService.getResponseMessage("UPDATEMSG", lang),
          },
          data: result,
        });
      }
      if (data.status === 3) {
        return res.send({
          response: {
            status: 200,
            success: true,
            message: multilingualService.getResponseMessage("ACTIVEPROMO", lang),
          },
          data: result,
        });
      }
      if (data.status === 0) {
        return res.send({
          response: {
            status: 200,
            success: true,
            message: multilingualService.getResponseMessage("INACTIVEPROMO", lang),
          },
          data: result,
        });
      }
      return res.send({
        response: {
          status: 200,
          success: true,
          message: multilingualService.getResponseMessage("UPDATEMSG", lang),
        },
        data: result,
      });
    } catch (error) {
      console.log(error)
    }
  }

  getPromoCode(data, lang, geofenceId) {
    return new Promise(async (done, reject) => {
      try {
        const limit = Number(data.limit) || Constant.ADMINLIMIT;
        const page = Math.max(1, Number(data.page) || 0);
        const skip = Math.max(0, page - 1) * limit;
        // const sort = { _id: -1 };
        let filter = {
          status: {
            $ne: 2,
          },
        };
        if (data.isGeofenceActive && (data.isGeofenceActive == true || data.isGeofenceActive == "true")) {
          const geofenceData = await this.findGeofenceId(data.longitude, data.latitude);
          if (geofenceData != null) {
            geofenceId = geofenceData._id;
          }
        } else if (data.latitude && data.longitude) {
          const stores = await model.storeOutlet
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
            .select("storeId");
          filter.storeId = {
            $in: stores,
          };
        }
        const query = {
          limit,
          page,
          skip,
          search: data.search,
        };
        if (data.deals) filter["code"] = "DEAL";
        else
          filter["code"] = {
            $ne: "DEAL",
          };
        if (data.search) {
          const regex = {
            $regex: `${data.search}`,
            $options: "i",
          };
          filter.$or = [{
              code: regex,
            },
            {
              name: regex,
            },
          ];
        }
        if (geofenceId != "NA") filter.geofenceId = mongoose.Types.ObjectId(geofenceId);

        const itemCount = await model.promocode.countDocuments(filter);
        const pageCount = Math.ceil(itemCount / limit);
        const promoList = await model.promocode.aggregate([{
            $match: filter,
          },
          {
            $addFields: {
              expired: {
                $lte: ["$endDate", new Date()],
              },
            },
          },
          {
            $sort: {
              expired: 1,
              createdAt: -1,
            },
          },
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
        ]);

        const message =
          promoList.length <= 0 ?
          multilingualService.getResponseMessage("EMPTY_LIST", lang) :
          multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang);
        done({
          message: message,
          data: {
            query,
            promoList,
            itemCount,
            pageCount,
          },
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  getPromoCodeById(data, id, userId, lang) {
    return new Promise(async (done, reject) => {
      try {
        let result = [];
        if (data.isFromAdmin || data.isFromAdmin == true || data.isFromAdmin == "true") {
          result = await model.promocode.aggregate([{
              $match: {
                _id: mongoose.Types.ObjectId(id),
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
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userId",
              },
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
              $lookup: {
                from: "storeitemtypes",
                localField: "categoryId",
                foreignField: "_id",
                as: "categoryId",
              },
            },
          ]);
        } else {
          result = await model.promocode.aggregate([{
              $match: {
                _id: mongoose.Types.ObjectId(id),
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
              $lookup: {
                from: "brands",
                localField: "brandId",
                foreignField: "_id",
                as: "brandId",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userId",
              },
            },
            {
              $lookup: {
                from: "stores",
                localField: "storeIds",
                foreignField: "_id",
                as: "storeIds",
              },
            },
            {
              $lookup: {
                from: "storeitemtypes",
                localField: "categoryId",
                foreignField: "_id",
                as: "categoryId",
              },
            },
          ]);
        }

        let productId = [];
        let subCategoryId = [];
        // let brandId = [];
        if (result && result.length && result[0].productId && result[0].productId.length) {
          productId = await model.promocode.aggregate([{
              $match: {
                _id: mongoose.Types.ObjectId(id),
                // startDate: {
                //   $lte: new Date(moment().startOf('date'))
                // },
                // endDate: {
                //   $gte: new Date(moment().startOf('date'))
                // },
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
              $unwind: "$productId",
            },
            {
              $group: {
                _id: "$productId.productKey",
                productName: {
                  $first: "$productId.productName",
                },
                productName_ar: {
                  $first: "$productId.productName_ar",
                },
                storeItemSubTypeId: {
                  $first: "$productId.storeItemSubTypeId",
                },
                storeItemTypeId: {
                  $first: "$productId.storeItemTypeId",
                },
                brandId: {
                  $first: "$productId.brandId",
                },
                createdAt: {
                  $first: "$productId.createdAt",
                },
                storeTypeId: {
                  $first: "$productId.storeTypeId",
                },
                variants: {
                  $push: {
                    label: "$$ROOT.productId.label",
                    color: "$$ROOT.productId.color",
                    marketPrice: "$$ROOT.productId.marketPrice",
                    price: "$$ROOT.productId.price",
                    originalPrice: "$$ROOT.productId.originalPrice",
                    discount: "$$ROOT.productId.discount",
                    discountType: "$$ROOT.productId.discountType",
                    description_ar: "$$ROOT.productId.description_ar",
                    description: "$$ROOT.productId.description",
                    image1: "$$ROOT.productId.image1",
                    image2: "$$ROOT.productId.image2",
                    image3: "$$ROOT.productId.image3",
                    image4: "$$ROOT.productId.image4",
                    image5: "$$ROOT.productId.image5",
                    video: "$$ROOT.productId.video",
                    tickets: "$$ROOT.productId.tickets",
                    LP: "$$ROOT.productId.LP",
                    name_ar: "$$ROOT.productId.name_ar",
                    quantity: "$$ROOT.productId.quantity",
                    purchaseLimit: "$$ROOT.productId.purchaseLimit",
                    name: "$$ROOT.productId.name",
                    size: "$$ROOT.productId.size",
                    unit: "$$ROOT.productId.unit",
                    addOn: "$$ROOT.productId.addOn",
                    additional1: "$$ROOT.productId.additional1",
                    additional2: "$$ROOT.productId.additional2",
                    additional1_ar: "$$ROOT.productId.additional1_ar",
                    additional2_ar: "$$ROOT.productId.additional2_ar",
                    unitValue: "$$ROOT.productId.unitValue",
                    variantId: "$$ROOT.productId.variantId",
                    _id: "$$ROOT.productId._id",
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
              $unwind: {
                path: "$brandId",
                preserveNullAndEmptyArrays: true,
              },
            },
          ]);
          for (let j = 0; j < productId.length; j++) {
            productId[j]["isFav"] = false;
            if (global.favs[userId.toString() + productId[j]._id]) {
              productId[j]["isFav"] = true;
            }
            for (let q of productId[j].variants) {
              if (result[0].code.toLowerCase() === "deal") {
                if (result[0].discountType.toLowerCase() === "flat") {
                  q.price = Number(q.price - result[0].discount);
                  if(q.price < 0){
                    q.price = 0
                  }
                } else {
                  q.price = q.price - ((result[0].discount * 1) / 100) * q.price;
                }
              }
            }
          }
          result[0].productId = productId;
        }
        if (result && result.length && result[0].itemId && result[0].itemId.length) {
          let itemId 
          if (data.isFromAdmin || data.isFromAdmin == true || data.isFromAdmin == "true") {
            itemId = await model.promocode.aggregate([{
              $match: {
                _id: mongoose.Types.ObjectId(id),
                // startDate: {
                //   $lte: new Date(moment().startOf('date'))
                // },
                // endDate: {
                //   $gte: new Date(moment().startOf('date'))
                // },
              },
            },
            {
              $lookup: {
                from: "storeitems",
                localField: "itemId",
                foreignField: "_id",
                as: "itemId",
              },
            },
            {
              $unwind: "$itemId",
            },
            {
              $group: {
                _id: "$itemId._id",
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
              $first:"$itemId.label"
            },
            color: {
               $first:"$itemId.color"
            },
            marketPrice: {
              $first:"$itemId.marketPrice"
            },
            price: {
              $first:"$itemId.price"
            },
            originalPrice:{
                  $first: "$itemId.originalPrice"
                },
                discount: {
                  $first:"$itemId.discount"
                },
                discountType: {
                  $first:"$itemId.discountType"
                },
                description_ar:{
                  $first: "$itemId.description_ar"
                },
                description:{
                  $first: "$itemId.description"
                },
                image1: {
                  $first:"$itemId.image1"
                },
                image2: {
                  $first:"$itemId.image2"
                },
                image3: {
                  $first:"$itemId.image3"
                },
                image4:{
                  $first: "$itemId.image4"
                },
                image5: {
                  $first:"$itemId.image5"
                },
                video: {
                  $first:"$itemId.video"
                },
                tickets:{
                  $first: "$itemId.tickets"
                },
                LP:{
                  $first: "$itemId.LP"
                },
                name_ar:{
                  $first: "$itemId.name_ar"
                },
                quantity:{
                  $first: "$itemId.quantity"
                },
                purchaseLimit:{
                  $first: "$itemId.purchaseLimit"
                },
                name:{
                  $first: "$itemId.name"
                },
                size: {
                  $first:"$itemId.size"
                },
                unit:{
                  $first: "$itemId.unit"
                },
                addOn: {
                  $first:"$itemId.addOn"
                },
                additional1:{
                  $first: "$itemId.additional1"
                },
                additional2:{
                  $first: "$itemId.additional2"
                },
                additional1_ar:{
                  $first: "$itemId.additional1_ar"
                },
                additional2_ar:{
                  $first: "$itemId.additional2_ar"
                },
                unitValue: {
                  $first:"$itemId.unitValue"
                }
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
              $unwind: {
                path: "$brandId",
                preserveNullAndEmptyArrays: true,
              },
            },
          ]);
          }
          else{

            itemId = await model.promocode.aggregate([{
                $match: {
                  _id: mongoose.Types.ObjectId(id),
                  // startDate: {
                  //   $lte: new Date(moment().startOf('date'))
                  // },
                  // endDate: {
                  //   $gte: new Date(moment().startOf('date'))
                  // },
                },
              },
              {
                $lookup: {
                  from: "storeitems",
                  localField: "itemId",
                  foreignField: "_id",
                  as: "itemId",
                },
              },
              {
                $unwind: "$itemId",
              },
              {
                $group: {
                  _id: "$itemId.productKey",
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
                  variants: {
                    $push: {
                      label: "$$ROOT.itemId.label",
                      color: "$$ROOT.itemId.color",
                      marketPrice: "$$ROOT.itemId.marketPrice",
                      price: "$$ROOT.itemId.price",
                      originalPrice: "$$ROOT.itemId.originalPrice",
                      discount: "$$ROOT.itemId.discount",
                      discountType: "$$ROOT.itemId.discountType",
                      description_ar: "$$ROOT.itemId.description_ar",
                      description: "$$ROOT.itemId.description",
                      image1: "$$ROOT.itemId.image1",
                      image2: "$$ROOT.itemId.image2",
                      image3: "$$ROOT.itemId.image3",
                      image4: "$$ROOT.itemId.image4",
                      image5: "$$ROOT.itemId.image5",
                      video: "$$ROOT.itemId.video",
                      tickets: "$$ROOT.itemId.tickets",
                      LP: "$$ROOT.itemId.LP",
                      name_ar: "$$ROOT.itemId.name_ar",
                      quantity: "$$ROOT.itemId.quantity",
                      purchaseLimit: "$$ROOT.itemId.purchaseLimit",
                      name: "$$ROOT.itemId.name",
                      size: "$$ROOT.itemId.size",
                      unit: "$$ROOT.itemId.unit",
                      addOn: "$$ROOT.itemId.addOn",
                      additional1: "$$ROOT.itemId.additional1",
                      additional2: "$$ROOT.itemId.additional2",
                      additional1_ar: "$$ROOT.itemId.additional1_ar",
                      additional2_ar: "$$ROOT.itemId.additional2_ar",
                      unitValue: "$$ROOT.itemId.unitValue",
                      variantId: "$$ROOT.itemId.variantId",
                      _id: "$$ROOT.itemId._id",
                    },
                  },
                },
              },
              // {
              //   $group: {
              //     _id: "$itemId._id",
              // productName: {
              //   $first: "$itemId.productName",
              // },
              // productName_ar: {
              //   $first: "$itemId.productName_ar",
              // },
              // storeItemSubTypeId: {
              //   $first: "$itemId.storeItemSubTypeId",
              // },
              // storeItemTypeId: {
              //   $first: "$itemId.storeItemTypeId",
              // },
              // brandId: {
              //   $first: "$itemId.brandId",
              // },
              // createdAt: {
              //   $first: "$itemId.createdAt",
              // },
              // storeTypeId: {
              //   $first: "$itemId.storeTypeId",
              // },
              // label: {
              //   $first:"$itemId.label"
              // },
              // color: {
              //    $first:"$itemId.color"
              // },
              // marketPrice: {
              //   $first:"$itemId.marketPrice"
              // },
              // price: {
              //   $first:"$itemId.price"
              // },
              // originalPrice:{
              //       $first: "$itemId.originalPrice"
              //     },
              //     discount: {
              //       $first:"$itemId.discount"
              //     },
              //     discountType: {
              //       $first:"$itemId.discountType"
              //     },
              //     description_ar:{
              //       $first: "$itemId.description_ar"
              //     },
              //     description:{
              //       $first: "$itemId.description"
              //     },
              //     image1: {
              //       $first:"$itemId.image1"
              //     },
              //     image2: {
              //       $first:"$itemId.image2"
              //     },
              //     image3: {
              //       $first:"$itemId.image3"
              //     },
              //     image4:{
              //       $first: "$itemId.image4"
              //     },
              //     image5: {
              //       $first:"$itemId.image5"
              //     },
              //     video: {
              //       $first:"$itemId.video"
              //     },
              //     tickets:{
              //       $first: "$itemId.tickets"
              //     },
              //     LP:{
              //       $first: "$itemId.LP"
              //     },
              //     name_ar:{
              //       $first: "$itemId.name_ar"
              //     },
              //     quantity:{
              //       $first: "$itemId.quantity"
              //     },
              //     purchaseLimit:{
              //       $first: "$itemId.purchaseLimit"
              //     },
              //     name:{
              //       $first: "$itemId.name"
              //     },
              //     size: {
              //       $first:"$itemId.size"
              //     },
              //     unit:{
              //       $first: "$itemId.unit"
              //     },
              //     addOn: {
              //       $first:"$itemId.addOn"
              //     },
              //     additional1:{
              //       $first: "$itemId.additional1"
              //     },
              //     additional2:{
              //       $first: "$itemId.additional2"
              //     },
              //     additional1_ar:{
              //       $first: "$itemId.additional1_ar"
              //     },
              //     additional2_ar:{
              //       $first: "$itemId.additional2_ar"
              //     },
              //     unitValue: {
              //       $first:"$itemId.unitValue"
              //     }
              //   },
              // },
              {
                $lookup: {
                  from: "brands",
                  localField: "brandId",
                  foreignField: "_id",
                  as: "brandId",
                },
              },
              {
                $unwind: {
                  path: "$brandId",
                  preserveNullAndEmptyArrays: true,
                },
              },
            ]);
            for (let j = 0; j < itemId.length; j++) {
              itemId[j]["isFav"] = false;
              if (global.favs[userId.toString() + itemId[j]._id]) {
                itemId[j]["isFav"] = true;
              }
            }
            for (let j = 0; j < itemId.length; j++) {
              itemId[j]["isFav"] = false;
              if (global.favs[userId.toString() + itemId[j]._id]) {
                itemId[j]["isFav"] = true;
              }
              for (let q of itemId[j].variants) {
                if (result[0].code.toLowerCase() === "deal") {
                  if (result[0].discountType.toLowerCase() === "flat") {
                    q.price = Number(q.price - result[0].discount);
                    if(q.price < 0){
                      q.price = 0
                    }
                  } else {
                    q.price = q.price - ((result[0].discount * 1) / 100) * q.price;
                  }
                }
              }
            }
          }

          result[0].itemId = itemId;
        }
        if (result && result.length && result[0].subCategoryId && result[0].subCategoryId.length) {
          subCategoryId = await model.promocode.aggregate([{
              $match: {
                _id: mongoose.Types.ObjectId(id),
              },
            },
            {
              $lookup: {
                from: "storeitemtypes",
                localField: "subCategoryId",
                foreignField: "_id",
                as: "subCategoryId",
              },
            },
            {
              $unwind: "$subCategoryId",
            },
            {
              $project: {
                subCategoryId: 1,
                store: 1,
              },
            },
            {
              $lookup: {
                from: "storeitems",
                let: {
                  id: "$subCategoryId._id",
                  storeId: "$store",
                },
                pipeline: [{
                    $match: {
                      $expr: {
                        $and: [{
                            $eq: ["$$id", "$storeItemSubTypeId"],
                          },
                          {
                            $eq: ["$$storeId", "$storeId"],
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
                ],
                as: "products",
              },
            },
          ]);
          subCategoryId = subCategoryId.map((item) => {
            item.subCategoryId.products = item.products;
            return item.subCategoryId;
          });
          result[0].subCategoryId = subCategoryId;
          for (let i = 0; i < subCategoryId.length; i++) {
            for (let j = 0; j < subCategoryId[i].products.length; j++) {
              subCategoryId[i].products[j]["isFav"] = false;
              if (global.favs[userId.toString() + subCategoryId[i].products[j]._id]) {
                subCategoryId[i].products[j]["isFav"] = true;
              }
              for (let q of subCategoryId[i].products[j].variants) {
                if (result[0].code.toLowerCase() === "deal") {
                  if (result[0].discountType.toLowerCase() === "flat") {
                    q.price = Number(q.price - result[0].discount);
                    if(q.price < 0){
                      q.price = 0
                    }
                  } else {
                    q.price = q.price - ((result[0].discount * 1) / 100) * q.price;
                  }
                }
              }
            }
          }
        }
        if (result.length == 0) {
          return reject({
            message: multilingualService.getResponseMessage("FALSEMSG", lang),
          });
        }
        if (result && result[0] && result[0].store) {
          let store = await model.store.findById(result[0].store);
          result[0].layout = store.layout;
          result[0].isOpen = store.isOpen;
        }

        if (data.deviceType === "IOS") {
          result[0]["brandIds"] = result[0].brandId;
          delete result[0].brandId;
        }
        done({
          message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
          data: result,
        });
      } catch (error) {
        console.log(error);
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  deletePromoCode(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        await model.promocode.findByIdAndDelete(data.id);
        done({
          message: multilingualService.getResponseMessage("DELETEMSG", lang),
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  async addDeal() {
    if (!data.store) {
      throw new Error("NO STORE SELECTED ERROR");
    }
    if (data.brandId && data.brandId.length) {
      data.isSubCategory = false;
      data.isCategory = false;
      data.isProduct = false;
      data.isBrand = true;
    }
    if (data.productId && data.productId.length) {
      data.isSubCategory = true;
      data.isCategory = false;
      data.isProduct = true;
      data.isBrand = false;
    }
    if (data.categoryId && data.categoryId.length) {
      data.isSubCategory = false;
      data.isCategory = true;
      data.isProduct = false;
      data.isBrand = false;
    }
    if (data.subCategoryId && data.subCategoryId.length) {
      data.isSubCategory = true;
      data.isCategory = false;
      data.isProduct = false;
      data.isBrand = false;
    }
    if (file) data.image = Constant.PROMOCODEIMAGE + file.filename;
    let promo = new model.promocode(data);
    promo = await promo.save();

    let qry = {};
    qry.storeId = promo.store;
    if (promo.isSubCategory)
      qry.storeItemSubTypeId = {
        $in: result.isSubCategory,
      };

    if (promo.isCategory)
      qry.storeItemTypeId = {
        $in: result.isCategory,
      };

    if (promo.brandId)
      qry.brandId = {
        $in: result.brandId,
      };

    if (promo.productId)
      qry.productKey = {
        $in: result.productId,
      };

    await model.storeItem.updateMany(qry, {
      $set: {
        discount: result.discount,
        discountType: result.discountType,
      },
    });

    let clones = await model.storeItem.find(qry).lean();

    clones.forEach(async (clone) => {
      let item = storeAdminRepo.calculatingTaxAndDiscount(clone);
      model.storeItem.findByIdAndUpdate(item._id, item).exec();
    });

    return {
      message: multilingualService.getResponseMessage("ADDMSG", lang),
      data: result,
    };
  }

  async broadCast(data) {
    if (data.user == true || data.user == "true") {
      let userQry = {
        deviceId: {
          $ne: "",
        },
      };
      if (data.users && data.users.length)
        userQry._id = {
          $in: data.users,
        };
      let users = await model.user.find(userQry, {
        deviceId: 1,
      });
      users.forEach((user) => {
        let message = {
          to: user.deviceId,
          notification: {
            title: data.title,
            body: data.notimessage,
            // type: payload.type,
            // notiData: payload,
          },
          data: {
            title: data.title,
            body: data.notimessage,
            // type: payload.type,
            // notiData: payload,
          },
        };
        fcm.send(message, (err, response) => {
          if (err) {
            console.log("Something has gone wrong!", err);
          } else {
            console.log("Push successfully sent!");
          }
        });
      });
    }
    if (data.store == true || data.store == "true") {
      let userQry = {
        deviceId: {
          $ne: "",
        },
      };
      if (data.stores && data.stores.length)
        userQry._id = {
          $in: data.stores,
        };
      let users = await model.store.find(userQry, {
        deviceId: 1,
        _id:1
      });
      users.forEach(async(user) => {
        let message = {
          storeId: user._id,
          title: data.title,
          message: data.notimessage
          /* notification: {
            title: data.title,
            body: data.notimessage,
            // type: payload.type,
            // notiData: payload,
          },
          data: {
            title: data.title,
            body: data.notimessage,
            // type: payload.type,
            // notiData: payload,
          }, */
        };
	
        await Service.Notification.webPushNotification(message);
        /* fcm.send(message, (err, response) => {
          if (err) {
            console.log("Something has gone wrong!", err);
          } else {
            console.log("Push successfully sent!");
          }
        }); */
      });
    }
    if (data.driver == true || data.driver == "true") {
      let userQry = {
        deviceId: {
          $ne: "",
        },
      };
      if (data.drivers && data.drivers.length)
        userQry._id = {
          $in: data.drivers,
        };
      let users = await model.driver.find(userQry, {
        deviceId: 1,
      });
      users.forEach((user) => {
        let message = {
          to: user.deviceId,
          notification: {
            title: data.title,
            body: data.notimessage,
            // type: payload.type,
            // notiData: payload,
          },
          data: {
            title: data.title,
            body: data.notimessage,
            // type: payload.type,
            // notiData: payload,
          },
        };
        fcm.send(message, (err, response) => {
          if (err) {
            console.log("Something has gone wrong!", err);
          } else {
            console.log("Push successfully sent!");
          }
        });
      });
    }

    // await model.BroadCastNotification.insertMany({
    //   storeId: data.store,
    //   userId: data.users,
    //   title: data.title,
    //   notimessage: data.notimessage,
    // });
    return {
      data: "",
      message: "done",
    };
  }
  addVehicleType(data, file, lang, finalFileName, geofenceId) {
    return new Promise((done, reject) => {
      if (finalFileName) data.image = process.env.S3URL + finalFileName;

      data.date = moment().valueOf();
      if (geofenceId != "NA") data.geofenceId = geofenceId;
      let vehicleType = new model.vehicleType(data);

      vehicleType
        .save()
        .then((result) => {
          done({
            message: multilingualService.getResponseMessage("ADDMSG", lang),
            data: result,
          });
        })
        .catch((err) => {
          if (err.errors)
            return reject({
              message: Service.Handler.mongoErrorHandler(err),
            });

          return reject({
            message: multilingualService.getResponseMessage("FALSEMSG", lang),
          });
        });
    });
  }

  editVehicleType(data, file, lang, finalFileName) {
    return new Promise(async (done, reject) => {
      try {
        let existVehicleType = await model.vehicleType
          .findOne({
            _id: mongoose.Types.ObjectId(data.updateId),
          })
          .lean()
          .exec();
        if (!existVehicleType)
          return reject({
            message: multilingualService.getResponseMessage("INAVLIDID", lang),
          });

        if (finalFileName) data.image = process.env.S3URL + finalFileName;

        let result = await model.vehicleType.findByIdAndUpdate(data.updateId, data, {
          new: true,
        });

        if (data.status === 1) {
          done({
            message: multilingualService.getResponseMessage("VEHICLETYPEUNBLOCKED", lang),
            data: result,
          });
        }
        done({
          message: multilingualService.getResponseMessage("VEHICLETYPEBLOCKED", lang),
          data: result,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("DELETEMSG", lang),
        });
      }
    });
  }

  getVehicleType(data, lang, geofenceId) {
    return new Promise(async (done, reject) => {
      try {
        let filter;
        const moduleKey = data.moduleKey;
        if (data.all == true || data.all == "true") {
          let dataNew;
          if (data.type) {
            filter = {
              $and: [{
                  status: {
                    $ne: 0,
                  },
                },
                {
                  status: {
                    $ne: 2,
                  },
                },
                {
                  verticalType: data.type,
                },
              ],
            };
          } else {
            filter = {
              moduleKey: moduleKey,
              $and: [{
                  status: {
                    $ne: 0,
                  },
                },
                {
                  status: {
                    $ne: 2,
                  },
                },
              ],
            };
          }
          if (geofenceId != "NA") filter.geofenceId = geofenceId;
          dataNew = await model.vehicleType.find(filter);
          done({
            message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
            data: dataNew,
          });
          return;
        }
        const limit = Number(data.limit) || Constant.ADMINLIMIT;
        const page = Math.max(1, Number(data.page) || 0);
        const skip = Math.max(0, page - 1) * limit;
        const sort = {
          _id: -1,
        };

        const query = {
          limit,
          page,
          skip,
          search: data.search,
        };
        filter = {
          status: {
            $ne: 2,
          },
        };
        if (data.search) {
          const regex = {
            $regex: `${data.search}`,
            $options: "i",
          };
          filter.$or = [{
            name: regex,
          }, ];
        }
        if (moduleKey) {
          filter.moduleKey = moduleKey;
        }
        if (geofenceId != "NA") filter.geofenceId = geofenceId;
        const itemCount = await model.vehicleType.countDocuments(filter);
        const pageCount = Math.ceil(itemCount / limit);
        const vehicleList = await model.vehicleType.find(filter).sort(sort).skip(skip).limit(limit).lean();

        const message =
          vehicleList.length <= 0 ?
          multilingualService.getResponseMessage("EMPTY_LIST", lang) :
          multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang);
        done({
          message: message,
          data: {
            query,
            vehicleList,
            itemCount,
            pageCount,
          },
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  getVehicleTypeById(id, lang) {
    return new Promise((done, reject) => {
      model.vehicleType.findById(id).then((result) => {
        done({
          message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
          data: result,
        });
      });
    });
  }

  addUser(data, file, lang, finalFileName) {
    return new Promise((done, reject) => {
      let user = new model.user(data);
      user.date = moment().valueOf();
      if (data.password) user.hash = Service.HashService.encrypt(data.password);
      if (finalFileName) user.profilePic = process.env.S3URL + finalFileName;

      user
        .save()
        .then((result) => {
          done({
            message: "ADDMSG",
            data: result,
          });
        })
        .catch((err) => {
          if (err.errors)
            return reject({
              message: Service.Handler.mongoErrorHandler(err),
            });

          return reject({
            message: multilingualService.getResponseMessage("FALSEMSG", lang),
          });
        });
    });
  }

  editUser(data, file, lang, finalFileName) {
    return new Promise(async (done, reject) => {
      try {
        let qry = {};
        if (data.email) {
          qry = {
            $and: [{
                _id: {
                  $ne: data.userId,
                },
              },
              {
                $or: [{
                    email: data.email.toLowerCase(),
                  },
                  {
                    countryCode: data.countryCode,
                    phone: data.phone,
                  },
                ],
              },
            ],
          };
        }

        // let user = await model.user.findOne(qry).lean().exec();
        // if (user && data.email) {
        //   return reject({
        //     message:
        //       data.email.toLowerCase() == user.email
        //         ? multilingualService.getResponseMessage("EMAILEXISTS", lang)
        //         : multilingualService.getResponseMessage("PHONEEXISTS", lang),
        //   });
        // }

        if (finalFileName) data.profilePic = process.env.S3URL + finalFileName;
        if (data.wallet) {
          await model
            .Transaction({
              userId: data.userId,
              transactionType: "adminReward",
              amount: data.wallet,
              creditDebitType: "credit",
            })
            .save();
        }

        let result = await model.user.findByIdAndUpdate(data.userId, data, {
          new: true,
        });

        if (data.status === 1) {
          done({
            message: multilingualService.getResponseMessage("UPDATEMSG", lang),
            data: result,
          });
        }
        if (data.status === 2) {
          done({
            message: multilingualService.getResponseMessage("DELETEMSG", lang),
            data: result,
          });
        }
        done({
          message: multilingualService.getResponseMessage("UPDATEMSG", lang),
          data: result,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  getUser(data, lang) {
    return new Promise(async (done, reject) => {
      if (data.all == true || data.all == "true") {
        const dataNew = await model.user.find({
          $and: [{
              status: {
                $ne: 2,
              },
            },
            {
              status: {
                $ne: 5,
              },
            },
          ],
        });
        done({
          message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
          data: dataNew,
        });
        return;
      }
      let skip = Number(data.page) && Number(data.page) > 1 ? (Number(data.page) - 1) * Constant.ADMINLIMIT : 0;
      let Arr = [{
        $and: [{
            status: {
              $ne: 2,
            },
          },
          {
            status: {
              $ne: 5,
            },
          },
        ],
      }, ];

      if (data.name && data.name != "") {
        let [firstName, lastName] = data.name.split(" ");
        if (!lastName) {
          Arr.push({
            $or: [{
                firstName: new RegExp(data.name, "i"),
              },
              {
                lastName: new RegExp(data.name, "i"),
              },
              {
                email: new RegExp(data.name, "i"),
              },
              {
                phone: new RegExp(data.name, "i"),
              },
            ],
          });
        } else {
          Arr.push({
            $and: [{
                firstName: new RegExp(firstName, "i"),
              },
              {
                lastName: new RegExp(lastName, "i"),
              },
            ],
          });
        }
      }

      let qry =
        Arr.length == 1 ?
        Arr[0] :
        {
          $and: Arr,
        };
      await model.user
        .find(qry)
        .select("+status +authToken")
        .sort({
          _id: -1,
        })
        .skip(skip)
        .limit(Constant.ADMINLIMIT)
        .lean()
        .exec()
        .then(async (result) => {
          for (const i of result) {
            let totalSpent = await model.storeOrder.aggregate([{
                $match: {
                  userId: mongoose.Types.ObjectId(i._id),
                  status: 4,
                },
              },
              {
                $group: {
                  _id: {},
                  count: {
                    $sum: "$totalAmount",
                  },
                },
              },
            ]);
            i.totalSpent = totalSpent.length > 0 ? totalSpent[0].count : 0;
          }
          await model.user.countDocuments(qry).then((count) => {
            done({
              data: {
                users: result,
                count: count,
              },
            });
          });
        });
    });
  }

  getUserById(id, lang) {
    return new Promise((done, reject) => {
      model.user.findById(id).then((result) => {
        done({
          data: result,
        });
      });
    });
  }

  getDashboardStats(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        let users = await model.user.countDocuments({
          $and: [{
              status: {
                $ne: 2,
              },
            },
            {
              status: {
                $ne: 5,
              },
            },
          ],
        });
        let drivers = await model.driver.countDocuments({});
        let stores = await model.store.countDocuments({
          status: {
            $ne: 2,
          },
        });
        let vehicleTypesDelivery = await model.vehicleType.countDocuments({
          status: {
            $ne: 2,
          },
          verticalType: 1,
        });
        let vehicleTypesTaxiShuttle = await model.vehicleType.countDocuments({
          status: {
            $ne: 2,
          },
          verticalType: {
            $in: [2, 3],
          },
        });
        let orders = await model.storeOrder.countDocuments({
          status: {
            $ne: 2,
          },
        });
        let brands = await model.brand.countDocuments({
          status: {
            $ne: 2,
          },
        });
        let categories = await model.storeItemType.countDocuments({
          isParent: true,
        });
        let storeItems = await model.storeItem.countDocuments({
          $or: [{
              isProto: true,
            },
            {
              storeExclusive: true,
            },
          ],
          status: {
            $ne: 2,
          },
        });
        let salesPerson = await model.SalesPerson.countDocuments({});
        let storeTypes = await model.storeCategory.countDocuments({});
        let subCategories = await model.storeItemType.countDocuments({
          isSubCategory: true,
        });
        let deals = await model.promocode.countDocuments({
          code: "DEAL",
        });
        const startOfDay = new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(new Date().setUTCHours(23, 59, 59, 999)).toISOString();
        let newCustomerToday = await model.user.countDocuments({
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        });
        let newDriverToday = await model.driver.countDocuments({
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        });
        let newOrderToday = await model.storeOrder.countDocuments({
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        });
        let newSalesToday = await model.storeOrder.aggregate([{
            $match: {
              status: 4,
              createdAt: {
                $gte: new Date(moment().startOf("date")),
                $lte: new Date(moment().endOf("date")),
              },
            },
          },
          {
            $group: {
              _id: null,
              totalSales: {
                $sum: "$totalAmount",
              },
            },
          },
          {
            $project: {
              totalSales: 1,
              _id: 0,
            },
          },
        ]);
        let newReviewToday = await model.store.aggregate([{
            $lookup: {
              from: "storeratings",
              let: {
                storeId: "$_id",
              },
              pipeline: [{
                $match: {
                  $expr: {
                    $and: [{
                      $eq: ["$$storeId", "$storeId"],
                    }, ],
                  },
                },
              }, ],
              as: "storeRating",
            },
          },
          {
            $unwind: {
              path: "$storeRating",
            },
          },
          {
            $group: {
              _id: "$_id",
              review: {
                $first: "$storeRating.review",
              },
            },
          },
          {
            $match: {
              review: {
                $ne: "",
              },
            },
          },
        ]);
        let date = new Date();
        let startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        let endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

        let pipeline2 = [{
            $match: {
              status: 4,
              createdAt: {
                $gte: new Date(date.getFullYear(), date.getMonth(), 1),
                $lte: new Date(date.getFullYear(), date.getMonth() + 1, 1),
              },
            },
          },
          {
            $group: {
              _id: null,
              totalSales: {
                $sum: "$totalAmount",
              },
            },
          },
          {
            $project: {
              totalSales: 1,
              _id: 0,
            },
          },
        ];
        let totalSalesThisMonth = await model.storeOrder.aggregate(pipeline2);
        newReviewToday = newReviewToday.length;
        newSalesToday = newSalesToday.length > 0 ? (newSalesToday[0].totalSales ? newSalesToday[0].totalSales : 0) : 0;
        totalSalesThisMonth = totalSalesThisMonth.length > 0 ? (totalSalesThisMonth[0].totalSales ? totalSalesThisMonth[0].totalSales : 0) : 0;
        let sendData = [];
        sendData.push({
          all: {
            users: users,
            drivers: drivers,
            stores: stores,
            vehicleTypesDelivery: vehicleTypesDelivery,
            orders: orders,
            categories: categories,
            brands: brands,
            storeItems: storeItems,
            salesPerson: salesPerson,
            storeTypes: storeTypes,
            subCategories: subCategories,
            vehicleTypesTaxiShuttle: vehicleTypesTaxiShuttle,
            deals: deals,
            newCustomerToday: newCustomerToday,
            newDriverToday: newDriverToday,
            newSalesToday: newSalesToday,
            newOrderToday: newOrderToday,
            newReviewToday: newReviewToday,
            totalSalesThisMonth: totalSalesThisMonth,
          },
        });
        for (var i = 0; i < data.length; i++) {
          let item = data[i];
          let key = Object.keys(item);
          let moduleKeys;
          let length;
          switch (key[0]) {
            case "groceryApp":
              moduleKeys = item["groceryApp"];
              sendData.push({
                groceryApp: [],
              });
              length = moduleKeys.length;
              for (let j = 0; j < length; j++) {
                const moduleKey = moduleKeys[j];
                let drivers = await model.driver.countDocuments({
                  moduleKey: moduleKey,
                });
                let stores = await model.store.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  moduleKey: moduleKey,
                });
                let vehicleTypesDelivery = await model.vehicleType.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  verticalType: 1,
                  moduleKey: moduleKey,
                });
                let vehicleTypesTaxiShuttle = await model.vehicleType.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  verticalType: {
                    $in: [2, 3],
                  },
                  moduleKey: moduleKey,
                });
                let brands = await model.brand.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  moduleKey: moduleKey,
                });
                let categories = await model.storeItemType.countDocuments({
                  isParent: true,
                  moduleKey: moduleKey,
                });
                let storeItems = await model.storeItem.countDocuments({
                  $or: [{
                      isProto: true,
                    },
                    {
                      storeExclusive: true,
                    },
                  ],
                  status: {
                    $ne: 2,
                  },
                  moduleKey: moduleKey,
                });
                let salesPerson = await model.SalesPerson.countDocuments({
                  moduleKey: moduleKey,
                });
                let storeTypes = await model.storeCategory.countDocuments({
                  moduleKey: moduleKey,
                });
                let subCategories = await model.storeItemType.countDocuments({
                  isSubCategory: true,
                  moduleKey: moduleKey,
                });
                let deals = await model.promocode.countDocuments({
                  code: "DEAL",
                  moduleKey: moduleKey,
                });
                let totalOrder = await model.storeOrder.countDocuments({
                  moduleKey: moduleKey,
                });
                let ongoingOrder = await model.storeOrder.countDocuments({
                  moduleKey: moduleKey,
                  status: {
                    $in: [1, 2, 3],
                  },
                });
                let completedOrder = await model.storeOrder.countDocuments({
                  moduleKey: moduleKey,
                  status: 4,
                });
                let cancelOrder = await model.storeOrder.countDocuments({
                  moduleKey: moduleKey,
                  status: {
                    $in: [11, 12],
                  },
                });
                let pendingStore = await model.store.countDocuments({
                  storeTypeId: null,
                  moduleKey: moduleKey,
                });
                const resultData = await Promise.all([
                  drivers,
                  stores,
                  vehicleTypesDelivery,
                  categories,
                  brands,
                  storeItems,
                  salesPerson,
                  storeTypes,
                  subCategories,
                  vehicleTypesTaxiShuttle,
                  deals,
                  totalOrder,
                  ongoingOrder,
                  completedOrder,
                  cancelOrder,
                  pendingStore,
                ]);
                // modulekey = modulekey.toString();
                sendData[i + 1]["groceryApp"].push({});
                sendData[i + 1]["groceryApp"][j][moduleKey] = {
                  drivers: resultData[0],
                  stores: resultData[1],
                  vehicleTypesDelivery: resultData[2],
                  categories: resultData[3],
                  brands: resultData[4],
                  storeItems: resultData[5],
                  salesPerson: resultData[6],
                  storeTypes: resultData[7],
                  subCategories: resultData[8],
                  vehicleTypesTaxiShuttle: resultData[9],
                  deals: resultData[10],
                  totalOrder: resultData[11],
                  ongoingOrder: resultData[12],
                  completedOrder: resultData[13],
                  cancelOrder: resultData[14],
                  pendingStore: resultData[15],
                };
              }
              break;
            case "foodDeliveryApp":
              moduleKeys = item["foodDeliveryApp"];
              sendData.push({
                foodDeliveryApp: [],
              });
              length = moduleKeys.length;
              for (let j = 0; j < length; j++) {
                const moduleKey = moduleKeys[j];
                let drivers = await model.driver.countDocuments({
                  moduleKey: moduleKey,
                });
                let stores = await model.store.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  moduleKey: moduleKey,
                });
                let vehicleTypesDelivery = await model.vehicleType.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  verticalType: 1,
                  moduleKey: moduleKey,
                });
                let vehicleTypesTaxiShuttle = await model.vehicleType.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  verticalType: {
                    $in: [2, 3],
                  },
                  moduleKey: moduleKey,
                });
                let brands = await model.brand.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  moduleKey: moduleKey,
                });
                let categories = await model.storeItemType.countDocuments({
                  isParent: true,
                  moduleKey: moduleKey,
                });
                let storeItems = await model.storeItem.countDocuments({
                  $or: [{
                      isProto: true,
                    },
                    {
                      storeExclusive: true,
                    },
                  ],
                  status: {
                    $ne: 2,
                  },
                  moduleKey: moduleKey,
                });
                let salesPerson = await model.SalesPerson.countDocuments({
                  moduleKey: moduleKey,
                });
                let storeTypes = await model.storeCategory.countDocuments({
                  moduleKey: moduleKey,
                });
                let subCategories = await model.storeItemType.countDocuments({
                  isSubCategory: true,
                  moduleKey: moduleKey,
                });
                let deals = await model.promocode.countDocuments({
                  code: "DEAL",
                  moduleKey: moduleKey,
                });
                let totalOrder = await model.storeOrder.countDocuments({
                  moduleKey: moduleKey,
                });
                let ongoingOrder = await model.storeOrder.countDocuments({
                  moduleKey: moduleKey,
                  status: {
                    $in: [1, 2, 3],
                  },
                });
                let completedOrder = await model.storeOrder.countDocuments({
                  moduleKey: moduleKey,
                  status: 4,
                });
                let cancelOrder = await model.storeOrder.countDocuments({
                  moduleKey: moduleKey,
                  status: {
                    $in: [11, 12],
                  },
                });
                let pendingStore = await model.store.countDocuments({
                  storeTypeId: null,
                  moduleKey: moduleKey,
                });
                const resultData = await Promise.all([
                  drivers,
                  stores,
                  vehicleTypesDelivery,
                  categories,
                  brands,
                  storeItems,
                  salesPerson,
                  storeTypes,
                  subCategories,
                  vehicleTypesTaxiShuttle,
                  deals,
                  totalOrder,
                  ongoingOrder,
                  completedOrder,
                  cancelOrder,
                  pendingStore,
                ]);
                // modulekey = modulekey.toString();
                sendData[i + 1]["foodDeliveryApp"].push({});
                sendData[i + 1]["foodDeliveryApp"][j][moduleKey] = {
                  drivers: resultData[0],
                  stores: resultData[1],
                  vehicleTypesDelivery: resultData[2],
                  categories: resultData[3],
                  brands: resultData[4],
                  storeItems: resultData[5],
                  salesPerson: resultData[6],
                  storeTypes: resultData[7],
                  subCategories: resultData[8],
                  vehicleTypesTaxiShuttle: resultData[9],
                  deals: resultData[10],
                  totalOrder: resultData[11],
                  ongoingOrder: resultData[12],
                  completedOrder: resultData[13],
                  cancelOrder: resultData[14],
                  pendingStore: resultData[15],
                };
              }
              break;
            case "taxi":
              moduleKeys = item["taxi"];
              sendData.push({
                taxi: [],
              });

              length = moduleKeys.length;
              for (let j = 0; j < length; j++) {
                const moduleKey = moduleKeys[j];
                let drivers = await model.driver.countDocuments({
                  moduleKey: moduleKey,
                });
                let stores = await model.store.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  moduleKey: moduleKey,
                });
                let vehicleTypesDelivery = await model.vehicleType.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  verticalType: 1,
                  moduleKey: moduleKey,
                });
                let vehicleTypesTaxiShuttle = await model.vehicleType.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  verticalType: {
                    $in: [2, 3],
                  },
                  moduleKey: moduleKey,
                });
                let brands = await model.brand.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  moduleKey: moduleKey,
                });
                let categories = await model.storeItemType.countDocuments({
                  isParent: true,
                  moduleKey: moduleKey,
                });
                let storeItems = await model.storeItem.countDocuments({
                  $or: [{
                      isProto: true,
                    },
                    {
                      storeExclusive: true,
                    },
                  ],
                  status: {
                    $ne: 2,
                  },
                  moduleKey: moduleKey,
                });
                let salesPerson = await model.SalesPerson.countDocuments({
                  moduleKey: moduleKey,
                });
                let storeTypes = await model.storeCategory.countDocuments({
                  moduleKey: moduleKey,
                });
                let subCategories = await model.storeItemType.countDocuments({
                  isSubCategory: true,
                  moduleKey: moduleKey,
                });
                let deals = await model.promocode.countDocuments({
                  code: "DEAL",
                  moduleKey: moduleKey,
                });
                const resultData = await Promise.all([
                  drivers,
                  stores,
                  vehicleTypesDelivery,
                  categories,
                  brands,
                  storeItems,
                  salesPerson,
                  storeTypes,
                  subCategories,
                  vehicleTypesTaxiShuttle,
                  deals,
                ]);
                // modulekey = modulekey.toString();
                sendData[i + 1]["taxi"].push({});
                sendData[i + 1]["taxi"][j][moduleKey] = {
                  drivers: resultData[0],
                  stores: resultData[1],
                  vehicleTypesDelivery: resultData[2],
                  categories: resultData[3],
                  brands: resultData[4],
                  storeItems: resultData[5],
                  salesPerson: resultData[6],
                  storeTypes: resultData[7],
                  subCategories: resultData[8],
                  vehicleTypesTaxiShuttle: resultData[9],
                  deals: resultData[10],
                };
              }
              break;
            case "finance":
              moduleKeys = item["finance"];
              sendData.push({
                finance: [],
              });
              length = moduleKeys.length;
              for (let j = 0; j < length; j++) {
                const moduleKey = moduleKeys[j];
                let drivers = await model.driver.countDocuments({
                  moduleKey: moduleKey,
                });
                let stores = await model.store.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  moduleKey: moduleKey,
                });
                let vehicleTypesDelivery = await model.vehicleType.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  verticalType: 1,
                  moduleKey: moduleKey,
                });
                let vehicleTypesTaxiShuttle = await model.vehicleType.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  verticalType: {
                    $in: [2, 3],
                  },
                  moduleKey: moduleKey,
                });
                let brands = await model.brand.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  moduleKey: moduleKey,
                });
                let categories = await model.storeItemType.countDocuments({
                  isParent: true,
                  moduleKey: moduleKey,
                });
                let storeItems = await model.storeItem.countDocuments({
                  $or: [{
                      isProto: true,
                    },
                    {
                      storeExclusive: true,
                    },
                  ],
                  status: {
                    $ne: 2,
                  },
                  moduleKey: moduleKey,
                });
                let salesPerson = await model.SalesPerson.countDocuments({
                  moduleKey: moduleKey,
                });
                let storeTypes = await model.storeCategory.countDocuments({
                  moduleKey: moduleKey,
                });
                let subCategories = await model.storeItemType.countDocuments({
                  isSubCategory: true,
                  moduleKey: moduleKey,
                });
                let deals = await model.promocode.countDocuments({
                  code: "DEAL",
                  moduleKey: moduleKey,
                });
                const resultData = await Promise.all([
                  drivers,
                  stores,
                  vehicleTypesDelivery,
                  categories,
                  brands,
                  storeItems,
                  salesPerson,
                  storeTypes,
                  subCategories,
                  vehicleTypesTaxiShuttle,
                  deals,
                ]);
                // modulekey = modulekey.toString();
                sendData[i + 1]["finance"].push({});
                sendData[i + 1]["finance"][j][moduleKey] = {
                  drivers: resultData[0],
                  stores: resultData[1],
                  vehicleTypesDelivery: resultData[2],
                  categories: resultData[3],
                  brands: resultData[4],
                  storeItems: resultData[5],
                  salesPerson: resultData[6],
                  storeTypes: resultData[7],
                  subCategories: resultData[8],
                  vehicleTypesTaxiShuttle: resultData[9],
                  deals: resultData[10],
                };
              }
              break;
            case "ecommerce":
              moduleKeys = item["ecommerce"];
              sendData.push({
                ecommerce: [],
              });
              length = moduleKeys.length;
              for (let j = 0; j < length; j++) {
                const moduleKey = moduleKeys[j];
                let drivers = await model.driver.countDocuments({
                  moduleKey: moduleKey,
                });
                let stores = await model.store.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  moduleKey: moduleKey,
                });
                let vehicleTypesDelivery = await model.vehicleType.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  verticalType: 1,
                  moduleKey: moduleKey,
                });
                let vehicleTypesTaxiShuttle = await model.vehicleType.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  verticalType: {
                    $in: [2, 3],
                  },
                  moduleKey: moduleKey,
                });
                let brands = await model.brand.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  moduleKey: moduleKey,
                });
                let categories = await model.storeItemType.countDocuments({
                  isParent: true,
                  moduleKey: moduleKey,
                });
                let storeItems = await model.storeItem.countDocuments({
                  $or: [{
                      isProto: true,
                    },
                    {
                      storeExclusive: true,
                    },
                  ],
                  status: {
                    $ne: 2,
                  },
                  moduleKey: moduleKey,
                });
                let salesPerson = await model.SalesPerson.countDocuments({
                  moduleKey: moduleKey,
                });
                let storeTypes = await model.storeCategory.countDocuments({
                  moduleKey: moduleKey,
                });
                let subCategories = await model.storeItemType.countDocuments({
                  isSubCategory: true,
                  moduleKey: moduleKey,
                });
                let deals = await model.promocode.countDocuments({
                  code: "DEAL",
                  moduleKey: moduleKey,
                });
                const resultData = await Promise.all([
                  drivers,
                  stores,
                  vehicleTypesDelivery,
                  categories,
                  brands,
                  storeItems,
                  salesPerson,
                  storeTypes,
                  subCategories,
                  vehicleTypesTaxiShuttle,
                  deals,
                ]);
                // modulekey = modulekey.toString();
                sendData[i + 1]["ecommerce"].push({});
                sendData[i + 1]["ecommerce"][j][moduleKey] = {
                  drivers: resultData[0],
                  stores: resultData[1],
                  vehicleTypesDelivery: resultData[2],
                  categories: resultData[3],
                  brands: resultData[4],
                  storeItems: resultData[5],
                  salesPerson: resultData[6],
                  storeTypes: resultData[7],
                  subCategories: resultData[8],
                  vehicleTypesTaxiShuttle: resultData[9],
                  deals: resultData[10],
                };
              }
              break;
              // case "pharmacy":
              //   moduleKeys = item["pharmacy"];
              //   sendData.push({ pharmacy: [] });
              //   let length = moduleKeys.length;
              //   for (let j = 0; j < length; j++) {
              //     const moduleKey = moduleKeys[j];
              //     let drivers = await model.driver.countDocuments({
              //       moduleKey: moduleKey,
              //     });
              //     let stores = await model.store.countDocuments({
              //       status: { $ne: 2 },
              //       moduleKey: moduleKey,
              //     });
              //     let vehicleTypesDelivery =
              //       await model.vehicleType.countDocuments({
              //         status: { $ne: 2 },
              //         verticalType: 1,
              //         moduleKey: moduleKey,
              //       });
              //     let vehicleTypesTaxiShuttle =
              //       await model.vehicleType.countDocuments({
              //         status: { $ne: 2 },
              //         verticalType: { $in: [2, 3] },
              //         moduleKey: moduleKey,
              //       });
              //     let brands = await model.brand.countDocuments({
              //       status: { $ne: 2 },
              //       moduleKey: moduleKey,
              //     });
              //     let categories = await model.storeItemType.countDocuments({
              //       isParent: true,
              //       moduleKey: moduleKey,
              //     });
              //     let storeItems = await model.storeItem.countDocuments({
              //       $or: [{ isProto: true }, { storeExclusive: true }],
              //       status: { $ne: 2 },
              //       moduleKey: moduleKey,
              //     });
              //     let salesPerson = await model.SalesPerson.countDocuments({
              //       moduleKey: moduleKey,
              //     });
              //     let storeTypes = await model.storeCategory.countDocuments({
              //       moduleKey: moduleKey,
              //     });
              //     let subCategories = await model.storeItemType.countDocuments({
              //       isSubCategory: true,
              //       moduleKey: moduleKey,
              //     });
              //     let deals = await model.promocode.countDocuments({
              //       code: "DEAL",
              //       moduleKey: moduleKey,
              //     });
              //     const resultData = await Promise.all([
              //       drivers,
              //       stores,
              //       vehicleTypesDelivery,
              //       categories,
              //       brands,
              //       storeItems,
              //       salesPerson,
              //       storeTypes,
              //       subCategories,
              //       vehicleTypesTaxiShuttle,
              //       deals,
              //     ]);
              //     // modulekey = modulekey.toString();
              //     sendData[i + 1]["pharmacy"].push({});
              //     sendData[i + 1]["pharmacy"][j][moduleKey] = {
              //       drivers: resultData[0],
              //       stores: resultData[1],
              //       vehicleTypesDelivery: resultData[2],
              //       categories: resultData[3],
              //       brands: resultData[4],
              //       storeItems: resultData[5],
              //       salesPerson: resultData[6],
              //       storeTypes: resultData[7],
              //       subCategories: resultData[8],
              //       vehicleTypesTaxiShuttle: resultData[9],
              //       deals: resultData[10],
              //     };
              //   }
              //   break;
            case "deliveryApp":
              moduleKeys = item["deliveryApp"];
              sendData.push({
                deliveryApp: [],
              });
              length = moduleKeys.length;
              for (let j = 0; j < length; j++) {
                const moduleKey = moduleKeys[j];
                let drivers = await model.driver.countDocuments({
                  moduleKey: moduleKey,
                });
                let stores = await model.store.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  moduleKey: moduleKey,
                });
                let vehicleTypesDelivery = await model.vehicleType.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  verticalType: 1,
                  moduleKey: moduleKey,
                });
                let vehicleTypesTaxiShuttle = await model.vehicleType.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  verticalType: {
                    $in: [2, 3],
                  },
                  moduleKey: moduleKey,
                });
                let brands = await model.brand.countDocuments({
                  status: {
                    $ne: 2,
                  },
                  moduleKey: moduleKey,
                });
                let categories = await model.storeItemType.countDocuments({
                  isParent: true,
                  moduleKey: moduleKey,
                });
                let storeItems = await model.storeItem.countDocuments({
                  $or: [{
                      isProto: true,
                    },
                    {
                      storeExclusive: true,
                    },
                  ],
                  status: {
                    $ne: 2,
                  },
                  moduleKey: moduleKey,
                });
                let salesPerson = await model.SalesPerson.countDocuments({
                  moduleKey: moduleKey,
                });
                let storeTypes = await model.storeCategory.countDocuments({
                  moduleKey: moduleKey,
                });
                let subCategories = await model.storeItemType.countDocuments({
                  isSubCategory: true,
                  moduleKey: moduleKey,
                });
                let deals = await model.promocode.countDocuments({
                  code: "DEAL",
                  moduleKey: moduleKey,
                });
                const resultData = await Promise.all([
                  drivers,
                  stores,
                  vehicleTypesDelivery,
                  categories,
                  brands,
                  storeItems,
                  salesPerson,
                  storeTypes,
                  subCategories,
                  vehicleTypesTaxiShuttle,
                  deals,
                ]);
                // modulekey = modulekey.toString();
                sendData[i + 1]["deliveryApp"].push({});
                sendData[i + 1]["deliveryApp"][j][moduleKey] = {
                  drivers: resultData[0],
                  stores: resultData[1],
                  vehicleTypesDelivery: resultData[2],
                  categories: resultData[3],
                  brands: resultData[4],
                  storeItems: resultData[5],
                  salesPerson: resultData[6],
                  storeTypes: resultData[7],
                  subCategories: resultData[8],
                  vehicleTypesTaxiShuttle: resultData[9],
                  deals: resultData[10],
                };
              }
              break;
              // case "basicDeliveryApp":
              //   moduleKeys = item["basicDeliveryApp"];
              //   sendData.push({ basicDeliveryApp: [] });
              //   length = moduleKeys.length;
              //   for (let j = 0; j < length; j++) {
              //     const moduleKey = moduleKeys[j];
              //     let drivers = await model.driver.countDocuments({
              //       moduleKey: moduleKey,
              //     });
              //     let stores = await model.store.countDocuments({
              //       status: { $ne: 2 },
              //       moduleKey: moduleKey,
              //     });
              //     let vehicleTypesDelivery =
              //       await model.vehicleType.countDocuments({
              //         status: { $ne: 2 },
              //         verticalType: 1,
              //         moduleKey: moduleKey,
              //       });
              //     let vehicleTypesTaxiShuttle =
              //       await model.vehicleType.countDocuments({
              //         status: { $ne: 2 },
              //         verticalType: { $in: [2, 3] },
              //         moduleKey: moduleKey,
              //       });
              //     let brands = await model.brand.countDocuments({
              //       status: { $ne: 2 },
              //       moduleKey: moduleKey,
              //     });
              //     let categories = await model.storeItemType.countDocuments({
              //       isParent: true,
              //       moduleKey: moduleKey,
              //     });
              //     let storeItems = await model.storeItem.countDocuments({
              //       $or: [{ isProto: true }, { storeExclusive: true }],
              //       status: { $ne: 2 },
              //       moduleKey: moduleKey,
              //     });
              //     let salesPerson = await model.SalesPerson.countDocuments({
              //       moduleKey: moduleKey,
              //     });
              //     let storeTypes = await model.storeCategory.countDocuments({
              //       moduleKey: moduleKey,
              //     });
              //     let subCategories = await model.storeItemType.countDocuments({
              //       isSubCategory: true,
              //       moduleKey: moduleKey,
              //     });
              //     let deals = await model.promocode.countDocuments({
              //       code: "DEAL",
              //       moduleKey: moduleKey,
              //     });
              //     const resultData = await Promise.all([
              //       drivers,
              //       stores,
              //       vehicleTypesDelivery,
              //       categories,
              //       brands,
              //       storeItems,
              //       salesPerson,
              //       storeTypes,
              //       subCategories,
              //       vehicleTypesTaxiShuttle,
              //       deals,
              //     ]);
              //     // modulekey = modulekey.toString();
              //     sendData[i + 1]["basicDeliveryApp"].push({});
              //     sendData[i + 1]["basicDeliveryApp"][j][moduleKey] = {
              //       drivers: resultData[0],
              //       stores: resultData[1],
              //       vehicleTypesDelivery: resultData[2],
              //       categories: resultData[3],
              //       brands: resultData[4],
              //       storeItems: resultData[5],
              //       salesPerson: resultData[6],
              //       storeTypes: resultData[7],
              //       subCategories: resultData[8],
              //       vehicleTypesTaxiShuttle: resultData[9],
              //       deals: resultData[10],
              //     };
              //   }
              //   break;
          }
        }
        done({
          message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
          data: sendData,
        });
      } catch (error) {
        console.log(error.message, "mssssgsgsgsgss");
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  getRestaurantRevenue(data) {
    return new Promise((done, reject) => {
      let qry = {
        status: {
          $gte: 1,
          $lte: 6,
        },
      };
      if (data.restaurantId) qry.restaurantId = mongoose.Types.ObjectId(data.restaurantId);

      model.restaurantOrder
        .aggregate([{
            $match: qry,
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%d/%m/%Y",
                  date: {
                    $add: [new Date(0), "$date"],
                  },
                },
              },
              amount: {
                $sum: "$totalAmount",
              },
              date: {
                $first: "$date",
              },
            },
          },
          {
            $sort: {
              date: -1,
            },
          },
        ])
        .then((result) => {
          let Arr = [];
          result.map((val) => {
            Arr.push([val._id, val.amount]);
          });
          done({
            data: Arr,
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  getStoreRevenue(data) {
    return new Promise((done, reject) => {
      let qry = {
        status: {
          $gte: 1,
          $lte: 6,
        },
      };
      if (data.storeId) qry.storeId = mongoose.Types.ObjectId(data.storeId);

      model.storeOrder
        .aggregate([{
            $match: qry,
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%d/%m/%Y",
                  date: {
                    $add: [new Date(0), "$date"],
                  },
                },
              },
              amount: {
                $sum: "$totalAmount",
              },
              date: {
                $first: "$date",
              },
            },
          },
          {
            $sort: {
              date: -1,
            },
          },
        ])
        .then((result) => {
          let Arr = [];
          result.map((val) => {
            // done({ data: { date: val._id, value: val.amount } });
            Arr.push({
              label: val._id,
              value: val.amount,
            });
          });
          done({
            data: Arr,
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  getTaxiRevenue(data) {
    return new Promise((done, reject) => {
      model.taxiBooking
        .aggregate([{
            $match: {
              status: {
                $lte: 6,
              },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%d/%m/%Y",
                  date: {
                    $add: [new Date(0), "$date"],
                  },
                },
              },
              amount: {
                $sum: "$totalAmount",
              },
              date: {
                $first: "$date",
              },
            },
          },
          {
            $sort: {
              date: -1,
            },
          },
        ])
        .then((result) => {
          let Arr = [];
          result.map((val) => {
            Arr.push([val._id, val.amount]);
          });
          done({
            data: Arr,
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  getShuttleRevenue(data) {
    return new Promise((done, reject) => {
      let qry = {
        status: {
          $lte: 4,
        },
      };
      if (data.venderId) qry.venderId = mongoose.Types.ObjectId(data.venderId);

      model.shuttleBooking
        .aggregate([{
            $lookup: {
              from: "shuttles",
              localField: "shuttleId",
              foreignField: "_id",
              as: "shuttleId",
            },
          },
          {
            $unwind: "$shuttleId",
          },
          {
            $match: qry,
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%d/%m/%Y",
                  date: {
                    $add: [new Date(0), "$bookingStartTime"],
                  },
                },
              },
              amount: {
                $sum: "$totalAmount",
              },
              date: {
                $first: "$bookingStartTime",
              },
            },
          },
          {
            $sort: {
              date: -1,
            },
          },
        ])
        .then((result) => {
          let Arr = [];
          result.map((val) => {
            Arr.push([val._id, val.amount]);
          });
          done({
            data: Arr,
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  addOns(data, file, lang, finalFileName) {
    return new Promise(async (done, reject) => {
      try {
        if (finalFileName) data.image = process.env.S3URL + finalFileName;
        let addOns = await new model.addOns(data);

        let addOn = await model.addOns
          .findOne({
            name: new RegExp("^" + data.name + "$", "i"),
            storeId: data.storeId,
          })
          .lean();
        if (addOn)
          return reject({
            message: multilingualService.getResponseMessage("ALREADYEXIST", lang),
          });

        let result = await model.addOns(addOns).save();
        if (data.productArray.length === 0)
          return reject({
            message: multilingualService.getResponseMessage("PARAMETERMISSING", lang),
          });
        if (data.type === "AddOn") {
          await model.storeItem
            .updateMany({
              _id: {
                $in: data.productArray,
              },
            }, {
              $addToSet: {
                addOn: result._id,
              },
              $set: {
                customizable: true,
              },
            })
            .lean()
            .exec();
        } else if (data.type === "Toppings") {
          await model.storeItem
            .updateMany({
              _id: {
                $in: data.productArray,
              },
            }, {
              $addToSet: {
                toppings: result._id,
              },
              $set: {
                customizable: true,
              },
            })
            .lean()
            .exec();
        }

        done({
          message: multilingualService.getResponseMessage("ADDMSG", lang),
          data: result,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  editAddOns(data, file, lang, finalFileName) {
    return new Promise(async (done, reject) => {
      try {
        if (finalFileName) data.image = process.env.S3URL + finalFileName;
        let result = await model.addOns
          .findByIdAndUpdate(data.updateId, data, {
            new: true,
          })
          .exec();

        if (data.productOldArray.length === 0)
          return reject({
            message: multilingualService.getResponseMessage("PARAMETERMISSING", lang),
          });
        await model.storeItem
          .updateMany({
            _id: {
              $in: data.productOldArray,
            },
          }, {
            $pull: {
              addOn: mongoose.Types.ObjectId(result._id),
            },
          })
          .lean()
          .exec();

        let oldItems = await model.storeItem.find({
          _id: {
            $in: data.productOldArray,
          },
        });

        let oldItems_withnoaddons = [];
        oldItems.forEach((item) => {
          if (!item.addOn || !item.addOn.length) {
            oldItems_withnoaddons.push(item._id);
          }
        });
        await model.storeItem
          .updateMany({
            _id: {
              $in: oldItems_withnoaddons,
            },
          }, {
            $set: {
              customizable: false,
            },
          })
          .lean()
          .exec();

        if (data.productNewArray.length === 0)
          return reject({
            message: multilingualService.getResponseMessage("PARAMETERMISSING", lang),
          });
        await model.storeItem
          .updateMany({
            _id: {
              $in: data.productNewArray,
            },
          }, {
            $addToSet: {
              addOn: mongoose.Types.ObjectId(result._id),
            },
            $set: {
              customizable: true,
            },
          })
          .lean()
          .exec();

        done({
          message: multilingualService.getResponseMessage("UPDATEMSG", lang),
          data: result,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  getAddOns(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        const limit = Number(data.limit) || Constant.ADMINLIMIT;
        const page = Math.max(1, Number(data.page) || 0);
        const skip = Math.max(0, page - 1) * limit;
        const sort = {
          _id: -1,
        };

        const query = {
          limit,
          page,
          skip,
          search: data.search,
        };
        let filter = {
          storeId: data.storeId,
        };
        if (data.search) {
          const regex = {
            $regex: `${data.search}`,
            $options: "i",
          };
          filter.$or = [{
            name: regex,
          }, ];
        }

        const itemCount = await model.addOns.countDocuments(filter);
        const pageCount = Math.ceil(itemCount / limit);
        const toppingList = await model.addOns.find(filter).sort(sort).skip(skip).limit(limit).lean();

        const message =
          toppingList.length <= 0 ?
          multilingualService.getResponseMessage("EMPTY_LIST", lang) :
          multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang);
        done({
          message: message,
          data: {
            query,
            toppingList,
            itemCount,
            pageCount,
          },
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  getToppingItems(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        // let pipeline = [
        //   { $match: { _id: mongoose.Types.ObjectId(data.addOnId) } },
        // ];
        // pipeline.push(
        //   {
        //     $lookup: {
        //       from: "storeitems",
        //       let: { addOnId: "$_id" },
        //       pipeline: [
        //         { $match: { $expr: { $in: ["$$addOnId", "$addOn"] } } },
        //       ],
        //       as: "storeItems",
        //     },
        //   });
        // let storeItems = await model.addOns.aggregate(pipeline).exec();
        let storeItems = await model.storeItem
          .find({
            addOn: data.addOnId,
            status: {
              $ne: 2,
            },
          })
          .exec();

        const message =
          storeItems.length <= 0 ?
          multilingualService.getResponseMessage("EMPTY_LIST", lang) :
          multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang);
        done({
          message: message,
          data: storeItems,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  getAddOnById(id, lang) {
    return new Promise(async (done, reject) => {
      try {
        let result = await model.addOns.findById(id).exec();
        done({
          message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
          data: result,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  deleteAddOns(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        await model.storeItem.updateMany({
          addOn: mongoose.Types.ObjectId(data.addOnId),
        }, {
          $pull: {
            addOn: mongoose.Types.ObjectId(data.addOnId),
          },
        });
        await model.addOns.deleteOne({
          _id: data.addOnId,
        });
        done({
          message: multilingualService.getResponseMessage("DELETEMSG", lang),
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  addCms(data, lang) {
    return new Promise((done, reject) => {
      model.Cms.findOneAndUpdate({
        adminId: mongoose.Types.ObjectId(data.adminId),
      }, {
        $set: data,
      }, {
        upsert: true,
        new: true,
      }).then((result) => {
        done({
          message: Constant.ADDMSG,
          data: result,
        });
      });
    }).catch((err) => {
      return reject({
        message: multilingualService.getResponseMessage("FALSEMSG", lang),
      });
    });
  }

  getCms(lang) {
    return new Promise((done, reject) => {
      model.Cms.findOne({})
        .then((result) => {
          done({
            data: result,
          });
        })
        .catch((err) => {
          return reject({
            message: multilingualService.getResponseMessage("FALSEMSG", lang),
          });
        });
    });
  }

  setSetting(data, lang) {
    return new Promise((done, reject) => {
      model.AdminSetting.findOneAndUpdate({
        adminId: mongoose.Types.ObjectId(data.adminId),
      }, {
        $set: data,
      }, {
        upsert: true,
        new: true,
      }).then((result) => {
        done({
          message: multilingualService.getResponseMessage("ADDMSG", lang),
        }, {
          data: result,
        });
      });
    }).catch((err) => {
      return reject({
        message: multilingualService.getResponseMessage("FALSEMSG", lang),
      });
    });
  }

  getSetting(adminId, lang) {
    return new Promise((done, reject) => {
      model.AdminSetting.findOne({
          adminId: mongoose.Types.ObjectId(adminId),
        })
        .then((result) => {
          done({
            data: result,
          });
        })
        .catch((err) => {
          return reject({
            message: multilingualService.getResponseMessage("FALSEMSG", lang),
          });
        });
    });
  }

  appSetting(data, lang) {
    return new Promise(async (done, reject) => {
      // for (let item in files)
      //   data[item] = Constant.APPSETTINGIMAGE + files[item][0].filename;
      const appSettingId = await model.AppSetting.findOne({}).lean().exec();
      model.AppSetting.findByIdAndUpdate({
            _id: mongoose.Types.ObjectId(appSettingId._id),
          },
          data, {
            new: true,
          }
        )
        .then((result) => {
          done({
            message: multilingualService.getResponseMessage("ADDMSG", lang),
            data: result,
          });
        })
        .catch(async (err) => {
          if (err.errors) {
            let erer = await Service.Handler.mongoErrorHandler(err);
            return reject({
              message: erer,
            });
          } else
            return reject({
              message: multilingualService.getResponseMessage("FALSEMSG", lang),
            });
        });
    });
  }

  getAppSetting(lang) {
    return new Promise((done, reject) => {
      
      model.AppSetting.findOne({})
        .then((result) => {
          
          done({
            message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
            data: result,
          });
        })
        .catch((err) => {
          return reject({
            message: multilingualService.getResponseMessage("FALSEMSG", lang),
          });
        });
    });
  }

  forgotPassword(data, lang) {
    return new Promise(async (done, reject) => {
      let checkQuery = {
        email: data.email,
      };
      let isExist = await model.admin.findOne(checkQuery);
      if (!isExist) {
        return reject({
          message: Constant.NOTREGISTEREDEMAIL,
        });
      }
      await isExist.generatePasswordReset();

      const admin = await model.admin
        .findByIdAndUpdate(
          isExist.id, {
            resetPasswordToken: isExist.resetPasswordToken,
            resetPasswordExpires: isExist.resetPasswordExpires,
          }, {
            new: true,
          }
        )
        .select("+resetPasswordToken");
      var firstName = admin.firstName || process.env.PROJECT_NAME + " Admin";
      let msg = await templateAdmin.forgotPassword({
        firstName,
        token: admin.resetPasswordToken,
      });
      let subject = "Password Reset Mail";
      let mailer = await MailService.mailer({
        to: admin.email,
        text: msg,
        subject: subject,
      });
      done({
        message: Constant.SENTMSG,
      });
    });
  }

  verify(req, res) {
    return new Promise(async (done, reject) => {
      const code = req.query.code;
      const file = process.env.DIR_PATH + "/partials/verify";

      const link = await model.admin.findOne({
        resetPasswordToken: code,
        resetPasswordExpires: {
          $gt: Date.now(),
        },
      });
      if (!link)
        return res.render(file, {
          response: false,
        });
      return res.render(process.env.DIR_PATH + "/partials/forgot-password-admin", {
        code,
      });
    });
  }

  resetPassword(req, res) {
    return new Promise(async (done, reject) => {
      let {
        code,
        password
      } = req.body;

      let admin = await model.admin.findOne({
        resetPasswordToken: code,
        resetPasswordExpires: {
          $gt: Date.now(),
        },
      });
      if (!admin) {
        return reject({
          message: Constant.INVALIDLINK,
        });
      }
      admin.password = Service.HashService.encrypt(password);
      admin.resetPasswordToken = undefined;
      admin.resetPasswordExpires = undefined;
      admin = await model.admin.findByIdAndUpdate(admin.id, {
        resetPasswordToken: undefined,
        hash: admin.password,
        resetPasswordExpires: undefined,
      });
      const mailOptions = {
        to: admin.email,
        subject: "Your password has been changed",
        text: `Hi ${admin.firstName || process.env.PROJECT_NAME + " Admin"}, <br>
                    This is a confirmation that the password for your account ${admin.email} has just been changed.\n`,
      };
      let mailer = await MailService.mailer(mailOptions);
      res.render(process.env.DIR_PATH + "/partials/password-success");
    });
  }

  forgotPasswordRestaurant(data, lang) {
    return new Promise(async (done, reject) => {
      let checkQuery = {
        email: data.email,
      };
      let isExist = await model.restaurant.findOne(checkQuery);
      if (!isExist) {
        return reject({
          message: Constant.NOTREGISTEREDEMAIL,
        });
      }
      await isExist.generatePasswordReset();

      const restaurant = await model.restaurant
        .findByIdAndUpdate(
          isExist.id, {
            resetPasswordToken: isExist.resetPasswordToken,
            resetPasswordExpires: isExist.resetPasswordExpires,
          }, {
            new: true,
          }
        )
        .select("+resetPasswordToken");
      var name = restaurant.name || process.env.PROJECT_NAME + " Restaurant";
      let msg = await templateRestaurant.forgotPassword({
        name,
        token: restaurant.resetPasswordToken,
      });
      let subject = "Password Reset Mail";
      let mailer = await MailService.mailer({
        to: restaurant.email,
        text: msg,
        subject: subject,
      });
      done({
        message: Constant.SENTMSG,
      });
    });
  }

  verifyRestaurant(req, res) {
    return new Promise(async (done, reject) => {
      const code = req.query.code;
      const file = process.env.DIR_PATH + "/partials/verify";

      const link = await model.restaurant.findOne({
        resetPasswordToken: code,
        resetPasswordExpires: {
          $gt: Date.now(),
        },
      });
      if (!link)
        return res.render(file, {
          response: false,
        });
      return res.render(process.env.DIR_PATH + "/partials/forgot-password-restaurant", {
        code,
      });
    });
  }

  resetpasswordRestaurant(req, res) {
    return new Promise(async (done, reject) => {
      let {
        code,
        password
      } = req.body;

      let restaurant = await model.restaurant.findOne({
        resetPasswordToken: code,
        resetPasswordExpires: {
          $gt: Date.now(),
        },
      });
      if (!restaurant) {
        return reject({
          message: Constant.INVALIDLINK,
        });
      }
      restaurant.password = Service.HashService.encrypt(password);
      restaurant.resetPasswordToken = undefined;
      restaurant.resetPasswordExpires = undefined;
      restaurant = await model.restaurant.findByIdAndUpdate(restaurant.id, {
        resetPasswordToken: undefined,
        hash: restaurant.password,
        resetPasswordExpires: undefined,
      });
      const mailOptions = {
        to: restaurant.email,
        subject: "Your password has been changed",
        text: `Hi ${restaurant.firstName || process.env.PROJECT_NAME + " Restaurant"}, <br>
                    This is a confirmation that the password for your account ${restaurant.email} has just been changed.\n`,
      };
      let mailer = await MailService.mailer(mailOptions);
      res.render(process.env.DIR_PATH + "/partials/password-success");
    });
  }

  forgotPasswordStore(data, lang) {
    return new Promise(async (done, reject) => {
      let checkQuery = {
        email: data.email,
      };
      let isExist = await model.store.findOne(checkQuery);
      if (!isExist) {
        return reject({
          message: Constant.NOTREGISTEREDEMAIL,
        });
      }
      await isExist.generatePasswordReset();

      const store = await model.store
        .findByIdAndUpdate(
          isExist.id, {
            resetPasswordToken: isExist.resetPasswordToken,
            resetPasswordExpires: isExist.resetPasswordExpires,
          }, {
            new: true,
          }
        )
        .select("+resetPasswordToken");
      var name = store.name || process.env.PROJECT_NAME + " Store";
      let msg = await templateStore.forgotPassword({
        name,
        token: store.resetPasswordToken,
      });
      let subject = "Password Reset Mail";
      let mailer = await MailService.mailer({
        to: store.email,
        text: msg,
        subject: subject,
      });
      done({
        message: Constant.SENTMSG,
      });
    });
  }

  verifyStore(req, res) {
    return new Promise(async (done, reject) => {
      const code = req.query.code;
      const file = process.env.DIR_PATH + "/partials/verify";

      const link = await model.store.findOne({
        resetPasswordToken: code,
        resetPasswordExpires: {
          $gt: Date.now(),
        },
      });
      if (!link)
        return res.render(file, {
          response: false,
        });
      return res.render(process.env.DIR_PATH + "/partials/forgot-password-store", {
        code,
      });
    });
  }

  resetpasswordStore(req, res) {
    return new Promise(async (done, reject) => {
      let {
        code,
        password
      } = req.body;

      let store = await model.store.findOne({
        resetPasswordToken: code,
        resetPasswordExpires: {
          $gt: Date.now(),
        },
      });
      if (!store) {
        return reject({
          message: Constant.INVALIDLINK,
        });
      }
      store.password = Service.HashService.encrypt(password);
      store.resetPasswordToken = undefined;
      store.resetPasswordExpires = undefined;
      store = await model.store.findByIdAndUpdate(store.id, {
        resetPasswordToken: undefined,
        hash: store.password,
        resetPasswordExpires: undefined,
      });
      const mailOptions = {
        to: store.email,
        subject: "Your password has been changed",
        text: `Hi ${store.firstName || process.env.PROJECT_NAME + " store"}, <br>
                    This is a confirmation that the password for your account ${store.email} has just been changed.\n`,
      };
      let mailer = await MailService.mailer(mailOptions);
      res.render(process.env.DIR_PATH + "/partials/password-success");
    });
  }

  blockUnblockUser(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        await model.user.findOneAndUpdate({
          _id: data.userId,
        }, {
          $set: {
            status: Number(data.status),
          },
        });

        if (data.status === 0) {
          done({
            message: multilingualService.getResponseMessage("USERBLOCKED", lang),
          });
        }
        if (data.status === 3) {
          done({
            message: multilingualService.getResponseMessage("USERUNBLOCKED", lang),
          });
        }
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  addFaq(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        let finalData = [];
        let faqs = data.faqs || [];
        let obj = {};
        for (let i = 0; i < faqs.length; i++) {
          obj = {
            question: faqs[i].question,
            answer: faqs[i].answer,
          };
          finalData.push(obj);
        }
        // await model.Faq.deleteMany({});
        const faqData = await model.Faq.insertMany(finalData);

        done({
          message: multilingualService.getResponseMessage("ADDMSG", lang),
          data: faqData,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  getAllFaq(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        const query = {
          isDeleted: false,
        };
        const results = await model.Faq.find(query, {
          __v: 0,
        }).sort({
          createdAt: -1,
        });
        const message =
          results.length <= 0 ?
          multilingualService.getResponseMessage("EMPTY_LIST", lang) :
          multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang);
        done({
          message: message,
          data: results,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  /**
   * @customerSupport
   */
  async getCustomerSupport(req, res) {
    try {
      const geofenceId = req.headers.geofenceId;
      let offset = 1;
      let limit = +req.query.limit || 10;
      offset = req.query.offset;
      if (offset <= 0) {
        offset = 0;
      } else {
        offset = offset - 1;
      }
      let qry = {};
      if (req.query.status == "false")
        qry = {
          status: false,
        };
      if (req.query.status == "true")
        qry = {
          status: true,
        };
      if (geofenceId != "NA") qry.geofenceId = geofenceId;

      let msg = await model.CustomerSupport.find(qry)
        .populate("userId", "firstName lastName email")
        .sort({
          createdAt: -1,
        })
        .skip(offset * limit)
        .limit(limit);
      let items = await model.CustomerSupport.find().countDocuments();
      items = Math.ceil(items / limit);
      msg = [
        ...msg,
        {
          pages: items,
        },
      ];

      return multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.CUSTOMER_SUPPORT_ALL_REQUEST_FETCHED_SUCCESSFULLY, msg);
    } catch (error) {
      console.log(error.message);
    }
  }

  async updateCustomerSupport(req, res) {
    try {
      let result = await model.CustomerSupport.findByIdAndUpdate(
        req.params.id, {
          status: true,
        }, {
          new: true,
        }
      );
      let user = await model.user.findById(result.userId);
      let payload = {
        to: user.email,
        subject: "Request Status: UPDATED",
        text: `Your issue regarding: ${result.Reason} has been resolved`,
      };
      await MailService.mailer(payload);
      return multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.REQUEST_RESOLVE_SUCCESSFULLY, result);
    } catch (error) {
      console.log(error.message);
    }
  }

  async createSubAdmin(req, res) {
    req.body = JSON.parse(req.body.data);
    try {
      // req.body.permissions = JSON.parse(req.body.permissions);
      // req.body.permissions = req.body.permissions;
      const setobj = req.body;
      if (req.body.phone != null) {
        let subAdminData = await model.SubAdmin2.findOne({
          _id: {
            $nin: [mongoose.Types.ObjectId(req.params.id)],
          },
          phone: req.body.phone,
          isDeleted: false,
        });

        let subAdminData2 = await model.subAdmin.findOne({
          _id: {
            $nin: [mongoose.Types.ObjectId(req.params.id)],
          },
          phone: req.body.phone,
          isDeleted: false,
        });

        let sp = await model.SalesPerson.findOne({
          _id: {
            $nin: [mongoose.Types.ObjectId(req.params.id)],
          },
          phone: req.body.phone,
          isDeleted: false,
        });

        let admin = await model.admin.findOne({
          _id: {
            $nin: [mongoose.Types.ObjectId(req.params.id)],
          },
          phone: req.body.phone,
          isDeleted: false,
        });

        if (subAdminData || subAdminData2 || sp || admin)
          return multilingualService.sendResponse(req, res, false, 1, 0, responseMessages.PHONEEXISTS, {});
      }

      if (req.body.email != null) {
        let subAdminData = await model.SubAdmin2.findOne({
          _id: {
            $nin: [mongoose.Types.ObjectId(req.params.id)],
          },
          email: req.body.email,
          isDeleted: false,
        });

        let subAdminData2 = await model.subAdmin.findOne({
          _id: {
            $nin: [mongoose.Types.ObjectId(req.params.id)],
          },
          email: req.body.email,
          isDeleted: false,
        });

        let sp = await model.SalesPerson.findOne({
          _id: {
            $nin: [mongoose.Types.ObjectId(req.params.id)],
          },
          email: req.body.email,
          isDeleted: false,
        });

        let admin = await model.admin.findOne({
          _id: {
            $nin: [mongoose.Types.ObjectId(req.params.id)],
          },
          email: req.body.email,
          isDeleted: false,
        });
        if (subAdminData || subAdminData2 || sp || admin)
          return multilingualService.sendResponse(req, res, false, 1, 0, responseMessages.EMAILEXISTS, {});
      }

      const password = req.body.firstName + req.body.phone;
      setobj.password = await Service.HashService.encrypt(password);
      if (req.finalFileName) setobj.profilePic = process.env.S3URL + req.finalFileName;
      req.body.password = Service.HashService.encrypt(password);
      let result = await model.SubAdmin2.create(req.body);
      const payload = {
        email: req.body.email,
        password: password,
      };
      await Service.EmailService.sendUserPasswordMail(payload);
      return multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.SUBADMIN_ADDED_SUCCESSFULLY, result);
    } catch (error) {
      console.log(error.message);
    }
  }

  async getSubAdmin(req, res) {
    try {
      let limit = +req.query.limit || 10;
      const page = Math.max(1, Number(req.query.page) || 0);
      const skip = Math.max(0, page - 1) * limit;
      const sort = {
        _id: -1,
      };

      let result = await model.SubAdmin2.find({
          isDeleted: false,
        }, {
          password: 0,
          permissions: 0,
          isDeleted: 0,
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      let items = await model.SubAdmin2.find({
        isDeleted: false,
      }).countDocuments();
      // items = Math.ceil(items / limit);
      // result = [...result, { pages: items }];

      const query = {
        limit,
        page,
        skip,
      };
      const data = {
        result,
        query,
      };
      return multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.SUBADMIN_FETCHED_SUCCESSFULLY, data);
    } catch (error) {
      console.log(error.message);
    }
  }

  async updateSubAdmin(req, res) {
    req.body = JSON.parse(req.body.data);
    try {
      const setobj = req.body;
      if (req.body.phone != null) {
        let subAdminData = await model.SubAdmin2.findOne({
          _id: {
            $nin: [mongoose.Types.ObjectId(req.params.id)],
          },
          phone: req.body.phone,
          isDeleted: false,
        });

        let subAdminData2 = await model.subAdmin.findOne({
          _id: {
            $nin: [mongoose.Types.ObjectId(req.params.id)],
          },
          phone: req.body.phone,
          isDeleted: false,
        });

        let sp = await model.SalesPerson.findOne({
          _id: {
            $nin: [mongoose.Types.ObjectId(req.params.id)],
          },
          phone: req.body.phone,
          isDeleted: false,
        });

        let admin = await model.admin.findOne({
          _id: {
            $nin: [mongoose.Types.ObjectId(req.params.id)],
          },
          phone: req.body.phone,
          isDeleted: false,
        });

        if (subAdminData || subAdminData2 || sp || admin)
          return multilingualService.sendResponse(req, res, false, 1, 0, responseMessages.PHONEEXISTS, {});
      }

      if (req.body.email != null) {
        let subAdminData = await model.SubAdmin2.findOne({
          _id: {
            $nin: [mongoose.Types.ObjectId(req.params.id)],
          },
          email: req.body.email,
          isDeleted: false,
        });

        let subAdminData2 = await model.subAdmin.findOne({
          _id: {
            $nin: [mongoose.Types.ObjectId(req.params.id)],
          },
          email: req.body.email,
          isDeleted: false,
        });

        let sp = await model.SalesPerson.findOne({
          _id: {
            $nin: [mongoose.Types.ObjectId(req.params.id)],
          },
          email: req.body.email,
          isDeleted: false,
        });

        let admin = await model.admin.findOne({
          _id: {
            $nin: [mongoose.Types.ObjectId(req.params.id)],
          },
          email: req.body.email,
          isDeleted: false,
        });

        if (subAdminData || subAdminData2 || sp || admin)
          return multilingualService.sendResponse(req, res, false, 1, 0, responseMessages.EMAILEXISTS, {});
      }
      const password = req.body.firstName + req.body.phone;
      setobj.password = await Service.HashService.encrypt(password);
      if (req.finalFileName) setobj.profilePic = process.env.S3URL + req.finalFileName;
      const adminData = await model.SubAdmin2.findOne({
        _id: req.params.id,
      });
      if (adminData.phone != req.body.phone || adminData.email != req.body.email || adminData.firstName != req.body.firstName) {
        const payload = {
          email: req.body.email,
          passwrod: password,
        };
        await Service.EmailService.sendUserPasswordMail(payload);
      }

      const addSubAdmin = await model.SubAdmin2.findByIdAndUpdate({
          _id: req.params.id,
        },
        setobj, {
          new: true,
        }
      );

      return multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.SUBADMIN_UPDATED_SUCCESSFULLY, addSubAdmin);
    } catch (error) {
      console.log(error.message);
    }
  }

  async getSubAdminById(req, res, next) {
    try {
      const subadmin = await model.SubAdmin2.find({
        _id: req.query.id,
      }).lean();
      return multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.TRUEMSG, subadmin);
    } catch (error) {
      next(error);
    }
  }

  async deleteSubAdmin(req, res, next) {
    try {
      const subadmin = await model.SubAdmin2.remove({
        _id: req.params.id,
      });
      return multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.TRUEMSG, subadmin);
    } catch (error) {
      next(error);
    }
  }

  async createCampaign(req, res, next) {
    try {
      req.body.data = JSON.parse(req.body.data);
      if (req.finalFileName) req.body.data.banner = process.env.S3URL + req.finalFileName;
      const campaign = await model.campaign.create(req.body.data);
      if (campaign) return multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.TRUEMSG, campaign);
      else return multilingualService.sendResponse(req, res, false, 1, 0, responseMessages.TRUEMSG, {});
    } catch (error) {
      next(error);
    }
  }

  async updateCampaign(req, res, next) {
    try {
      req.body.data = JSON.parse(req.body.data);
      if (req.finalFileName) req.body.data.banner = process.env.S3URL + req.finalFileName;
      const campaign = await model.campaign.findByIdAndUpdate(req.params.id, req.body.data, {
        new: true,
      });
      if (campaign) return multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.TRUEMSG, campaign);
      else return multilingualService.sendResponse(req, res, false, 1, 0, responseMessages.TRUEMSG, {});
    } catch (error) {
      next(error);
    }
  }

  async getCampaign(req, res, next) {
    try {
      const campaign = await model.campaign.find({});
      if (campaign) return multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.TRUEMSG, campaign);
      else return multilingualService.sendResponse(req, res, false, 1, 0, responseMessages.TRUEMSG, {});
    } catch (error) {
      next(error);
    }
  }

  async getByIdCampaign(req, res, next) {
    try {
      const campaign = await model.campaign.findById(req.params.id).populate({
        path: "campaignOn.products.productId",
        model: "StoreItem",
      });
      if (campaign) return multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.TRUEMSG, campaign);
      else return multilingualService.sendResponse(req, res, false, 1, 0, responseMessages.TRUEMSG, {});
    } catch (error) {
      next(error);
    }
  }

  async deleteCampaign(req, res, next) {
    try {
      const campaign = await model.campaign.findByIdAndDelete(req.params.id);
      if (campaign) return multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.TRUEMSG, campaign);
      else return multilingualService.sendResponse(req, res, false, 1, 0, responseMessages.TRUEMSG, {});
    } catch (error) {
      next(error);
    }
  }

  async setMarketPriceAndSellingPrice(req, res, next) {
    try {} catch (error) {}
  }
  async findGeofenceId(latitude, longitude) {
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
  async constactUs(req, res, next) {
    try {
      const payload = {
        to: req.body.email,
        text: `${req.body.name} - Contact Us`,
        subject: `${req.body.phone} ${req.body.description}`,
      };
      await MailService.mailer(payload);
      return multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.TRUEMSG, {});
    } catch (err) {
      console.log(err + "************");
      next(err);
    }
  }
  async createDocument(req, res, next) {
    try {
      const document = await model.document.create(req.body);
      if (document) {
        return multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.TRUEMSG, document);
      } else {
        return multilingualService.sendResponse(req, res, false, 1, 0, responseMessages.TRUEMSG, {});
      }
    } catch (error) {
      next(error);
    }
  }
  async updateDocument(req, res, next) {
    try {
      const Document = await model.document.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      if (Document) {
        return multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.TRUEMSG, Document);
      } else {
        return multilingualService.sendResponse(req, res, false, 1, 0, responseMessages.TRUEMSG, {});
      }
    } catch (error) {
      next(error);
    }
  }
  async getDocument(req, res, next) {
    try {
      const userType = req.query.userType;
      const Document = await model.document.find({
        isDeleted: false,
        userType: userType,
      });
      if (Document) {
        return multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.TRUEMSG, Document);
      } else {
        return multilingualService.sendResponse(req, res, false, 1, 0, responseMessages.TRUEMSG, {});
      }
    } catch (error) {
      next(error);
    }
  }
  async getByIdDocument(req, res, next) {
    try {
      const Document = await model.document.findById(req.params.id);
      if (Document) {
        return multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.TRUEMSG, Document);
      } else {
        return multilingualService.sendResponse(req, res, false, 1, 0, responseMessages.TRUEMSG, {});
      }
    } catch (error) {
      next(error);
    }
  }
  async deleteDocument(req, res, next) {
    try {
      const document = await model.document.findOneAndUpdate({
        _id: mongoose.Types.ObjectId(req.params.id),
      }, {
        $set: {
          isDeleted: true,
        },
      }, {
        new: true,
      });
      if (document) {
        return multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.TRUEMSG, document);
      } else {
        return multilingualService.sendResponse(req, res, false, 1, 0, responseMessages.TRUEMSG, {});
      }
    } catch (error) {
      next(error);
    }
  }
  async getAllUsersCSV(req, res, next) {
    // let lang = req.headers.language || "en";
    try {
      const fileName = "user.csv";
      const fileUrl = "server/uploads/users/" + fileName;
      const writableStream = fs.createWriteStream(fileUrl);
      let geofenceId = req.headers.geofenceid != "NA" ? req.headers.geofenceid : null;

      let filter = {};
      filter.$and = [{
          status: {
            $ne: 2,
          },
        },
        {
          status: {
            $ne: 5,
          },
        },
      ];
      if (req.query.search && req.query.search != "") {
        let [firstName, lastName] = req.query.search.split(" ");
        if (!lastName) {
          filter.$or = [{
              firstName: new RegExp(req.query.search, "i"),
            },
            {
              lastName: new RegExp(req.query.search, "i"),
            },
            {
              email: new RegExp(req.query.search, "i"),
            },
            {
              phone: new RegExp(req.query.search, "i"),
            },
          ];
        } else {
          filter.$and = [{
              firstName: new RegExp(firstName, "i"),
            },
            {
              lastName: new RegExp(lastName, "i"),
            },
          ];
        }
      }

      if (geofenceId != null) {
        filter.geofenceId = mongoose.Types.ObjectId(geofenceId);
      }
      if (req.query.isPending) {
        filter.geofenceId = null;
      }
      let userList = await model.user
        .aggregate([{
            $match: filter,
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
        ])
        .cursor({})
        .exec();
      let header = `No., Name , Email , Phone , Joining Date, Accepted Booking, Cancelled Booking, Ongoing Booking, Completed Booking\n`;
      writableStream.write(header);
      userList
        .pipe(
          es.map(async (data, callback) => {
            let acceptBookingCount = await model.storeOrder.countDocuments({
              userId: data._id,
              status: 1,
            });
            let cancelBookingCount = await model.storeOrder.countDocuments({
              userId: data._id,
              status: 14,
            });
            let ongoingBookingCount = await model.storeOrder.countDocuments({
              userId: data._id,
              status: {
                $in: [8, 2, 3, 7],
              },
            });
            let completeBookingCount = await model.storeOrder.countDocuments({
              userId: data._id,
              status: 4,
            });
            let line = `${JSON.stringify(
              (data.lastName ? data.firstName + "" : data.firstName ? data.firstName : "") + (data.lastName ? data.lastName : "")
            )}, ${data.email ? data.email : ""},${JSON.stringify(
              (data.phone ? data.countryCode + "-" : data.countryCode ? data.countryCode : "") + (data.phone ? data.phone : "")
            )}, ${data.createdAt ? moment(new Date(moment(data.createdAt).subtract(630, "minute"))).format("DD-MMM-YYYY") : ""}, ${acceptBookingCount ? acceptBookingCount : 0
              }, ${cancelBookingCount ? cancelBookingCount : 0}, ${ongoingBookingCount ? ongoingBookingCount : 0}, ${completeBookingCount ? completeBookingCount : 0
              }`;
            return callback(null, `${line}\n`);
          })
        )
        .pipe(writableStream);

      userList.on("end", async () => {
        res.status(200).send({
          code: 200,
          success: true,
          message: "",
          data: {
            redirection: process.env.BASE_URL + "/static/users/" + fileName,
          },
        });
      });
    } catch (error) {
      console.log(error + "<<<<<<<<<<<<<");
      next(error);
    }
  }
  async getAllMarchantsCSV(req, res, next) {
    let lang = req.headers.language || "en";
    try {
      const fileName = "store.csv";
      const fileUrl = "server/uploads/stores/" + fileName;
      const writableStream = fs.createWriteStream(fileUrl);
      let geofenceId = req.headers.geofenceid != "NA" ? req.headers.geofenceid : null;

      const filter = {};
      filter.$and = [{
        status: {
          $ne: 2,
        },
      }, ];
      let count = 0;
      if (geofenceId != null) {
        filter.geofenceId = mongoose.Types.ObjectId(geofenceId);
      }
      if (req.body.isPending) {
        filter.geofenceId = null;
      }
      if (req.query.moduleKey) {
        filter.moduleKey = req.query.moduleKey;
      }
      let marchantList = await model.store
        .aggregate([{
            $match: filter,
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
        ])
        .cursor({})
        .exec();
      let header = `No., Name , Email , Phone , Joining Date, Accepted Booking, Cancelled Booking, Ongoing Booking, Completed Booking\n`;
      writableStream.write(header);

      marchantList
        .pipe(
          es.map(async (data, callback) => {
            let acceptBookingCount = await model.storeOrder.countDocuments({
              storeId: data._id,
              status: 1,
            });
            let cancelBookingCount = await model.storeOrder.countDocuments({
              storeId: data._id,
              status: 14,
            });
            let ongoingBookingCount = await model.storeOrder.countDocuments({
              storeId: data._id,
              status: {
                $in: [8, 2, 3, 7],
              },
            });
            let completeBookingCount = await model.storeOrder.countDocuments({
              storeId: data._id,
              status: 4,
            });
            let line = `${data.name ? data.name : ""}, ${data.email ? data.email : ""},${JSON.stringify(
              (data.phone_no ? data.country_code + "-" : data.country_code ? data.country_code : "") + (data.phone_no ? data.phone_no : "")
            )}, ${data.createdAt ? moment(new Date(moment(data.createdAt).subtract(630, "minute"))).format("DD-MMM-YYYY") : ""}, ${acceptBookingCount ? acceptBookingCount : 0
              }, ${cancelBookingCount ? cancelBookingCount : 0}, ${ongoingBookingCount ? ongoingBookingCount : 0}, ${completeBookingCount ? completeBookingCount : 0
              }`;
            return callback(null, `${++count},${line}\n`);
          })
        )
        .pipe(writableStream);

      marchantList.on("end", async () => {
        res.status(200).send({
          code: 200,
          success: true,
          message: "",
          data: {
            redirection: process.env.BASE_URL + "/static/stores/" + fileName,
          },
        });
      });
    } catch (error) {
      next(error);
    }
  }
  async getAllOrdersCSV(req, res, next) {
    let lang = req.headers.language || "en";
    try {
      const fileName = "order.csv";
      const fileUrl = "server/uploads/stores/" + fileName;
      const writableStream = fs.createWriteStream(fileUrl);

      let geofenceId = req.headers.geofenceid != "NA" ? req.headers.geofenceid : null;
		
      let qry = {
        $and: [],
      };

      let count = 0;
      if (req.body.storeId) {
        qry["$and"].push({
          storeId: mongoose.Types.ObjectId(req.body.storeId),
        });
      }
      if (geofenceId != null) {
        qry["$and"].push({
          geofenceId: mongoose.Types.ObjectId(geofenceId),
        });
      }
      let orderList = await model.storeOrder
        .aggregate([{
            $lookup: {
              from: "stores",
              localField: "storeId",
              foreignField: "_id",
              as: "storeId",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "userId",
            },
          },
//          {
//            $lookup: {
//              from: "drivers",
//              localField: "driverId",
//              foreignField: "_id",
//              as: "driverId",
//            },
 //         },
          {
            $unwind: {
              path: "$storeId",
            },
          },
          {
            $unwind: {
              path: "$userId",
            },
          },
//          {
//            $unwind: {
//              path: "$driverId",
//            },
//          },

          {
            $sort: {
              createdAt: -1,
            },
          },
        ])
        .cursor({})
        .exec();//Driver Name, Driver Phone No, 
	        let header = `No., Marchant Name , Booking Details, Booking Type , Customer Name ,Customer Phone No., OrderNo, Payment Mode, Driver Name, Driver Phone No, deliveryFee, serviceFee, totalDiscount, tax, totalTax, packingCharge, subTotalAmount, totalAmount,  \n`;
      writableStream.write(header);
      //if(orderListAll.length > 0)
      orderList
        .pipe(
          es.map(async (data, callback) => {
            let driverName;
            let driverPhone;
            if (data.driverId) {
              let driverResult = await model.driver
                .find({ _id: data.driverId })
                .exec();
              driverName =
                driverResult[0].firstName + " " + driverResult[0].lastName;
              driverPhone =
                (driverResult[0].phone
                  ? driverResult[0].countryCode + "-"
                  : driverResult[0].countryCode
                  ? driverResult[0].countryCode
                  : "") + (driverResult[0].phone ? driverResult[0].phone : "");
            }

            let acceptBookingCount = await model.storeOrder.countDocuments({
              _id: data._id,
              status: 1,
            });
            let cancelBookingCount = await model.storeOrder.countDocuments({
              _id: data._id,
              status: 14,
            });
            let ongoingBookingCount = await model.storeOrder.countDocuments({
              _id: data._id,
              status: {
                $in: [8, 2, 3, 7],
              },
            });
            let completeBookingCount = await model.storeOrder.countDocuments({
              _id: data._id,
              status: 4,
            });

            let line = `${data.storeId.name ? data.storeId.name : ""},${
              data.createdAt
                ? moment(
                    new Date(moment(data.createdAt).subtract(630, "minute"))
                  ).format("DD-MMM-YYYY")
                : ""
            },${data.scheduleType ? data.scheduleType : ""},${JSON.stringify(
              (data.userId.lastName
                ? data.userId.firstName + ""
                : data.userId.firstName
                ? data.userId.firstName
                : "") + (data.userId.lastName ? data.userId.lastName : "")
            )},${JSON.stringify(
              (data.userId.phone
                ? data.userId.countryCode + "-"
                : data.userId.countryCode
                ? data.userId.countryCode
                : "") + (data.userId.phone ? data.userId.phone : "")
            )},${JSON.stringify(data.orderNumber ? data.orderNumber : "")},${JSON.stringify(data.paymentMode)},${
              driverName ? driverName.trim() : ""
            },${driverPhone ? driverPhone.trim() : ""},${JSON.stringify(
              data.deliveryFee ? data.deliveryFee : 0
            )},${JSON.stringify(
              data.serviceFee ? data.serviceFee : 0
            )},${JSON.stringify(
              data.totalDiscount ? data.totalDiscount : 0
            )},${JSON.stringify(data.tax ? data.tax : 0)},${JSON.stringify(
              data.totalTax ? data.totalTax : 0
            )},${JSON.stringify(
              data.packingCharge ? data.packingCharge : 0
            )},${JSON.stringify(
              data.subTotalAmount ? data.subTotalAmount : 0
            )},${JSON.stringify(data.totalAmount ? data.totalAmount : 0)}`;
            console.log("Line", line);
            return callback(null, `${++count},${line}\n`);
          })
        )
        .pipe(writableStream);
      orderList.on("end", async () => {
        res.status(200).send({
          code: 200,
          success: true,
          message: "",
          data: {
            redirection: process.env.BASE_URL + "/static/stores/" + fileName,
          },
        });
      });
    } catch (e) {
      console.log(e.message + "<<<<<<<<<<<<<");
      console.log(e);
    }
  }

  async addLanguage(req, res, next) {
    const lang = req.headers.language || "en";
    try {
      let plan;
      if (req.body.languageName == "ENGLISH") {
        plan = await model.Language.create(req.body);
      } else {
        //backend message
        const getBackendData = await model.Language.findOne({
          languageName: "ENGLISH",
          languageFor: "BACKEND",
        }).lean();
        req.body.language = getBackendData.language;
        req.body.languageFor = "BACKEND";
        req.body.language.map(function (x) {
          x.value = "";
          return x;
        });
        await model.Language.create(req.body);
        //admin
        const getAdminData = await model.Language.findOne({
          languageName: "ENGLISH",
          languageFor: "ADMIN",
        }).lean();
        req.body.language = getBackendData.language;
        req.body.languageFor = "ADMIN";
        req.body.language.map(function (x) {
          x.value = "";
          return x;
        });
        await model.Language.create(req.body);
        //merchant
        const getMerchantData = await model.Language.findOne({
          languageName: "ENGLISH",
          languageFor: "MERCHANT",
        }).lean();
        req.body.language = getBackendData.language;
        req.body.languageFor = "MERCHANT";
        req.body.language.map(function (x) {
          x.value = "";
          return x;
        });
        await model.Language.create(req.body);
        //driverApp
        const getDriverAppData = await model.Language.findOne({
          languageName: "ENGLISH",
          languageFor: "DRIVERAPP",
        }).lean();
        req.body.language = getBackendData.language;
        req.body.languageFor = "DRIVERAPP";
        req.body.language.map(function (x) {
          x.value = "";
          return x;
        });
        await model.Language.create(req.body);
        //ENGLISH
        const getCustomerAppData = await model.Language.findOne({
          languageName: "ENGLISH",
          languageFor: "CUSTOMERAPP",
        }).lean();
        req.body.language = getBackendData.language;
        req.body.languageFor = "CUSTOMERAPP";
        req.body.language.map(function (x) {
          x.value = "";
          return x;
        });
        await model.Language.create(req.body);
      }
      return res.send({
        message: multilingualService.getResponseMessage("ADDMSG", lang),
        data: plan,
        status: Constant.SUCCESSCODE,
        success: true,
      });
    } catch (error) {
      return res.send({
        message: error,
        data: {},
        status: Constant.ERRORCODE,
        success: false,
      });
    }
  }
  async editLanguage(req, res, next) {
    const lang = req.headers.language || "en";
    try {
      const data = req.body;
      for (const key in data) {
        if (key != "languageFor") {
          await model.Language.findOneAndUpdate({
            languageFor: req.body.languageFor,
            languageName: key,
          }, {
            language: data[key],
          }, {
            new: true,
          });
        }
      }
      return res.send({
        message: multilingualService.getResponseMessage("UPDATEMSG", lang),
        data: {},
        status: Constant.SUCCESSCODE,
        success: true,
      });
    } catch (error) {
      next(error);
      return res.status(400).send({
        message: error,
        data: {},
        status: Constant.ERRORCODE,
        success: false,
      });
    }
  }
  async getAllLanguage(req, res, next) {
    const lang = req.headers.language || "en";
    let dataToSend = {};
    let criteria = {
      languageFor: req.query.languageFor,
    };
    const getLanguage = await model.Language.find({
      languageFor: req.query.languageFor,
    }).sort({
      createdAt: -1,
    });
    for (let i = 0; i < getLanguage.length; i++) {
      var key = getLanguage[i].languageName;
      dataToSend[key] = getLanguage[i].language;
    }
    // const uniqueLanguage = await model.Language.find(criteria).distinct("languageName").sort({
    //   createdAt: 1
    // })
    // // await model.Language.distinct("languageName", criteria);
    // for (let i = 0; i < uniqueLanguage.length; i++) {
    //   var key = uniqueLanguage[i];
    //   let dataKey = await model.Language.findOne({
    //     languageFor: req.query.languageFor,
    //     languageName: uniqueLanguage[i]
    //   }, {
    //     "language.key": 1,
    //     "language.value": 1,
    //     _id: 0
    //   });

    //   dataToSend[key] = dataKey.language;
    // }
    JSON.stringify(dataToSend);
    return res.send({
      message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
      data: dataToSend,
    });
  }
  async getAllLanguageByType(req, res, next) {
    const lang = req.headers.language || "en";
    let dataToSend = [];
    let criteria = {
      languageFor: req.query.languageFor,
      languageName: req.query.languageName,
    };
    const getLanguage = await model.Language.findOne(criteria);
    if (getLanguage != null) {
      for (const i of getLanguage.language) {
        let key = [`${i.key}`, `${i.value}`];
        dataToSend.push(key);
      }
    }
    const entries = new Map(dataToSend);
    const obj = Object.fromEntries(entries);
    return res.send({
      message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
      data: obj,
    });
  }
  async addMembershipPlan(req, res, next) {
    const lang = req.headers.language || "en";
    let planData = await model.Membership.findOne({
      name: /* new RegExp("^" + req.body.name + "$", "i") */ req.body.name,
    });
    const store = req.body.storeId;
    const driver = req.body.driverId;
    const user = req.body.userId;
    if (planData) {
      return res.status(400).send({
        message: multilingualService.getResponseMessage("ALREADYEXISTS", lang),
        data: {},
        status: Constant.ERRORCODE,
        success: false,
      });
    }
    if (store != null && store.length > 0) {
      let checkDuplicateStore = await model.Membership.findOne({
        storeId: {
          $in: store,
        },
        isDeleted: false,
      });
      if (checkDuplicateStore) {
        return res.status(400).send({
          message: multilingualService.getResponseMessage("STOREEXISTS", lang),
          data: {},
          status: Constant.ERRORCODE,
          success: falses,
        });
      }
    }
    if (driver != null && driver.length > 0) {
      let checkDuplicateDriver = await model.Membership.findOne({
        driverId: {
          $in: driver,
        },
        isDeleted: false,
      });
      if (checkDuplicateDriver) {
        return res.status(400).send({
          message: multilingualService.getResponseMessage("DRIVEREXIST", lang),
          data: {},
          status: Constant.ERRORCODE,
          success: false,
        });
      }
    }
    if (user != null && user.length > 0) {
      let checkDuplicateUser = await model.Membership.findOne({
        userId: {
          $in: user,
        },
        isDeleted: false,
      });
      if (checkDuplicateUser) {
        return res.status(400).send({
          message: multilingualService.getResponseMessage("USEREXIST", lang),
          data: {},
          status: Constant.ERRORCODE,
          success: false,
        });
      }
    }

    let plan = await model.Membership.create(req.body);
    return res.send({
      message: multilingualService.getResponseMessage("ADDMSG", lang),
      data: plan,
      status: Constant.SUCCESSCODE,
      success: true,
    });
  }
  async editMembershipPlan(req, res, next) {
    const lang = req.headers.language || "en";
    if (req.body.name) {
      let bannerData = await model.Membership.findOne({
        _id: {
          $nin: [ObjectId(req.body.membershipId)],
        },
        name: req.body.name,
      });
      if (bannerData)
        return res.status(400).send({
          message: multilingualService.getResponseMessage("ALREADYEXISTS", lang),
          data: {},
          status: Constant.ERRORCODE,
          success: false,
        });
    }

    const result = await model.Membership.findOneAndUpdate({
      _id: ObjectId(req.body.membershipId),
    }, {
      $set: req.body,
    }, {
      new: true,
    });
    return res.send({
      message: multilingualService.getResponseMessage("UPDATEMSG", lang),
      data: result,
      status: Constant.SUCCESSCODE,
      success: true,
    });
  }
  async getAllMembershipPlan(req, res, next) {
    const lang = req.headers.language || "en";
    let page = req.query.page;
    let limit = req.query.limit || 10;
    let criteria = {
      isDeleted: false,
    };
    if (req.query.planType && req.query.planType != "") {
      criteria.planType = req.query.planType;
    }
    if (req.query.moduleKey && req.query.moduleKey != "") {
      criteria.moduleKey = req.query.moduleKey;
    }
    if (req.query.search && req.query.search != "") {
      criteria.$or = [{
        name: {
          $regex: req.query.search,
          $options: "i",
        },
      }, ];
    }
    const count = await model.Membership.countDocuments(criteria);
    const result = await model.Membership.find(criteria)
      .limit(limit)
      .skip(page * limit)
      .sort({
        createdAt: -1,
      });
    return res.send({
      message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
      data: {
        list: result,
        count: count,
        limit: 10,
      },
    });
  }
  async getMembershipPlanById(req, res, next) {
    const lang = req.headers.language || "en";
    let result = await model.Membership.findById(req.params.id).populate("storeId").populate("driverId").populate("userId");
    return res.send({
      message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
      data: result,
    });
  }
  async deleteMembershipPlan(req, res, next) {
    const lang = req.headers.language || "en";
    await model.Membership.findOneAndUpdate({
      _id: req.body.membershipId,
    }, {
      isDeleted: true,
    });
    return res.send({
      message: multilingualService.getResponseMessage("DELETEMSG", lang),
      data: {},
    });
  }
  async itemWiseSalesPerAreaReport(req, res, next) {
    try {
      let totalRevenue = 0;
      let adminCommission = 0;
      let merchantCommission = 0;
      let driverCommission = 0;
      let cashRevenue = 0;
      let onlineRevenue = 0;
      let totalTaxAmount = 0;
      let totalPackingAmount = 0;
      let totalDeliveryCharge = 0;
      let totalSalaryDriver = 0;
      let totalUnSalaryDriver = 0;
      let totalSalaryStore = 0;
      let totalUnSalaryStore = 0;
      let lang;
      const data = req.query;
      const data2 = req.body;
      let qry = {};
      if (data.startDate != "null" && data.endDate != "null") {
        qry.createdAt = {
          $gte: new Date(moment(data.startDate).startOf("day")),
          $lte: new Date(moment(data.endDate).endOf("day")),
        };
      } else if (data.startDate != "null" && data.endDate == "null") {
        qry.createdAt = {
          $gte: new Date(moment(data.startDate).startOf("day")),
        };
      } else if (data.startDate == "null" && data.endDate != "null") {
        qry.createdAt = {
          $lte: new Date(moment(data.endDate).endOf("day")),
        };
      }

      qry["location.coordinates"] = {
        $geoWithin: {
          $geometry: {
            type: "Polygon",
            coordinates: data2.geoLongLat.coordinates,
          },
        },
      };
      const pipeline = [{
          $match: qry,
        },
        {
          $lookup: {
            from: "storeitems",
            localField: "items.itemId",
            foreignField: "_id",
            as: "items",
          },
        },
        {
          $unwind: {
            path: "$items",
          },
        },
        {
          $group: {
            _id: "$items._id",
            count: {
              $sum: 1,
            },
            productName: {
              $first: "$items.productName",
            },
            productName_ar: {
              $first: "$items.productName_ar",
            },
            storeItemSubTypeId: {
              $first: "$items.storeItemSubTypeId",
            },
            storeItemTypeId: {
              $first: "$items.storeItemTypeId",
            },
            brandId: {
              $first: "$items.brandId",
            },
            // storeId: { $first: "$productId.storeId" },
            createdAt: {
              $first: "$items.createdAt",
            },
            price: {
              $first: "$items.price",
            },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ];
      const itemData = await model.storeOrder.aggregate(pipeline);
      let totalCashRevenue = await model.storeOrder.aggregate([{
          $match: qry,
        },
        {
          $match: {
            paymentMode: "Cash",
          },
        },
        {
          $group: {
            _id: "_id",
            totalAmount: {
              $sum: "$totalAmount",
            },
          },
        },
      ]);
      let totalOnlineRevenue = await model.storeOrder.aggregate([{
          $match: qry,
        },
        {
          $match: {
            paymentMode: {
              $ne: "Cash",
            },
          },
        },
        {
          $group: {
            _id: "_id",
            totalAmount: {
              $sum: "$totalAmount",
            },
          },
        },
      ]);
      let totalAdminCommission = await model.storeOrder.aggregate([{
          $match: qry,
        },
        {
          $group: {
            _id: "_id",
            totalAmount: {
              $sum: "$adminCommission",
            },
          },
        },
      ]);
      let totalMerchantCommission = await model.storeOrder.aggregate([{
          $match: qry,
        },
        {
          $group: {
            _id: "_id",
            totalAmount: {
              $sum: "$merchantCommission",
            },
          },
        },
      ]);
      let totalTaxAndPackingCharge = await model.storeOrder.aggregate([{
          $match: qry,
        },
        {
          $group: {
            _id: "_id",
            totalTax: {
              $sum: "$tax",
            },
            totalPackingCharge: {
              $sum: "$packingCharge",
            },
            deliveryCharge: {
              $sum: "$deliveryFee",
            },
          },
        },
      ]);

      if (totalCashRevenue.length > 0) {
        cashRevenue = totalCashRevenue[0].totalAmount ? totalCashRevenue[0].totalAmount : 0;
        cashRevenue = Number(cashRevenue.toFixed(2));
      }
      if (totalOnlineRevenue.length > 0) {
        onlineRevenue = totalOnlineRevenue[0].totalAmount ? totalOnlineRevenue[0].totalAmount : 0;
        onlineRevenue = Number(onlineRevenue.toFixed(2));
      }
      if (totalAdminCommission.length > 0) {
        adminCommission = totalAdminCommission[0].totalAmount ? totalAdminCommission[0].totalAmount : 0;
        adminCommission = Number(adminCommission.toFixed(2));
      }
      if (totalMerchantCommission.length > 0) {
        merchantCommission = totalMerchantCommission[0].totalAmount ? totalMerchantCommission[0].totalAmount : 0;
        merchantCommission = Number(merchantCommission.toFixed(2));
      }
      if (totalTaxAndPackingCharge.length > 0) {
        totalTaxAmount = totalTaxAndPackingCharge[0].totalTax ? totalTaxAndPackingCharge[0].totalTax : 0;
        totalTaxAmount = Number(totalTaxAmount.toFixed(2));
        totalPackingAmount = totalTaxAndPackingCharge[0].totalPackingCharge ? totalTaxAndPackingCharge[0].totalPackingCharge : 0;
        totalPackingAmount = Number(totalPackingAmount.toFixed(2));
        totalDeliveryCharge = totalTaxAndPackingCharge[0].deliveryCharge ? totalTaxAndPackingCharge[0].deliveryCharge : 0;
        totalDeliveryCharge = Number(totalDeliveryCharge.toFixed(2));
      }
      let totalOrder = await model.storeOrder.countDocuments(qry);

      const orders = await model.storeOrder.aggregate([{
          $match: qry,
        },
        {
          $group: {
            _id: "$_id",
            sale: {
              $first: "$totalAmount",
            },
            orderNumber: {
              $first: "$orderNumber",
            },
          },
        },
      ]);
      const storeData = await model.storeOrder.aggregate([{
          $match: qry,
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
          $unwind: {
            path: "$storeId",
          },
        },
        {
          $group: {
            _id: "$storeId._id",
            sale: {
              $sum: "$totalAmount",
            },
            count: {
              $sum: 1,
            },
            name: {
              $first: "$storeId.name",
            },
            storePackageType: {
              $first: "$storeId.storePackageType",
            },
            storePackageTypeValue: {
              $first: "$storeId.storePackageTypeValue",
            },
            commission: {
              $sum: {
                $switch: {
                  branches: [{
                      case: {
                        $eq: ["$storeId.storePackageType", "flat"],
                      },
                      then: {
                        $divide: ["$storeId.storePackageTypeValue", 30],
                      },
                    },
                    {
                      case: {
                        $eq: ["$storeId.storePackageType", "percentage"],
                      },
                      then: {
                        $multiply: [{
                            $divide: ["$subTotalAmount", 100],
                          },
                          "$storeId.storePackageTypeValue",
                        ],
                      },
                    },
                    {
                      case: {
                        $eq: ["$storeId.storePackageType", "membership"],
                      },
                      then: 0,
                    },
                  ],
                  default: 0,
                },
              },
            },
          },
        },
      ]);
      const category = await model.storeOrder.aggregate([{
          $match: qry,
        },
        {
          $lookup: {
            from: "storeitems",
            localField: "items.itemId",
            foreignField: "_id",
            as: "items",
          },
        },
        {
          $unwind: {
            path: "$items",
          },
        },
        {
          $lookup: {
            from: "storeitemtypes",
            localField: "items.storeItemTypeId",
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
          $group: {
            _id: "$items.storeItemTypeId",
            count: {
              $sum: 1,
            },
            sale: {
              $sum: "$totalAmount",
            },
            name: {
              $first: "$storeItemTypeId.name",
            },
          },
        },
      ]);
      const subCategory = await model.storeOrder.aggregate([{
          $match: qry,
        },
        {
          $lookup: {
            from: "storeitems",
            localField: "items.itemId",
            foreignField: "_id",
            as: "items",
          },
        },
        {
          $unwind: {
            path: "$items",
          },
        },
        {
          $lookup: {
            from: "storeitemtypes",
            localField: "items.storeItemSubTypeId",
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
          $group: {
            _id: "$items.storeItemSubTypeId",
            count: {
              $sum: 1,
            },
            sale: {
              $sum: "$totalAmount",
            },
            name: {
              $first: "$storeItemSubTypeId.name",
            },
          },
        },
      ]);
      const storeType = await model.storeOrder.aggregate([{
          $match: qry,
        },
        {
          $lookup: {
            from: "storeitems",
            localField: "items.itemId",
            foreignField: "_id",
            as: "items",
          },
        },
        {
          $unwind: {
            path: "$items",
          },
        },
        {
          $lookup: {
            from: "storecategories",
            localField: "items.storeTypeId",
            foreignField: "_id",
            as: "storeTypeId",
          },
        },
        {
          $unwind: {
            path: "$storeTypeId",
          },
        },
        {
          $group: {
            _id: "$items.storeTypeId",
            count: {
              $sum: 1,
            },
            sale: {
              $sum: "$totalAmount",
            },
            name: {
              $first: "$storeTypeId.name",
            },
          },
        },
      ]);
      delete qry["location.coordinates"];
      const driverData = await model.storeOrder.aggregate([{
          $match: qry,
        },
        {
          $lookup: {
            from: "drivers",
            localField: "driverId",
            foreignField: "_id",
            as: "drivers",
          },
        },
        {
          $unwind: {
            path: "$drivers",
          },
        },
        {
          $group: {
            _id: "$drivers._id",
            count: {
              $sum: 1,
            },
            commission: {
              $sum: {
                $cond: {
                  if: {
                    $eq: ["$drivers.commissionType", "Salaried"],
                  },
                  then: {
                    $divide: ["$drivers.commission", 30],
                  },
                  else: "$drivers.commission",
                },
              },
            },
            firstName: {
              $first: "$drivers.firstName",
            },
            lastName: {
              $first: "$drivers.lastName",
            },
            commissionType: {
              $first: "$drivers.commissionType",
            },
          },
        },
      ]);
      if (driverData.length > 0) {
        for (const i of driverData) {
          if (i.commissionType == "Salaried") {
            totalSalaryDriver += i.commission;
          } else {
            totalUnSalaryDriver += i.commission;
          }
          driverCommission += i.commission;
        }
        driverCommission = Number(driverCommission.toFixed(2));
        totalSalaryDriver = Number(totalSalaryDriver.toFixed(2));
        totalUnSalaryDriver = Number(totalUnSalaryDriver.toFixed(2));
      }
      if (storeData.length > 0) {
        for (const i of storeData) {
          if (i.storePackageType == "flat") {
            totalSalaryStore += i.commission;
          } else if (i.storePackageType == "percentage") {
            totalUnSalaryStore += i.commission;
          }
        }
        totalSalaryStore = Number(totalSalaryStore.toFixed(2));
        totalUnSalaryStore = Number(totalUnSalaryStore.toFixed(2));
      }
      let totalServiceCharge =
        totalTaxAmount + totalPackingAmount + totalDeliveryCharge > 0 ? totalTaxAmount + totalPackingAmount + totalDeliveryCharge : 0;
      totalRevenue = Number((cashRevenue + onlineRevenue + totalServiceCharge).toFixed(2));
      let adminRevenue = Number(totalRevenue - merchantCommission - driverCommission) > 0 ? totalRevenue - merchantCommission - driverCommission : 0;
      adminRevenue = Number(adminRevenue.toFixed(2));
      const sendData = {
        totalRevenue,
        cashRevenue,
        onlineRevenue,
        adminCommission,
        merchantCommission,
        driverCommission,
        totalOrder,
        itemData,
        orders,
        storeData,
        category,
        subCategory,
        storeType,
        driverData,
        totalTaxAmount,
        totalPackingAmount,
        totalServiceCharge,
        totalSalaryDriver,
        totalUnSalaryDriver,
        totalDeliveryCharge,
        adminRevenue,
        totalSalaryStore,
        totalUnSalaryStore,
      };
      return res.send({
        message: multilingualService.getResponseMessage("TRUEMSG", lang),
        data: sendData,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }
  async getAllDriverCSV(req, res, next) {
    let lang = req.headers.language || "en";
    try {
      let data = req.query;
      let count = 0;
      const fileName = "driver.csv";
      const fileUrl = "server/uploads/users/" + fileName;
      const writableStream = fs.createWriteStream(fileUrl);
      let geofenceId = req.headers.geofenceid != "NA" ? req.headers.geofenceid : null;
      const filter = {};
      data.name = data.search;
      if (data.name && data.name != "") {
        let [firstName, lastName] = data.name.split(" ");
        if (!lastName) {
          filter.$or = [{
              firstName: new RegExp(data.name, "i"),
            },
            {
              lastName: new RegExp(data.name, "i"),
            },
            {
              email: new RegExp(data.name, "i"),
            },
            {
              phone: new RegExp(data.name, "i"),
            },
          ];
        } else {
          filter.$and = [{
              firstName: new RegExp(firstName, "i"),
            },
            {
              lastName: new RegExp(lastName, "i"),
            },
          ];
        }
      }
      if ((data.isPending == "true" || data.isPending == true) && req.headers.geofenceid != "NA") {
        filter.$or = [{
            geofenceId: null,
          },
          {
            profileStatus: 0,
          },
          {
            moduleType: [],
          },
        ];
      } else if ((data.isPending == "false" || data.isPending == false) && req.headers.geofenceid != "NA") {
        if (geofenceId != null) {
          filter.$or = [{
              geofenceId: mongoose.Types.ObjectId(geofenceId),
            },
            {
              profileStatus: 1,
            },
            {
              moduleType: {
                $ne: [],
              },
            },
          ];
        } else
          filter.geofenceId = {
            $ne: null,
          };
      } else if ((data.isPending == "false" || data.isPending == false) && req.headers.geofenceid == "NA") {
        filter.$and = [{
            profileStatus: 1,
          },
          {
            moduleType: {
              $ne: [],
            },
          },
        ];
      } else {
        filter.$or = [{
            profileStatus: 0,
          },
          {
            moduleType: [],
          },
        ];
      }
      let userList = await model.driver
        .aggregate([{
            $match: filter,
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
        ])
        .cursor({})
        .exec();
      let header = `Name , Email , Phone , Joining Date, Accepted Booking, Cancelled Booking, Ongoing Booking, Completed Booking\n`;
      writableStream.write(header);

      userList
        .pipe(
          es.map(async (data, callback) => {
            let acceptBookingCount = await model.storeOrder.countDocuments({
              driverId: data._id,
              status: 1,
            });
            let cancelBookingCount = await model.storeOrder.countDocuments({
              driverId: data._id,
              status: 14,
            });
            let ongoingBookingCount = await model.storeOrder.countDocuments({
              driverId: data._id,
              status: {
                $in: [8, 2, 3, 7],
              },
            });
            let completeBookingCount = await model.storeOrder.countDocuments({
              driverId: data._id,
              status: 4,
            });
            let line = `${JSON.stringify(
              (data.lastName ? data.firstName + "" : data.firstName ? data.firstName : "") + (data.lastName ? data.lastName : "")
            )}, ${data.email ? data.email : ""},${JSON.stringify(
              (data.phone ? data.countryCode + "-" : data.countryCode ? data.countryCode : "") + (data.phone ? data.phone : "")
            )}, ${data.createdAt ? moment(new Date(moment(data.createdAt).subtract(630, "minute"))).format("DD-MMM-YYYY") : ""}, ${acceptBookingCount ? acceptBookingCount : 0
              }, ${cancelBookingCount ? cancelBookingCount : 0}, ${ongoingBookingCount ? ongoingBookingCount : 0}, ${completeBookingCount ? completeBookingCount : 0
              }`;
            return callback(null, `${line}\n`);
          })
        )
        .pipe(writableStream);

      userList.on("end", async () => {
        res.status(200).send({
          code: 200,
          success: true,
          message: "",
          data: {
            redirection: process.env.BASE_URL + "/static/users/" + fileName,
          },
        });
      });
    } catch (error) {
      next(error);
    }
  }
  async getNotication(req, res, next) {
    try {
      let noti = await model.sendNotification.find({});
      if (noti.length == 0) {
        noti = await model.sendNotification.create({});
      }
      return res.send({
        message: multilingualService.getResponseMessage("TRUEMSG", ""),
        data: noti,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }
  async editNotification(req, res, next) {
    try {
      let noti = await model.sendNotification.findByIdAndUpdate(req.body.id, req.body, {
        new: true,
      });
      return res.send({
        message: multilingualService.getResponseMessage("TRUEMSG", ""),
        data: noti,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }
  async getRevenue(req, res, next) {
    const lang = req.headers.language || "en";
    let page = Number(req.query.page) - 1 || 0;
    let limit = req.query.limit || 10;
    let criteria = {
      isDeleted: false,
    };
    if (req.query.search && req.query.search != "") {
      criteria.$or = [{
        name: {
          $regex: req.query.search,
          $options: "i",
        },
      }, ];
    }
    const count = await model.Membership.countDocuments(criteria);
    const result = await model.Membership.find(criteria)
      .limit(limit)
      .skip(page * limit)
      .sort({
        createdAt: -1,
      });
    return res.send({
      message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
      data: {
        list: result,
        count: count,
        limit: 10,
      },
    });
  }
  async manageReferral(req, res, next) {
    try {
      const referral = await model.Referral.findOneAndUpdate({
        referalName: req.body.referalName,
      }, {
        $set: req.body,
      }, {
        upsert: true,
        setDefaultsOnInsert: true,
        new: true,
      });
      return res.send({
        message: multilingualService.getResponseMessage("TRUEMSG", ""),
        data: referral,
      });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
  async getAllReferal(req, res, next) {
    try {
      const referral = await model.Referral.find({});

      return res.send({
        message: multilingualService.getResponseMessage("TRUEMSG", ""),
        data: referral,
      });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
  async getReferalById(req, res, next) {
    try {
      const referral = await model.Referral.findOne({
        _id: req.query.id,
      });

      return res.send({
        message: multilingualService.getResponseMessage("TRUEMSG", ""),
        data: referral,
      });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }
  async getPreference(req, res, next) {
    try {
      const lang = req.headers.language || "en";
      let page = Number(req.query.page) - 1 || 0;
      let limit = Number(req.query.limit) || 10;

      let prefrenceData = await model.Preference.find()
        .limit(limit)
        .skip(page * limit);

      if (prefrenceData) {
        return res.send({
          message: multilingualService.getResponseMessage("TRUEMSG", ""),
          data: prefrenceData,
        });
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
  async preference(req, res, next) {
    try {
      const lang = req.headers.language || "en";
      let prefrenceData = await model.Preference.findOneAndUpdate({}, {
        $set: req.body,
      }, {
        upsert: true,
        setDefaultsOnInsert: true,
        new: true,
      });
      if (prefrenceData) {
        return res.send({
          message: multilingualService.getResponseMessage("TRUEMSG", lang),
          data: prefrenceData,
        });
      }
    } catch (error) {
      next(error);
    }
  }
  async manageSeo(req, res, next) {
    try {
      const referral = await model.seo.findOneAndUpdate({}, {
        $set: req.body,
      }, {
        upsert: true,
        setDefaultsOnInsert: true,
        new: true,
      });
      return res.send({
        status:200,
        message: multilingualService.getResponseMessage("TRUEMSG", ""),
        data: referral,
      });
    } catch (e) {
      console.log(err);
      next(err);
    }
  }
  async getSeo(req, res, next) {
    try {
      const seoData = await model.seo.findOne({});
      return res.send({
        status:200,
        message: multilingualService.getResponseMessage("TRUEMSG", ""),
        data: seoData,
      });
    } catch (e) {
      console.log(err);
      next(err);
    }
  }

  async manageNotification(req, res, next) {
    try {
      const lang = req.headers.language || "en";
      if (req.query.notification == "customerNotification") {
        let customerNotification = await model.customerNotification.findOneAndUpdate({}, {
          $set: req.body,
        }, {
          upsert: true,
          setDefaultsOnInsert: true,
          new: true,
        });

        //console.log("customerNotification========",customerNotification)
        if (customerNotification) {
          return res.send({
            message: multilingualService.getResponseMessage("TRUEMSG", lang),
            data: customerNotification,
          });
        }
      }
      if (req.query.notification == "merchantNotification") {
        let merchantNotification = await model.merchantNotification.findOneAndUpdate({}, {
          $set: req.body,
        }, {
          upsert: true,
          setDefaultsOnInsert: true,
          new: true,
        });
        if (merchantNotification) {
          return res.send({
            message: multilingualService.getResponseMessage("TRUEMSG", lang),
            data: merchantNotification,
          });
        }
      }
      if (req.query.notification == "setReminder") {
        let setReminder = await model.setReminder.findOneAndUpdate({}, {
          $set: req.body,
        }, {
          upsert: true,
          setDefaultOnInsert: true,
          new: true,
        });
        if (setReminder) {
          return res.send({
            message: multilingualService.getResponseMessage("TRUEMSG", lang),
            data: setReminder,
          });
        }
      }
    } catch (e) {
      console.log(err);
      next(err);
    }
  }

  async getNotification(req, res, next) {
    try {
      const lang = req.headers.language || "en";
      let data = {};
      const customerNotification = await model.customerNotification.findOne({});
      const merchantNotification = await model.merchantNotification.findOne({});
      const setReminder = await model.setReminder.findOne({});
      data.customerNotification = customerNotification;
      data.merchantNotification = merchantNotification;
      data.setReminder = setReminder;
      data.notificationSound = merchantNotification.notificationSound;
      return res.send({
        message: multilingualService.getResponseMessage("TRUEMSG", lang),
        data: data,
      });
    } catch (e) {
      console.log(e);
      next(e);
    }
  }

  async getPayHistory(req, res, next) {
    let history;
    const lang = req.headers.language || "en";
    if(req.query.type == "salseperson"){
      history = await model.payHistory.find({payTo : req.query.type, salesPersonId: mongoose.Types.ObjectId(req.query.id)})
    }
    if(req.query.type == "driver"){
      history = await model.payHistory.find({payTo : req.query.type, driverId: mongoose.Types.ObjectId(req.query.id)})
    }
    if(req.query.type == "merchant"){
      history = await model.payHistory.find({payTo : req.query.type, merchantId: mongoose.Types.ObjectId(req.query.id)})
    }
     return res.send({
        message: multilingualService.getResponseMessage("TRUEMSG",lang),
        data: history,
        success : true
    });

  }
}

export default adminController;
