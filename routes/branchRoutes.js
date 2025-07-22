const express = require("express");
const router = express.Router();
const branchesController = require('../controllers/branchesController');
const Branch = require('../models/BranchesModel');

// Import new branch-specific controllers
const fetchParcelsByBranchId = require('../controllers/adminControllers/branches/fetchParcelsByBranchId');
const fetchDriversByBranchId = require('../controllers/adminControllers/branches/fetchDriversByBranchId');
const fetchStaffByBranchId = require('../controllers/adminControllers/branches/fetchStaffByBranchId');
const fetchBranchCompleteData = require('../controllers/adminControllers/branches/fetchBranchCompleteData');

// Authentication middleware (add your auth middleware here)
// const authenticateAdmin = require('../middleware/auth');

// Basic branch routes
router.get('/', branchesController.getAllBranches); // GET /api/branches

// Branch-specific data endpoints
router.get('/:id/parcels', fetchParcelsByBranchId); // GET /api/branches/:id/parcels
router.get('/:id/drivers', fetchDriversByBranchId); // GET /api/branches/:id/drivers  
router.get('/:id/staff', fetchStaffByBranchId); // GET /api/branches/:id/staff
router.get('/:id/complete', fetchBranchCompleteData); // GET /api/branches/:id/complete

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


module.exports = router;
