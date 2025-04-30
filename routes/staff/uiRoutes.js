const express = require("express");
const router = express.Router();
const { getAllBranches, getStaffInformation } = require("../../controllers/staff/uiControllers");
const { authenticateStaff } = require("../../middlewares/authMiddleware");

// get branches for the brnach selector in parcel registartion form
router.get("/branches", getAllBranches);

// get logged in staff information - navigation bar
router.get("/get-staff-information", authenticateStaff, getStaffInformation);

module.exports = router;