
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
const vehicleScheduleRoutes = require("./vehicleSchedules");
const adminManagementRoutes = require("./adminManagement");
const reportRoutes = require("./reports");
const b2bShipmentRoutes = require("./b2bShipmentRoutes");
const aiRoutes = require("./ai"); // AI insights routes


// Use sub-routes
router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/users", userAccountsRoutes);
router.use("/parcels", parcelRoutes);
router.use("/shipments", shipmentRoutes);
router.use("/profile", profileRoutes);
router.use("/branches", branchRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/vehicle-schedules", vehicleScheduleRoutes);
router.use("/management", adminManagementRoutes);
router.use("/reports",reportRoutes); // Import reports routes
router.use("/b2b-shipments", b2bShipmentRoutes); // B2B shipment management routes
router.use("/ai", aiRoutes); // AI insights and analysis routes



module.exports = router;