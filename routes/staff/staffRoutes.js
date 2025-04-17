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
const authenticateStaff = require("../../middlewares/authMiddleware");

// AUTHENTICATE STAFF
router.get("/status", authenticateStaff, checkAuthenticity);

// STAFF LOGIN
router.post("/login", staffLogin);

// STAFF LOGOUT
router.post("/logout", authenticateStaff, staffLogout);

// STAFF FORGOT PASSWORD
router.post("/forgot-password", staffForgotPassword);

// PASSWORD RESET CODE
router.post("/verify-reset-code", staffPasswordResetCode);

// PASSWORD UPDATE
router.post("/reset-password", staffPasswordUpdate);

router.get("/staffMainMenu", authenticateStaff, getStaffLoggedPage);

module.exports = router;
