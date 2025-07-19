// ============================================
// routes/admin/parcels.js (Parcel routes)
// ============================================
const express = require("express");
const router = express.Router();

// Middleware
const {authenticateAdmin} = require("../../middleware/adminMiddleware/authMiddleware");

// Controllers
const fetchAllParcel = require("../../controllers/adminControllers/fetchAllParcel");
const fetchParcelById = require("../../controllers/adminControllers/Parcel/fetchParcelById");
const trackStatuses = require("../../controllers/adminControllers/Parcel/trackStatuses");

// Parcel Routes
router.get("/", authenticateAdmin, fetchAllParcel);
router.get("/:id", authenticateAdmin, fetchParcelById);
router.get("/track/:parcelId", authenticateAdmin, trackStatuses);

module.exports = router;