"use strict";
import cron from "node-cron";
import common from "./commonSockets";
import delivery from "./deliverySockets";
import express from "express";
const router = express();
import model from "../../models/index";
import deliveryController from "./controllers/deliveryController";
let deliveryRepo = new deliveryController();

module.exports = async (io) => {
  var userSocketInfo = {};
  var driverSocketInfo = {};
  //*************************************************SOCKETS***************************************
  cron.schedule("*/1 * * * * ", async function () {
    // console.log("----------------WORKING----------------CRON----------------");
    deliveryRepo.sendStoreBookingAutomatically(io, driverSocketInfo);
    deliveryRepo.cancelStoreOrderAutomatically(io, driverSocketInfo);
  });

  io.on("connection", function (socket) {
    console.log("socket connect")
    socket.on("disconnect", function () {
      //Disconnecting the socket
      // console.log(
      //   "disconnect",
      //   userSocketInfo[socket.username],
      //   socket.username
      // );
      delete userSocketInfo[socket.username];
      delete driverSocketInfo[socket.username];
    });

    // Delivery Module
    common(io, socket, userSocketInfo, driverSocketInfo);
    delivery(io, socket, userSocketInfo, driverSocketInfo);
  });
  return router;
};
