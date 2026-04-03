// successMessage
const { successMessage } = require("../success/success_functions");
// appError
const AppError = require("../../utils/appError");
// catchAsync
const catchAsync = require("../../utils/catchAsync");
// forgetPassword
const sendForgotOtp = require("../../utils/email Sender/forgot_passwordEmail");
// cryptoJs
const CryptoJS = require("crypto-js");
//validate password
const {
  validatePassword,
} = require("../../utils/validation/validate password");
//

//userPasswordCheck
const userPasswordCheck = (admin, inputPassword) => {
  if (!admin || !admin.password) {
    throw new AppError("Admin password not found", 400);
  }

  let decryptedPassword;
  try {
    const bytes = CryptoJS.AES.decrypt(admin.password, process.env.CRYPTO_SEC);
    decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    throw new AppError("Error decrypting password", 500);
  }

  if (decryptedPassword !== inputPassword) {
    throw new AppError("Incorrect password", 400);
  }
};

// method GET
// route /api/v1/user/forget-password:
// @desciption for  forgetPassword
const forgetPassword = (model) =>
  catchAsync(async (req, res, next) => {
    const { email } = req.query;
    const user = await model.findOne({ email });
    if (user) {
      function generateSixDigitNumber() {
        const min = 100000; // Smallest 6-digit number
        const max = 999999; // Largest 6-digit number
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

      const sixDigitNumber = generateSixDigitNumber();
      const expirationTime = new Date().getTime() + 5 * 60 * 1000; // 5 minutes expiration
      await new sendForgotOtp(email, sixDigitNumber).sendVerificationCode();
      let otp = CryptoJS.AES.encrypt(
        JSON.stringify({
          code: sixDigitNumber,
          expirationTime: expirationTime,
        }),
        process.env.CRYPTO_SEC
      ).toString();
      user.forgetPassword = encodeURIComponent(otp);
      await user.save();
      return successMessage(202, res, null, {
        email,
      });
    } else {
      return next(new AppError("not user with this email", 400));
    }
  });

// method POST
// route /api/v1/user/setpassword:
// @desciption for  set app password
const setPassword = (model) =>
  catchAsync(async (req, res, next) => {
    const { otp, newPassword, confirmPassword } = req.body;

    // 1️⃣ Validate input
    if (!otp || !newPassword || !confirmPassword) {
      return next(
        new AppError(
          "OTP, new password, and confirm password are required.",
          400
        )
      );
    }

    if (newPassword !== confirmPassword) {
      return next(new AppError("Passwords do not match.", 400));
    }

    // Optional: Password strength validation
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      return next(new AppError(passwordErrors.join(", "), 400));
    }

    // 2️⃣ Find all users with forgetPassword field
    const users = await model.find({ forgetPassword: { $exists: true } });
    if (!users || users.length === 0) {
      return next(new AppError("No OTP found for any user.", 400));
    }

    let validUser = null;

    // 3️⃣ Check OTP for each user
    for (let user of users) {
      try {
        const decrypted = CryptoJS.AES.decrypt(
          decodeURIComponent(user.forgetPassword),
          process.env.CRYPTO_SEC
        ).toString(CryptoJS.enc.Utf8);

        const data = JSON.parse(decrypted);

        if (data.code == otp) {
          const currentTime = new Date().getTime();
          if (currentTime > data.expirationTime) {
            return next(new AppError("Verification code has expired.", 400));
          }
          validUser = user;
          break;
        }
      } catch (err) {
        continue; // skip invalid entries
      }
    }

    if (!validUser) {
      return next(new AppError("Invalid OTP.", 400));
    }

    // 4️⃣ Encrypt the new password (same as signUpUser)
    const encryptPassword = CryptoJS.AES.encrypt(
      newPassword,
      process.env.CRYPTO_SEC
    ).toString();

    // 5️⃣ Update password
    validUser.password = encryptPassword;
    validUser.forgetPassword = undefined; // remove OTP
    await validUser.save();

    return successMessage(200, res, "Password updated successfully", null);
  });

module.exports = {
  userPasswordCheck,
  forgetPassword,

  setPassword,
};
