const VehicleSchedule = require("../../../models/VehicleScheduleModel");
const Vehicle = require("../../../models/VehicleModel"); // Make sure this is added
const Branch = require("../../../models/BranchesModel");


// Add this utility function at the top of your file
const formatDate = (isoString) => {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};




const fetchVehicles = async (req, res) => {
  
    try {
      const data = await Vehicle.find().select("-__v").populate("assignedBranch", "-__v -branchId").populate("currentBranch", "-__v -branchId").lean().exec();
      
      
      const filteredData=data.map(vehicle=>({
        ...vehicle,
      assignedBranch:vehicle.assignedBranch?.location,
      currentBranch:vehicle.currentBranch?.location
        
      }))
     
      userData=filteredData;
      
      res.status(200).json({status: "success",message: "Vehicles fetched successfully",userData});

    } catch (error) {
      res.status(500).json({ status: "failed", message: "Internal server error", error });
    }
};

module.exports = fetchVehicles;
