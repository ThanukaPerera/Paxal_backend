const express = require('express');
const router = express.Router();
const branchesController = require('../controllers/branchesController');
const Branch = require('../models/BranchesModel');
const isStaffAuthenticated = require("../middleware/staffAuth");

// Import new branch-specific controllers
const fetchParcelsByBranchId = require('../controllers/adminControllers/branches/fetchParcelsByBranchId');
const fetchDriversByBranchId = require('../controllers/adminControllers/branches/fetchDriversByBranchId');
const fetchStaffByBranchId = require('../controllers/adminControllers/branches/fetchStaffByBranchId');
const fetchBranchCompleteData = require('../controllers/adminControllers/branches/fetchBranchCompleteData');

// Authentication middleware (add your auth middleware here)
// const authenticateAdmin = require('../middleware/auth');

// Basic branch routes
router.get('/', branchesController.getAllBranches); // GET /api/branches - Public for dropdown population

// Branch-specific data endpoints - Staff only
router.get('/:id/parcels', isStaffAuthenticated, fetchParcelsByBranchId); // GET /api/branches/:id/parcels
router.get('/:id/drivers', isStaffAuthenticated, fetchDriversByBranchId); // GET /api/branches/:id/drivers  
router.get('/:id/staff', isStaffAuthenticated, fetchStaffByBranchId); // GET /api/branches/:id/staff
router.get('/:id/complete', isStaffAuthenticated, fetchBranchCompleteData); // GET /api/branches/:id/complete

// Get parcels by center a
router.get("/all-branches", async (req, res) => {
    try {
        const branches = await Branch.find({

        }).populate();

        res.status(200).json({
            success: true,
            count: branches.length,
            branches,
            response: " this is will show when response is correct"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get branch details by IDs for dynamic name resolution
router.post("/details", async (req, res) => {
    try {
        const { branchIds } = req.body;

        if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: "branchIds array is required"
            });
        }

        const branches = await Branch.find({
            _id: { $in: branchIds }
        }).select('_id location');

        res.status(200).json({
            success: true,
            count: branches.length,
            branches
        });

    } catch (error) {
        console.error('Error fetching branch details:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


module.exports = router;
