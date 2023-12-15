import model from "../../../models/index";
import Constant from "../../../constant";
const Service = require("../../../services");
import multilingualService from "../../../services/multilingualService";
import { responseMessages } from "../languages/english";
const mongoose = require("mongoose");
import templateAccountDetail from "../../../template/email";
import MailService from "../../../services/EmailService";
import generateReferralCode from "../../../services/randomService";

const companyController = {
  addCompany: async (req, res, next) => {
    try {
      let check = {
        isDeleted : false
      };
      req.body.password = req.body.email + req.body.phone;
      let criteria = {}
      if(req.body.email){
        criteria.email = (req.body.email).toLowerCase()
      }
      if(req.body.phone){
        criteria.phone = req.body.phone
      }
      check = await model.company.findOne(criteria);
      if (check) {
        return res.send({
          message: check.email == (req.body.email).toLowerCase() ?
            multilingualService.getResponseMessage("EMAILEXISTS", req.headers.language) : multilingualService.getResponseMessage("PHONEEXISTS", req.headers.language),
          data: {},
          success: false
        })
      }
      const password = req.body.password;
      req.body.password = await Service.HashService.encrypt(req.body.password);
      let referalCode = await generateReferralCode();
      req.body.referralCode = referalCode;
      let companyData = await model.company(req.body).save();
      let msg = await templateAccountDetail.accountDetail({
        email: req.body.email,
        password: password,
        redirectUrl: process.env.SALESPERSONURL,
      });
      let subject = "Account Details";
      let mailer = await MailService.mailer({
        to: req.body.email,
        text: msg,
        subject: subject,
      });
      return res.send({
        sucess: true,
        data: companyData,
        message: multilingualService.getResponseMessage(
          "COMAPNY_ADDED_SUCESSFULLY",
          req.headers.language
        )
      })
    } catch (error) {
      next(error)
    }
  },
  updateCompany : async (req, res, next) => {
    let criteria = {
      _id: {
        $nin: [mongoose.Types.ObjectId(req.query.companyId)]
      },
      isDeleted : false
    }
    let or = [];
    if (req.body.email) {
      or.push({
        email: (req.body.email).toLowerCase()
      })
    }
    if (req.body.phone) {
      or.push({
        phone: req.body.phone
      })
    }
    if(or.length > 0){
      criteria.$or = or
    let check = await model.company.findOne(criteria);
    if (check) {
      return res.send({
        message: check.email ?
          multilingualService.getResponseMessage("EMAILEXISTS", req.headers.language) : multilingualService.getResponseMessage("PHONEEXISTS", req.headers.language),
        data: {},
        success: false
      })
    }
    }
    let companyData = await model.company.findOneAndUpdate({
      _id: mongoose.Types.ObjectId(req.query.companyId)
    }, {
      $set: req.body
    }, {
      new: true
    })
    let message = multilingualService.getResponseMessage("UPDATEMSG", req.headers.language);
    if(req.body.isBlocked){
      message = multilingualService.getResponseMessage("COMAPNYBLOCKED", req.headers.language);
    }
    if(req.body.isBlocked == false){
      message = multilingualService.getResponseMessage("COMAPNYUNBLOCKED", req.headers.language);
    }
    return res.send({
      sucess: true,
      data: companyData,
      message : message
    })
  },
  getCompany : async (req, res, next) => {
    try {
      let filter = {
        isDeleted : false
      };
      // if (req.body.moduleKey) filter.moduleKey = req.body.moduleKey;
      // if (req.headers.geofenceId != "NA") filter.geofenceId = geofenceId;
      const limit = Number(req.query.limit) || Constant.ADMINLIMIT;
      const page = Math.max(1, Number(req.query.page) || 0);
      const skip = Math.max(0, page - 1) * limit;
      const sort = {
        _id: -1
      };

      const query = {
        limit,
        page,
        skip,
        search: req.query.search
      };

      if (req.query.search) {
        const regex = {
          $regex: `${req.query.search}`,
          $options: "i"
        };
        filter.$or = [{
          companyName: regex
        }, {
          ownerName: regex
        }];
      }
      const count = await model.company.countDocuments(filter);
      const pageCount = Math.ceil(count / limit);
      const companyList = await model.company.find(filter).sort(sort).skip(skip).limit(limit).lean();

      const message =
        companyList.length <= 0 ?
        multilingualService.getResponseMessage("EMPTY_LIST", req.headers.language) :
        multilingualService.getResponseMessage(
          "FETCHED_SUCCESSFULLY",
          req.headers.language
        );
      return res.send({
        sucess: true,
        message: message,
        data: {
          query,
          companyList,
          count,
          pageCount
        }
      })
    } catch (error) {
      console.log(error);
      return res.send({
        sucess: false,
        message: multilingualService.getResponseMessage("FALSEMSG", lang),
        data: {}
      })
    }
  },
  getCompanyById : async (req, res, next) => {
    try {
      const company = await model.company.findOne({
        _id: mongoose.Types.ObjectId(req.query.id),
        isDeleted : false
      }).lean();
      if (company == null) {
        return res.send({
          sucess: false,
          message: multilingualService.getResponseMessage("FALSEMSG", lang),
          data: {}
        })
      }
      return res.send({
        sucess: true,
        message: multilingualService.getResponseMessage(
          "FETCHED_SUCCESSFULLY",
          req.headers.language
        ),
        data: company
      })
    } catch (error) {
      return res.send({
        sucess: false,
        message: multilingualService.getResponseMessage("FALSEMSG", lang),
        data: {}
      })
    }
  }
}
export default companyController;