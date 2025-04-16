// userModel.js
const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    nic: { type: String, required: true, unique: false },
    fName: { type: String, required: false },
    lName: { type: String, required: false },
    contact: { type: String, required: false },
    email: { type: String, required: true, unique: true, validate: [validator.isEmail, "Please provide a valid email"]},
    password: { type: String, required: true },
    passwordconfirm: {
      type: String,
      required: false,
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "Password are not same",
      },
    },
    isVerify: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    resetPasswordOTP: { type: String, default: null },
    resetPasswordOTPExpires: { type: Date, default: null },
    profilePicLink: { type: String, required: false, default: null },
    address: { type: String, required: false },
    district: { type: String, required: false },
    province: { type: String, required: false },
    city: { type: String, required: false },
  },
  { timestamps: true }
);


module.exports=mongoose.model("User",userSchema);



// ParcelSchema


