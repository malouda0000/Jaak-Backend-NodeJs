const express = require("express");
const dotenv = require("dotenv");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const multer = require("multer"); 

const appTypeImage = multer({ storage: appTypeUpload });

dotenv.config();
const app = express.Router();
const KEY_ID = "rzp_test_15QHEECrqvFtic"
const KEY_SECRET = "OCFEuWIqvqsQ6QSSi84zhTrK"
const instance = new Razorpay({
  key_id: KEY_ID,
  key_secret: KEY_SECRET,
});
//Routes
app.get("/paymentKeyId", (req, res) => {
  res.send({ KEY_ID : KEY_ID });
});

app.post("/api/payment/order", (req, res) => {
  let params = req.body;
  instance.orders
    .create(params)
    .then((data) => {
      res.send({ sub: data, status: "success" });
    })
    .catch((error) => {
      res.send({ sub: error, status: "failed" });
    });
});

app.post("/api/payment/verify", (req, res) => {
  const body = req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;

  var expectedSignature = crypto.createHmac("sha256", KEY_SECRET).update(body.toString()).digest("hex");
  console.log("sig" + req.body.razorpay_signature);
  console.log("sig" + expectedSignature);
  var response = { status: "failure" };
  if (expectedSignature === req.body.razorpay_signature) response = { status: "success" };
  res.send(response);
});

const appTypeUpload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/appTypeImage");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname +
        "-" +
        Date.now() +
        `.${file.originalname.split(".").pop()}`
    );
  },
});

app.post(
  "/upload-image",
  appTypeImage.single("image"),
  function (req, res, next) {
    try {
      res.send(req.file);
    } catch (error) {
      console.log(error);
      res.send(400);
    }
  }
);

// secret_key = enNabZN9R84tCxeBHkEDp7zf
//key_id =  rzp_test_OyoZA6t4CNh1Ue
export default app