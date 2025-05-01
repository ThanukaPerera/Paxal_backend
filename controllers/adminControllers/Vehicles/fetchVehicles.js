const VehicleSchedule = require("../../../models/VehicleScheduleModel");
const Vehicle = require("../../../models/VehicleModel"); // Make sure this is added
const Branch = require("../../../models/BranchesModel");

// Add this utility function at the top of your file
const formatDate = (isoString) => {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const fetchVehicles = async (req, res) => {
  try {
    const data = await Vehicle.find()
      .select("-__v")
      .populate("assignedBranch", "-__v -branchId")
      .populate("currentBranch", "-__v -branchId")
      .lean()
      .exec();

    const filteredData = data.map((vehicle) => ({
      ...vehicle,
      assignedBranch: vehicle.assignedBranch.location,
      currentBranch: vehicle.currentBranch.location,
    }));
    userData = filteredData;

    res
      .status(200)
      .json({
        status: "success",
        message: "Vehicles fetched successfully",
        userData,
      });
  } catch (error) {
    res
      .status(500)
      .json({ status: "failed", message: "Internal server error", error });
  }

  // try {
  //   const response = await VehicleSchedule.find()
  //     .select("-__v")
  //     .populate({
  //       path: "vehicle",
  //       populate: [
  //         {
  //           path: "assignedBranch",
  //           select: "-__v -branchId",
  //         },
  //         {
  //           path: "currentBranch",
  //           select: "-__v -branchId",
  //         },
  //       ],
  //       select: "-__v -vehicleId",
  //     })
  //     .populate({
  //       path:"assignedParcels",
  //       select:'-parcelId',
  //       populate:[
  //         {
  //           path:"senderId"
  //         },
  //         {
  //           path:"receiverId"
  //         }
  //       ]
  //     })
  //     .lean()
  //     .exec();

  //   const filteredData = response.map((data) => ({
  //     vehicle: {
  //       id: data.vehicle._id,
  //       registrationNo: data.vehicle.registrationNo || "N/A",
  //       type: data.vehicle.vehicleType,
  //       available: data.vehicle.available,
  //       capacity: {
  //         volume: data.vehicle.capableVolume,
  //         weight: data.vehicle.capableWeight,
  //       },
  //     },
  //     branches: {
  //       assigned: {
  //         id: data.vehicle.assignedBranch._id,
  //         location: data.vehicle.assignedBranch.location,
  //         contact: data.vehicle.assignedBranch.contact,
  //       },
  //       current: {
  //         id: data.vehicle.currentBranch._id,
  //         location: data.vehicle.currentBranch.location,
  //         contact: data.vehicle.currentBranch.contact,
  //       },
  //     },
  //     schedule: {
  //       id: data._id,
  //       date: new Date(data.scheduleDate), // Convert to Date object
  //       formattedDate: formatDate(data.scheduleDate), // Add formatting function
  //       timeSlot: data.timeSlot,
  //       type: data.type,
  //       totals: {
  //         volume: data.totalVolume,
  //         weight: data.totalWeight,
  //       },
  //       parcels: {
  //         ids: data.assignedParcels,
  //         count: data.assignedParcels.length,
  //       },
  //     },

  //   }));

  //   res
  //     .status(200)
  //     .json({
  //       status: "success",
  //       message: "Vehicles fetched successfully",
  //       response,
  //     });
  //   console.log(response);
  // } catch (error) {
  //   console.log(error);
  //   res
  //     .status(500)
  //     .json({ status: "failed", message: "Internal server error", error });
  // }
};

module.exports = fetchVehicles;
