import express from "express";
import uploads from "../../../services/FileUploadService";
import Auth from "../../../auth";
import adminController from "../../controllers/admin/adminController";
import { JsonWebTokenError } from "jsonwebtoken";
let adminRepo = new adminController();

import introScreenController from "../../controllers/introScreen.controller";
let introRepo = new introScreenController();

let adminRoutes = express.Router();
var aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
aws.config.update({
  secretAccessKey: process.env.SECRETACCESSKEY,
  accessKeyId: process.env.ACCESSKEYS3,
  // region: 'us-east-2',
});
var s3 = new aws.S3();

var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.BUCKET_NAME,
    acl: "public-read",
    key: function (req, file, cb) {
      cb(null, Date.now() + "_" + file.originalname); //use Date.now() for unique file keys
    },
  }),
});

adminRoutes.route("/addTimeSlot").post((req, res) => {
  adminRepo
    .addTimeSlot(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/getTimeSlot").get((req, res) => {
  adminRepo
    .getTimeSlot(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/getDashboardStatsRev").get((req, res) => {
  adminRepo
    .getDashboardStatsRev(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/addFaq").post((req, res) => {
  adminRepo
    .addFaq(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/getAllFaq").get((req, res) => {
  adminRepo
    .getAllFaq(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/getUserAllOrders").get((req, res) => {
  adminRepo
    .getUserAllOrders(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/getUserOrderCount").get((req, res) => {
  adminRepo
    .getUserOrderCount(req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/findLotteryWinner").get((req, res) => {
  adminRepo
    .findLotteryWinner(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});
adminRoutes.route("/appSetting").post(
  /* 
  uploads.appImage.fields([
    { name: "splashImage", maxCount: 1 },
    { name: "contactUsImage", maxCount: 1 },
    { name: "firstIntroductionImage", maxCount: 1 },
    { name: "secondIntroductionImage", maxCount: 1 },
    { name: "thirdIntroductionImage", maxCount: 1 },
    { name: "supportImage", maxCount: 1 },
    { name: "welcomeImage", maxCount: 1 },
    { name: "welcomeBackImage", maxCount: 1 },
    { name: "congratulationImage", maxCount: 1 },
    { name: "acceptOrderImage", maxCount: 1 },
    { name: "trackingRealTimeImage", maxCount: 1 },
    { name: "earnMoneyImage", maxCount: 1 },
    { name: "notificationsImage", maxCount: 1 },
    { name: "homeImage", maxCount: 1 },
    { name: "adminLogo", maxCount: 1 },
    { name: "favIcon", maxCount: 1 },
    { name: "splashBackground", maxCount: 1 },
    { name: "loginPageImage", maxCount: 1 },
  ]) */
  (req, res) => {
    // console.log(JSON.stringify(req.files),"req.filessssss")
    adminRepo
      .appSetting(
        req.body,
        // JSON.parse(req.files) || "",
        req.headers.language
      )
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  }
);

adminRoutes.route("/addIntro").post(uploads.appImage.fields([{ name: "image", maxCount: 1 }]), (req, res) => {
  introRepo
    .addIntroScreen(JSON.parse(req.body.data), req.files || "", req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/updateIntro").put(uploads.appImage.fields([{ name: "image", maxCount: 1 }]), (req, res) => {
  introRepo
    .updateIntroScreen(JSON.parse(req.body.data), req.files || "", req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/getAdminModules").get((req, res) => {
  adminRepo
    .getAdminModules(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes
  .route("/accessModule")
  .post((req, res) => {
    adminRepo
      .addAccessModule(req.body, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .put((req, res) => {
    adminRepo
      .editAccessModule(req.body, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .get((req, res) => {
    adminRepo
      .getAccessModule(req.query, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  });

adminRoutes.route("/accessModule/:id").delete((req, res) => {
  adminRepo
    .deleteAccessModule(req.params.id, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/getAccessModuleId/:accessModuleId").get((req, res) => {
  adminRepo
    .getAccessModuleId(req.params.accessModuleId, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

// adminRoutes.route("/subAdmin").post(uploads.adminUpload.single("image"), (req, res) => {
//   adminRepo.addAdmin(req.body, req.file || "", req.headers.language)
//     .then((result) => {
//       return res.success(result.message, result.data);
//     }).catch((err) => {
//       return res.reject(err.message);
//     });
// }).put(uploads.adminUpload.single("image"), (req, res) => {
//   adminRepo.editAdmin(req.body, req.file || "", req.headers.language)
//     .then((result) => {
//       return res.success(result.message, result.data);
//     }).catch((err) => {
//       return res.reject(err.message);
//     });
// }).get((req, res) => {
//   adminRepo.getAdmin(req.query, req.headers.language)
//     .then((result) => {
//       return res.success(result.message, result.data);
//     }).catch((err) => {
//       return res.reject(err.message);
//     });
// });

adminRoutes.route("/subAdmin/:adminId").get((req, res) => {
  adminRepo
    .getAdminId(req.params.adminId, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes
  .route("/banner")
  .post(uploads.bannerUpload.single("image"), (req, res) => {
    adminRepo
      .addBanner(JSON.parse(req.body.data), req.file || "", req.headers.language, req.finalFileName)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .put(uploads.bannerUpload.single("image"), (req, res) => {
    adminRepo
      .editBanner(JSON.parse(req.body.data), req.file || "", req.headers.language, req.finalFileName)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .get((req, res) => {
    adminRepo
      .getBanner(req.query, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  });

adminRoutes.route("/banner/:bannerId").get((req, res) => {
  adminRepo
    .getBannerId(req.params.bannerId, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/forgotPassword").post((req, res) => {
  adminRepo
    .forgotPassword(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/forgotChangePassword").post((req, res) => {
  adminRepo
    .forgotChangePassword(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/register").post((req, res) => {
  adminRepo
    .register(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/login").post((req, res) => {
  adminRepo
    .login(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/pay").post((req, res) => {
  adminRepo
    .pay(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/panel/login").post((req, res) => {
  adminRepo
    .panelLogin(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/adminChangePass").post((req, res) => {
  adminRepo
    .adminChangePassword(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/updateProfile").put(
  uploads.adminUpload.fields([
    { name: "image", maxCount: 1 },
    { name: "loginPageImage", maxCount: 1 },
  ]),
  (req, res) => {
    adminRepo
      .editAdminProfile(JSON.parse(req.body.data), req.files || "", req.headers.language, req.finalFileName)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  }
);

adminRoutes.route("/panel/changepass").post((req, res) => {
  adminRepo
    .panelChangePassword(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.post("/promocode", adminRepo.addPromoCode);
adminRoutes.put("/promocode", adminRepo.editPromoCode);
adminRoutes
  .route("/promocode")
  .get((req, res) => {
    adminRepo
      .getPromoCode(req.query, req.headers.language, req.headers.geofenceid)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  });

adminRoutes.route("/deletePromoCode").delete((req, res) => {
  adminRepo
    .deletePromoCode(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/promocode/:id").get(Auth.isUserAuth, (req, res) => {
  adminRepo
    .getPromoCodeById(req.query, req.params.id, req.user._id, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/getAdminProfile/:id").get((req, res) => {
  adminRepo
    .getAdminProfile(req.params.id, req.headers.language)
    .then((result) => {
      return res.success("", result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes
  .route("/vehicletype")
  .post(uploads.vehicleType.single("image"), (req, res) => {
    adminRepo
      .addVehicleType(JSON.parse(req.body.data), req.file || "", req.headers.language, req.finalFileName, req.headers.geofenceid)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .put(uploads.vehicleType.single("image"), (req, res) => {
    adminRepo
      .editVehicleType(JSON.parse(req.body.data), req.file || "", req.headers.language, req.finalFileName)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .get((req, res) => {
    adminRepo
      .getVehicleType(req.query, req.headers.language, req.headers.geofenceid)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  });

adminRoutes.route("/vehicletype/:id").get((req, res) => {
  adminRepo
    .getVehicleTypeById(req.params.id, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes
  .route("/user")
  .post(uploads.user.single("pic"), (req, res) => {
    adminRepo
      .addUser(JSON.parse(req.body.data), req.file || "", req.headers.language, req.finalFileName)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .put(uploads.user.single("pic"), (req, res) => {
    adminRepo
      .editUser(JSON.parse(req.body.data), req.file || "", req.headers.language, req.finalFileName)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .get((req, res) => {
    adminRepo
      .getUser(req.query, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  });

adminRoutes.route("/user/:id").get((req, res) => {
  adminRepo
    .getUserById(req.params.id, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/dashboard").post(Auth.isUserAuth, (req, res) => {
  adminRepo
    .getDashboardStats(req.body.data, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/revenue/restaurant").get((req, res) => {
  adminRepo
    .getRestaurantRevenue(req.query)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/revenue/store").get((req, res) => {
  adminRepo
    .getStoreRevenue(req.query)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/revenue/taxi").get((req, res) => {
  adminRepo
    .getTaxiRevenue(req.query)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/revenue/shuttle").get((req, res) => {
  adminRepo
    .getShuttleRevenue(req.query)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/testemail").get((req, res) => {
  adminRepo
    .testemail()
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes
  .route("/addOns")
  .post(uploads.toppingUpload.single("image"), (req, res) => {
    adminRepo
      .addOns(JSON.parse(req.body.data), req.file || "", req.headers.language, req.finalFileName)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .put(uploads.toppingUpload.single("image"), (req, res) => {
    adminRepo
      .editAddOns(JSON.parse(req.body.data), req.file || "", req.headers.language, req.finalFileName)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  });

adminRoutes.route("/deleteAddOns").delete((req, res) => {
  adminRepo
    .deleteAddOns(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/getAddOn").get((req, res) => {
  adminRepo
    .getAddOns(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/getToppingItems").get((req, res) => {
  adminRepo
    .getToppingItems(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/getAddOnById/:id").get((req, res) => {
  adminRepo
    .getAddOnById(req.params.id, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/addCrm").post((req, res) => {
  adminRepo
    .addCms(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/getCrm").get((req, res) => {
  adminRepo
    .getCms(req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/setSetting").post((req, res) => {
  adminRepo
    .setSetting(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/getSetting/:adminId").get((req, res) => {
  adminRepo
    .getSetting(req.params.adminId, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/forgotPassword").post((req, res) => {
  adminRepo
    .forgotPassword(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/verify").get((req, res) => {
  adminRepo
    .verify(req, res)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/resetpassword").post((req, res) => {
  adminRepo
    .resetPassword(req, res)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/panel/forgotPasswordRestaurant").post((req, res) => {
  adminRepo
    .forgotPasswordRestaurant(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/panel/verifyRestaurant").get((req, res) => {
  adminRepo
    .verifyRestaurant(req, res)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/panel/resetpasswordRestaurant").post((req, res) => {
  adminRepo
    .resetpasswordRestaurant(req, res)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/panel/forgotPasswordStore").post((req, res) => {
  adminRepo
    .forgotPasswordStore(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/panel/verifyStore").get((req, res) => {
  adminRepo
    .verifyStore(req, res)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/panel/resetpasswordStore").post((req, res) => {
  adminRepo
    .resetpasswordStore(req, res)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/getAppSetting").get((req, res) => {
  adminRepo
    .getAppSetting(req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/addDeal").post((req, res) => {
  adminRepo
    .addDeal(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/broadCast").post((req, res) => {
  adminRepo
    .broadCast(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/createSalesPerson").post((req, res) => {
  adminRepo
    .createSalesPerson(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/deleteSalesPerson").delete((req, res) => {
  adminRepo
    .deleteSalesPerson(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

adminRoutes.route("/blockUnblockUser").put((req, res) => {
  adminRepo
    .blockUnblockUser(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

/**
 * @customerSupport
 */

adminRoutes.get("/customerSupport", adminRepo.getCustomerSupport);
adminRoutes.put("/customerSupport/:id", adminRepo.updateCustomerSupport);

/**
 * @subAdmin
 */
adminRoutes.post("/subAdmin", uploads.subAdminImage.single("profilePic"), adminRepo.createSubAdmin);
adminRoutes.get("/subAdmin", adminRepo.getSubAdmin);
adminRoutes.put("/subAdmin/:id", uploads.subAdminImage.single("profilePic"), adminRepo.updateSubAdmin);
adminRoutes.delete("/subAdmin/:id", adminRepo.deleteSubAdmin);
adminRoutes.get("/subAdminById", adminRepo.getSubAdminById);

/**
 * @campaign
 */
adminRoutes.post("/campaign", uploads.campaignImage.single("banner"), adminRepo.createCampaign);
adminRoutes.get("/campaign", adminRepo.getCampaign);
adminRoutes.get("/campaign/:id", adminRepo.getByIdCampaign);
adminRoutes.put("/campaign/:id", uploads.campaignImage.single("banner"), adminRepo.updateCampaign);
adminRoutes.delete("/campaign/:id", adminRepo.deleteCampaign);
adminRoutes.get("/setMarketPriceAndSellingPrice", adminRepo.setMarketPriceAndSellingPrice);

adminRoutes.post("/contactUs", adminRepo.constactUs);

adminRoutes.post("/document", adminRepo.createDocument);
adminRoutes.get("/document", adminRepo.getDocument);
adminRoutes.get("/document/:id", adminRepo.getByIdDocument);
adminRoutes.put("/document/:id", adminRepo.updateDocument);
adminRoutes.delete("/document/:id", adminRepo.deleteDocument);
adminRoutes.get("/getAllUsersCSV", adminRepo.getAllUsersCSV);
adminRoutes.get("/getAllMarchantsCSV", adminRepo.getAllMarchantsCSV);
adminRoutes.get("/getAllOrdersCSV", adminRepo.getAllOrdersCSV);
adminRoutes.get("/getAllDriverCSV", adminRepo.getAllDriverCSV);


adminRoutes.post("/addMembershipPlan", adminRepo.addMembershipPlan);
adminRoutes.put("/editMembershipPlan", adminRepo.editMembershipPlan);
adminRoutes.get("/getAllMembershipPlan", adminRepo.getAllMembershipPlan);
adminRoutes.put("/deleteMembershipPlan", adminRepo.deleteMembershipPlan);
adminRoutes.get("/getMembershipPlanById/:id", adminRepo.getMembershipPlanById);

adminRoutes.post("/addLanguage", adminRepo.addLanguage);
adminRoutes.put("/editLanguage", adminRepo.editLanguage);
adminRoutes.get("/getAllLanguage", adminRepo.getAllLanguage);
adminRoutes.get("/getAllLanguageByType", adminRepo.getAllLanguageByType);

adminRoutes.post("/itemWiseSalesPerAreaReport", adminRepo.itemWiseSalesPerAreaReport);
/** 
 * @sendNotification */
adminRoutes.put("/notification", adminRepo.editNotification);
adminRoutes.get("/getNotication", adminRepo.getNotication);

adminRoutes.get("/getRevenue", adminRepo.getRevenue);

adminRoutes.post("/manageReferral", adminRepo.manageReferral);
adminRoutes.get("/getAllReferal", adminRepo.getAllReferal);
adminRoutes.get("/getReferalById", adminRepo.getReferalById);
adminRoutes.post("/manageSeo", adminRepo.manageSeo);
adminRoutes.get("/getSeo", adminRepo.getSeo);
/**
 *  @prefrence
 */
adminRoutes.post("/prefence", adminRepo.preference);
adminRoutes.get("/prefence", adminRepo.getPreference);

// ******* Notification ********* // 

adminRoutes.post("/manageNotification", adminRepo.manageNotification);
adminRoutes.get("/getNotification", adminRepo.getNotification);

adminRoutes.get("/payHistory",adminRepo.getPayHistory);





export default adminRoutes;
