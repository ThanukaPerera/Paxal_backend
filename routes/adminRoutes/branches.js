// ============================================
// routes/admin/branches.js (Branch routes)
// ============================================
const express = require("express");
const router = express.Router();

// Middleware
const {authenticateAdmin} = require("../../middleware/adminMiddleware/authMiddleware");

// Controllers
const fetchBranches = require("../../controllers/adminControllers/branches/fetchBranches");
const {
  validateBranch,
  addBranch,
} = require("../../controllers/adminControllers/branches/addBranch");
const deleteBranch = require('../../controllers/adminControllers/branches/deleteBranch');
const updateBranch = require('../../controllers/adminControllers/branches/updateBranch');

// Branch Routes
router.get("/", authenticateAdmin, fetchBranches);
router.post("/", authenticateAdmin, validateBranch, addBranch);
router.put("/:id", authenticateAdmin, updateBranch);
router.delete("/:id", authenticateAdmin, deleteBranch);

module.exports = router;