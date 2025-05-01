const express = require("express");
const router = express.Router();
const {
  assignVehicle,
} = require("../controllers/shipmentManagementControllers/vehicleController");
const shipmentModel = require("../models/B2BShipmentModel");

router.post("/assignVehicleToShipment/:id/:deliveryType", async (req, res) => {
  try {
    const shipmentId = req.params.id;
    const shipmentType = req.params.deliveryType;
    const vehicleAssigned = await assignVehicle(shipmentId, shipmentType);

    if (!vehicleAssigned) {
      return res
        .status(404)
        .json({ message: "No available vehicle found for the shipment" });
    }
    res.status(200).json({
      message: "Vehicle assigned successfully",
      data: vehicleAssigned,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;
