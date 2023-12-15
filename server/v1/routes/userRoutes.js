import express from "express";
import {uploadFile} from "../../services/uploads3.service";
import multer from 'multer';

import uploads from "../../services/FileUploadService";
import Auth from "../../auth";
import userController from "../controllers/userController";
let userRepo = new userController();

let userRoutes = express.Router();

// EVENT APIS START

userRoutes.route("/checkPhone").post((req, res) => {
  userRepo.checkPhone(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message, err.data);
    });
});


userRoutes.route("/verifyOtpForLogin").post((req, res) => {
  userRepo.verifyOtpForLogin(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message, err.data);
    });
});


userRoutes.route("/addEvent").post((req, res) => {
  userRepo.addEvent(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message, err.data);
    });
});

userRoutes.route("/event-list").get((req, res) => {
  userRepo.eventsList(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message, err.data);
    });
});

userRoutes.route("/handle-event").put((req, res) => {
  userRepo.approveDissapproveEvent(req, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message, err.data);
    });
});

// EVENT APIS END


userRoutes.route("/upload-file").post((req,res)=>{
  userRepo.uploadToS3(req, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message, err.data);
    });
});


userRoutes.route("/preRegister").post((req, res) => {
  userRepo.preRegister(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message, err.data);
    });
});

userRoutes.route("/verifyPreRegister").post((req, res) => {
  userRepo.verifyPreRegister(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message, err.data);
    });
});

userRoutes.route("/verifyOtp").post((req, res) => {
  userRepo.verifyOtp(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message, err.data);
    });
});

userRoutes.route("/transactionHistory").get(Auth.isUserAuth, (req, res) => {
  userRepo
    .transactionHistory(req.body, req.headers.language, req.user._id)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

userRoutes.route("/invitation").post(Auth.isUserAuth, (req, res) => {
  userRepo
    .invitation(req.body, req.headers.language, req.user._id)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

userRoutes.route("/getItemAddOns").get((req, res) => {
  userRepo
    .getItemAddOns(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

userRoutes.route("/checkloginparams").post((req, res) => {
  userRepo
    .checkLoginParams(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

userRoutes
  .route("/register")
  .post(Auth.isUserAuth, uploads.user.single("pic"), (req, res) => {
    userRepo
      .register(
        JSON.parse(req.body.data),
        req.file || "",
        req.headers.language,
        req.user,
        req.finalFileName
      )
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  });

userRoutes
  .route("/upload-prescription")
  .post( uploads.user.single("prescription"), (req, res) => {
    userRepo
      .uploadPrescription(
        req.file || "",
        req.headers.language,
        req.finalFileName
      )
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  });

  userRoutes
  .route("/completeRegister")
  .post(Auth.isUserAuth, uploads.user.single("pic"), (req, res) => {
    userRepo
      .completeRegister(
        JSON.parse(req.body.data),
        req.file || "",
        req.headers.language,
        req.user,
        req.finalFileName
      )
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  });

userRoutes.route("/socialregister").post((req, res) => {
  userRepo
    .register(req.body.data, "", req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

userRoutes.route("/login").post(Auth.isUserAuth, (req, res) => {
  userRepo
    .login(req.body, req.headers.language, req.user)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

userRoutes.route("/logout").get(Auth.isUserAuth, (req, res) => {
  userRepo
    .logout(req.user._id)
    .then((result) => {
      return res.success();
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

userRoutes.route("/sociallogin").post(Auth.isUserAuth, (req, res) => {
  userRepo
    .socialLogin(req.body, req.headers.language, req.user)
    .then((result) => {
      return res.success(result.message, result.data, result.isUser);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

userRoutes.route("/updatecheck").post(Auth.isUserAuth, (req, res) => {
  userRepo
    .checkBeforeUpdate(req.body, req.headers.language, req.user._id)
    .then((result) => {
      return res.success(result.message , result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

userRoutes
  .route("/")
  .post(Auth.isUserAuth, uploads.user.single("pic"), (req, res) => {
    userRepo
      .updateProfile(
        JSON.parse(req.body.data),
        req.file || "",
        req.headers.language,
        req.user._id,
        req.finalFileName
      )
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .get(Auth.isUserAuth, (req, res) => {
    userRepo
      .getProfile(req.user._id)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  });

userRoutes.route("/forgotPassword").post((req, res) => {
  userRepo
    .forgotPassword(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

userRoutes.route("/resetpassword").put((req, res) => {
  userRepo
    .ChangeForgotPassword(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

userRoutes.route("/changepassword").put(Auth.isUserAuth, (req, res) => {
  userRepo
    .changePassword(req.body, req.headers.language, req.user._id)
    .then((result) => {
      return res.success(result.message);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

userRoutes
  .route("/address")
  .post(Auth.isUserAuth, (req, res) => {
    userRepo
      .addAddress(req.body, req.user._id, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .get(Auth.isUserAuth, (req, res) => {
    userRepo
      .getAddress(req.user._id, req.query, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .put(Auth.isUserAuth, (req, res) => {
    userRepo
      .updateAddress(req.body, req.user._id, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  });

userRoutes.route("/promocode").post(Auth.isUserAuth, (req, res) => {
  userRepo
    .applyPromocodeNew(req.body, req.user._id, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

userRoutes.route("/getUserNotificationById").get((req, res) => {
  userRepo
    .getUserNotificationById(req.query, req.headers.language)
    .then((result) => {
      return res.send(result);
    })
    .catch((err) => {
      return res.send(err);
    });
});

userRoutes.route("/promocoderemove").post(Auth.isUserAuth, (req, res) => {
  userRepo
    .removePromoCode(req.body, req.user._id, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

userRoutes.route("/notification").get(Auth.isUserAuth, (req, res) => {
  userRepo.getAllNotifications(req.query, req.user._id, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    }).catch((err) => {
      return res.reject(err.message);
    });
});

userRoutes.route("/getCrm").get((req, res) => {
  userRepo
    .getCms(req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

userRoutes.route("/refresh").get((req, res) => {
  userRepo.refresh().then((data) => {
    return res.success(data);
  });
});

userRoutes.route("/test").get((req, res) => {
  userRepo.test().then((data) => {
    return res.success(data);
  });
});

userRoutes.route("/addCartstore").post(Auth.isUserAuth, (req, res) => {
  userRepo
    .addCartStore(req.body, req.user._id, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

userRoutes.route("/getCartStore").get(Auth.isUserAuth, (req, res) => {
  userRepo.getCartStore(req.user._id, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

// userRoutes.route("/getCartEcommerce").get(Auth.isUserAuth, (req, res) => {
//   userRepo.getCartEcommerce(req.user._id, req.headers.language)
//     .then((result) => {
//       return res.success(result.message, result.data);
//     })
//     .catch((err) => {
//       return res.reject(err.message);
//     });
// });

userRoutes.route("/checkStoreClose").get((req, res) => {
  userRepo.checkStoreClose(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

userRoutes.route("/clearCartStore").delete(Auth.isUserAuth, (req, res) => {
  userRepo.clearCartStore(req.user._id, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

userRoutes.route("/getDealById").get(Auth.isUserAuth, (req, res) => {
  userRepo
    .getDealById(req.query, req.user._id, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

userRoutes.route("/bestSellingProducts").get((req, res) => {
  userRepo.getBestSellingProducts(req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message, err.data);
    });
});

/**
 * @customerSupport
 */

 userRoutes.post("/customerSupport", Auth.isUserAuth, uploads.user.single("screenShot"), userRepo.customerSupport);
 userRoutes.get("/feature", userRepo.getFeatures);

export default userRoutes;
