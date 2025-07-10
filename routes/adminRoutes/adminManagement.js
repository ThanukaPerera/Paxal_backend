// ============================================
// routes/admin/adminManagement.js (Admin CRUD routes)
// ============================================
const express = require("express");
const router = express.Router();

// Middleware
const {authenticateAdmin} = require("../../middleware/adminMiddleware/authMiddleware");

// Controllers
const findAdminById = require("../../controllers/adminControllers/findAdminById");
const updateAdminById = require("../../controllers/adminControllers/updateAdminById");
const deleteAdminById = require("../../controllers/adminControllers/deleteAdminById");

// Admin Management Routes
router.get("/:adminId", authenticateAdmin, findAdminById);
router.put("/:adminId", authenticateAdmin, updateAdminById);
router.delete("/:adminId", authenticateAdmin, deleteAdminById);

module.exports = router;