const Vehicle = require("../../../models/vehicleModel");
const mongoose = require('mongoose')

const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      registrationNo,
      vehicleType,
      assignedBranch,
      capableVolume,
      capableWeight,
      available,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid vehicle ID",
      });
    }

    // Check if registrationNo already exists for another vehicle
    const existingVehicle = await Vehicle.findOne({
      registrationNo,
      _id: { $ne: new mongoose.Types.ObjectId(id) },
    });


    if (existingVehicle) {
      return res.status(400).json({
        status: "error",
        message: "Registration number already exists",
      });
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      {
        registrationNo,
        vehicleType,
        assignedBranch,
        capableVolume,
        capableWeight,
        available,
      },
      { new: true, runValidators: true }
    );

    if (!updatedVehicle) {
      return res.status(404).json({
        status: "error",
        message: "Vehicle not found",
      });
    }

    res.json({
      status: "success",
      message: "Vehicle updated successfully",
      vehicle: updatedVehicle,
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({
      status: "error",
      message: "Server error during update",
      error: error.message,
    });
  }
};

module.exports = updateVehicle;
