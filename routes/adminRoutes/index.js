
// routes/admin/index.js (Main admin routes file)
const express = require("express");
const router = express.Router();

// Import sub-route modules
const authRoutes = require("./auth");
const dashboardRoutes = require("./dashboard");
const userAccountsRoutes = require("./userAccounts");
const parcelRoutes = require("./parcels");
const shipmentRoutes = require("./shipments");
const profileRoutes = require("./profile");
const branchRoutes = require("./branches");
const vehicleRoutes = require("./vehicles");
const adminManagementRoutes = require("./adminManagement");

// Use sub-routes
router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/users", userAccountsRoutes);
router.use("/parcels", parcelRoutes);
router.use("/shipments", shipmentRoutes);
router.use("/profile", profileRoutes);
router.use("/branches", branchRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/management", adminManagementRoutes);


module.exports = router;