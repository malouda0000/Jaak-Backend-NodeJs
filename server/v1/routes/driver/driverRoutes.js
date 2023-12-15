import express from "express";

import uploads from "../../../services/FileUploadService";
import Auth from "../../../auth";
import driverController from "../../controllers/driver/driverController";
let driverRepo = new driverController();

let driverRoutes = express.Router();

driverRoutes.route("/checkloginparams").post((req, res) => {
  driverRepo
    .checkLoginParams(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

driverRoutes.route("/getDriverNotificationById").get((req, res) => {
  driverRepo
    .getDriverNotificationById(req.query, req.headers.language)
    .then((result) => {
      return res.send(result);
    })
    .catch((err) => {
      return res.send(err);
    });
});

driverRoutes.route("/vehicletypes").get((req, res) => {
  driverRepo
    .getAllVehicleTypes(req.query, req.headers.language)
    .then((result) => {
      return res.success("", result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

driverRoutes
  .route("/register")
  .post(uploads.drivers.single("pic"), (req, res) => {
    driverRepo
      .register(
        JSON.parse(req.body.data),
        req.file || "",
        req.headers,
        req.finalFileName
      )
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  });

driverRoutes.route("/login").post((req, res) => {
  driverRepo
    .login(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

driverRoutes.route("/logout").get(Auth.isUserAuth, (req, res) => {
  driverRepo
    .logout(req.user._id)
    .then((result) => {
      return res.success();
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

driverRoutes.route("/updatecheck").post(Auth.isUserAuth, (req, res) => {
  driverRepo
    .checkBeforeUpdate(req.body, req.headers.language, req.user._id)
    .then((result) => {
      return res.success(result.message);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

driverRoutes
  .route("/document")
  .post(Auth.isUserAuth, uploads.driverDocument.single("frontImage"), (req, res) => {
    driverRepo
      .uploadDocument(
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
    driverRepo
      .getUploadedDocument(req.user._id, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  });

driverRoutes
  .route("/")
  .post(Auth.isUserAuth, uploads.drivers.single("pic"), (req, res) => {
    driverRepo
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
  .put(Auth.isUserAuth, (req, res) => {
    driverRepo
      .changeAvailability(req.body, req.user._id, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .get(Auth.isUserAuth, (req, res) => {
    driverRepo
      .getProfile(req.user._id)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  });

driverRoutes.route("/resetpassword").put((req, res) => {
  driverRepo
    .ChangeForgotPassword(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

driverRoutes.route("/changepassword").put(Auth.isUserAuth, (req, res) => {
  driverRepo
    .changePassword(req.body, req.headers.language, req.user._id)
    .then((result) => {
      return res.success(result.message);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

driverRoutes.route("/rateUser").put(Auth.isUserAuth, (req, res) => {
  driverRepo
    .rateUser(req.body, req.headers.language, req.user._id)
    .then((result) => {
      return res.success(result.message);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

driverRoutes
  .route("/path")
  .post(Auth.isUserAuth, uploads.pathImage.single("path"), (req, res) => {
    driverRepo
      .addPathImage(
        JSON.parse(req.body.data),
        req.file,
        req.headers.language,
        req.user._id,
        req.finalFileName
      )
      .then((result) => {
        return res.success(result.message);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  });

driverRoutes.route("/notification").get(Auth.isUserAuth, (req, res) => {
  driverRepo
    .getAllNotifications(req.query, req.user._id, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

driverRoutes.route("/bookings").get(Auth.isUserAuth, (req, res) => {
  driverRepo
    .getDriverOrders(req.query, req.headers.language, req.user._id)
    .then((result) => {
      return res.success("", result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

driverRoutes.route("/multiBookings").get(Auth.isUserAuth, (req, res) => {
  driverRepo
    .getMultiRequestDriverOrders(req.query, req.headers.language, req.user._id)
    .then((result) => {
      return res.success("", result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

driverRoutes.route("/earning").get(Auth.isUserAuth, (req, res) => {
  driverRepo
    .getDriverEarning(req.query, req.headers.language, req.user._id)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

driverRoutes.route("/notificationById").get(Auth.isUserAuth, (req, res) => {
  driverRepo.notificationById(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    }).catch((err) => {
      return res.reject(err.message);
    });
});

driverRoutes.route("/forgotPassword").post((req, res) => {
  driverRepo.forgotPassword(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});


driverRoutes.get('/getDocumentList', driverRepo.getDocumentList);
export default driverRoutes;
