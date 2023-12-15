let axios = require("axios");
import express from "express";
let app = express();
import dotenv from "dotenv";
dotenv.config();
require("dotenv").config();
require("./connection/connect");
import path from "path";
import bodyParser from "body-parser";
import cors from "cors";
import https from "https";
import http from "http";
import fs from "fs";
require("./config/config");
import response from "./responses";
import v1 from "./v1/routes";
import socket from "./v1/sockets/";
let morgan = require("morgan");
let cron = require("./crons");
const AWS = require("aws-sdk");
import model from "./models/index";
const ID = process.env.ACCESSKEYS3;
const SECRET = process.env.SECRETACCESSKEY;
const s3 = new AWS.S3({
  accessKeyId: ID,
  secretAccessKey: SECRET,
});
const razorpayHTML = require("./payment");
var CronJob = require('./crons')
const FCM = require("fcm-node");
var ejs = require("ejs");
app.set('view engine', 'ejs')
const RazorPay = require("razorpay");

const razorpay = new RazorPay({
  key_id: "rzp_test_2okHLNpqPGOvEa",
  key_secret: "iYOq5fmijaRQKm9LXko7Q3pV",
});

global.__basedir = __dirname;


app.get("/success", (req, res) => {
  const file = path.join(__dirname, "../server/views/success");
  res.render(file);
});

app.get("/expire", (req, res) => {
  const file = path.join(__dirname, "../server/views/expire");
  res.render(file);
});
app.get("/password", (req, res) => {
  const file = path.join(__dirname, "../server/views/reset-password");
  res.render(file, { data: { userId: "12345", link: "54321" } });
});
app.get("/payment-success", (req, res) => {
  const file = path.join(__dirname, "views/payment_status");
  return res.render(file);
});
app.get("/payment-fail", (req, res) => {
  const file = path.join(__dirname, "views/payment_fail");
  return res.render(file);
});
app.get("/credit-fail", (req, res) => {
  const file = path.join(__dirname, "views/provider_payment_fail");
  return res.render(file);
});
app.get("/credit-success", (req, res) => {
  const file = path.join(__dirname, "views/provider_payment_success");
  return res.render(file);
});
app.get("/orders", async (req, res) => {
  let request = await model.storeOrder.findById(req.query.id);
  let serviceProvider = await model.user.findById(request.userId);
  let orderData = {
    amount: request.amount * 100,
    currency: "INR",
    receipt: req.query.id,
  };
  if (serviceProvider.razorpayAccount)b
    orderData.transfers = [
      {
        amount: request.amount * 100,
        currency: "INR",
        account: serviceProvider.razorpayAccount,
        on_hold: 1,
      },
    ];
  razorpay.orders
    .create(orderData)
    .then(async (response) => {
      let request = await model.BookingRequest.findByIdAndUpdate(req.query.id, {
        r_order_id: response.id,
      });
      let user = await model.user.findById(request.sentBy);
      return res.send(
        razorpayHTML(
          request.totalAmount
          ,
          req.body.currency||"INR",
          process.env.DB_NAME,
          "AC Service App",
          response.id,
          user.firstName + user.lastName,
          user.email,
          user.phone,
          user.address
        )
      );
    })
    .catch((error) => {
      console.log(error);
    });
});

app.post("/razor-success", async (req, res) => {
  const order = await models.storeOrder.findOne({_id:req.query.orderId})

  const file = path.join(__dirname, "../server/views/razorSuccess");
  res.render(file);
});

global.driverSocketInfo = {};
import storeController from "./v1/controllers/store/storeController";
import async from "async";
import models from "./models/index";
let storeRepo = new storeController();

let server = {};
if (process.env.ENVIRONMENT === "production") {
  const options = {
    key: fs.readFileSync(process.env.PRIVKEY),
    cert: fs.readFileSync(process.env.FULLCHAIN),
  };
  console.log("HTTPS");

  server = https.createServer(options, app).listen(process.env.PORT, () => {
    console.log("server listening 🌎 on port =>", process.env.PORT);
  });

} else {
  console.log("HTTP");
  server = http.createServer(app).listen(process.env.PORT, () => {
    console.log("server listening 🌎 on port =>", process.env.PORT);
  });
}
global.io = require("socket.io")(server);

CronJob.startCronJobs().then(console.log("cronJob.startCronJobs();"));

app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms", {
    skip: (req, res) => {
      return req.originalUrl.startsWith("/static");
    },
  })
);
app.use(response.success, response.reject);
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../server/views"));

// for show images
app.use("/static", express.static(path.join(__dirname, "../server/uploads")));
app.use("/emailTemplate", express.static(path.join(__dirname, "../server/views")));

app.use("/v1", v1);
socket(io);

app.get("/test", (req, res) => {
  res.send("HEHEHEHEHEHEEHEHEHEHEHEHEHEHEHHE");
});
