const express = require("express");
const stripeController = require('../../controllers/payment/stripeController');

let stripeRoutes = express.Router();

//stripeRoutes.post('/createCardToken', stripeController.createToken);
stripeRoutes.post('/addCard', stripeController.addCard);
stripeRoutes.get('/getcard', stripeController.getCard);
stripeRoutes.post('/payment', stripeController.payment);

module.exports = stripeRoutes