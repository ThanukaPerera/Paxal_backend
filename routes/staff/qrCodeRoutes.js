const express = require("express");
const router = express.Router();
const { authenticateStaff } = require("../../middleware/adminMiddleware/authMiddleware");
const { scanQRCode } = require("../../controllers/staff/qrAndTrackingNumber");

router.put("/update-to-parcel-arrived", authenticateStaff, scanQRCode);

module.exports = router;
