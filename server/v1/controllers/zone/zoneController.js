import model from "../../../models/index";
import Constant from "../../../constant";
const Service = require("../../../services");
import multilingualService from "../../../services/multilingualService";
import { responseMessages } from "../languages/english";
const mongoose = require("mongoose");

const zoneController = {
  addZone : async (req, res, next) => {
      try {
        let zoneData = await model.zone.findOne({
          countryName: req.body.countryName,
          isDeleted: false,
        });
        if (zoneData)
        return multilingualService.sendResponse(
          req,
          res,
          false,
          1,
          0,
          responseMessages.ZONE_ALREADY_EXIST,
          {}
        )
        const zoneAdded = await model.zone({documentImage : "https://blockcart.s3.us-east-2.amazonaws.com/" + req.finalFileName,
          countryName: req.body.countryName
        }).save();
        return multilingualService.sendResponse(
          req,
          res,
          true,
          1,
          0,
          responseMessages.ZONE_ADDED_SUCCESSFULLY,
          zoneAdded
        );
      } catch (error) {
        next(error);
      }
  },
  editZone : async (req, res, next) => {
    try {
      let setObj = req.body;
      if(req.finalFileName)
      setObj.documentImage = "https://blockcart.s3.us-east-2.amazonaws.com/" + req.finalFileName
      if (req.body.countryName != undefined || req.body.countryName != null) {
        let zoneData = await model.zone.findOne({
          _id: { $nin: [mongoose.Types.ObjectId(req.body.zoneId)] },
          countryName: req.body.countryName,
          isDeleted: false,
        });
        if (zoneData) 
        return multilingualService.sendResponse(
          req,
          res,
          false,
          1,
          0,
          responseMessages.ZONE_ALREADY_EXIST,
          {}
        )
      }
      const editZone = await model.zone.findOneAndUpdate(
        {
          _id: mongoose.Types.ObjectId(req.body.zoneId),
        },
        { $set: setObj }
      );
      return multilingualService.sendResponse(
        req,
        res,
        true,
        1,
        0,
        responseMessages.ZONE_UPDATED_SUCCESSFULLY,
        editZone
      );
    } catch (error) {
      next(error);
    }
  },
  getAllZones : async(req,res,next) =>{
    try{
      const zone = await model.zone.find({}).lean()
      return multilingualService.sendResponse(
        req,
        res,
        true,
        1,
        0,
        responseMessages.TRUEMSG,
        zone
      );
    }
    catch(error)
    {
      next(error)
    }
  },
  addGeoFence : async (req, res, next) => {
    try {
      let geofenceData = await model.geoFence.findOne({
        geofenceName: req.body.geofenceName,
        isDeleted: false,
      });
      if (geofenceData)
      return multilingualService.sendResponse(
        req,
        res,
        false,
        1,
        0,
        responseMessages.GEOFENCE_NAME_ALREADY_EXISTS,
        {}
      );
      const geoLongLat = JSON.parse(req.body.geoLongLat)
      // for(let i=0;i<geoLongLat.length;i++)
      // {
      //   geoLongLat[i][0] = parseFloat(geoLongLat[i][0])
      //   geoLongLat[i][1] = parseFloat(geoLongLat[i][1])
      // }
      geofenceData = await model.geoFence.findOne({
        geoLongLat: {
          $geoIntersects: {
            $geometry: {
              type: "Polygon",
              coordinates: [geoLongLat],
            }
          }
        },
        isDeleted: false,
      });
  
      if (geofenceData) 
      return multilingualService.sendResponse(
        req,
        res,
        false,
        1,
        0,
        responseMessages.GEOFENCE_COORDINATES_EXISTS,
        {}
      );
      const polygonData = {
        type: "Polygon",
        coordinates: [geoLongLat],
      };
      const addedGeofence = await model.geoFence({
        zoneId : req.body.zoneId,
        geofenceName : req.body.geofenceName,
        geoLongLat : polygonData,
        documentImage : "https://blockcart.s3.us-east-2.amazonaws.com/" + req.finalFileName
      }).save();
      return multilingualService.sendResponse(
        req,
        res,
        true,
        1,
        0,
        responseMessages.GEOFENCE_ADDED_SUCCESSFULLY,
        addedGeofence
      );
    } catch (error) {
      next(error);
    }
  },
  editGeoFence : async (req, res, next) => {
    try {
      let setObj = req.body;
      if(req.finalFileName)
      setObj.documentImage = "https://blockcart.s3.us-east-2.amazonaws.com/" + req.finalFileName
      if (req.body.geofenceName != undefined || req.body.geofenceName != null) {
        let geofenceData = await model.geoFence.findOne({
          _id: { $nin: [mongoose.Types.ObjectId(req.body.geofenceId)] },
          zoneId: req.body.zoneId,
          geofenceName: req.body.geofenceName,
          isDeleted: false,
        });
        if (geofenceData)
        return multilingualService.sendResponse(
          req,
          res,
          false,
          1,
          0,
          responseMessages.GEOFENCE_NAME_ALREADY_EXISTS,
          {}
        )
        setObj.geofenceName = req.body.geofenceName;
      }
      
      req.body.geoLongLat = JSON.parse(req.body.geoLongLat)
      if (req.body.geoLongLat) {
        const polygonData = {
          type: "Polygon",
          coordinates: [req.body.geoLongLat],
        };
        setObj.geoLongLat = polygonData;
      }
      setObj.zoneId = req.body.zoneId;
      const editGeofence = await model.geoFence.findOneAndUpdate(
        {
          _id: mongoose.Types.ObjectId(req.body.geofenceId),
        },
        { $set: setObj }
      );
  
      return multilingualService.sendResponse(
        req,
        res,
        true,
        1,
        0,
        responseMessages.GEOFENCE_UPDATED_SUCCESSFULLY,
        editGeofence
      );
    } catch (error) {
      next(error);
    }
  },
  getAllGeoFenceByZoneId : async(req,res,next) =>{
    try{
      const zoneExist = await model.zone.findById({ _id : req.params.zoneId})
      if(!zoneExist)
      return multilingualService.sendResponse(
        req,
        res,
        false,
        1,
        0,
        responseMessages.ZONE_NOT_EXIST,
        {}
      )

      const geofence = await model.geoFence.find({zoneId : req.params.zoneId , isDeleted :  false }).lean()
      return multilingualService.sendResponse(
        req,
        res,
        true,
        1,
        0,
        responseMessages.TRUEMSG,
        geofence
      );
    }
    catch(error)
    {
      next(error)
    }
  },
  addSubAdmin : async(req,res,next) =>{
    try{
    const setobj = req.body
    if (req.body.phone != null ) {
      let subAdminData = await model.SubAdmin2.findOne({
        _id: { $nin: [mongoose.Types.ObjectId(req.params.id)] },
       phone : req.body.phone,
        isDeleted: false,
      });

      let subAdminData2 = await model.subAdmin.findOne({
        _id: { $nin: [mongoose.Types.ObjectId(req.params.id)] },
       phone : req.body.phone,
        isDeleted: false,
      });

      let sp = await model.SalesPerson.findOne({
        _id: { $nin: [mongoose.Types.ObjectId(req.params.id)] },
       phone : req.body.phone,
        isDeleted: false,
      });

      let admin = await model.admin.findOne({
        _id: { $nin: [mongoose.Types.ObjectId(req.params.id)] },
       phone : req.body.phone,
        isDeleted: false,
      });

      if (subAdminData || subAdminData2 || sp || admin ) 
      return multilingualService.sendResponse(
        req,
        res,
        false,
        1,
        0,
        responseMessages.PHONEEXISTS,
        {}
      ) 
    }

    if (req.body.email != null ) {
      let subAdminData = await model.subAdmin.findOne({
        _id: { $nin: [mongoose.Types.ObjectId(req.params.id)] },
       email : req.body.email,
        isDeleted: false,
      });

      let subAdminData2 = await model.SubAdmin2.findOne({
        _id: { $nin: [mongoose.Types.ObjectId(req.params.id)] },
        email : req.body.email,
        isDeleted: false,
      });

      let sp = await model.SalesPerson.findOne({
        _id: { $nin: [mongoose.Types.ObjectId(req.params.id)] },
        email : req.body.email,
        isDeleted: false,
      });

      let admin = await model.admin.findOne({
        _id: { $nin: [mongoose.Types.ObjectId(req.params.id)] },
        email : req.body.email,
        isDeleted: false,
      });

      if (subAdminData || subAdminData2 || sp || admin) 
      return multilingualService.sendResponse(
        req,
        res,
        false,
        1,
        0,
        responseMessages.EMAILEXISTS,
        {}
      ) 
    }
    
    const password = req.body.firstName + req.body.phone
    setobj.password =  await Service.HashService.encrypt(password);
    if(req.finalFileName)
    setobj.subAdminImage = "https://blockcart.s3.us-east-2.amazonaws.com/" + req.finalFileName
    const addSubAdmin = await model.subAdmin(setobj).save()
    const payload = {
      email : req.body.email,
      password : password
    }
    await Service.EmailService.sendUserPasswordMail(payload)
    return multilingualService.sendResponse(
      req,
      res,
      true,
      1,
      0,
      responseMessages.SUBADMIN_ADDED_SUCCESSFULLY,
      addSubAdmin
    );
  } catch (error) {
    next(error);
  }
  },
  getSubAdmin : async(req,res,next) =>{
    try{
      const subadmin = await model.subAdmin.find({}).lean()
      return multilingualService.sendResponse(
        req,
        res,
        true,
        1,
        0,
        responseMessages.TRUEMSG,
        subadmin
      );
    }
    catch(error)
    {
      next(error)
    }
  },
  editSubAdmin : async(req,res,next) =>{
    try{
    const setobj = req.body
    if (req.body.phone != null ) {
      let subAdminData = await model.SubAdmin2.findOne({
        _id: { $nin: [mongoose.Types.ObjectId(req.params.id)] },
       phone : req.body.phone,
        isDeleted: false,
      });

      let subAdminData2 = await model.subAdmin.findOne({
        _id: { $nin: [mongoose.Types.ObjectId(req.params.id)] },
       phone : req.body.phone,
        isDeleted: false,
      });

      let sp = await model.SalesPerson.findOne({
        _id: { $nin: [mongoose.Types.ObjectId(req.params.id)] },
       phone : req.body.phone,
        isDeleted: false,
      });

      let admin = await model.admin.findOne({
        _id: { $nin: [mongoose.Types.ObjectId(req.params.id)] },
       phone : req.body.phone,
        isDeleted: false,
      });

      if (subAdminData || subAdminData2 || sp || admin ) 
      return multilingualService.sendResponse(
        req,
        res,
        false,
        1,
        0,
        responseMessages.PHONEEXISTS,
        {}
      ) 
    }

    if (req.body.email != null ) {
      let subAdminData = await model.subAdmin.findOne({
        _id: { $nin: [mongoose.Types.ObjectId(req.params.id)] },
       email : req.body.email,
        isDeleted: false,
      });

      let subAdminData2 = await model.SubAdmin2.findOne({
        _id: { $nin: [mongoose.Types.ObjectId(req.params.id)] },
        email : req.body.email,
        isDeleted: false,
      });

      let sp = await model.SalesPerson.findOne({
        _id: { $nin: [mongoose.Types.ObjectId(req.params.id)] },
        email : req.body.email,
        isDeleted: false,
      });

      let admin = await model.admin.findOne({
        _id: { $nin: [mongoose.Types.ObjectId(req.params.id)] },
        email : req.body.email,
        isDeleted: false,
      });

      if (subAdminData || subAdminData2 || sp || admin) 
      return multilingualService.sendResponse(
        req,
        res,
        false,
        1,
        0,
        responseMessages.EMAILEXISTS,
        {}
      ) 
    }
    const password = req.body.firstName + req.body.phone
    setobj.password =  await Service.HashService.encrypt(password);
    if(req.finalFileName)
    setobj.subAdminImage = "https://blockcart.s3.us-east-2.amazonaws.com/" + req.finalFileName
    const adminData = await model.subAdmin.findOne({_id : req.params.id})
    if(adminData.phone != req.body.phone || adminData.email != req.body.email || adminData.firstName != req.body.firstName)
    {
      const payload = {
        email : req.body.email,
        passwrod : password
      }
      await Service.EmailService.sendUserPasswordMail(payload)
    }
   

    const addSubAdmin = await model.subAdmin.findByIdAndUpdate({_id : req.params.id },setobj, { new : true })
    
    return multilingualService.sendResponse(
      req,
      res,
      true,
      1,
      0,
      responseMessages.SUBADMIN_UPDATED_SUCCESSFULLY,
      addSubAdmin
    );
  } catch (error) {
    next(error);
  }
  },
  getSubAdminById : async(req,res,next) =>{
    try{
      const subadmin = await model.subAdmin.find({_id : req.params.id}).lean()
      return multilingualService.sendResponse(
        req,
        res,
        true,
        1,
        0,
        responseMessages.TRUEMSG,
        subadmin
      );
    }
    catch(error)
    {
      next(error)
    }
  },
  deleteSubAdmin : async(req,res,next) =>{
    try{
      const subadmin = await model.subAdmin.remove({ _id : req.params.id })
      return multilingualService.sendResponse(
        req,
        res,
        true,
        1,
        0,
        responseMessages.TRUEMSG,
        subadmin
      );
    }
    catch(error)
    {
      next(error)
    }
  }
}
export default zoneController;