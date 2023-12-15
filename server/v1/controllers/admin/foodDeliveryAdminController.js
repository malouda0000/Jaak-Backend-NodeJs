import model from "../../../models/index";
import Constant from "../../../constant";
const Service = require("../../../services");
import moment from "moment";
import mongoose, { mongo } from "mongoose";

class foodDelivery {
  addCategory(data, file, lang) {
    return new Promise((done, reject) => {
      let category = new model.foodCategory({
        name: data.name,
        name_ar: data.name_ar,
        date: moment().valueOf(),
        image: Constant.FOODCATIMAGE + file.filename,
      });

      category
        .save()
        .then((result) => {
          done({ message: Constant.ADDMSG, data: result });
        })
        .catch((err) => {
          if (err.errors)
            return reject({ message: Service.Handler.mongoErrorHandler(err) });

          return reject({ message: Constant.FALSEMSG });
        });
    });
  }

  editCategory(data, file, lang) {
    return new Promise((done, reject) => {
      let update = {
        name: data.name,
        name_ar: data.name_ar,
      };
      if (file) update.image = Constant.FOODCATIMAGE + file.filename;

      if (Number(data.status) || Number(data.status) === 0)
        update.status = data.status;

      model.foodCategory
        .findOne({
          name: new RegExp("^" + data.name + "$", "i"),
          _id: { $ne: data.updateId },
          status: { $ne: 2 },
        })
        .then((category) => {
          if (category) return reject({ message: Constant.FOODCATEXISTS });

          model.foodCategory
            .findByIdAndUpdate(data.updateId, update, { new: true })
            .then((result) => {
              done({
                message:
                  Number(data.status) == 2
                    ? Constant.DELETEMSG
                    : Constant.UPDATEMSG,
                data: result,
              });
            });
        });
    });
  }

  getCategory(lang) {
    return new Promise((done, reject) => {
      model.foodCategory.find({ status: { $ne: 2 } }).then((result) => {
        done({ data: result });
      });
    });
  }

  addRestaurant(data, file, lang) {
    return new Promise((done, reject) => {
      let restaurant = this.createRestaurant(data, file);
      restaurant
        .save()
        .then((result) => {
          data.outlet.restaurantId = result._id;
          data.outlet.date = moment().valueOf();
          data.outlet.location = [
            parseFloat(data.outlet.longitude),
            parseFloat(data.outlet.latitude),
          ];

          let outlet = new model.restaurantOutlet(data.outlet);
          outlet.save();
          done({ message: Constant.ADDMSG, data: result });
        })
        .catch(async (err) => {
          if (err.errors) {
            let erer = await Service.Handler.mongoErrorHandler(err);
            return reject({ message: erer });
          } else return reject({ message: Constant.FALSEMSG });
        });
    });
  }

  createRestaurant(data, file) {
    let restaurant = new model.restaurant(data);
    restaurant.date = moment().valueOf();
    if (file) restaurant.image = Constant.RESTAURANTIMAGE + file.filename;
    if (data.password)
      restaurant.hash = Service.HashService.encrypt(data.password);
    return restaurant;
  }

  editRestaurant(data, file, lang) {
    return new Promise((done, reject) => {
      if (file) data.image = Constant.RESTAURANTIMAGE + file.filename;

      model.restaurant
        .findOne({
          name: new RegExp("^" + data.name + "$", "i"),
          _id: { $ne: data.updateId },
          status: { $ne: 2 },
        })
        .then((restaurant) => {
          if (restaurant) return reject({ message: Constant.RESTAURANTEXISTS });

          model.restaurant
            .findByIdAndUpdate(data.updateId, data, { new: true })
            .then((result) => {
              done({
                message:
                  data.status && data.status == 2
                    ? Constant.DELETEMSG
                    : Constant.UPDATEMSG,
                data: result,
              });
            });
        });
    });
  }

  getRestaurants(data, lang) {
    return new Promise((done, reject) => {
      let skip =
        Number(data.page) && Number(data.page) > 1
          ? (Number(data.page) - 1) * Constant.ADMINLIMIT
          : 0;
      let Arr = [{ status: { $ne: 2 } }];

      if (data.name && data.name != "") {
        Arr.push({
          $or: [
            { name: new RegExp(data.name, "i") },
            { name_ar: new RegExp(data.name_ar, "i") },
            { description: new RegExp(data.name, "i") },
          ],
        });
      }
      if (data.type && data.type != 2) {
        Arr.push({ foodType: Number(data.type) });
      }

      let qry = Arr.length == 1 ? Arr[0] : { $and: Arr };

      model.restaurant
        .find(qry)
        .populate("categories", "name name_ar")
        .select("+status")
        .skip(skip)
        .limit(Constant.ADMINLIMIT)
        .then((result) => {
          model.restaurant.countDocuments(qry).then((count) => {
            done({ data: { list: result, count: count } });
          });
        });
    });
  }

  getRestaurantById(id, lang) {
    return new Promise((done, reject) => {
      model.restaurant
        .findById(id)
        .populate("categories", "name name_ar")
        .select("+status")
        .then((result) => {
          model.restaurantOrder
            .countDocuments({ restaurantId: id })
            .then((order) => {
              model.restaurantOutlet
                .countDocuments({ restaurantId: id, status: { $ne: 2 } })
                .then((outlets) => {
                  model.foodItem
                    .countDocuments({ restaurantId: id, status: { $ne: 2 } })
                    .then((items) => {
                      model.foodType
                        .countDocuments({
                          restaurantId: id,
                          status: { $ne: 2 },
                        })
                        .then((types) => {
                          done({
                            data: {
                              detail: result,
                              orders: order,
                              outlets: outlets,
                              items: items,
                              types: types,
                            },
                          });
                        });
                    });
                });
            });
        });
    });
  }

  addRestaurantOutlet(data, lang) {
    return new Promise((done, reject) => {
      data.date = moment().valueOf();
      data.location = [parseFloat(data.longitude), parseFloat(data.latitude)];
      let outlet = new model.restaurantOutlet(data);

      outlet
        .save()
        .then((result) => {
          done({ message: Constant.ADDMSG, data: result });
        })
        .catch((err) => {
          if (err.errors)
            return reject({ message: Service.Handler.mongoErrorHandler(err) });

          return reject({ message: Constant.FALSEMSG });
        });
    });
  }

  editRestaurantOutlet(data, lang) {
    return new Promise((done, reject) => {
      data.location = [parseFloat(data.longitude), parseFloat(data.latitude)];
      model.restaurantOutlet
        .findByIdAndUpdate(data.updateId, data, { new: true })
        .then((result) => {
          done({
            message:
              data.status && data.status == 2
                ? Constant.DELETEMSG
                : Constant.UPDATEMSG,
            data: result,
          });
        })
        .catch((err) => {
          return reject({ message: Constant.FALSEMSG });
        });
    });
  }

  getRestaurantOutlet(id, lang) {
    return new Promise((done, reject) => {
      model.restaurantOutlet
        .find({ restaurantId: id, status: { $ne: 2 } })
        .then((result) => {
          done({ data: result });
        });
    });
  }

  addFoodType(data, lang) {
    return new Promise((done, reject) => {
      data.date = moment().valueOf();

      let type = new model.foodType(data);

      type
        .save()
        .then((result) => {
          done({ message: Constant.ADDMSG, data: result });
        })
        .catch((err) => {
          if (err.errors)
            return reject({ message: Service.Handler.mongoErrorHandler(err) });

          return reject({ message: Constant.FALSEMSG });
        });
    });
  }

  editFoodType(data, lang) {
    return new Promise((done, reject) => {
      let qry = {
        name: new RegExp("^" + data.name + "$", "i"),
        _id: { $ne: data.updateId },
        status: { $ne: 2 },
        restaurantId: data.restaurantId,
      };

      model.foodType.findOne(qry).then((type) => {
        if (type) return reject({ message: Constant.FOODCATEXISTS });

        model.foodType
          .findByIdAndUpdate(data.updateId, data, { new: true })
          .then((result) => {
            done({
              message:
                data.status && data.status == 2
                  ? Constant.DELETEMSG
                  : Constant.UPDATEMSG,
              data: result,
            });
          })
          .catch((err) => {
            return reject({ message: Constant.FALSEMSG });
          });
      });
    });
  }

  getAllFoodType(id, lang) {
    return new Promise((done, reject) => {
      model.foodType
        .find({ restaurantId: id, status: { $ne: 2 } })
        .then((result) => {
          done({ data: result });
        });
    });
  }

  getFoodTypeById(id, lang) {
    return new Promise((done, reject) => {
      model.foodType.findById(id).then((result) => {
        done({ data: result });
      });
    });
  }

  addFoodItem(data, file, lang) {
    return new Promise((done, reject) => {
      let foodItem = this.createFoodItem(data, file);

      foodItem
        .save()
        .then((result) => {
          done({ message: Constant.ADDMSG, data: result });
        })
        .catch(async (err) => {
          if (err.errors) {
            let erer = await Service.Handler.mongoErrorHandler(err);
            return reject({ message: erer });
          } else return reject({ message: Constant.FALSEMSG });
        });
    });
  }

  createFoodItem(data, file) {
    let foodItem = new model.foodItem(data);
    foodItem.date = moment().valueOf();
    if (file) foodItem.image = Constant.FOODITEMIMAGE + file.filename;
    return foodItem;
  }

  editFoodItem(data, file, lang) {
    return new Promise((done, reject) => {
      if (file) data.image = Constant.FOODITEMIMAGE + file.filename;

      model.foodItem
        .findOne({
          name: new RegExp("^" + data.name + "$", "i"),
          _id: { $ne: data.updateId },
          status: { $ne: 2 },
          restaurantId: data.restaurantId,
        })
        .then((foodItem) => {
          if (foodItem) return reject({ message: Constant.FOODITEMEXISTS });

          model.foodItem
            .findByIdAndUpdate(data.updateId, data, { new: true })
            .then((result) => {
              done({
                message:
                  data.status && data.status == 2
                    ? Constant.DELETEMSG
                    : Constant.UPDATEMSG,
                data: result,
              });
            });
        });
    });
  }

  getAllFoodItems(id, lang) {
    return new Promise((done, reject) => {
      model.foodItem
        .aggregate([
          {
            $match: {
              restaurantId: mongoose.Types.ObjectId(id),
              status: { $ne: 2 },
            },
          },
          {
            $lookup: {
              from: "addons",
              localField: "addOn",
              foreignField: "_id",
              as: "addOn",
            },
          },
        ])
        .then((result) => {
          done({ data: result });
        });
    });
  }

  getFoodItemById(id, lang) {
    return new Promise((done, reject) => {
      model.foodItem
        .aggregate([
          { $match: { _id: mongoose.Types.ObjectId(id) } },
          {
            $lookup: {
              from: "addons",
              localField: "addOn",
              foreignField: "_id",
              as: "addOn",
            },
          },
        ])
        .then((result) => {
          done({ data: result });
        });
    });
  }

  addSetting(data, lang) {
    return new Promise((done, reject) => {
      let setting = new model.restaurantSetting(data);

      setting
        .save()
        .then((result) => {
          done({ message: Constant.ADDMSG, data: result });
        })
        .catch((err) => {
          return reject({ message: Constant.FALSEMSG });
        });
    });
  }

  editSetting(data, lang) {
    return new Promise((done, reject) => {
      model.restaurantSetting
        .findByIdAndUpdate(data.updateId, data, { new: true })
        .then((result) => {
          done({ message: Constant.UPDATEMSG, data: result });
        })
        .catch((err) => {
          return reject({ message: Constant.FALSEMSG });
        });
    });
  }

  getSetting(lang) {
    return new Promise((done, reject) => {
      model.restaurantSetting
        .findOne({})
        .then((result) => {
          done({ data: result });
        })
        .catch((err) => {
          return reject({ message: Constant.FALSEMSG });
        });
    });
  }

  orderChangeStatus(data, lang) {
    return new Promise((done, reject) => {
      model.restaurantOrder
        .findByIdAndUpdate(data._id, { status: data.status }, { new: true })
        .then((result) => {
          done({ message: Constant.UPDATEMSG, data: result });
        })
        .catch((err) => {
          return reject({ message: Constant.FALSEMSG });
        });
    });
  }

  getAllOrders(data, lang) {
    return new Promise((done, reject) => {
      let skip =
        Number(data.page) && Number(data.page) > 1
          ? (Number(data.page) - 1) * Constant.ADMINLIMIT
          : 0;
      let Arr = [];

      if (data.status == 0) Arr = [{ status: 0 }];
      else if (data.status == 1) Arr = [{ status: { $in: [1, 2, 3] } }];
      else if (data.status == 11) Arr = [{ status: { $in: [11, 12] } }];
      else if (data.status == 4) Arr = [{ status: { $in: [4, 6] } }];

      if (data.restaurantId)
        Arr.push({ restaurantId: mongoose.Types.ObjectId(data.restaurantId) });

      let qry = !Arr.length
        ? { status: { $lte: 12 } }
        : Arr.length == 1
        ? Arr[0]
        : { $and: Arr };

      model.restaurantOrder
        .aggregate([
          { $match: qry },
          {
            $lookup: {
              from: "restaurants",
              localField: "restaurantId",
              foreignField: "_id",
              as: "restaurantId",
            },
          },
          {
            $lookup: {
              from: "restaurantoutlets",
              localField: "outletId",
              foreignField: "_id",
              as: "outlet",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $lookup: {
              from: "drivers",
              localField: "driverId",
              foreignField: "_id",
              as: "driver",
            },
          },
          { $unwind: "$user" },
          { $unwind: "$restaurantId" },
          { $sort: { _id: -1 } },
          // { $unwind: '$driver' }
          { $skip: skip },
          { $limit: Constant.ADMINLIMIT },
        ])
        .then((result) => {
          model.restaurantOrder.aggregate([{ $match: qry }]).then((count) => {
            done({ data: { list: result, count: count.length } });
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  getOrderById(id, lang) {
    return new Promise((done, reject) => {
      model.restaurantOrder
        .findById(id)
        .populate("restaurantId", "name image name_ar")
        .populate("outletId", "address latitude longitude")
        .populate("userId", "firstName lastName profilePic countryCode phone")
        .populate("driverId", "firstName lastName profilePic countryCode phone")
        .populate("items.itemId", "name image")
        .then((result) => {
          done({ data: result });
        });
    });
  }

  getRestaurantRevenue(data) {
    return new Promise((done, reject) => {
      model.restaurantOrder
        .aggregate([
          {
            $match: {
              restaurantId: mongoose.Types.ObjectId(data.restaurantId),
              status: { $gte: 1, $lte: 6 },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%d/%m/%Y",
                  date: { $add: [new Date(0), "$date"] },
                },
              },
              amount: { $sum: "$totalAmount" },
              date: { $first: "$date" },
            },
          },
          { $sort: { date: -1 } },
        ])
        .then((result) => {
          let Arr = [];
          result.map((val) => {
            Arr.push([val._id, val.amount]);
          });
          done({ data: Arr });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}

export default foodDelivery;
