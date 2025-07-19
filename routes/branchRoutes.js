const express = require('express');
const router = express.Router();
const branchesController = require('../controllers/branchesController');
const Branch = require('../models/BranchesModel');

router.get('/', branchesController.getAllBranches); // GET /api/branches


// Get parcels by center a
router.get("/all-branches", async (req, res) => {
    try {
        const branches = await Branch.find({
    
        }).populate();

        res.status(200).json({
            success: true,
            count: branches.length,
            branches,
            response:" this is will show when response is correct"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
module.exports = router;
