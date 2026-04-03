// app error
const AppError = require("../utils/appError");
// catchAsync
const catchAsync = require("../utils/catchAsync");
// model
const user_model = require("../Model/vendor_model");
// password encryption
const CryptoJS = require("crypto-js");
// utility functions
const { successMessage } = require("../functions/success/success_functions");
//validate password
const { validatePassword } = require("../utils/validation/validate password");
// validation
const {
  signupUserValidation,
  loginUserValidation,
} = require("../utils/validation/user_joi_validation");
// authorization
const {
  generateAccessTokenRefreshToken,
} = require("../utils/verifyToken_util");
const sendOTPEmail = require("../utils/sendEmail/emailsend");
//

const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
  const expirationTime = new Date().getTime() + 1 * 60 * 1000; // Current time + 1minutes
  return { otp, expirationTime };
};

// method POST
// route /api/v1/user/signup:
// @desciption for signup of user and sendotp
const signUpUser = catchAsync(async (req, res, next) => {
  // Validate request body
  const { error, value } = signupUserValidation.validate(req.body);
  if (error) {
    const errors = error.details.map((el) => el.message);
    return next(new AppError(errors, 400));
  }

  const { fname, lname, email, phoneNumber, password } = value;

  // Check if user already exists
  let existingUser = await user_model.findOne({ email });
  let otpData;
  let encryptPassword;
  let encryptOtp;

  if (existingUser) {
    if (existingUser.isVerified) {
      // User is already verified, prompt to log in
      return next(
        new AppError("You are already signed up, please log in", 400),
      );
    } else {
      // Encrypt the new password
      encryptPassword = CryptoJS.AES.encrypt(
        password,
        process.env.CRYPTO_SEC,
      ).toString();

      // Generate OTP with expiration time
      otpData = generateOTP();
      const expirationTime = new Date().getTime() + 1 * 60 * 1000;
      encryptOtp = CryptoJS.AES.encrypt(
        JSON.stringify({ otp: otpData.otp, expirationTime }),
        process.env.CRYPTO_SEC,
      ).toString();

      existingUser.fname = fname;
      existingUser.lname = lname;
      existingUser.password = encryptPassword;
      existingUser.phoneNumber = phoneNumber;
      // existingUser.location = location;
      existingUser.otp = encryptOtp;
      await existingUser.save();

      // Send OTP email
      await sendOTPEmail(email, otpData.otp);
    }
  } else {
    // Encrypt password
    encryptPassword = CryptoJS.AES.encrypt(
      password,
      process.env.CRYPTO_SEC,
    ).toString();

    // Generate OTP with expiration time
    otpData = generateOTP();
    const expirationTime = new Date().getTime() + 1 * 60 * 1000;
    encryptOtp = CryptoJS.AES.encrypt(
      JSON.stringify({ otp: otpData.otp, expirationTime }),
      process.env.CRYPTO_SEC,
    ).toString();

    // Create a new user with encrypted OTP
    const newUser = await user_model.create({
      fname,
      lname,
      email,
      phoneNumber,
      password: encryptPassword,
      // location,
      otp: encryptOtp,
    });

    // Send OTP email
    await sendOTPEmail(email, otpData.otp);
  }

  return successMessage(
    202,
    res,
    "OTP sent to your email, please verify your account",
    null,
  );
});

// method POST
// route /api/v1/user/login:
// @desciption for login of user
const loginUser = catchAsync(async (req, res, next) => {
  const { error, value } = loginUserValidation.validate(req.body);
  if (error) {
    const errors = error.details.map((el) => el.message);
    return next(new AppError(errors, 400));
  }
  const userExists = await user_model.findOne({
    email: value.email,
  });
  if (!userExists) {
    return next(new AppError("vendor not found", 400));
  }
  if (!userExists.isVerified) {
    return next(new AppError("Email not verified", 400));
  }
  if (userExists.isBlock) {
    return next(new AppError("User is block", 400));
  }
  const hashedPassword = CryptoJS.AES.decrypt(
    userExists.password,
    process.env.CRYPTO_SEC,
  );
  //console.log(hashedPassword);
  const realPassword = hashedPassword.toString(CryptoJS.enc.Utf8);
  if (realPassword !== value.password) {
    return next(new AppError("Incorrect password", 400));
  }
  const { refreshToken, accessToken } = generateAccessTokenRefreshToken(
    userExists._id,
  );
  userExists.refreshToken.push(refreshToken);
  await userExists.save();
  userExists.refreshToken = undefined;
  userExists.password = undefined;
  return successMessage(202, res, "login success", {
    ...JSON.parse(JSON.stringify(userExists)),
    accessToken,
    refreshToken,
  });
});

// method POST
// route /api/v1/user/verifyAccount:
// @desciption for verifying email
const verifyAccount = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  // Validate request
  if (!email || !otp) {
    return next(new AppError("Email and OTP are required", 400));
  }

  // Find user by email
  const user = await user_model.findOne({ email });

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Decrypt OTP and check expiration
  const decryptedOtpData = CryptoJS.AES.decrypt(
    user.otp,
    process.env.CRYPTO_SEC,
  ).toString(CryptoJS.enc.Utf8);
  const { otp: storedOtp, expirationTime } = JSON.parse(decryptedOtpData);

  // Check if OTP has expired
  const currentTime = new Date().getTime();
  if (currentTime > expirationTime) {
    return next(new AppError("Verification code has expired.", 400));
  }

  // Check if user is already verified
  if (user.isVerified) {
    return next(new AppError("User is already verified", 400));
  }

  // console.log("Stored OTP:", storedOtp);
  // console.log("Provided OTP:", otp);

  // Compare OTP
  if (storedOtp !== otp) {
    return next(new AppError("Invalid OTP", 400));
  }

  // Mark user as verified
  user.isVerified = true;
  user.isBlocked = false;
  user.otp = undefined; // Clear OTP after successful verification
  await user.save();

  // Send success response
  return successMessage(200, res, "Email verified successfully");
});

// method GET
// route /api/v1/user/otp-validation:
// @desciption for otp-validation
const otpValidation = catchAsync(async (req, res, next) => {
  const { otp } = req.query;

  if (!otp) {
    return next(new AppError("OTP is required", 400));
  }

  // Find the user who has a forgetPassword field set
  const users = await user_model.find({ forgetPassword: { $exists: true } });

  if (!users || users.length === 0) {
    return next(new AppError("No OTP found for any user.", 400));
  }

  let validUser = null;
  let otpData;

  for (let user of users) {
    try {
      const decrypted = CryptoJS.AES.decrypt(
        decodeURIComponent(user.forgetPassword),
        process.env.CRYPTO_SEC,
      ).toString(CryptoJS.enc.Utf8);

      const data = JSON.parse(decrypted);

      if (data.code == otp) {
        const currentTime = new Date().getTime();
        if (currentTime > data.expirationTime) {
          return next(new AppError("Verification code has expired.", 400));
        }
        validUser = user;
        otpData = data;
        break;
      }
    } catch (err) {
      continue; // skip invalid entries
    }
  }

  if (!validUser) {
    return next(new AppError("Invalid verification code.", 400));
  }

  return successMessage(202, res, "Correct OTP", null);
});

// method POST
// route /api/v1/user/set-password:
// @desciption for setEmailPassword using forgetPassword
const setEmailPassword = (model) =>
  catchAsync(async (req, res, next) => {
    const { email, otp, newPassword } = req.body;
    const check = validatePassword(newPassword);
    if (check.length > 0) {
      return next(new AppError(check, 400));
    }
    const errors = [];

    if (!email) {
      errors.push("Email is required.");
    }

    if (!otp) {
      errors.push("Verification code is required.");
    }

    if (errors.length > 0) {
      return next(new AppError(errors, 400));
    }

    const user = await model.findOne({ email });
    if (!user) {
      return next(new AppError("User not found.", 400));
    }
    const encryptOpts = user.forgetPassword; // Assuming `forgetPassword` contains the encrypted OTP options
    if (!encryptOpts) {
      return next(new AppError("No OTP found for this user.", 400));
    }
    // Decrypt the encrypted options and compare with the user-entered code
    const decrypted = CryptoJS.AES.decrypt(
      decodeURIComponent(encryptOpts),
      process.env.CRYPTO_SEC,
    ).toString(CryptoJS.enc.Utf8);

    let otpData;
    try {
      otpData = JSON.parse(decrypted);
    } catch (error) {
      return next(new AppError("Invalid encrypted options format.", 400));
    }

    const { code, expirationTime } = otpData;

    if (code != otp) {
      return next(new AppError("Invalid verification code.", 400));
    }

    // Check if the OTP has expired
    const currentTime = new Date().getTime();
    if (currentTime > expirationTime) {
      return next(new AppError("Verification code has expired.", 400));
    }

    // Find the user by email

    // console.log("User's OTP state:", user.forgetPassword);
    if (!user.forgetPassword) {
      return next(new AppError("Unable to change password without OTP", 400));
    }
    if (encryptOpts != user.forgetPassword) {
      new AppError("generate otp first", 400);
    }
    // Update the user's password
    user.password = CryptoJS.AES.encrypt(
      newPassword,
      process.env.CRYPTO_SEC,
    ).toString();
    user.forgetPassword = null;
    await user.save();
    return successMessage(202, res, "Password reset successfully.", null);
  });

const getAllUsers = catchAsync(async (req, res, next) => {
  // Fetch users excluding sensitive fields
  const allUsers = await user_model
    .find(query)
    .select("-password -resetToken -refreshToken -otp")
    .sort({ createdAt: -1 });

  // Count total users matching query
  const totalUsers = await user_model.countDocuments(query);

  // Return response with pagination
  return successMessage(200, res, "Users retrieved successfully", {
    users: allUsers,
    ...generatePaginationJSON(pageNumber, totalUsers, pageLimit),
  });
});

module.exports = {
  allUsers,
  signUpUser,
  loginUser,
  otpValidation,
  verifyAccount,
  setEmailPassword,
};
