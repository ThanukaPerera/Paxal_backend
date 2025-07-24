const mongoose = require("mongoose");
const Vehicle = require("../../../models/VehicleModel");
const Driver = require("../../../models/driverModel");

const fetchVehiclesOfBranch = async (req, res) => {
  try {
    const branchId = req.params.branchId;

    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return res.status(400).json({ message: "Invalid branch ID" });
    }

    // Get all vehicleIds from drivers (some may be undefined)
    const assignedDriverVehicleIds = await Driver.find({}, "vehicleId").lean();

    // Safely extract only defined vehicleIds
    const assignedVehicleIds = assignedDriverVehicleIds
      .filter(driver => driver.vehicleId)
      .map(driver => driver.vehicleId.toString());

    // Fetch vehicles of the given branch not already assigned to drivers
    const availableVehicles = await Vehicle.find({
      assignedBranch: branchId,
      _id: { $nin: assignedVehicleIds },
    }).select("_id vehicleId registrationNo vehicleType");
    
    console.log(availableVehicles)
    res.status(200).json(availableVehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ message: "Error fetching vehicles", error });
  }
};

module.exports = fetchVehiclesOfBranch;
