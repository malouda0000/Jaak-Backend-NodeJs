const portNumber = process.env.PORT;
const jwtSecretKey = "iAmCoolDash";
const cryptSecretKey = "iAmCoolDashEncrypt_&&^^(())";
const fcmServerKey = process.env.FCMSERVERKEY;
// dotenv.config();
require("dotenv").config();
const exportUrl = process.env.EXPORTURL;
const exportUrlLive = process.env.EXPORTURLLIVE;
// const sinchCredentials = {
//     servicePlanId: "a976f96e57994f669ac132b4abcdfcdd",
//     apiToken: "Bearer c87ce0639bf842d7aa95343b99244cdf",
//     restApiUrl: "https://sms.api.sinch.com/xms/v1/a976f96e57994f669ac132b4abcdfcdd/batches",
//     fromNumber: "447537404817"
// };

//mazat credentials
const sinchCredentials = {
  servicePlanId: "6287c5935c514ca1baca56d18e573960",
  apiToken: "Bearer 9805955372df43a6b25efb68cdc2684e",
  restApiUrl:
    "https://sms.api.sinch.com/xms/v1/6287c5935c514ca1baca56d18e573960/batches",
  fromNumber: "447537404817",
};
module.exports = {
  port: portNumber,
  SecretKey: jwtSecretKey,
  cryptHash: cryptSecretKey,
  fcmKey: fcmServerKey,
  sinchCredentials: sinchCredentials,
  exportUrl: exportUrl,
  exportUrlLive: exportUrlLive,
};
