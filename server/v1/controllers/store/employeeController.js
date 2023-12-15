import model from "../../../models/index";
import Constant from "../../../constant";
const Service = require("../../../services");
import moment from "moment";
const { customAlphabet } = require("nanoid");
import mongoose, { ObjectId } from "mongoose";
import { responseMessages } from "../../controllers/languages/english";
import multilingualService from "../../../services/multilingualService";

class employeeController {
  async login(req, res, next) {
    let lang = req.headers.language;
    let qry = {
      email: req.body.email,
      password: req.body.password,
    };
    try {
      let employe = await model.employee
        .findOne({ email: qry.email })
        .select("password");
      if (employe) {
        if (Service.HashService.decrypt(employe.password) !== qry.password)
          return res.reject({
            message: multilingualService.getResponseMessage(
              "INVALIDPARAMS",
              lang
            ),
          });

        let update = {
          authToken: Service.JwtService.issue({ _id: employe._id }),
        };
        employe = await model.employee
          .findByIdAndUpdate(employe._id, update, { new: true })
          .select("+authToken");
      }
      return res.success("OK", employe);
    } catch (error) {
      next(error);
    }
  }

  async orders(req, res, next) {
    let lang = req.headers.language;
    try {
      let storeOrders = await model.storeOrder.find({
        employeeId: req.query.id,
      }).populate("outletId")
      .populate("userId")
      .populate("storeId");
      return res.success("OK", storeOrders);
    } catch (error) {
      next(error);
    }
  }

  async createEmployee(req, res) {
    try {
      const storeType = JSON.parse(req.body.storeTypeId);
      delete req.body.storeTypeId;
      const setobj = req.body;
      setobj.storeTypeId = storeType;
      setobj.role = "employee";
      if (req.body.phone != null) {
        let employe = await model.employee.findOne({
          _id: { $nin: [mongoose.Types.ObjectId(req.params.id)] },
          phone: req.body.phone,
          isDeleted: false,
        });
        if (employe)
          return multilingualService.sendResponse(
            req,
            res,
            false,
            1,
            0,
            responseMessages.PHONEEXISTS,
            {}
          );
      }

      if (req.body.email != null) {
        let employe = await model.employee.findOne({
          _id: { $nin: [mongoose.Types.ObjectId(req.params.id)] },
          email: req.body.email,
          isDeleted: false,
        });
        if (employe)
          return multilingualService.sendResponse(
            req,
            res,
            false,
            1,
            0,
            responseMessages.EMAILEXISTS,
            {}
          );
      }

      const password = req.body.firstName + req.body.phone;
      setobj.password = await Service.HashService.encrypt(password);
      if (req.finalFileName)
        setobj.profilePic = process.env.S3URL + req.finalFileName;
      req.body.password = Service.HashService.encrypt(password);
      let result = await model.employee.create(req.body);
      const payload = {
        email: req.body.email,
        password: password,
      };
      await Service.EmailService.sendUserPasswordMail(payload);
      return multilingualService.sendResponse(
        req,
        res,
        true,
        1,
        0,
        responseMessages.EMPLOYEE_ADDED_SUCCESSFULLY,
        result
      );
    } catch (error) {
      console.log(error.message);
    }
  }

  async updateEmployee(req, res) {
    // req.body = JSON.parse(req.body.data);
    const storeType = JSON.parse(req.body.storeTypeId);
    delete req.body.storeTypeId;
    const setobj = req.body;
    setobj.storeTypeId = storeType;
    setobj.role = "employee";
    try {
      const setobj = req.body;
      const adminData = await model.employee.findOne({
        _id: mongoose.Types.ObjectId(req.params.id),
      });
      if (!adminData)
        return multilingualService.sendResponse(
          req,
          res,
          false,
          1,
          0,
          responseMessages.USERNOTFOUND,
          {}
        );
      const password = req.body.firstName + req.body.phone;
      setobj.password = await Service.HashService.encrypt(password);
      if (req.finalFileName)
        setobj.profilePic = process.env.S3URL + req.finalFileName;

      if (
        adminData.phone != req.body.phone ||
        adminData.email != req.body.email ||
        adminData.firstName != req.body.firstName
      ) {
        const payload = {
          email: req.body.email,
          passwrod: password,
        };
        await Service.EmailService.sendUserPasswordMail(payload);
      }

      const addSubAdmin = await model.employee.findByIdAndUpdate(
        { _id: req.params.id },
        setobj,
        { new: true }
      );

      return multilingualService.sendResponse(
        req,
        res,
        true,
        1,
        0,
        "EMPLOYEE_UPDATED_SUCCESSFULLY",
        addSubAdmin
      );
    } catch (error) {
      console.log(error.message);
    }
  }

  async getEmployeeById(req, res) {
    let employeeId = req.params.id;
    try {
      const adminData = await model.employee
        .findOne({
          _id: mongoose.Types.ObjectId(employeeId), isDeleted : false
        })
        .populate("[storeTypeId]");
      if (!adminData)
        return multilingualService.sendResponse(
          req,
          res,
          false,
          1,
          0,
          responseMessages.USERNOTFOUND,
          {}
        );

      return multilingualService.sendResponse(
        req,
        res,
        true,
        1,
        0,
        "SUCCESS",
        adminData
      );
    } catch (error) {
      console.log(error.message);
    }
  }

  async deleteEmployeeById(req, res) {
    let employeeId = req.params.id;
    try {
      const adminData = await model.employee.findOne({
        _id: mongoose.Types.ObjectId(employeeId),
      });
      if (!adminData)
        return multilingualService.sendResponse(
          req, res, false, 1, 0,
          responseMessages.USERNOTFOUND,
          {}
        );

      const deleted = await model.employee.findOneAndUpdate({_id: mongoose.Types.ObjectId(employeeId)}, 
        {$set : {isDeleted : true}} , {new : true});

      if (deleted) {
        return multilingualService.sendResponse(
          req,
          res,
          true,
          1,
          0,
          "SUCCESS"
        );
      }
    } catch (error) {
      console.log(error.message);
    }
  }
}
export default employeeController;
