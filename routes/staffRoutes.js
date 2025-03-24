const express = require("express");
const router = express.Router();
const {
  addNewStaff,
  staffLogin,
  staffLogout,
  staffForgotPassword,
  staffPasswordResetCode,
  staffPasswordUpdate,
  getStaffLoggedPage,
  checkAuthenticity,
} = require("../controllers/staffControllers");
const authenticateStaff = require("../middlewares/authMiddleware");

// AUTHENTICATE STAFF
router.get("/status", authenticateStaff, checkAuthenticity);

// ADD STAFF
router.post("/register", authenticateStaff, addNewStaff);

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
