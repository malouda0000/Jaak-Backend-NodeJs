const express = require("express");
import paymentController from "../../controllers/payment/paymentController";
let paymentRepo = new paymentController();

let dibsyRoutes = express.Router();


dibsyRoutes.route("/request-payment").post((req, res) => {
    paymentRepo.requestPayment(req.body, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message, err.data);
      });
});

dibsyRoutes.route("/split-payment").post((req, res) => {
    paymentRepo.testPaySplit(req.body, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message, err.data);
      });
});

export default dibsyRoutes