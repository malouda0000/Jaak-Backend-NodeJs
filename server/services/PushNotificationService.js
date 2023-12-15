const FCM = require("fcm-node");
import dotenv from "dotenv";
dotenv.config();
require("dotenv").config();
import models from "../models";
import moment from "moment";
import mongoose from "mongoose";
const config = require("../config/config");
const fcm = new FCM(process.env.FCMSERVERKEY);
const webpush = require("web-push");

let vapidKeys = {
  publicKey: "BDsMUa38mhDO3aIBGfSRV9Q5vkS-iXMsqIdSuT_uur54SaPlZ52j5JIFA6UM-fqymV2n8SV5GatY_zap-5IJ7bs",
  privateKey: "0ABlQo-mDyKoHB9UvB4iyHyEpKvQA0TPGxfMa9xbF9Q",
};
webpush.setVapidDetails("mailto:adhish@apptunix.com", vapidKeys.publicKey, vapidKeys.privateKey);

module.exports = {
  async usersend(payload) {
    let restaurant = {};
	console.log("PayLoad",payload);
    let store = {};
    if (payload.data) {
      restaurant = payload.data.restaurantId;
      store = payload.data.storeId;
    }
    models.user
      .findById(payload.userId)
      .select("deviceId")
      .then(async (user) => {
        payload.date = moment().valueOf();
        let noti = await models.notification(payload).save();
        if (payload.data) {
          payload.data.restaurantId = restaurant;
          payload.data.storeId = store;
        }
        if (user && user.deviceId) {
		console.log("Inside user and deviceID",user,user.deviceId);
          var message = {
            to: user.deviceId,
            notification: {
              title: payload.title,
              body: payload.notimessage,
              // type: payload.type,
              // notiData: payload,
            },
            data: {
              title: payload.title,
              body: payload.notimessage,
              type: payload.type,
              // notiData: { notificationId: noti._id },
              notiData: payload,
            }
          };
          fcm.send(message, (err, response) => {
            if (err) {
              console.log("Something has gone wrong!", err);
            } else {
//console.log("usersend",message);             
 console.log("Push successfully sent!", message);
            }
		console.log("Response",response);
          });
        }
        return true;
      });
  },

  async driversend(payload) {
//console.log("Payload to send driver notification",payload);
    models.driver
      .findById(payload.driverId)
      .select("deviceId")
      .then(async (user) => {
        payload.date = moment().valueOf();
        let noti = await new models.driverNotification(payload).save();
        // await noti.save();
        if (user && user.deviceId) {
          var message = {
            to: user.deviceId,
            notification: {
              title: payload.title,
              body: payload.notimessage,
              // type: payload.type,
              // notiData: payload,
            },
            data: {
              title: payload.title,
              body: payload.notimessage,
              type: payload.type,
              notiData: { notificationId: noti._id },
            },
          };
          fcm.send(message, (err, response) => {
            if (err) {
              console.log("Something has gone wrong!", err);
            } else {
//console.log("driversend",message);
              console.log("Push successfully sent!");
            }
          });
        }
        return true;
      });
  },

  async driverChating(payload) {
    models.driver
      .findById(payload.driverId)
      .select("deviceId")
      .then(async (user) => {
        payload.date = moment().valueOf();
        let noti = await new models.driverNotification(payload).save();
        // await noti.save();
        if (user && user.deviceId) {
          var message = {
            to: user.deviceId,
            notification: {
              title: payload.title,
              body: payload.notimessage,
              // type: payload.type,
              // notiData: payload,
            },
            data: {
              title: payload.title,
              body: payload.notimessage,
              type: payload.type,
              notiData: payload,
            },
          };
          fcm.send(message, (err, response) => {
            if (err) {
              console.log("Something has gone wrong!", err);
            } else {
              console.log("Push successfully sent!");
            }
          });
        }
        return true;
      });
  },
  async sendWebPushNotifiction(payload) {
    models.store
      .findById(payload.storeId)
      .select("deviceId")
      .then(async (user) => {
        payload.date = moment().valueOf();
        //let noti = await new models.driverNotification(payload).save();
        // await noti.save();
        if (user && user.deviceId) {
          var message = {
            to: user.deviceId,
            notification: {
              title: payload.title,
              body: payload.notimessage,
              sound: "default",
              // type: payload.type,
              // notiData: payload,
            },
            data: {
              title: payload.title,
              body: payload.notimessage,
              type: payload.type,
              notiData: payload,
            },
          };
        }
      });

    fcm.send(message, (err, response) => {
      if (err) {
        console.log("Something has gone wrong!", err);
      } else {
        console.log("Push successfully sent!", response);
      }
    });
  },

  async webPushNotification(payload) {
	console.log("PUSH Notification",payload);
    const storeInfo = await models.webSubscription.findOne({ storeId: mongoose.Types.ObjectId(payload.storeId) });
    let subscription;
    const notificationPayload = {
      notification: {
        title: payload.title,
        body: payload.message,
        icon: "https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/dog-puppy-on-garden-royalty-free-image-1586966191.jpg",
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1,
        },
        actions: [
          {
            action: "explore",
            title: "Go to the site",
          },
        ],
      },
    };
console.log("StoreInfo",storeInfo);
    if (storeInfo && storeInfo.subscription) {
      subscription = storeInfo.subscription;
      webpush
        .sendNotification(subscription, JSON.stringify(notificationPayload))
        .then(() => {
          console.log("done send store notification");
        })
        .catch((err) => {
          console.error("Error sending notification, reason: ", err);
        });
    }
    const admin = await models.webSubscription.find({ adminId: { $ne: null } });
	console.log("Admin Value",admin);
    if (admin.length > 0) {
      subscription = admin[0].subscription;
	console.log("Subscription of admin",subscription);
      webpush
        .sendNotification(admin[0].subscription, JSON.stringify(notificationPayload))
        .then(() => {
	
          console.log("done send admin notification with ");
	
        })
        .catch((err) => {
          console.error("Error sending notification, reason: ", err);
        });
    }
  },
};
