const express = require("express");
const router = express.Router();

// Middleware
const authenticateAdmin = require("../middlewares/authMiddleware");

// Admin Controllers
const fetchAllAdmin = require("../controllers/adminControllers/fetchAllAdmin");
const adminLogin = require("../controllers/adminControllers/adminLogin");
const checkAuthenticity = require("../controllers/adminControllers/checkAuthenticity");
const registerAdmin = require("../controllers/adminControllers/registerAdmin");
const adminLogout = require("../controllers/adminControllers/adminLogout");
const findAdminById = require("../controllers/adminControllers/findAdminById");
const updateAdminById = require("../controllers/adminControllers/updateAdminById");
const deleteAdminById = require("../controllers/adminControllers/deleteAdminById");
const fetchChartData = require("../controllers/adminControllers/fetchChartData");



// Server route (add this to your backend)
router.get('/status', authenticateAdmin, checkAuthenticity);

// Admin Registration
router.post("/register", authenticateAdmin,registerAdmin);

// Admin Login
router.post("/login", adminLogin);


//Admin Logout
router.post("/logout", authenticateAdmin, adminLogout);

// Get all admins
router.get("/all", authenticateAdmin,fetchAllAdmin);

//Get an admin by adminId
router.get("/:adminId", authenticateAdmin, findAdminById);

//Update an admin by adminId
router.put("/update/:adminId", authenticateAdmin, updateAdminById);

// Delete an admin by adminId
router.delete("/delete/:adminId", authenticateAdmin,deleteAdminById);

// Fetch Chart Data
router.get("/chart/data",authenticateAdmin,fetchChartData);

module.exports = router;
