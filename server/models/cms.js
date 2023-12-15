import mongoose, { Schema } from "mongoose";
let CmsSchema = new Schema(
  {
    termsAndConditions: {
      type: String,
      default: "",
    },
    privacyPolicy: {
      type: String,
      default: "",
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    customerPrivacyPolicy: {
      type: String,
      default: "",
    },
    driverPrivacyPolicy: {
      type: String,
      default: "",
    },
    merchantPrivacyPolicy: {
      type: String,
      default: "",
    },
    aboutUs: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);
let Cms = mongoose.model("Cms", CmsSchema);

export default Cms;
