import express from "express";
import Auth from "../../../auth";

var router = express.Router();
import Controller from "../../controllers/company/companyController";

router.post("/addCompany", Controller.addCompany);
router.put("/updateCompany", Controller.updateCompany);
router.get("/getCompany", Controller.getCompany)
router.get("/getCompanyById",Controller.getCompanyById)


module.exports = router;

