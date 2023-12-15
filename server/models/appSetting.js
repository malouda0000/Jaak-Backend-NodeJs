import mongoose, { Schema } from "mongoose";

let introImagesSchema = new Schema({
  title: { type: String },
  image: { type: String },
  description: {
    type: String,
    default:
      "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
  },
});

let appSettingSchema = new Schema(
  {
    colorCodes: {
      type: String,
      default: "#FF5411",
    },
    introImages: {
      type: [introImagesSchema],
    },
    driverIntroImages: {
      type: [introImagesSchema],
    },
    welcomeImageTitle: {
      type: String,
      default: "Welcome",
    },
    welcomeImageDescription: {
      type: String,
      default: "Welcome back",
    },
    splashImage: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },
    contactUsImage: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },
    firstIntroductionImage: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },
    secondIntroductionImage: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },
    thirdIntroductionImage: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },
    supportImage: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },
    welcomeImage: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },
    welcomeBackImage: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },
    congratulationImage: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },
    acceptOrderImage: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },
    trackingRealTimeImage: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },
    earnMoneyImage: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },
    notificationsImage: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },
    homeImage: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },
    currency: {
      type: String,
      default: "INR",
    },
    currency_ar: {
      type: String,
      default: "INR",
    },
    driverPerKmCharge: {
      type: Number,
      default: 10,
    },
    appName: {
      type: String,
      default: "Apptunix",
    },
    adminLogo: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },
    merchantLogo: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },
    appLogo: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },
    driverAppLogo: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },
    favIcon: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },
    splashBackground: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },
    customerHeaderLogo: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },
    driverHeaderLogo: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },

    driverSplashImage: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },
    driverSplashBackground: {
      type: String,
      default:
        "https://gds-storage-prd.s3.amazonaws.com/fusion-360/170518/9558/03acdeff/thumbnails/raasrendering-6e509142-e2b7-4989-90a9-4287bdd1d8fc-3500-3500.jpg",
    },
    website_color_one: {
      type: String,
      default: "#F78E67",
    },
    website_color_two: {
      type: String,
      default: "#FF672E",
    },
    tax: { type: Number, default: 18 },
    email: { type: String, default: "demon.amit6@gmail.com" },
    phoneNumber: { type: String, default: "Number" },
    loyalityPoints: { type: Number, default: 0 },
    loyalityPointsValue: { type: Number, default: 0 },
    showCoupons: { type: Boolean, default: true },
    referralType: { type: String, default: "" },
    referralValue: { type: Number, default: 0 },
    driverRequestLimit: { type: Number, default: 0 },
    loginPageImage: { type: String, default: "" },
    merchantloginPageImage: { type: String, default: "" },
    minimumLoyalityPoints: {
      type: Number,
      default: 0,
    },
    button: {
      color: { type: String, default: "#FF5411" },
      top_left: { type: String, default: "0" },
      top_right: { type: String, default: "0" },
      bottom_left: { type: String, default: "0" },
      bottom_right: { type: String, default: "0" },
    },
    login_activity : { type: String, default: "" },
    signin_activity : { type: String, default: "" },
    signup_activity : { type: String, default: "" },
    otp_activity : { type: String, default: "" },
    welcomeDriverBackImage : { type: String, default: "" },
    driverWelcomeImageTitle : { type: String, default: "" },
    driverWelcomeImageDescription: { type: String, default: "" },
    loyalityPointsType:{type : String,enum:['PRODUCT','ORDER'],default:"PRODUCT"},
    loyalityPointsValueForOrder:{type: Number,default: 1},
    loyalityExpiryDate:{type:Number,default:3},
    andriodGoogleApiKey: { type: String, default: "" },
    andriodGoogleApiKey: { type: String, default: "" },
    iosGoogleApiKey: { type: String, default: "" },
    webappGoogleApiKey: { type: String, default: "" },
    dashboardGoogleApiKey: { type: String, default: "" },
    serverGoogleApiKey: { type: String, default: "" },




    
  },
  { timestamps: true }
);

let AppSetting = mongoose.model("AppSetting", appSettingSchema);

export default AppSetting;
