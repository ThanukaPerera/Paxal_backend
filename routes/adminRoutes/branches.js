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

// Controllers
const fetchBranches = require("../../controllers/adminControllers/branches/fetchBranches");
const { addBranch } = require("../../controllers/adminControllers/branches/addBranch");
const deleteBranch = require('../../controllers/adminControllers/branches/deleteBranch');
const updateBranch = require('../../controllers/adminControllers/branches/updateBranch');

// Branch Routes
router.get("/", authenticateAdmin, fetchBranches);
router.post("/", authenticateAdmin, validateBranchRegistration, addBranch);
router.put("/:id", authenticateAdmin, validateBranchUpdate, updateBranch);
router.delete("/:id", authenticateAdmin, validateBranchId, deleteBranch);

module.exports = router;