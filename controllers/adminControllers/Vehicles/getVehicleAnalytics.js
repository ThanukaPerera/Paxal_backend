const VehicleSchedule = require("../../../models/VehicleScheduleModel");
const Vehicle = require("../../../models/VehicleModel");
const B2BShipment = require("../../../models/B2BShipmentModel");
const Parcel = require("../../../models/ParcelModel");

/**
 * Get comprehensive vehicle analytics and performance metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getVehicleAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      startDate, 
      endDate, 
      period = "month" // day, week, month, year
    } = req.query;

    // Validate vehicle exists
    const vehicle = await Vehicle.findById(id)
      .populate("assignedBranch", "branchId location")
      .populate("currentBranch", "branchId location")
      .lean();

    if (!vehicle) {
      return res.status(404).json({
        status: "error",
        message: "Vehicle not found"
      });
    }

    // Set default date range if not provided
    const endDateObj = endDate ? new Date(endDate) : new Date();
    let startDateObj;
    
    if (startDate) {
      startDateObj = new Date(startDate);
    } else {
      // Default to last 30 days
      startDateObj = new Date();
      startDateObj.setDate(startDateObj.getDate() - 30);
    }

    // Get comprehensive analytics
    const [
      scheduleAnalytics,
      utilizationMetrics,
      performanceMetrics,
      trendAnalysis,
      shipmentAnalytics
    ] = await Promise.all([
      getScheduleAnalytics(id, startDateObj, endDateObj),
      getUtilizationMetrics(id, startDateObj, endDateObj, vehicle),
      getPerformanceMetrics(id, startDateObj, endDateObj),
      getTrendAnalysis(id, startDateObj, endDateObj, period),
      getShipmentAnalytics(id, startDateObj, endDateObj)
    ]);

    // Calculate efficiency score
    const efficiencyScore = calculateEfficiencyScore(
      scheduleAnalytics,
      utilizationMetrics,
      performanceMetrics
    );

    res.status(200).json({
      status: "success",
      message: "Vehicle analytics fetched successfully",
      data: {
        vehicle: {
          vehicleId: vehicle.vehicleId,
          registrationNo: vehicle.registrationNo,
          vehicleType: vehicle.vehicleType,
          capableVolume: vehicle.capableVolume,
          capableWeight: vehicle.capableWeight,
          assignedBranch: vehicle.assignedBranch,
          currentBranch: vehicle.currentBranch,
          available: vehicle.available
        },
        analytics: {
          schedule: scheduleAnalytics,
          utilization: utilizationMetrics,
          performance: performanceMetrics,
          trends: trendAnalysis,
          shipments: shipmentAnalytics,
          efficiencyScore
        },
        dateRange: {
          startDate: startDateObj.toISOString(),
          endDate: endDateObj.toISOString(),
          period
        }
      }
    });

  } catch (error) {
    console.error("Error fetching vehicle analytics:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong"
    });
  }
};

/**
 * Get schedule analytics
 */
async function getScheduleAnalytics(vehicleId, startDate, endDate) {
  const scheduleData = await VehicleSchedule.aggregate([
    {
      $match: {
        vehicle: vehicleId,
        scheduleDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalSchedules: { $sum: 1 },
        completedSchedules: {
          $sum: { $cond: [{ $lt: ["$scheduleDate", new Date()] }, 1, 0] }
        },
        pickupSchedules: {
          $sum: { $cond: [{ $eq: ["$type", "pickup"] }, 1, 0] }
        },
        deliverySchedules: {
          $sum: { $cond: [{ $eq: ["$type", "delivery"] }, 1, 0] }
        },
        totalParcels: { $sum: { $size: "$assignedParcels" } },
        totalVolume: { $sum: "$totalVolume" },
        totalWeight: { $sum: "$totalWeight" },
        morningSlots: {
          $sum: { $cond: [{ $eq: ["$timeSlot", "08:00 - 12:00"] }, 1, 0] }
        },
        afternoonSlots: {
          $sum: { $cond: [{ $eq: ["$timeSlot", "13:00 - 17:00"] }, 1, 0] }
        }
      }
    }
  ]);

  const data = scheduleData[0] || {
    totalSchedules: 0,
    completedSchedules: 0,
    pickupSchedules: 0,
    deliverySchedules: 0,
    totalParcels: 0,
    totalVolume: 0,
    totalWeight: 0,
    morningSlots: 0,
    afternoonSlots: 0
  };

  return {
    ...data,
    upcomingSchedules: data.totalSchedules - data.completedSchedules,
    completionRate: data.totalSchedules > 0 ? 
      ((data.completedSchedules / data.totalSchedules) * 100).toFixed(2) : 0,
    avgParcelsPerSchedule: data.totalSchedules > 0 ? 
      (data.totalParcels / data.totalSchedules).toFixed(2) : 0
  };
}

/**
 * Get utilization metrics
 */
async function getUtilizationMetrics(vehicleId, startDate, endDate, vehicle) {
  const utilizationData = await VehicleSchedule.aggregate([
    {
      $match: {
        vehicle: vehicleId,
        scheduleDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        avgVolumeUtilization: { $avg: "$totalVolume" },
        avgWeightUtilization: { $avg: "$totalWeight" },
        maxVolumeUtilization: { $max: "$totalVolume" },
        maxWeightUtilization: { $max: "$totalWeight" },
        totalSchedules: { $sum: 1 }
      }
    }
  ]);

  const data = utilizationData[0] || {
    avgVolumeUtilization: 0,
    avgWeightUtilization: 0,
    maxVolumeUtilization: 0,
    maxWeightUtilization: 0,
    totalSchedules: 0
  };

  return {
    ...data,
    volumeUtilizationPercentage: vehicle.capableVolume > 0 ? 
      ((data.avgVolumeUtilization / vehicle.capableVolume) * 100).toFixed(2) : 0,
    weightUtilizationPercentage: vehicle.capableWeight > 0 ? 
      ((data.avgWeightUtilization / vehicle.capableWeight) * 100).toFixed(2) : 0,
    peakVolumeUtilization: vehicle.capableVolume > 0 ? 
      ((data.maxVolumeUtilization / vehicle.capableVolume) * 100).toFixed(2) : 0,
    peakWeightUtilization: vehicle.capableWeight > 0 ? 
      ((data.maxWeightUtilization / vehicle.capableWeight) * 100).toFixed(2) : 0
  };
}

/**
 * Get performance metrics
 */
async function getPerformanceMetrics(vehicleId, startDate, endDate) {
  // Get parcel delivery performance
  const parcelPerformance = await VehicleSchedule.aggregate([
    {
      $match: {
        vehicle: vehicleId,
        scheduleDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $lookup: {
        from: "parcels",
        localField: "assignedParcels",
        foreignField: "_id",
        as: "parcelDetails"
      }
    },
    {
      $unwind: "$parcelDetails"
    },
    {
      $group: {
        _id: null,
        totalParcels: { $sum: 1 },
        deliveredParcels: {
          $sum: { $cond: [{ $eq: ["$parcelDetails.status", "Delivered"] }, 1, 0] }
        },
        inTransitParcels: {
          $sum: { $cond: [{ $eq: ["$parcelDetails.status", "InTransit"] }, 1, 0] }
        },
        returnedParcels: {
          $sum: { $cond: [{ $eq: ["$parcelDetails.status", "Return"] }, 1, 0] }
        }
      }
    }
  ]);

  const data = parcelPerformance[0] || {
    totalParcels: 0,
    deliveredParcels: 0,
    inTransitParcels: 0,
    returnedParcels: 0
  };

  return {
    ...data,
    deliverySuccessRate: data.totalParcels > 0 ? 
      ((data.deliveredParcels / data.totalParcels) * 100).toFixed(2) : 0,
    returnRate: data.totalParcels > 0 ? 
      ((data.returnedParcels / data.totalParcels) * 100).toFixed(2) : 0
  };
}

/**
 * Get trend analysis
 */
async function getTrendAnalysis(vehicleId, startDate, endDate, period) {
  let groupStage;
  
  switch (period) {
    case "day":
      groupStage = {
        $group: {
          _id: {
            year: { $year: "$scheduleDate" },
            month: { $month: "$scheduleDate" },
            day: { $dayOfMonth: "$scheduleDate" }
          },
          schedules: { $sum: 1 },
          parcels: { $sum: { $size: "$assignedParcels" } },
          volume: { $sum: "$totalVolume" },
          weight: { $sum: "$totalWeight" }
        }
      };
      break;
    case "week":
      groupStage = {
        $group: {
          _id: {
            year: { $year: "$scheduleDate" },
            week: { $week: "$scheduleDate" }
          },
          schedules: { $sum: 1 },
          parcels: { $sum: { $size: "$assignedParcels" } },
          volume: { $sum: "$totalVolume" },
          weight: { $sum: "$totalWeight" }
        }
      };
      break;
    case "month":
    default:
      groupStage = {
        $group: {
          _id: {
            year: { $year: "$scheduleDate" },
            month: { $month: "$scheduleDate" }
          },
          schedules: { $sum: 1 },
          parcels: { $sum: { $size: "$assignedParcels" } },
          volume: { $sum: "$totalVolume" },
          weight: { $sum: "$totalWeight" }
        }
      };
      break;
  }

  const trendData = await VehicleSchedule.aggregate([
    {
      $match: {
        vehicle: vehicleId,
        scheduleDate: { $gte: startDate, $lte: endDate }
      }
    },
    groupStage,
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 } }
  ]);

  return trendData.map(item => ({
    period: item._id,
    schedules: item.schedules,
    parcels: item.parcels,
    volume: item.volume,
    weight: item.weight
  }));
}

/**
 * Get shipment analytics
 */
async function getShipmentAnalytics(vehicleId, startDate, endDate) {
  const shipmentData = await B2BShipment.aggregate([
    {
      $match: {
        assignedVehicle: vehicleId,
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalShipments: { $sum: 1 },
        expressShipments: {
          $sum: { $cond: [{ $eq: ["$deliveryType", "Express"] }, 1, 0] }
        },
        standardShipments: {
          $sum: { $cond: [{ $eq: ["$deliveryType", "Standard"] }, 1, 0] }
        },
        completedShipments: {
          $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] }
        },
        inTransitShipments: {
          $sum: { $cond: [{ $eq: ["$status", "In Transit"] }, 1, 0] }
        },
        totalDistance: { $sum: "$totalDistance" },
        totalTime: { $sum: "$totalTime" }
      }
    }
  ]);

  const data = shipmentData[0] || {
    totalShipments: 0,
    expressShipments: 0,
    standardShipments: 0,
    completedShipments: 0,
    inTransitShipments: 0,
    totalDistance: 0,
    totalTime: 0
  };

  return {
    ...data,
    completionRate: data.totalShipments > 0 ? 
      ((data.completedShipments / data.totalShipments) * 100).toFixed(2) : 0,
    avgDistance: data.totalShipments > 0 ? 
      (data.totalDistance / data.totalShipments).toFixed(2) : 0,
    avgTime: data.totalShipments > 0 ? 
      (data.totalTime / data.totalShipments).toFixed(2) : 0
  };
}

/**
 * Calculate overall efficiency score
 */
function calculateEfficiencyScore(scheduleAnalytics, utilizationMetrics, performanceMetrics) {
  const completionScore = parseFloat(scheduleAnalytics.completionRate) || 0;
  const utilizationScore = (
    (parseFloat(utilizationMetrics.volumeUtilizationPercentage) || 0) +
    (parseFloat(utilizationMetrics.weightUtilizationPercentage) || 0)
  ) / 2;
  const deliveryScore = parseFloat(performanceMetrics.deliverySuccessRate) || 0;

  const overallScore = (completionScore * 0.4 + utilizationScore * 0.3 + deliveryScore * 0.3);
  
  let grade;
  if (overallScore >= 90) grade = "A+";
  else if (overallScore >= 80) grade = "A";
  else if (overallScore >= 70) grade = "B";
  else if (overallScore >= 60) grade = "C";
  else grade = "D";

  return {
    score: overallScore.toFixed(2),
    grade,
    breakdown: {
      completion: completionScore,
      utilization: utilizationScore,
      delivery: deliveryScore
    }
  };
}

module.exports = getVehicleAnalytics;
