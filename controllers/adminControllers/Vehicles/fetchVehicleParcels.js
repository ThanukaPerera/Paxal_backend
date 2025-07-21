const VehicleSchedule = require("../../../models/VehicleScheduleModel");
const Vehicle = require("../../../models/VehicleModel");
const Parcel = require("../../../models/ParcelModel");
const mongoose = require("mongoose");

/**
 * Fetch parcels assigned to a vehicle with advanced filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const fetchVehicleParcels = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      startDate, 
      endDate, 
      status,
      itemType,
      scheduleType,
      limit = 20, 
      page = 1,
      sortBy = "createdAt",
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

    // Build schedule query for filtering by date and type
    let scheduleQuery = { vehicle: id };
    
    if (startDate || endDate) {
      scheduleQuery.scheduleDate = {};
      if (startDate) scheduleQuery.scheduleDate.$gte = new Date(startDate);
      if (endDate) scheduleQuery.scheduleDate.$lte = new Date(endDate);
    }

    if (scheduleType && ["pickup", "delivery"].includes(scheduleType)) {
      scheduleQuery.type = scheduleType;
    }

    // Get schedules that match our criteria
    const matchingSchedules = await VehicleSchedule.find(scheduleQuery)
      .select("assignedParcels scheduleDate type timeSlot branch")
      .populate("branch", "branchId location")
      .lean();

    // Extract all parcel IDs from matching schedules
    const parcelIds = matchingSchedules.reduce((acc, schedule) => {
      if (schedule.assignedParcels && schedule.assignedParcels.length > 0) {
        acc.push(...schedule.assignedParcels);
      }
      return acc;
    }, []);

    if (parcelIds.length === 0) {
      return res.status(200).json({
        status: "success",
        message: "No parcels found for the specified criteria",
        data: {
          parcels: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalRecords: 0,
            hasNext: false,
            hasPrev: false,
            limit: parseInt(limit)
          },
          summary: {
            totalParcels: 0,
            statusBreakdown: {},
            typeBreakdown: {}
          }
        }
      });
    }

    // Build parcel query
    let parcelQuery = { _id: { $in: parcelIds } };

    // Add status filter
    if (status) {
      parcelQuery.status = status;
    }

    // Add item type filter
    if (itemType) {
      parcelQuery.itemType = itemType;
    }

    // Pagination and sorting
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    // Fetch parcels with detailed information
    const [parcels, totalCount] = await Promise.all([
      Parcel.find(parcelQuery)
        .populate("senderId", "name email contactNo address")
        .populate("receiverId", "name email contactNo address")
        .populate("from", "branchId location")
        .populate("to", "branchId location")
        .populate("paymentId", "amount status paymentMethod")
        .sort(sort)
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      Parcel.countDocuments(parcelQuery)
    ]);

    // Enrich parcels with schedule information
    const enrichedParcels = parcels.map(parcel => {
      const relatedSchedules = matchingSchedules.filter(schedule => 
        schedule.assignedParcels.some(pid => pid.toString() === parcel._id.toString())
      );

      return {
        ...parcel,
        formattedCreatedAt: new Date(parcel.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }),
        schedules: relatedSchedules.map(schedule => ({
          scheduleDate: schedule.scheduleDate,
          formattedScheduleDate: new Date(schedule.scheduleDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
          }),
          type: schedule.type,
          timeSlot: schedule.timeSlot,
          branch: schedule.branch
        }))
      };
    });

    // Calculate summary statistics
    const summary = await calculateParcelSummary(parcelIds);

    res.status(200).json({
      status: "success",
      message: "Vehicle parcels fetched successfully",
      data: {
        parcels: enrichedParcels,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalRecords: totalCount,
          hasNext: skip + parcels.length < totalCount,
          hasPrev: parseInt(page) > 1,
          limit: parseInt(limit)
        },
        summary,
        vehicle: {
          vehicleId: vehicle.vehicleId,
          registrationNo: vehicle.registrationNo,
          vehicleType: vehicle.vehicleType
        }
      }
    });

  } catch (error) {
    console.error("Error fetching vehicle parcels:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong"
    });
  }
};

/**
 * Calculate parcel summary statistics
 * @param {Array} parcelIds - Array of parcel IDs
 * @returns {Object} Summary statistics
 */
async function calculateParcelSummary(parcelIds) {
  try {
    const summaryData = await Parcel.aggregate([
      { $match: { _id: { $in: parcelIds } } },
      {
        $group: {
          _id: null,
          totalParcels: { $sum: 1 },
          statusBreakdown: {
            $push: "$status"
          },
          typeBreakdown: {
            $push: "$itemType"
          },
          sizeBreakdown: {
            $push: "$itemSize"
          },
          methodBreakdown: {
            $push: "$shippingMethod"
          }
        }
      }
    ]);

    if (summaryData.length === 0) {
      return {
        totalParcels: 0,
        statusBreakdown: {},
        typeBreakdown: {},
        sizeBreakdown: {},
        methodBreakdown: {}
      };
    }

    const data = summaryData[0];

    // Count occurrences
    const countOccurrences = (arr) => {
      return arr.reduce((acc, item) => {
        acc[item] = (acc[item] || 0) + 1;
        return acc;
      }, {});
    };

    return {
      totalParcels: data.totalParcels,
      statusBreakdown: countOccurrences(data.statusBreakdown),
      typeBreakdown: countOccurrences(data.typeBreakdown),
      sizeBreakdown: countOccurrences(data.sizeBreakdown),
      methodBreakdown: countOccurrences(data.methodBreakdown)
    };

  } catch (error) {
    console.error("Error calculating parcel summary:", error);
    return {
      totalParcels: 0,
      statusBreakdown: {},
      typeBreakdown: {},
      sizeBreakdown: {},
      methodBreakdown: {}
    };
  }
}

module.exports = fetchVehicleParcels;
