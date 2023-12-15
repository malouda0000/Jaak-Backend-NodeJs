// var ccavenue = require('ccavenue')
const express = require("express");
let ccavenueRoutes = express.Router();
import model from "../../../models/index";
const ccavReqHandler = require("../../controllers/payment/ccAavenue/ccavRequestHandler");
const ccavResHandler = require("../../controllers/payment/ccAavenue/ccavResponseHandler");

// Server url where you want to send data to ccavenue
ccavenueRoutes.get("/make-payment", async function (req, res, next) {
  try {
    const orderData = await model.storeOrder.findById(req.query.orderId);
    const orderParams = {
      order_id: orderData.orderNumber,
      currency: "INR",
      amount: `${orderData.totalAmount}`,
      redirect_url: `${process.env.BASE_URL}/v1/payment/ccavenue/ccavResponseHandler`,
      billing_name: "Raman",
      merchant_id: process.env.cc_merchantId
      // etc etc
    };
    res.render("dataFrom.ejs" , orderParams);
  } catch (e) {
    console.log(e.message);
    next(e);
  }
  // ccavenue.setOrderId(orderData._id);
  // ccavenue.setOrderAmount(orderData.totalAmount);
  // ccavenue.makePayment(res); // It will redirect to ccavenue payment
});

ccavenueRoutes.post("/ccavRequestHandler", function (request, response) {
  ccavReqHandler.postReq(request, response);
});

ccavenueRoutes.post("/ccavResponseHandler", async (req, res) => {
  console.log("yha tkk aaya")
  await ccavResHandler.postRes(req, res);
});

export default ccavenueRoutes;
