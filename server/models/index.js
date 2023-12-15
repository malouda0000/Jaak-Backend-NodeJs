import admin from "./admin";
import user from "./user";
import Otp from "./Otp";
import address from "./address";
import promocode from "./promocode";
import notification from "./notification";
import message from "./message";
import Cms from "./cms";
import AdminSetting from "./adminSetting";
import Banner from "./Banner";
import AppSetting from "./appSetting";
import AccessModule from "./AccessModule";
import BroadCastNotification from "./BroadCastNotifications";
import TimeSlot from "./timeSlots";
import Transaction from "./transaction";
import DriverOtp from "./driver/driverotp";

// restaurant
import foodCategory from "./restaurant/foodCategory";
import restaurant from "./restaurant/restaurants";
import restaurantOutlet from "./restaurant/restaurantOutlets";
import foodType from "./restaurant/restaurantFoodType";
import foodItem from "./restaurant/foodItems";
import restaurantRating from "./restaurant/restaurantRating";
import favRestaurant from "./restaurant/favRestaurants";
import restaurantSetting from "./restaurant/restaurantSetting";
import restaurantOrder from "./restaurant/restaurantOrder";
import addOns from "./addOns";
import addOnCart from "./addOnCart";

// Store
import storeCategory from "./store/storeCategory";
import store from "./store/store";
import storeOutlet from "./store/storeOutlets";
import storeType from "./store/storeItemType";
import storeItem from "./store/storeItems";
import storeRating from "./store/storeRating";
import favStore from "./store/favStore";
import storeSetting from "./store/storeSetting";
import storeOrder from "./store/storeOrder";
import brand from "./store/storeBrand";
import favProduct from "./store/favProduct";
import storeCart from "./store/storeCart";
import storeItemRating from "./store/storeItemsRating";
import Subscription from "./store/subscription";
import SubAdmin2 from "./subAdmin";
import InventoryLog from "./store/productInventoryLog"


// Ecommerce
import storeCategoryEcommerce from "./ecommerce/storeCategoryEcommerce";
import storeEcommerce from "./ecommerce/storeEcommerce";
import storeOutletsEcommerce from "./ecommerce/storeOutletsEcommerce";
import otpEcommerceStore from "./ecommerce/otpEcommerceStore";
import storeItemsEcommerce from "./ecommerce/storeItemsEcommerce";
import storeSettingEcommerce from "./ecommerce/storeSettingEcommerce";
import storeOrderEcommerce from "./ecommerce/storeOrderEcommerce";
import storeBrandEcommerce from "./ecommerce/storeBrandEcommerce";
import favProductEcommerce from "./ecommerce/favProductEcommerce";
import storeCartEcommerce from "./ecommerce/storeCartEcommerce";
import storeItemsRatingEcommerce from "./ecommerce/storeItemsRatingEcommerce";
import storeItemTypeEcommerce from "./ecommerce/storeItemTypeEcommerce";
import productInventoryLogEcommerce from "./ecommerce/productInventoryLogEcommerce";

//driver
import driver from "./driver/driver";
import vehicleType from "./driver/vehicleType";
import driverDocument from "./driver/driverDocuments";
import driverRequest from "./driver/driverRequests";
import driverRating from "./driver/driverRating";
import driverNotification from "./driver/driverNotification";

//taxi
import taxiBooking from "./taxi/booking";

//finance
import finance from "./finance/financePayment";

//shuttle
import shuttleRoute from "./shuttle/shuttleRoute";
import shuttle from "./shuttle/shuttle";
import location from "./shuttle/location";
import trip from "./shuttle/routeTrip";
import shuttleBooking from "./shuttle/booking";
import vender from "./shuttle/vender";
import SalesPerson from "./store/salesPerson";
import Ticket from "./Ticket";
import Faq from "./faq";
import Promouser from "./promousers";

import StoreCache from "./storeCache";
import DailyUsePromo from "./DailyUsePromo";
import CustomerSupport from "./customerSupport";
import DeliveryBooking from "./delivery/Booking";
import DeliveryAddress from "./delivery/address";
import DeliveryItems from "./delivery/item";
// import Packages from './delivery/package';
// import PackageTypes from './delivery/PackageType'
import geoFence from "./zone/geofence";
import zone from "./zone/zone";
import subAdmin from "./zone/subadmin";
import webSubscription from "./websubscription";
import campaign from "./campaign";
import StoreOtp from "./store/otpStore";
import Gift from "./gift"

import Event from "./event.model";
import Razorpay from "./razorpayData.model"
import BookingRequest from './BookingRequest'
import IntroScreen from './intro.model'
import Transactions from './transactions.model'
import PaymentParties from './paymentParties.model'
import employee from "./store/employee";
import Company from "./company";
import Document from "./document";
import Membership from "./membership"
import language from "./language"
import sendNotification from "./sendNotification";
import Referral from './Referral'
import Preference from './prefrence'
import seo from './SEO'
import merchantNotification from './merchantNotification'
import customerNotification from './customerNotification'
import setReminder from './setReminder'
import payHistory from './payHistory'

let models = {
  paymentParties: PaymentParties,
  transactions: Transactions,
  BookingRequest: BookingRequest,
  introScreen: IntroScreen,
  event: Event,
  razor: Razorpay,
  user: user,
  admin: admin,
  Otp: Otp,
  Cms: Cms,
  CustomerSupport: CustomerSupport,
  address: address,
  notification: notification,
  promocode: promocode,
  message: message,
  AdminSetting: AdminSetting,
  AppSetting: AppSetting,
  TimeSlot: TimeSlot,
  Transaction: Transaction,

  foodCategory: foodCategory,
  restaurant: restaurant,
  restaurantOutlet: restaurantOutlet,
  foodType: foodType,
  foodItem: foodItem,
  restaurantRating: restaurantRating,
  favRestaurant: favRestaurant,
  restaurantSetting: restaurantSetting,
  restaurantOrder: restaurantOrder,
  addOns: addOns,
  // addOnCart: addOnCart, saving it in store cart itself;

  storeCategory: storeCategory,
  store: store,
  storeOutlet: storeOutlet,
  storeItemType: storeType,
  storeItem: storeItem,
  storeRating: storeRating,
  favStore: favStore,
  storeSetting: storeSetting,
  storeOrder: storeOrder,
  brand: brand,
  favProduct: favProduct,
  storeCart: storeCart,
  storeItemRating: storeItemRating,
  finance: finance,
  Subscription: Subscription,
  SubAdmin2: SubAdmin2, // from admin panel - create subAdmin
  driver: driver,
  driverDocument: driverDocument,
  vehicleType: vehicleType,
  driverRequest: driverRequest,
  driverRating: driverRating,
  driverNotification: driverNotification,

  taxiBooking: taxiBooking,

  shuttleRoute: shuttleRoute,
  shuttle: shuttle,
  location: location,
  shuttleBooking: shuttleBooking,
  trip: trip,
  vender: vender,
  BroadCastNotification: BroadCastNotification,

  Banner: Banner,
  DriverOtp: DriverOtp,
  AccessModule: AccessModule,
  SalesPerson: SalesPerson,
  Ticket: Ticket,
  Faq: Faq,
  StoreCache,
  Promouser,
  DailyUsePromo,

  DeliveryAddress: DeliveryAddress,
  DeliveryBooking: DeliveryBooking,
  DeliveryItems: DeliveryItems,
  // Packages : Packages,
  // PackageTypes : PackageTypes,
  Gift: Gift,

  geoFence: geoFence,
  zone: zone,
  subAdmin: subAdmin,
  webSubscription: webSubscription,
  campaign: campaign,
  StoreOtp: StoreOtp,
  employee: employee,
  company: Company,
  document: Document,
  Membership: Membership,
  Language: language,
  InventoryLog: InventoryLog,
  sendNotification: sendNotification,
  Referral: Referral,
  payHistory : payHistory,

  storeCategoryEcommerce: storeCategoryEcommerce,
  storeEcommerce: storeEcommerce,
  storeOutletsEcommerce: storeOutletsEcommerce,
  otpEcommerceStore: otpEcommerceStore,
  storeItemsEcommerce: storeItemsEcommerce,
  storeSettingEcommerce: storeSettingEcommerce,
  storeOrderEcommerce: storeOrderEcommerce,
  storeBrandEcommerce: storeBrandEcommerce,
  favProductEcommerce: favProductEcommerce,
  storeCartEcommerce: storeCartEcommerce,
  storeItemsRatingEcommerce: storeItemsRatingEcommerce,
  storeItemTypeEcommerce: storeItemTypeEcommerce,
  productInventoryLogEcommerce: productInventoryLogEcommerce,
  Preference : Preference,
  seo: seo,
  merchantNotification: merchantNotification,
  customerNotification: customerNotification,
  setReminder: setReminder,

};

export default models;