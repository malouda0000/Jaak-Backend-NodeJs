const express = require("express");
import models from "../../../models";
import razorpayController from "../../controllers/payment/razorpay";
let razorRepo = new razorpayController();

const crypto = require("crypto");

const razorpayHTML = require("../../../payment");

let razorRoutes = express.Router();

const RazorPay = require("razorpay");

const KEY_ID = "rzp_test_15QHEECrqvFtic"
const KEY_SECRET = "OCFEuWIqvqsQ6QSSi84zhTrK"

const razorpay = new RazorPay({
  key_id: KEY_ID,
  key_secret: KEY_SECRET,
});

//Routes

razorRoutes.route("/paymentKeyId").get((req,res) => {
  res.send({ KEY_ID : KEY_ID });
})

razorRoutes.route("/create-order").get(async (req, res) => {

  console.log("<<<<<<<<<< creating razorpay order >>>>>>>")

  models.storeOrder.findOne({_id:req.query.id})
  .then(async(request)=>{

    console.log("request",request);

    if(!request.totalAmount){
      return res.json({
        message:"total amount needed"
      })
    }

    let orderData = {
      amount: parseFloat(request.totalAmount).toFixed(2) * 100 ,
      currency: "INR",
      receipt: req.query.id,
    };

    razorpay.orders
      .create(orderData)
      .then(async (response) => {
        //r_order_id: response.id,
        let user = await models.user.findById(request.userId);

        return res.send(
          razorpayHTML(
            parseInt(request.totalAmount),
            "INR",
            "APPTUNIX",
            "foodielal",
            response.id,
            user.firstName + user.lastName,
            user.email,
            user.phone,
            request.address.address,
            KEY_ID,
            request._id
          )
        );
      })
      .catch((error) => {
        console.log(error);
      });
      
  })

});

razorRoutes.route("/payment-verify").post((req,res) => {
  const body = req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;

  var expectedSignature = crypto.createHmac("sha256", KEY_SECRET).update(body.toString()).digest("hex");
  console.log("sig" + req.body.razorpay_signature);
  console.log("sig" + expectedSignature);
  var response = { status: "failure" };
  if (expectedSignature === req.body.razorpay_signature) response = { status: "success" };
  res.send(response);

});



export default razorRoutes