const express = require("express");
const router = express.Router();

// Middleware
const {authenticateAdmin} = require("../../middleware/adminMiddleware/authMiddleware");

// Admin Controllers
const fetchAllAdmin = require("../../controllers/adminControllers/userAccounts/Tables/fetchAllAdmin");
const adminLogin = require("../../controllers/adminControllers/adminLogin");
const limiter =require("../../middleware/adminMiddleware/limiter");
const checkAuthenticity = require("../../controllers/adminControllers/adminIsAuthenticated");
const registerAdmin = require("../../controllers/adminControllers/registerAdmin");
const adminLogout = require("../../controllers/adminControllers/adminLogout");
const findAdminById = require("../../controllers/adminControllers/findAdminById");
const updateAdminById = require("../../controllers/adminControllers/updateAdminById");
const deleteAdminById = require("../../controllers/adminControllers/deleteAdminById");
const forgotPassword = require("../../controllers/adminControllers/forgotPassword");
const verifyOTP = require("../../controllers/adminControllers/verifyOTP"); //importing verifyOTP controller
const resetPassword = require("../../controllers/adminControllers/resetPassword");
const fetchNoOfUsers = require("../../controllers/adminControllers/fetchNoOfUsers");
const getParcelCountByStatus = require("../../controllers/adminControllers/getParcelCountByStatus");
const registerDriver = require("../../controllers/adminControllers/registerDriver");
const registerStaff = require("../../controllers/adminControllers/registerStaff");
const fetchAllStaff = require("../../controllers/adminControllers/userAccounts/Tables/fetchAllStaff");
const fetchAllDriver = require("../../controllers/adminControllers/userAccounts/Tables/fetchAllDriver");
const fetchAllParcel = require("../../controllers/adminControllers/fetchAllParcel");
const barChart = require("../../controllers/adminControllers/barChart");
const adminImageUpload = require("../../middleware/adminMiddleware/adminImageUpload");
const storingDatabase = require("../../controllers/adminControllers/imageUpload/adminProfileUpdate");
const fetchBranches = require("../../controllers/adminControllers/branches/fetchBranches");
const fetchAllCustomers = require("../../controllers/adminControllers/userAccounts/Tables/fetchAllCustomers");
const getMyData = require("../../controllers/adminControllers/adminProfile/getMyData");
const {
  validateProfileUpdate,
  updateMyData,
} = require("../../controllers/adminControllers/adminProfile/updateMyData");
const fetchVehicles = require("../../controllers/adminControllers/Vehicles/fetchVehicles");
const {
  validateBranch,
  addBranch,
} = require("../../controllers/adminControllers/branches/addBranch");
const fetchShipments = require("../../controllers/adminControllers/shipments/fetchShipments");
const fetchParcelById = require("../../controllers/adminControllers/Parcel/fetchParcelById");
const trackStatuses = require("../../controllers/adminControllers/Parcel/trackStatuses");
const { adminRefreshToken } = require("../../controllers/adminControllers/authentication/adminRefreshToken");

// Server route (add this to your backend)
router.get("/status", authenticateAdmin, checkAuthenticity);

// Admin Registration
router.post("/register", authenticateAdmin, registerAdmin);

// Admin Login
router.post("/login",limiter, adminLogin);
// router.post("/login", adminLogin);

router.post("/refresh",adminRefreshToken)

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

// Fetch Chart Data
router.get("/pieChart/data", authenticateAdmin, getParcelCountByStatus);

router.post("/forgotPassword", forgotPassword);

router.post("/verifyOTP", verifyOTP);

router.post("/reset-password", resetPassword);

router.get("/user/count", authenticateAdmin, fetchNoOfUsers);

router.post("/driver/register", authenticateAdmin, registerDriver);
router.post("/staff/register", authenticateAdmin, registerStaff);
router.get("/staff/all", authenticateAdmin, fetchAllStaff);
router.get("/driver/all", authenticateAdmin, fetchAllDriver);
router.get("/parcel/all", authenticateAdmin, fetchAllParcel);
router.get("/bar/data", authenticateAdmin, barChart);

router.post("/upload", authenticateAdmin, adminImageUpload, storingDatabase);

router.get("/branch/all", authenticateAdmin, fetchBranches);

router.get("/customer/all", authenticateAdmin, fetchAllCustomers);
router.get("/get/mydata", authenticateAdmin, getMyData);

router.patch(
  "/update/profile",
  authenticateAdmin,
  ...validateProfileUpdate,
  updateMyData
);
router.get("/vehicle/all", authenticateAdmin, fetchVehicles);
router.post("/save/branch", authenticateAdmin, validateBranch, addBranch);
router.get("/shipment/all", authenticateAdmin, fetchShipments),
router.get("/parcel/:id", authenticateAdmin, fetchParcelById);
router.get("/track/statuses/:parcelId", authenticateAdmin, trackStatuses);

module.exports = router;
