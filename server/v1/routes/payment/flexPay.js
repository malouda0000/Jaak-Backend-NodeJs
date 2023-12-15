const express = require("express");

const flexPayController = require('../../controllers/payment/flexPayController');

let flexPayRoutes = express.Router();

flexPayRoutes.post('/paymentService', flexPayController.paymentService);
flexPayRoutes.get('/getTranscation', flexPayController.getTranscation);
flexPayRoutes.post('/payOutService', flexPayController.payOutService);




module.exports = flexPayRoutes


