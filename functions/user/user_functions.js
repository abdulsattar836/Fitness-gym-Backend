// successMessage
const { successMessage } = require("../success/success_functions");
// appError
const AppError = require("../../utils/appError");
// catchAsync
const catchAsync = require("../../utils/catchAsync");

// method POST
// route /api/v1/user/logout:
// @desciption for  logout user
  const logout = (model) =>
    catchAsync(async (req, res, next) => {
      let refreshToken = req.header("Authorization");
      if (!refreshToken) {
        return next(new AppError("refreshToken is required", 400));
      }
      refreshToken = refreshToken.split(" ");
      refreshToken = refreshToken[1];
      const user = await model.findOne({ refreshToken });
      if (!user) {
        return next(new AppError("you are not login", 400));
      }

      await model.updateOne(
        { refreshToken: refreshToken },
        { $pull: { refreshToken: refreshToken } }
      );

      return successMessage(202, res, "logout successfully", null);
    });

module.exports = {
  logout,
};
