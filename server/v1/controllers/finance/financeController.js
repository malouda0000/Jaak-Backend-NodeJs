import model from "../../../models/index";
import Constant from "../../../constant";
const Service = require("../../../services");
import multilingualService from "../../../services/multilingualService";
import { responseMessages } from "../languages/english";
const mongoose = require("mongoose");

const paymentController = {
  getAllUser: async (req, res, next) => {
    try {
      let pipeline = [];

      if (req.query.search) {
        let search = req.query.search;
        pipeline.unshift({
          $match: {
            $or: [
              { firstName: { $regex: `^${search}`, $options: "i" } },
              { lastName: { $regex: `^${search}`, $options: "i" } },
              { phone: { $regex: `^${search}`, $options: "i" } },
            ],useruser
          },
        });
        pipeline.unshift({ $addFields: { name: { $concat: ["$firstName", " ", "$lastName"] } } });
      } else {
        pipeline.unshift({ $match: { status: 1 } });
      }
      const users = await model.user.aggregate(pipeline);
      if(!users) return multilingualService.sendResponse(req,res, true, 1, 0, responseMessages.NO_USER_FOUND, "")
      if(users.length ==0) return multilingualService.sendResponse(req,res, true, 1, 0, responseMessages.NO_USER_FOUND, users)
      multilingualService.sendResponse(req,res, true, 1, 0, responseMessages.FETCHED_SUCCESSFULLY, users)
    } catch (error) {
      console.log(error.message)
    }
  },
  makePayment: async (req, res, next) => {
    try {
      req.body.paymentBy = req.user._id;
      let paymentBy = await model.user.findById(req.user._id);
      if(req.body.paymentMethod == 1) {
        if(paymentBy.wallet<req.body.amount) return multilingualService.sendResponse(req,res, true, 1, 0, responseMessages.INSUFFICIENT_BALANCE, "")
        let amount = Number(req.body.amount)
        await model.user.findByIdAndUpdate(req.user._id, {$inc: { wallet: -amount}});
        await model.user.findByIdAndUpdate(req.body.paymentTo, {$inc: { wallet: +amount}});
      }
      let payment = await model.finance.create(req.body);
      multilingualService.sendResponse(req,res, true, 1, 0, responseMessages.PAYMENT_DONE, payment)
    } catch (error) {
      console.log(error.message);
    }
  },

  lastTransaction: async (req, res, next) => {
    try {
      let lastPayment = await model.finance.find({$or: [{paymentBy: req.user._id},{paymentTo: req.user._id}]}).populate("paymentTo", "firstName lastName phone").populate("paymentBy", "firstName lastName phone").sort({createdAt: -1}).lean();
      multilingualService.sendResponse(req,res, true, 1, 0, responseMessages.TRANSACTIONS_FETCHED_SUCCESSFULLY, lastPayment)
    } catch (error) {
      console.log(error.message);
    }
  },

  recentTransaction: async (req, res, next) => {
    try {
      let recent = await model.finance.find({paymentBy: req.user._id}, {paymentBy: 0}).populate("paymentTo", "profilePic firstName lastName phone ").sort({createdAt: -1}).limit(20).lean();
      multilingualService.sendResponse(req,res, true, 1, 0, responseMessages.TRANSACTIONS_FETCHED_SUCCESSFULLY, recent)
    } catch (error) {
      console.log(error.message);
    }
  },
};

export default paymentController;
