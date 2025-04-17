const express = require("express");
const authenticateStaff = require("../../middlewares/authMiddleware");
const { viewAllPickupParcels } = require("../../controllers/staff/pickupController");
const router = express.Router();

// GET ALL PICKUP PARCELS 
router.get('/get-all-pickup-parcels', authenticateStaff, viewAllPickupParcels)

module.exports  = router;