// ============================================
// routes/admin/profile.js (Profile routes)
// ============================================
const express = require("express");
const router = express.Router();

// Middleware
const {authenticateAdmin} = require("../../middleware/adminMiddleware/authMiddleware");
const adminImageUpload = require("../../middleware/adminMiddleware/adminImageUpload");

// Controllers
const getMyData = require("../../controllers/adminControllers/adminProfile/getMyData");
const storingDatabase = require("../../controllers/adminControllers/adminProfile/imageUpload/adminProfileUpdate");
const {
  validateProfileUpdate,
  updateMyData,
} = require("../../controllers/adminControllers/adminProfile/updateMyData");

// Profile Routes
router.get("/", authenticateAdmin, getMyData);
router.post("/upload", authenticateAdmin, adminImageUpload, storingDatabase);
router.patch("/update", authenticateAdmin, ...validateProfileUpdate, updateMyData);

module.exports = router;