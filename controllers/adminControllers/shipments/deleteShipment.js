const mongoose = require("mongoose");
const Shipment = require("../../../models/B2BShipmentModel"); // Adjust the path if needed
const Vehicle = require("../../../models/VehicleModel");

const deleteShipment = async (req, res) => {
  try {
    const id = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: "error", message: "Invalid ID format" });
    }

    const deletedShipment = await Shipment.findByIdAndDelete(id);

    if (!deletedShipment) {
      return res.status(404).json({ status: "error", message: "Shipment not found" });
    }

    // Free up the assigned vehicle if there is one
    if (deletedShipment.assignedVehicle) {
      await Vehicle.updateOne(
        { _id: deletedShipment.assignedVehicle },
        { $set: { available: true } }
      );
      console.log(`Vehicle ${deletedShipment.assignedVehicle} made available after shipment deletion`);
    }

    res.status(200).json({
      status: "success",
      message: "Shipment deleted successfully and vehicle made available",
      deletedShipment,
    });
  } catch (error) {
    console.error("Error deleting shipment:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

module.exports = deleteShipment;
