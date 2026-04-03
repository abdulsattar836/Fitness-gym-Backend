const Joi = require("joi");

const signupUserValidation = Joi.object({
  fname: Joi.string().trim().min(1).required(),
  lname: Joi.string().trim().min(1).required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]+$/)
    .required(), // now accepts string of digits
  password: Joi.string().required(),
  Cpassword: Joi.string().optional(),
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
