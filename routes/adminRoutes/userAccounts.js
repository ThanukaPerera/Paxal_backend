// ============================================
// routes/admin/userAccounts.js (User account routes)
// ============================================
const express = require("express");
const router = express.Router();

// Middleware
const {authenticateAdmin} = require("../../middleware/adminMiddleware/authMiddleware");
const { validateAdminRegistration, validateAdminSearch } = require("../../middleware/adminMiddleware/adminValidationMiddleware");
const { validateDriverRegistration, validateDriverUpdate } = require("../../middleware/adminMiddleware/driverValidationMiddleware");
const { validateStaffRegistration, validateStaffUpdate } = require("../../middleware/adminMiddleware/staffValidationMiddleware");
const { validateCustomerUpdate } = require("../../middleware/adminMiddleware/customerValidationMiddleware");

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
const fetchStaffById = require("../../controllers/adminControllers/userAccounts/Tables/TableSelections/fetchStaffById");
const fetchDriverById = require("../../controllers/adminControllers/userAccounts/Tables/TableSelections/fetchDriverById");
const fetchAdminById = require("../../controllers/adminControllers/userAccounts/Tables/TableSelections/fetchAdminById");
const staffStatusUpdate = require("../../controllers/adminControllers/userAccounts/Tables/TableSelections/staffStatusUpdate");
const updateCustomerById = require("../../controllers/adminControllers/userAccounts/Tables/TableSelections/updateCustomerById");
const updateStaffById = require("../../controllers/adminControllers/userAccounts/Tables/TableSelections/updateStaffById");
const updateDriverById = require("../../controllers/adminControllers/userAccounts/Tables/TableSelections/updateDriverById");
const updateAdminById = require("../../controllers/adminControllers/updateAdminById");
const fetchAllBranches = require("../../controllers/adminControllers/userAccounts/fetchAllBranches");


// User Statistics
router.get("/count", authenticateAdmin, fetchNoOfUsers);

// Branches for dropdown
router.get("/branches", authenticateAdmin, fetchAllBranches);

// Registration Routes
router.post("/admin/register", authenticateAdmin, validateAdminRegistration, registerAdmin);
router.post("/driver/register", authenticateAdmin, validateDriverRegistration, registerDriver);
router.post("/staff/register", authenticateAdmin, validateStaffRegistration, registerStaff);

// User Tables
router.get("/customer", authenticateAdmin, fetchAllCustomers);
router.get("/staff", authenticateAdmin, fetchAllStaff);
router.get("/driver", authenticateAdmin, fetchAllDriver);
router.get("/admin", authenticateAdmin, validateAdminSearch, fetchAllAdmin);

// Each user type can have more specific routes added here as needed
router.get("/customer/:id", authenticateAdmin,fetchCustomerById);
router.put("/customer/:id", authenticateAdmin, validateCustomerUpdate, updateCustomerById);
router.get("/staff/:id", authenticateAdmin, fetchStaffById);
router.put("/staff/:id", authenticateAdmin, validateStaffUpdate, updateStaffById);
router.put("/staff/:staffId/status", authenticateAdmin, staffStatusUpdate);
router.get("/driver/:id", authenticateAdmin, fetchDriverById);
router.put("/driver/:id", authenticateAdmin, validateDriverUpdate, updateDriverById);
router.get("/admin/:id", authenticateAdmin, fetchAdminById);
router.put("/admin/:id", authenticateAdmin, updateAdminById);


module.exports = router;