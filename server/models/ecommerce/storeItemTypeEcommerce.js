import mongoose, { Schema } from "mongoose";
import Constant from "../../constant";
// store category and sub-category model if isParent true then category else sub-category
let storeItemTypeSchema = new Schema(
  {
    geofenceId: { type: Schema.Types.ObjectId, ref: 'geofence',default : null },
    storeCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "storeCategoryEcommerce",
    },
    isSubCategory: {
      type: Boolean,
      default: false,
    },
    isParent: {
      type: Boolean,
      default: false,
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "storeItemTypeEcommerce",
    },
    name: {
      type: String,
      required: true,
      // unique:
    },
    name_ar: {
      type: String,
      // required: true,
    },
    image: {
      type: String
    },
    date: {
      type: Number,
      select: false,
    },
    tax: {
      type: Number,
      default: 0,
    },
    status: {
      type: Number,
      default: 1, // 0 for disable, 2 for delete
    },
    noChildCategory: {
      type: Boolean,
      default: false,
    },
    moduleKey: {
      type: String,
      // default: false,
    },
    indexAt: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

// storeItemTypeSchema.path("name").validate(function (value, done) {
//   let qry = {};
//   if (this.storeCategoryId)
//     qry = {
//       name: new RegExp("^" + value + "$", "i"),
//       status: { $ne: 2 },
//       storeCategoryId: this.storeCategoryId,
//     };
//   if (this.parentId)
//     qry = {
//       $or: [
//         {
//           name: new RegExp("^" + value + "$", "i"),
//           status: { $ne: 2 },
//           parentId: this.parentId,
//         },
//       ],
//     };
//   return mongoose.model("StoreItemType").countDocuments(qry).exec().then(function (count) {
//     return !count;
//   }).catch(function (err) {
//     throw err;
//   });
// }, Constant.ALREADYEXISTS);

storeItemTypeSchema.path("name").validate(function (value, done) {
  let qry = {};
  if (this.moduleKey) {
    if (this.storeCategoryId)
      qry = {
        name: new RegExp("^" + value + "$", "i"),
        status: { $ne: 2 },
        storeCategoryId: this.storeCategoryId,
        moduleKey: this.moduleKey
      };
  } else {
    if (this.storeCategoryId)
      qry = {
        name: new RegExp("^" + value + "$", "i"),
        status: { $ne: 2 },
        storeCategoryId: this.storeCategoryId,
      };
  }
  if (this.moduleKey) {
    if (this.parentId)
      qry = {
        $or: [
          {
            name: new RegExp("^" + value + "$", "i"),
            status: { $ne: 2 },
            parentId: this.parentId,
            moduleKey: this.moduleKey
          },
        ],
      };
  } else {
    if (this.parentId)
      qry = {
        $or: [
          {
            name: new RegExp("^" + value + "$", "i"),
            status: { $ne: 2 },
            parentId: this.parentId,
          },
        ],
      };
  }
  if (this.parentId)
    qry = {
      $or: [
        {
          name: new RegExp("^" + value + "$", "i"),
          status: { $ne: 2 },
          parentId: this.parentId,
        },
      ],
    };
    if(this.geofenceId){
      qry.geofenceId = this.geofenceId
    }
  return mongoose.model("storeItemTypeEcommerce").countDocuments(qry).exec().then(function (count) {
    return !count;
  }).catch(function (err) {
    throw err;
  });
}, Constant.ALREADYEXISTS);

let storeItemTypeEcommerce = mongoose.model("storeItemTypeEcommerce", storeItemTypeSchema);

export default storeItemTypeEcommerce;
