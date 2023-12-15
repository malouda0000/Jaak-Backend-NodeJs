import mongoose from "mongoose";
import model from "../models/index.js";
mongoose.Promise = global.Promise;
import storeController from "../v1/controllers/store/storeController";
let storeRepo = new storeController();
let url = `${process.env.MONGO_URL}${process.env.MONGO_IP}/${process.env.DB_NAME}`;
const wait = async (milisec) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("");
    }, milisec);
  });
};
if (process.env.DB_URL) url = process.env.DB_URL;
if(process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME)
{
  mongoose.connect(url, {
    auth: {
        authSource:  process.env.DB_NAME
    },
    user:  process.env.DB_USER,
    pass:  process.env.DB_PASSWORD,
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false
},
function (err) {
  console.log(url);
  if (err) {
    console.log("mongoose Error ", err);
  } else {
    console.log("connected to mongodb via ");
    (async () => {
      let favs = await model.favProduct.find({}).lean();
      global.favs = {};
      favs.forEach((item) => {
        global.favs[item.userId.toString() + item.productKey] = true;
      });
    })();
  }
}
)
}else
mongoose.connect(
  url,
  { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false },
  function (err) {
    console.log(url);
    if (err) {
      console.log("mongoose Error ", err);
    } else {
      console.log("connected to mongodb");

      (async () => {
        let favs = await model.favProduct.find({}).lean();
        global.favs = {};
        favs.forEach((item) => {
          global.favs[item.userId.toString() + item.productKey] = true;
        });
      })();
    }
  }
);

export default mongoose;
