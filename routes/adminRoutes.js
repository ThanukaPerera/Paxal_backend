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
const forgotPassword = require("../controllers/adminControllers/forgotPassword");
const verifyOTP = require("../controllers/adminControllers/verifyOTP");//importing verifyOTP controller
const resetPassword = require("../controllers/adminControllers/resetPassword");
const fetchNoOfUsers = require("../controllers/adminControllers/fetchNoOfUsers");


// Server route (add this to your backend)
router.get('/status', authenticateAdmin, checkAuthenticity);

// Admin Registration
router.post("/register", authenticateAdmin,registerAdmin);

// Admin Login
router.post("/login", adminLogin);
router.get("/hello",fetchNoOfUsers);
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

router.post("/forgotPassword",forgotPassword);


router.post("/verifyOTP",verifyOTP);

router.post("/reset-password",resetPassword);

router.get("/user/count",fetchNoOfUsers);

const registerDriver=require("../controllers/adminControllers/registerDriver");
const registerStaff=require("../controllers/adminControllers/registerStaff");
const fetchAllStaff=require("../controllers/adminControllers/fetchAllStaff");
const fetchAllDriver=require("../controllers/adminControllers/fetchAllDriver");
router.post("/driver/register",authenticateAdmin,registerDriver);
router.post("/staff/register",authenticateAdmin,registerStaff);
router.get("/staff/all",authenticateAdmin,fetchAllStaff);
router.get("/driver/all",authenticateAdmin,fetchAllDriver);






module.exports = router;
