const express = require("express");
const router = express.Router();

// Middleware
const {authenticateAdmin} = require("../../middleware/adminMiddleware/authMiddleware");


// Admin Controllers
const fetchAllAdmin = require("../../controllers/adminControllers/userAccounts/Tables/fetchAllAdmin");
const adminLogin = require("../../controllers/adminControllers/authentication/adminLogin");
const limiter =require("../../middleware/adminMiddleware/limiter");
const checkAuthenticity = require("../../controllers/adminControllers/authentication/adminIsAuthenticated");
const registerAdmin = require("../../controllers/adminControllers/userAccounts/UserRegistrations/registerAdmin");
const adminLogout = require("../../controllers/adminControllers/authentication/adminLogout");
const findAdminById = require("../../controllers/adminControllers/findAdminById");
const updateAdminById = require("../../controllers/adminControllers/updateAdminById");
const deleteAdminById = require("../../controllers/adminControllers/deleteAdminById");
const forgotPassword = require("../../controllers/adminControllers/authentication/forgotPassword");
const verifyOTP = require("../../controllers/adminControllers/authentication/verifyOTP"); //importing verifyOTP controller
const resetPassword = require("../../controllers/adminControllers/authentication/resetPassword");
const fetchNoOfUsers = require("../../controllers/adminControllers/fetchNoOfUsers");
const getParcelCountByStatus = require("../../controllers/adminControllers/Parcel/getParcelCountByStatus");
const registerDriver = require("../../controllers/adminControllers/userAccounts/UserRegistrations/registerDriver");
const registerStaff = require("../../controllers/adminControllers/userAccounts/UserRegistrations/registerStaff");
const fetchAllStaff = require("../../controllers/adminControllers/userAccounts/Tables/fetchAllStaff");
const fetchAllDriver = require("../../controllers/adminControllers/userAccounts/Tables/fetchAllDriver");
const fetchAllParcel = require("../../controllers/adminControllers/fetchAllParcel");
const barChart = require("../../controllers/adminControllers/Parcel/parcelBarChart");
const adminImageUpload = require("../../middleware/adminMiddleware/adminImageUpload");
const storingDatabase = require("../../controllers/adminControllers/adminProfile/imageUpload/adminProfileUpdate");
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
const registerVehicle = require("../../controllers/adminControllers/Vehicles/registerVehicle");

//Admin Routes

{/*Authentication*/}



//Login
router.post("/login",limiter, adminLogin);
// router.post("/login", adminLogin);

//Admin check logged in
router.get("/status", authenticateAdmin, checkAuthenticity);

//Admin refresh token 15m to 15m
router.post("/refresh",adminRefreshToken)

//Admin Logout
router.post("/logout", authenticateAdmin, adminLogout);

//Forgot password
router.post("/forgotPassword", forgotPassword);

//VerifyOTP
router.post("/verifyOTP", verifyOTP);

//Reset Password
router.post("/reset-password", resetPassword);

{/*Authentication*/}


{/*Dashboard Page Routes*/}

//Pie Chart Data
router.get("/pieChart/data", authenticateAdmin, getParcelCountByStatus);

//Bar Chart Data
router.get("/bar/data", authenticateAdmin, barChart);

{/*Dashboard Page Routes*/}




{/*User Accounts Routes*/}

//User Stat
router.get("/user/count", authenticateAdmin, fetchNoOfUsers);

//Registration
router.post("/register", authenticateAdmin, registerAdmin);
router.post("/driver/register", authenticateAdmin, registerDriver);
router.post("/staff/register", authenticateAdmin, registerStaff);

//Tables
router.get("/customer/all", authenticateAdmin, fetchAllCustomers);
router.get("/staff/all", authenticateAdmin, fetchAllStaff);
router.get("/driver/all", authenticateAdmin, fetchAllDriver);
router.get("/all", authenticateAdmin, fetchAllAdmin);


{/*User Accounts Routes*/}



{/*Parcels*/}

router.get("/parcel/all", authenticateAdmin, fetchAllParcel);

//Single parcel details by Id
router.get("/parcel/:id", authenticateAdmin, fetchParcelById);
router.get("/track/statuses/:parcelId", authenticateAdmin, trackStatuses);
{/*Parcels*/}




{/*Shipments*/}


router.get("/shipment/all", authenticateAdmin, fetchShipments),


{/*Shipments*/}






{/*Profile*/}

router.get("/get/mydata", authenticateAdmin, getMyData);

//Image Upload
router.post("/upload", authenticateAdmin, adminImageUpload, storingDatabase);

//Details Personalization
router.patch("/update/profile",authenticateAdmin,...validateProfileUpdate,updateMyData);

{/*Profile*/}




{/*Branch*/}


router.get("/branch/all", authenticateAdmin, fetchBranches);
router.post("/save/branch", authenticateAdmin, validateBranch, addBranch);

{/*Branch*/}



{/*Vehicle*/}

router.get("/vehicle/all", authenticateAdmin, fetchVehicles);
router.post("/vehicle/register",authenticateAdmin,registerVehicle)

{/*Vehicle*/}



//Get an admin by adminId
router.get("/:adminId", authenticateAdmin, findAdminById);

//Update an admin by adminId
router.put("/update/:adminId", authenticateAdmin, updateAdminById);

// Delete an admin by adminId
router.delete("/delete/:adminId", authenticateAdmin, deleteAdminById);






module.exports = router;
