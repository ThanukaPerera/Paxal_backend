// ============================================
// routes/admin/userAccounts.js (User account routes)
// ============================================
const express = require("express");
const router = express.Router();

// Middleware
const {authenticateAdmin} = require("../../middleware/adminMiddleware/authMiddleware");

// Controllers
const fetchAllAdmin = require("../../controllers/adminControllers/userAccounts/Tables/fetchAllAdmin");
const registerAdmin = require("../../controllers/adminControllers/userAccounts/UserRegistrations/registerAdmin");
const registerDriver = require("../../controllers/adminControllers/userAccounts/UserRegistrations/registerDriver");
const registerStaff = require("../../controllers/adminControllers/userAccounts/UserRegistrations/registerStaff");
const fetchAllStaff = require("../../controllers/adminControllers/userAccounts/Tables/fetchAllStaff");
const fetchAllDriver = require("../../controllers/adminControllers/userAccounts/Tables/fetchAllDriver");
const fetchAllCustomers = require("../../controllers/adminControllers/userAccounts/Tables/fetchAllCustomers");
const fetchNoOfUsers = require("../../controllers/adminControllers/fetchNoOfUsers");
const fetchCustomerById = require("../../controllers/adminControllers/userAccounts/Tables/TableSelections/fetchCustomerById");
// const fetchStaffById = require("../../controllers/adminControllers/userAccounts/Tables/fetchStaffById");
// const fetchDriverById = require("../../controllers/adminControllers/userAccounts/Tables/fetchDriverById");
// const fetchAdminById = require("../../controllers/adminControllers/userAccounts/Tables/fetchAdminById");


// User Statistics
router.get("/count", authenticateAdmin, fetchNoOfUsers);

// Registration Routes
router.post("/admin/register", authenticateAdmin, registerAdmin);
router.post("/driver/register", authenticateAdmin, registerDriver);
router.post("/staff/register", authenticateAdmin, registerStaff);

// User Tables
router.get("/customer", authenticateAdmin, fetchAllCustomers);
router.get("/staff", authenticateAdmin, fetchAllStaff);
router.get("/driver", authenticateAdmin, fetchAllDriver);
router.get("/admin", authenticateAdmin, fetchAllAdmin);

// Each user type can have more specific routes added here as needed
router.get("/customer/:id", authenticateAdmin,fetchCustomerById);
// router.get("/staff/:id", authenticateAdmin, fetchStaffById);
// router.get("/driver/:id", authenticateAdmin, fetchDriverById);
// router.get("/admin/:id", authenticateAdmin, fetchAdminById);


module.exports = router;