// ============================================
// routes/admin/branches.js (Branch routes)
// ============================================
const express = require("express");
const router = express.Router();

// Middleware
const {authenticateAdmin} = require("../../middleware/adminMiddleware/authMiddleware");
const {
  validateBranchRegistration,
  validateBranchUpdate,
  validateBranchId
} = require("../../middleware/adminMiddleware/branchValidationMiddleware");
const branchController = require("../../controllers/adminControllers/branches/index");

// Controllers
const fetchBranches = require("../../controllers/adminControllers/branches/fetchBranches");
const { addBranch } = require("../../controllers/adminControllers/branches/addBranch");
const deleteBranch = require('../../controllers/adminControllers/branches/deleteBranch');
const updateBranch = require('../../controllers/adminControllers/branches/updateBranch');
const fetchParcelsByBranchId = require('../../controllers/adminControllers/branches/fetchParcelsByBranchId');

// Branch Routes
router.get("/", authenticateAdmin, fetchBranches);
router.post("/", authenticateAdmin, validateBranchRegistration, addBranch);
router.put("/:id", authenticateAdmin, validateBranchUpdate, updateBranch);
router.delete("/:id", authenticateAdmin, validateBranchId, deleteBranch);
router.get("/:id/parcels", authenticateAdmin, validateBranchId, branchController.fetchParcelsByBranchId);
router.get("/:id/drivers", authenticateAdmin, validateBranchId, branchController.fetchDriversByBranchId);
router.get("/:id/staff", authenticateAdmin, validateBranchId, branchController.fetchStaffByBranchId);
router.get("/:id/complete", authenticateAdmin, validateBranchId, branchController.fetchBranchCompleteData);

module.exports = router;