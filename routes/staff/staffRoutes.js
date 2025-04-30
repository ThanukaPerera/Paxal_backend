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
} = require("../../controllers/staff/staffControllers");
const {authenticateStaff} = require("../../middlewares/authMiddleware");

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

router.get("/staffMainMenu", authenticateStaff, getStaffLoggedPage);

module.exports = router;
