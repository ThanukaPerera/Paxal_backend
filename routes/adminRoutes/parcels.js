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
const updateParcelStatus = require("../../controllers/adminControllers/Parcel/updateParcelStatus");
const updateParcelDetails = require("../../controllers/adminControllers/Parcel/updateParcelDetails");
const getParcelDropdownData = require("../../controllers/adminControllers/Parcel/getParcelDropdownData");

// Parcel Routes
router.get("/", authenticateAdmin, fetchAllParcel);
router.get("/dropdown-data", authenticateAdmin, getParcelDropdownData);
router.get("/:id", authenticateAdmin, fetchParcelById);
router.get("/track/:parcelId", authenticateAdmin, trackStatuses);
router.put("/:id/status", authenticateAdmin, updateParcelStatus); // Only admin can update status (cancel/return)
router.put("/:id/details", authenticateAdmin, updateParcelDetails);

module.exports = router;