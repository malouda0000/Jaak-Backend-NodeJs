let constant = {
  TRUE: true,
  FALSE: false,
  LIMIT: 10,
  SUCCESSCODE: 200,
  ERRORCODE: 400,
  TRUEMSG: "Successful",
  FALSEMSG: "Something went wrong please try again later.",
  TOKENMISSING: "Authorization missing",
  TOKENNOTCORRECT: "Authorization not correct",
  PARAMETERMISSING: "Parameters missing.",
  WRONGENTRY: "Input is not valid",
  NOACCOUNTMSG: "No account associated with this phone number",
  WRONGOLDPASSWORD: "Old password is not correct",
  SENTMSG: "Sent successfully",
  OTPSEND: "Otp sent successfully",
  PHONEREQU: "Phone number required",
  COUNTRYCODEREQ: "Country code required",
  OPTREQ: "Otp required",
  ADDMSG: "Added successfully",
  UPDATEMSG: "Updated successfully",
  DELETEMSG: "Deleted successfully",
  STORETYPEEXITS: "Merchant Type already exists with this name",
  PASSCHANGEMSG: "Password changed successfully",
  INVALIDPARAMS: "Plese check your credentials and try again!",
  NOTREGISTEREDEMAIL: "This email not registered with any account",
  NOTREGISTEREDPHONE: "This phone number not registered with any account",
  SOCIALREGISTERMSG:
    "Account created with social account you can not reset password",
  PHONEEXISTS: "Phone number associated with another account",
  EMAILEXISTS: "Email already associated with another account",
  VEHICLENUMBEREXISTS: "Vehicle Number already registered",
  FOODCATEXISTS: "Food category already exists with this name.",
  FOODITEMEXISTS: "Food item already exists with this name.",
  ADDONSEXISTS: "AddOns already exists with this name.",
  RESTAURANTEXISTS: "Restaurant already exists with this name.",
  CANNOTCANCEL: "You can not cancel this order",
  STORECATEXISTS: "Store category already exists with this name.",
  STOREITEMEXISTS: "Store item already exists with this name.",
  STOREEXISTS: "Store already exists with this name.",
  NEWPASSSAME: "New password can not same as old password.",
  OLDPASSMSG: "Old password not correct.",

  PROMOEXISTS: "Promocode already created with this code",
  CODENOTEXISTSNOW: "Promocode not applicable now",
  INVALIDCODE: "Applied promocode is not correct",
  RATEDMSG: "Rated successfully",
  MARKFAVMSG: "Marked favourite successfully",
  UNMARKFAVMSG: "Removed from favourite successfully",
  ORDERPLACED: "Order placed successfully",
  NOTDELIVERHERE: "Restaurant do not deliver here",
  ERRMSG: "Something went wrong please try again later.",
  LATEMSG: "Oops You are late, You can not accept this request",
  FILEMSG: "Image not provided",
  BASEURL: "http://13.232.208.65:9000",

  //Taxi
  NODRIVER: "No driver found near to you. Please try latter",
  USERONBOOKING: "User On have picked another ride",

  //Images Url
  USERIMAGE: "/static/users/",

  FOODCATIMAGE: "/static/foodCategory/",
  RESTAURANTIMAGE: "/static/restaurants/",
  FOODITEMIMAGE: "/static/foodItems/",

  DRIVERIMAGE: "/static/drivers/",
  VEHICLETYPEIMAGE: "/static/vehicleTypes/",
  DRIVERDOCUMENTSIMAGE: "/static/driverDocuments/",
  PATHIMAGES: "/static/pathImages/",

  STORECATIMAGE: "/static/storeCategory/",
  STOREIMAGE: "/static/stores/",
  STOREITEMIMAGE: "/static/storeItems/",

  RADIUSCIRCLE: 10000,
  DRIVERRADIUS: 100000,
  LIMIT: 12,
  ADMINLIMIT: 10,

  RADIUSCIRCLE: 10000,
  DRIVERRADIUS: 10000,
  LIMIT: 12,

  // DRIVER:
  VEHICLETYPEEXISTS: "Vehicle category already added",

  // DRIVER:
  VEHICLETYPEEXISTS: "Vehicle category already added",
  //stuttle
  ALREADYEXIST: " already exists.",
  BOOKING_STATUS: {
    DEFAULT: 0,
    PENDING: 1,
    ACCEPTED: 2,
    COMPLETED: 3,
    ARRIVED: 4,
    STARTED: 6,
    ONGOING: 7,
    CANCELED: 8,
    OUT_FOR_DELIVERY: 9,
    PACKAGES_PICKED: 10,
    TRANSIT: 11,
    PARTIAL: 12,
    UPCOMING: 13,
    SCHEDULED: 15,
    ARRIVED_AT_PICKED: 16,
    PICKED: 17,
    ARRIVED_AT_DROPED: 19,
    DROPED: 20,
    START_RETURN: 21,
    END_RETURN: 22,
    AVAILABLE: 23,
    NOT_AVAILABLE: 24,
    NONE: 25,
    FUTURE: 26
  },
  BOOKING_TYPE: {
    RIDE: 1,
    DELIVERY: 2,
    DEFAULT: 0
  },
  PAYMENT_MODE: {
    CASH: 1,
    CARD: 2,
    WALLET: 3
  },
  PAYMENT_STATUS: {
    PENDING: 1,
    COMPLETED: 2,
    CANCEL: 3,

  },
};

export default constant;
