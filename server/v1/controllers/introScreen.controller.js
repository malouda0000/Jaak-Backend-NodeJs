import dotenv from "dotenv";
dotenv.config();
import model from "../../models/index";
import Constant from "../../constant";
const Service = require("../../services");
import moment from "moment";
import mongoose from "mongoose";
import { reject, constant } from "async";
import multilingualService from "../../services/multilingualService";
import { assignWith, result } from "lodash";
import generateReferralCode from "../../services/randomService";
const request = require("request");
import { responseMessages } from "../../v1/controllers/languages/english";
const { Types } = mongoose


class introScreenController {
    addIntroScreen(data, files, lang) {
        return new Promise(async(resolve,reject)=>{
            try {
                for (let item in files) data[item] = Constant.APPSETTINGIMAGE + files[item][0].filename;
                const result = await model.introScreen.create(data);
                resolve({
                    message: multilingualService.getResponseMessage("ADDMSG", lang),
                    data: result,
                });
            } catch (error) {
              console.log(error.message);
            }
        })
    }
    updateIntroScreen(data,files,lang){
        return new Promise(async(resolve,reject)=>{
            try{
                for (let item in files) data[item] = Constant.APPSETTINGIMAGE + files[item][0].filename;
                const result = await model.introScreen.findOneAndUpdate({_id:data._id},{$set:data});
                resolve({
                    message: multilingualService.getResponseMessage("ADDMSG", lang),
                    data: result,
                });
            }
            catch(error){
                console.log(error)
            }
        })
    }
}

export default introScreenController;
