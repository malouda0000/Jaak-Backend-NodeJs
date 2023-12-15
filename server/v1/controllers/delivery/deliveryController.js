import model from "../../../models/index";
import Constant from "../../../constant";
const Service = require("../../../services");
import multilingualService from "../../../services/multilingualService";
import { responseMessages } from "../languages/english";
const mongoose = require("mongoose");

const helper = {

  // getMinMaxValue : (min,max) => {
  //   let value;

  //   return {
  //     get() {
  //       return value;
  //     },
  //     set(newValue) {
  //       value = (newValue < min) ? min : (newValue > max) ? max : newValue;  
  //     }
  //   };
  // },

  getMinMaxValue: (min, max, value) => {

    if (value > max) {
      value = max
    }
    if (value < min) {
      value = min
    }

    return value;

  },

  merchantCharges: async (deliveryData) => {
    try {
      const { priceBeforeDelivery, adminPrices, distance, timeInMins } = deliveryData;
      let fareRate = adminPrices.min_fare
      switch (true) {
        case (distance > 0) && (distance <= 5):
          fareRate += distance * adminPrices.zero_five
          break;
        case (distance > 5) && (distance <= 10):
          fareRate += distance * adminPrices.five_ten
          break;
        case (distance > 10) && (distance <= 20):
          fareRate += distance * adminPrices.ten_twenty
          break;
        case (distance > 20) && (distance <= 30):
          fareRate += distance * adminPrices.twenty_thirty
          break;
        case (distance > 30) && (distance <= 50):
          fareRate += distance * adminPrices.thirty_fifty
          break;
        case (distance > 50) && (distance <= 60):
          fareRate += distance * adminPrices.fifty_sixty
          break;
      }
      fareRate = fareRate + timeInMins * adminPrices.per_min_charges
      return helper.getMinMaxValue(adminPrices.min_fare, adminPrices.max_fare, fareRate)

    } catch (error) {
      console.log(error)
    }
  },

  driverEarning: async (deliveryData) => {
    try {
      const { priceBeforeDelivery, driverPayoutPrices, distance, timeInMins } = deliveryData;
      let fareRate = driverPayoutPrices.min_fare
      switch (true) {
        case (distance > 0) && (distance <= 5):
          fareRate += distance * driverPayoutPrices.zero_five
          break;
        case (distance > 5) && (distance <= 10):
          fareRate += distance * driverPayoutPrices.five_ten
          break;
        case (distance > 10) && (distance <= 20):
          fareRate += distance * driverPayoutPrices.ten_twenty
          break;
        case (distance > 20) && (distance <= 30):
          fareRate += distance * driverPayoutPrices.twenty_thirty
          break;
        case (distance > 30) && (distance <= 50):
          fareRate += distance * driverPayoutPrices.thirty_fifty
          break;
        case (distance > 50) && (distance <= 60):
          fareRate += distance * driverPayoutPrices.fifty_sixty
          break;
      }
      fareRate = fareRate + timeInMins * driverPayoutPrices.per_min_charges
      return helper.getMinMaxValue(driverPayoutPrices.min_fare, driverPayoutPrices.max_fare, fareRate)
    } catch (error) {
      console.log(error)
    }
  },
}

const deliveryController = {
  deliveryDetails: async (req, res, next) => {
    try {
      if (req.body.lat && req.body.lng) {
        req.body.location = {
          type: "Point",
          coordinates: [req.body.lng, req.body.lat],
        };
      }
      let deliveryAddress = await model.DeliveryAddress.create(req.body);
      multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.DELIVERY_ADDRESS_ADDED_SUCCESSFULLY, deliveryAddress)
    } catch (error) {
      console.log(error.message);
    }
  },

  packageDetails: async (req, res, next) => {
    try {
      req.body.userId = req.user._id;

      let result = await model.Packages(req.body).save();
      if (result) {
       return multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.PACKAGE_ADDED_SUCCESSFULLY, result)
      }
    } catch (error) {
      console.log(error.message);
      next(error)
    }
  },

  morePackage: async (req, res, next) => {
    try {
      let { quantity, description, packageType } = req.body;
      let items = await model.DeliveryItems.create({ quantity, description, packageType });
      let booking = await model.DeliveryBooking.findOneAndUpdate({ bookingNo: req.body.bookingNo, userId: req.user._id }, { "$push": { items: items._id } }, { new: true }).populate("items").lean();
      console.log(booking, '--------- Booking');
      multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.MORE_PACKAGE_ADDED_SUCCESSFULLY, booking)
    } catch (error) {
      console.log(error.message);
    }
  },

  setAdminDeliveryCharges: async (req, res, next) => {
    try {

      const qry = { adminId: req.query.selfId };

      const criteria = {
        $set:
        {
          deliveryPrices: req.body.deliveryPrices,
          driverPayout: req.body.driverPayout
        }
      };

      const options = { new: true }

      model.AdminSetting.findOneAndUpdate(qry, criteria, options)
        .then(async (data) => {
          return res.status(200).json({
            message: "done",
            data: data
          })
        })
        .catch(async (error) => {
          return res.status(400).json({
            message: "error",
            error: error
          })
        });

    } catch (e) {
      console.log(e);
    }
  },

  deliveryCharges: async (req, res, next) => {
    try {
      const adminObj = await model.AdminSetting.findOne({ adminId: req.query.selfId }, { deliveryPrices: 1, driverPayout: 1 })
      const adminPrices = adminObj.deliveryPrices
      const deliveryObj = {};
      deliveryObj['priceBeforeDelivery'] = req.body.priceBeforeDelivery || 100;
      deliveryObj['adminPrices'] = adminPrices;
      deliveryObj['distance'] = parseFloat(req.query.distance) || 15;
      deliveryObj['timeInMins'] = parseInt(req.query.time) || 10;
      const merchantCharges = await helper.merchantCharges(deliveryObj);
      return res.json({
        sucess: true,
        distanceInKm: deliveryObj.distance,
        priceWithoutDelivery: req.body.priceBeforeDelivery,
        merchantPrice: merchantCharges
      })
    } catch (error) {
      console.log(error)
    }
  },

  getPackageDetails: async (req, res, next) => {
    try {
      let packageType = ["small", "medium", "large"]
      let packageItem = ["table", "chair", "almirah"]
      let itemDimension = ["quantity", "weight(kg)", "length(cm)", "width(cm)", "height(cm)"]
      let sendData = {
        packageType,
        packageItem,
        itemDimension
      }
      return res.json({
        sucess: true,
        data: sendData
      })
    }
    catch (err) {
      next(err)
    }
  },

  addPackageTypes: async (req, res, next) => {
    try {
      let packageType = await model.PackageTypes.create(req.body);
      if (packageType) {
        return multilingualService.sendResponse(req, res, true, 1, 0, responseMessages.PACKAGE_TYPE_ADDED_SUCCESSFULLY, packageType);
      }

      return multilingualService.sendResponse(req, res, false, 1, 0, responseMessages.ERRMSG, packageType);
    }
    catch (err) {
      next(err)
    }
  }
}
export default deliveryController;
