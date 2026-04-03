// define route
const express = require("express");
const ROUTE = express.Router();
// model
const user_model = require("../Model/vendor_model");
// controller
const {
  signUpUser,
  loginUser,
  verifyAccount,
  updateProfile,
  otpValidation,
  setEmailPassword,
  getUserProfileAndReviews,
  getAllUsers,
} = require("../Controller/user_controller");
const { logout } = require("../functions/user/user_functions");
const {
  forgetPassword,
  setPassword,
} = require("../functions/password/password_function");
const { refreshToken, verifyToken } = require("../utils/verifyToken_util");
// const { verifyToken } = require("../utils/verifyToken_util");
/**
 * @swagger
 * /api/v1/user/signup:
 *   post:
 *     summary: User sign-up
 *     description: Sign up a new user and send OTP for email verification. If the user is already signed up but not verified, resend the OTP.
 *     tags:
 *       - User/account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fname:
 *                 type: string
 *                 description: User's name
 *                 example: John Doe
 *               lname:
 *                 type: string
 *                 description: User's name
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 description: User's email
 *                 example: johndoe@example.com
 *               phoneNumber:
 *                 type: string
 *                 description: User's phone number
 *                 example: "+1234567890"
 *               password:
 *                 type: string
 *                 description: User's password
 *                 example: "securepassword123"

 *             required:
 *               - name
 *               - email
 *               - phoneNumber
 *               - password
 *     responses:
 *       202:
 *         description: Sign-up successful, please verify your email
 */
ROUTE.route("/signup").post(signUpUser);

/**
 * @swagger
 * /api/v1/user/login:
 *   post:
 *     summary: Log in a user
 *     tags:
 *       - User/account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: sattar15844@gmail.com
 *               password:
 *                 type: string
 *                 example: "securepassword123"
 *                 description: The user's password.
 *     responses:
 *       202:
 *         description: Login successfulk
 */
ROUTE.route("/login").post(loginUser);

/**
 * @swagger
 * /api/v1/user/logout:
 *   post:
 *     summary: Log out a user
 *     description: Removes the refresh token from the user's record to log them out.
 *     tags:
 *       - User/account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       202:
 *         description: Logout successful
 */

ROUTE.route("/logout").post(logout(user_model));

/**
 * @swagger
 * /api/v1/user/verifyAccount:
 *   post:
 *     summary: Verify Account
 *     description: Verified the Account for user email verification
 *     tags:
 *       - User/account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Email verified successfully
 */
ROUTE.route("/verifyAccount").post(verifyAccount);

/**
 * @swagger
 * /api/v1/user/refresh-token:
 *   post:
 *     summary: Refresh the access token
 *     description: Generates a new access token using a valid refresh token.
 *     tags:
 *       - User/account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       202:
 *         description: Refresh token processed successfully
 */

ROUTE.route("/refresh-token").post(refreshToken(user_model));

/**
 * @swagger
 * /api/v1/user/forget-password:
 *   get:
 *     summary: Initiate forgot password process
 *     tags:
 *       - User/account
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's email
 *     responses:
 *       202:
 *         description: OTP sent successfully
 */
ROUTE.route("/forget-password").get(forgetPassword(user_model));

/**
 * @swagger
 * /api/v1/user/otp-validation:
 *   get:
 *     summary: Validate OTP for user email
 *     description: Validates the OTP sent to the user's email. Checks if the OTP is correct and if it has expired. Includes the ability to handle encrypted options.
 *     tags:
 *       - User/account
 *     parameters:
 *       - in: query
 *         name: otp
 *         schema:
 *           type: string
 *         required: true
 *         description: The OTP entered by the user.
 *     responses:
 *       '202':
 *         description: OTP is correct and the user is successfully validated.
 */
ROUTE.route("/otp-validation").get(otpValidation);

/**
 * @swagger
 * /api/v1/user/set-password:
 *   post:
 *     tags:
 *       - User/account
 *     summary: Set a new password after OTP verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               otp:
 *                 type: string
 *                 description: OTP sent to user's email
 *               newPassword:
 *                 type: string
 *                 description: New password
 *               confirmPassword:
 *                 type: string
 *                 description: Confirmation of the new password
 *             required:
 *               - otp
 *               - newPassword
 *               - confirmPassword
 *           example:
 *             otp: "123456"
 *             newPassword: "NewPass123!"
 *             confirmPassword: "NewPass123!"
 *     responses:
 *       200:
 *         description: Password updated successfully
 */
ROUTE.route("/set-password").post(setPassword(user_model));

module.exports = ROUTE;
