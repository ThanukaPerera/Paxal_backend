// ============================================
// routes/admin/auth.js (Authentication routes)
// ============================================
const express = require("express");
const router = express.Router();

// Middleware
const {authenticateAdmin} = require("../../middleware/adminMiddleware/authMiddleware");
const limiter = require("../../middleware/adminMiddleware/limiter");

// Controllers
const adminLogin = require("../../controllers/adminControllers/authentication/adminLogin");
const checkAuthenticity = require("../../controllers/adminControllers/authentication/adminIsAuthenticated");
const adminLogout = require("../../controllers/adminControllers/authentication/adminLogout");
const forgotPassword = require("../../controllers/adminControllers/authentication/forgotPassword");
const verifyOTP = require("../../controllers/adminControllers/authentication/verifyOTP");
const resetPassword = require("../../controllers/adminControllers/authentication/resetPassword");
const { adminRefreshToken } = require("../../controllers/adminControllers/authentication/adminRefreshToken");
const sendOTPLogged = require('../../controllers/adminControllers/authentication/LoggedIn/sendOTPLogged');
const verifyOTPLogged = require('../../controllers/adminControllers/authentication/LoggedIn/verifyOTPLogged');
const resetPasswordLogged = require('../../controllers/adminControllers/authentication/LoggedIn/resetPasswordLogged');

// Authentication Routes
router.post("/login", limiter, adminLogin);
router.get("/status", authenticateAdmin, checkAuthenticity);
router.post("/refresh", adminRefreshToken);
router.post("/logout", authenticateAdmin, adminLogout);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

// Logged-in user password reset
router.post("/send-otp", authenticateAdmin, sendOTPLogged);
router.post("/verify-otp-logged", authenticateAdmin, verifyOTPLogged);
router.patch("/reset-password-logged", authenticateAdmin, resetPasswordLogged);

module.exports = router;
