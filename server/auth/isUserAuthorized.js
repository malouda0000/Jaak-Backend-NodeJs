import Model from "../models/index";
import Constant from "../constant";
const Service = require("../services");
import multilingualService from "../services/multilingualService";
import { model } from "mongoose";

module.exports = async (req, res, next) => {
  if (req.headers && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length !== 2 && parts.length !== 3)
      return res.status(200).send({
        response: {
          success: false,
          message: Constant.TOKENNOTCORRECT,
          logout: 1,
        },
        data: null,
      });
    let token = parts[1];
    const scheme = parts[0];
    if (parts[1] === "Guest") {
      token = parts[2];
      let user = await Model.user.findOne({ deviceId: token, status: 5 });
      // user=user[0]
      if (!user) {
        user = await Model.user({ deviceId: token, status: 5 }).save();
      }
      req.user = user;
      next();
      return;
    }
    Service.JwtService.verify(token, (error, user) => {
      if (error)
        return res.status(200).send({
          response: {
            success: false,
            message: Constant.TOKENNOTCORRECT,
            logout: 1,
          },
          data: null,
        });
      let query;
      let message = Constant.TOKENNOTCORRECT;
      let userId = user._id;
      if (scheme == "SEC") {
        query = Model.user.findOne({
          _id: userId,
          // authToken: token,
          status: { $nin: [Constant.USER_STATUS.DELETED] },
        });
        message = Constant.USERBLOCKED;
      } else if (scheme == "SED") {
        query = Model.driver.findOne({
          _id: userId,
          // authToken: token,
          status: { $in: [0, 1, 2] },
        });
        message = Constant.DRIVERBLOCKED;
      } else if (scheme == "STORE") {
        query = Model.store.findOne({
          _id: userId,
          status: { $nin: [Constant.USER_STATUS.DELETED] },
        });
    
      }else {
        query = Model.admin.findOne({
          _id: userId,
          // authToken: token,
          status: { $nin: [Constant.USER_STATUS.DELETED] },
        });
        message = Constant.ADMINBLOCKED;
      }
      query.then((user) => {
        if (!user) {
          return res.status(200).send({
            response: {
              success: false,
              message: Constant.TOKENNOTCORRECT,
              logout: 1,
            },
            data: null,
          });
          // } else if (user.status == Constant.USER_STATUS.BLOCK) {
          //   return res.status(200).send({
          //     response: {
          //       success: false,
          //       message: message,
          //       logout: 0,
          //     },
          //     data: null,
          //   });
        }
        req.user = user;
        next();
      });
    });
  } else {
    return res.status(200).send({
      response: { success: false, message: Constant.TOKENMISSING, logout: 1 },
      data: null,
    });
  }
};
