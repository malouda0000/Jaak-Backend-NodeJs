import express from "express";
import uploads from "../../../services/FileUploadService";

import Auth from "../../../auth";

import storeAdminController from "../../controllers/admin/storeAdminController";
import { result } from "lodash";
let storeAdminRepo = new storeAdminController();

let storeAdminRoutes = express.Router();

storeAdminRoutes.post("/assignOrder", storeAdminRepo.setOrderEmployeesId)
storeAdminRoutes.route("/allEmployee").get( (req, res) =>{
    if (req.query.id) {
        // storeAdminRepo.getAllEmployeesById(req.query.id, req.headers.language)
        storeAdminRepo.getAllEmployeesById(req)
          .then((result) => {
            return res.success(result.message, result.data);
          })
          .catch((err) => {
            return res.reject(err.message);
          });
    }
});
storeAdminRoutes
  .route("/subscription")
  .post(uploads.storeCategory.single("image"), (req, res) => {
    storeAdminRepo
      .subscription(
        JSON.parse(req.body.data),
        req.finalFileName,
        req.headers.language
      )
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message, err.data);
      });
  })
  .get((req, res) => {
    if (req.query.id) {
      storeAdminRepo
        .getSubscriptionById(req.query.id, req.headers.language)
        .then((result) => {
          return res.success(result.message, result.data);
        })
        .catch((err) => {
          return res.reject(err.message);
        });
    } else {
      storeAdminRepo
        .getSubscription(req, req.headers.language)
        .then((result) => {
          return res.success(result.message, result.data);
        })
        .catch((err) => {
          return res.reject(err.message);
        });
    }
  })
  .put(uploads.storeCategory.single("image"), (req, res) => {
    storeAdminRepo
      .editSubscription(
        req.body.id,
        JSON.parse(req.body.data),
        req.finalFileName,
        req.headers.language
      )
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message, err.data);
      });
  })
  .delete((req, res) => {
    storeAdminRepo
      .deleteSubscription(req.query.id, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message, err.data);
      });
  });

storeAdminRoutes.route("/getDashboardStatsRev").get((req, res) => {
  storeAdminRepo
    .getDashboardStatsRev(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes.route("/getPrototypeProducts").post((req, res) => {
  storeAdminRepo
    .getPrototypeProducts(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes.route("/outletforSingleVendor").get((req, res) => {
  storeAdminRepo
    .getOutletforSingleVendor(req.query.id, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes
  .route("/storeType")
  .post(uploads.storeCategory.single("image"), (req, res) => {
    storeAdminRepo
      .addStoreType(
        JSON.parse(req.body.data),
        req.file || "",
        req.headers.language,
        req.finalFileName,
        req.headers.geofenceid
      )
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message, err.data);
      });
  })
  .put(uploads.storeCategory.single("image"), (req, res) => {
    storeAdminRepo
      .editStoreType(
        JSON.parse(req.body.data),
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
  })
  .get((req, res) => {
    storeAdminRepo
      .getStoreType(req.query, req.headers.language, req.headers.geofenceid)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .delete((req, res) => {
    storeAdminRepo
      .deleteStoreType(req.query, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message, err.data);
      });
  });
storeAdminRoutes.route("/deleteAllStoreTypes").delete((req, res) => {
  storeAdminRepo
    .deleteAllStoreTypes(req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message, err.data);
    });
});

storeAdminRoutes.route("/deleteAllStores").delete((req, res) => {
  storeAdminRepo
    .deleteAllStoreTypes(req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message, err.data);
    });
});

storeAdminRoutes.route("/deleteSelectedStores").post((req, res) => {
  storeAdminRepo
    .deleteSelectedStores(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message, err.data);
    });
});

storeAdminRoutes.route("/deleteSelectedStoreTypes").post((req, res) => {
  storeAdminRepo
    .deleteSelectedStoreTypes(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message, err.data);
    });
});

storeAdminRoutes.route("/getAllStoreTypeExport").get((req, res) => {
  storeAdminRepo
    .getAllStoreTypeExport3(req, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

/* image is just parameter name an excel file is being uploaded*/
storeAdminRoutes
  .route("/bulkUploadStoreType")
  .post(uploads.Csv.single("image"), (req, res) => {
    storeAdminRepo
      .bulkUploadStoreType(
        req.body,
        req.file,
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

storeAdminRoutes
  .route("/brand")
  .post(uploads.BrandUpload.single("image"), (req, res) => {
    storeAdminRepo
      .addBrand(
        JSON.parse(req.body.data),
        req.file || "",
        req.headers.language,
        req.finalFileName,
        req.headers.geofenceid
      )
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message, err.data);
      });
  })
  .put(uploads.BrandUpload.single("image"), (req, res) => {
    storeAdminRepo
      .editBrand(
        JSON.parse(req.body.data),
        req.file || "",
        req.headers.language,
        req.finalFileName
      )
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message, err.data);
      });
  })
  .get((req, res) => {
    storeAdminRepo
      .getBrand(req.query, req.headers.language, req.headers.geofenceid)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .delete((req, res) => {
    storeAdminRepo
      .deleteBrand(req.query, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message, err.data);
      });
  });

storeAdminRoutes.route("/deleteAllBrand").delete((req, res) => {
  storeAdminRepo
    .deleteAllBrand(req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message, err.data);
    });
});

storeAdminRoutes.route("/deleteSelectedBrand").post((req, res) => {
  storeAdminRepo
    .deleteSelectedBrand(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message, err.data);
    });
});

storeAdminRoutes
  .route("/bulkUploadBrand")
  .post(uploads.Csv.single("image"), (req, res) => {
    storeAdminRepo
      .bulkUploadBrand(
        req.body,
        req.file,
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

storeAdminRoutes.route("/getAllBrandExport").get((req, res) => {
  storeAdminRepo
    .getAllBrandExport(req, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes
  .route("/category")
  .post(uploads.CategorySubCategory.single("image"), (req, res) => {
    storeAdminRepo
      .addCategory(
        JSON.parse(req.body.data),
        req.file || "",
        req.headers.language,
        req.finalFileName,
        req.headers.geofenceid
      )
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message, err.data);
      });
  })
  .put(uploads.CategorySubCategory.single("image"), (req, res) => {
    storeAdminRepo
      .editCategory(
        JSON.parse(req.body.data),
        req.file || "",
        req.headers.language,
        req.finalFileName
      )
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message, err.data);
      });
  })
  .get((req, res) => {
    storeAdminRepo
      .getAllCategory(req.query, req.headers.language, req.headers.geofenceid)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .delete((req, res) => {
    storeAdminRepo
      .deleteCategory(req.query, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message, err.data);
      });
  });

storeAdminRoutes.route("/deleteAllCategory").delete((req, res) => {
  storeAdminRepo
    .deleteAllCategory(req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message, err.data);
    });
});

storeAdminRoutes.route("/cloneAll").post((req, res) => {
  storeAdminRepo
    .cloneAllProducts(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      console.log(err);
      return res.reject(err.message);
    });
});

storeAdminRoutes.route("/deleteSelectedCategory").post((req, res) => {
  storeAdminRepo
    .deleteSelectedCategory(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message, err.data);
    });
});

storeAdminRoutes
  .route("/bulkUploadCategory")
  .post(uploads.Csv.single("image"), (req, res) => {
    storeAdminRepo
      .bulkUploadCategory(
        req.body,
        req.file,
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

storeAdminRoutes.route("/getAllCategoryExport").get((req, res) => {
  storeAdminRepo
    .getAllCategoryExport(req, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes
  .route("/subCategory")
  .post(uploads.CategorySubCategory.single("image"), (req, res) => {
    storeAdminRepo
      .addSubCategory(
        JSON.parse(req.body.data),
        req.file || "",
        req.headers.language,
        req.finalFileName,
        req.headers.geofenceid
      )
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message, err.data);
      });
  })
  .put(uploads.CategorySubCategory.single("image"), (req, res) => {
    storeAdminRepo
      .editSubCategory(
        JSON.parse(req.body.data),
        req.file || "",
        req.headers.language,
        req.finalFileName
      )
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message, err.data);
      });
  })
  .get((req, res) => {
    storeAdminRepo
      .getAllSubCategory(
        req.query,
        req.headers.language,
        req.headers.geofenceid
      )
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .delete((req, res) => {
    storeAdminRepo
      .deleteSubCategory(req.query, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message, err.data);
      });
  });

storeAdminRoutes.route("/deleteAllSubCategory").delete((req, res) => {
  storeAdminRepo
    .deleteAllSubCategory(req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message, err.data);
    });
});

storeAdminRoutes.route("/deleteSelectedSubCategory").post((req, res) => {
  storeAdminRepo
    .deleteSelectedSubCategory(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message, err.data);
    });
});

storeAdminRoutes
  .route("/bulkUploadSubCategory")
  .post(uploads.Csv.single("image"), (req, res) => {
    storeAdminRepo
      .bulkUploadSubCategory(
        req.body,
        req.file,
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

storeAdminRoutes.route("/getAllSubCategoryExport").get((req, res) => {
  storeAdminRepo
    .getAllSubCategoryExport(req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});
// JSON.parse(JSON.stringify(data))
storeAdminRoutes.route("/pay").post(async (req, res) => {
  let result = {};
  try {
    result = await storeAdminRepo.PAY(req.body, req.headers.language);
  } catch (e) {
    return res.reject(e.message);
  }
  return res.success(result.message, result.data);
});

storeAdminRoutes
  .route("/upload")
  .post(uploads.generalUpload.single("image"), async (req, res) => {
    let result = {};
    try {
      result = await storeAdminRepo.uploadOnS3(req.finalFileName);
    } catch (e) {
      return res.reject(e.message);
    }
    return res.success(result.message, result.data);
  });

storeAdminRoutes.route("/getSubCategories").get(async (req, res) => {
  let result = {};
  try {
    result = await storeAdminRepo.getSubCategories(
      req.query,
      req.headers.language
    );
  } catch (e) {
    return res.reject(e.message);
  }
  return res.success(result.message, result.data);
});

storeAdminRoutes.route("/getStoreSubCatAndCat").get(async (req, res) => {
  let result = {};
  try {
    result = await storeAdminRepo.getStoreSubCatAndCat(
      req.query,
      req.headers.language
    );
  } catch (e) {
    return res.reject(e.message);
  }
  return res.success(result.message, result.data);
});

storeAdminRoutes.route("/getSubCategoriesByStoreType").get(async (req, res) => {
  let result = {};
  try {
    result = await storeAdminRepo.getSubCategoriesByStoreType(
      req.query,
      req.headers.language
    );
  } catch (e) {
    return res.reject(e.message);
  }
  return res.success(result.message, result.data);
});

storeAdminRoutes.route("/getCategoriesByStoreType").get(async (req, res) => {
  let result = {};
  try {
    result = await storeAdminRepo.getCategoriesByStoreType(
      req.query,
      req.headers.language
    );
  } catch (e) {
    return res.reject(e.message);
  }
  return res.success(result.message, result);
});

storeAdminRoutes.route("/dataRefresher").get(async (req, res) => {
  let result = {};
  try {
    result = await storeAdminRepo.dataRefresher(req.body, req.headers.language);
  } catch (e) {
    return res.reject(e.message);
  }
  return res.success(result.message, result.data);
});

storeAdminRoutes.route("/tagsgenerate").get(async (req, res) => {
  let result = {};
  try {
    result = await storeAdminRepo.tagsGenerator(req.body, req.headers.language);
  } catch (e) {
    return res.reject(e.message);
  }
  return res.success(result, result);
});

storeAdminRoutes.route("/getCategoriesByStore").post(async (req, res) => {
  let result = {};
  try {
    result = await storeAdminRepo.getCategoriesByStore(
      req.body,
      req.headers.language
    );
  } catch (e) {
    return res.reject(e.message);
  }
  return res.success(result.message, result.data);
});

storeAdminRoutes.route("/getSubCategoriesByStore").post(async (req, res) => {
  let result = {};
  try {
    result = await storeAdminRepo.getSubCategoriesByStore(
      req.body,
      req.headers.language
    );
  } catch (e) {
    return res.reject(e.message);
  }
  return res.success(result.message, result.data);
});

storeAdminRoutes.route("/winner").get(async (req, res) => {
  let result = {};
  try {
    result = await storeAdminRepo.findWinner(req.body, req.headers.language);
  } catch (e) {
    return res.reject(e.message);
  }
  return res.success(result.message, result.data);
});

storeAdminRoutes.route("/getwinners").get(async (req, res) => {
  let result = {};
  try {
    result = await storeAdminRepo.getWinners(req.body, req.headers.language);
  } catch (e) {
    return res.reject(e.message);
  }
  return res.success(result.message, result.data);
});
storeAdminRoutes.route("/assignTickets").post(async (req, res) => {
  let result = {};
  try {
    result = await storeAdminRepo.assignTicketsStoreWise(
      req.body,
      req.headers.language
    );
  } catch (e) {
    return res.reject(e.message);
  }
  return res.success(result.message, result.data);
});
storeAdminRoutes.route("/getBrandsByStoreType").post(async (req, res) => {
  let result = {};
  try {
    result = await storeAdminRepo.getBrandsByStoreType(
      req.body,
      req.headers.language
    );
  } catch (e) {
    return res.reject(e.message);
  }
  return res.success(result.message, result.data);
});

storeAdminRoutes.route("/getBrandsByStore").post(async (req, res) => {
  let result = {};
  try {
    result = await storeAdminRepo.getBrandsByStore(
      req.body,
      req.headers.language
    );
  } catch (e) {
    return res.reject(e.message);
  }
  return res.success(result.message, result.data);
});

storeAdminRoutes.route("/getStoresByType").get((req, res) => {
  storeAdminRepo
    .getStoresByType(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes.route("/getAllProductExport").get((req, res) => {
  storeAdminRepo
    .getAllProductsExport(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes
  .route("/product")
  .post(uploads.storeItem.array("image", 100), (req, res) => {
    storeAdminRepo
      .addStoreItem(
        JSON.parse(req.body.data),
        req.files || "",
        req.headers.language,
        req.headers.geofenceid
      )
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message, err.data);
      });
  })
  .put(uploads.storeItem.array("image", 100), (req, res) => {
    storeAdminRepo
      .editStoreItem(
        req.body,
        req.files || "",
        req.headers.language,
        req.finalFileName
      )
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .get((req, res) => {
    storeAdminRepo
      .getAllStoreItems(req.query, req.headers.language, req.headers.geofenceid)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .delete((req, res) => {
    storeAdminRepo
      .deleteProduct(req.query, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message, err.data);
      });
  });

storeAdminRoutes
  .route("/bulkUploadProduct")
  .post(uploads.Csv.single("image"), (req, res) => {
    storeAdminRepo
      .bulkUploadProduct(
        req.body,
        req.file,
        req.headers.language,
        req.query,
        req.finalFileName
      )
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message, err.data);
      });
  });

storeAdminRoutes.route("/deleteSelectedProduct").post((req, res) => {
  storeAdminRepo
    .deleteSelectedProduct(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message, err.data);
    });
});

storeAdminRoutes.route("/deleteAllProduct").delete((req, res) => {
  storeAdminRepo
    .deleteAllProduct(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message, err.data);
    });
});

storeAdminRoutes.route("/getAllSalesPerson").get((req, res) => {
  storeAdminRepo
    .getAllSalesPerson(req.query, req.headers.language, req.headers.geofenceid)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes.route("/editSalesPersonById").post((req, res) => {
  storeAdminRepo
    .editSalesPersonById(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes.route("/getSalesPersonById").get((req, res) => {
  storeAdminRepo
    .getSalesPersonById(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes.route("/getStoresSP").get((req, res) => {
  storeAdminRepo
    .getStoresSP(req.query, req.headers.language)
    .then((result) => {
      // result.data.salesPersonData = result.salesPersonData;
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes.route("/getAllSalesPersonStores").get((req, res) => {
  storeAdminRepo
    .getAllSalesPersonStores(
      req.query,
      req.headers.language,
      req.headers.geofenceid
    )
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes.route("/getAllMerchantTotalCommission").get((req, res) => {
  storeAdminRepo
    .getAllMerchantTotalCommission(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes
  .route("/")
  // .post(uploads.store.single("image"), (req, res) => {
  .post(
    uploads.store.fields([
      { name: "image", maxcount: 1 },
      { name: "banner", maxcount: 1 },
    ]),
    (req, res) => {
      storeAdminRepo
        .addStore(
          JSON.parse(req.body.data),
          req.files || "",
          req.headers.language,
          req.finalFileName,
          req.headers.geofenceid
        )
        .then((result) => {
          return res.success(result.message, result.data);
        })
        .catch((err) => {
          return res.reject(err.message, err.data);
        });
    }
  )
  // .put(uploads.store.single("image"), (req, res) => {
  .put(
    uploads.store.fields([
      { name: "image", maxcount: 1 },
      { name: "banner", maxcount: 1 },
    ]),
    (req, res) => {
      storeAdminRepo
        .editStore(
          JSON.parse(req.body.data),
          req.files || "",
          req.headers.language,
          req.finalFileName
        )
        .then((result) => {
          return res.success(result.message, result.data);
        })
        .catch((err) => {
          console.log(err);
          return res.reject(err.message, err.data);
        });
    }
  )
  .get((req, res) => {
	console.log("Data is being fetched here");
    storeAdminRepo
      .getStores(req.query, req.headers.language, req.headers.geofenceid)
      .then((result) => {
        return res.success("", result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .delete((req, res) => {
    storeAdminRepo
      .deleteStore(req.query, req.headers.language)
      .then((result) => {
        return res.success("", result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  });

storeAdminRoutes
  .route("/outlet")
  .post((req, res) => {
    storeAdminRepo
      .addStoreOutlet(req.body, req.headers)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .put((req, res) => {
    storeAdminRepo
      .editStoreOutlet(req.body, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  });

storeAdminRoutes
  .route("/common/setting")
  .post((req, res) => {
    storeAdminRepo
      .addSetting(req.body, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .put((req, res) => {
    storeAdminRepo
      .editSetting(req.body, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  })
  .get((req, res) => {
    storeAdminRepo
      .getSetting(req.body, req.headers.language)
      .then((result) => {
        return res.success(result.message, result.data);
      })
      .catch((err) => {
        return res.reject(err.message);
      });
  });

storeAdminRoutes.route("/orders/all").get((req, res) => {
  storeAdminRepo
    .getAllOrders(req.query, req.headers)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes.route("/cloneProduct").post((req, res) => {
  storeAdminRepo
    .cloneProduct(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes.route("/updateCloneProducts").post((req, res) => {
  storeAdminRepo
    .updateCloneProducts(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes.route("/getStoreInventory").post((req, res) => {
  storeAdminRepo
    .getStoreInventory(req.body, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});
storeAdminRoutes.route("/getCategories").get((req, res) => {
  storeAdminRepo
    .getCategories(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});
storeAdminRoutes.route("/getMerchantAllSubCategories").get((req, res) => {
  storeAdminRepo
    .getMerchantAllSubCategories(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});
storeAdminRoutes.route("/revenue/store").get((req, res) => {
  storeAdminRepo
    .getStoreRevenue(req.query)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes.route("/outlet/:id").get((req, res) => {
  storeAdminRepo
    .getStoreOutlet(req.params.id, req.headers.language)
    .then((result) => {
      return res.success("", result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes.route("/typebyid/:id").get((req, res) => {
  storeAdminRepo
    .getAllStoreTypeById(req.params.id, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes.route("/category/:categoryId").get((req, res) => {
  storeAdminRepo
    .getCategoryById(req.params.categoryId, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes.route("/getProductStoreTypes").get((req, res) => {
  storeAdminRepo
    .getProductStoreTypes(req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes.route("/storeType/:storeTypeId").get((req, res) => {
  storeAdminRepo
    .getCategoryByStoreTypeId(req.params.storeTypeId, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes.route("/itembyid/:id").get((req, res) => {
  storeAdminRepo
    .getAllStoreItemById(req.params.id, req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes.route("/order/:id").get((req, res) => {
  storeAdminRepo
    .getOrderById(req.params.id, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes.route("/:id").get((req, res) => {
console.log("Inside storeAdminRoutes");
  storeAdminRepo
    .getStoreById(req.params.id, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});

storeAdminRoutes.delete("/varient", storeAdminRepo.deleteVarient);
storeAdminRoutes.route("/store-enum-type-list").get((req, res) => {
  storeAdminRepo
    .storeEnumValues(req.query, req.headers.language)
    .then((result) => {
      return res.success(result.message, result.data);
    })
    .catch((err) => {
      return res.reject(err.message);
    });
});
storeAdminRoutes.post("/changeArrangingOrder",storeAdminRepo.changeArrangingOrder);
storeAdminRoutes.post("/payHistory",storeAdminRepo.getPayHistory);


export default storeAdminRoutes;
