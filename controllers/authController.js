const catchAscync = require("../utils/catchAscync");
const generateOtp = require("../utils/generateOtp");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/email.js");
const User = require("../models/userModel.js");
const user = require("../models/userModel.js");
const AppError = require("../utils/appError.js");
const hashPassword = require("../utils/hashPassword");
const comparePassword = require("../utils/comparePassword");

const dotenv = require("dotenv");
dotenv.config();

exports.getUserProfile = catchAscync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select(
    "-password -otp -otpExpires",
  );

  if (!user) return next(new AppError("User not found", 404));

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

exports.updateUserProfile = catchAscync(async (req, res, next) => {
  const filteredBody = {
    fName: req.body.fName,
    lName: req.body.lName,
    email: req.body.email,
    address: req.body.address,
    nic: req.body.nic,
    contact: req.body.contact,
    province: req.body.province,
    district: req.body.district,
    city: req.body.city,
  };

  if (req.body.profilePicBase64) {
    filteredBody.profilePic = req.body.profilePicBase64;
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  }).select("-password -otp -otpExpires");

  res.status(200).json({
    status: "success",
    data: { user: updatedUser },
  });
});

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res, message) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };

  res.cookie("token", token, cookieOptions);

  user.password = undefined;
  user.otp = undefined;

  res.status(statusCode).json({
    status: "success",
    message,
    token,
    data: { user },
  });
};

exports.signup = catchAscync(async (req, res, next) => {

  if (!req.body.email || !req.body.password || !req.body.passwordconfirm) {
    return next(new AppError("Please provide all required fields", 400));
  }
  const {
    email,
    password,
    passwordconfirm,
    fName,
    lName,
    address,
    nic,
    contact,
    province,
    district,
    city,
  } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) return next(new AppError("Email already registered!", 400));

  if (password !== passwordconfirm) {
    return next(new AppError("Passwords do not match", 400));
  }

  const hashedPassword = await hashPassword(password);
  const otp = generateOtp();
  const otpExpires = Date.now() + 24 * 60 * 60 * 1000;

  const newUser = await User.create({
    userId: `user-${Date.now()}`,
    fName,
    lName,
    email,
    password: hashedPassword,
    otp,
    otpExpires,
    address,
    contact,
    district,
    nic,
    province,
    city,
  });

  console.log("New user created:", newUser);
  try {
    const emailResult = await sendEmail({
      email: newUser.email,
      subject: "OTP For Email Verification",
      html: `<h1>Your OTP is: ${otp}</h1>`,
    });

    createSendToken(newUser, 200, res, "Registration Successful!");
  } catch (error) {
    await User.findByIdAndDelete(newUser._id);
    console.error("Error sending email:", error);
    return next(new AppError("There was an error sending the email.", 500));
  }
});

exports.verifyAccount = catchAscync(async (req, res, next) => {
  const { otp } = req.body;
  if (!otp) return next(new AppError("OTP is missing", 400));

  const user = req.user;

  if (user.otp !== otp) return next(new AppError("Invalid OTP", 400));

  if (Date.now() > user.otpExpires)
    return next(
      new AppError("OTP has expired. Please request a new OTP.", 400),
    );

  user.isVerify = true;
  user.otp = undefined;
  user.otpExpires = undefined;

  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res, "Email has been verified!");
});

exports.resendOTP = catchAscync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) return next(new AppError("Email is required to resend OTP", 400));

  const user = await User.findOne({ email });
  if (!user) return next(new AppError("User not found", 404));
  if (user.isVerify)
    return next(new AppError("This account is already verified!", 400));

  const newOtp = generateOtp();
  user.otp = newOtp;
  user.otpExpires = Date.now() + 24 * 60 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({
      email: user.email,
      subject: "Resend OTP for Email Verification",
      html: `<h1>Your OTP is: ${newOtp}</h1>`,
    });

    res.status(200).json({
      status: "success",
      message: "A new OTP has been sent to your email.",
    });
  } catch (error) {
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError("There was an error sending the email.", 500));
  }
});

exports.login = catchAscync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new AppError("Please provide email and password!", 400));

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await comparePassword(password, user.password)))
    return next(new AppError("Incorrect Email or Password", 401));

  createSendToken(user, 200, res, "Login Successful!");
});

exports.logout = catchAscync(async (req, res, next) => {
  res.cookie("token", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  res.status(200).json({
    status: "success",
    message: "Logged Out Successfully!",
  });
});

exports.forgetPassword = catchAscync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return next(new AppError("User not found", 404));

  const otp = generateOtp();
  user.resetPasswordOTP = otp;
  user.resetPasswordOTPExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({
      email: user.email,
      subject: "Your Password Reset OTP (valid for 5 minutes)",
      html: `<h1>Your reset OTP is: ${otp}</h1>`,
    });

    res.status(200).json({
      status: "success",
      message: "Password reset OTP sent to your email.",
    });
  } catch (error) {
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError("There was an error sending the email."));
  }
});

exports.resetPassword = catchAscync(async (req, res, next) => {
  const { email, otp, password, passwordconfirm } = req.body;

  const user = await User.findOne({
    email,
    resetPasswordOTP: otp,
    resetPasswordOTPExpires: { $gt: Date.now() },
  });

  if (!user) return next(new AppError("No user found or OTP expired", 400));

  if (password !== passwordconfirm)
    return next(new AppError("Passwords do not match", 400));

  user.password = await hashPassword(password);
  user.resetPasswordOTP = undefined;
  user.resetPasswordOTPExpires = undefined;

  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res, "Password Reset Successful!");
});
