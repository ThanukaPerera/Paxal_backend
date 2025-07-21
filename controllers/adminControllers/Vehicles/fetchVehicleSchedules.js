const VehicleSchedule = require("../../../models/VehicleScheduleModel");
const Vehicle = require("../../../models/VehicleModel");

/**
 * Fetch vehicle schedules with advanced filtering and pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const fetchVehicleSchedules = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      startDate, 
      endDate, 
      type, 
      timeSlot, 
      limit = 20, 
      page = 1,
      sortBy = "scheduleDate",
      sortOrder = "desc"
    } = req.query;

    // Validate vehicle exists
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        status: "error",
        message: "Vehicle not found"
      });
    }

    // Build query
    let query = { vehicle: id };

    // Date filtering
    if (startDate || endDate) {
      query.scheduleDate = {};
      if (startDate) {
        query.scheduleDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.scheduleDate.$lte = new Date(endDate);
      }
    }

    // Type filtering (pickup/delivery)
    if (type && ["pickup", "delivery"].includes(type)) {
      query.type = type;
    }

    // Time slot filtering
    if (timeSlot && ["08:00 - 12:00", "13:00 - 17:00"].includes(timeSlot)) {
      query.timeSlot = timeSlot;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    // Fetch schedules with populated data
    const [schedules, totalCount] = await Promise.all([
      VehicleSchedule.find(query)
        .populate("branch", "branchId location contact")
        .populate({
          path: "assignedParcels",
          select: "parcelId trackingNo status itemType itemSize specialInstructions senderId receiverId",
          populate: [
            {
              path: "senderId",
              select: "name email contactNo"
            },
            {
              path: "receiverId", 
              select: "name email contactNo"
            }
          ]
        })
        .sort(sort)
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      VehicleSchedule.countDocuments(query)
    ]);

    // Calculate schedule summary
    const summary = await calculateScheduleSummary(id, query);

    // Format response
    const formattedSchedules = schedules.map(schedule => ({
      ...schedule,
      formattedDate: new Date(schedule.scheduleDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        weekday: "short"
      }),
      parcelCount: schedule.assignedParcels?.length || 0,
      utilizationRate: vehicle.capableVolume > 0 
        ? ((schedule.totalVolume / vehicle.capableVolume) * 100).toFixed(2) 
        : 0,
      weightUtilization: vehicle.capableWeight > 0 
        ? ((schedule.totalWeight / vehicle.capableWeight) * 100).toFixed(2) 
        : 0
    }));

    res.status(200).json({
      status: "success",
      message: "Vehicle schedules fetched successfully",
      data: {
        schedules: formattedSchedules,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalRecords: totalCount,
          hasNext: skip + schedules.length < totalCount,
          hasPrev: parseInt(page) > 1,
          limit: parseInt(limit)
        },
        summary,
        vehicle: {
          vehicleId: vehicle.vehicleId,
          registrationNo: vehicle.registrationNo,
          vehicleType: vehicle.vehicleType,
          capableVolume: vehicle.capableVolume,
          capableWeight: vehicle.capableWeight
        }
      }
    });

  } catch (error) {
    console.error("Error fetching vehicle schedules:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong"
    });
  }
};

/**
 * Calculate schedule summary statistics
 * @param {String} vehicleId - Vehicle ID
 * @param {Object} baseQuery - Base query object
 * @returns {Object} Summary statistics
 */
async function calculateScheduleSummary(vehicleId, baseQuery) {
  try {
    const summaryData = await VehicleSchedule.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          totalSchedules: { $sum: 1 },
          totalVolume: { $sum: "$totalVolume" },
          totalWeight: { $sum: "$totalWeight" },
          totalParcels: { $sum: { $size: "$assignedParcels" } },
          pickupSchedules: {
            $sum: { $cond: [{ $eq: ["$type", "pickup"] }, 1, 0] }
          },
          deliverySchedules: {
            $sum: { $cond: [{ $eq: ["$type", "delivery"] }, 1, 0] }
          },
          morningSlots: {
            $sum: { $cond: [{ $eq: ["$timeSlot", "08:00 - 12:00"] }, 1, 0] }
          },
          afternoonSlots: {
            $sum: { $cond: [{ $eq: ["$timeSlot", "13:00 - 17:00"] }, 1, 0] }
          }
        }
      }
    ]);

    const summary = summaryData[0] || {
      totalSchedules: 0,
      totalVolume: 0,
      totalWeight: 0,
      totalParcels: 0,
      pickupSchedules: 0,
      deliverySchedules: 0,
      morningSlots: 0,
      afternoonSlots: 0
    };

    // Add percentage calculations
    if (summary.totalSchedules > 0) {
      summary.pickupPercentage = ((summary.pickupSchedules / summary.totalSchedules) * 100).toFixed(2);
      summary.deliveryPercentage = ((summary.deliverySchedules / summary.totalSchedules) * 100).toFixed(2);
      summary.morningPercentage = ((summary.morningSlots / summary.totalSchedules) * 100).toFixed(2);
      summary.afternoonPercentage = ((summary.afternoonSlots / summary.totalSchedules) * 100).toFixed(2);
    } else {
      summary.pickupPercentage = 0;
      summary.deliveryPercentage = 0;
      summary.morningPercentage = 0;
      summary.afternoonPercentage = 0;
    }

    return summary;
  } catch (error) {
    console.error("Error calculating schedule summary:", error);
    return {
      totalSchedules: 0,
      totalVolume: 0,
      totalWeight: 0,
      totalParcels: 0,
      pickupSchedules: 0,
      deliverySchedules: 0,
      morningSlots: 0,
      afternoonSlots: 0,
      pickupPercentage: 0,
      deliveryPercentage: 0,
      morningPercentage: 0,
      afternoonPercentage: 0
    };
  }
}

module.exports = fetchVehicleSchedules;
