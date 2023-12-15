import dotenv from "dotenv";
dotenv.config();
require("dotenv").config();
const fs = require("fs");
import model from "../../../models/index";
import Constant from "../../../constant";
const Service = require("../../../services");
//var Excel = require('exceljs');
//import Excel from 'exceljs'
// Require library
var excel = require("excel4node");
//var workbook = new Excel.Workbook();
import moment from "moment";
import mongoose from "mongoose";
const {
  nanoid
} = require("nanoid");
import multilingualService from "../../../services/multilingualService";
import MailService from "../../../services/EmailService";
const readXlsxFile = require("read-excel-file/node");
const path = require("path");
const xlsx = require("json-as-xlsx");
const config = require("../../../config/config");
/* import {
  result,
  reject
} from "lodash"; */
var nodemailer = require("nodemailer");
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "appdemo5494@gmail.com",
    pass: "Tunix@5494",
  },
});

const {
  Types: {
    ObjectId
  },
} = require("mongoose");
const _ = require("lodash");
const XLSX = require("xlsx");
class storeAdmin {

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
          $eq: 4
        }
      }
    });
    // if (data.userId) {
    //   pipeline.push({ $match: { userId: mongoose.Types.ObjectId(data.userId) } });
    // }
    // if (data.driverId) {
    //   pipeline.push({ $match: { driverId: mongoose.Types.ObjectId(data.driverId) } });
    // }
    if (data.storeId) {
      pipeline.push({
        $match: {
          storeId: mongoose.Types.ObjectId(data.storeId)
        },
      });
    }
    // if (data.restaurantId) {
    //   pipeline.push({ $match: { restaurantId: mongoose.Types.ObjectId(data.restaurantId) } });
    // }
    pipeline.push({
      $facet: {
        cashSum: [{
            $match: {
              paymentMode: "Cash"
            }
          },
          {
            $group: {
              _id: null,
              count: {
                $sum: 1
              },
              amount: {
                $sum: sumField
              },
            },
          },
          {
            $project: {
              _id: 0
            }
          },
        ],
        // "walletSum": [
        //   { $match: { paymentMode: 1 } },
        //   { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: sumField } } },
        //   { $project: { _id: 0 } }
        // ],
        onlineSum: [{
            $match: {
              paymentMode: "Online"
            }
          },
          {
            $group: {
              _id: null,
              count: {
                $sum: 1
              },
              amount: {
                $sum: sumField
              },
            },
          },
          {
            $project: {
              _id: 0
            }
          },
        ],
        totalCount: [{
            $group: {
              _id: null,
              total: {
                $sum: 1
              }
            }
          },
          {
            $project: {
              _id: 0
            }
          },
        ],
        totalAmt: [{
            $group: {
              _id: null,
              total: {
                $sum: sumField
              }
            }
          },
          {
            $project: {
              _id: 0
            }
          },
        ],
      },
    }, {
      $project: {
        payments: 1,
        cash: {
          $arrayElemAt: ["$cashSum", 0]
        },
        online: {
          $arrayElemAt: ["$onlineSum", 0]
        },
        // wallet: { $arrayElemAt: ["$walletSum", 0] },
        totalCount: {
          $arrayElemAt: ["$totalCount", 0]
        },
        totalAmt: {
          $arrayElemAt: ["$totalAmt", 0]
        },
      },
    }, {
      $project: {
        payments: 1,
        cash: 1,
        online: 1,
        // wallet: 1,
        totalCount: "$totalCount.total",
        totalAmt: "$totalAmt.total",
      },
    });
    return pipeline;
  }

  getDashboardStatsRev(data) {
    return new Promise(async (done, reject) => {
      let totalRevenueStore = await model.storeOrder.aggregate(
        this.getMerchantDashboardStatusRevPipeline(
          data,
          null,
          "$merchantCommission"
        )
      );
      done({
        data: {
          totalRevenueStore: totalRevenueStore
        }
      });
    });
  }

  async uploadOnS3(finalFileName) {
    if (!finalFileName) throw new Error("Image is Empty");
    return {
      data: process.env.S3URL + finalFileName
    };
  }

  async getCategoriesByStore(data, lang) {
    if (!data.storeId)
      throw new Error(
        multilingualService.getResponseMessage("PARAMETERMISSING", lang)
      );

    let categories = await model.storeItem
      .find({
        storeId: data.storeId
      })
      .distinct("storeItemTypeId");
    categories = await model.storeItemType.find({
      _id: {
        $in: categories
      }
    });
    return {
      data: categories
    };
  }

  // async getSubCategoriesByStoreTyp(data) {
  //   if (!data.storeId)
  //     throw new Error(
  //       multilingualService.getResponseMessage("PARAMETERMISSING", lang)
  //     );

  //   let categories = await model.storeItem
  //     .find({ storeId: data.storeId })
  //     .distinct("storeItemSubTypeId");
  //   categories = await model.storeItemType.find({ _id: { $in: categories } });
  //   return { data: categories };
  // }

  // async getSubCategoriesByStore(data) {
  //     if (!data.storeId  || !data.categoryId)
  //       throw new Error(
  //         multilingualService.getResponseMessage("PARAMETERMISSING", lang)
  //       );

  //     let categories = await model.storeItem
  //       .find({ storeId: data.storeId , storeItemTypeId:data.categoryId})
  //       .distinct("storeItemSubTypeId");
  //     categories = await model.storeItemType.find({ _id: { $in: categories } });
  //     return { data: categories };
  //   }

  async getCategoriesByStoreType(data) {
    let categories = await model.storeItemType.aggregate([{
        $match: {
          storeCategoryId: mongoose.Types.ObjectId(data.storeTypeId),
        },
      },
      {
        $lookup: {
          from: "storeitems",
          localField: "_id",
          foreignField: "storeItemTypeId",
          as: "products",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          productsSize: {
            $size: "$products"
          },
        },
      },
      {
        $match: {
          productsSize: {
            $gte: 1
          }
        },
      },
    ]);
    return categories;
  }

  async PAY(data, lang) {
    if (!data.id || !data.type || !data.amount)
      throw new Error(
        multilingualService.getResponseMessage("PARAMETERMISSING", lang)
      );
    data.amount = Number(data.amount);
    if (data.type == "salesperson") {
      let sp = await model.SalesPerson.findById(data.id);

      let sum = await model.store.aggregate([{
          $match: {
            _id: {
              $in: sp.storesArray,
              $or: [{
                status: 4
              }, {
                status: 5
              }, {
                status: 6
              }],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: {
              $sum: "$salesPersonCommission"
            },
          },
        },
      ]);
      if (!sum.length) {
        throw new Error("Total Earnings of this are person are 0.");
      }
      let totalAmount = sum[0].totalAmount;
      let unpaid = totalAmount - sp.paidAmount;
      if (totalAmount < data.amount + sp.paidAmount) {
        throw new Error(
          "Amount Entered is Greater than amount unpaid -> " + unpaid
        );
      }
      sp = await model.SalesPerson.findByIdAndUpdate(data.id, {
        $inc: {
          paidAmount: data.amount
        },
      });
      const payObj = {
        payTo: "salesPerson",
        salesPersonId :data.id,
        payAmount : data.amount,
        payDate: new Date()
      }
      await model.payHistory.findOneAndUpdate({salesPersonId : data.id},{$set : payObj},{upsert : true ,new : true});
      return {
        data: {
          totalEarnings: totalAmount,
          paid: data.amount + sp.paidAmount,
          unpaid: unpaid - data.amount,
        },
      };
    }

    if (data.type == "driver") {
      let sp = await model.driver.findById(data.id);

      let sum = await model.storeOrder.aggregate([{
          $match: {
            driverId: sp._id,
            $or: [{
              status: 4
            }, {
              status: 5
            }, {
              status: 6
            }],
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: {
              $sum: "$driverCommission"
            },
          },
        },
      ]);
      if (!sum.length) {
        throw new Error("Total Earnings of this are person are 0.");
      }
      let totalAmount = sum[0].totalAmount;
      let unpaid = totalAmount - sp.paidAmount;
      if (totalAmount < data.amount + sp.paidAmount) {
        throw new Error(
          "Amount Entered is Greater than amount unpaid -> " + unpaid
        );
      }
      sp = await model.driver.findByIdAndUpdate(data.id, {
        $inc: {
          paidAmount: data.amount
        },
      });
      const payObj = {
        payTo: "driver",
        driverId :data.id,
        payAmount : data.amount,
        payDate: new Date()
      }
      await model.payHistory.findOneAndUpdate({driverId : data.id},{$set : payObj},{upsert : true ,new : true});
      return {
        data: {
          totalEarnings: totalAmount,
          paid: data.amount + sp.paidAmount,
          unpaid: unpaid - data.amount,
        },
      };
    }

    if (data.type == "merchant") {
      let sp = await model.store.findById(data.id);

      let sum = await model.storeOrder.aggregate([{
          $match: {
            storeId: sp._id,
            $or: [{
              status: 4
            }, {
              status: 5
            }, {
              status: 6
            }],
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: {
              $sum: "$merchantCommission"
            },
          },
        },
      ]);
      if (!sum.length) {
        throw new Error("Total Earnings of this are person are 0.");
      }
      let totalAmount = sum[0].totalAmount;
      let unpaid = totalAmount - sp.paidAmount;
      if (totalAmount < data.amount + sp.paidAmount) {
        throw new Error(
          "Amount Entered is Greater than amount unpaid -> " + unpaid
        );
      }
      sp = await model.store.findByIdAndUpdate(data.id, {
        $inc: {
          paidAmount: data.amount
        },
      });
      const payObj = {
        payTo: "merchant",
        merchantId :data.id,
        payAmount : data.amount,
        payDate: new Date()
      }
      await model.payHistory.findOneAndUpdate({merchantId : data.id},{$set : payObj},{upsert : true ,new : true});
      return {
        data: {
          totalEarnings: totalAmount,
          paid: data.amount + sp.paidAmount,
          unpaid: unpaid - data.amount,
        },
      };
    }
  }
  async getPayHistory(req, res, next) {
    let history;
    if(req.body.type == "salseperson")
     history = await model.payHistory.find({payTo : req.body.type, salesPersonId: req.body.id})
    if(req.body.type == "driver")
     history = await model.payHistory.find({payTo : req.body.type, driverId: req.body.id})
    if(req.body.type == "merchant")
     history = await model.payHistory.find({payTo : req.body.type, merchantId: req.body.id})
     res.send({
        message: multilingualService.getResponseMessage("TRUEMSG",lang),
        data: history,
        success : true
    });

  }
  async getBrandsByStoreType(data, lang) {
    if (!data.storeTypeId)
      throw new Error(
        multilingualService.getResponseMessage("PARAMETERMISSING", lang)
      );
    let categoriesIds = await model.storeItemType
      .find({
        isParent: true,
        storeCategoryId: data.storeTypeId,
      })
      .distinct("_id");
    categoriesIds = categoriesIds.map((item) => {
      return mongoose.Types.ObjectId(item);
    });
    let brands = await model.storeItem
      .find({
        storeItemTypeId: {
          $in: categoriesIds
        }
      })
      .distinct("brandId");

    brands = brands.map((item) => {
      return mongoose.Types.ObjectId(item);
    });
    brands = await model.brand.aggregate([{
        $match: {
          _id: {
            $in: brands
          }
        }
      },
      {
        $lookup: {
          from: "storeitems",
          let: {
            brandId: "$_id"
          },
          pipeline: [{
            $match: {
              $expr: {
                $and: [{
                    $eq: ["$$brandId", "$brandId"]
                  },
                  {
                    $eq: ["$isProto", true]
                  },
                  {
                    $in: ["$storeItemTypeId", categoriesIds]
                  },
                ],
              },
            },
          }, ],
          as: "products",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          productsSize: {
            $size: "$products"
          },
        },
      },
      {
        $match: {
          productsSize: {
            $gte: 1
          }
        },
      },
    ]);
    return {
      data: brands
    };
  }
  async dataRefresher(data, lang) {
    let emptyStoreTypesId = [];
    let storeTypes = await model.storeCategory
      .find({
        $and: [{
          status: {
            $ne: 2
          }
        }, {
          status: {
            $ne: 0
          }
        }]
      })
      .lean();
    let emptyStoreTypes = [];
    for (let i = 0; i < storeTypes.length; i++) {
      let emptyStores = [];
      let stores = await model.store
        .find({
          storeTypeId: storeTypes[i]._id,
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
        .lean();
      for (let j = 0; j < stores.length; j++) {
        let products = await model.storeItem
          .find({
            storeId: stores[j]._id,
            isProto: false
          })
          .lean();
        if (products.length == 0) emptyStores.push(j);
      }

      for (let k = emptyStores.length - 1; k >= 0; k--)
        stores.splice(emptyStores[k], 1);

      if (!stores || !stores.length) {
        emptyStoreTypesId.push(storeTypes[i]._id);
        emptyStoreTypes.push(i);
      }
      storeTypes[i].stores = stores.length;
    }
    for (let k = emptyStoreTypes.length - 1; k >= 0; k--)
      storeTypes.splice(emptyStoreTypes[k], 1);

    storeTypes = storeTypes.map((item) => {
      return item._id;
    });

    await model.storeCategory.updateMany({
      _id: {
        $in: storeTypes
      }
    }, {
      $set: {
        isVisible: true
      }
    });
    await model.storeCategory.updateMany({
      _id: {
        $in: emptyStoreTypesId
      }
    }, {
      $set: {
        isVisible: false
      }
    });

    let stores = await model.store.find({});
    let emptystores = [];
    let emptystoresId = [];
    for (let j = 0; j < stores.length; j++) {
      let products = await model.storeItem
        .find({
          storeId: stores[j]._id,
          isProto: false
        })
        .lean();
      if (products.length == 0) {
        emptystores.push(j);
        emptystoresId.push(stores[j]._id);
      }
    }
    for (let k = emptystores.length - 1; k >= 0; k--)
      stores.splice(emptystores[k], 1);

    stores = stores.map((item) => {
      return item._id;
    });
    await model.store.updateMany({
      _id: {
        $in: stores
      }
    }, {
      $set: {
        isVisible: true
      }
    });
    await model.store.updateMany({
      _id: {
        $in: emptystoresId
      }
    }, {
      $set: {
        isVisible: false
      }
    });
    return {
      data: "nice"
    };
  }

  async tagsGenerator(data, lang) {
    const getTags = (string) => {
      let arr = string.split(" ");
      arr = arr.filter((item) => {
        if (item[0] === "#") return true;
      });
      arr = arr.map((item) => {
        return item.replace("#", "");
      });
      let final = [];
      arr.forEach((item) => {
        let splitted = item.split("#");
        if (splitted.length > 1) {
          final = final.concat(splitted);
        } else {
          final.push(item);
        }
      });
      return final;
    };
    let products = await model.storeItem.find({
      tagsUpdated: false
    }).lean();
    for (let i = 0; i < products.length; i++) {
      if (products[i].description) {
        let tags = getTags(products[i].description);
        model.storeItem
          .findByIdAndUpdate(products[i]._id, {
            tagsUpdated: true,
            tags,
          })
          .exec();
      }
    }
  }
  async getBrandsByStore(data, lang) {
    if (!data.storeId)
      throw new Error(
        multilingualService.getResponseMessage("PARAMETERMISSING", lang)
      );
    let brands = await model.storeItem
      .find({
        storeId: data.storeId
      })
      .distinct("brandId");
    brands = brands.map((item) => {
      return mongoose.Types.ObjectId(item);
    });
    brands = await model.brand.aggregate([{
        $match: {
          _id: {
            $in: brands
          }
        }
      },
      {
        $lookup: {
          from: "storeitems",
          let: {
            brandId: "$_id"
          },
          pipeline: [{
            $match: {
              $expr: {
                $and: [{
                    $eq: ["$$brandId", "$brandId"]
                  },
                  {
                    $eq: ["$storeId", mongoose.Types.ObjectId(data.storeId)],
                  },
                ],
              },
            },
          }, ],
          as: "products",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          productsSize: {
            $size: "$products"
          },
        },
      },
      {
        $match: {
          productsSize: {
            $gte: 1
          }
        },
      },
    ]);
    return {
      data: brands
    };
  }

  async findWinner() {
    let winner = await model.Ticket.aggregate([{
      $sample: {
        size: 1
      }
    }]);
    let user = await model.user.findById(winner[0].userId);
    let store = await model.store.findById(winner[0].storeId);
    winner = await model.Ticket.findByIdAndUpdate(winner[0]._id, {
      winningDate: new Date(),
    });

    return {
      data: {
        user,
        store
      }
    };
  }

  async getWinners() {
    let winner = await model.Ticket.aggregate([{
        $match: {
          winningDate: {
            $exists: true
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "winner",
        },
      },
      {
        $lookup: {
          from: "stores",
          localField: "storeId",
          foreignField: "_id",
          as: "store",
        },
      },
    ]);
    return {
      data: winner
    };
  }
  async assignTicketsStoreWise(data, lang) {
    if (!data.products || !data.storeId || !data.tickets)
      throw new Error(
        multilingualService.getResponseMessage("PARAMETERMISSING", lang)
      );

    let results = await model.storeItem
      .updateMany({
        storeId: data.storeId,
        variantId: {
          $in: data.products
        }
      }, {
        $set: {
          tickets: data.tickets
        }
      })
      .exec();
    return {
      message: multilingualService.getResponseMessage("UPDATEMSG", lang),
    };
  }

  async assignLPStoreWise(data, lang) {
    if (!data.products || !data.storeId || !data.LP)
      throw new Error(
        multilingualService.getResponseMessage("PARAMETERMISSING", lang)
      );

    let results = await model.storeItem
      .updateMany({
        storeId: data.storeId,
        variantId: {
          $in: data.products
        }
      }, {
        $set: {
          tickets: data.LP
        }
      })
      .exec();
    return {
      message: multilingualService.getResponseMessage("UPDATEMSG", lang),
    };
  }

  addStoreType(data, file, lang, finalFileName, geofenceId) {
    return new Promise(async (done, reject) => {
      if (data.singleVendor) {
        data.isHyperLocal = true;
        if (!data.outlet || !data.outlet.latitude || !data.outlet.longitude) {
          reject({
            message: "Please Select Address"
          });
        }
      }
      //please dont delete below line
      data.image = process.env.S3URL + finalFileName;
      let obj = {
        name: data.name,
        name_ar: data.name_ar,
        date: moment().valueOf(),
        image: process.env.S3URL + finalFileName,
        // these three fields  should be added in store also
        isHyperLocal: data.singleVendor ? true : data.isHyperLocal,
        layout: data.layout,
        isBrandHidden: data.isBrandHidden,
        tax: data.tax,
        packingCharge: data.packingCharge,
        moduleType: data.moduleType,
        moduleKey: data.moduleKey,
        serialNo: 1
      };
      if (geofenceId && geofenceId != "NA") obj.geofenceId = geofenceId;
      let category = new model.storeCategory(obj);
      category
        .save()
        .then(async (result) => {
          if (data.singleVendor) {
            // just having some fun
            await model.brand({
              name: data.name,
              name_ar: data.name_ar,
              date: moment().valueOf(),
              image: result.image,
              geofenceId: result.geofenceId
            }).save();
            data.email = `${Math.random()
              .toString(36)
              .substring(7)}@${Math.random().toString(36).substring(7)}.com`;
            //fun ends
            data.password = "12345678";
            data.storeTypeId = result._id;
            data.status = 1;
            data.isOpen = true;
            data.layout = "grid";
            await this.addStore(data);
          }
          if (data.serialNo != null && Number(data.serialNo) > 0) {
            await model.storeCategory.updateMany({
              moduleKey: data.moduleKey,
              serialNo: {
                $gt: data.serialNo
              }
            }, {
              $inc: {
                serialNo: 1
              }
            })
          }
          done({
            message: multilingualService.getResponseMessage("ADDMSG", lang),
            data: result,
          });
        })
        .catch((err) => {
          // return reject({ message: Service.Handler.mongoErrorHandler(err) });
          return reject({
            message: multilingualService.getResponseMessage(
              "STORECATEXISTS",
              lang
            ),
            data: err,
          });
        });
    });
  }

  async getOutletforSingleVendor(id) {
    let store = await model.store.findOne({
      storeTypeId: id
    });
    let outlet = await model.storeOutlet.findOne({
      storeId: store._id
    });
    return {
      data: outlet
    };
  }

  editStoreType(data, file, lang, finalFileName) {
    return new Promise(async (done, reject) => {
      try {
        if (data.singleVendor) {
          await model.store.updateMany({
            storeTypeId: data.updateId
          }, {
            name: data.name,
            isHyperLocal: true,
          });

          if (data.outlet) {
            let store = await model.store.findOne({
              storeTypeId: data.updateId,
            });
            await model.storeOutlet.updateMany({
              storeId: store._id
            }, {
              latitude: data.outlet.latitude,
              longitude: data.outlet.longitude,
              address: data.outlet.address,
              status: 1,
              isOpen: true,
            });
          }
        }
        if (finalFileName) {
          data.image = process.env.S3URL + finalFileName;
        }
        await model.store.updateMany({
          storeTypeId: data.updateId
        }, {
          isHyperLocal: data.isHyperLocal,
          layout: data.layout,
          isBrandHidden: data.isBrandHidden,
        });
        let result = await model.storeCategory.findByIdAndUpdate(
          data.updateId,
          data, {
            new: true
          }
        );
        if (data.status === 2) {
          done({
            message: multilingualService.getResponseMessage("DELETEMSG", lang),
            data: result,
          });
        }
        if (data.status === 1) {
          // if(data.serialNo != null && data.serialNo > 0){
          //   if(data.oldSerialNo > data.serialNo){
          //     console.log("1 aaya")
          //     await model.storeCategory.updateMany({
          //       moduleKey : data.moduleKey,
          //       serialNo:{
          //         $lt : data.oldSerialNo
          //       }
          //     },{$inc:{
          //       serialNo:1
          //     }})
          //   }else {
          //     console.log("2 aaya")
          //     await model.storeCategory.updateMany({
          //       moduleKey : data.moduleKey,
          //       serialNo:{
          //         $gt : data.oldSerialNo
          //       }
          //     },{$inc:{
          //       serialNo:1
          //     }})
          //   }

          // }

          done({
            message: multilingualService.getResponseMessage("UPDATEMSG", lang),
            data: result,
          });
        }
        if (data.status === 0) {
          done({
            message: multilingualService.getResponseMessage(
              "STORETYPEBLOCKED",
              lang
            ),
            data: result,
          });
        }
        if (data.status === 3) {
          done({
            message: multilingualService.getResponseMessage(
              "STORETYPEUNBLOCKED",
              lang
            ),
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
          data: err,
        });
      }
    });
  }

  getStoreType(data, lang, geofenceId) {
    return new Promise(async (done, reject) => {
      try {
        let filter = {};
        if (data.moduleKey) filter.moduleKey = data.moduleKey;
        if (geofenceId != "NA") filter.geofenceId = geofenceId;
        if (data.all == true || data.all == "true") {
          let dataNew;
          dataNew = await model.storeCategory.find(filter);
          done({
            message: multilingualService.getResponseMessage(
              "FETCHED_SUCCESSFULLY",
              lang
            ),
            data: dataNew,
          });
          return;
        }
        const limit = Number(data.limit) || Constant.ADMINLIMIT;
        const page = Math.max(1, Number(data.page) || 0);
        const skip = Math.max(0, page - 1) * limit;
        const sort = {
          serialNo: 1
        };

        const query = {
          limit,
          page,
          skip,
          search: data.search
        };

        if (data.search) {
          const regex = {
            $regex: `${data.search}`,
            $options: "i"
          };
          filter.$or = [{
            name: regex
          }, {
            name_ar: regex
          }];
        }
        const itemCount = await model.storeCategory.countDocuments(filter);
        const pageCount = Math.ceil(itemCount / limit);
        const storeTypeList = await model.storeCategory
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean();

        const message =
          storeTypeList.length <= 0 ?
          multilingualService.getResponseMessage("EMPTY_LIST", lang) :
          multilingualService.getResponseMessage(
            "FETCHED_SUCCESSFULLY",
            lang
          );
        done({
          message: message,
          data: {
            query,
            storeTypeList,
            itemCount,
            pageCount
          },
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }
  // with child dependencies
  deleteStoreType(data, lang) {
    return new Promise(async (done, reject) => {
      let storeItemType = await model.storeItemType.findOne({
        storeCategoryId: data.id,
        isParent: true,
      });
      if (storeItemType) {
        reject({
          message: "Store Category Exists for this Store Type, Delete Operation Failed",
          data: storeItemType,
        });
        return;
      }
      let stores = await model.store.findOne({
        storeTypeId: data.id
      });
      if (stores) {
        reject({
          message: "Store Exists for Store Types, Delete Operation Failed",
          data: stores,
        });
        return;
      }
      if (data.singleVendor)
        await model.store.deleteMany({
          storeTypeId: data.id
        });
      let deleted = await model.storeCategory.findByIdAndDelete(data.id);
      if (deleted) {
        done({
          message: "DELETED SUCCESSFULLY",
        });
      } else {
        reject({
          message: "WrongIdError",
        });
      }
    });
  }

  deleteStore(data, lang) {
    return new Promise(async (done, reject) => {
      let storeItem = await model.storeItem.findOne({
        storeId: data.id,
      });
      if (storeItem) {
        reject({
          message: "Store Category Exists for this Store Type, Delete Operation Failed",
          data: storeItem,
        });
        return;
      }
      let deleted = await model.storeCategory.findByIdAndDelete(data.id);
      if (deleted) {
        done({
          message: "DELETED SUCCESSFULLY",
        });
      } else {
        reject({
          message: "WrongIdError",
        });
      }
    });
  }

  deleteAllStoreTypes(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        data = {};
        data.storeType = await model.storeCategory.find({}).distinct("_id");
        let emptyStoreTypes = [];
        for (let i = 0; i < data.storeType.length; i++) {
          let cats = await model.storeItemType.find({
            storeCategoryId: data.storeType[i],
          });
          let stores = await model.store.find({
            storeTypeId: data.storeType[i],
          });
          if ((!cats || !cats.length) && (!stores || !stores.length))
            emptyStoreTypes.push(data.storeType[i]);
        }
        let deleted = await model.storeCategory.find({
          _id: {
            $in: emptyStoreTypes
          },
        });
        await model.storeCategory.deleteMany({
          _id: {
            $in: emptyStoreTypes
          }
        });

        let str = "";
        deleted.forEach((item) => {
          str += item.name + ", ";
        });

        // reject({
        //   message:
        //     "Store Category Exists for Store Types, Delete Operation Failed",
        // });

        done({
          message: `${str ? str : "Nothing"} Deleted, ${
            str
              ? "Rest of the Store Types have either categories or stores already present in them"
              : ""
          }`,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  deleteSelectedStoreTypes(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        let emptyStoreTypes = [];
        for (let i = 0; i < data.storeType.length; i++) {
          let cats = await model.storeItemType.find({
            storeCategoryId: data.storeType[i],
          });
          let stores = await model.store.find({
            storeTypeId: data.storeType[i],
          });
          if ((!cats || !cats.length) && (!stores || !stores.length))
            emptyStoreTypes.push(data.storeType[i]);
        }
        let deleted = await model.storeCategory.find({
          _id: {
            $in: emptyStoreTypes
          },
        });
        await model.storeCategory.deleteMany({
          _id: {
            $in: emptyStoreTypes
          }
        });

        let str = "";
        deleted.forEach((item) => {
          str += item.name + ", ";
        });
        done({
          message: `${str ? str : "Nothing"} Deleted, ${
            str
              ? "Rest of the Store Types have either categories or stores already present in them"
              : ""
          }`,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  bulkUploadStoreType(dataToSend, file, headerData) {
    return new Promise(async (done, reject) => {
      let lang = headerData.language;
      let index = 2;

      try {
        if (file == undefined) {
          return reject({
            message: multilingualService.getResponseMessage("FALSEMSG", lang),
          });
        }
        // const url = path.join(__dirname, `../../../uploads/csv/${file.filename}`);
        const url = `/var/www/html/${process.env.DIR_NAME}/server/uploads/csv/${file.filename}`;
        let workbook = await XLSX.readFile(url);
        let sheetName = workbook.SheetNames[0];
        let sheet = workbook.Sheets[sheetName];
        let results = [];
        let checker = sheet["A2"];
        while (typeof checker === "object") {
          let data = {};
          data.name = sheet[`A${index}`].w.trim();
          data.name_ar = sheet[`B${index}`].w.trim();
          let image = sheet[`C${index}`].w.trim();
          if (image != null && image != "") {
            let imageData = await Service.upload.upload_from_url(image);
            let keyImage = image.substring(image.lastIndexOf('/') + 1);
            image = `${process.env.S3URL}${keyImage}`
          }
          data.image = image;
          data.date = moment().valueOf();
          data.isHyperLocal = false;
          data.isBrandHidden = false;
          data.geofenceId = headerData.geofenceid;
          results.push(data);
          index++;
          checker = sheet[`A${index}`];

          if (dataToSend.moduleKey) {
            data.moduleKey = dataToSend.moduleKey;
          }
        }

        for (let i = 0; i < results.length; i++) {
          try {
            await new model.storeCategory(results[i]).save();
          } catch (e) {}
        }
        fs.unlinkSync(url);
        done({
          message: "Done"
        });
      } catch (e) {
        reject({
          message: "Please check if all required fields are present in" + index,
        });
      }
    });
  }

  getAllStoreTypeExport3(data, lang) {
    return new Promise(async (resolve, reject) => {
      let pipeline = [];
      if (data.query.moduleKey)
        pipeline.push({
          $match: {
            status: {
              $ne: 2
            },
            moduleKey: data.query.moduleKey
          },
        });
      else pipeline.push({
        $match: {
          status: {
            $ne: 2
          }
        }
      });
      pipeline.push({
        $project: {
          name: 1,
          name_ar: 1,
          image: 1,
          status: 1,
          _id: 0
        },
      });
      let storeType = await model.storeCategory.aggregate(pipeline).exec();

      storeType = storeType.reverse();

      // Create a new instance of a Workbook class
      var workbook = new excel.Workbook();

      // Add Worksheets to the workbook
      var worksheet = workbook.addWorksheet("Sheet 1");

      //make headings
      const headings = ["name", "name_ar", "image", "status"];

      // Create a heading style
      var headingStyle = workbook.createStyle({
        font: {
          color: "#000000",
          size: 14,
          bold: true,
        },
      });

      //style of cell
      var cellStyle = workbook.createStyle({
        font: {
          color: "#000000",
          size: 12,
        },
      });

      //setting width of coliumn 3
      worksheet.column(3).setWidth(70);

      //headings
      headings.forEach((head, i) => {
        worksheet
          .cell(1, i + 1)
          .string(head)
          .style(headingStyle);
      });

      storeType.forEach((store, i) => {

        worksheet
          .cell(i + 2, 1)
          .string(store.name)
          .style(cellStyle);
        worksheet
          .cell(i + 2, 2)
          .string(store.name_ar)
          .style(cellStyle);
        worksheet
          .cell(i + 2, 3)
          .string(store.image)
          .style(cellStyle);
        worksheet
          .cell(i + 2, 4)
          .string(`${store.status == 3 ? "On" : "Off"}`)
          .style(cellStyle);

        storeType.forEach((store, i) => {
          worksheet
            .cell(i + 2, 1)
            .string(store.name)
            .style(cellStyle);
          worksheet
            .cell(i + 2, 2)
            .string(store.name_ar)
            .style(cellStyle);
          worksheet
            .cell(i + 2, 3)
            .string(store.image)
            .style(cellStyle);
          worksheet
            .cell(i + 2, 4)
            .string(
              `${
                store.status == 0 ? "off" : store.status == 3 ? "on" : "unknown"
              }`
            )
            .style(cellStyle);
        });

        let sendFileName = "storeTypes.xlsx";

        workbook.write(
          path.join("./server/uploads/exportedCsv/storeTypes.xlsx"),
          function (err, stats) {
            if (err) {
              console.error("error", err);
            } else {
              console.log("stats", stats); // Prints out an instance of a node.js fs.Stats object
            }
          }
        );

        resolve({
          message: multilingualService.getResponseMessage(
            "FETCHED_SUCCESSFULLY",
            lang
          ),
          data: process.env.EXPORTURLLIVE + sendFileName,
        });
      });
    });
  }
  getAllStoreTypeExport(data, lang) {
    return new Promise(async (done, reject) => {
      let pipeline = [];
      if (data.query.moduleKey)
        pipeline.push({
          $match: {
            status: {
              $ne: 2
            },
            moduleKey: data.query.moduleKey
          },
        });
      else pipeline.push({
        $match: {
          status: {
            $ne: 2
          }
        }
      });
      pipeline.push({
        $project: {
          name: 1,
          name_ar: 1,
          image: 1,
          _id: 0
        }
      });
      let storeType = await model.storeCategory.aggregate(pipeline).exec();
      var ws = XLSX.utils.json_to_sheet(storeType, {
        header: ["name", "name_ar", "image"],
      });
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "StoreTypes");
      let sendFileName = "storeTypes.xlsx";

      XLSX.writeFile(wb, "./server/uploads/exportedCsv/storeTypes.xlsx");
      done({
        message: multilingualService.getResponseMessage(
          "FETCHED_SUCCESSFULLY",
          lang
        ),
        data: process.env.EXPORTURLLIVE + sendFileName,
      });
    });
  }

  addCategory(data, file, lang, finalFileName, geofenceId) {
    return new Promise((done, reject) => {
      if (geofenceId == "NA") delete data.geofenceId;
      else data.geofenceId = geofenceId;
      // let query = {
      //   name : data.name,
      //   moduleKey: data.moduleKey
      // };
      // if(data.geofenceId){
      //   query.geofenceId = ObjectId(data.geofenceId)
      // }
      // let checkDuplicate =  model.storeCategory.findOne(query);
      // if(checkDuplicate != null){
      //   return reject({
      //     message: multilingualService.getResponseMessage("ALREADYEXISTS", lang),
      //     data: {},
      //   });
      // }
      let type = this.createCategory(data, finalFileName);

      type
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
              message: Service.Handler.mongoErrorHandler(err)
            });

          return reject({
            message: multilingualService.getResponseMessage("FALSEMSG", lang),
            data: err,
          });
        });
    });
  }

  createCategory(data, finalFileName, geofenceId) {
    let StoreItemType = new model.storeItemType(data);
    StoreItemType.date = moment().valueOf();
    if (finalFileName) StoreItemType.image = process.env.S3URL + finalFileName;
    return StoreItemType;
  }

  editCategory(data, file, lang, finalFileName) {
    return new Promise(async (done, reject) => {
      try {
        if (finalFileName) data.image = process.env.S3URL + finalFileName;

        // let qry = {
        //   name: new RegExp("^" + data.name + "$", "i"),
        //   _id: { $ne: data.updateId },
        //   status: { $ne: 2 },
        // };

        // model.storeItemType.findOne(qry).then(async(type) => {
        //   if (type)
        //     return reject({
        //       message: multilingualService.getResponseMessage(
        //         "ALREADYEXISTS",
        //         lang
        //       ),
        //     });

        let result = await model.storeItemType.findByIdAndUpdate(
          data.updateId,
          data, {
            new: true
          }
        );

        if (data.status === 2) {
          done({
            message: multilingualService.getResponseMessage("DELETEMSG", lang),
            data: result,
          });
        }
        if (data.status === 1) {
          done({
            message: multilingualService.getResponseMessage("UPDATEMSG", lang),
            data: result,
          });
        }
        if (data.status === 0) {
          done({
            message: multilingualService.getResponseMessage(
              "CATEGEORYBLOCKED",
              lang
            ),
            data: result,
          });
        }
        if (data.status === 3) {
          done({
            message: multilingualService.getResponseMessage(
              "CATEGEORYUNBLOCKED",
              lang
            ),
            data: result,
          });
        }

        done({
          message: multilingualService.getResponseMessage("UPDATEMSG", lang),
          data: result,
        });

        // model.storeItemType
        //   .findByIdAndUpdate(data.updateId, data, { new: true })
        //   .then((result) => {
        //     done({
        //       message:
        //         Number(data.status) == 2
        //           ? multilingualService.getResponseMessage("DELETEMSG", lang)
        //           : multilingualService.getResponseMessage("UPDATEMSG", lang),
        //       data: result,
        //     });
        //   })
        //   .catch((err) => {
        //     return reject({
        //       message: multilingualService.getResponseMessage("FALSEMSG", lang),
        //     });
        //   });
        // });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
          data: err,
        });
      }
    });
  }

  getAllCategory(data, lang, geofenceId) {
    return new Promise(async (done, reject) => {
      try {
        if (data.all == true || data.all == "true") {
          let filter = {
            // storeCategoryId: data.storeTypeId,
            parentId: {
              $exists: false
            },
            isParent: true,
          };

          if (data.storeTypeId) filter.storeCategoryId = data.storeTypeId;
          if (data.moduleKey) filter.moduleKey = data.moduleKey;
          if (geofenceId != "NA") filter.geofenceId = geofenceId;

          const dataNew = await model.storeItemType
            .find(filter)
            .populate("storeCategoryId");
          done({
            message: multilingualService.getResponseMessage(
              "FETCHED_SUCCESSFULLY",
              lang
            ),
            data: dataNew,
          });
          return;
        }

        const limit = Number(data.limit) || Constant.ADMINLIMIT;
        const page = Math.max(1, Number(data.page) || 0);
        const skip = Math.max(0, page - 1) * limit;
        const sort = {
          _id: -1
        };

        const query = {
          limit,
          page,
          skip,
          search: data.search
        };
        let filter = {
          parentId: {
            $exists: false
          },
          isParent: true
        };
        if (data.storeTypeId) filter.storeCategoryId = data.storeTypeId;
        if (data.moduleKey) filter.moduleKey = data.moduleKey;
        if (geofenceId != "NA") filter.geofenceId = geofenceId;

        if (data.search) {
          const regex = {
            $regex: `${data.search}`,
            $options: "i"
          };
          filter.$or = [{
            name: regex
          }, {
            description: regex
          }];
        }
        const itemCount = await model.storeItemType.countDocuments(filter);
        const pageCount = Math.ceil(itemCount / limit);
        const categoryList = await model.storeItemType
          .find(filter)
          .populate("storeCategoryId")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean();

        const message =
          categoryList.length <= 0 ?
          multilingualService.getResponseMessage("EMPTY_LIST", lang) :
          multilingualService.getResponseMessage(
            "FETCHED_SUCCESSFULLY",
            lang
          );
        done({
          message: message,
          data: {
            query,
            categoryList,
            itemCount,
            pageCount
          },
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  deleteCategory(data, lang) {
    return new Promise(async (done, reject) => {
      let subCategory = await model.storeItemType.findOne({
        parentId: data.id,
        isSubCategory: true,
      });
      if (subCategory) {
        reject({
          message: "Sub-Category Exists for this Category, Delete Operation Failed",
          data: subCategory,
        });
        return;
      }
      let deleted = await model.storeItemType.findByIdAndDelete(data.id);
      if (deleted) {
        done({
          message: "DELETED SUCCESSFULLY",
        });
      } else {
        reject({
          message: "WrongIdError",
        });
      }
    });
  }

  deleteAllCategory(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        let emptyCats = [];

        data = {};
        data.storeCategory = await model.storeItemType
          .find({
            storeCategoryId: {
              $exists: true
            }
          })
          .distinct("_id");
        for (let i = 0; i < data.storeCategory.length; i++) {
          let subCats = await model.storeItemType.find({
            parentId: data.storeCategory[i],
          });
          let prods = await model.storeItem.find({
            storeItemTypeId: data.storeCategory[i],
          });
          if ((!subCats || !subCats.length) && (!prods || !prods.length))
            emptyCats.push(data.storeCategory[i]);
        }
        let deleted = await model.storeItemType.find({
          _id: {
            $in: emptyCats
          },
        });
        await model.storeItemType.deleteMany({
          _id: {
            $in: emptyCats
          }
        });

        let str = "";
        deleted.forEach((item) => {
          str += item.name + ", ";
        });
        done({
          message: `${str ? str : "Nothing"} Deleted, ${
            str
              ? "Rest of the Categories have either sub-categories or products already present in them"
              : ""
          }`,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  deleteSelectedCategory(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        let emptyCats = [];
        for (let i = 0; i < data.storeCategory.length; i++) {
          let subCats = await model.storeItemType.find({
            parentId: data.storeCategory[i],
          });
          let prods = await model.storeItem.find({
            storeItemTypeId: data.storeCategory[i],
          });
          if ((!subCats || !subCats.length) && (!prods || !prods.length))
            emptyCats.push(data.storeCategory[i]);
        }
        let deleted = await model.storeItemType.find({
          _id: {
            $in: emptyCats
          },
        });
        await model.storeItemType.deleteMany({
          _id: {
            $in: emptyCats
          }
        });

        let str = "";
        deleted.forEach((item) => {
          str += item.name + ", ";
        });
        if (str)
          done({
            message: `${str} Deleted Successfully`,
          });
        else
          reject({
            message: `Category have either sub-categories or products already present in them`,
          });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  getCategoryById(categoryId, lang) {
    return new Promise(async (done, reject) => {
      const criteria = {
        _id: mongoose.Types.ObjectId(categoryId)
      };
      let categoryData = await model.storeItemType.aggregate([{
          $match: criteria
        },
        {
          $lookup: {
            from: "storeitemtypes",
            localField: "_id",
            foreignField: "parentId",
            as: "subCategory",
          },
        },
        {
          $project: {
            subCategory: 1,
            _id: 0
          }
        },
      ]);
      const messageResp =
        categoryData.length <= 0 ?
        multilingualService.getResponseMessage("EMPTY_LIST", lang) :
        multilingualService.getResponseMessage(
          "FETCHED_SUCCESSFULLY",
          lang
        );
      done({
        message: messageResp,
        data: categoryData
      });
    });
  }

  getCategoryByStoreTypeId(storeTypeId, lang) {
    return new Promise(async (done, reject) => {
      let storeItem = await model.storeItem.find({
        status: {
          $ne: 2
        }
      }).exec();
      let categoryData = await model.storeItemType
        .find({
          storeCategoryId: {
            $in: []
          },
          isParent: true,
        })
        .exec();
      const messageResp =
        categoryData.length <= 0 ?
        multilingualService.getResponseMessage("EMPTY_LIST", lang) :
        multilingualService.getResponseMessage(
          "FETCHED_SUCCESSFULLY",
          lang
        );
      done({
        message: messageResp,
        data: categoryData
      });
    });
  }

  getProductStoreTypes(lang) {
    return new Promise(async (done, reject) => {
      let storeTypeData = await model.storeCategory
        .find({
          isVisible: true,
        })
        .exec();
      const messageResp =
        storeTypeData.length <= 0 ?
        multilingualService.getResponseMessage("EMPTY_LIST", lang) :
        multilingualService.getResponseMessage(
          "FETCHED_SUCCESSFULLY",
          lang
        );
      done({
        message: messageResp,
        data: storeTypeData
      });
    });
  }

  bulkUploadCategory(dataToSend, file, lang) {
    return new Promise(async (done, reject) => {
      let index = 2;
      try {
        if (file == undefined) {
          return reject({
            message: multilingualService.getResponseMessage("FALSEMSG", lang),
          });
        }
        // const url = path.join(__dirname, `../../../uploads/csv/${file.filename}`);
        const url = `/var/www/html/${process.env.DIR_NAME}/server/uploads/csv/${file.filename}`;
        let workbook = await XLSX.readFile(url);
        let sheetName = workbook.SheetNames[0];
        let sheet = workbook.Sheets[sheetName];

        let results = [];
        let erroredField = [];

        let checker = sheet["A2"];
        let storeTypes = await model.storeCategory.find({});

        let storeItemsMap = {};
        storeTypes.forEach((item) => {
          storeItemsMap[item.name] = item._id;
        });
        while (typeof checker === "object") {
          let data = {};
          let storeType = sheet[`A${index}`].w.trim();
          data.name = sheet[`B${index}`].w.trim();
          data.name_ar = sheet[`C${index}`] ? sheet[`C${index}`].w.trim() : "";
          data.storeCategoryId = storeItemsMap[storeType] ?
            mongoose.Types.ObjectId(storeItemsMap[storeType]) :
            (() => {
              erroredField.push({
                name: data.name,
                row: index,
                name_ar: data.name_ar,
                errorIn: "Store-Type",
              });
              return "";
            })();
          let image = sheet[`D${index}`].w.trim();
          if (image != null && image != "") {
            let imageData = await Service.upload.upload_from_url(image);
            let keyImage = image.substring(image.lastIndexOf('/') + 1);
            image = `${process.env.S3URL}${keyImage}`
          }
          data.image = image;
          data.date = moment().valueOf();
          data.isParent = true;
          results.push(data);
          index++;
          checker = sheet[`A${index}`];

          if (dataToSend.moduleKey) {
            data.moduleKey = dataToSend.moduleKey;
          }
        }

        for (let i = 0; i < results.length; i++) {
          try {
            await new model.storeItemType(results[i]).save();
          } catch (e) {}
        }
        fs.unlinkSync(url)
        done({
          message: "Done",
          data: erroredField
        });
      } catch (e) {
        reject({
          message: `Please check if all required fields are present in ${index} row!`,
        });
      }
    });
  }

  getAllCategoryExport(data, lang) {
    return new Promise(async (done, reject) => {
      let pipeline = [];
      if (data.query.moduleKey)
        pipeline.push({
          $match: {
            status: {
              $ne: 2
            },
            isParent: true,
            moduleKey: data.query.moduleKey,
          },
        });
      else pipeline.push({
        $match: {
          status: {
            $ne: 2
          },
          isParent: true
        }
      });
      pipeline.push({
        $lookup: {
          from: "storecategories",
          localField: "storeCategoryId",
          foreignField: "_id",
          as: "storeType",
        },
      }, {
        $project: {
          _id: 1,
          storeTypeName: {
            $arrayElemAt: ["$storeType.name", 0]
          },
          name: 1,
          name_ar: 1,
          image: 1,
        },
      });
      let category = await model.storeItemType.aggregate(pipeline).exec();

      var ws = XLSX.utils.json_to_sheet(category, {
        header: ["storeTypeName", "name", "name_ar", "image"],
      });
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "category");
      let sendFileName = "category.xlsx";

      XLSX.writeFile(wb, "./server/uploads/exportedCsv/category.xlsx");
      done({
        message: multilingualService.getResponseMessage(
          "FETCHED_SUCCESSFULLY",
          lang
        ),
        data: process.env.EXPORTURLLIVE + sendFileName,
      });
    });
  }

  addSubCategory(data, file, lang, finalFileName, geofenceId) {
    return new Promise((done, reject) => {
      if (geofenceId != "NA") data.geofenceId = geofenceId;
      let type = this.createSubCategory(data, finalFileName);
      type
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
              message: Service.Handler.mongoErrorHandler(err)
            });

          return reject({
            message: multilingualService.getResponseMessage("FALSEMSG", lang),
            data: err,
          });
        });
    });
  }

  createSubCategory(data, finalFileName) {
    let StoreItemType = new model.storeItemType(data);
    StoreItemType.date = moment().valueOf();
    if (finalFileName) StoreItemType.image = process.env.S3URL + finalFileName;
    return StoreItemType;
  }

  editSubCategory(data, file, lang, finalFileName) {
    return new Promise(async (done, reject) => {
      try {
        if (finalFileName) data.image = process.env.S3URL + finalFileName;

        // let qry = {
        //   name: new RegExp("^" + data.name + "$", "i"),
        //   _id: { $ne: data.updateId },
        //   status: { $ne: 2 },
        // };

        // await model.storeItemType.findOne(qry).then(async (type) => {
        //   if (type)
        //     return reject({
        //       message: multilingualService.getResponseMessage(
        //         "ALREADYEXISTS",
        //         lang
        //       ),
        //     });
        let result = await model.storeItemType.findByIdAndUpdate(
          data.updateId,
          data, {
            new: true
          }
        );
        if (data.status === 2) {
          done({
            message: multilingualService.getResponseMessage("DELETEMSG", lang),
            data: result,
          });
        }
        if (data.status === 1) {
          done({
            message: multilingualService.getResponseMessage("UPDATEMSG", lang),
            data: result,
          });
        }
        if (data.status === 0) {
          done({
            message: multilingualService.getResponseMessage(
              "SUBCATEGEORYBLOCKED",
              lang
            ),
            data: result,
          });
        }
        if (data.status === 3) {
          done({
            message: multilingualService.getResponseMessage(
              "SUBCATEGEORYUNBLOCKED",
              lang
            ),
            data: result,
          });
        }

        done({
          message: multilingualService.getResponseMessage("UPDATEMSG", lang),
          data: result,
        });
        // model.storeItemType
        //   .findByIdAndUpdate(data.updateId, data, { new: true })
        //   .then((result) => {
        //     done({
        //       message:
        //         Number(data.status) == 2
        //           ? multilingualService.getResponseMessage("DELETEMSG", lang)
        //           : multilingualService.getResponseMessage("UPDATEMSG", lang),
        //       data: result,
        //     });
        //   })
        //   .catch((err) => {
        //     return reject({
        //       message: multilingualService.getResponseMessage("FALSEMSG", lang),
        //     });
        //   });
        // });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
          data: err,
        });
      }
    });
  }

  getAllSubCategory(data, lang, geofenceId) {
    return new Promise(async (done, reject) => {
      try {
        if (data.all == true || data.all == "true") {
          let filter = {
            // storeCategoryId: data.storeTypeId,
            isSubCategory: true,
            isParent: {
              $exists: true
            },
          };
          if (data.categoryId) filter.parentId = data.categoryId;
          if (data.moduleKey) filter.moduleKey = data.moduleKey;
          if (geofenceId != "NA") filter.geofenceId = geofenceId;

          const dataNew = await model.storeItemType
            .find(filter)
            .populate("parentId");
          done({
            message: multilingualService.getResponseMessage(
              "FETCHED_SUCCESSFULLY",
              lang
            ),
            data: dataNew,
          });
          return;
        }
        const limit = Number(data.limit) || Constant.ADMINLIMIT;
        const page = Math.max(1, Number(data.page) || 0);
        const skip = Math.max(0, page - 1) * limit;
        const sort = {
          _id: -1
        };

        const query = {
          limit,
          page,
          skip,
          search: data.search
        };
        let filter = {
          parentId: {
            $exists: true
          },
          isSubCategory: true
        };

        if (data.categoryId) filter.parentId = data.categoryId;
        if (data.moduleKey) filter.moduleKey = data.moduleKey;
        if (geofenceId != "NA") filter.geofenceId = geofenceId;

        if (data.search) {
          const regex = {
            $regex: `${data.search}`,
            $options: "i"
          };
          filter.$or = [{
            name: regex
          }, {
            description: regex
          }];
        }
        const itemCount = await model.storeItemType.countDocuments(filter);
        const pageCount = Math.ceil(itemCount / limit);
        const subCategoryList = await model.storeItemType
          .find(filter)
          .populate("parentId")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean();
        for (let i = 0; i < subCategoryList.length; i++) {
          if (subCategoryList[i].parentId.status == 0) {
            subCategoryList[i].splice(0);
          }
        }
        const message =
          subCategoryList.length <= 0 ?
          multilingualService.getResponseMessage("EMPTY_LIST", lang) :
          multilingualService.getResponseMessage(
            "FETCHED_SUCCESSFULLY",
            lang
          );
        done({
          message: message,
          data: {
            query,
            subCategoryList,
            itemCount,
            pageCount
          },
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  deleteSubCategory(data, lang) {
    return new Promise(async (done, reject) => {
      let product = await model.storeItem.findOne({
        storeItemSubTypeId: data.id,
      });
      if (product) {
        reject({
          message: "Product Exists for this Sub Category, Delete Operation Failed",
          data: product,
        });
        return;
      }
      let deleted = await model.storeItemType.findByIdAndDelete(data.id);
      if (deleted) {
        done({
          message: "DELETED SUCCESSFULLY",
        });
      } else {
        reject({
          message: "WrongIdError",
        });
      }
    });
  }

  deleteAllSubCategory(data, lang) {
    //NAMES OF VARIABLES ARE NOT MEANINGFUL IN THIS API
    // API HAS BEEN COPY PASTED FROM CATEGORY API
    return new Promise(async (done, reject) => {
      try {
        data = {};
        data.storeCategory = await model.storeItemType
          .find({
            storeCategoryId: {
              $exists: false
            }
          })
          .distinct("_id");
        let emptyCats = [];
        for (let i = 0; i < data.storeCategory.length; i++) {
          //  let subCats = await model.storeItemType.find({
          //    parentId: data.storeCategory[i],
          //  });
          let prods = await model.storeItem.find({
            storeItemSubTypeId: data.storeCategory[i],
          });
          if (!prods || !prods.length) emptyCats.push(data.storeCategory[i]);
        }
        let deleted = await model.storeItemType.find({
          _id: {
            $in: emptyCats
          },
        });
        await model.storeItemType.deleteMany({
          _id: {
            $in: emptyCats
          }
        });

        let str = "";
        deleted.forEach((item) => {
          str += item.name + ", ";
        });
        done({
          message: `${str ? str : "Nothing"} Deleted, ${
            str
              ? "Rest of the Categories have either sub-categories or products already present in them"
              : ""
          }`,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  deleteAllStores(data, lang) {
    //NAMES OF VARIABLES ARE NOT MEANINGFUL IN THIS API
    // API HAS BEEN COPY PASTED FROM CATEGORY API
    return new Promise(async (done, reject) => {
      try {
        data = {};
        data.storeCategory = await model.store.find({}).distinct("_id");
        let emptyCats = [];
        for (let i = 0; i < data.storeCategory.length; i++) {
          let prods = await model.storeItem.find({
            storeId: data.storeCategory[i],
          });
          if (!prods || !prods.length) emptyCats.push(data.storeCategory[i]);
        }
        let deleted = await model.store.find({
          _id: {
            $in: emptyCats
          },
        });
        await model.store.deleteMany({
          _id: {
            $in: emptyCats
          }
        });

        let str = "";
        deleted.forEach((item) => {
          str += item.name + ", ";
        });
        done({
          message: `${str ? str : "Nothing"} Deleted, ${
            str
              ? "Rest of the Categories have either sub-categories or products already present in them"
              : ""
          }`,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  deleteSelectedStores(data, lang) {
    //NAMES OF VARIABLES ARE NOT MEANINGFUL IN THIS API
    // API HAS BEEN COPY PASTED FROM CATEGORY API
    return new Promise(async (done, reject) => {
      try {
        data.storeCategory = data.stores;
        let emptyCats = [];
        for (let i = 0; i < data.storeCategory.length; i++) {
          let prods = await model.storeItem.find({
            storeId: data.storeCategory[i],
          });
          if (!prods || !prods.length) emptyCats.push(data.storeCategory[i]);
        }
        let deleted = await model.store.find({
          _id: {
            $in: emptyCats
          },
        });
        await model.store.deleteMany({
          _id: {
            $in: emptyCats
          }
        });

        let str = "";
        deleted.forEach((item) => {
          str += item.name + ", ";
        });
        done({
          message: `${str ? str : "Nothing"} Deleted, ${
            str
              ? "Rest of the Categories have either sub-categories or products already present in them"
              : ""
          }`,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  deleteSelectedSubCategory(data, lang) {
    //NAMES OF VARIABLES ARE NOT MEANINGFUL IN THIS API
    // API HAS BEEN COPY PASTED FROM CATEGORY API
    return new Promise(async (done, reject) => {
      try {
        data.storeCategory = data.storeSubCategory;
        let emptyCats = [];
        for (let i = 0; i < data.storeCategory.length; i++) {
          //  let subCats = await model.storeItemType.find({
          //    parentId: data.storeCategory[i],
          //  });
          let prods = await model.storeItem.find({
            storeItemSubTypeId: data.storeCategory[i],
          });
          if (!prods || !prods.length) emptyCats.push(data.storeCategory[i]);
        }
        let deleted = await model.storeItemType.find({
          _id: {
            $in: emptyCats
          },
        });
        await model.storeItemType.deleteMany({
          _id: {
            $in: emptyCats
          }
        });

        let str = "";
        deleted.forEach((item) => {
          str += item.name + ", ";
        });
        if (str)
          done({
            message: `${str} Deleted Successfully`,
          });
        else
          done({
            message: `Nothing Deleted`,
          });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  bulkUploadSubCategory(dataToSend, file, lang) {
    return new Promise(async (done, reject) => {
      let index = 2;
      try {
        if (file == undefined) {
          return reject({
            message: multilingualService.getResponseMessage("FALSEMSG", lang),
          });
        }
        // const url = path.join(__dirname, `../../../uploads/csv/${file.filename}`);
        const url = `/var/www/html/${process.env.DIR_NAME}/server/uploads/csv/${file.filename}`;
        let workbook = await XLSX.readFile(url);
        let sheetName = workbook.SheetNames[0];
        let sheet = workbook.Sheets[sheetName];

        let results = [];
        let erroredField = [];
        let checker = sheet["A2"];
        let storeCategory = await model.storeItemType.find({
          isParent: true,
          status: 1,
        });

        let storeItemsMap = {};
        storeCategory.forEach((item) => {
          storeItemsMap[item.name] = item._id;
        });
        while (typeof checker === "object") {
          let data = {};
          let storeType = sheet[`A${index}`].w.trim();
          data.name = sheet[`B${index}`].w.trim();
          data.name_ar = sheet[`C${index}`].w.trim();
          data.parentId = storeItemsMap[storeType] ?
            mongoose.Types.ObjectId(storeItemsMap[storeType]) :
            (() => {
              erroredField.push({
                name: data.name,
                row: index,
                name_ar: data.name_ar,
                errorIn: "Store-Category",
              });
              return "";
            })();
          let image = sheet[`D${index}`].w.trim();
          if (image != null && image != "") {
            let imageData = await Service.upload.upload_from_url(image);
            let keyImage = image.substring(image.lastIndexOf('/') + 1);
            image = `${process.env.S3URL}${keyImage}`
          }
          data.image = image
          data.date = moment().valueOf();
          data.isSubCategory = true;
          results.push(data);
          index++;
          checker = sheet[`A${index}`];

          if (dataToSend.moduleKey) {
            data.moduleKey = dataToSend.moduleKey;
          }
        }
        for (let i = 0; i < results.length; i++) {
          try {
            await new model.storeItemType(results[i]).save();
          } catch (e) {}
        }
        fs.unlinkSync(url)
        done({
          message: "Done",
          data: erroredField
        });
      } catch (e) {
        reject({
          message: "Please check if all required fields are present in!" + index,
        });
      }

      // readXlsxFile(url)
      //   .then(async (rows) => {
      //     rows.shift();
      //     let storeCategory = await model.storeItemType.find({
      //       isParent: true,
      //       status: 1,
      //     });
      //     let storeItemsMap = {};
      //     storeCategory.forEach((item) => {
      //       storeItemsMap[item.name] = item._id;
      //     });
      //     let results = [];
      //     for (let i = 0; i < rows.length; i++) {
      //       let storeCategory = rows[i][0];
      //       let data = {};
      //       data.name = rows[i][1];
      //       data.parentId = mongoose.Types.ObjectId(
      //         storeItemsMap[storeCategory]
      //       );
      //       data.name_ar = rows[i][2];
      //       data.image = rows[i][3];
      //       data.isParent = false;
      //       data.isSubCategory = true;
      //       data.date = moment().valueOf();
      //       results.push(data);
      //     }
      //     for (let i = 0; i < results.length; i++) {
      //       try {
      //         await new model.storeItemType(results[i]).save();
      //       } catch (e) { }
      //     }
      //     return done({
      //       message: multilingualService.getResponseMessage("ADDMSG", lang),
      //       // data: resp,
      //     });
      //   })
      //   .catch((err) => {
      //     return reject({
      //       message: multilingualService.getResponseMessage("FALSEMSG", lang),
      //     });
      //   });
    });
  }

  getAllSubCategoryExport(data, lang) {
    return new Promise(async (done, reject) => {
      let pipeline = [{
        $match: {
          status: {
            $ne: 2
          },
          isSubCategory: true
        }
      }];
      pipeline.push({
        $lookup: {
          from: "storeitemtypes",
          localField: "parentId",
          foreignField: "_id",
          as: "category",
        },
      }, {
        $project: {
          _id: 1,
          categoryName: {
            $arrayElemAt: ["$category.name", 0]
          },
          name: 1,
          name_ar: 1,
          image: 1,
        },
      });
      let subCategory = await model.storeItemType.aggregate(pipeline).exec();

      var ws = XLSX.utils.json_to_sheet(subCategory, {
        header: ["categoryName", "name", "name_ar", "image"],
      });
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "subCategory");
      let sendFileName = "subCategory.xlsx";

      XLSX.writeFile(wb, "./server/uploads/exportedCsv/subCategory.xlsx");
      done({
        message: multilingualService.getResponseMessage(
          "FETCHED_SUCCESSFULLY",
          lang
        ),
        data: process.env.EXPORTURLLIVE + sendFileName,
      });
    });
  }

  getAllProductsExport(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        let pipeline = [];
        pipeline.push({
          $match: {
            isProto: true
          }
        }, {
          $lookup: {
            from: "storeitemtypes",
            localField: "storeItemTypeId",
            foreignField: "_id",
            as: "category",
          },
        }, {
          $lookup: {
            from: "storeitemtypes",
            localField: "storeItemSubTypeId",
            foreignField: "_id",
            as: "subCategory",
          },
        }, {
          $lookup: {
            from: "brands",
            localField: "brandId",
            foreignField: "_id",
            as: "brand",
          },
        }, {
          $lookup: {
            from: "storecategories",
            localField: "storeTypeId",
            foreignField: "_id",
            as: "storeType",
          },
        }, {
          $project: {
            productKey: 1,
            productName: 1,
            productName_ar: 1,
            name_ar: 1,
            name: 1,
            description_ar: 1,
            description: 1,
            categoryName: {
              $arrayElemAt: ["$category.name", 0]
            },
            subCategoryName: {
              $arrayElemAt: ["$subCategory.name", 0]
            },
            storeType: {
              $arrayElemAt: ["$storeType.name", 0]
            },
            price: 1,
            brand: {
              $arrayElemAt: ["$brand.name", 0]
            },
            size: 1,
            color: 1,
            unit: 1,
            unitValue: 1,
            image1: 1,
            image2: 1,
            image3: 1,
            image4: 1,
            image5: 1,
            video: 1,
            additional1: 1,
            additional2: 1,
            additional1_ar: 1,
            additional2_ar: 1,
          },
        });

        if (data.storeId) {
          pipeline[0] = {
            $match: {
              storeId: mongoose.Types.ObjectId(data.storeId),
              isProto: false,
            },
          };
        }
        let products = await model.storeItem.aggregate(pipeline).exec();
        let columns = [{
            label: "productKey",
            value: "productKey"
          },
          {
            label: "productName",
            value: "productName"
          },
          {
            label: "productName_ar",
            value: "productName_ar"
          },
          {
            label: "name",
            value: "name"
          },
          {
            label: "name_ar",
            value: "name_ar"
          },
          {
            label: "description",
            value: "description"
          },
          {
            label: "description_ar",
            value: "description_ar"
          },
          {
            label: "categoryName",
            value: "categoryName"
          },
          {
            label: "subCategoryName",
            value: "subCategoryName"
          },
          {
            label: "price",
            value: "price"
          },
          {
            label: "brand",
            value: "brand"
          },
          {
            label: "size",
            value: "size"
          },
          {
            label: "color",
            value: "color"
          },
          {
            label: "unit",
            value: "unit"
          },
          {
            label: "unitValue",
            value: "unitValue"
          },
          {
            label: "additional1",
            value: "additional1"
          },
          {
            label: "additional2",
            value: "additional2"
          },
          {
            label: "image1",
            value: "image"
          },
          {
            label: "image2",
            value: "image2"
          },
          {
            label: "image3",
            value: "image3"
          },
          {
            label: "image4",
            value: "image4"
          },
          {
            label: "image5",
            value: "image5"
          },
          {
            label: "video",
            value: "video"
          },
          {
            label: "additional1_ar",
            value: "additional1_ar"
          },
          {
            label: "additional2_ar",
            value: "additional2_ar"
          },
          {
            label: "storeType",
            value: "storeType"
          },
        ];
        let headers = columns.map((item) => item.label);
        var ws = XLSX.utils.json_to_sheet(products, {
          header: headers,
        });
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "products");
        let sendFileName = "products";
        if (data.storeId) {
          sendFileName = await model.store
            .findById(data.storeId)
            .select("name");
          sendFileName = sendFileName.name.split(" ").join("_");
        }
        sendFileName = `${sendFileName}.xlsx`;
        XLSX.writeFile(wb, `./server/uploads/exportedCsv/${sendFileName}`);
        done({
          message: multilingualService.getResponseMessage(
            "FETCHED_SUCCESSFULLY",
            lang
          ),
          data: process.env.EXPORTURLLIVE + sendFileName,
        });
      } catch (e) {
        reject({
          error: e
        });
      }
    });
  }
  addBrand(data, file, lang, finalFileName, geofenceId) {
    return new Promise(async (done, reject) => {
      if (geofenceId == "NA") geofenceId = null;
      let qry = {
        status: {
          $ne: 2
        }
      };
      if (data.moduleKey) {
        qry.moduleKey = data.moduleKey;
      }
      if (data.name) {
        qry.name = data.name
      }
      if (data.geofenceId != "NA") {
        qry.geofenceId = mongoose.Types.ObjectId(data.geofenceId)
      }
      let checkBrand = await model.brand.findOne(qry)
      if (checkBrand != null) {
        return reject({
          message: multilingualService.getResponseMessage("ALREADYEXISTS", lang),
          data: err,
        });
      }
      let brand = new model.brand({
        name: data.name,
        name_ar: data.name_ar,
        date: moment().valueOf(),
        image: process.env.S3URL + finalFileName,
        moduleKey: data.moduleKey,
        geofenceId: geofenceId,
      });
      brand
        .save()
        .then((result) => {
          done({
            message: multilingualService.getResponseMessage("ADDMSG", lang),
            data: result,
          });
        })
        .catch((err) => {
          if (err.errors) return reject({
            message: multilingualService.getResponseMessage("FALSEMSG", lang),
            data: err,
          });
        });
    });
  }

  editBrand(data, file, lang, finalFileName) {
    return new Promise(async (done, reject) => {
      try {
        if (finalFileName) data.image = process.env.S3URL + finalFileName;

        // model.brand
        //   .findOne({
        //     name: new RegExp("^" + data.name + "$", "i"),
        //     _id: { $ne: data.updateId },
        //     status: { $ne: 2 },
        //   })
        //   .then(async (brand) => {
        //     if (brand)
        //       return reject({
        //         message: multilingualService.getResponseMessage(
        //           "BRANDEXISTS",
        //           lang
        //         ),
        //       });
        let result = await model.brand.findByIdAndUpdate(data.updateId, data, {
          new: true,
        });
        if (data.status === 2) {
          done({
            message: multilingualService.getResponseMessage("DELETEMSG", lang),
            data: result,
          });
        }
        if (data.status === 1) {
          done({
            message: multilingualService.getResponseMessage("UPDATEMSG", lang),
            data: result,
          });
        }
        if (data.status === 0) {
          done({
            message: multilingualService.getResponseMessage(
              "BRANDBLOCKED",
              lang
            ),
            data: result,
          });
        }
        if (data.status === 3) {
          done({
            message: multilingualService.getResponseMessage(
              "BRANDUNBLOCKED",
              lang
            ),
            data: result,
          });
        }

        done({
          message: multilingualService.getResponseMessage("UPDATEMSG", lang),
          data: result,
        });

        // model.brand
        //   .findByIdAndUpdate(data.updateId, data, { new: true })
        //   .then((result) => {
        //     done({
        //       message:
        //         Number(data.status) == 2
        //           ? multilingualService.getResponseMessage("DELETEMSG", lang)
        //           : multilingualService.getResponseMessage("UPDATEMSG", lang),
        //       data: result,
        //     });
        //   });
        // });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
          data: err,
        });
      }
    });
  }

  getBrand(data, lang, geofenceId) {
    return new Promise(async (done, reject) => {
      try {
        if (data.all == true || data.all == "true") {
          let dataNew;
          let filter = {};
          if (data.moduleKey) filter.moduleKey = data.moduleKey;
          if (geofenceId != "NA") filter.geofenceId = geofenceId;
          dataNew = await model.brand.find(filter);
          done({
            message: multilingualService.getResponseMessage(
              "FETCHED_SUCCESSFULLY",
              lang
            ),
            data: dataNew,
          });
          return;
        }
        const limit = Number(data.limit) || Constant.ADMINLIMIT;
        const page = Math.max(1, Number(data.page) || 0);
        const skip = Math.max(0, page - 1) * limit;
        const sort = {
          _id: -1
        };

        const query = {
          limit,
          page,
          skip,
          search: data.search
        };
        let filter = {};
        if (data.moduleKey) filter.moduleKey = data.moduleKey;
        if (geofenceId != "NA") filter.geofenceId = geofenceId;
        if (data.search) {
          const regex = {
            $regex: `${data.search}`,
            $options: "i"
          };
          filter.$or = [{
            name: regex
          }];
        }
        const itemCount = await model.brand.countDocuments(filter);
        const pageCount = Math.ceil(itemCount / limit);
        const brandList = await model.brand
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean();

        const message =
          brandList.length <= 0 ?
          multilingualService.getResponseMessage("EMPTY_LIST", lang) :
          multilingualService.getResponseMessage(
            "FETCHED_SUCCESSFULLY",
            lang
          );
        done({
          message: message,
          data: {
            query,
            brandList,
            itemCount,
            pageCount
          },
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  deleteBrand(data, lang) {
    return new Promise(async (done, reject) => {
      let product = await model.storeItem.findOne({
        brandId: data.id,
      });
      if (product) {
        reject({
          message: "Product Exists for this Brand, Delete Operation Failed",
          data: product,
        });
        return;
      }
      let deleted = await model.brand.findByIdAndDelete(data.id);
      if (deleted) {
        done({
          message: "DELETED SUCCESSFULLY",
        });
      } else {
        reject({
          message: "WrongIdError",
        });
      }
    });
  }

  deleteAllBrand(data, lang) {
    //NAMES OF VARIABLES ARE NOT MEANINGFUL IN THIS API
    // API HAS BEEN COPY PASTED FROM CATEGORY API
    return new Promise(async (done, reject) => {
      try {
        data = {};
        data.storeCategory = await model.brand.find({}).distinct("_id");
        let emptyCats = [];
        for (let i = 0; i < data.storeCategory.length; i++) {
          //  let subCats = await model.brand.find({
          //    parentId: data.storeCategory[i],
          //  });
          let prods = await model.storeItem.find({
            brandId: data.storeCategory[i],
          });
          if (!prods || !prods.length) emptyCats.push(data.storeCategory[i]);
        }
        let deleted = await model.brand.find({
          _id: {
            $in: emptyCats
          },
        });
        await model.brand.deleteMany({
          _id: {
            $in: emptyCats
          }
        });

        let str = "";
        deleted.forEach((item) => {
          str += item.name + ", ";
        });
        done({
          message: `${str ? str : "Nothing"} Deleted, ${
            str
              ? "Rest of the Categories have either sub-categories or products already present in them"
              : ""
          }`,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  deleteSelectedBrand(data, lang) {
    //NAMES OF VARIABLES ARE NOT MEANINGFUL IN THIS API
    // API HAS BEEN COPY PASTED FROM CATEGORY API
    return new Promise(async (done, reject) => {
      try {
        data.storeCategory = data.storeBrand;
        let emptyCats = [];
        for (let i = 0; i < data.storeCategory.length; i++) {
          //  let subCats = await model.storeItemType.find({
          //    parentId: data.storeCategory[i],
          //  });
          let prods = await model.storeItem.find({
            brandId: data.storeCategory[i],
          });
          if (!prods || !prods.length) emptyCats.push(data.storeCategory[i]);
        }
        let deleted = await model.brand.find({
          _id: {
            $in: emptyCats
          },
        });
        await model.brand.deleteMany({
          _id: {
            $in: emptyCats
          }
        });

        let str = "";
        deleted.forEach((item) => {
          str += item.name + ", ";
        });
        done({
          message: `${str ? str : "Nothing"} Deleted, ${
            str
              ? "Rest of the Categories have either sub-categories or products already present in them"
              : ""
          }`,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  bulkUploadBrand(dataToSend, file, lang) {
    return new Promise(async (done, reject) => {
      let index = 2;
      try {
        if (file == undefined) {
          return reject({
            message: multilingualService.getResponseMessage("FALSEMSG", lang),
          });
        }
        // const url = path.join(__dirname, `../../../uploads/csv/${file.filename}`);
        const url = `/var/www/html/${process.env.DIR_NAME}/server/uploads/csv/${file.filename}`;
        let workbook = await XLSX.readFile(url);
        let sheetName = workbook.SheetNames[0];
        let sheet = workbook.Sheets[sheetName];

        let results = [];
        let checker = sheet["A2"];
        while (typeof checker === "object") {
          let data = {};
          data.name = sheet[`A${index}`].w.trim();
          data.name_ar = sheet[`B${index}`].w.trim();
          let image = sheet[`C${index}`].w.trim();
          if (image != null && image != "") {
            let imageData = await Service.upload.upload_from_url(image);
            let keyImage = image.substring(image.lastIndexOf('/') + 1);
            image = `${process.env.S3URL}${keyImage}`
          }
          data.image = image
          data.date = moment().valueOf();
          results.push(data);
          index++;
          checker = sheet[`A${index}`];

          if (dataToSend.moduleKey) {
            data.moduleKey = dataToSend.moduleKey;
          }
        }
        for (let i = 0; i < results.length; i++) {
          try {
            await new model.brand(results[i]).save();
          } catch (e) {}
        }
        fs.unlinkSync(url)
        done({
          message: "Done"
        });
      } catch (e) {
        reject({
          message: "Please check if all required fields are present in" + index,
        });
      }
    });
  }

  deleteProduct(data, lang) {
    return new Promise(async (done, reject) => {
      let deleted = await model.storeItem.deleteMany({
        productKey: data.id
      });
      if (deleted.deletedCount) {
        done({
          message: "DELETED_SUCCESSFULLY",
        });
      } else {
        reject({
          message: "WrongIdError",
        });
      }
    });
  }

  getAllBrandExport(data, lang) {
    return new Promise(async (done, reject) => {
      let pipeline = [];
      if (data.query.moduleKey)
        pipeline.push({
          $match: {
            status: {
              $ne: 2
            },
            moduleKey: data.query.moduleKey
          },
        });
      else pipeline.push({
        $match: {
          status: {
            $ne: 2
          }
        }
      });

      pipeline.push({
        $project: {
          name: 1,
          name_ar: 1,
          image: 1,
          _id: 0
        }
      });
      let brand = await model.brand.aggregate(pipeline).exec();

      var ws = XLSX.utils.json_to_sheet(brand, {
        header: ["name", "name_ar", "image"],
      });
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "brand");
      let sendFileName = "brand.xlsx";

      XLSX.writeFile(wb, "./server/uploads/exportedCsv/brand.xlsx");
      done({
        message: multilingualService.getResponseMessage(
          "FETCHED_SUCCESSFULLY",
          lang
        ),
        data: process.env.EXPORTURLLIVE + sendFileName,
      });
    });
  }

  async addStoreItem(data, files, lang, geofenceId) {
    return new Promise(async (done, reject) => {
      data.isProto = true;
      if (data.storeId) {
        data.isProto = false;
        data.storeExclusive = true;
      }
      const store = await model.store.findById(data.storeId)
      if (store != null && store.storePackageType != null && store.storePackageType == "membership") {
        if (store.productCount == 0) {
          reject({
            message: multilingualService.getResponseMessage("STORE_MEMBERSHIP_EXPIRED", lang),
            data: {},
          });
        }
        store.productCount = store.productCount - 1
        await model.store.findByIdAndUpdate(store._id, {
          $set: {
            orderCount: store.productCount
          }
        })
      }
      let storeItem = data;
      for (let x in storeItem.variants) {
        // for validation
        if (!storeItem.variants[x].unit && !storeItem.variants[x].unitValue && (!storeItem.variants[x].size || (storeItem.variants[x].size && !storeItem.variants[x].size.length)) && (!storeItem.variants[x].color || (storeItem.variants[x].color && !storeItem.variants[x].color.length))) {
          return reject({
            message: multilingualService.getResponseMessage(
              "PARAMETERMISSING",
              lang
            ),
          });
        }
        if (storeItem.variants[x].unit || storeItem.variants[x].unitValue) {
          if (!storeItem.variants[x].unit || !storeItem.variants[x].unitValue) {
            return reject({
              message: multilingualService.getResponseMessage(
                "PARAMETERMISSING",
                lang
              ),
            });
          }
        }
        if ((storeItem.variants[x].size && storeItem.variants[x].size.length) || (storeItem.variants[x].color && storeItem.variants[x].color.length)) {
          if ((storeItem.variants[x].size && !storeItem.variants[x].size.length) || (storeItem.variants[x].color && !storeItem.variants[x].color.length)) {
            return reject({
              message: multilingualService.getResponseMessage(
                "PARAMETERMISSING",
                lang
              ),
            });
          }
        }
      }
      let productKey = nanoid(10);
      let filesMap = {};
      let variantImageCheck = {};
      files.forEach((file) => {
        file.originalname = file.originalname.split(".")[0];
        variantImageCheck[file.originalname.split("_")[0]] = "";
        filesMap[file.originalname] = /* Constant.STOREITEMIMAGE + */ file.location;
      });
      if (geofenceId == "NA") geofenceId = null;
      storeItem.variants.forEach(async (item, index) => {
        let storeItem = this.createStoreItem({
            isProto: data.isProto,
            productName: data.productName,
            productName_ar: data.productName_ar,
            brandId: data.brandId,
            productKey: productKey,
            storeItemTypeId: data.storeItemTypeId,
            storeItemSubTypeId: data.storeItemSubTypeId,
            storeId: data.storeId,
            color: item.color,
            description_ar: item.description_ar,
            description: item.description,
            name_ar: item.name_ar,
            name: item.name,
            size: item.size,
            unit: item.unit,
            unitValue: item.unitValue,
            variantId: item.variantId,
            sku_number: item.sku_number,
	visible:item.visible,
            additional1: "",
            additional2: "",
            price: item.price,
            discountType: item.discountType ? item.discountType : "none",
            discount: item.discount ? item.discount : 0,
            originalPrice: item.originalPrice ? item.originalPrice : item.price,
            storeTypeId: data.storeTypeId,
            storeExclusive: data.storeExclusive ? true : false,
            moduleKey: data.moduleKey,
            marketPrice: item.marketPrice,
            LP: item.LP,
            geofenceId: geofenceId,
            mainQuantity: data.quantity
          },
          filesMap
        );
        // storeItem['sku_number'] = item.sku_number
        storeItem
          .save()
          .then(async (result) => {
            // await model.InventoryLog({
            //   itemId: result._id,
            //   logs: [{
            //     itemQuantity: result.quantity,
            //     date: new Date()
            //   }]
            // }).save();
            let storeOutletDetails = await model.storeOutlet.find({
              storeId: data.storeId
            })
            for (let outlet of storeOutletDetails) {
              let users;
              if (outlet.deliveryAreaType == "fixed_area") {
                users = await model.user.find({
                  location: {
                    $near: {
                      $geometry: {
                        type: "Point",
                        coordinates: [outlet.longitude, outlet.latitude]
                      },
                      $minDistance: 0,
                      $maxDistance: outlet.deliveryArea
                    }
                  }
                })
              } else {
                users = await model.user.find({
                  location: {
                    $geoWithin: {
                      $geometry: {
                        type: "Polygon",
                        coordinates: outlet.geoLongLat.coordinates
                      }
                    }
                  }
                })
              }
              for (let user of users) {
                let payload = {
                  userId: user._id,
                  title: "New Product Added",
                  notimessage: "New Product Added to the store",
                  type: 1
                }
                await Service.Notification.usersend(payload)
              }
            }
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
            // return reject({
            //   message: multilingualService.getResponseMessage("FALSEMSG", lang),
            //   data: err,
            // });
          });
      });
    });
  }

  createStoreItem(data, filesMap) {
    for (let i = 1; i <= 5; i++) {
      if (filesMap[`${data.variantId}_image${i}`]) {
        data[`image${i}`] = filesMap[`${data.variantId}_image${i}`];
      }
    }
    if (filesMap[`${data.variantId}_video`])
      data[`video`] = filesMap[`${data.variantId}_video`];
    let storeItem = new model.storeItem(data);
    storeItem.date = moment().valueOf();
    // if (file) storeItem.image = Constant.STOREITEMIMAGE + file.filename;
    return storeItem;
  }

  editStoreItem(data, files, lang) {
    return new Promise(async (done, reject) => {
      data = JSON.parse(data.data);
      let productKey = data.productKey;
      let filesMap = {};
      files.forEach((file) => {
        file.originalname = file.originalname.split(".")[0];
        filesMap[file.originalname] = file.location;
      });

      let variantIds = [];
      data = data.variants.map((item) => {
        item = Object.assign(item, data);
        delete item.variants;
        variantIds.push(item.variantId);
        for (let i = 1; i <= 5; i++) {
          if (filesMap[`${item.variantId}_image${i}`]) {
            item[`image${i}`] = filesMap[`${item.variantId}_image${i}`];
          }
        }
        if (filesMap[`${item.variantId}_video`]) {
          item[`video`] = filesMap[`${item.variantId}_video`];
        }

        item.status = true;
        return item;
      });
//	console.log("Edit Variant",data);
      for (let i = 0; i < data.length; i++) {
	data[i].originalPrice = data[i].originalPrice !== 0 ? data[i].originalPrice : data[i].price; 
	
        delete data[i]._id;
        data[i].mainQuantity = data[i].quantity
//	console.log("Data before update",data[i]);
        let variant = await model.storeItem.findOneAndUpdate({
          variantId: data[i].variantId
        }, data[i], {
          //isProto: { $or : [true , false]}
          new: true,
        }).select("-price -quantity -purchaseLimit -dealAppliedBy -tickets -discount -discountType -originalPrice -discountedPriceExcTax -priceExcTax -_id -isProto -visible");
//	console.log("Variant after update ",variant.visible);        
if (!variant) {
          // that means new vairant has been added
          let stores = await model.storeItem.find({
            productKey: data[i].productKey
          }).distinct("storeId");
          let newVariants = stores.map((item) => {
            data[i]["storeId"] = item;
            data[i]["isProto"] = false;
            data[i].mainQuantity = data[i].quantity
            delete data[i]._id;
            return JSON.parse(JSON.stringify(data[i]));
          });
          const update = await model.storeItem.insertMany(newVariants);
  //        await model.InventoryLog({
  //          itemId: update._id,
  //          logs: [{
  //            itemQuantity: update.quantity,
  //            date: new Date()
  //          }]
  //        }).save();
        }
        if (variant) {
//          await model.InventoryLog.findOneAndUpdate({
//            itemId: variant._id
//          }, {
//            $push: {
//              logs: [{
//                itemQuantity: data[i].quantity,
//                date: new Date()
//              }]
//            }
//          })
//	console.log("Inside varaiane",variant);
          delete variant._id;
          await model.storeItem.updateMany({
              variantId: variant.variantId,
              isProto: false
            },
            variant
          );

          //   done({message : "Updated Successfully ",
          //         data : sendData
          // })
        }
      }

      done({
        message: "Updated Successfully"
      });
    });
  }

  getAllStoreItems(data, lang, geofenceId) {
    return new Promise(async (done, reject) => {
      let skip =
        Number(data.page) && Number(data.page) > 1 ?
        (Number(data.page) - 1) * Constant.ADMINLIMIT :
        0;
      let limit = Constant.ADMINLIMIT;
      let Arr = [{
        status: {
          $ne: 2
        }
      }];
      if (data.name && data.name != "") {
        Arr.push({
          $or: [{
              productName: new RegExp(data.name, "i")
            },
            {
              productName_ar: new RegExp(data.name, "i")
            },
          ],
        });
      }
      let qry = Arr.length == 1 ? Arr[0] : {
        $and: Arr
      };
      qry.isProto = true;

      if (data.all) {
        skip = 0;
        limit = 5000;
      }
      if (data.storeTypeId) {
        qry.storeTypeId = mongoose.Types.ObjectId(data.storeTypeId);
      }
      if (data.categoryId) {
        qry.storeItemTypeId = mongoose.Types.ObjectId(data.categoryId);
      }
      if (data.subCategoryId) {
        qry.storeItemSubTypeId = mongoose.Types.ObjectId(data.subCategoryId);
      }
      if (data.brandId) {
        qry.brandId = mongoose.Types.ObjectId(data.brandId);
      }
      if (data.moduleKey) {
        qry.moduleKey = data.moduleKey;
      }
      if (data.storeId) {
        qry.isProto = false;
        qry.storeId = mongoose.Types.ObjectId(data.storeId);
      }
      // if (geofenceId != "NA")
      //   qry.geofenceId = mongoose.Types.ObjectId(geofenceId);
      let result = await model.storeItem.aggregate([{
          $match: qry,
        },

        {
          $group: {
            _id: "$productKey",
            productName: {
              $first: "$productName"
            },
            productName_ar: {
              $first: "$productName_ar"
            },
            storeItemSubTypeId: {
              $first: "$storeItemSubTypeId"
            },
            storeItemTypeId: {
              $first: "$storeItemTypeId"
            },
            brandId: {
              $first: "$brandId"
            },
            createdAt: {
              $first: "$createdAt"
            },
            storeTypeId: {
              $first: "$storeTypeId"
            },
            isRecommended: {
              $first: "$isRecommended"
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
            from: "storeitemtypes",
            localField: "storeItemSubTypeId",
            foreignField: "_id",
            as: "storeItemSubTypeId",
          },
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
          $lookup: {
            from: "brands",
            localField: "brandId",
            foreignField: "_id",
            as: "brandId",
          },
        },
        {
          $lookup: {
            from: "storecategories",
            localField: "storeTypeId",
            foreignField: "_id",
            as: "storeTypeId",
          },
        },
        {
          $project: {
            _id: 1,
            createdAt: 1,
            productName: 1,
            productName_ar: 1,
            isRecommended: 1,
            storeItemSubTypeId: {
              $arrayElemAt: ["$storeItemSubTypeId", 0]
            },
            storeItemTypeId: {
              $arrayElemAt: ["$storeItemTypeId", 0]
            },
            brandId: {
              $arrayElemAt: ["$brandId", 0]
            },
            storeTypeId: {
              $arrayElemAt: ["$storeTypeId", 0]
            },
            variants: 1,
          },
        },
        {
          $sort: {
            createdAt: -1
          }
        },
        {
          $skip: skip
        },
        {
          $limit: limit
        },
      ]);
      let count = await model.storeItem.aggregate([{
          $match: qry,
        },

        {
          $group: {
            _id: "$productKey",
            productName: {
              $first: "$productName"
            },
            productName_ar: {
              $first: "$productName_ar"
            },
            storeItemSubTypeId: {
              $first: "$storeItemSubTypeId"
            },
            storeItemTypeId: {
              $first: "$storeItemTypeId"
            },
            brandId: {
              $first: "$brandId"
            },
            createdAt: {
              $first: "$createdAt"
            },
            storeTypeId: {
              $first: "$storeTypeId"
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
          $count: "totalCount",
        },
      ]);
      if (count && count.length == 0) {
        count = [{
          maxCount: 0
        }];
      }
      result.map((item) => {
        item.storeItemSubTypeId = _.pick(item.storeItemSubTypeId, [
          "storeItemSubTypeId",
          "name",
          "name_ar",
          "isSubCategory",
          "_id",
          "isParent",
          "parentId",
        ]);
        item.storeItemTypeId = _.pick(item.storeItemTypeId, [
          "storeItemTypeId",
          "name",
          "name_ar",
          "isSubCategory",
          "_id",
          "isParent",
          "parentId",
        ]);
        item.brandId = _.pick(item.brandId, [
          "brandId",
          "name_ar",
          "name",
          "_id",
        ]);
        return item;
      });

      result = result.map((item) => {
        for (let i = 0; i < item.variants.length; i++) {
          for (let j = 1; j < 5; j++) {
            if (item.variants[i][`image${j}`]) {
              item["image"] = item.variants[i][`image${j}`];
              return item;
            }
          }
        }
        return item;
      });
      done({
        message: multilingualService.getResponseMessage(
          "FETCHED_SUCCESSFULLY",
          lang
        ),

        data: {
          list: result,
          count
        },
      });
    });
  }

  getAllStoreItemById(id, query, lang) {
    return new Promise(async (done, reject) => {
      let isProto = query.isProto;
      if (isProto == "true") isProto = true;
      else isProto = false;
      let qry = {};
      qry["productKey"] = id;
      qry["$or"] = [{
        isProto: isProto
      }, {
        storeExclusive: true
      }];
      let result = await model.storeItem.aggregate([{
          $match: qry,
        },
        {
          $group: {
            _id: "$productKey",
            productName: {
              $first: "$productName"
            },
            productName_ar: {
              $first: "$productName_ar"
            },
            storeItemSubTypeId: {
              $first: "$storeItemSubTypeId"
            },
            storeItemTypeId: {
              $first: "$storeItemTypeId"
            },
            brandId: {
              $first: "$brandId"
            },
            createdAt: {
              $first: "$createdAt"
            },
            storeTypeId: {
              $first: "$storeTypeId"
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
		visible:"$$ROOT.visible",
                _id: "$$ROOT._id",
              },
            },
          },
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
          $lookup: {
            from: "storeitemtypes",
            localField: "storeItemTypeId",
            foreignField: "_id",
            as: "storeItemTypeId",
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
            from: "storecategories",
            localField: "storeTypeId",
            foreignField: "_id",
            as: "storeTypeId",
          },
        },
        {
          $project: {
            _id: 1,
            createdAt: 1,
            productName: 1,
            productName_ar: 1,
            storeItemSubTypeId: {
              $arrayElemAt: ["$storeItemSubTypeId", 0]
            },
            storeTypeId: {
              $arrayElemAt: ["$storeTypeId", 0]
            },

            storeItemTypeId: {
              $arrayElemAt: ["$storeItemTypeId", 0]
            },
            brandId: {
              $arrayElemAt: ["$brandId", 0]
            },
            variants: 1,
          },
        },
      ]);
      result = result.map((item) => {
        for (let i = 0; i < item.variants.length; i++) {
          for (let j = 1; j < 5; j++) {
            if (item.variants[i][`image${j}`]) {
              item["image"] = item.variants[i][`image${j}`];
              return item;
            }
          }
        }
        return item;
      });
      done({
        message: multilingualService.getResponseMessage(
          "FETCHED_SUCCESSFULLY 101",
          lang
        ),
        data: {
          list: result
        },
      });

      return;
    });
  }

  bulkUploadProduct(dataToSend, file, lang, query) {
    return new Promise(async (done, reject) => {
      try {
        if (file == undefined) {
          return reject({
            message: multilingualService.getResponseMessage("FALSEMSG", lang),
          });
        }
        const url = `/var/www/html/${process.env.DIR_NAME}/server/uploads/csv/${file.filename}`;
        let workbook = await XLSX.readFile(url); //read file
        let sheetName = workbook.SheetNames[0]; //Get first_sheet_name
        let sheet = workbook.Sheets[sheetName]; // Get worksheet by name
        let index = 2;
        let checker = sheet["A2"];
        /*pushing through loop*/
        let bigHash = {};
        while (sheet[`A${index}`] && typeof checker === "object") {
          if (bigHash[sheet[`A${index}`].w.trim()]) {
            let obj = bigHash[sheet[`A${index}`].w.trim()];
            if (obj.storeType != sheet[`Z${index}`].w.trim()) {
              return reject({
                message: "Different Store Type for Same Products with multiple variants check row number: " +
                  index,
              });
            }
            if (obj.storeItemType != sheet[`H${index}`].w.trim()) {
              return reject({
                message: "Different Category for Same Products with multiple variants check row number: " +
                  index,
              });
            }
            if (obj.storeItemSubType != sheet[`I${index}`].w.trim()) {
              return reject({
                message: "Different SubCategory for Same Products with multiple variants check row number: " +
                  index,
              });
            }
          } else {
            bigHash[sheet[`A${index}`].w.trim()] = {
              storeType: sheet[`Z${index}`] ? sheet[`Z${index}`].w.trim() : "",
              storeItemType: sheet[`H${index}`] ? sheet[`H${index}`].w.trim() : "",
              storeItemSubType: sheet[`I${index}`] ? sheet[`I${index}`].w.trim() : "",
            };
          }
          index++;
          checker = sheet[`A${index}`];
        }
        /*creating maps*/
        let storeType = await model.storeCategory.find({}).select("name");

        let storeCategory = await model.storeItemType.aggregate([{
            $match: {
              isParent: true,
              storeCategoryId: {
                $exists: true
              }
            }
          },
          {
            $lookup: {
              from: "storecategories",
              localField: "storeCategoryId",
              foreignField: "_id",
              as: "parentStoreType",
            },
          },
          {
            $unwind: "$parentStoreType",
          },
          {
            $project: {
              name: 1,
              _id: 1,
              "parentStoreType.name": 1
            },
          },
        ]);

        let storeSubCategory = await model.storeItemType.aggregate([{
            $match: {
              isParent: false,
              parentId: {
                $exists: true
              },
            },
          },
          {
            $lookup: {
              from: "storeitemtypes",
              localField: "parentId",
              foreignField: "_id",
              as: "parentCategory",
            },
          },
          {
            $unwind: "$parentCategory",
          },
          {
            $lookup: {
              from: "storecategories",
              localField: "parentCategory.storeCategoryId",
              foreignField: "_id",
              as: "parentStoreType",
            },
          },
          {
            $unwind: "$parentStoreType",
          },

          {
            $project: {
              name: 1,
              _id: 1,
              "parentCategory.name": 1,
              "parentStoreType.name": 1,
            },
          },
        ]);

        let storeTypeMap = {};
        let categoryMap = {};
        let storeSubCategoryMap = {};

        storeType.forEach((item) => {
          storeTypeMap[item.name] = item._id;
        });

        storeCategory.forEach((item) => {
          categoryMap[`${item.name}_${item.parentStoreType.name}`] = item._id;
        });

        storeSubCategory.forEach((item) => {
          storeSubCategoryMap[
            `${item.name}_${item.parentCategory.name}_${item.parentStoreType.name}`
          ] = item._id;
        });

        let brandsMap = {};
        let brands = await model.brand.find().select("name");
        brands.forEach((item) => {
          brandsMap[item.name] = item._id;
        });

        /*intialization*/
        let results = [];
        let erroredField = [];

        index = 2;
        checker = sheet["A2"];
        while (typeof checker === "object") {
          let data = {};
          data.productKey = sheet[`A${index}`] ? sheet[`A${index}`].w.trim() : "";
          data.productName = sheet[`B${index}`] ? sheet[`B${index}`].w.trim() : "";
          data.productName_ar = sheet[`C${index}`] ?
            sheet[`C${index}`].w.trim() :
            "";
          data.name = sheet[`D${index}`] ? sheet[`D${index}`].w.trim() : "";
          data.name_ar = sheet[`E${index}`] ? sheet[`E${index}`].w.trim() : "";
          data.description = sheet[`F${index}`] ?
            sheet[`F${index}`].w.trim() :
            "Empty Desciption";
          data.description_ar = sheet[`G${index}`] ?
            sheet[`G${index}`].w.trim() :
            "Empty Desciption";
          let storeType = sheet[`Z${index}`] ? sheet[`Z${index}`].w.trim() : "";
          let storeItemType = sheet[`H${index}`] ? sheet[`H${index}`].w.trim() : "";
          let storeItemSubType = sheet[`I${index}`] ? sheet[`I${index}`].w.trim() : "";
          storeItemSubType = `${storeItemSubType}_${storeItemType}_${storeType}`;
          storeItemType = `${storeItemType}_${storeType}`;
          data.storeItemTypeId = categoryMap[storeItemType] ?
            mongoose.Types.ObjectId(categoryMap[storeItemType]) :
            (() => {
              erroredField.push({
                productKey: data.productKey,
                row: index,
                productName: data.productName,
                errorIn: "Store-Category",
              });
              return "";
            })();
          data.storeItemSubTypeId = storeSubCategoryMap[storeItemSubType] ?
            mongoose.Types.ObjectId(storeSubCategoryMap[storeItemSubType]) :
            (() => {
              erroredField.push({
                productKey: data.productKey,
                row: index,
                productName: data.productName,
                errorIn: "Store-SubCategory",
              });
              return "";
            })();
          data.storeTypeId = storeTypeMap[storeType] ?
            mongoose.Types.ObjectId(storeTypeMap[storeType]) :
            (() => {
              erroredField.push({
                productKey: data.productKey,
                row: index,
                productName: data.productName,
                errorIn: "Store-Type",
              });
              return "";
            })();
          data.price = sheet[`J${index}`] ? sheet[`J${index}`].w.trim() : 0;
          data.marketPrice = Number(data.price);
          data.price = Number(data.price);
          data.price = data.price == NaN || !data.price ? 0 : data.price;
          let brand = sheet[`K${index}`] ? sheet[`K${index}`].w.trim() : "";
          let brandId = /* brandsMap[brand] */ await model.brand.findOne({
            name: brand
          }, {
            _id: 1
          })
          data.brandId = brandId != null ? /* mongoose.Types.ObjectId(brandsMap[brand]) */ brandId._id :
            (() => {
              erroredField.push({
                productKey: data.productKey,
                row: index,
                productName: data.productName,
                errorIn: "Brand",
              });
              return "";
            })();
          // data.size = sheet[`L${index}`]? sheet[`L${index}`].w:[];
          data.color = sheet[`M${index}`] ? sheet[`M${index}`].w.trim() : "";
          data.unit = sheet[`N${index}`] ? sheet[`N${index}`].w.trim() : "";
          data.unitValue = sheet[`O${index}`] ?
            sheet[`O${index}`].w.trim() :
            "";
          data.unitValue = Number(data.unitValue);
          data.unitValue =
            data.unitValue == NaN || !data.unitValue ? 0 : data.unitValue;
          data.additional1 = sheet[`P${index}`] ?
            sheet[`P${index}`].w.trim() :
            "";
          data.additional2 = sheet[`Q${index}`] ?
            sheet[`Q${index}`].w.trim() :
            "";
          let image1 = sheet[`R${index}`] ? sheet[`R${index}`].w.trim() : "";
          if (image1 != null && image1 != "") {
            let imageData = await Service.upload.upload_from_url(image1);
            let keyImage = image1.substring(image1.lastIndexOf('/') + 1);
            image1 = `${process.env.S3URL}${keyImage}`
          }
          data.image1 = image1
          let image2 = sheet[`S${index}`] ? sheet[`S${index}`].w.trim() : "";
          if (image2 != null && image2 != "") {
            let imageData = await Service.upload.upload_from_url(image2);
            let keyImage = image2.substring(image2.lastIndexOf('/') + 1);
            image2 = `${process.env.S3URL}${keyImage}`
          }
          data.image2 = image2
          let image3 = sheet[`T${index}`] ? sheet[`T${index}`].w.trim() : "";
          if (image3 != null && image3 != "") {
            let imageData = await Service.upload.upload_from_url(image3);
            let keyImage = image3.substring(image3.lastIndexOf('/') + 1);
            image3 = `${process.env.S3URL}${keyImage}`
          }
          data.image3 = image3
          let image4 = sheet[`U${index}`] ? sheet[`U${index}`].w.trim() : "";
          if (image4 != null && image4 != "") {
            let imageData = await Service.upload.upload_from_url(image4);
            let keyImage = image4.substring(image4.lastIndexOf('/') + 1);
            image4 = `${process.env.S3URL}${keyImage}`
          }
          data.image4 = image4
          let image5 = sheet[`V${index}`] ? sheet[`V${index}`].w.trim() : "";
          if (image5 != null && image5 != "") {
            let imageData = await Service.upload.upload_from_url(image5);
            let keyImage = image5.substring(image5.lastIndexOf('/') + 1);
            image5 = `${process.env.S3URL}${keyImage}`
          }
          data.image5 = image5
          let video = sheet[`W${index}`] ? sheet[`W${index}`].w.trim() : "";
          if (video != null && video != "") {
            let imageData = await Service.upload.upload_from_url(video);
            let keyImage = video.substring(video.lastIndexOf('/') + 1);
            video = `${process.env.S3URL}${keyImage}`
          }
          data.video = video
          data.additional1_ar = sheet[`X${index}`] ?
            sheet[`X${index}`].w.trim() :
            "";
          data.additional2_ar = sheet[`Y${index}`] ?
            sheet[`Y${index}`].w.trim() :
            "";
          data.date = moment().valueOf();
          data.variantId = moment().valueOf() - index * 15452344; // random value for variant id
          data.tagsUpdated = false;
          data.isProto = true;
          data.imagesUpdated = false;

          let shortKey = data.name + "#" + data.storeId + "#" + data.productKey;
          if (dataToSend.moduleKey) {
            data.moduleKey = dataToSend.moduleKey;
            // shortKey += "#" + data.moduleKey;
            // if (storeItemsMapWithModule[shortKey]) {
            //   erroredField.push({
            //     productKey: data.productKey,
            //     row: index,
            //     productName: data.productName,
            //     errorIn: "Duplicate-Item-Name",
            //   });
          }
          // } else {
          //   if (storeItemsMap[shortKey]) {
          //     erroredField.push({
          //       productKey: data.productKey,
          //       row: index,
          //       productName: data.productName,
          //       errorIn: "Duplicate-Item-Name",
          //     });
          //   }
          // }
          if (query.storeId) {
            data.isProto = false;
            data.storeId = query.storeId;
            data.storeExclusive = true;
          }

          results.push(data);
          index++;
          checker = sheet[`A${index}`];
        }
        for (let i = 0; i < results.length; i++) {
          try {
            const resultData = await model.storeItem.findOne({
              productKey: results[i].productKey,
              name: results[i].name,
            });
            if (!resultData)
              results[i].variantId = Math.floor(
                1000000000000 + Math.random() * 900000000000
              );
            await model.storeItem.findOneAndUpdate({
              productKey: results[i].productKey,
              name: results[i].name,
            }, {
              $set: results[i],
            }, {
              upsert: true,
            });
          } catch (e) {
          }
        }

        let headers = ["productKey", "productName", "row", "errorIn"];
        var ws = XLSX.utils.json_to_sheet(erroredField, {
          header: headers,
        });
        let wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "products");
        XLSX.writeFile(wb, "./server/uploads/exportedCsv/errors.xlsx");

        if (erroredField.length > 0) {
          return reject({
              message: "Please check, there is some error in data uploaded!",
              data: process.env.EXPORTURLLIVE + "errors.xlsx",
            },
            process.env.EXPORTURLLIVE + "errors.xlsx"
          );
        }
        fs.unlinkSync(url)
        done({
          message: "Done",
        });
      } catch (e) {
        console.log(e, "errorrororo")
        reject({
          message: "Please check if all required fields are present in each row!",
        });
      }
    });
  }

  deleteAllProduct(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        let filter = {};
        if (data.storeId) {
          filter.storeId = data.storeId;
          await model.storeItem.deleteMany(filter);
        } else {
          await model.storeItem.deleteMany({
            isProto: true
          });
        }
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

  deleteSelectedProduct(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        if (data.storeItem && data.storeItem.length > 0) {
          await model.storeItem.deleteMany({
            productKey: {
              $in: data.storeItem
            },
          });
          done({
            message: multilingualService.getResponseMessage("DELETEMSG", lang),
          });
        }
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  addStore(data, files, lang, finalFileName, geofenceId) {
    return new Promise(async (done, reject) => {
      let emailExists = await model.store.findOne({
        email: data.email,
        status: {
          $in: [1, 4, 3]
        }
      }).lean().exec();
      if (emailExists) {
        return reject({
          message: "Email already associated with this email"
        });
      }
      if (geofenceId != "NA") data.geofenceId = geofenceId;
      data.isEmailVerified = true;
      data.isPhoneVerified = true;
      data.verificationType = 1;
      const polygonData = {
        type: "Polygon",
        coordinates: [data.area_points],
      };
      data.area_points = polygonData;
      if (data.memberShipId != null && data.memberShipId != "") {
        let memberShipData = await model.Membership.findById(data.memberShipId)
        data.orderCount = memberShipData.orderCount
        data.driverCount = memberShipData.driverCount
        data.productCount = memberShipData.productCount
      }
      let store = await this.createStore(data, finalFileName, files);
      const salesPersonCommissionType = await model.SalesPerson.findOne({
        _id: data.spId,
      }).lean().exec();
      await store.save()
        .then(async (result) => {
          if (data.spId) {
            if (salesPersonCommissionType && salesPersonCommissionType.commissionType.toLowerCase() === "percentage") {
              await model.SalesPerson.findByIdAndUpdate(data.spId, {
                $push: {
                  storesArray: result._id
                },
              });
              await model.store.findByIdAndUpdate({
                _id: result._id
              }, {
                $set: {
                  salesPersonCommission: Number(
                    result.onboardAmount *
                    salesPersonCommissionType.commission
                  ) * 0.01,
                  adminCommission: Number(result.onboardAmount) -
                    Number(
                      result.onboardAmount *
                      salesPersonCommissionType.commission
                    ) *
                    0.01,
                },
              });
            }
            if (salesPersonCommissionType && salesPersonCommissionType.commissionType.toLowerCase() === "flat") {
              await model.SalesPerson.findByIdAndUpdate(data.spId, {
                $push: {
                  storesArray: result._id
                },
              });
              await model.store.findByIdAndUpdate({
                _id: result._id
              }, {
                $set: {
                  salesPersonCommission: Number(
                    salesPersonCommissionType.commission
                  ),
                  adminCommission: Number(result.onboardAmount) -
                    Number(salesPersonCommissionType.commission),
                },
              });
            }
          }
          data.outlet.storeId = result._id;
          data.outlet.date = moment().valueOf();
          data.outlet.location = [
            parseFloat(data.outlet.longitude),
            parseFloat(data.outlet.latitude),
          ];
          data.outlet.geoLongLat = data.area_points;
          data.outlet.deliveryAreaType = data.deliveryAreaType;
          data.outlet.deliveryArea = data.deliveryArea;
          let outlet = await model.storeOutlet(data.outlet).save();
          let subject = process.env.PROJECT_NAME + "-login Credentials";
          let redirectUrl = process.env.MERCHANTPANELURL;
          await MailService.mailer({
            to: result.email,
            text: `email: ${data.email} , password: ${data.password} , redirectUrl: ${redirectUrl}`,
            subject: subject,
          });
          let users;
          if (outlet.deliveryAreaType == "fixed_area") {
            users = await model.user.find({
              location: {
                $near: {
                  $geometry: {
                    type: "Point",
                    coordinates: [outlet.longitude, outlet.latitude]
                  },
                  $minDistance: 0,
                  $maxDistance: outlet.deliveryArea * 1000
                }
              }
            })
          } else if (outlet.deliveryAreaType == "geo_fence") {
            users = await model.user.find({
              location: {
                $geoWithin: {
                  $geometry: {
                    type: "Polygon",
                    coordinates: outlet.geoLongLat.coordinates
                  }
                }
              }
            })
          }
          for (let user of users) {
            let payload = {
              userId: user._id,
              title: "New Store Added",
              notimessage: "New store Added in your area"
            }
            await Service.Notification.usersend(payload);
          }
          done({
            message: multilingualService.getResponseMessage("ADDMSG", lang),
            data: result,
          });
          return;
        })
        .catch((err) => {
          console.log(err.message + " <<<<<<<<<<<<<< ")
          // if (err.errors)
          //   return reject({
          //     message: err.message
          //   });
          // return reject({
          //   message: multilingualService.getResponseMessage("FALSEMSG", lang),
          //   data: err,
          // });
        });
    });
  }

  async storeEnumValues(data, lang) {
    try {

      const scheduleTypeEnums = [
        "RECURING",
        "DELIVERY",
        "INSTANT",
        "DRIVETHRU",
        "TAKEAWAY",
        "DINEIN",
      ];

      const recuringTypeEnums = [
        "SEVENDAYS",
        "ALTERNATEDAYS",
        "EVERYWEEK",
        "EVERY3RDDAY",
        "MONTHLY",
      ];

      const enumType =
        data.enumType == "schedule" ?
        scheduleTypeEnums :
        data.enumType == "recuring" ?
        recuringTypeEnums : [];

      return {
        message: "sucess",
        data: enumType,
      };
    } catch (e) {
      console.log(e);
    }
  }

  async createStore(data, finalFileName, files) {
	console.log("Data",data);
    let store = new model.store(data);
    let storeType = await model.storeCategory.findById(data.storeTypeId);
    // if (finalFileName) store.image = process.env.S3URL + finalFileName;
    if (files.image) store.image = files.image[0].location;
    if (files.banner) store.banner = files.banner != null ? files.banner[0].location : "";
    data.isHyperLocal = storeType.isHyperLocal;
    data.layout = storeType.layout;
    data.isBrandHidden = storeType.isBrandHidden;
    store.date = moment().valueOf();

    if (data.password) store.hash = Service.HashService.encrypt(data.password);
    return store;
  }

  editStore(data, files, lang, finalFileName) {
    return new Promise(async (done, reject) => {
      try {
        // if (finalFileName) data.image = process.env.S3URL + finalFileName;
        if (files.image) data.image = files.image[0].location;
        if (files.banner) data.banner = files.banner[0].location;
	console.log("Data",data);

        // await model.store
        //   .findOne({
        //     name: new RegExp("^" + data.name + "$", "i"),
        //     _id: { $ne: data.updateId },
        //     status: { $ne: 2 },
        //   })
        //   .then(async (store) => {
        //     if (store)
        //       return reject({
        //         message: multilingualService.getResponseMessage(
        //           "STOREEXISTS",
        //           lang
        //         ),
        //       });
        if (data.delivery_charges) {
          if (data.delivery_charges.isFree && (data.delivery_charges.isFree == true || data.delivery_charges.isFree == "true")) {
            data.deliveryCharges = 0
          }
          if (data.delivery_charges.fixed_delivery_charges) {
            data.deliveryCharges = data.delivery_charges.fixed_delivery_charges
          }
        }
        let result = await model.store.findByIdAndUpdate(data.updateId, data, {
          new: true,
        });
        if (data.status === 2) {
          done({
            message: multilingualService.getResponseMessage("DELETEMSG", lang),
            data: result,
          });
        }
        if (data.status === 1) {
          // let result = await model.store.findByIdAndUpdate(data.updateId, data, { new: true });
          done({
            message: multilingualService.getResponseMessage("UPDATEMSG", lang),
            data: result,
          });
        }
        if (data.status === 3) {
          // let result = await model.store.findByIdAndUpdate(data.updateId, data, { new: true });
          done({
            message: multilingualService.getResponseMessage(
              "STOREBLOCKED",
              lang
            ),
            data: result,
          });
        }
        if (data.status === 4) {
          // let result = await model.store.findByIdAndUpdate(data.updateId, data, { new: true });
          done({
            message: multilingualService.getResponseMessage(
              "STOREUNBLOCKED",
              lang
            ),
            data: result,
          });
        }
        if (data.isRecommended === 0) {
          // let result = await model.store.findByIdAndUpdate(data.updateId, data, { new: true });
          done({
            message: multilingualService.getResponseMessage(
              "REMOVEDRECOMMENDED",
              lang
            ),
            data: result,
          });
        }
        if (data.isRecommended === 1) {
          // let result = await model.store.findByIdAndUpdate(data.updateId, data, { new: true });
          done({
            message: multilingualService.getResponseMessage(
              "ADDEDRECOMMENDED",
              lang
            ),
            data: result,
          });
        }

        done({
          message: multilingualService.getResponseMessage("UPDATEMSG", lang),
          data: result,
        });

        // model.store
        //   .findByIdAndUpdate(data.updateId, data, { new: true })
        //   .then((result) => {
        //     done({
        //       message:
        //         Number(data.status) == 2
        //           ? multilingualService.getResponseMessage("DELETEMSG", lang)
        //           : multilingualService.getResponseMessage("UPDATEMSG", lang),
        //       data: result,
        //     });
        //   });
        // });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
          data: error,
        });
      }
    });
  }

  getStores(data, lang, geofenceId) {
    return new Promise(async (done, reject) => {
      try {
        if (data.all == true || data.all == "true") {
          let dataNew;
          let filter = {
            status: {
              $ne: 2
            }
          };
          if (data.moduleKey) filter.moduleKey = data.moduleKey;
          if (geofenceId != "NA") filter.geofenceId = mongoose.Types.ObjectId(geofenceId);
          dataNew = await model.store.find(filter);
          done({
            message: multilingualService.getResponseMessage(
              "FETCHED_SUCCESSFULLY",
              lang
            ),
            data: dataNew,
          });
          return;
        }

        const limit = Number(data.limit) || Constant.ADMINLIMIT;
        const page = Math.max(1, Number(data.page) || 0);
        const skip = Math.max(0, page - 1) * limit;
        const sort = {
          _id: -1
        };

        const query = {
          limit,
          page,
          skip,
          search: data.search
        };
        let filter = {
          status: {
            $ne: 2
          }
        };
        if (data.moduleKey) filter.moduleKey = data.moduleKey;
        if (geofenceId != "NA") filter.geofenceId = mongoose.Types.ObjectId(geofenceId);

        if (data.search) {
          const regex = {
            $regex: `${data.search}`,
            $options: "i"
          };
          filter.$or = [{
            name: regex
          }, {
            email: regex
          }];
        }
        const itemCount = await model.store.countDocuments(filter);
        const pageCount = Math.ceil(itemCount / limit);
        const storeList = await model.store
          .find(filter)
          .populate("storeTypeId", "name name_ar")
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean();

        const message =
          storeList.length <= 0 ?
          multilingualService.getResponseMessage("EMPTY_LIST", lang) :
          multilingualService.getResponseMessage(
            "FETCHED_SUCCESSFULLY",
            lang
          );

        done({
          message: message,
          data: {
            query,
            storeList,
            itemCount,
            pageCount
          },
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  getStoreById(id, lang) {
    return new Promise((done, reject) => {
      model.store
        .findById(id)
        .populate("storeTypeId", "name name_ar")
        .select("+status")
        .then((result) => {
          model.storeOrder.countDocuments({
            storeId: id
          }).then((order) => {
            model.storeOutlet
              .countDocuments({
                storeId: id,
                status: {
                  $ne: 2
                }
              })
              .then((outlets) => {
                model.storeItemType
                  .countDocuments({
                    storeCategoryId: result.storeTypeId,
                    status: {
                      $ne: 2
                    },
                    isParent: true,
                  })
                  .then((category) => {
                    model.storeItem
                      .countDocuments({
                        storeId: id,
                        isProto: false
                      })
                      .then((items) => {
                        model.storeOrder
                          .aggregate([
                            // { $match: { status: 0 } },
                            {
                              $match: {
                                status: 9
                              }
                            },
                            {
                              $match: {
                                storeId: mongoose.Types.ObjectId(id)
                              }
                            },
                          ])
                          .then((newOrder) => {
                            model.storeOrder
                              .aggregate([
                                // { $match: { status: { $in: [1, 2] } } },
                                {
                                  $match: {
                                    status: {
                                      $in: [8]
                                    }
                                  }
                                },
                                {
                                  $match: {
                                    storeId: mongoose.Types.ObjectId(id)
                                  }
                                },
                              ])
                              .then((ongoingOrder) => {
                                done({
                                  message: multilingualService.getResponseMessage(
                                    "FETCHED_SUCCESSFULLY",
                                    lang
                                  ),
                                  data: {
                                    detail: result,
                                    orders: order,
                                    outlets: outlets,
                                    category: category,
                                    items: items,
                                    newOrder: newOrder.length,
                                    ongoingOrder: ongoingOrder.length,
                                  },
                                });
                              });
                          });
                      });
                  });
              });
          });
        });
    });
  }

  addStoreOutlet(data, headers) {
    return new Promise(async (done, reject) => {
      const lang = headers.language;
      const geofenceId = headers.geofenceid;
      data.date = moment().valueOf();
      data.location = [parseFloat(data.longitude), parseFloat(data.latitude)];
      const storeData = await model.store.findOne({
        _id: mongoose.Types.ObjectId(data.storeId),
      })
      if (headers.geofenceid != "NA") {
        let geofenceData = await model.geoFence.findOne({
          geoLongLat: {
            $geoIntersects: {
              $geometry: {
                "type": "Point",
                coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)]
              }
            }
          }
        })
        if (geofenceData != null && storeData != null && storeData.geofenceId != null) {
          if (JSON.stringify(geofenceData._id) != JSON.stringify(storeData.geofenceId)) {
            return reject({
              message: Constant.GEOFENCEERROR
            });
          }
        } else {
          return reject({
            message: Constant.GEOFENCEERROR
          });
        }
      }
      let existAddress = await model.storeOutlet.findOne({
        address: data.address,
        storeId: mongoose.Types.ObjectId(data.storeId),
        status: 1
      }).lean().exec();
      if (existAddress) {
        return reject({
          message: multilingualService.getResponseMessage("OUTLETEXIST", lang),
        });
      }
      let outlet = new model.storeOutlet(data).save()
        .then((result) => {
          done({
            message: Constant.ADDMSG,
            data: result
          });
        })
        .catch((err) => {
          if (err.errors)
            return reject({
              message: Service.Handler.mongoErrorHandler(err)
            });

          return reject({
            message: Constant.FALSEMSG
          });
        });
    });
  }

  editStoreOutlet(data, lang) {
    return new Promise((done, reject) => {
      data.location = [parseFloat(data.longitude), parseFloat(data.latitude)];
      model.storeOutlet
        .findByIdAndUpdate(data.updateId, data, {
          new: true
        })
        .then((result) => {
          done({
            message: Number(data.status) == 2 ?
              Constant.DELETEMSG : Constant.UPDATEMSG,
            data: result,
          });
        })
        .catch((err) => {
          return reject({
            message: Constant.FALSEMSG
          });
        });
    });
  }

  getStoreOutlet(id, lang) {
    return new Promise((done, reject) => {
      model.storeOutlet
        .find({
          storeId: id,
          status: {
            $ne: 2
          }
        })
        .then((result) => {
          done({
            data: result
          });
        });
    });
  }

  getAllStoreTypeById(id, lang) {
    return new Promise((done, reject) => {
      model.storeItemType.findById(id).then((result) => {
        done({
          data: result
        });
      });
    });
  }
  getStoresByType(data, lang) {
    return new Promise((done, reject) => {
      model.store.find({
        storeTypeId: data.storeTypeId
      }).then((result) => {
        done({
          message: "",
          data: result
        });
      });
    });
  }
  addSetting(data, lang) {
    return new Promise((done, reject) => {
      let setting = new model.storeSetting(data);
      setting
        .save()
        .then((result) => {
          done({
            message: Constant.ADDMSG,
            data: result
          });
        })
        .catch((err) => {
          return reject({
            message: Constant.FALSEMSG
          });
        });
    });
  }

  editSetting(data, lang) {
    return new Promise((done, reject) => {
      model.storeSetting
        .findByIdAndUpdate(data.updateId, data, {
          new: true
        })
        .then((result) => {
          done({
            message: Constant.UPDATEMSG,
            data: result
          });
        })
        .catch((err) => {
          return reject({
            message: Constant.FALSEMSG
          });
        });
    });
  }

  getSetting(lang) {
    return new Promise((done, reject) => {
      model.storeSetting
        .findOne({})
        .then((result) => {
          done({
            data: result
          });
        })
        .catch((err) => {
          return reject({
            message: Constant.FALSEMSG
          });
        });
    });
  }

  getAllOrders(data, header) {
    return new Promise((done, reject) => {
      let geofenceId = header.geofenceid != "NA" ? header.geofenceid : null;
      // let skip = Number(data.page) > 1 ? (Number(data.page) - 1) : 0;
	console.log("Inside get AllOrders");
     let skip = Math.max(0, data.page - 1) * 4;
      let Arr = [],
        stat;
      let qry = {
        $and: []
      };
      if (data.status == 0) {
        stat = {
          status: 0
          }
      }else if (data.status == 1) {
        stat = {
        status: {
          $in: [1]
        }
      }}else if (data.status == 9)
      {stat = {
        status: {
          $in: [9]
        }
      }}else if (data.status == 2)
      {stat = {
        status: {
          $in: [2, 3]
        }
      }}else if (data.status == 4)
      {stat = {
        status: {
          $in: [4, 5]
        }
      }}else if (data.status == 11)
       {stat = {
        status: {
          $in: [11, 12]
        }
      }}else if (!data.status){ stat = {}}
      else reject({
        message: "WRONG_STATUS"
      });
      qry["$and"].push(stat);
      if (data.scheduleType == 'RECURING') {
        qry.scheduleType = 'RECURING'
      } else if (data.scheduleType == 'DELIVERY') {
        qry.scheduleType = 'DELIVERY'
      } else if (data.scheduleType == 'INSTANT') {
        qry.scheduleType = 'INSTANT'
      } else if (data.scheduleType == 'DRIVETHRU') {
        qry.scheduleType = 'DRIVETHRU'
      } else if (data.scheduleType == 'DINEIN') {
        qry.scheduleType = 'DINEIN'
      } else if (data.scheduleType == 'SCHEDULE') {
        qry.scheduleType = 'SCHEDULE'
      }
      if (data.isTakeAway) {
        qry.isTakeAway = true
      }
      if (data.startDate != "null" && data.endDate != "null") {
        let both = {
          createdAt: {
            $gte: new Date(moment(data.startDate).startOf("day")),
            $lte: new Date(moment(data.endDate).endOf("day")),
          },
        };
        qry["$and"].push(both);
      } else if (data.startDate != "null" && data.endDate == "null") {
        let startDate = {
          createdAt: {
            $gte: new Date(moment(data.startDate).startOf("day")),
          },
        };
        qry["$and"].push(startDate);
      } else if (data.startDate == "null" && data.endDate != "null") {
        let endDate = {
          createdAt: {
            $lte: new Date(moment(data.endDate).endOf("day")),
          },
        };
        qry["$and"].push(endDate);
      }
      if (data.storeId) {
        qry["$and"].push({
          storeId: mongoose.Types.ObjectId(data.storeId)
        });
      }
      if (geofenceId != null) {
        qry["$and"].push({
          geofenceId: mongoose.Types.ObjectId(geofenceId)
        })
      }
      model.storeOrder
        .aggregate([{
            $match: qry
          },
          {
            $sort: {
              createdAt: -1
            }
          },
          {
            $skip: skip
          },
          {
            $limit: 4
          }, // very slow api because bro dont increaase this
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
              from: "storeoutlets",
              localField: "outletId",
              foreignField: "_id",
              as: "outletId",
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
              from: "drivers",
              localField: "driverId",
              foreignField: "_id",
              as: "driverId",
            },
          },
          // { $unwind: "$driver" },
          {
            $unwind: {
              path: "$userId",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $unwind: {
              path: "$storeId",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $unwind: {
              path: "$outletId",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $unwind: {
              path: "$driverId",
              preserveNullAndEmptyArrays: data.status == 4 ? true : true, // completed order should have driver
            },
          },
        ])
        .then(async (result) => {
          await model.storeOrder.countDocuments(qry).then((count) => {
            done({
              data: {
                list: result,
                count: count
              }
            });
          });
        })
        .catch((err) => {
          reject({
            message: err
          });
        });
    });
  }

  getOrderById(id, lang) {
    return new Promise((done, reject) => {
      model.storeOrder
        .findById(id)
        .populate("storeId", "name image name_ar")
        .populate("outletId", "address latitude longitude")
        .populate("userId", "firstName lastName profilePic countryCode phone")
        .populate("driverId", "firstName lastName profilePic countryCode phone")
        .populate("items.itemId", "name image")
        .then((result) => {
          done({
            data: result
          });
        });
    });
  }

  getAllSalesPerson(data, lang, geofenceId) {
    return new Promise(async (done, reject) => {
      try {
        const limit = Number(data.limit) || Constant.ADMINLIMIT;
        const page = Math.max(1, Number(data.page) || 0);
        const skip = Math.max(0, page - 1) * limit;
        const sort = {
          _id: -1
        };

        const query = {
          limit,
          page,
          skip,
          search: data.search
        };
        let filter = {};

        if (data.search) {
          const regex = {
            $regex: `${data.search}`,
            $options: "i"
          };
          filter.$or = [{
            name: regex
          }, {
            email: regex
          }];
        }
        // if (geofenceId != "NA") filter.geofenceId = geofenceId;
        const itemCount = await model.SalesPerson.countDocuments(filter);
        const pageCount = Math.ceil(itemCount / limit);
        const salePersonList = await model.SalesPerson.find(filter)
          // .populate('storesArray')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean();

        const message =
          salePersonList.length <= 0 ?
          multilingualService.getResponseMessage("EMPTY_LIST", lang) :
          multilingualService.getResponseMessage(
            "FETCHED_SUCCESSFULLY",
            lang
          );
        done({
          message: message,
          data: {
            query,
            salePersonList,
            itemCount,
            pageCount
          },
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }
  getSalesPersonById(data) {
    return new Promise(async (done, reject) => {
      try {
        let resp = await model.SalesPerson.findById(data.id);
        done({
          data: resp
        });
      } catch (e) {
        console.log(e);
      }
    });
  }

  getAllSalesPersonStores(data, lang, geofenceId) {
    return new Promise(async (done, reject) => {
      try {
        let pipeline;
        if (!data.page) data.page = 1;
        if (geofenceId != "NA")
          pipeline = [{
              $match: {
                geofenceId: mongoose.Types.ObjectId(geofenceId)
              }
            },
            {
              $sort: {
                _id: -1
              }
            },
            {
              $lookup: {
                from: "stores",
                localField: "storesArray",
                foreignField: "_id",
                as: "stores",
              },
            },
            {
              $unwind: "$stores"
            },
            {
              $group: {
                _id: "$_id",
                totalCommission: {
                  $sum: "$stores.salesPersonCommission"
                },
              },
            },
            {
              $lookup: {
                from: "salespeople",
                localField: "_id",
                foreignField: "_id",
                as: "salesperson",
              },
            },
            {
              $unwind: "$salesperson"
            },
            {
              $match: {
                "stores.name": new RegExp(data.name, "i")
              }
            },
            {
              $skip: (data.page - 1) * 25
            },
            {
              $limit: 25
            },
          ];
        else
          pipeline = [{
              $sort: {
                _id: -1
              }
            },
            {
              $lookup: {
                from: "stores",
                localField: "storesArray",
                foreignField: "_id",
                as: "stores",
              },
            },
            {
              $unwind: "$stores"
            },
            {
              $group: {
                _id: "$_id",
                totalCommission: {
                  $sum: "$stores.salesPersonCommission"
                },
              },
            },
            {
              $lookup: {
                from: "salespeople",
                localField: "_id",
                foreignField: "_id",
                as: "salesperson",
              },
            },
            {
              $unwind: "$salesperson"
            },
            {
              $match: {
                "stores.name": new RegExp(data.name, "i")
              }
            },
            {
              $skip: (data.page - 1) * 25
            },
            {
              $limit: 25
            },
          ];
        if (!data.name) pipeline.splice(6, 1); // delete 1 element from 4th index
        let result = await model.SalesPerson.aggregate(pipeline);
        let count = await model.SalesPerson.aggregate([{
            $sort: {
              _id: -1
            }
          },
          {
            $lookup: {
              from: "stores",
              localField: "storesArray",
              foreignField: "_id",
              as: "stores",
            },
          },
          {
            $unwind: "$stores"
          },
          {
            $group: {
              _id: "$_id",
              totalCommission: {
                $sum: "$stores.salesPersonCommission"
              },
            },
          },
          {
            $lookup: {
              from: "salespeople",
              localField: "_id",
              foreignField: "_id",
              as: "salesperson",
            },
          },
          {
            $unwind: "$salesperson"
          },
          {
            $count: "totalCount"
          },
        ]);
        if (count && count.length == 0) {
          count = [{
            maxCount: 0
          }];
        } else {
          count = 0;
        }

        done({
          message: multilingualService.getResponseMessage(
            "FETCHED_SUCCESSFULLY",
            lang
          ),
          data: {
            result,
            count
          },
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  getAllMerchantTotalCommission(data, lang) {
    return new Promise(async (done, reject) => {
      try {

        let skip =
          Number(data.page) && Number(data.page) > 1 ?
          (Number(data.page) - 1) * Constant.ADMINLIMIT :
          0;
        let Arr = [{
          $or: [{
            status: 4
          }, {
            status: 5
          }, {
            status: 6
          }]
        }];

        if (data.name && data.name != "") {
          Arr.push({
            $or: [{
                firstName: new RegExp(data.name, "i")
              },
              {
                email: new RegExp(data.name, "i")
              },
            ],
          });
        }

        let qry = Arr.length == 1 ? Arr[0] : {
          $and: Arr
        };
	
        if (data.id) qry["storeId"] = mongoose.Types.ObjectId(data.id);
	
        let result = await model.storeOrder.aggregate([{
            $match: qry
          },
          {
            $group: {
              _id: "$storeId",
              totalEarning: {
                $sum: "$merchantCommission"
              },
            },
          },
          {
            $lookup: {
              from: "stores",
              localField: "_id",
              foreignField: "_id",
              as: "stores",
            },
          },
          {
            $unwind: "$stores"
          },
          {
            $sort: {
              _id: -1
            }
          },
          {
            $skip: skip
          },
          {
            $limit: Constant.ADMINLIMIT
          },
        ]);

        let count = await model.storeOrder.aggregate([{
            $match: qry
          },
          {
            $sort: {
              _id: -1
            }
          },
          {
            $group: {
              _id: "$storeId",
              totalEarning: {
                $sum: "$merchantCommission"
              },
            },
          },
          {
            $lookup: {
              from: "stores",
              localField: "_id",
              foreignField: "_id",
              as: "stores",
            },
          },
          {
            $unwind: "$stores"
          },
          {
            $count: "totalCount"
          },
        ]);

        if (count && count.length == 0) {
          count = [{
            maxCount: 0
          }];
        }
        done({
          message: multilingualService.getResponseMessage(
            "FETCHED_SUCCESSFULLY",
            lang
          ),
          data: {
            result,
            count
          },
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  editSalesPersonById(data) {
    return new Promise(async (done, reject) => {
      let resp = await model.SalesPerson.findByIdAndUpdate(data.id, data, {
        new: true,
      });
      done({
        message: "Updated Successfully",
        data: resp
      });
    });
  }
  getStoresSP(data) {
    return new Promise(async (done) => {
      if (!data.page) data.page = 1;
      let pipeline = [{
          $match: {
            _id: ObjectId(data.id)
          },
        },
        {
          $lookup: {
            from: "stores",
            localField: "storesArray",
            foreignField: "_id",
            as: "stores",
          },
        },
        {
          $unwind: "$stores"
        },
        {
          $match: {
            "stores.name": new RegExp(data.name, "i")
          },
        },
        {
          $project: {
            storesArray: 0
          }
        },

        {
          $skip: (data.page - 1) * 25
        },
        {
          $limit: 25,
        },
      ];

      if (!data.name) pipeline.splice(4, 1); // delete 1 element from 4th index
      let result = await model.SalesPerson.aggregate(pipeline);
      let salesPersonData = await model.SalesPerson.findById(data.id);
      result.unshift(salesPersonData);
      done({
        data: result
      });
    });
  }

  getStoreRevenue(data) {
    return new Promise(async (done, reject) => {
      let pipeline = [];
      let dataGraph = [];
      let months = [{
          month: "01",
          label: "Jan",
        },
        {
          month: "02",
          label: "Fab",
        },
        {
          month: "03",
          label: "Mar",
        },
        {
          month: "04",
          label: "Apr",
        },
        {
          month: "05",
          label: "May",
        },
        {
          month: "06",
          label: "Jun",
        },
        {
          month: "07",
          label: "Jul",
        },
        {
          month: "08",
          label: "Aug",
        },
        {
          month: "09",
          label: "Sep",
        },
        {
          month: "10",
          label: "Oct",
        },
        {
          month: "11",
          label: "Nov",
        },
        {
          month: "12",
          label: "Dec",
        },
      ];
      if (data.type == "MONTH") {
        pipeline.push({
          $match: {
            storeId: mongoose.Types.ObjectId(data.storeId),
            status: {
              $gte: 1,
              $lte: 6
            },
          },
        }, {
          $match: {
            createdAt: {
              $gte: new Date(moment().startOf("year").format()),
              $lte: new Date(moment().endOf("year").format()),
            },
          },
        }, {
          $group: {
            _id: {
              $dateToString: {
                format: "%m",
                date: "$createdAt",
              },
            },
            month: {
              $first: {
                $dateToString: {
                  format: "%m",
                  date: "$createdAt",
                },
              },
            },
            total: {
              $sum: "$merchantCommission"
            },
          },
        });
        let monthData;
        monthData = await model.storeOrder.aggregate(pipeline);
        for (let i = 0; i < months.length; i++) {
          let obj = _.find(monthData, {
            month: months[i].month,
          });
          if (obj) {
            dataGraph.push({
              label: months[i].label,
              total: obj.total,
            });
          } else {
            dataGraph.push({
              label: months[i].label,
              total: 0,
            });
          }
        }
      }
      if (data.type == "WEEK") {
        let beforeMonth = moment().subtract(28, "d");
        while (beforeMonth.isBefore(moment())) {
          let dt = moment(beforeMonth).format("DD-MM-YYYY");
          pipeline = [];
          pipeline.push({
            $match: {
              storeId: mongoose.Types.ObjectId(data.storeId),
              status: {
                $gte: 1,
                $lte: 6
              },
            },
          }, {
            $match: {
              createdAt: {
                $gte: new Date(beforeMonth),
                $lte: new Date(beforeMonth.add(7, "d")),
              },
            },
          }, {
            $group: {
              _id: 1,
              date: {
                $first: "$createdAt",
              },
              total: {
                $sum: "$merchantCommission"
              }
            },
          });
          let weakData;
          weakData = await model.storeOrder.aggregate(pipeline);
          if (weakData.length == 0) {
            dataGraph.push({
              label: dt,
              total: 0
            });
          } else {
            for (let i = 0; i < weakData.length; i++) {
              dataGraph.push({
                label: dt,
                total: weakData[i].total,
              });
            }
          }
        }
      }
      /* model.storeOrder
        .aggregate([{
          $match: {
            storeId: mongoose.Types.ObjectId(data.storeId),
            status: {
              $gte: 1,
              $lte: 6
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%d/%m/%Y",
                date: {
                  $add: [new Date(0), "$date"]
                },
              },
            },
            amount: {
              $sum: "$merchantCommission"
            },
            date: {
              $first: "$date"
            },
          },
        },
        {
          $sort: {
            date: -1
          }
        }
        ])
        .then((result) => {
          let Arr = [];
          result.map((val) => {
            Arr.push({
              label: val._id,
              value: val.amount
            });
          });

        })
        .catch((err) => {
          reject(err);
        }); */
      done({
        data: dataGraph
      });
    });
  }

  async getSubCategoriesByStoreType(data, lang) {
    if (!data.categoryId) throw new Error("PARAMS MISSING HE");

    let subCategories = await model.storeItemType
      .find({
        parentId: data.categoryId,
      })
      .distinct("_id");
    subCategories = subCategories.map((item) => {
      return mongoose.Types.ObjectId(item);
    });
    const dataNew = await model.storeItemType.aggregate([{
        $match: {
          _id: {
            $in: subCategories
          },
          parentId: {
            $exists: true
          },
          isParent: false,
        },
      },
      {
        $lookup: {
          from: "storeitems",
          localField: "_id",
          foreignField: "storeItemSubTypeId",
          as: "products",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          productsSize: {
            $size: "$products"
          },
          parentId: 1,
        },
      },
      {
        $match: {
          productsSize: {
            $gte: 1
          }
        },
      },
    ]);

    return {
      message: multilingualService.getResponseMessage(
        "FETCHED_SUCCESSFULLY",
        lang
      ),
      data: dataNew,
    };
  }

  async getSubCategories(data, lang) {
    if (!data.categoryId || !data.storeId) throw new Error("PARAMS MISSING HE");

    let qry = {
      storeItemTypeId: data.categoryId
    };

    if (data.storeId) qry.storeId = data.storeId;

    let subCategories = await model.storeItem
      .find(qry)
      .distinct("storeItemSubTypeId");
    const dataNew = await model.storeItemType.find({
      _id: {
        $in: subCategories
      },
      parentId: {
        $exists: true
      },
      isParent: false,
    });

    return {
      message: multilingualService.getResponseMessage(
        "FETCHED_SUCCESSFULLY",
        lang
      ),
      data: dataNew,
    };
  }

  async getStoreSubCatAndCat(data, lang) {
    if (!data.storeId) throw new Error("PARAMS MISSING HE");

    // let qry = { storeItemTypeId: data.categoryId };

    let qry = {};
    if (data.storeId) qry.storeId = data.storeId;

    let subCategories = await model.storeItem
      .find(qry)
      .distinct("storeItemSubTypeId");

    const dataNew = await model.storeItemType
      .find({
        _id: {
          $in: subCategories
        },
        parentId: {
          $exists: true
        },
        isParent: false,
      })
      .populate("parentId");

    return {
      message: multilingualService.getResponseMessage(
        "FETCHED_SUCCESSFULLY",
        lang
      ),
      data: dataNew,
    };
  }

  async getMerchantAllSubCategories(data, lang) {
    if (!data.storeId) throw new Error("PARAMS MISSING");

    let qry = {
      storeId: data.storeId
    };
    let subCategories = await model.storeItem
      .find(qry)
      .distinct("storeItemSubTypeId");

    const dataNew = await model.storeItemType.find({
      _id: {
        $in: subCategories
      },
      parentId: {
        $exists: true
      },
      isParent: false,
    });
    return {
      message: multilingualService.getResponseMessage(
        "FETCHED_SUCCESSFULLY",
        lang
      ),
      data: dataNew,
    };
  }

  getCategories(data, lang) {
    return new Promise(async (done, lang) => {
      if (data.storeId) {
        let categories = await model.storeItem.distinct("storeItemTypeId", {
          storeId: mongoose.Types.ObjectId(data.storeId)
        });

        const dataNew = await model.storeItemType.find({
          _id: {
            $in: categories
          },
          parentId: {
            $exists: false
          },
          isParent: true,
        });
        done({
          message: multilingualService.getResponseMessage(
            "FETCHED_SUCCESSFULLY",
            lang
          ),
          data: dataNew,
        });
        return;
      }
      let categories = await model.storeItemType.find({
        storeCategoryId: data.storeTypeId,
      });

      done({
        data: categories
      });
    });
  }

  getStoreInventory(data, lang) {
    return new Promise(async (done, reject) => {
      let isCompany = data.isCompany || false;
      if (isCompany == false) {
        let isAllStore = data.isAllStore || false;
        if (!data.storeId && isAllStore == false) {
          return reject({
            message: multilingualService.getResponseMessage(
              "PARAMETERMISSING",
              lang
            ),
          });
        }
        let criteria = {};
        let storeMap = {};
        if (data.companyId) {
          let storeProducts = await model.storeItem.find({
            companyId: mongoose.Types.ObjectId(data.companyId)
          });
          storeProducts.forEach((item) => {
            storeMap[item.variantId] = true;
          });
        }

        if (data.storeId && isAllStore == false) {
          criteria.storeId = mongoose.Types.ObjectId(data.storeId),
            criteria.companyId = null
        }
        if (data.all == true || data.all == "true") {
          const dataNew = await model.storeItem.find(criteria);
          done({
            message: multilingualService.getResponseMessage(
              "FETCHED_SUCCESSFULLY",
              lang
            ),
            data: dataNew,
          });
          return;
        }
        if (!data.page) {
          data.page = 1;
        }
        let limit = 10;

        if (data.all) limit = 5000;
        let qry = {
          companyId: null
        };
        if (data.storeId && isAllStore == false) qry.storeId = mongoose.Types.ObjectId(data.storeId)
        if (data.categoryId) qry.storeItemTypeId = data.categoryId;
        if (data.subCategoryId) qry.storeItemSubTypeId = data.subCategoryId;
        if (data.brandId) qry.brandId = data.brandId;
        if (data.name)
          qry.$or = [{
              name: new RegExp(data.name, "i")
            },
            {
              productName: new RegExp(data.name, "i")
            },
          ];
        let products = await model.storeItem
          .find(qry)
          .sort({
            _id: -1
          })
          .skip((data.page - 1) * 10)
          .limit(limit)
          .populate("brandId")
          .lean();

        let count = await model.storeItem.countDocuments(qry);
        if (data.companyId != null && data.companyId != "") {
          products.forEach((item) => {
            item.isPresent = false;
            if (storeMap[item.variantId]) item.isPresent = true;
          });
        }
        done({
          data: {
            list: products,
            count
          }
        });
      } else if (isCompany) {
        if (!data.storeId && !data.companyId) {
          return reject({
            message: multilingualService.getResponseMessage(
              "PARAMETERMISSING",
              lang
            ),
          });
        }
        let criteria = {}
        if (data.companyId) {
          criteria.companyId = mongoose.Types.ObjectId(data.companyId)
        }
        if (data.all == true || data.all == "true") {
          const dataNew = await model.storeItem.find(criteria)
            .populate("brandId")
          done({
            message: multilingualService.getResponseMessage(
              "FETCHED_SUCCESSFULLY",
              lang
            ),
            data: dataNew,
          });
          return;
        }
        if (!data.page) {
          data.page = 1;
        }
        let limit = Constant.LIMIT;
        if (data.storeId) criteria.storeId = mongoose.Types.ObjectId(data.storeId)
        if (data.categoryId) criteria.storeItemTypeId = mongoose.Types.ObjectId(data.categoryId);
        if (data.subCategoryId) criteria.storeItemSubTypeId = data.subCategoryId;
        if (data.brandId) criteria.brandId = data.brandId;
        if (data.name)
          criteria.$or = [{
              name: new RegExp(data.name, "i")
            },
            {
              productName: new RegExp(data.name, "i")
            },
          ];
        let products = await model.storeItem
          .find(criteria)
          .sort({
            _id: -1
          })
          .skip((data.page - 1) * 10)
          .limit(limit)
          .populate("brandId")
          .lean();

        let count = await model.storeItem.countDocuments(criteria);
        done({
          data: {
            list: products,
            count
          }
        });
      }
    });
  }

  calculatingTaxAndDiscount(item) {
    if (!item.price) item.price = 0;
    if (!item.tax) item.tax = 0;
    if (!item.serviceFee) item.serviceFee = 0;
    if (!item.originalPrice) item.originalPrice = 0;
    if (!item.priceExcTax) item.priceExcTax = 0;
    if (!item.discount) item.discount = 0;
    if (!item.discountedPriceExcTax) item.discountedPriceExcTax = 0;

    item.originalPrice = item.price; // from frontend originalPrice coming as price
    item.priceExcTax =
      item.originalPrice / ((item.tax + item.serviceFee) / 100 + 1).toFixed(2);
    item.discountedPriceExcTax = item.priceExcTax; // when discount is 0
    // if (item.discountType.toLowerCase() === "flat") {
    //   item.discountedPriceExcTax = item.priceExcTax - item.discount;
    // }
    // if (item.discountType.toLowerCase() === "percentage") {
    //   item.discountedPriceExcTax =
    //     item.priceExcTax - item.discount * 0.01 * item.priceExcTax;
    // }

    item.price =
      item.discountedPriceExcTax *
      ((item.tax + item.serviceFee) / 100 + 1).toFixed(2);

    return item;
  }
  updateCloneProducts(data, lang) {
    return new Promise((done, reject) => {
      if (!data.storeId || !data.info) {
        return reject({
          message: multilingualService.getResponseMessage(
            "PARAMETERMISSING",
            lang
          ),
        });
      }
      data.info.forEach(async (item) => {
        item = this.calculatingTaxAndDiscount(item);
        let data = await model.storeItem.findByIdAndUpdate(
          item._id, {
            originalPrice: Number(item.originalPrice).toFixed(2) ?
              Number(item.originalPrice).toFixed(2) : Number(item.price).toFixed(2),
            price: Number(item.price),
            quantity: item.quantity,
            purchaseLimit: item.purchaseLimit,
            tickets: item.tickets,
            LP: item.LP,
            label: item.label,
            marketPrice: item.marketPrice,
          }, {
            new: true
          }
        );
      });
      return done({
        message: multilingualService.getResponseMessage("UPDATEMSG", lang),
        data: data,
      });
    });
  }

  cloneProduct(data, lang) {
    return new Promise(async (done, reject) => {
      let isCompany = data.isCompany || false;
      if (isCompany == false) {
        if (!data.storeId || !data._id) {
          return reject({
            message: multilingualService.getResponseMessage(
              "PARAMETERMISSING",
              lang
            ),
          });
        }
        if (data.delete && (data.delete == true || data.delete == "true")) {
          await model.storeItem.findOneAndDelete({
            variantId: data._id,
            storeId: data.storeId,
            isProto: false,
          });
          return done({
            mssage: "DELETED!"
          });
        }

        let product = await model.storeItem
          .findOne({
            variantId: data._id,
            isProto: true
          })
          .lean();
        delete product._id;
        product["storeId"] = data.storeId;
        product["isProto"] = false;
        try {
          let newProduct = await new model.storeItem(product).save();
          done({
            data: newProduct
          });
          return;
        } catch (e) {
          return reject({
            message: e,
          });
        }
      } else if (isCompany) {
        if (!data.storeId || !data._id || !data.companyId) {
          return reject({
            message: multilingualService.getResponseMessage(
              "PARAMETERMISSING",
              lang
            ),
          });
        }
        if (data.delete && (data.delete == true || data.delete == "true")) {
          await model.storeItem.findOneAndDelete({
            variantId: data._id,
            storeId: mongoose.Types.ObjectId(data.storeId),
            companyId: mongoose.Types.ObjectId(data.companyId),
            isProto: false,
          });
          return done({
            mssage: "DELETED!"
          });
        }

        let product = await model.storeItem
          .findOne({
            variantId: data._id,
            storeId: mongoose.Types.ObjectId(data.storeId),
            isProto: false
          })
          .lean();
        delete product._id;
        product["companyId"] = data.companyId;
        try {
          let newProduct = await new model.storeItem(product).save();
          done({
            data: newProduct
          });
          return;
        } catch (e) {
          console.log(e, "eeeee")
          return reject({
            message: e,
          });
        }
      }
    });
  }

  cloneAllProducts(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        if (!data.storeId) {
          return reject({
            message: multilingualService.getResponseMessage(
              "PARAMETERMISSING",
              lang
            ),
          });
        }
        let store = await model.store.findById(data.storeId);
        let storeType = store.storeTypeId;
        let categories = await model.storeItemType
          .find({
            isParent: true,
            storeCategoryId: storeType,
          })
          .distinct("_id");
        let alreadyPresentProducts = await model.storeItem
          .find({
            storeId: data.storeId
          })
          .distinct("variantId");

        let products = await model.storeItem
          .find({
            storeItemTypeId: {
              $in: categories
            },
            variantId: {
              $nin: alreadyPresentProducts
            },
            isProto: true,
          })
          .lean();

        products = products.map((product) => {
          delete product._id;
          product["storeId"] = data.storeId;
          product["isProto"] = false;
          return product;
        });
        try {
          let result = await model.storeItem.insertMany(products);
        } catch (e) {
          done({
            message: "already cloned all products from admin, newly added products should be added manually",
            data: {},
          });
        }
        done({
          message: "Successfully added all products from admin to your shop",
          data: {},
        });
      } catch (e) {
        reject({
          message: "Store Doesn't Exists",
          data: {},
        });
      }
    });
  }
  getPrototypeProducts(data, lang) {
    return new Promise(async (done, reject) => {
      if (!data.storeTypeId || !data.storeId) {
        return reject({
          message: multilingualService.getResponseMessage(
            "PARAMETERMISSING",
            lang
          ),
        });
      }
      if (!data.page) {
        data.page = 1;
      }
      let categories = await model.storeItemType
        .find({
          storeCategoryId: data.storeTypeId
        })
        .distinct("_id");

      let storeProducts = await model.storeItem.find({
        storeId: data.storeId,
      });

      let storeMap = {};
      storeProducts.forEach((item) => {
        storeMap[item.variantId] = true;
      });

      let qry = {
        isProto: true
      };
      if (data.categoryId) qry.storeItemTypeId = data.categoryId;
      if (data.subCategoryId) qry.storeItemSubTypeId = data.subCategoryId;
      if (data.brandId) qry.brandId = data.brandId;
      if (data.name)
        qry.$or = [{
            name: new RegExp(data.name, "i")
          },
          {
            productName: new RegExp(data.name, "i")
          },
        ];
      if (!data.subCategoryId && !data.categoryId)
        qry.storeItemTypeId = {
          $in: categories
        };

      let products = await model.storeItem
        .find(qry)
        .sort({
          _id: -1
        })
        .skip((data.page - 1) * 25)
        .limit(25)
        .populate("brandId")
        .lean();

      let count = await model.storeItem.countDocuments(qry);

      products.forEach((item) => {
        item.isPresent = false;
        if (storeMap[item.variantId]) item.isPresent = true;
      });
      done({
        data: {
          list: products,
          count
        }
      });
    });
  }

  getAllEmployeesById(req) {
    return new Promise((done, reject) => {
      let page = 1
      if (req.query.page) {
        page = req.query.page;
      }
      let limit = 10;
      let filter = {
        storeId: mongoose.Types.ObjectId(req.query.id)
      }
      let lang = req.headers.language;
      if (req.query.search) {
        const regex = {
          $regex: `${req.query.search}`,
          $options: "i"
        };
        filter.$or = [{
          firstName: regex
        }];
      }
      let modelData;
      if (req.query.all && req.query.all === "true") {
        modelData = model.employee.find(filter)
      } else {
        modelData = model.employee.find(filter).skip(((page - 1) * limit)).limit(limit)
      }
      model.employee.find(filter).then((emp) => {
        modelData.then((result) => {
          if (!result) {
            return reject({
              message: multilingualService.getResponseMessage("WRONGENTRY", lang),
            });
          }
          let data = {
            data: result,
            count: emp.length
          }
          done({
            message: multilingualService.getResponseMessage(
              "EMPLOYEE_FETCHED_SUCCESSFULLY", lang
            ),
            data
            //   {data: result, count : emp.length}
          });
        });
      });
    });
  }

  async setOrderEmployeesId(req, res) {
    let lang = req.headers.language;
    let order = await model.storeOrder.findOne({
      _id: req.body.orderId
    });
    if (!order) {
      return res.reject({
        message: multilingualService.getResponseMessage("WRONGENTRY", lang),
      });
    }
    let employe = await model.employee.findOne({
      _id: req.body.employeeId
    });
    if (!employe) {
      return res.reject({
        message: multilingualService.getResponseMessage("WRONGENTRY", lang),
      });
    }
    let storeOrder = await model.storeOrder.findOneAndUpdate({
      _id: order._id
    }, {
      $set: {
        employeeId: employe._id
      }
    }, {
      new: true
    });
    //  return res.done({
    //     message: multilingualService.getResponseMessage(
    //       "ORDER_ASSIGN_SUCCESSFULLY", lang),
    //     data: storeOrder,
    //   });
    return res.success("ORDER_ASSIGN_SUCCESSFULLY", storeOrder);
  }

  // getMerchantPromoCodes(data, lang) {
  //   return new Promise(async (done, reject) => {
  //     try {
  //       const limit = Number(data.limit) || Constant.ADMINLIMIT;
  //       const page = Math.max(1, Number(data.page) || 0);
  //       const skip = Math.max(0, page - 1) * limit;
  //       const sort = { _id: -1 };

  //       let stores = await model.promocode.find({}).exec();
  //       let storeIds = stores.map((item) => item.storeId);

  //       const query = { limit, page, skip, search: data.search };
  //       const filter = { status: { $ne: 2 } };

  //       if (data.deals) filter["code"] = "DEAL";
  //       else filter["code"] = { $ne: "DEAL" };
  //       if (data.search) {
  //         const regex = { $regex: `${data.search}`, $options: "i" };
  //         filter.$or = [{ code: regex }, { name: regex }];
  //       }

  //       const itemCount = await model.promocode.countDocuments(filter);
  //       const pageCount = Math.ceil(itemCount / limit);
  //     } catch (e) {
  //       reject({ message: e });
  //     }
  //   })
  // }

  subscription(data, finalFileName, lang) {
    return new Promise(async (done, reject) => {
      try {
        data.image = process.env.S3URL + finalFileName;
        if (
          data.duration != 1 &&
          data.duration != 3 &&
          data.duration != 6 &&
          data.duration != 12
        ) {
          return reject({
            message: multilingualService.getResponseMessage("WRONGENTRY", lang),
          });
        }
        let result = await new model.Subscription(data).save();
        done({
          message: multilingualService.getResponseMessage(
            "SUBSCRIPTION_ADDED_SUCCESSFULLY",
            lang
          ),
          data: result,
        });
      } catch (err) {
        console.log(err);
      }
    });
  }

  getSubscription(req, lang) {
    return new Promise((done, reject) => {
      let offset = 1;
      let limit = +req.query.limit || 10;
      offset = req.query.offset;
      if (offset <= 0) {
        offset = 0;
      } else {
        offset = offset - 1;
      }

      model.Subscription.find({
          isDeleted: false
        })
        .countDocuments()
        .then((items) => {
          items = Math.ceil(items / limit);

          model.Subscription.find({
            isDeleted: false
          }).then((result) => {
            result = [...result];
            done({
              message: multilingualService.getResponseMessage(
                "SUBSCRIPTION_FETCHED_SUCCESSFULLY",
                lang
              ),
              data: result,
              pages: items,
            });
          });
        });
    });
  }

  getSubscriptionById(id, lang) {
    return new Promise((done, reject) => {
      model.Subscription.findById(id).then((result) => {
        if (!result) {
          return reject({
            message: multilingualService.getResponseMessage("WRONGENTRY", lang),
          });
        }
        done({
          message: multilingualService.getResponseMessage(
            "SUBSCRIPTION_FETCHED_SUCCESSFULLY",
            lang
          ),
          data: result,
        });
      });
    });
  }

  editSubscription(id, data, finalFileName, lang) {
    return new Promise(async (done, reject) => {
      try {
        if (finalFileName) data.image = process.env.S3URL + finalFileName;
        if (data.duration) {
          if (
            data.duration != 1 &&
            data.duration != 3 &&
            data.duration != 6 &&
            data.duration != 12
          ) {
            return reject({
              message: multilingualService.getResponseMessage(
                "WRONGENTRY",
                lang
              ),
            });
          }
        }

        let result = await model.Subscription.findByIdAndUpdate(id, data, {
          new: true,
        });
        done({
          message: multilingualService.getResponseMessage(
            "SUBSCRIPTION_UPDATED_SUCCESSFULLY",
            lang
          ),
          data: result,
        });
      } catch (err) {
        console.log(err);
      }
    });
  }

  deleteSubscription(id, lang) {
    return new Promise(async (done, reject) => {
      try {
        await model.Subscription.findByIdAndDelete(id);
        done({
          message: multilingualService.getResponseMessage(
            "SUBSCRIPTION_DELETED_SUCCESSFULLY",
            lang
          ),
          data: "",
        });
      } catch (err) {
        console.log(err);
      }
    });
  }

  deleteVarient(req, res) {
    return new Promise(async (done, reject) => {
      try {
        const varientId = req.query.id;
        await model.storeItem.findOneAndDelete({
          variantId: varientId
        });
        done({
          message: multilingualService.getResponseMessage(
            "Va_DELETED_SUCCESSFULLY",
            lang
          ),
          data: "",
        });
      } catch (err) {
        console.log(err);
      }
    });
  }
  async changeArrangingOrder(req, res) {
    const lang = "en"
    try {
      if (!req.body.list.length) {
        return res.send({
          message: multilingualService.getResponseMessage("FalseMsg", lang),
          data:{},
          success : false
        });
      }
      const Query = [];
      let serialNo = 0;
      req.body.list.forEach(async ele => {
        if(serialNo == ele.serialNo){
          return res.send({
            message: multilingualService.getResponseMessage("VALIDSERIAL", lang),
            data:{},
            success : false
          });
        }else{
          serialNo = ele.serialNo
        }
        delete ele.createdAt
        delete ele.updatedAt
        let updatedData = await model.storeCategory.findOneAndUpdate({
          _id: ele._id
        },{$set:ele},{new: true})
        Query.push(updatedData);
      });
      res.send({
        message: multilingualService.getResponseMessage(
          "LIST_UPDATED_SUCCESSFULLY",
          lang
        ),
        data: Query,
        success : true
      });
    } catch (e) {
      return res.send({
        message: multilingualService.getResponseMessage("FalseMsg", lang),
        data:{},
        success : false
      });
    }
  }
}

export default storeAdmin;
