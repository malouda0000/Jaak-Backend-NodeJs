import dotenv from "dotenv";
dotenv.config();
import model from "../../../models/index";
import Constant from "../../../constant";
import moment from "moment";
import mongoose from "mongoose";
import multilingualService from "../../../services/multilingualService";
import generateReferralCode from "../../../services/randomService";


module.exports.addGift = async (req, res) => {
  const lang = req.headers.language || 'en';
  try {
    if (!req.body.name && !req.body.amount) {
      return res.send({
        message: "Please fill all required field",
      });
    }
    let giftCode = await generateReferralCode();
    req.body.giftCode = giftCode;
    const gift = await model.Gift.create(req.body);
    return res.send({
      message: multilingualService.getResponseMessage("ADDMSG", lang),
      data: gift,
      status: 200,
      sucess: true
    });
  } catch (error) {
    return res.send({
      message: multilingualService.getResponseMessage("FALSEMSG", lang),
      data: {},
      status: 501,
      sucess: false
    });
  }
}

module.exports.getAllGift = async (req,res) =>{
  const lang = req.headers.language || 'en';
  try{
    const limit = Number(req.query.limit) || Constant.ADMINLIMIT;
    const page = Math.max(1, Number(req.query.page) || 0);
    const skip = Math.max(0, page - 1) * limit;
    const sort = { createdAt: -1 };
    let criteria = {
      isDeleted : false
    }
    if(req.query.giftId != null){
      criteria._id = mongoose.Types.ObjectId(req.query.giftId)
      const Gift = await model.Gift.find(criteria._id).limit(limit).skip(skip).sort(sort)
       return res.send({
      message: multilingualService.getResponseMessage("TRUEMSG", lang),
      data: {Gift},
      status: 200,
      sucess: true
    });   
    }
    if(req.query.search != null){
      req.query.search = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      criteria.name = { $regex: req.query.search , $options: "i" }
    }
    const allGift = await model.Gift.find(criteria).limit(limit).skip(skip).sort(sort)
    const count = await model.Gift.countDocuments(criteria)
    return res.send({
      message: multilingualService.getResponseMessage("TRUEMSG", lang),
      data: {allGift,count},
      status: 200,
      sucess: true
    });
  }catch (error) {
    return res.send({
      message: multilingualService.getResponseMessage("FALSEMSG", lang),
      data: {},
      status: 501,
      sucess: false
    });
  }
}

module.exports.updateGift = async (req, res) => {
  const lang = req.headers.language || 'en';
  try {
    if (!req.params.id) {
      return res.send({
        message: multilingualService.getResponseMessage("REQUIRED", lang),
        data: {},
        status: 200,
        sucess: false
      });
    } 
    const gift = await model.Gift.findOneAndUpdate({_id:req.params.id},req.body,{new:true})
    return res.send({
      message: multilingualService.getResponseMessage("UPDATEMSG", lang),
      data: gift,
      status: 200,
      sucess: true
    });
  } catch (error) {
    return res.send({
      message: multilingualService.getResponseMessage("FALSEMSG", lang),
      data: {},
      status: 501,
      sucess: false
    });
  }
}
