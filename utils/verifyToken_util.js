// catch async
const catchAsync = require("../utils/catchAsync");
// jwt
const JWT = require("jsonwebtoken");
// app error
const AppError = require("./appError");
// random digit
const {
  generateRandomString,
} = require("../functions/randomDigit/randomDigit_functions");
// success message
const { successMessage } = require("../functions/success/success_functions");
const signRefreshToken = (uniqueId) => {
  return JWT.sign({ uniqueId }, process.env.JWT_SEC, {
    expiresIn: process.env.expirydateRefreshToken,
  });
};
const signAccessToken = (id, uniqueId) => {
  return JWT.sign({ id, uniqueId }, process.env.JWT_SEC, {
    expiresIn: process.env.expirydateAccessToken,
  });
};
const generateAccessTokenRefreshToken = (userId) => {
  const uniqueId = generateRandomString(10);
  const refreshToken = signRefreshToken(uniqueId);
  const accessToken = signAccessToken(userId, uniqueId);
  return { refreshToken, accessToken };
};
// Verify token and admin
const verifyToken = (model) => async (req, res, next) => {
  try {
    let token = req.header("Authorization");
    if (!token) {
      return next(new AppError("you are not login", 400));
    }
    token = token.split(" ");
    token = token[1];
    const payload = JWT.verify(token, process.env.JWT_SEC);
    let user;
    for (let item of model) {
      user = await item.findOne({
        _id: payload.id,
      });
      if (user) {
        break;
      }
    }
    if (!user) {
      return next(new AppError("Invalid user", 401));
    }
    if (user.isBlock) {
      return next(new AppError("you are block", 401));
    }
    //console.log(user)
    const payloadunique = [];
    // Create an array of promises to verify each token
    const verifyTokenPromises = await Promise.all(
      user.refreshToken.map(async (item) => {
        try {
          const payload = JWT.verify(item, process.env.JWT_SEC);
          payloadunique.push(payload.uniqueId);
        } catch (error) {
          for (let item of model) {
            // If the token is invalid, remove it from the array
            await item.findOneAndUpdate(
              {
                _id: user._id,
              },
              {
                $pull: {
                  refreshToken: item,
                },
              },
            );
          }
        }
      }),
    );

    // accessToken is Valid or not
    if (!payloadunique.includes(payload.uniqueId)) {
      return next(new AppError("Invalid Token", 401));
    }

    // Execute all promises in parallel
    await Promise.all(verifyTokenPromises);
    try {
      const verified = JWT.verify(token, process.env.JWT_SEC);
      req.fullUser = user;
      user = { id: verified.id };
      req.user = user;
      next();
    } catch (error) {
      console.log(error);
      return next(new AppError("Invalid Token", 401));
    }
  } catch (error) {
    return next(new AppError(error, 401));
  }
};

// method POST
// route /api/v1/user/refresh-token:
// @desciption for  apply refreshToken to generate AccessToken
const refreshToken = (model) =>
  catchAsync(async (req, res, next) => {
    let refreshToken = req.header("Authorization");
    if (!refreshToken) {
      return next(new AppError("you are not login", 400));
    }
    refreshToken = refreshToken.split(" ");
    refreshToken = refreshToken[1];

    // Retrieve the user from the database based on the refresh token
    let user = await model.findOne({ refreshToken: refreshToken });

    if (!user) {
      throw new Error("you are not login");
    }
    let { uniqueId } = JWT.verify(refreshToken, process.env.JWT_SEC);
    if (!uniqueId) {
      throw new Error("you are not login");
    }
    const { refreshToken: refreshTokenis, accessToken } =
      generateAccessTokenRefreshToken(user._id);
    user.refreshToken.push(refreshTokenis);
    await user.save();
    await user.updateOne(
      {
        refreshToken,
      },
      {
        $pull: {
          refreshToken,
        },
      },
    );

    user.refreshToken = undefined;
    user.password = undefined;

    return successMessage(202, res, "refresh token run successfully", {
      accessToken,
      refreshToken: refreshTokenis,
      ...JSON.parse(JSON.stringify(user)),
    });
  });

module.exports = {
  generateAccessTokenRefreshToken,
  verifyToken,
  refreshToken,
};
