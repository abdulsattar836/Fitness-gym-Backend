const Joi = require("joi");

const signupUserValidation = Joi.object({
  fname: Joi.string().required(),
  lname: Joi.string().required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.number().required(),
  password: Joi.string().required(),
  Cpassword: Joi.string().optional(),

  // location: Joi.object({
  //   type: Joi.string().valid("Point"),
  //   coordinates: Joi.array().items(Joi.number()).length(2),
  // }).allow(null),
  isVerified: Joi.boolean().default(false),
  otp: Joi.string().allow(null),
});

const loginUserValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  isBlock: Joi.boolean().optional(),
});

module.exports = {
  signupUserValidation,
  loginUserValidation,
};
