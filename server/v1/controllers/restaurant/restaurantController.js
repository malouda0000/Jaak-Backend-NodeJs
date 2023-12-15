import model from "../../../models/index";
import Constant from "../../../constant";
const Service = require("../../../services");
import moment from "moment";
import mongoose from "mongoose";
import { concatSeries, compose } from "async";

class restaurantController {
  // forgotPassword(data, lang) {
  //   return new Promise(async (done, reject) => {
  //     const email = data.email || null;
  //     if (!email) {
  //       return reject({ message: multilingualService.getResponseMessage('PARAMETERMISSING', lang) })
  //     }
  //     let restaurant = await model.restaurant.findOne({
  //       email: data.email
  //     });
  //     if (!restaurant) {
  //       return reject({ message: multilingualService.getResponseMessage('USERNOTFOUND', lang) })
  //     }
  //     let resetToken = "resetToken" + (new Date()).getTime();
  //     let payload = {
  //       email: data.email,
  //       token: resetToken
  //     }
  //     data.resetToken = resetToken;
  //     data.resetToken = new Date();
  //     await model.restaurant.findOneAndUpdate({
  //       email: data.email
  //     }, { $set: data });
  //     Service.EmailService.sendRestaurantForgotPasswordMail(payload);
  //     done({ message: multilingualService.getResponseMessage('FORGOTPASSWORDSENDSUCCESSFULLY', lang), data: {} })
  //   })
  // }

  async getBannersAddvertisement(data, userId) {
    try {
      let pipeline = [
        {
          $match: {
            status: 1,
            type: Constant.BANNER_TYPE.ADVERTISEMENT,
            verticalType: Constant.VERTICALTYPE.STORE,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
          },
        },
        { $sort: { _id: -1 } },
      ];
      let bannerData = await model.Banner.aggregate(pipeline);
      return bannerData || [];
    } catch (error) {
      console.log(error);
    }
  }
  async homeData(data, userId, lang) {
    return new Promise(async (done, reject) => {
      data.userId = userId;
      let categories = await this.getCategories(data, 0, 5);
      let saved = await this.getSavedRestaurants(
        data,
        0,
        5,
        { status: 1 },
        { _id: 1 }
      );
      let bestOffers = await this.getBestOffers(
        data,
        0,
        5,
        { $and: [{ status: 1 }, { discount: { $gt: 0 } }] },
        { discount: -1 }
      );

      let recommended = await this.getRecommendedRestaurants(
        data,
        0,
        5,
        { $and: [{ status: 1 }, { isRecommended: 1 }] },
        { _id: 1 }
      );

      let notiCount = await this.notiUnreadCount(userId);
      done({
        data: {
          categories: categories,
          saved: saved,
          bestOffers: bestOffers,
          recommended: recommended,
          notiCount: notiCount,
        },
      });
    });
  }

  notiUnreadCount(userId) {
    return model.notification.countDocuments({
      userId: userId,
      status: 0,
      verticalType: 0,
    });
  }

  getCategories(data, skip, limit) {
    return model.foodCategory.aggregate([
      { $match: { status: 1 } },
      { $lookup: this.restaurantLookup(data) },
      { $project: catProject1 },
      { $match: { "restaurants.count": { $gte: 1 } } },
      { $skip: skip },
      { $limit: limit },
      { $project: catProject2 },
    ]);
  }

  async getSavedRestaurants(data, skip, limit, arr, sort) {
    let fav = await model.favRestaurant.find({ userId: data.userId });
    if (!fav.length) return [];

    let Arr = [];
    fav.map((val) => {
      Arr.push(mongoose.Types.ObjectId(val.restaurantId));
    });

    let matchLast = { status: 1 };
    if (data.filter && data.filter.rating) {
      matchLast = { ratings: { $gte: Number(data.filter.rating) } };
    }

    return await model.restaurant
      .aggregate([
        { $match: arr },
        { $match: { _id: { $in: Arr } } },
        { $lookup: catLookup },
        { $lookup: ratingLookup },
        { $lookup: await this.favLookup(data.userId) },
        { $lookup: await this.outletLookup(data) },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
        { $project: project },
        { $match: matchLast },
      ])
      .exec();
  }

  async getBestOffers(data, skip, limit, qry, sort) {
    let matchLast = { status: 1, isVisible: true };
    if (data.filter && data.filter.rating) {
      matchLast = { ratings: { $gte: Number(data.filter.rating) } };
    }

    return model.restaurant
      .aggregate([
        { $match: qry },
        { $lookup: await this.outletLookup(data) },
        { $project: preProject },
        { $match: { outlet_Size: { $gte: 1 } } },
        { $lookup: catLookup },
        { $lookup: ratingLookup },
        { $lookup: await this.favLookup(data.userId) },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
        { $project: project },
        { $match: matchLast },
      ])
      .exec();
  }

  async getBestOffersCount(data, qry) {
    let matchLast = { status: 1 };
    if (data.filter && data.filter.rating) {
      matchLast = { ratings: { $gte: Number(data.filter.rating) } };
    }
    return model.restaurant
      .aggregate([
        { $match: qry },
        { $lookup: await this.outletLookup(data) },
        { $project: preProject },
        { $match: { outlet_Size: { $gte: 1 } } },
        { $lookup: ratingLookup },
        { $project: project },
        { $match: matchLast },
      ])
      .exec();
  }

  async getRecommendedRestaurants(data, skip, limit, qry, sort) {
    let matchLast = { status: 1 };
    if (data.filter && data.filter.rating) {
      matchLast = { ratings: { $gte: Number(data.filter.rating) } };
    }

    return model.restaurant
      .aggregate([
        { $match: qry },
        { $lookup: await this.outletLookup(data) },
        { $project: preProject },
        { $match: { outlet_Size: { $gte: 1 } } },
        { $lookup: catLookup },
        { $lookup: ratingLookup },
        { $lookup: await this.favLookup(data.userId) },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
        { $project: project },
        { $match: matchLast },
      ])
      .exec();
  }

  async getRecommendedRestaurantCount(data, qry) {
    let matchLast = { status: 1 };
    if (data.filter && data.filter.rating) {
      matchLast = { ratings: { $gte: Number(data.filter.rating) } };
    }
    return model.restaurant
      .aggregate([
        { $match: qry },
        { $lookup: await this.outletLookup(data) },
        { $project: preProject },
        { $match: { outlet_Size: { $gte: 1 } } },
        { $lookup: ratingLookup },
        { $project: project },
        { $match: matchLast },
      ])
      .exec();
  }

  async getCategoryRestaurants(data, skip, limit, qry, sort) {
    let matchLast = { status: 1 };
    if (data.filter && data.filter.rating) {
      matchLast = { ratings: { $gte: Number(data.filter.rating) } };
    }

    return model.restaurant
      .aggregate([
        { $match: qry },
        { $lookup: await this.outletLookup(data) },
        { $project: preProject },
        { $match: { outlet_Size: { $gte: 1 } } },
        { $lookup: catLookup },
        { $lookup: ratingLookup },
        { $lookup: await this.favLookup(data.userId) },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
        { $project: project },
        { $match: matchLast },
      ])
      .exec();
  }

  async getCategoryRestaurantsCount(data, qry) {
    let matchLast = { status: 1 };
    if (data.filter && data.filter.rating) {
      matchLast = { ratings: { $gte: Number(data.filter.rating) } };
    }
    return model.restaurant
      .aggregate([
        { $match: qry },
        { $lookup: await this.outletLookup(data) },
        { $project: preProject },
        { $match: { outlet_Size: { $gte: 1 } } },
        { $lookup: ratingLookup },
        { $project: project },
        { $match: matchLast },
      ])
      .exec();
  }

  async allCategories(data, userId, lang) {
    return new Promise(async (done, reject) => {
      data.userId = userId;
      let skip =
        Number(data.page) > 1 ? (Number(data.page) - 1) * Constant.LIMIT : 0;

      let categories = await this.getCategories(data, skip, Constant.LIMIT);
      let count = await model.foodCategory.countDocuments({ status: 1 });
      done({
        data: {
          categories: categories,
          totalPages: Math.ceil(count / Constant.LIMIT),
        },
      });
    });
  }

  allRestaurantsByCategory(data, userId, lang) {
    return new Promise(async (done, reject) => {
      data.userId = userId;
      let skip =
        Number(data.page) > 1 ? (Number(data.page) - 1) * Constant.LIMIT : 0;
      if (data.isGeofenceActive && data.isGeofenceActive == true && data.isGeofenceActive == "true") {
        const geofenceData = await this.findGeofenceId(data.longitude, data.latitude)
        if (geofenceData)
          data.geofenceId = geofenceData._id
        else
          data.geofenceId = null
      }
      let andQry = [
        { status: 1 },
        { categories: mongoose.Types.ObjectId(data.categoryId) },
      ];

      let qry = {
        $and: andQry,
      };
      if (data.isGeofenceActive)
        qry.$and.push({ geofenceId: mongoose.Types.ObjectId(data.geofenceId) })
      let sort = { _id: 1 };

      if (data.filter) {
        let resp = this.filterSort(andQry, sort, data.filter);
        qry = resp.qry;
        sort = resp.sort;
      }

      let rest = await this.getCategoryRestaurants(
        data,
        skip,
        Constant.LIMIT,
        qry,
        sort
      );
      let count = await this.getCategoryRestaurantsCount(data, qry);

      done({
        data: {
          categoryRestaurants: rest,
          totalPages: count.length
            ? Math.ceil(count.length / Constant.LIMIT)
            : 1,
        },
      });
    });
  }

  async allSaved(data, userId, lang) {
    return new Promise(async (done, reject) => {
      data.userId = userId;

      let skip =
        Number(data.page) > 1 ? (Number(data.page) - 1) * Constant.LIMIT : 0;

      let andQry = [{ status: 1 }];

      let qry = {
        $and: andQry,
      };
      let sort = { _id: 1 };

      if (data.filter) {
        let resp = this.filterSort(andQry, sort, data.filter);
        qry = resp.qry;
        sort = resp.sort;
      }

      let saved = await this.getSavedRestaurants(
        data,
        skip,
        Constant.LIMIT,
        qry,
        sort
      );
      let count = await model.favRestaurant.countDocuments({
        userId: data.userId,
      });

      done({
        data: { saved: saved, totalPages: Math.ceil(count / Constant.LIMIT) },
      });
    });
  }

  async allBestOffer(data, userId, lang) {
    return new Promise(async (done, reject) => {
      data.userId = userId;

      let skip =
        Number(data.page) > 1 ? (Number(data.page) - 1) * Constant.LIMIT : 0;

      let andQry = [{ status: 1 }, { discount: { $gt: 0 } }];

      let qry = {
        $and: andQry,
      };
      let sort = { discount: -1 };

      if (data.filter) {
        let resp = this.filterSort(andQry, sort, data.filter);
        qry = resp.qry;
        sort = resp.sort;
      }

      let restaurants = await this.getBestOffers(
        data,
        skip,
        Constant.LIMIT,
        qry,
        sort
      );
      let count = await this.getBestOffersCount(data, qry);

      done({
        data: {
          bestOffers: restaurants,
          totalPages: count.length
            ? Math.ceil(count.length / Constant.LIMIT)
            : 1,
        },
      });
    });
  }

  async allRecommened(data, userId, lang) {
    return new Promise(async (done, reject) => {
      data.userId = userId;

      let skip =
        Number(data.page) > 1 ? (Number(data.page) - 1) * Constant.LIMIT : 0;

      let andQry = [{ status: 1 }, { isRecommended: 1 }];

      let qry = {
        $and: andQry,
      };
      let sort = { _id: 1 };

      if (data.filter) {
        let resp = this.filterSort(andQry, sort, data.filter);
        qry = resp.qry;
        sort = resp.sort;
      }

      let restaurants = await this.getRecommendedRestaurants(
        data,
        skip,
        Constant.LIMIT,
        qry,
        sort
      );

      let count = await this.getRecommendedRestaurantCount(data, qry);

      done({
        data: {
          recommended: restaurants,
          totalPages: count.length
            ? Math.ceil(count.length / Constant.LIMIT)
            : 1,
        },
      });
    });
  }

  filterSort(andQry, sort, filter) {
    if (filter.minprice && filter.maxprice) {
      andQry.push({
        avgOrderPrice: {
          $gte: Number(filter.minprice),
          $lte: Number(filter.maxprice),
        },
      });
    }

    // if (filter.rating) {
    //   andQry.push({
    //     ratings: {
    //       $gte: Number(filter.rating)
    //     }
    //   })
    // }

    if (filter.avgTime) {
      andQry.push({ avgDeliveryTime: { $lte: Number(filter.avgTime) } });
    }

    let qry = {
      $and: andQry,
    };

    if (filter.preparationTime)
      sort = { avgDeliveryTime: Number(filter.preparationTime) };
    else if (filter.cost) sort = { avgOrderPrice: Number(filter.cost) };

    return { qry: qry, sort: sort };
  }

  async restaurantDetail(restId, data, userId, lang) {
    return new Promise(async (done, reject) => {
      let qry = { _id: mongoose.Types.ObjectId(restId) };
      let restaurant = await model.restaurant.aggregate([
        { $match: qry },
        { $lookup: await this.outletLookup(data) },
        { $project: preProject },
        { $lookup: catLookup },
        { $lookup: ratingLookup },
        { $lookup: await this.favLookup(userId) },
        { $limit: 1 },
        { $project: project },
      ]);
      let setting = await model.restaurantSetting.findOne();

      let outletId = data.outletId
        ? mongoose.Types.ObjectId(data.outletId)
        : restaurant[0].outlets.length
          ? restaurant[0].outlets[0]._id
          : "";

      let menu = [];
      if (outletId) {
        let menuqry = { restaurantId: mongoose.Types.ObjectId(restId) };

        menu = await model.foodType.aggregate([
          { $match: menuqry },
          { $lookup: await this.foodItemsLookup(outletId) },
          {
            $project: {
              name: 1,
              name_ar: 1,
              fooditems: 1,
              itemSize: { $size: "$fooditems" },
            },
          },
          { $match: { itemSize: { $gte: 1 } } },
          { $addFields: { isSelected: false } },
          { $project: { name: 1, name_ar: 1, fooditems: 1, isSelected: 1 } },
        ]);
      }
      for (const x in menu) {
        for (const y in menu[x].fooditems) {
          for (const z in menu[x].fooditems[y].addOn) {
            menu[x].fooditems[y].addOn[z] = await model.addOns
              .findOne({
                _id: mongoose.Types.ObjectId(menu[x].fooditems[y].addOn[z]),
              })
              .lean()
              .exec();
          }
        }
      }
      done({
        data: { restaurant: restaurant[0], menu: menu, extradetail: setting },
      });
    });
  }

  rateRestaurant(data, userId, lang) {
    return new Promise(async (done, reject) => {
      let rating = new model.restaurantRating(data);
      rating.userId = userId;
      rating
        .save()
        .then((result) => {
          let update = { restaurantRating: data.rating, status: 6 };

          if (data.driverRating) {
            let drating = new model.driverRating(data);
            drating.userId = userId;
            drating.rating = data.driverRating;
            drating.save().then({});
            update.driverRating = data.driverRating;
          }
          model.restaurantOrder
            .findByIdAndUpdate(data.orderId, update, { new: true })
            .then((order) => {
              done({ message: Constant.RATEDMSG });
            });
        })
        .catch((err) => {
          return reject({ message: Constant.FALSEMSG });
        });
    });
  }

  markFavourite(data, userId, lang) {
    return new Promise(async (done, reject) => {
      data.userId = userId;
      model.favRestaurant.findOneAndRemove(data).then((removed) => {
        if (removed) {
          done({ message: Constant.UNMARKFAVMSG });
        } else {
          let fav = new model.favRestaurant(data);
          fav
            .save()
            .then((result) => {
              done({ message: Constant.MARKFAVMSG });
            })
            .catch((err) => {
              return reject({ message: Constant.FALSEMSG });
            });
        }
      });
    });
  }

  async createOrder(data, userId, lang) {
    return new Promise(async (done, reject) => {
      data.userId = userId;
      data.date = moment().valueOf();
      let order = new model.restaurantOrder(data);

      order
        .save()
        .then(async (result) => {
          let payload = {
            title: `New Order`,
            message: `You placed order with <strong>${data.restaurantName}</strong>`,
            notimessage: `You placed order with ${data.restaurantName}`,

            type: 1,
            restaurantId: data.restaurantId,
            orderId: result._id,
            orderStatus: 0,
            verticalType: 0,
            userId: userId,
          };

          model.restaurantOrder
            .findById(result._id)
            .populate(
              "items.itemId outletId restaurantId driverId",
              "firstName lastName profilePic countryCode phone name address image latitude longitude name_ar"
            )
            .then(async (resp) => {
              payload = resp;
              await Service.Notification.usersend(payload);
              done({ message: Constant.ORDERPLACED, data: resp });
            });
        })
        .catch((err) => {
          return reject({ message: Constant.FALSEMSG });
        });
    });
  }

  getAllOrders(data, userId, lang) {
    return new Promise(async (done, reject) => {
      let qry = { userId: userId };
      qry.status = data.status == "pending" ? { $lt: 4 } : { $gte: 4 };

      let skip =
        Number(data.page) > 1 ? (Number(data.page) - 1) * Constant.LIMIT : 0;

      model.restaurantOrder
        .find(qry)
        .populate(
          "items.itemId outletId restaurantId driverId",
          "firstName lastName profilePic countryCode phone name address image latitude longitude name_ar"
        )
        .skip(skip)
        .limit(Constant.LIMIT)
        .sort("-_id")
        .then((result) => {
          model.restaurantOrder.countDocuments(qry).then(async (count) => {
            let notiCount = await this.notiUnreadCount(userId);

            done({
              data: {
                orderList: result,
                count: Math.ceil(count / Constant.LIMIT),
                notiCount: notiCount,
              },
            });
          });
        })
        .catch((err) => {
          return reject({ message: Constant.FALSEMSG });
        });
    });
  }

  getSearchRestaurants(data, userId, lang) {
    return new Promise(async (done, reject) => {
      let andQry = [
        { status: 1 },
        {
          $or: [
            { name: new RegExp(data.name, "i") },
            { description: new RegExp(data.name, "i") },
            { categorySize: { $gte: 1 } },
            { menuSize: { $gte: 1 } },
          ],
        },
        { outletSize: { $gte: 1 } },
      ];

      let foodItemQry = {};
      if (data.filter && data.filter.foodType && data.filter.foodType != "2") {
        foodItemQry = {
          $and: [
            { $eq: ["$restaurantId", "$$restaurantId"] },
            { $eq: ["$type", Number(data.filter.foodType)] },
            { $eq: ["$status", 1] },
          ],
        };
        andQry.push({
          foodType: Number(data.filter.foodType),
        });
      } else {
        foodItemQry = { $eq: ["$restaurantId", "$$restaurantId"] };
      }

      if (data.filter && data.filter.minprice && data.filter.maxprice) {
        andQry.push({
          avgOrderPrice: {
            $gte: Number(data.filter.minprice),
            $lte: Number(data.filter.maxprice),
          },
        });
      }
      if (data.filter && data.filter.rating) {
        andQry.push({
          ratings: {
            $gte: Number(data.filter.rating),
          },
        });
      }

      if (data.filter && data.filter.avgTime) {
        andQry.push({ avgDeliveryTime: { $lte: Number(data.filter.avgTime) } });
      }

      let qry = {
        $and: andQry,
      };
      let sort = { _id: 1 };
      if (data.filter && data.filter.preparationTime)
        sort = { avgDeliveryTime: Number(data.filter.preparationTime) };
      else if (data.filter && data.filter.cost)
        sort = { avgOrderPrice: Number(data.filter.cost) };

      model.restaurant
        .aggregate([
          { $lookup: await this.outletLookup(data) },
          {
            $lookup: {
              from: "foodcategories",
              let: { categories: "$categories" },
              pipeline: [
                { $match: { $expr: { $in: ["$_id", "$$categories"] } } },
                { $match: { $expr: { $eq: ["$status", 1] } } },
                { $match: { name: { $regex: data.name, $options: "i" } } },
                { $project: { name: 1, name_ar: 1, _id: 0 } },
              ],
              as: "allcategories",
            },
          },
          {
            $lookup: {
              from: "fooditems",
              let: { restaurantId: "$_id" },
              pipeline: [
                {
                  $match: { $expr: foodItemQry },
                },
                {
                  $match: {
                    $or: [
                      { name: { $regex: data.name, $options: "i" } },
                      { description: { $regex: data.name, $options: "i" } },
                    ],
                  },
                },
                { $project: { name: 1, name_ar: 1, _id: 1, type: 1 } },
              ],
              as: "menu",
            },
          },
          { $lookup: ratingLookup },
          {
            $project: {
              name: 1,
              name_ar: 1,
              image: 1,
              description: 1,
              _id: 1,
              menu: 1,
              categories: 1,
              status: 1,
              outlets: 1,
              avgOrderPrice: 1,
              avgDeliveryTime: 1,
              foodType: 1,
              outletSize: { $size: "$outlets" },
              menuSize: { $size: "$menu" },
              categorySize: { $size: "$allcategories" },
              ratings: {
                $cond: [
                  { $size: "$ratings" },
                  {
                    $divide: [
                      { $sum: "$ratings.rating" },
                      { $size: "$ratings" },
                    ],
                  },
                  0,
                ],
              },
            },
          },
          { $match: qry },
          { $lookup: catLookup },
          { $lookup: ratingLookup },
          { $lookup: await this.favLookup(userId) },
          { $sort: sort },
          { $project: project },
        ])
        .then((resp) => {
          done({ data: resp });
        });
    });
  }

  checkOrderAddress(data, userId, lang) {
    return new Promise(async (done, reject) => {
      model.restaurantOutlet
        .aggregate([
          {
            $geoNear: {
              near: {
                type: "Point",
                coordinates: [
                  parseFloat(data.longitude),
                  parseFloat(data.latitude),
                ],
              },
              distanceField: "distance",
              spherical: true,
              distanceMultiplier: 1e-3,
              maxDistance: Constant.RADIUSCIRCLE,
            },
          },
          { $match: { _id: mongoose.Types.ObjectId(data.outletId) } },
        ])
        .then((result) => {
          if (result.length) done({ data: result });
          else reject({ message: Constant.NOTDELIVERHERE, data: result });
        });
    });
  }

  favLookup(userId) {
    return {
      from: "favrestaurants",
      let: { restaurantId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$restaurantId", "$$restaurantId"] },
                { $eq: ["$userId", mongoose.Types.ObjectId(userId)] },
              ],
            },
          },
        },
        { $project: { restaurantId: 1, _id: 0 } },
      ],
      as: "favourites",
    };
  }

  foodItemsLookup(outletId) {
    return {
      from: "fooditems",
      let: { foodTypeId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$foodTypeId", "$$foodTypeId"] },
                { $not: { $in: [outletId, "$notInOutlet"] } },
                { $eq: ["$status", 1] },
              ],
            },
          },
        },
        {
          $addFields: { isSelected: false },
        },
        {
          $addFields: { itemQuantity: 0 },
        },
        {
          $project: {
            isAvailable: {
              $cond: [
                { $setIntersection: ["$notAvailable", [outletId]] },
                0,
                1,
              ],
            },
            _id: 1,
            addOn: 1,
            description: 1,
            description_ar: 1,
            discount: 1,
            image: 1,
            isSelected: 1,
            itemQuantity: 1,
            name: 1,
            name_ar: 1,
            preprationTime: 1,
            price: 1,
            type: 1,
          },
        },
      ],
      as: "fooditems",
    };
  }

  outletLookup(data) {
    return {
      from: "restaurantoutlets",
      let: { restaurantId: "$_id" },
      pipeline: [
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [
                parseFloat(data.longitude),
                parseFloat(data.latitude),
              ],
            },
            distanceField: "distance",
            spherical: true,
            distanceMultiplier: 1e-3,
            maxDistance: Constant.RADIUSCIRCLE,
          },
        },
        { $match: { $expr: { $eq: ["$restaurantId", "$$restaurantId"] } } },
        { $match: { $expr: { $eq: ["$status", 1] } } },
        {
          $addFields: { isSelected: false },
        },
        { $sort: { distance: 1 } },
        {
          $project: {
            address: 1,
            _id: 1,
            latitude: 1,
            longitude: 1,
            isSelected: 1,
            distance: 1 /*{ $round: ["$distance", 1] } */,
          },
        },
      ],
      as: "outlets",
    };
  }

  restaurantLookup(data) {
    return {
      from: "restaurants",
      let: { categoryId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: [
                { $setIntersection: ["$categories", ["$$categoryId"]] },
                ["$$categoryId"],
              ],
            },
          },
        },
        { $match: { $expr: { $eq: ["$status", 1] } } },
        {
          $lookup: {
            from: "restaurantoutlets",
            let: { restaurantId: "$_id" },
            pipeline: [
              {
                $geoNear: {
                  near: {
                    type: "Point",
                    coordinates: [
                      parseFloat(data.longitude),
                      parseFloat(data.latitude),
                    ],
                  },
                  distanceField: "distance",
                  spherical: true,
                  distanceMultiplier: 1e-3,
                  maxDistance: Constant.RADIUSCIRCLE,
                },
              },
              {
                $match: { $expr: { $eq: ["$restaurantId", "$$restaurantId"] } },
              },
              { $match: { $expr: { $eq: ["$status", 1] } } },
            ],
            as: "restaurantoutlets",
          },
        },
        { $project: { outletSize: { $size: "$restaurantoutlets" } } },
        { $match: { outletSize: { $gte: 1 } } },
        { $count: "count" },
      ],
      as: "restaurantList",
    };
  }
}

// let addOnProject = {
//   addOn: 1,
//   addOn_Size: { $size: '$addOn' },
// }

let preProject = {
  name: 1,
  name_ar: 1,
  image: 1,
  currency: 1,
  description: 1,
  avgDeliveryTime: 1,
  avgOrderPrice: 1,
  discountUpto: 1,
  categories: 1,
  discount: 1,
  openTime: 1,
  closeTime: 1,
  foodType: 1,
  isFavourite: 1,
  ratings: 1,
  status: 1,
  outlet_Size: { $size: "$outlets" },
  outlets: 1,
};

let project = {
  name: 1,
  name_ar: 1,
  image: 1,
  currency: 1,
  description: 1,
  avgDeliveryTime: 1,
  avgOrderPrice: 1,
  discountUpto: 1,
  categories: 1,
  discount: 1,
  openTime: 1,
  closeTime: 1,
  foodType: 1,
  status: 1,
  outletSize: { $size: "$outlets" },
  isFavourite: {
    $cond: ["$favourites", { $cond: [{ $size: "$favourites" }, 1, 0] }, 0],
  },
  outlets: 1,
  ratingCount: { $size: "$ratings" },
  ratings: {
    $cond: [
      { $size: "$ratings" },
      { $divide: [{ $sum: "$ratings.rating" }, { $size: "$ratings" }] },
      0,
    ],
  },
};

let ratingLookup = {
  from: "restaurantratings",
  let: { restaurantId: "$_id" },
  pipeline: [
    { $match: { $expr: { $eq: ["$restaurantId", "$$restaurantId"] } } },
    { $project: { rating: 1, _id: 0 } },
  ],
  as: "ratings",
};

let catLookup = {
  from: "foodcategories",
  let: { categories: "$categories" },
  pipeline: [
    { $match: { $expr: { $in: ["$_id", "$$categories"] } } },
    { $match: { $expr: { $eq: ["$status", 1] } } },
    { $project: { name: 1, name_ar: 1, _id: 0 } },
  ],
  as: "categories",
};

let catProject1 = {
  name: 1,
  name_ar: 1,
  image: 1,
  restaurants: { $arrayElemAt: ["$restaurantList", 0] },
};
let catProject2 = {
  name: 1,
  name_ar: 1,
  image: 1,
  restaurants: "$restaurants.count",
};

export default restaurantController;
