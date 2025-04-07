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

const forgotPassword = require("../controllers/adminControllers/forgotPassword");
const verifyOTP = require("../controllers/adminControllers/verifyOTP"); //importing verifyOTP controller
const resetPassword = require("../controllers/adminControllers/resetPassword");
const fetchNoOfUsers = require("../controllers/adminControllers/fetchNoOfUsers");

// Server route (add this to your backend)
router.get("/status", authenticateAdmin, checkAuthenticity);

// Admin Registration
router.post("/register", authenticateAdmin, registerAdmin);

// Admin Login
router.post("/login", adminLogin);
router.get("/hello", fetchNoOfUsers);
//Admin Logout
router.post("/logout", authenticateAdmin, adminLogout);

// Get all admins
router.get("/all", authenticateAdmin, fetchAllAdmin);

//Get an admin by adminId
router.get("/:adminId", authenticateAdmin, findAdminById);

//Update an admin by adminId
router.put("/update/:adminId", authenticateAdmin, updateAdminById);

// Delete an admin by adminId
router.delete("/delete/:adminId", authenticateAdmin, deleteAdminById);
const getParcelCountByStatus = require("../controllers/adminControllers/getParcelCountByStatus");
// Fetch Chart Data
router.get("/pieChart/data", authenticateAdmin, getParcelCountByStatus);

router.post("/forgotPassword", forgotPassword);

router.post("/verifyOTP", verifyOTP);

router.post("/reset-password", resetPassword);

router.get("/user/count",authenticateAdmin, fetchNoOfUsers);

const registerDriver = require("../controllers/adminControllers/registerDriver");
const registerStaff = require("../controllers/adminControllers/registerStaff");
const fetchAllStaff = require("../controllers/adminControllers/fetchAllStaff");
const fetchAllDriver = require("../controllers/adminControllers/fetchAllDriver");
const fetchAllParcel = require("../controllers/adminControllers/fetchAllParcel");
const barChart = require("../controllers/adminControllers/barChart");

router.post("/driver/register", authenticateAdmin, registerDriver);
router.post("/staff/register", authenticateAdmin, registerStaff);
router.get("/staff/all", authenticateAdmin, fetchAllStaff);
router.get("/driver/all", authenticateAdmin, fetchAllDriver);
router.get("/parcel/all", authenticateAdmin, fetchAllParcel);
router.get("/bar/data", authenticateAdmin, barChart);

const adminImageUpload = require("../middlewares/adminImageUpload");
const storingDatabase = require("../controllers/adminControllers/imageUpload/adminProfileUpdate");
const fetchBranches= require("../controllers/adminControllers/userAccounts/fetchBranches");
router.post("/upload", authenticateAdmin, adminImageUpload, storingDatabase);

router.get("/get/branches",authenticateAdmin, fetchBranches);

module.exports = router;
