const webpush = require("web-push");

let vapidKeys = {
  publicKey: "BDsMUa38mhDO3aIBGfSRV9Q5vkS-iXMsqIdSuT_uur54SaPlZ52j5JIFA6UM-fqymV2n8SV5GatY_zap-5IJ7bs",
  privateKey: "0ABlQo-mDyKoHB9UvB4iyHyEpKvQA0TPGxfMa9xbF9Q",
};
webpush.setVapidDetails("mailto:adhish@apptunix.com", vapidKeys.publicKey, vapidKeys.privateKey);
let sub = {
  endpoint:
    "https://fcm.googleapis.com/fcm/send/dniKX2Uuwj4:APA91bEtJ4BtVR30B6uDsIDzVkUGW9pnkP1wK9ILe8L7elan0fMCSYzBgxq9C72q9gf2bK2ysCy_moIRF_qRzzvoFiY7TSXqAl2Eq_W4b6L_vsz_V32T242DLLpO_GfWzLsMXhLoJUg9",
  expirationTime: null,
  keys: {
    p256dh: "BHJIqz_96IdFhPEJ2XOPEnWqOa5CPlaSrXElp6sMf59CCjT5yFRmB-Uj35kB_Rp5Y4B2ovDBkKwBUCIrD1MH3mo",
    auth: "YCYoySyjmrek6v8PaONokw",
  },
};

const notificationPayload = {
  notification: {
    title: "Adhish News",
    body: "Adhish Available!",
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
webpush
  .sendNotification(sub, JSON.stringify(notificationPayload))
  .then(() => {
    // res.status(200).json({ message: "Newsletter sent successfully." });
  })
  .catch((err) => {
    console.error("Error sending notification, reason: ", err);
  });
