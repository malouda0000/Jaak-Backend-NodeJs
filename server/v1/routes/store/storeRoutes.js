import express from "express";

import Auth from "../../../auth";
import storeController from "../../controllers/store/storeController";
import uploads from "../../../services/FileUploadService";
let storeRepo = new storeController();

let storeRoutes = express.Router();

storeRoutes.post("/signup", storeRepo.signup);
storeRoutes.post("/forgotPassword", storeRepo.resetPassword);
storeRoutes.post("/login", storeRepo.login);
storeRoutes.post("/resendOtp", storeRepo.resendOtp);
storeRoutes.post("/verifyOtp", storeRepo.verifyOtp);
storeRoutes.post("/setPassword", Auth.isUserAuth, storeRepo.setPassword);
storeRoutes.post("/verifyDocument", storeRepo.verifyDocuments);
storeRoutes.get("/notification", storeRepo.notifications);
storeRoutes.get("/rating", storeRepo.getRatingReview);
storeRoutes.get("/earning", Auth.isUserAuth, storeRepo.getEarningList);
storeRoutes.get("/earninggraph", Auth.isUserAuth, storeRepo.getEarningGraph);
storeRoutes.get("/categoryOrder", storeRepo.getCategoryWiseOrder);
storeRoutes.get("/areaWiseSale", storeRepo.areaWiseSale);
storeRoutes.post("/selfDelivery", storeRepo.selfDelivery);
storeRoutes.post("/statusChange", storeRepo.orderStatusChage);
storeRoutes.post("/addTimeOrder", storeRepo.addExtraTimeOrder);
storeRoutes.get("/newStore", storeRepo.getNewStore);
storeRoutes.get("/geofences", storeRepo.getGeoFenceList);
storeRoutes.get("/zones", storeRepo.getZoneList);

storeRoutes
  .route("/document")
  .post(
    uploads.store.fields([
      { name: "ownerId", maxcount: 1 },
      { name: "ownerAddress", maxcount: 1 },
      { name: "resturantCertificate", maxcount: 1 },
      { name: "resturantAddress", maxcount: 1 },
    ]),

    (req, res, next) => {
      storeRepo.uploadDocument(req, req.files, res, next);
    }
  )
  .get((req, res, next) => {
    storeRepo.getStoresUploadedDocuments(req, res, next);
  })
  .put(
    Auth.isUserAuth,
    uploads.store.fields([
      { name: "ownerId", maxcount: 1 },
      { name: "ownerAddress", maxcount: 1 },
      { name: "resturantCertificate", maxcount: 1 },
      { name: "resturantAddress", maxcount: 1 },
    ]),
    (req, res, next) => {
      storeRepo.uploadDocument(req, req.files, res, next);
    }
  );

storeRoutes.route("/subscribe").post((req, res) => {
  storeRepo
    .storeSubscription(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/getredeemoptions").get((req, res) => {
  storeRepo
    .getRedeemOptions(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/getStoreCouponList").get((req, res) => {
  storeRepo
    .getStoreCouponList(req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/getCategoryCouponList").get((req, res) => {
  storeRepo
    .getCategoryCouponList(req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/getSubCategoryCouponList").get((req, res) => {
  storeRepo
    .getSubCategoryCouponList(req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/getBrandCouponList").get((req, res) => {
  storeRepo
    .getBrandCouponList(req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/getProductCouponList").get((req, res) => {
  storeRepo
    .getProductCouponList(req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/getProductDealsList").get((req, res) => {
  storeRepo
    .getProductDealsList(req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/").post(Auth.isUserAuth, (req, res) => {
  storeRepo
    .homeData(req.body, req.user._id, req.headers.language, req.user)
    .then((result) => {
      return res.success("", result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/homeRecommended").post(Auth.isUserAuth, (req, res) => {
  storeRepo
    .homeRecommended(req.body, req.user._id)
    .then((result) => {
	console.log(result.data);
      return res.success("", result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/favproductslist").get(Auth.isUserAuth, (req, res) => {
  storeRepo
    .favProductsList(req.query, req.user._id, req.headers.language, req.user)
    .then((result) => {
      return res.success("", result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/allcategories").get(Auth.isUserAuth, (req, res) => {
  storeRepo
    .allCategories(req.query, req.user._id, req.headers.language)
    .then((result) => {
      return res.success("", result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/storesList").get(Auth.isUserAuth, (req, res) => {
  storeRepo
    .allStoresByStoreType(req.query, req.user._id, req.headers.language)
    .then((result) => {
      return res.success("", result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/storeCacheUpdate").get(async (req, res) => {
  let result = {};
  try {
    result = await storeRepo.storeCacheUpdate();
  } catch (e) {
    return res.reject(e.message);
  }
  return res.success(result.message, result.data);
});

storeRoutes.route("/viewAllProducts").post(Auth.isUserAuth, (req, res) => {
  storeRepo
    .viewAllProducts(req.body, req.user._id, req.headers.language)
    .then((result) => {
      return res.success("FETCHED DATA", result.products);
    })
    .catch((err) => {
      console.log(err, "PRODUCTS VIEW ALL ERROR");
      return res.reject(err.message);
    });
});

storeRoutes.route("/allsaved").get(Auth.isUserAuth, (req, res) => {
  storeRepo
    .allSaved(req.query, req.user._id, req.headers.language)
    .then((result) => {
      return res.success("", result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/allbestoffer").get(Auth.isUserAuth, (req, res) => {
  storeRepo
    .allBestOffer(req.query, req.user._id, req.headers.language)
    .then((result) => {
      return res.success("", result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/allrecommened").get(Auth.isUserAuth, (req, res) => {
  storeRepo
    .allRecommened(req.query, req.user._id, req.headers.language)
    .then((result) => {
      return res.success("", result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/getBrandById").get(Auth.isUserAuth, (req, res) => {
  storeRepo
    .getBrandById(req.query, req.user._id, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/detail/:id").get(Auth.isUserAuth, (req, res) => {
  storeRepo
    .storeDetail(req.params.id, req.query, req.user._id, req.headers.language)
    .then((result) => {
      return res.success("", result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/detail2/:id").get(Auth.isUserAuth, (req, res) => {
  storeRepo
    .storeDetail2(req.params.id, req.query, req.user._id, req.headers.language)
    .then((result) => {
      return res.success("", result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/getCouponsByStore").get((req, res) => {
  storeRepo
    .getCouponsByStore(
      // req.params.id,
      req.query.storeId
      // req.user._id,
      // req.headers.language
    )
    .then((result) => {
      return res.success("", result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/productsByCategory").post(Auth.isUserAuth, (req, res) => {
  storeRepo
    .getProductsByCategory(req.body, req.user._id, req.headers.language)
    .then((result) => {
      return res.success("", result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/favourite").post(Auth.isUserAuth, (req, res) => {
  storeRepo
    .markFavourite(req.body, req.user._id, req.headers.language)
    .then((result) => {
      return res.success(result.message);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/markProductFavourite").post(Auth.isUserAuth, (req, res) => {
  storeRepo
    .markProductFavourite(req.body, req.user._id, req.headers.language)
    .then((result) => {
      return res.success(result.message);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/rating").post(Auth.isUserAuth, (req, res) => {
  storeRepo
    .rateStore(req.body, req.user._id, req.headers.language)
    .then((result) => {
      return res.success(result.message);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes
  .route("/order")
  .post(Auth.isUserAuth, (req, res) => {
    storeRepo
      .createOrder(req.body, req.user._id, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .get(Auth.isUserAuth, (req, res) => {
    storeRepo
      .getAllOrders(req.query, req.user._id, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  });

storeRoutes.route("/search").post(Auth.isUserAuth, (req, res) => {
  storeRepo
    .getSearchStores(req.body, req.user._id, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/searchNew").get((req, res) => {
  storeRepo
    .searchNew(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      console.log(err);
      return res.reject(err.message);
    });
});

storeRoutes.route("/getStoreByProduct").get((req, res) => {
  storeRepo
    .getStoresByProduct(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      console.log(err);
      return res.reject("Sorry Not Available, please try after some time");
    });
});
storeRoutes.route("/getProductByKeyAndStoreId").get((req, res) => {
  storeRepo
    .getProductByKeyAndStoreId(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      console.log(err);
      return res.reject("Sorry Not Available, please try after some time");
    });
});

storeRoutes
  .route("/getRecommendedProducts")
  .get(Auth.isUserAuth, (req, res) => {
    storeRepo
      .getRecommendedProducts(req.query, req.user, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        console.log(err);
        return res.reject("Sorry Not Available, please try after some time");
      });
  });

storeRoutes.route("/outlets").get((req, res) => {
  storeRepo
    .getNearByOutlets(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      console.log(err);
      return res.reject("Sorry Not Available, please try after some time");
    });
});

storeRoutes.route("/getListofCouponsByProduct").get((req, res) => {
  storeRepo
    .getListofCouponsByProduct(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      console.log(err);
      return res.reject("Sorry Not Available, please try after some time");
    });
});

storeRoutes.route("/getStoreByBrand").get((req, res) => {
  storeRepo
    .getStoresByBrand(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      console.log(err);
      return res.reject("Sorry Not Available, please try after some time");
    });
});
storeRoutes.route("/searchKeyword").get((req, res) => {
  storeRepo
    .keywordSearch(req.query, req.user, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeRoutes.route("/getProductById").post((req, res) => {
  storeRepo
    .getProductById(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message,[]);
    });
});

// storeRoutes.route("/searchResult").post((req, res) => {
//   storeRepo
//     .searchResult(req.body, req.headers.language)
//     .then((result) => {
//       return res.success(result.message, result.data);
//     })
//     .catch((err) => {
//       return res.reject(err.message);
//     });
// });

storeRoutes.route("/addresscheck").post(Auth.isUserAuth, (req, res) => {
  storeRepo
    .checkOrderAddress(req.body, req.user._id, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message, err.data);
    });
});


storeRoutes.get("/storesByCategoryOrSubCategory", storeRepo.getStoresByCategoryOrSubCategory)

export default storeRoutes;
