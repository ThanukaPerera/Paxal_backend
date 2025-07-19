const express = require("express");
const router = express.Router();
const {
  staffLogin,
  staffLogout,
  staffForgotPassword,
  staffPasswordResetCode,
  staffPasswordUpdate,
  getStaffLoggedPage,
  checkAuthenticity,
  updateStaffInfo,
  staffProfilePicUpdate,
} = require("../../controllers/staff/staffControllers");
const {authenticateStaff} = require("../../middleware/adminMiddleware/authMiddleware");
const staffImageUpload = require("../../middleware/staffImageUplaod");

// Authenticate staff member.
router.get("/status", authenticateStaff, checkAuthenticity);

// Staff login.
router.post("/login", staffLogin);

// Staff logout.
router.post("/logout", authenticateStaff, staffLogout);

// Staff forgot password.
router.post("/forgot-password", staffForgotPassword);

// Stff password reset code verification.
router.post("/verify-reset-code", staffPasswordResetCode);

// Staff password update.
router.post("/reset-password", staffPasswordUpdate);

// update staff information
router.put("/update-staff-info", authenticateStaff, updateStaffInfo);

//update staff profile picture
router.post("/profile/upload", authenticateStaff, staffImageUpload, staffProfilePicUpdate);

router.get("/staffMainMenu", authenticateStaff, getStaffLoggedPage);

module.exports = router;
