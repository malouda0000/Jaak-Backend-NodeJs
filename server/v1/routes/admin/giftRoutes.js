import express from 'express'
const adminGiftController = require("../../controllers/admin/giftAdminController")

let router = express.Router()

router.post('/addGift',adminGiftController.addGift);
router.get('/getAllGift', adminGiftController.getAllGift);
router.put('/updateGift/:id', adminGiftController.updateGift);

export default router;