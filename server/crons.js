import model from "./models/index";
import storeAdminController from "./v1/controllers/admin/storeAdminController";
import storeController from "./v1/controllers/store/storeController";
let storeRepo = new storeController();
let moment = require("moment");
import mongoose from "mongoose";
import { send } from "./services/selectOtpService";
import { sendNotification } from "web-push";
const Service = require("./services");
let db = null;
const MongoClient = require("mongodb").MongoClient;
let url = `${process.env.MONGO_URL}${process.env.MONGO_IP}/${process.env.DB_NAME}`;
if (process.env.DB_URL) {
  url = process.env.DB_URL;
}
MongoClient.connect(url, function (err, client) {
  db = client.db(process.env.DB_NAME);
});
const Agenda = require("agenda");
const agenda = new Agenda({
  db: {
    address: `${process.env.DB_URL}`,
    collection: "scheduledevents",
  },
  processEvery: "20 seconds",
});

const wait = async (milisec) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("YES-MAN! Adhish");
    }, milisec);
  });
};
var CronJob = require("cron").CronJob;
if (process.env.ENVIRONMENT === "production") {
  var job = new CronJob(
    "*/45 0,20,40 * * * *",
    async function () {
      /**********************UPDATING EMPTY STORETYPES isVisible:Boolean**************** */
      let emptyStoreTypesId = [];
      let storeTypes = await model.storeCategory.find({ $and: [{ status: { $ne: 2 } }, { status: { $ne: 0 } }] }).lean();
      let emptyStoreTypes = [];
      for (let i = 0; i < storeTypes.length; i++) {
        let emptyStores = [];
        let stores = await model.store
          .find({
            storeTypeId: storeTypes[i]._id,
            $and: [{ status: { $ne: 2 } }, { status: { $ne: 3 } }],
          })
          .lean();
        for (let j = 0; j < stores.length; j++) {
          let products = await model.storeItem.find({ storeId: stores[j]._id, isProto: false }).lean();
          if (products.length == 0) emptyStores.push(j);
        }

        for (let k = emptyStores.length - 1; k >= 0; k--) stores.splice(emptyStores[k], 1);

        if (!stores || !stores.length) {
          emptyStoreTypesId.push(storeTypes[i]._id);
          emptyStoreTypes.push(i);
        }
        storeTypes[i].stores = stores.length;
      }
      for (let k = emptyStoreTypes.length - 1; k >= 0; k--) storeTypes.splice(emptyStoreTypes[k], 1);

      storeTypes = storeTypes.map((item) => {
        return item._id;
      });
      await model.storeCategory.updateMany({ _id: { $in: storeTypes } }, { $set: { isVisible: true } });
      await model.storeCategory.updateMany({ _id: { $in: emptyStoreTypesId } }, { $set: { isVisible: false } });
      /**********************UPDATING EMPTY STORES isVisible:Boolean**************** */
      let stores = await model.store.find({});
      let emptystores = [];
      let emptystoresId = [];
      for (let j = 0; j < stores.length; j++) {
        let products = await model.storeItem.find({ storeId: stores[j]._id, isProto: false }).lean();
        if (products.length == 0) {
          emptystores.push(j);
          emptystoresId.push(stores[j]._id);
        }
      }
      for (let k = emptystores.length - 1; k >= 0; k--) stores.splice(emptystores[k], 1);
      stores = stores.map((item) => {
        return item._id;
      });
      await model.store.updateMany({ _id: { $in: stores } }, { $set: { isVisible: true } });
      await model.store.updateMany({ _id: { $in: emptystoresId } }, { $set: { isVisible: false } });
    },
    null,
    true,
    "Asia/Kolkata"
  );

  // const similarProducts = new CronJob(
  //   "*/10 * * * *",
  //   async () => {
  //     const getTags = (string) => {
  //       let arr = string.split(" ");
  //       arr = arr.filter((item) => {
  //         if (item[0] === "#") return true;
  //       });
  //       arr = arr.map((item) => {
  //         return item.replace("#", "");
  //       });
  //       let final = [];
  //       arr.forEach((item) => {
  //         let splitted = item.split("#");
  //         if (splitted.length > 1) {
  //           final = final.concat(splitted);
  //         } else {
  //           final.push(item);
  //         }
  //       });
  //       return final;
  //     };
  //     let products = await model.storeItem.find({ tagsUpdated: false }).lean();
  //     for (let i = 0; i < products.length; i++) {
  //       if (products[i].description) {
  //         let tags = getTags(products[i].description);
  //         model.storeItem
  //           .findByIdAndUpdate(products[i]._id, {
  //             tagsUpdated: true,
  //             tags: { $push: tags },
  //           })
  //           .exec();
  //       }
  //     }
  //   },
  //   null,
  //   true,
  //   "Asia/Kolkata"
  // );

  // heavist cron needs atleast 10 mins

  const storeCacheUpdate = new CronJob(
    "45 10 */8 * * *",
    async () => {
      (async () => {
        let promo = await model.promocode.find({
          startDate: { $lte: Date.now() },
          endDate: { $gte: Date.now() },
        });
        let productId = [];
        let storeId = [];
        let brandId = [];
        let categoryId = [];
        let subCategoryId = [];

        for (let i = 0; i < promo.length; i++) {
          productId = productId.concat(promo[i].productId);
          storeId = storeId.concat(promo[i].storeId);
          brandId = brandId.concat(promo[i].brandIds); //change from brandid to brandids
          categoryId = categoryId.concat(promo[i].categoryId);
          subCategoryId = subCategoryId.concat(promo[i].subCategoryId);
        }

        let bestStores = await model.storeItem
          .find({
            $or: [
              { productKey: { $in: productId } },
              { storeItemTypeId: { $in: categoryId } },
              { storeItemSubTypeId: { $in: subCategoryId } },
              { brandId: { $in: brandId } },
              { storeId: { $in: storeId } },
            ],
          })
          .distinct("storeId");
        await model.store.updateMany({}, { isBestOffer: false });
        await model.store.updateMany({ _id: { $in: bestStores } }, { isBestOffer: true });
      })();
    },
    null,
    true,
    "Asia/Kolkata"
  );

  const storeItemsS3Upload = new CronJob(
    "0 2 */3 * * *",
    async () => {
      (async () => {
        let products = await model.storeItem.find({ imagesUpdated: false }).lean();
        products.forEach(async (item, index) => {
          let update = {};
          update.imagesUpdated = true;
          for (let i = 1; i <= 5; i++) {
            if (item[`image${i}`] && item[`image${i}`].length) {
              if (item[`image${i}`][0] == "h" && item[`image${i}`][1] == "t" && item[`image${i}`][2] == "t" && item[`image${i}`][3] == "p") {
                // loop for checking is image is already present on our s3
                let s3_url = process.env.S3URL;
                let present_on_s3 = true;
                for (let k = 0; k < 15; k++) {
                  if (s3_url[k] != item[`image${i}`][k]) {
                    present_on_s3 = false;
                    break;
                  }
                }
                if (present_on_s3) continue;
                let key = `Product${Date.now()}${Math.random().toString(36).substring(7)}${Math.floor(Math.random() * 1000 + 1)}`;
                const options = {
                  responseType: "arraybuffer",
                };
                let resp = {};
                try {
                  resp = await axios.get(item[`image${i}`], options);
                } catch (e) {
                  continue;
                }
                let ext = "jpg";
                if (resp.headers["content-type"].split("/")[1] === "png") {
                  ext = "png";
                }
                update[`image${i}`] = `${process.env.S3URL}${key}.${ext}`;
                const uploadResult = s3
                  .upload({
                    Bucket: process.env.BUCKET_NAME,
                    Key: `${key}.${ext}`,
                    Body: resp.data,
                    ContentType: ext,
                  })
                  .promise();
              }
              if (
                item[`image${i}`][0] == "/" &&
                item[`image${i}`][1] == "s" &&
                item[`image${i}`][2] == "t" &&
                item[`image${i}`][3] == "a" &&
                process.env.BASE_URL
              ) {
                item[`image${i}`] = process.env.BASE_URL + item[`image${i}`];
                let key = `Product${Date.now()}${Math.random().toString(36).substring(7)}${Math.floor(Math.random() * 1000 + 1)}`;
                const options = {
                  responseType: "arraybuffer",
                };
                let resp = {};
                try {
                  resp = await axios.get(item[`image${i}`], options);
                } catch (e) {
                  continue;
                }
                let ext = "jpg";
                if (resp.headers["content-type"].split("/")[1] === "png") {
                  ext = "png";
                }
                update[`image${i}`] = `${process.env.S3URL}${key}.${ext}`;
                const uploadResult = s3
                  .upload({
                    Bucket: process.env.BUCKET_NAME,
                    Key: `${key}.${ext}`,
                    Body: resp.data,
                    ContentType: ext,
                  })
                  .promise();
              }
            }
          }
          if (Object.keys(update).length > 1) {
            model.storeItem.findByIdAndUpdate(item._id, update).exec();
          }
        });
      })();
    },
    null,
    true,
    "Asia/Kolkata"
  );

  const recurringDelivery = new CronJob(
    "* * * * *",
    async () => {
      (async () => {
        let recurringOrder = await model.storeOrder.find({
          scheduleType: "RECURING",
          "recuringCriteria.endDate": { $gt: new Date() },
        });
        for (let order of recurringOrder) {
          const currDate = new Date();
          const startDate = order.recuringCriteria.startDate;
          const endDate = order.recuringCriteria.endDate;
          const totalMinuteCurrent = moment().hour() * 60 + moment().minute();
          const totalMinuteStart = moment(startDate).hour() * 60 + moment(startDate).minute();
          if (
            order.recuringCriteria &&
            order.recuringCriteria.recuringType &&
            moment() >= moment(startDate) &&
            totalMinuteStart - totalMinuteCurrent == 40
          ) {
            const diff = moment().diff(startDate, "day");
            delete order._id;
            switch (order.recuringCriteria.recuringType) {
              case "SEVENDAYS":
                order = await model.storeOrder.create(order);
                process.emit("storeOrder", order);
                break;
              case "ALTERNATEDAYS":
                if (diff % 2 == 0) {
                  order = await model.storeOrder.create(order);
                  process.emit("storeOrder", order);
                }
                break;
              case "EVERYWEEK":
                order = await model.storeOrder.create(order);
                process.emit("storeOrder", order);
                break;
              case "EVERY3RDDAY":
                if (diff % 3 == 0) {
                  order = await model.storeOrder.create(order);
                  process.emit("storeOrder", order);
                }
                break;
              case "MONTHLY":
                order = await model.storeOrder.create(order);
                process.emit("storeOrder", order);
                break;
            }
          }
        }
      })();
    },
    null,
    true,
    "Asia/Kolkata"
  );

  const storeTiming = new CronJob("* * * * *", async () => {
      (async () => {
        let indexValue = moment().day();
        indexValue = Number(indexValue);
        let startDate = new Date();
        let stores = await model.store.aggregate([/* {
          $match:{
            isOpen : true
          }
        }, */
          {
            $lookup: {
              from: "timeslots",
              localField: "_id",
              foreignField: "storeId",
              as: "timeslots",
            },
          },
          {
            $project: {
              timeslots: 1,
              _id: 1,
            },
          },
        ]);
        if (stores.length > 0) {
          for (let store of stores) {
            if (store.timeslots.length > 0) {
              let openTime = null;
              let closeTime = null;
              let timeSlotObject = store.timeslots[0].timeSlots[`${indexValue}`];
              if (timeSlotObject.openTime != "") {
                openTime = timeSlotObject.openTime;
              }
              if (timeSlotObject.closeTime != "") {
                closeTime = timeSlotObject.closeTime;
              }
              if (openTime != null) {
                let startslot = openTime;
                var s1 = startslot.split(":");
                let startTimeHour = Number(s1[0]);
                let startTimeMin = Number(s1[1]);
                startDate.setHours(startTimeHour, startTimeMin, 0);
                if (moment().add(330, "m").diff(moment(startDate), "m") == 0) {
                  await model.store.findOneAndUpdate(
                    {
                      _id: store._id,
                    },
                    { $set: { isOpen: true } },
                    { new: true }
                  );
                  await model.TimeSlot.findOneAndUpdate(
                    {
                      storeId: store._id,
                      "timeSlots._id": timeSlotObject._id,
                    },
                    { $set: { "timeSlots.$.open": true } },
                    { new: true }
                  );
                }
              }
              if (closeTime != null) {
                let startslot = closeTime;
                var s2 = startslot.split(":");
                let startTimeHour = Number(s2[0]);
                let startTimeMin = Number(s2[1]);
                startDate.setHours(startTimeHour, startTimeMin, 0);
                if (moment().add(330, "m").diff(moment(startDate), "m") == 0) {
                  await model.store.findOneAndUpdate(
                    {
                      _id: store._id,
                    },
                    { $set: { isOpen: false } },
                    { new: true }
                  );
                  await model.TimeSlot.findOneAndUpdate(
                    {
                      storeId: store._id,
                      "timeSlots._id": timeSlotObject._id,
                    },
                    { $set: { "timeSlots.$.open": false } },
                    { new: true }
                  );
                }
              }
            }
          }
        }
      })();
    },
    null,
    true,
    "Asia/Kolkata"
  );
  // const storeOpenClose = new CronJob(
  //   "*/30 */2 * * * *",
  //   async () => {
  //     let stores = await model.store.find({ state: "auto" });
  //     stores.forEach(async (store) => {
  //       await storeRepo.storeData(store._id);
  //     });
  //   },
  //   null,
  //   true,
  //   "Asia/Kolkata"
  // );
}
agenda.define(
  "scheduleEvents",
  {
    priority: "high",
  },
  async (job) => {
    let jobData = job.attrs.data;
    if (jobData.orderData.endDate) {
      if (jobData && jobData.orderData && jobData.orderData._id) {
        const data = await db.collection("storeorders").findOneAndUpdate(
          {
            _id: mongoose.Types.OpjectId(orderData._id),
          },
          {
            $set: {
              status: 0,
            },
          },
          { new: true }
        );
        process.emit("storeOrder", { sucess: true, data: data });
        let payload = {
          userId: data.userId,
          title: "Your scheduled order in Kitchen",
          notimessage: "Your order preparing",
          type: 1,
        };
        await Service.Notification.usersend(payload);
        job.remove(function (err) {
          if (!err) {
          }
        });
      }
    }
  }
);
process.on("scheduleEvents", async (payload) => {
  let orderData = JSON.parse(JSON.stringify(payload.resp));
  let agendaPayload = {
    orderData: orderData,
  };
  if (orderData && orderData._id) {
    await db.collection("scheduledevents").deleteMany({
      "data.orderData._id": orderData._id,
    });
  }
  if (orderData && orderData.deliveryCriteria.onDate) {
    await agenda.schedule(
      moment(orderData.deliveryCriteria.onDate).add(330, "m").subtract(payload.timeScheduled, "m"),
      "scheduleEvents",
      agendaPayload
    );
  }
});
async function startCronJobs() {
  await agenda.start();
  // await agenda.every("10 seconds", "scheduleEvents");
}

exports.startCronJobs = startCronJobs;
