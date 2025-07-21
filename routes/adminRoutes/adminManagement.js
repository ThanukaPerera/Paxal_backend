// ============================================
// routes/admin/adminManagement.js (Admin CRUD routes)
// ============================================
const express = require("express");
const router = express.Router();

// Middleware
const {authenticateAdmin} = require("../../middleware/adminMiddleware/authMiddleware");
const { validateAdminUpdate, validateAdminId } = require("../../middleware/adminMiddleware/adminValidationMiddleware");

// Controllers
const findAdminById = require("../../controllers/adminControllers/findAdminById");
const updateAdminById = require("../../controllers/adminControllers/updateAdminById");
const deleteAdminById = require("../../controllers/adminControllers/deleteAdminById");

// Admin Management Routes
router.get("/:adminId", authenticateAdmin, validateAdminId, findAdminById);
router.put("/:adminId", authenticateAdmin, validateAdminId, validateAdminUpdate, updateAdminById);
router.delete("/:adminId", authenticateAdmin, validateAdminId, deleteAdminById);

module.exports = router;