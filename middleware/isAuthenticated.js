const jwt = require("jsonwebtoken");
const catchAscync = require("../utils/catchAscync");
const AppError = require("../utils/appError");
const User = require("../models/userModel");

const isAuthenticated = catchAscync(async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next(new AppError("You are not logged in.", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError("The User Belonging to this token does not exit", 401),
    );
  }

  req.user = currentUser;
  next();
});

module.exports = isAuthenticated;
