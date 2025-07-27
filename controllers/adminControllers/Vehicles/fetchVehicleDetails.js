const Vehicle = require("../../../models/VehicleModel");
const VehicleSchedule = require("../../../models/VehicleScheduleModel");
const Driver = require("../../../models/driverModel");
const Branch = require("../../../models/BranchesModel");
const Parcel = require("../../../models/ParcelModel");
const B2BShipment = require("../../../models/B2BShipmentModel");

/**
 * Fetch comprehensive vehicle details including schedules, assignments, and history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const fetchVehicleDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        status: "error",
        message: "Vehicle ID is required"
      });
    }

    // Fetch basic vehicle information
    const vehicle = await Vehicle.findById(id)
      .populate("assignedBranch", "branchId location contact")
      .populate("currentBranch", "branchId location contact")
      .lean();

    if (!vehicle) {
      return res.status(404).json({
        status: "error",
        message: "Vehicle not found"
      });
    }

    // Fetch all schedules for this vehicle (with date range support)
    const { startDate, endDate, limit = 50, page = 1 } = req.query;
    let scheduleQuery = { vehicle: id };
    
    if (startDate || endDate) {
      scheduleQuery.scheduleDate = {};
      if (startDate) scheduleQuery.scheduleDate.$gte = new Date(startDate);
      if (endDate) scheduleQuery.scheduleDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [schedules, totalSchedules] = await Promise.all([
      VehicleSchedule.find(scheduleQuery)
        .populate("branch", "branchId location contact")
        .populate("assignedParcels", "parcelId trackingNo status itemType itemSize senderId receiverId")
        .sort({ scheduleDate: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      VehicleSchedule.countDocuments(scheduleQuery)
    ]);

    // Fetch assigned driver(s)
    const assignedDrivers = await Driver.find({ vehicleId: id })
      .populate("branchId", "branchId location")
      .select("driverId name email contactNo licenseId branchId")
      .lean();

    // Fetch shipments assigned to this vehicle
    const shipments = await B2BShipment.find({ assignedVehicle: id })
      .populate("sourceCenter", "branchId location")
      .populate("route", "branchId location")
      .populate("currentLocation", "branchId location")
      .populate("assignedDriver", "driverId name contactNo")
      .populate("parcels", "parcelId trackingNo status")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Calculate vehicle statistics
    const stats = await calculateVehicleStats(id);

    // Get recent activity
    const recentActivity = await getRecentVehicleActivity(id);

    // Format response data
    const responseData = {
      vehicle: {
        ...vehicle,
        assignedBranch: vehicle.assignedBranch || null,
        currentBranch: vehicle.currentBranch || null,
      },
      schedules: {
        data: schedules.map(schedule => ({
          ...schedule,
          formattedDate: new Date(schedule.scheduleDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          parcelCount: schedule.assignedParcels?.length || 0,
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalSchedules / parseInt(limit)),
          totalRecords: totalSchedules,
          hasNext: skip + schedules.length < totalSchedules,
          hasPrev: parseInt(page) > 1,
        }
      },
      assignedDrivers,
      shipments: shipments.map(shipment => ({
        ...shipment,
        formattedCreatedAt: new Date(shipment.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      })),
      statistics: stats,
      recentActivity,
    };

    res.status(200).json({
      status: "success",
      message: "Vehicle details fetched successfully",
      data: responseData
    });

  } catch (error) {
    console.error("Error fetching vehicle details:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong"
    });
  }
};

/**
 * Calculate vehicle statistics
 * @param {String} vehicleId - Vehicle ID
 * @returns {Object} Statistics object
 */
async function calculateVehicleStats(vehicleId) {
  try {
    const [
      totalSchedules,
      completedSchedules,
      totalParcelsAssigned,
      currentMonthSchedules,
      utilizationData
    ] = await Promise.all([
      VehicleSchedule.countDocuments({ vehicle: vehicleId }),
      VehicleSchedule.countDocuments({ 
        vehicle: vehicleId, 
        scheduleDate: { $lt: new Date() } 
      }),
      VehicleSchedule.aggregate([
        { $match: { vehicle: vehicleId } },
        { $group: { _id: null, total: { $sum: { $size: "$assignedParcels" } } } }
      ]),
      VehicleSchedule.countDocuments({
        vehicle: vehicleId,
        scheduleDate: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          $lte: new Date()
        }
      }),
      VehicleSchedule.aggregate([
        { $match: { vehicle: vehicleId } },
        {
          $group: {
            _id: null,
            avgVolume: { $avg: "$totalVolume" },
            avgWeight: { $avg: "$totalWeight" },
            maxVolume: { $max: "$totalVolume" },
            maxWeight: { $max: "$totalWeight" }
          }
        }
      ])
    ]);

    return {
      totalSchedules,
      completedSchedules,
      upcomingSchedules: totalSchedules - completedSchedules,
      totalParcelsAssigned: totalParcelsAssigned[0]?.total || 0,
      currentMonthSchedules,
      utilizationRate: totalSchedules > 0 ? ((completedSchedules / totalSchedules) * 100).toFixed(2) : 0,
      capacityUtilization: utilizationData[0] || {
        avgVolume: 0,
        avgWeight: 0,
        maxVolume: 0,
        maxWeight: 0
      }
    };
  } catch (error) {
    console.error("Error calculating vehicle stats:", error);
    return {
      totalSchedules: 0,
      completedSchedules: 0,
      upcomingSchedules: 0,
      totalParcelsAssigned: 0,
      currentMonthSchedules: 0,
      utilizationRate: 0,
      capacityUtilization: {
        avgVolume: 0,
        avgWeight: 0,
        maxVolume: 0,
        maxWeight: 0
      }
    };
  }
}

/**
 * Get recent vehicle activity
 * @param {String} vehicleId - Vehicle ID
 * @returns {Array} Recent activity array
 */
async function getRecentVehicleActivity(vehicleId) {
  try {
    const recentSchedules = await VehicleSchedule.find({ vehicle: vehicleId })
      .populate("branch", "location")
      .sort({ scheduleDate: -1 })
      .limit(10)
      .lean();

    const recentShipments = await B2BShipment.find({ assignedVehicle: vehicleId })
      .populate("sourceCenter", "location")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const activity = [];

    // Add schedule activities
    recentSchedules.forEach(schedule => {
      activity.push({
        type: "schedule",
        action: `${schedule.type} scheduled`,
        description: `${schedule.type === "pickup" ? "Pickup" : "Delivery"} at ${schedule.branch?.location || "Unknown Location"}`,
        date: schedule.scheduleDate,
        details: {
          timeSlot: schedule.timeSlot,
          parcelCount: schedule.assignedParcels?.length || 0,
          totalVolume: schedule.totalVolume,
          totalWeight: schedule.totalWeight
        }
      });
    });

    // Add shipment activities
    recentShipments.forEach(shipment => {
      activity.push({
        type: "shipment",
        action: "Shipment assigned",
        description: `${shipment.deliveryType} shipment from ${shipment.sourceCenter?.location || "Unknown"}`,
        date: shipment.createdAt,
        details: {
          shipmentId: shipment.shipmentId,
          status: shipment.status,
          parcelCount: shipment.parcelCount,
          totalDistance: shipment.totalDistance
        }
      });
    });

    // Sort by date (most recent first) and limit to 15 items
    return activity
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 15)
      .map(item => ({
        ...item,
        formattedDate: new Date(item.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      }));

  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return [];
  }
}

module.exports = fetchVehicleDetails;
