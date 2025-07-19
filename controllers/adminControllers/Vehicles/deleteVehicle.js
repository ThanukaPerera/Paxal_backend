const mongoose = require("mongoose");
const Vehicle = require("../../../models/vehicleModel"); // Adjust the path as needed

const deleteVehicle = async (req, res) => {
  try {
    const id = req.params.id;

    // Check if id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: "error", message: "Invalid ID format" });
    }

    const deletedVehicle = await Vehicle.findByIdAndDelete(id);

    if (!deletedVehicle) {
      return res.status(404).json({ status: "error", message: "Vehicle not found" });
    }

    res.status(200).json({
      status: "success",
      message: "Vehicle deleted successfully",
      deletedVehicle,
    });
  } catch (error) {
    console.error("Error deleting branch:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

module.exports = deleteVehicle;
