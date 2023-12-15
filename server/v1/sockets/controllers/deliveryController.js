import model from "../../../models/index";
import Constant from "../../../constant";
const Service = require("../../../services");
import moment from "moment";
import mongoose from "mongoose";
import async from "async";
import { Model } from "mongoose";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));
class deliveryController {
  async sendBookingAutomatically(io, driverSocketInfo) {
    model.restaurantOrder
      .find({
        driverId: null,
        status: 1,
        orderType: 0,
        numberOfRetry: Constant.NUMBER_OF_RETRY,
        date: { $gte: moment().subtract(10, "minutes").valueOf() },
      })
      .populate("outletId", "address latitude longitude")
      .populate("userId", "firstName lastName profilePic countryCode phone")
      .populate("items.itemId restaurantId items.addOn", "name image name_ar")
      .lean()
      .then(async (result) => {
        let restaurantOrderIds = [];
        async.eachSeries(result1, async (val) => {
          val.verticalType = 0;
          restaurantOrderIds.push(mongoose.Types.ObjectId(val._id));
          if(result1.isTakeAway == false && result1.scheduleType  && (result1.scheduleType == "RECURING" || result1.scheduleType == "DELIVERY" || result1.scheduleType == "INSTANT")){
            await this.sendBooking(val, io, driverSocketInfo);
          }
        });
        await model.restaurantOrder.findOneAndUpdate(
          {
            _id: { $in: restaurantOrderIds },
          },
          { $inc: { numberOfRetry: 1 } }
        );
      })
      .catch((err) => console.log("ERROR CODE 5348", err));
  }

  async sendStoreBookingAutomatically(io, driverSocketInfo) {
    let criteria = {
      driverId: null,
      status: 1,
      orderType: 0,
      date: {
        $gte: moment().subtract(10, "minutes").valueOf(),
      },
    };
    if(driverSocketInfo.orderId != null && driverSocketInfo.orderId != ""){
      criteria._id = mongoose.Types.ObjectId(driverSocketInfo.orderId)
    }
    model.storeOrder.find(criteria)
      .populate("outletId", "address latitude longitude")
      .populate("userId", "firstName lastName profilePic countryCode phone")
      .populate("items.itemId storeId", "name image")
      .lean()
      .then(async (result) => {
        async.eachSeries(result, async (val) => {
          val.verticalType = 1;
          if(result.isTakeAway == false && result.scheduleType  && (result.scheduleType == "RECURING" || result.scheduleType == "DELIVERY" || result.scheduleType == "INSTANT")){
            await this.sendBooking(val, io, driverSocketInfo);
          }
        });
      })
      .catch((err) => console.log("ERROR CODE 5349", err));
  }

  cancelRestaurantOrderAutomatically(io, userSocketInfo) {
    model.restaurantOrder
      .update(
        {
          status: 0,
          date: {
            $lte: moment().subtract(10, "minutes").valueOf(),
          },
        },
        { status: 12 },
        { multi: true }
      )
      .then((result) => {
        async.eachSeries(result, async (val) => {
          if (userSocketInfo[val.userId])
            io.to(userSocketInfo[val.userId]).emit("statusChange", {
              sucess: true,
              verticalType: 0,
              status: 12,
              bookingId: val._id,
            });
        });
      });
  }

  cancelStoreOrderAutomatically(io, userSocketInfo) {
    model.storeOrder
      .updateMany(
        {
          status: 0,
          date: {
            $lte: moment().subtract(10, "minutes").valueOf(),
          },
        },
        { status: 12 },
        { multi: true }
      )
      .then((result) => {
        async.eachSeries(result, async (val) => {
          if (userSocketInfo[val.userId])
            io.to(userSocketInfo[val.userId]).emit("statusChange", {
              sucess: true,
              verticalType: 1,
              status: 12,
              bookingId: val._id,
            });
        });
      });
  }

  async sendBooking(val, io, driverSocketInfo) {
    // let driverIds = await model.storeOrder.find({}).exec();
    await model.driver
      .aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [
                parseFloat(val.outletId.longitude),
                parseFloat(val.outletId.latitude),
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
            moduleType : {$in :  [val.storeId.moduleKey]},
           // storeId ; {$in : [val.]}
            // bookingRequestLimit: { $lte: bookingRequestLimit },
            // verticalType: 1,
          },
        },
        { $project: { _id: 1, firstName: 1, lastName: 1 } },
        { $sort: { distance: 1 } },
      ])
      .then(async (drivers) => {
        let sendObj = JSON.parse(JSON.stringify(val));
        if (drivers.length) {
          for (let i = 0; i < drivers.length; i++) {
//		console.log("Driver Foound",drivers[i]["_id"],drivers[i],"Val",sendObj);
            let request = await model.driverRequest.findOne({
              orderId: val._id,
              driverId: drivers[i]["_id"],
            });
		console.log("Request :",request);
            let ignored = false;
            if (request && request.ignored) ignored = true;
            if (!ignored) {
              if (!request) {
                request = new model.driverRequest({
                  userId: val.userId,
                  driverId: drivers[i]["_id"],
                  date: moment().valueOf(),
                  requestData: val,
                  ignored: false,
                  orderId: val._id,
                });
                var req = await request.save();
              } else {
                var req = request;
              }

              val.driverId = drivers[i];
              val.requestId = req._id;
              val.date = moment().valueOf();
              sendObj.driverId = drivers[i];
              sendObj.requestId = req._id;
              sendObj.date = moment().valueOf();

              let payload = {
                title: `New Order`,
                type: 51,
                orderStatus: 0,
                requestId: sendObj.requestId,
                verticalType: sendObj.verticalType,
                driverId: drivers[i],
              };

              payload.data = sendObj;

              if (val.verticalType == 0) {
                payload.restaurantId = val._id;
                payload.message = `You have new order from <strong>Restaurant ${val.restaurantId.name}</strong>`;
                payload.notimessage = `You have new order from restaurant ${val.restaurantId.name}`;
              } else if (val.verticalType == 1) {
                payload.storeId = val._id;
                payload.message = `You have new order from <strong>Store ${val.storeId.name}</strong>`;
                payload.notimessage = `You have new order from store ${val.storeId.name}`;
              }
              try {
                await Service.Notification.driversend(payload);
              } catch (error) {
                throw error;
              }

              // if (JSON.stringify(val.driverId).length == 26) {
              let Driver = await model.driver
                .findOne(
                  { _id: drivers[i]["_id"] },
                  { firstName: 1, lastName: 1, _id: 1 }
                )
                .lean()
                .exec();
              Driver.requests = 0;
              sendObj.driverId = Driver;
              io.to(driverSocketInfo[drivers[i]["_id"]]).emit(
                "newBooking",
                sendObj
              );
            }
          } ////
          return true;
        } else return true;
      })
      .catch((err) => console.log("ERRORCODE 5341", err));
  }
  
  filterUserPayloadData(data) {
    delete data.userId;
    delete data.items;
    if (data.driverId) {
      data.driverId = {
        _id: data.driverId._id,
        firstName: data.driverId.firstName,
        lastName: data.driverId.lastName,
        profilePic: data.driverId.profilePic,
      };
    }
    return data;
  }
}

export default deliveryController;
