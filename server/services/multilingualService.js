const english = require('../v1/controllers/languages/english');
const arabic = require('../v1/controllers/languages/arabic');
const constant = require('../constant');
// const model = require('../models/index');

const LANGUAGES = {
  ENGLISH: 'en',
  ARABIC: 'ar'
};

const languageArray = Object.keys(LANGUAGES).map(function (key) {
  return LANGUAGES[key];
});

exports.getResponseMessage = getResponseMessage;
exports.LANGUAGES = LANGUAGES;

function getResponseMessage(code, language) {
  let response = "";
  switch (language) {
    case LANGUAGES.ENGLISH:
      response = english.responseMessages[code];
      break;
    case LANGUAGES.ARABIC:
      response = arabic.responseMessages[code];
      break;
    default:
      response = english.responseMessages[code];
  }
  if (!response) {
    response = english.responseMessages[code] || " ";
  }
  return response;
}

exports.sendResponse = async ( req, res, value, isUser, logout, message, data) => {
  try {
      // const lang=req.headers['content-language'] || constant.LANGUAGES.ENGLISH
      message = message || "";
      data = data || {};
      return res.send({
        response:{
          success: value,
          isUser: isUser,
          logout: logout,
          message: message},
          data: data
      });
  } catch (error) {
      throw error;
  }
};

// function getResponseMessageViaModel(code, language) {
//   const message = await model.Language.aggregate([
//   {
//       $match: {"languageName": language}
//   },
//  {
//       $unwind: '$language'
//   },
//   {
//       $match: {"language.key" : code }
//   },
//   {
//       $group: {dealExist
//   },
//   {
//       $unwind: '$values'
//   },
  
// ])
// return message.values
// }
