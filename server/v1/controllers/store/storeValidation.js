const joi = require("joi");

async function validateSchema(inputs, schema) {
  try {
    const { error, value } = schema.validate(inputs);
    if (error)
      throw error.details ? error.details[0].message.replace(/['"]+/g, "") : "";
    else return false;
  } catch (error) {
    throw error;
  }
}

async function validateSignUp(req, property = "body") {
  let schema = {};
  schema = joi.object().keys({
    phone: joi.string().optional(),
    email: joi.string().optional(),
    password: joi.string().required(),
    confirmPassword: joi.ref("password"),
    verificationType: joi.number().allow(0, 1).required(), //0 For Phone, 1 For email
    country_code: joi.string().allow("", null).optional(),
    moduleKey: joi.string().optional(),
    geofenceId: joi.string().length(24).optional(),
  });
  return await validateSchema(req[property], schema);
}

async function statusChange(req, property = "body") {
  let schema = {};
  schema = joi.object().keys({
    id: joi.string().length(24).required(),
    status: joi.number().allow(0, 1, 2).required(), // 0 for pending, 1 for accepted, 2 for rejected
    type: joi.string().optional(),
  });
  return await validateSchema(req[property], schema);
}

const validateChangePassword = async (req, property = "body", forReset) => {
  let schema = {};
  if (forReset) {
    schema = joi.object().keys({
      password: joi.string().required(),
    });
  } else {
    schema = joi.object().keys({
      oldPassword: joi.string().required(),
      password: joi.string().required(),
    });
  }
  return await validateSchema(req[property], schema);
};

const validateLogIn = async (req, property = "body") => {
  let schema = {};
  schema = joi.object().keys({
    countryCode: joi.string().allow("", null).optional(),
    key: joi.string().required(),
    password: joi.string().required(),
    deviceType: joi.string().optional().valid("ANDROID", "IOS", "WEB"),
    deviceToken: joi
      .string()
      .when("deviceType", { is: "ANDROID", then: joi.string().optional() })
      .concat(
        joi
          .string()
          .when("deviceType", { is: "IOS", then: joi.string().optional() })
          .concat(
            joi
              .string()
              .when("deviceType", {
                is: "WEB",
                then: joi.string().allow("", null).optional(),
              })
          )
      ),
  });
  return await validateSchema(req[property], schema);
};

const validateResetPassword = async (req, property = "body") => {
  let schema = joi.object().keys({
    key: joi.string().optional(),
    phone: joi.string().optional(),
    email: joi.string().optional(),
  });
  return await validateSchema(req[property], schema);
};

module.exports = {
  validateSchema,
  validateSignUp,
  validateLogIn,
  validateResetPassword,
  validateChangePassword,
  statusChange,
};
