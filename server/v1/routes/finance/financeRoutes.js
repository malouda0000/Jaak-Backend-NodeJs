import express from "express";
import Auth from "../../../auth";


var router = express.Router();
import uploads from "../../../services/FileUploadService";
import Controller from "../../controllers/finance/financeController";

router.get("/allUser", Controller.getAllUser);
router.post("/transferCoin", Auth.isUserAuth, Controller.makePayment);
router.get("/transactionHistory", Auth.isUserAuth, Controller.lastTransaction);
router.get("/recentTransaction", Auth.isUserAuth, Controller.recentTransaction);



export default router;
