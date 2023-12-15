import express from "express";
import model from "../../models/index";
import Constant from "../../constant";
const Service = require("../../services");
import moment from "moment";
import mongoose from "mongoose";
import deliveryController from "./controllers/deliveryController";
import {
  compose
} from "async";
import services from "../../services";
import {
  populate
} from "../../models/BookingRequest";
let deliveryRepo = new deliveryController();

let route = express.Router();
let db = null
const MongoClient = require('mongodb').MongoClient;
let url = `${process.env.MONGO_URL}${process.env.MONGO_IP}/${process.env.DB_NAME}`;
if (process.env.DB_URL) {
  url = process.env.DB_URL;
}
MongoClient.connect(url, function (err, client) {
  db = client.db(process.env.DB_NAME);
});

module.exports = (io, socket, userSocketInfo, driverSocketInfo) => {
  // Add a user to connected socket for Single chat

  socket.on("addUser", async function (user) {
    // console.log(user, "*********************addUser");
    socket.username = user.userId;
    await model.user.findOneAndUpdate({_id:mongoose.Types.ObjectId(user.userId)},{$set:{socketId:socket.id}})
    userSocketInfo[user.userId] = socket.id;
    io.to(socket.id).emit("addUser", {
      sucess: true
    });
  });

  socket.on("addUserLocation", async function (user) {
    await MethodNotAllowed.findByIdAndUpdate(user.userId, {
      $set: {
        location: [user.longitude, user.latitude],
        isAvailable: user.isAvailable
      }
    })
    io.to(socket.id).emit("addLatLong", {
      sucess: true
    });
  });

  socket.on("addDriver", (user) => {
    // console.log(user, "*********************addDriver");
    socket.username = user.driverId;
    driverSocketInfo[user.driverId] = socket.id;
    global.driverSocketInfo[user.driverId] = socket.id;
    io.to(socket.id).emit("addDriver", {
      sucess: true
    });
  });

  socket.on("latlong", function (data) {
    // console.log(data, "latlong");
    let update = {
      cordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
      bearing: data.bearing,
    };
    if (data.driverId) {
      // console.log(data.driverId._id, "data.driverId._id");
      model.driver
        .findByIdAndUpdate(data.driverId._id, update, {
          new: true
        })
        .then((result) => {
          io.to(socket.id).emit("latlong", {
            sucess: true
          });
          if (data.trackingId) io.emit(data.trackingId, data);
        });
    } else {
      io.to(socket.id).emit("latlong", {
        sucess: true
      });
      if (data.trackingId) io.emit(data.trackingId, data);
    }
  });

  socket.on("cancelOrder", async function (data) {
    let qryModel;
    if (data.verticalType == 0){
      qryModel = model.restaurantOrder.findOneAndUpdate({
        _id: data._id,
        status: {
          $lt: 1
        }
      }, {
        status: 11
      }, {
        new: true
      });
    }else if (data.verticalType == 1){
      qryModel = model.storeOrder.findOneAndUpdate({
        _id: data._id,
        status: {
          $lt: 1
        }
      }, {
        status: 11
      }, {
        new: true
      });
    }else if (data.verticalType == 2){
      qryModel = model.taxiBooking.findOneAndUpdate({
        _id: data._id,
        status: {
          $lt: 4
        }
      }, {
        status: 11
      }, {
        new: true
      });
    }
    qryModel.then(async (result) => {
      if (!result){
        io.to(socket.id).emit("cancelOrder", {
          sucess: false,
          message: Constant.CANNOTCANCEL,
        });
      }else {
        await model.user.findOneAndUpdate({
              _id: result.userId,
            }, {
              $inc: {
                earnedLPPurchases: - result.loyalityPoints,
                availableLP: - result.loyalityPoints,
                totalEarnedLP: - result.loyalityPoints,
              },
          })
        if (result.scheduleType == "SCHEDULE") {
          db.collection('scheduledevents').deleteMany({
            "data.orderData.id": data._id
          })
        }
        if (data.verticalType == 1) {
          if(result.paymentMode === "Cash" && result.isWallet){
            await model.user.findOneAndUpdate({
              _id: result.userId
            }, {
              $inc: {
                wallet: Number(result.totalAmount - result.balanceLeft)
              }
            })
            await model.Transaction({
              userId: result.userId,
              transactionType: "redeemReward",
              amount: Number(result.totalAmount - result.balanceLeft),
              creditDebitType: "credit",
            })
            .save();
          }
          io.emit("adminCheckChange", {
            sucess: true,
            Id: data.verticalType ? result.storeId : result.restaurantId,
          });
        }
        if (result.driverId && data.verticalType != 2) {
          io.to(driverSocketInfo[result.driverId]).emit(
            "deliveryChangeStatus", {
              sucess: true,
              status: 11,
              data: result,
            }
          );
        } else{
          io.to(driverSocketInfo[result.driverId]).emit("taxiChangeStatus", {
            sucess: true,
            status: 11,
            data: result,
          });
        }
        io.to(socket.id).emit("cancelOrder", {
          sucess: true
        });
      }
    });
  });

  socket.on("OrderStatusChange", async function (data) {
    console.log("*************** OrderStatusChange **********************************");
    let update = {
      status: data.status
    };
    let updateData = await model.storeOrder.findOneAndUpdate(data.id, {
        $set: update
      }, {
        new: true
    }).populate("storeId").populate("storeoutlets").populate("userId").populate("driverId").populate("items.itemId")
    if (data.status == 4) {
      
      let userId = await model.storeOrder.findById(data.storeId).select('userId')
      let userDetials = await model.user.findById(userId)
      let payload = {
        to: userDetials.email,
        subject: "Please Rate the Driver And Store",
        data: updateData
      }
      await services.EmailService.mailer(payload, true)
      update.deliveryDate = moment().valueOf();
    }

    io.to(socket.id).emit("OrderStatusChange", {
      sucess: true,
      message: "status updated successfully",
    });
  });

  socket.on("OrderAddTime", async function (data) {
    console.log("OrderAddTime------------", data);
    let order = await model.storeOrder.findOne({
      _id: data.orderId
    });
    console.log("OrderAddTime------------", JSON.stringify(order));
    console.log(Number(data.preprationTime));
    let time = (Number.isNaN(Number(data.preprationTime)) ? 0 :
      Number(order.preprationTime)) + Number.parseInt(data.preprationTime);
    order = await model.storeOrder.findOneAndUpdate({
      _id: data.orderId
    }, {
      $set: {
        preprationTime: time,
        status: data.status
      }
    }, {
      New: true
    });
    console.log("OrderAddTime--------------DONE ", );
    io.to(socket.id).emit("OrderAddTime", {
      sucess: true,
      message: "Ok",
    });
  });

  socket.on("newMessage", function (data) {
    data.date = moment().valueOf();
    let msg = new model.message(data);
    msg
      .save()
      .then(async (result) => {
        let driver = await model.driver
          .findOne({
            _id: mongoose.Types.ObjectId(data.driverId)
          })
          .select("_id firstName lastName phone countryCode profilePic");
        io.to(socket.id).emit("newMessage", {
          sucess: true,
          data: result
        });
        if (data.sendBy == 1) {
          let payload = {
            title: `New message`,
            message: `You have a <strong>new message</strong>`,
            verticalType: data.verticalType,
            notimessage: `You have a new message`,
            driverId: data.driverId,
            userId: data.userId,
            trackingId: result.trackingId,
            driverDetails: driver,
          };
          console.log(JSON.stringify(payload), "12222222222222");
          await Service.Notification.driverChating(payload);
          io.to(driverSocketInfo[data.driverId]).emit("newMessage", {
            sucess: true,
            data: result,
          });
        } else {
          let user = await model.user
            .findOne({
              _id: mongoose.Types.ObjectId(result.userId)
            })
            .select("_id firstName lastName phone countryCode profilePic");
          let payload = {
            title: `New message`,
            verticalType: data.verticalType,
            message: `You have a <strong>new message</strong>`,
            notimessage: `You have a new message`,
            userId: data.userId,
            driverId: data.driverId,
            trackingId: result.trackingId,
            userDetails: user,
          };
          await Service.Notification.usersend(payload);
          io.to(userSocketInfo[data.userId]).emit("newMessage", {
            sucess: true,
            data: result,
          });
        }
      })
      .catch((err) => {
        io.to(socket.id).emit("newMessage", {
          sucess: false,
          err
        });
      });
  });

  socket.on("getMessages", function (data) {
    model.message.find({
      trackingId: data.trackingId
    }).then((result) => {
      io.to(socket.id).emit("getMessages", {
        sucess: true,
        data: result
      });
    });
  });

  return route;
};