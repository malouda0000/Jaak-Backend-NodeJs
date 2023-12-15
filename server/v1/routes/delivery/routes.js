import express from "express";
import Auth from "../../../auth";


var router = express.Router();
import Controller from "../../controllers/delivery/deliveryController";

router.post("/deliveryDetails", Auth.isUserAuth, Controller.deliveryDetails);
router.post("/packageDetails", Auth.isUserAuth, Controller.packageDetails);
router.post("/morePackage", Auth.isUserAuth, Controller.morePackage)

router.post("/setDeliveryCharges",Controller.setAdminDeliveryCharges)
router.get("/getDeliveryCharges",Controller.deliveryCharges)
router.post("/PackageTypes",Controller.addPackageTypes);


router.get("/packageDetails",Auth.isUserAuth, Controller.getPackageDetails)

export default router;
