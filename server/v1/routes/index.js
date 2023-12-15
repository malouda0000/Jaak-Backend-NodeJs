import express from "express";
import user from "./userRoutes";
import driver from "./driver";
import admin from "./admin";
import restaurant from "./restaurant";
import store from "./store";
import web from "./website";
import payment from "./payment";
import finance from "./finance/financeRoutes";
import delivery from "./delivery/routes"
import zone from "./zone";
import ecommerce from "./ecommerce"
const uploadRoutes = require('./upload/upload')
const companyRoutes = require('./company/routes')
const {upload} = require('../../services/uploads3.service')

const route = express.Router();

route.use("/user", user);
route.use("/driver", driver);
route.use("/payment", payment);

route.use("/admin", admin);
route.use("/restaurant", restaurant);
route.use("/store", store);
route.use("/web", web);
route.use("/finance", finance);
route.use("/delivery", delivery);
route.use("/zone", zone);
route.use("/upload", uploadRoutes);
route.use("/company", companyRoutes);
route.use("/ecommerce", ecommerce)
route.post('/upload-file',
    
    upload.fields([
        { name:'file',maxCount:5}
    ]),

    async(req,res) => {

        let list = [];

        try{

            req.files['file'].forEach(obj=>{
                list.push(obj.location)
            })

            return res.json({data:list})

        }
        catch(error){
            console.log(error);
            return res.status(400).json({status:400,message:"error occured ",error:error})
        }
    }
)

export default route;
