import mongoose, { Schema } from "mongoose";
import Constant from "../../constant";



let driverSchema = new Schema(
  {
    geofenceId: { type: Schema.Types.ObjectId, ref: 'geofence',default : null },
    driverNo : {type: String},
    memberShipId : { type: Schema.Types.ObjectId, ref:'MemberShip', default : null },
    paidAmount: { type: Number, default: 0 },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, lowercase: true, unique: true },
    countryCode: { type: String },
    phone: { type: String },
    emergencyPhone: { countryCode: String, phone: String },
    address: {
      address: String,
      location: String,
      zipcode: String,
      latitude: Number,
      longitude: Number,
    },
    profilePic: { type: String, default: "" },
    deviceId: { type: String, select: false },
    deviceType: { type: String, select: false },
    authToken: { type: String, select: false },
    sendNoti: { type: Number, default: 1, select: false },
    isAllDocumentUploaded : {type : Number ,default : 0},
    isAvailable: { type: Number, default: 0 },
    profileStatus: { type: Number, default: 0 },
    verticalType: { type: Number }, // 1 for food/Stationary,2 for taxi, 3 for shuttle
    vehicleTypeId: { type: Schema.Types.ObjectId, ref: "VehicleType" },
    // storeTypeId: { type: Schema.Types.ObjectId, ref: "StoreCategory" },
    storeTypeId: { type: String, default: "" },
    moduleType: [{ type: String }],
    moduleKey: {type : String},
    storeId: [{ type: Schema.Types.ObjectId, ref: "Store" }],
    userType: String,
    vehicleName: { type: String },
    currency: { type: String },
    vehicleNumber: { type: String, required: true },
    cordinates: { type: [Number] },
    bearing: { type: Number, default: 0 },
    date: { type: Number, select: false },
    isAvailbaleForAllStoreType: Boolean,
    commission: Number,
    commissionType: {
      type: String,
      enum: ["Salaried", "Percentage"],
      default: "Salaried",
    }, // Only admin will liable to update commission & commissionType
    status: { type: Number, default: 1 }, // 0 --> Blocked , 1-->  Update/Created , 2--> Unblocked
    indexAt: { type: Number, default: 0 },
    lang: { type: String, default: "en" },
    hash: { type: String, select: false },
    account_name: {
      type: String,
    },
    account_no: {
      type: Number,
    },
    bank_name: {
      type: String,
    },
    bank_code: {
      type: String,
    },
    unpaid: Number,
    withdrawn: Number,
    earnings: {
      type:Number,
      default: 0
    },
    lastPayment: Number,
    referralCode:{
      type:String
    },
    walletAmount:{
      type:Number,
      default: 0 
    },
    bookingRequestLimit: { type: Number, default: 0 }, // it will identify how much a driver can have booking in case of micture
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);
driverSchema.index({ cordinates: "2dsphere" });

driverSchema.virtual("documents", {
  ref: "DriverDocument", // The model to use
  localField: "_id", // Find people where localField
  foreignField: "driverId", // is equal to foreignField
});

driverSchema.path("email").validate((value, done) => {
  if (!value) return true;
  let qry = { email: value };
  return mongoose
    .model("Driver")
    .countDocuments(qry)
    .exec()
    .then(function (count) {
      return !count;
    })
    .catch(function (err) {
      throw err;
    });
}, Constant.EMAILEXISTS);

driverSchema.path("vehicleNumber").validate((value, done) => {
  let qry = { vehicleNumber: value };
  return mongoose
    .model("Driver")
    .countDocuments(qry)
    .exec()
    .then(function (count) {
      return !count;
    })
    .catch(function (err) {
      throw err;
    });
}, Constant.VEHICLENUMBEREXISTS);

driverSchema.path("phone").validate(function (value, done) {
  if (!value) return true;
  let qry = { phone: value, countryCode: this.countryCode };

  return mongoose
    .model("Driver")
    .countDocuments(qry)
    .exec()
    .then(function (count) {
      return !count;
    })
    .catch(function (err) {
      throw err;
    });
}, Constant.PHONEEXISTS);

driverSchema.pre("save", async function (next) {
  var doc = this;
  if (doc.isNew) {
      let countDriver = await Driver.countDocuments();
      let appName = await mongoose.model("AppSetting").findOne();
      if (countDriver > 0) {
        let count = countDriver
        doc.driverNo = `${appName.appName}_D${++count}`;
      } else {
        doc.driverNo = `${appName.appName}_D1`;
      }
    next();
  } else {
    next();
  }
});

let Driver = mongoose.model("Driver", driverSchema);

export default Driver;
