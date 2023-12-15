import express from "express";
import Auth from "../../../auth";


var router = express.Router();
import uploads from "../../../services/FileUploadService";
import Controller from "../../controllers/zone/zoneController";
//zone
router.post("/addZone",uploads.zoneImage.single('document'), Controller.addZone);
router.post("/updateZone",uploads.zoneImage.single('document'), Controller.editZone);
router.get("/getZones" , Controller.getAllZones)

//add geofence
router.post("/addGeofence",uploads.geofenceImage.single('document'), Controller.addGeoFence)
router.post("/updateGeofence",uploads.geofenceImage.single('document'), Controller.editGeoFence)
router.get("/geofence/:zoneId", Controller.getAllGeoFenceByZoneId)

//add subadmin
router.post("/addSubAdmin", uploads.subAdminImage.single('document'), Controller.addSubAdmin)
router.get("/subAdmin",  Controller.getSubAdmin)
router.get("/subAdmin/:id",  Controller.getSubAdminById)
router.post("/updateSubAdmin/:id", uploads.subAdminImage.single('document'), Controller.editSubAdmin)
router.delete("/subAdmin/:id",  Controller.deleteSubAdmin)

export default router;
