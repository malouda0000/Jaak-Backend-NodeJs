import dotenv from "dotenv";
dotenv.config();
const multer = require("multer");
const aws = require("aws-sdk"); //"^2.2.41"
const multerS3 = require("multer-s3"); //"^2.7.0"
aws.config.update({
  accessKeyId: process.env.ACCESSKEYS3,
  secretAccessKey: process.env.SECRETACCESSKEY,
});
const s3 = new aws.S3();

const generalUpload = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: process.env.BUCKET_NAME,
  // contentType: `${file.originalname.split(".").pop()}`,
  key: function (req, file, cb) {
    req.finalFileName = file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`;
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const userUpload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "server/uploads/users");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const foodCategoryUpload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "server/uploads/foodCategory");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const restaurantUpload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "server/uploads/restaurants");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const foodItemUpload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "server/uploads/foodItems");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const storeCategoryUpload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "server/uploads/storeCategory");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const storeUpload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "server/uploads/stores");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const storeItemUpload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "server/uploads/storeItems");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const vehicleTypesUpload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "server/uploads/vehicleTypes");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const driverDocumentsUpload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "server/uploads/driverDocuments");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const driversUpload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "server/uploads/drivers");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const pathUpload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "server/uploads/pathImages");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const CategorySubCategoryUpload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "server/uploads/categorySubCategories");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const BrandUpload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "server/uploads/brands");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const CsvUpload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "server/uploads/csv");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const excelFilter = (req, file, cb) => {
  if (file.mimetype.includes("excel") || file.mimetype.includes("spreadsheetml")) {
    cb(null, true);
  } else {
    cb("Please upload only excel file.", false);
  }
};

// const filerFilter = (req, file, cb) => {
//   if (
//     file.mimetype.includes(".jpg") ||
//     file.mimetype.includes(".jpeg") ||
//     file.mimetype.includes(".png")
//   ) {
//     cb(null, true);
//   } else {
//     cb("Please upload only PNG,JPG,JPEG file.", false);
//   }
// };

const appUpload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "server/uploads/appImages");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const bannerUpload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "server/uploads/banner");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const adminUpload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "server/uploads/admin");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const promoCodeUpload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "server/uploads/promoCode");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const toppingUpload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "server/uploads/topping");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const userUploadS3 = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: process.env.BUCKET_NAME,
  key: function (req, file, cb) {
    req.finalFileName = file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`;
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const campaignImage = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: process.env.BUCKET_NAME,
  key: function (req, file, cb) {
    req.finalFileName = file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`;
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const zoneImage = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: process.env.BUCKET_NAME,
  key: function (req, file, cb) {
    req.finalFileName = file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`;
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const foodCategoryUploadS3 = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: process.env.BUCKET_NAME,
  key: function (req, file, cb) {
    req.finalFileName = file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`;
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const restaurantUploadS3 = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: process.env.BUCKET_NAME,
  key: function (req, file, cb) {
    req.finalFileName = file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`;
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const foodItemUploadS3 = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: process.env.BUCKET_NAME,
  key: function (req, file, cb) {
    req.finalFileName = file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`;
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const storeCategoryUploadS3 = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: process.env.BUCKET_NAME,
  key: function (req, file, cb) {
    req.finalFileName = file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`;
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const storeUploadS3 = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: process.env.BUCKET_NAME,
  key: function (req, file, cb) {
    const uploadFile = file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`;
    cb(null, uploadFile);
  },
});
const storeItemUploadS3 = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: process.env.BUCKET_NAME,
  key: function (req, file, cb) {
    const uploadFile = file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`;
    cb(null, uploadFile);
  },
});

const vehicleTypesUploadS3 = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: process.env.BUCKET_NAME,
  key: function (req, file, cb) {
    req.finalFileName = file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`;
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const driverDocumentsUploadS3 = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: process.env.BUCKET_NAME,
  key: function (req, file, cb) {
    req.finalFileName = file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`;
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const driversUploadS3 = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: process.env.BUCKET_NAME,
  key: function (req, file, cb) {
    req.finalFileName = file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`;
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const pathUploadS3 = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: process.env.BUCKET_NAME,
  key: function (req, file, cb) {
    req.finalFileName = file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`;
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const CategorySubCategoryUploadS3 = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: process.env.BUCKET_NAME,
  key: function (req, file, cb) {
    req.finalFileName = file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`;
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const BrandUploadS3 = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: process.env.BUCKET_NAME,
  key: function (req, file, cb) {
    req.finalFileName = file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`;
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const CsvUploadS3 = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: process.env.BUCKET_NAME,
  key: function (req, file, cb) {
    req.finalFileName = file;
    "-" + Date.now() + `.${file.originalname.split(".").pop()}`;

    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const appUploadS3 = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: process.env.BUCKET_NAME,
  key: function (req, file, cb) {
    req.finalFileName = file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`;
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const bannerUploadS3 = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: process.env.BUCKET_NAME,
  key: function (req, file, cb) {
    req.finalFileName = file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`;
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const adminUploadS3 = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: process.env.BUCKET_NAME,
  key: function (req, file, cb) {
    req.finalFileName = file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`;
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});
const promoCodeUploadS3 = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: process.env.BUCKET_NAME,
  key: function (req, file, cb) {
    req.finalFileName = file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`;
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

const toppingUploadS3 = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: process.env.BUCKET_NAME,
  key: function (req, file, cb) {
    req.finalFileName = file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`;
    cb(null, file.fieldname + "-" + Date.now() + `.${file.originalname.split(".").pop()}`);
  },
});

let uploads = {
  user: multer({ storage: userUploadS3 }),

  foodCategory: multer({ storage: foodCategoryUploadS3 }),
  restaurant: multer({ storage: restaurantUploadS3 }),
  foodItem: multer({ storage: foodItemUploadS3 }),

  storeCategory: multer({ storage: storeCategoryUploadS3 }),
  store: multer({ storage: storeUploadS3 }),
  storeItem: multer({ storage: storeItemUploadS3 }),

  drivers: multer({ storage: driversUploadS3 }),
  vehicleType: multer({ storage: vehicleTypesUploadS3 }),
  driverDocument: multer({ storage: driverDocumentsUploadS3 }),
  pathImage: multer({ storage: pathUploadS3 }),

  CategorySubCategory: multer({ storage: CategorySubCategoryUploadS3 }),
  BrandUpload: multer({ storage: BrandUploadS3 }),
  Csv: multer({ storage: CsvUpload, fileFilter: excelFilter }),

  appImage: multer({ storage: appUploadS3 }),
  bannerUpload: multer({ storage: bannerUploadS3 }),
  adminUpload: multer({ storage: adminUploadS3 }),
  promoCodeUpload: multer({ storage: promoCodeUploadS3 }),
  toppingUpload: multer({ storage: toppingUploadS3 }),
  generalUpload: multer({ storage: generalUpload }),

  zoneImage: multer({ storage: zoneImage }),
  geofenceImage: multer({ storage: zoneImage }),
  subAdminImage: multer({ storage: zoneImage }),

  campaignImage: multer({ storage: campaignImage }),
};

export default uploads;
