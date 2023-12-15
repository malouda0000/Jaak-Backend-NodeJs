import express from "express";
// import { Mpesa } from "mpesa-node";
const Mpesa = require("mpesa-node");
import Auth from "../../../auth";
import mongoose from "../../../connection/connect";
import model from "../../../models/index";
// import paymentController from '../../controllers/payment/paymentController'
// let paymentRepo = new paymentController()

let securityCredentials =
  "Uv8L3hiubBLoqRegzJcUOi12GkaDpcrXHLQDHj976sAQZ/jq8YdKVysdfGwl18bxcR/PIHCO57uosRgYDg+3p0fXJto9asLl6QLIu794DoFhu+InCPs24Q+FnXpRFZPkFlaby+WmIPZunZd1kXzebEAaQI+qbPkgJftn0e9W+5GYE5MqrKWibt6cQ3lJz+1BzX8C8Xw8jzylT+PU54lzmUKIwMwU7zkJpRIXa8h5m4YooLk+DbMmubevcruuyS+NQeLL01MvqK2h4z73cqBpOivXXIMOOaHC7bJPGV6PP1TUVkK4kU4K3Yeeg5b2IAjn9mn2vZdIXH+GPqdwHj37rQ==";
let Shortcode = "600000"; //'600111' //'600584'
let environment = "sandbox";
var request = require("request"),
  consumer_key = "iP3w1eD8FPbe8Sf2zn1AM2ASWweoidzK", //"X4I2pf1YoEIGGgubrQBTnwGLu9kIQdp6",
  consumer_secret = "ujaOXHhterPyLsNg"; //"p7REJNoCpBhAxZLK"

const testMSISDN = 254708374149; //254722480177 // 254722338244
const baseUrl = "https://sandbox.safaricom.co.ke";

//example
let credentials = {
  consumerKey: consumer_key,
  consumerSecret: consumer_secret,
  environment: environment,
  shortCode: Shortcode,
  initiatorName: "Test Initiator",
  lipaNaMpesaShortCode: 174379,
  lipaNaMpesaShortPass: "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
  securityCredential: securityCredentials,
  // certPath: path.resolve('keys/myKey.cert')
};
let user;
let orderId;

// create a new instance of the api
let mpesaApi = new Mpesa(credentials);
// const {
//     accountBalance,
//     b2b,
//     b2c,
//     c2bRegister,
//     c2bSimulate,
//     lipaNaMpesaOnline,
//     lipaNaMpesaQuery,
//     reversal,
//     transactionStatus
// } = mpesa
let paymentRoutes = express.Router();

paymentRoutes.route("/callback").post((req, res) => {
    console.log(`callback_${req.body.MSISDN}`, req.body, "callback here");
    console.log(req.query, "----------- Start");
    let transaction = {
      userId: user ? user._id : "",
      transactionId: req.body.TransID,
      amount: req.body.TransAmount,
      transactionType: req.body.TransactionType,
      PaymentGatewayType: "M_PESSA",
      orderId: orderId,
    };
    model.Transaction.create(transaction);
    console.log(req.query, "----------- End");
    io.emit(`callback_${req.body.MSISDN}`, req.body);
    // return res.json({ sucess: true })
    return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  })
  .get((req, res) => {
    console.log(req.query, "callback here");
    // return res.json({ sucess: true })
    return res.json(req.query);
  });

paymentRoutes.route("/validator").post((req, res) => {
  console.log(req.body, "validator here");

  // return res.json({ sucess: true })
  return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
});

paymentRoutes.route("/ResultURL").post((req, res) => {
  console.log(JSON.stringify(req.body), "ResultURL here");
  // return res.json({ sucess: true })
  return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
});

paymentRoutes.route("/register").post((req, res) => {
    console.log(`https://prod.webdevelopmentsolution.net:${process.env.PORT}/v1/payment/callback`)
  mpesaApi
    .c2bRegister(
      `https://prod.webdevelopmentsolution.net:${process.env.PORT}/v1/payment/callback`,
      `https://prod.webdevelopmentsolution.net:${process.env.PORT}/v1/payment/validator`,
      Shortcode
    )
    .then((response) => {
      return res.send({ sucess: true, response: response.data });
    })
    .catch((error) => {
      //eg
      console.log(error, "error");
      return res.send({ sucess: true, error: error });
    });
});
// This is used for Access Token
paymentRoutes.route("/token").get((req, res) => {
  let url = baseUrl + "/oauth/v1/generate?grant_type=client_credentials",
    auth = "Basic " + new Buffer(consumer_key + ":" + consumer_secret).toString("base64");

  console.log(auth);
  request(
    {
      url: url,
      headers: {
        Authorization: auth,
      },
    },
    function (error, response, body) {
      // TODO: Use the body object to extract OAuth access token
      if (error) {
        return res.json({ sucess: false, error: error });
      }
      return res.json({ sucess: true, data: JSON.parse(body) });
    }
  );
});

paymentRoutes.route("/transaction").get((req, res) => {
    console.log("User ");
  user = model.store.findOne({ _id: mongoose.Types.ObjectId(req.query.storeId) });
  //   user = req.query.storeId;
  console.log("User " );
  console.log("User 1111111");
  orderId = req.query.id;
  console.log("Cart Id " + orderId);
  let order = model.storeCart.findOne({ _id: mongoose.Types.ObjectId(orderId) });
  if (!order) {
    return res.reject("Cart not found");
  }
  console.log("Order " + order);
  // Math.random().toString(35).substr(2, 7)
  mpesaApi
    // .c2bSimulate(testMSISDN, Number(order.totalAmount).toFixed(0), "200200", "CustomerPayBillOnline", Shortcode)
    .c2bSimulate(testMSISDN, 10, "200200", "CustomerPayBillOnline", Shortcode)
    .then((response) => {
      console.log(response, "res");
      // return res.success({ sucess: true, response: response.data })
      return res.success("Payment done successfully", response.data);
    })
    .catch((err) => {
      console.log(err, "err");
      // return res.send(err)
      return res.reject(err);
    });
});

paymentRoutes.route("/transaction/check").get((req, res) => {
  mpesaApi
    .transactionStatus(
      req.query.id,
      "600111",
      4,
      `https://prod.webdevelopmentsolution.net:${process.env.PORT}/v1/payment/callback`,
      `https://prod.webdevelopmentsolution.net:${process.env.PORT}/v1/payment/callback`
    )
    .then((result) => {
      console.log(result);
      res.send({ sucess: true, data: result.data });
    })
    .catch((err) => {
      console.log(err);
    });
});

paymentRoutes.route("/expresstransaction").get((req, res) => {
  console.log("Transaction saction");
  const amount = 1;
  const accountRef = Math.random().toString(35).substr(2, 7);
  mpesaApi
    .lipaNaMpesaOnline(
      testMSISDN,
      amount,
      "https://appgrowthcompany.com:3000/v1/payment/callback",
      accountRef,
      "Lipa na mpesa online",
      "CustomerPayBillOnline",
      "174379"
    )
    .then((response) => {
      console.log(response, "res");
      return res.send({ sucess: true, response: response.data });
    })
    .catch((err) => {
      console.log(err, "err");
      return res.send({ sucess: true, error: err.data });
    });
});

paymentRoutes.route("/expressstatus").get((req, res) => {
  mpesaApi
    .lipaNaMpesaQuery(req.query.id)
    .then((response) => {
      console.log(response, "res");
      return res.send({ sucess: true, response: response.data });
    })
    .catch((err) => {
      console.log(err, "err");
      return res.send({ sucess: false, error: err.data });
    });
});

export default paymentRoutes;
