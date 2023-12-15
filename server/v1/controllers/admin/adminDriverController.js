import dotenv from "dotenv";
dotenv.config();
const fs = require("fs");
import model from "../../../models/index";
const es = require("event-stream");
import Constant from "../../../constant";
import moment from "moment";
import StoreOrder from "../../../models/store/storeOrder";
import {
  sendAdminForgotPasswordMail
} from "../../../services/EmailService";
import mongoose from "mongoose";
import multilingualService from "../../../services/multilingualService";
import {
  reject
} from "async";
import MailService from "../../../services/EmailService";

class adminDriverController {
  // with child dependencies
  deleteVehicleType(data, lang) {
    return new Promise(async (done, reject) => {
      let driver = await model.driver.findOne({
        vehicleTypeId: data.id,
      });
      if (driver) {
        reject({
          message: "Driver Exists for this vehicle Type, Delete Operation Failed",
          data: driver,
        });
        return;
      }
      let deleted = await model.vehicleType.findByIdAndDelete(data.id);
      if (deleted) {
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

  verifyDocument(data, lang) {
    return new Promise((done, reject) => {
      model.driverDocument
        .findByIdAndUpdate(data.updateId, data, {
          new: true,
        })
        .then((result) => {
          if (data.status == 2) {
            model.driverDocument
              .countDocuments({
                status: 2,
                driverId: data.driverId,
              })
              .then((count) => {
                if (count == 4) {
                  model.driver.findByIdAndUpdate(
                      data.driverId, {
                        profileStatus: 1,
                      }, {
                        new: true,
                      }
                    )
                    .then(async (driver) => {
                      let msg = "Your Driver Account is Verified ";
                      let subject = "Account Verified";
                      await MailService.mailer({
                        to: driver.email,
                        text: msg,
                        subject: subject,
                      });
                      done({
                        message: Constant.UPDATEMSG,
                        data: result,
                      });
                    });
                } else {
                  done({
                    message: Constant.UPDATEMSG,
                    data: result,
                  });
                }
              });
          } else {
            model.driver
              .findByIdAndUpdate(
                data.driverId, {
                  profileStatus: 0,
                }, {
                  new: true,
                }
              )
              .then((driver) => {
                done({
                  message: Constant.UPDATEMSG,
                  data: result,
                });
              });
          }
        });
    });
  }

  getAllDrivers(data, lang1) {
    return new Promise(async (done, reject) => {
      try {
        let lang = lang1.language;
        let geofenceId = lang1.geofenceid != "NA" ? lang1.geofenceid : null;
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
        const filter = {};
        data.name = data.search;
        if (data.name && data.name != "") {
          let firstName = "";
          let lastName = "";
          let searchName = data.name.split(" ");
          if (searchName[0] != null && searchName[0] != "") {
            firstName = searchName[0]
          }
          if (searchName[1] != null && searchName[1] != "") {
            lastName = searchName[1]
          }
          if (lastName != "") {
            filter.$or = [{
                firstName: {
                  $regex: firstName,
                  $options: "i"
                }
              },
              {
                email: {
                  $regex: firstName,
                  $options: "i"
                }
              },
              {
                phone: {
                  $regex: firstName,
                  $options: "i"
                }
              },
            ];
          } else {
            filter.$and = [{
                firstName: {
                  $regex: firstName,
                  $options: "i"
                },
              },
              {
                lastName: {
                  $regex: lastName,
                  $options: "i"
                },
              },
            ];
          }
        }
        if ((data.isPending == "true" || data.isPending == true) && lang1.geofenceid != "NA") {

          filter.$or = [{
              geofenceId: null
            },
            {
              profileStatus: 0
            },
            {
              moduleType: []
            }
          ]
        } else if ((data.isPending == "false" || data.isPending == false) && lang1.geofenceid != "NA") {

          if (geofenceId != null) {
            filter.$or = [{
                geofenceId: mongoose.Types.ObjectId(geofenceId)
              },
              {
                profileStatus: 1
              },
              {
                moduleType: {
                  $ne: []
                }
              }
            ]
          } else
            filter.geofenceId = {
              $ne: null
            };
        } else if ((data.isPending == "false" || data.isPending == false) && lang1.geofenceid == "NA") {

          filter.$and = [{
              profileStatus: 1
            },
            {
              moduleType: {
                $ne: []
              }
            }
          ]
        } else {
          filter.$or = [{
              profileStatus: 0
            },
            {
              moduleType: []
            }
          ]
        }
        // if (data.search) {
        //   const regex = { $regex: `${data.search}`, $options: "i" };
        //   filter.$or = [{ firstName: regex }, { email: regex }];
        // }
        const itemCount = await model.driver.countDocuments(filter);
        const pageCount = Math.ceil(itemCount / limit);
        const driverList = await model.driver.find(filter).populate("documents").sort(sort).skip(skip).limit(limit).lean();

        const message =
          driverList.length <= 0 ?
          multilingualService.getResponseMessage("EMPTY_LIST", lang) :
          multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang);
        done({
          message: message,
          data: {
            query,
            driverList,
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

  getDriversRatings(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        let driverIds = await model.driver.find({}).exec();
        driverIds = [].concat(driverIds).map((item) => item._id);
        let driverRatings = await model.driverRating.aggregate([{
            $match: {
              driverId: {
                $in: driverIds,
              },
            },
          },
          {
            $group: {
              _id: "$driverId",
              driverRating: {
                $avg: "$rating",
              },
            },
          },
        ]);
        done({
          message: "Driver ratings",
          data: driverRatings,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  getAllDriversTotalCommission(data, lang) {
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
              email: new RegExp(data.name, "i"),
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

      let result = await model.storeOrder.aggregate([{
          $match: qry,
        },
        {
          $group: {
            _id: "$driverId",
            totalEarning: {
              $sum: "$driverCommission",
            },
          },
        },
        {
          $lookup: {
            from: "drivers",
            localField: "_id",
            foreignField: "_id",
            as: "drivers",
          },
        },
        {
          $unwind: "$drivers",
        },
        {
          $sort: {
            _id: -1,
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: Constant.ADMINLIMIT,
        },
      ]);
      let count = await model.storeOrder.aggregate([{
          $match: qry,
        },
        {
          $sort: {
            _id: -1,
          },
        },
        {
          $group: {
            _id: "$driverId",
            totalEarning: {
              $sum: "$driverCommission",
            },
          },
        },
        {
          $count: "totalCount",
        },
      ]);

      if (count && count.length == 0) {
        count = [{
          maxCount: 0,
        }, ];
      }

      done({
        message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
        data: {
          drivers: result,
          count: count,
        },
      });
    });
  }

  getAllShuttleDrivers(id, data, lang) {
    return new Promise((done, reject) => {
      let qry1 = {};
      if (!id == "undefined")
        qry1 = {
          _id: {
            $ne: id,
          },
        };

      let qry = {
        status: {
          $ne: 2,
        },
        verticalType: 3,
      };

      model.shuttle.find(qry1).then((shuttle) => {
        let drivers = [];
        shuttle.map((val) => {
          drivers.push(val.driver);
        });
        qry._id = {
          $nin: drivers,
        };
        model.driver
          .find(qry)
          .select("firstName lastName")
          .then((result) => {
            done({
              data: result,
            });
          });
      });
    });
  }

  getAllShuttleDriversList() {
    return new Promise((done, reject) => {
      let qry = {
        status: {
          $ne: 2,
        },
        verticalType: 3,
      };
      model.driver
        .find(qry)
        .select("firstName lastName")
        .then((result) => {
          done({
            data: result,
          });
        });
    });
  }

  getDriverAllOrders(data, lang) {
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
        let filter;
        if (data.status != "all")
          filter = {
            driverId: data.driverId,
            status: data.status,
          };
        else
          filter = {
            driverId: data.driverId,
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

  getDriverOrderCount(lang) {
    return new Promise(async (done, reject) => {
      try {
        let driverIds = await model.driver.find({}).exec();
        driverIds = [].concat(driverIds).map((item) => item._id);
        let driverRatings = await model.storeOrder.aggregate([{
            $match: {
              driverId: {
                $in: driverIds,
              },
            },
          },
          {
            $group: {
              _id: "$driverId",
              acceptCount: {
                $sum: {
                  $cond: [{
                      $eq: ["$status", 2],
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
              // allOrderCount: {
              //   $sum: {
              //     $cond: [{ $eq: ["$status", 12] }, 1, 0],
              //   },
              // },
              allOrderCount: {
                $sum: 1,
              },
            },
          },
        ]);
        done({
          message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
          data: driverRatings,
        });
        // const acceptCount = await model.storeOrder.countDocuments({ driverId: { $in: driverIds }, status: 2 });
        // const completeCount = await model.storeOrder.countDocuments({ driverId: { $in: driverIds }, status: 4 });
        // const cancelCount = await model.storeOrder.countDocuments({ driverId: { $in: driverIds }, status: 12 });

        // done({ message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang), data: { acceptCount, completeCount, cancelCount } });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  getDriverDocument(id, lang) {
    return new Promise((done, reject) => {
      model.driverDocument
        .find({
          driverId: id,
        })
        .then((docs) => {
          done({
            data: docs,
          });
        });
    });
  }

  addDriverDocument(driverId, data, file, lang, finalFileName) {
    return new Promise((done, reject) => {
      model.driverDocument
        .findOneAndUpdate({
          name: data.name,
          driverId: driverId,
        }, {
          frontImage:  finalFileName,
          date: moment().valueOf(),
          status: 0,
        }, {
          new: true,
        })
        .then((result) => {
          if (result) {
            model.driverDocument
              .countDocuments({
                driverId: driverId,
                status: 1,
              })
              .then((count) => {
                if (count >= 4) {
                  model.driver
                    .findByIdAndUpdate(
                      driverId, {
                        profileStatus: 1,
                      }, {
                        new: true,
                      }
                    )
                    .then((driver) => {
                      done({
                        message: Constant.UPDATEMSG,
                        data: result,
                      });
                    });
                } else {
                  done({
                    message: Constant.UPDATEMSG,
                    data: result,
                  });
                }
              });
          } else {
//Temporary done because we don't know about that. Junaid 28-Dec-2021 09:27 pm
		const data ={
name:'id',
date:moment().valueOf(),
driverId:driverId,
status:1,
frontImage: finalFileName === undefined ? "" :  finalFileName,
backImage:''
}
//            data.date = moment().valueOf();
//            data.driverId = driverId;
//            data.status = 1;
//            if (finalFileName) data.image = process.env.S3URL + finalFileName;
            let doc = new model.driverDocument(data);
            doc.save().then((document) => {
              model.driverDocument
                .countDocuments({
                  driverId: driverId,
                  status: 1,
                })
                .then((count) => {
                  if (count >= 1) { //Was 4 changed to zero to work temporary
                    model.driver
                      .findByIdAndUpdate(
                        driverId, {
                          profileStatus: 1,
                        }, {
                          new: true,
                        }
                      )
                      .then((driver) => {
                        done({
                          message: Constant.ADDMSG,
                          data: document,
                        });
                      });
                  } else {
                    done({
                      message: Constant.ADDMSG,
                      data: document,
                    });
                  }
                });
            });
          }
        })
        .catch((err) => {
          reject({
            message: Constant.ERRMSG,
          });
        });
    });
  }

  updateDriverDocument(id, file, lang, finalFileName, data,request) {
    return new Promise((done, reject) => {
      model.driverDocument
        .findByIdAndUpdate(
          id, {
            frontImage: finalFileName,
            status: request.body.status,
            expiryDate: data.expiryDate
          }, {
            new: true,
          }
        )
        .then((doc) => {
	if(request.body.status !==2)
	{
		model.driver.findByIdAndUpdate(
		request.body.driverId, {
			profileStatus:0,	
		},{
		new:true,
		}
		).then((driver) => {
			done({
			message: Constant.UPDATEMSG,
			data: doc,
			});
		});
	}
        else{
	  model.driverDocument
            .countDocuments({
              driverId: request.body.driverId,//id,
              //status: 1,
            })
            .then((count) => {
console.log("Inside Count",count);
              if (count >= 1) { //Count was 4 but changed to 1 to work temporary Junaid 1-Jan-2022
                model.driver
                  .findByIdAndUpdate(
                    request.body.driverId, {
                      profileStatus: 1,
                    }, {
                      new: true,
                    }
                  )
                  .then((driver) => {
                    done({
                      message: Constant.UPDATEMSG,
                      data: doc,
                    });
                  });
              } else {
                done({
                  message: Constant.UPDATEMSG,
                  data: doc,
                });
              }
            });
		}
        });
    });
  }

  getDriverDetail(id, lang) {
    return new Promise((done, reject) => {
      model.driver
        .findById(id)
        .populate("documents")
        .populate("storeId")
        .select("+status")
        .then((result) => {
          done({
            data: result,
          });
        });
    });
  }

  updateDriverDetail(driverId, data, file, lang, finalFileName) {
    return new Promise(async (done, reject) => {
      try {
        let qry = {
          _id: {
            $ne: driverId,
          },
        };
        if (data.email) {
          qry = {
            $and: [{
                _id: {
                  $ne: driverId,
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
                  {
                    vehicleNumber: data.vehicleNumber,
                  },
                ],
              },
            ],
          };
        }
        let driver = await model.driver.findOne(qry).lean().exec();

        if (driver && data.email)
          return reject({
            message: data.email && data.email.toLowerCase() == driver.email ?
              Constant.EMAILEXISTS :
              data.vehicleNumber == driver.vehicleNumber ?
              Constant.VEHICLENUMBEREXISTS :
              Constant.PHONEEXISTS,
          });

        if (finalFileName) data.profilePic = process.env.S3URL + finalFileName;
        if (data.storeId === null) {
          data.storeId = null;
        }
        let result = await model.driver
          .findByIdAndUpdate(driverId, data, {
            new: true,
          })
          .select("+status");

        if (data.status === 1) {
          done({
            message: multilingualService.getResponseMessage("UPDATEMSG", lang),
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

  deleteDriver(driverId, lang) {
    return new Promise(async (done, reject) => {
      try {
        let qry = {
          _id: driverId,
        };

        let driverDetails = await model.driver.findOne(qry).lean().exec();

        if (!driverDetails)
          return reject({
            message: multilingualService.getResponseMessage("INAVLIDID", lang),
          });

        await model.driver.findByIdAndDelete(driverId);

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

  blockUnblockDriver(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        await model.driver.findOneAndUpdate({
          _id: data.driverId,
        }, {
          $set: {
            status: Number(data.status),
          },
        });

        if (data.status === 0) {
          done({
            message: multilingualService.getResponseMessage("DRIVERBLOCKED", lang),
          });
        }
        if (data.status === 2) {
          done({
            message: multilingualService.getResponseMessage("DRIVERUNBLOCKED", lang),
          });
        }
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }

  driverByStatus(data, lang) {
    return new Promise(async (done, reject) => {
      try {
        // status = 0 for all,   1 for online , 2 for offline , 3 for ongoing
        let sendData;
        if (data.status == 0) {
          sendData = await model.driver.find({});
        } else if (data.status == 1) {
          sendData = await model.driver.find({
            isAvailable: 1,
            status: {
              $in: [1, 2],
            },
          });
        } else if (data.status == 2) {
          sendData = await model.driver.find({
            isAvailable: 0,
            status: {
              $in: [1, 2],
            },
          });
        } else if (data.status == 3) {
          sendData = await model.storeOrder
            .find({
              status: {
                $in: [1, 2, 3, 4, 7],
              },
              driverId: {
                $exists: true,
              },
            })
            .populate("driverId");
        }
        done({
          message: multilingualService.getResponseMessage("FETCHED_SUCCESSFULLY", lang),
          data: sendData,
        });
      } catch (error) {
        return reject({
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
        });
      }
    });
  }
  async getAllDriversCSV(req, res, next) {
    let lang = req.headers.language || "en";
    try {
      const fileName = "driver.csv";
      const fileUrl = "server/uploads/drivers/" + fileName;
      const writableStream = fs.createWriteStream(fileUrl);
      let geofenceId = req.headers.geofenceid != "NA" ? req.headers.geofenceid : null;
      const filter = {};
      let count = 0;
      req.body.name = req.body.search
      if (req.body.name && req.body.name != "") {
        let [firstName, lastName] = req.body.name.split(" ");
        if (!lastName) {
          filter.$or = [{
              firstName: new RegExp(req.body.name, "i")
            },
            {
              lastName: new RegExp(req.body.name, "i")
            },
            {
              email: new RegExp(req.body.name, "i")
            },
            {
              phone: new RegExp(req.body.name, "i")
            },
          ]
        } else {
          filter.$and = [{
              firstName: new RegExp(firstName, "i")
            },
            {
              lastName: new RegExp(lastName, "i")
            },
          ]
        }
      }
      if (geofenceId != null) {
        filter.geofenceId = mongoose.Types.ObjectId(geofenceId)
      }
      if (req.body.isPending) {
        filter.geofenceId = null
      }
      let driverList = await model.driver.aggregate([{
        $match: filter
      }, {
        $sort: {
          createdAt: -1
        }
      }]).cursor({}).exec();
      // const message = driverList.length <= 0 ? multilingualService.getResponseMessage("EMPTY_LIST", lang) : multilingualService.getResponseMessage(
      //     "FETCHED_SUCCESSFULLY",
      //     lang
      //   );
      let header = `No., Name , Email , Phone , Joining Date, Accepted Booking, Cancelled Booking, Ongoing Booking, Completed Booking\n`;
      writableStream.write(header);
      driverList
        .pipe(
          es.map(async (data, callback) => {
            let acceptBookingCount = await model.storeOrder.countDocuments({
              driverId: data._id,
              status: 1
            })
            let cancelBookingCount = await model.storeOrder.countDocuments({
              driverId: data._id,
              status: 14
            })
            let ongoingBookingCount = await model.storeOrder.countDocuments({
              driverId: data._id,
              status: {
                $in: [8, 2, 3, 7]
              }
            })
            let completeBookingCount = await model.storeOrder.countDocuments({
              driverId: data._id,
              status: 4
            })
            let line = `${(data.lastName ? data.firstName + "" : data.firstName) + (data.lastName ? data.lastName : "")}, ${ data.email ? data.email : ""},${JSON.stringify((data.phone?data.countryCode+'-': data.countryCode)+(data.phone?data.phone: ''))}, ${ data.createdAt ? moment( new Date(moment(data.createdAt).subtract(630, "minute"))).format("DD-MMM-YYYY") : ""}, ${acceptBookingCount ? acceptBookingCount : 0}, ${cancelBookingCount ? cancelBookingCount : 0}, ${ongoingBookingCount ? ongoingBookingCount : 0}, ${completeBookingCount ? completeBookingCount : 0}`
            return callback(null, `${++count},${line}\n`);
          })
        ).pipe(writableStream);

      driverList.on("end", async () => {
        res.status(200).send({
          code: 200,
          success: true,
          message: "",
          data: {
            redirection: process.env.BASE_URL + "/static/drivers/" + fileName,
          },
        });
      });
    } catch (error) {
      next(error)
    }
  }
  async getAllNearDrivers(req, res, next){
    let lang = req.headers.language || "en";
    try {
      const orderId = req.query.orderId || "";
      if(orderId == ""){
        res.status(200).send({
          code: 200,
          success: false,
          message: "",
          data: {}
        });
      }
      const result = await model.storeOrder.findOne({_id:mongoose.Types.ObjectId(orderId)})
      .populate("outletId", "address latitude longitude")
      .populate("userId", "firstName lastName profilePic countryCode phone")
      .populate("items.itemId storeId", "name image moduleKey")
      .lean()
      if(result.isTakeAway == false && result.scheduleType  && (result.scheduleType == "RECURING" || result.scheduleType == "DELIVERY" || result.scheduleType == "INSTANT")){
        let driverList = await model.driver.aggregate([{
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [
                parseFloat(result.outletId.longitude),
                parseFloat(result.outletId.latitude),
              ],
            },
            distanceField: "distance",
            spherical: true,
            distanceMultiplier: 1e-3,
            maxDistance: Constant.DRIVERRADIUS,
          },
        }, {
          $match: {
            isAvailable: 1,
            status: { $in: [1, 2] },
            moduleType : {$in :  [result.storeId.moduleKey]}
          },
        },
        { $project: { _id: 1, firstName: 1, lastName: 1 } },
        { $sort: { distance: 1 } },
        ])
        if(driverList.length > 0){
          return res.status(200).send({
            code: 200,
            success: true,
            message: "List get successfully.",
            data: driverList
          });
        }else{
          return res.status(200).send({
            code: 200,
            success: false,
            message: "No driver available right now",
            data: []
          });
        }
      }
      return res.status(200).send({
        code: 200,
        success: false,
        message: "You can't assign driver.",
        data: {},
      });
    } catch (error) {
      next(error)
    }
  }
}

export default adminDriverController;
