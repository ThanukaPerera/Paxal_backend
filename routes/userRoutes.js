const express = require("express");
const {
  signup,
  verifyAccount,
  resendOTP,
  login,
  logout,
  forgetPassword,
  resetPassword,
  
} = require("../controllers/authController");
const isAuthenticated = require("../middleware/isAuthenticated");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/verify", isAuthenticated, verifyAccount);
router.post("/resend-otp", isAuthenticated, resendOTP);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forget-password", forgetPassword);
router.post("/reset-password", resetPassword);


// Profile routes
router.get("/profile", isAuthenticated, authController.getUserProfile);

router.put("/profile", isAuthenticated, authController.updateUserProfile);

module.exports = router;
