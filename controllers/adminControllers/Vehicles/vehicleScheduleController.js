const VehicleSchedule = require("../../../models/VehicleScheduleModel");
const Vehicle = require("../../../models/VehicleModel");
const Driver = require("../../../models/driverModel");
const Branch = require("../../../models/BranchesModel");
const Parcel = require("../../../models/parcelModel");
const mongoose = require("mongoose");

/**
 * Get all vehicle schedules with complete vehicle and driver details
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAllVehicleSchedules = async (req, res) => {
  try {
    const { 
      type, 
      scheduleDate, 
      branchId, 
      timeSlot,
      page = 1, 
      limit = 20 
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (type && ['pickup', 'delivery'].includes(type)) {
      filter.type = type;
    }
    
    if (scheduleDate) {
      const startDate = new Date(scheduleDate);
      const endDate = new Date(scheduleDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.scheduleDate = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
      filter.branch = branchId;
    }
    
    if (timeSlot && ['08:00 - 12:00', '13:00 - 17:00'].includes(timeSlot)) {
      filter.timeSlot = timeSlot;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with comprehensive population
    const schedules = await VehicleSchedule.find(filter)
      .populate({
        path: 'vehicle',
        select: 'vehicleId registrationNo vehicleType assignedBranch currentBranch capableVolume capableWeight available',
        populate: [
          {
            path: 'driverId',
            select: 'driverId name nic email contactNo licenseId',
            model: 'Driver'
          },
          {
            path: 'assignedBranch',
            select: 'branchId location contact',
            model: 'Branch'
          },
          {
            path: 'currentBranch',
            select: 'branchId location contact',
            model: 'Branch'
          }
        ]
      })
      .populate({
        path: 'branch',
        select: 'branchId location contact'
      })
      .populate({
        path: 'assignedParcels',
        select: 'parcelId trackingNo itemType itemSize submittingType receivingType status senderId receiverId',
        populate: [
          {
            path: 'senderId',
            select: 'name email contactNo',
            model: 'User'
          },
          {
            path: 'receiverId', 
            select: 'name email contactNo',
            model: 'Receiver'
          }
        ]
      })
      .sort({ scheduleDate: -1, timeSlot: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalSchedules = await VehicleSchedule.countDocuments(filter);

    // Format response with enhanced details
    const formattedSchedules = schedules.map(schedule => ({
      scheduleId: schedule._id,
      scheduleDate: schedule.scheduleDate,
      timeSlot: schedule.timeSlot,
      type: schedule.type,
      totalVolume: schedule.totalVolume,
      totalWeight: schedule.totalWeight,
      assignedParcelsCount: schedule.assignedParcels?.length || 0,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
      
      // Branch information
      branch: {
        id: schedule.branch?._id,
        branchId: schedule.branch?.branchId,
        location: schedule.branch?.location,
        contact: schedule.branch?.contact
      },
      
      // Vehicle information
      vehicle: {
        id: schedule.vehicle?._id,
        vehicleId: schedule.vehicle?.vehicleId,
        registrationNo: schedule.vehicle?.registrationNo,
        vehicleType: schedule.vehicle?.vehicleType,
        capableVolume: schedule.vehicle?.capableVolume,
        capableWeight: schedule.vehicle?.capableWeight,
        available: schedule.vehicle?.available,
        
        // Driver information
        driver: schedule.vehicle?.driverId ? {
          id: schedule.vehicle.driverId._id,
          driverId: schedule.vehicle.driverId.driverId,
          name: schedule.vehicle.driverId.name,
          nic: schedule.vehicle.driverId.nic,
          email: schedule.vehicle.driverId.email,
          contactNo: schedule.vehicle.driverId.contactNo,
          licenseId: schedule.vehicle.driverId.licenseId
        } : null,
        
        // Branch assignments
        assignedBranch: schedule.vehicle?.assignedBranch ? {
          id: schedule.vehicle.assignedBranch._id,
          branchId: schedule.vehicle.assignedBranch.branchId,
          location: schedule.vehicle.assignedBranch.location,
          contact: schedule.vehicle.assignedBranch.contact
        } : null,
        
        currentBranch: schedule.vehicle?.currentBranch ? {
          id: schedule.vehicle.currentBranch._id,
          branchId: schedule.vehicle.currentBranch.branchId,
          location: schedule.vehicle.currentBranch.location,
          contact: schedule.vehicle.currentBranch.contact
        } : null
      },
      
      // Assigned parcels summary
      assignedParcels: schedule.assignedParcels?.map(parcel => ({
        id: parcel._id,
        parcelId: parcel.parcelId,
        trackingNo: parcel.trackingNo,
        itemType: parcel.itemType,
        itemSize: parcel.itemSize,
        submittingType: parcel.submittingType,
        receivingType: parcel.receivingType,
        status: parcel.status,
        sender: parcel.senderId ? {
          id: parcel.senderId._id,
          name: parcel.senderId.name,
          email: parcel.senderId.email,
          contactNo: parcel.senderId.contactNo
        } : null,
        receiver: parcel.receiverId ? {
          id: parcel.receiverId._id,
          name: parcel.receiverId.name,
          email: parcel.receiverId.email,
          contactNo: parcel.receiverId.contactNo
        } : null
      })) || []
    }));

    // Calculate capacity utilization
    const schedulesWithUtilization = formattedSchedules.map(schedule => ({
      ...schedule,
      capacityUtilization: {
        volumeUsed: schedule.totalVolume,
        volumeCapacity: schedule.vehicle?.capableVolume || 0,
        volumeUtilizationPercentage: schedule.vehicle?.capableVolume 
          ? ((schedule.totalVolume / schedule.vehicle.capableVolume) * 100).toFixed(2)
          : 0,
        weightUsed: schedule.totalWeight,
        weightCapacity: schedule.vehicle?.capableWeight || 0,
        weightUtilizationPercentage: schedule.vehicle?.capableWeight
          ? ((schedule.totalWeight / schedule.vehicle.capableWeight) * 100).toFixed(2)
          : 0
      }
    }));

    return res.status(200).json({
      success: true,
      data: schedulesWithUtilization,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalSchedules / parseInt(limit)),
        totalItems: totalSchedules,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < Math.ceil(totalSchedules / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1
      },
      filters: {
        type: type || 'all',
        scheduleDate: scheduleDate || 'all',
        branchId: branchId || 'all',
        timeSlot: timeSlot || 'all'
      }
    });

  } catch (error) {
    console.error("Error fetching vehicle schedules:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching vehicle schedules",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get vehicle schedules by specific type (pickup or delivery)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getVehicleSchedulesByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { scheduleDate, branchId, timeSlot } = req.query;

    if (!type || !['pickup', 'delivery'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type. Must be 'pickup' or 'delivery'"
      });
    }

    const filter = { type };
    
    if (scheduleDate) {
      const startDate = new Date(scheduleDate);
      const endDate = new Date(scheduleDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.scheduleDate = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
      filter.branch = branchId;
    }
    
    if (timeSlot && ['08:00 - 12:00', '13:00 - 17:00'].includes(timeSlot)) {
      filter.timeSlot = timeSlot;
    }

    const schedules = await VehicleSchedule.find(filter)
      .populate({
        path: 'vehicle',
        select: 'vehicleId registrationNo vehicleType capableVolume capableWeight available',
        populate: {
          path: 'driverId',
          select: 'driverId name contactNo licenseId',
          model: 'Driver'
        }
      })
      .populate('branch', 'branchId location contact')
      .populate({
        path: 'assignedParcels',
        select: 'parcelId trackingNo itemType status',
        populate: [
          {
            path: 'senderId',
            select: 'name contactNo',
            model: 'User'
          },
          {
            path: 'receiverId',
            select: 'name contactNo', 
            model: 'Receiver'
          }
        ]
      })
      .sort({ scheduleDate: 1, timeSlot: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      type: type,
      count: schedules.length,
      data: schedules
    });

  } catch (error) {
    console.error(`Error fetching ${req.params.type} schedules:`, error);
    return res.status(500).json({
      success: false,
      message: `Error fetching ${req.params.type} schedules`,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get vehicle schedule by ID with full details
 * @param {Object} req - Request object  
 * @param {Object} res - Response object
 */
const getVehicleScheduleById = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid schedule ID format"
      });
    }

    const schedule = await VehicleSchedule.findById(scheduleId)
      .populate({
        path: 'vehicle',
        populate: [
          {
            path: 'driverId',
            model: 'Driver'
          },
          {
            path: 'assignedBranch',
            model: 'Branch'
          },
          {
            path: 'currentBranch',
            model: 'Branch'
          }
        ]
      })
      .populate('branch')
      .populate({
        path: 'assignedParcels',
        populate: [
          {
            path: 'senderId',
            model: 'User'
          },
          {
            path: 'receiverId',
            model: 'Receiver'
          },
          {
            path: 'from',
            model: 'Branch'
          },
          {
            path: 'to',
            model: 'Branch'
          }
        ]
      })
      .lean();

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Vehicle schedule not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: schedule
    });

  } catch (error) {
    console.error("Error fetching vehicle schedule by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching vehicle schedule",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get vehicle schedules by driver ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getVehicleSchedulesByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { startDate, endDate } = req.query;

    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid driver ID format"
      });
    }

    // First find vehicles assigned to this driver
    const vehicles = await Vehicle.find({ driverId }).select('_id').lean();
    const vehicleIds = vehicles.map(v => v._id);

    if (vehicleIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No vehicles found for this driver"
      });
    }

    const filter = { vehicle: { $in: vehicleIds } };

    // Add date range filter if provided
    if (startDate || endDate) {
      filter.scheduleDate = {};
      if (startDate) filter.scheduleDate.$gte = new Date(startDate);
      if (endDate) filter.scheduleDate.$lte = new Date(endDate);
    }

    const schedules = await VehicleSchedule.find(filter)
      .populate({
        path: 'vehicle',
        populate: {
          path: 'driverId',
          model: 'Driver'
        }
      })
      .populate('branch')
      .populate('assignedParcels', 'parcelId trackingNo itemType status')
      .sort({ scheduleDate: -1, timeSlot: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      driverId: driverId,
      schedulesCount: schedules.length,
      data: schedules
    });

  } catch (error) {
    console.error("Error fetching schedules by driver:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching driver schedules",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get vehicle schedules statistics
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getVehicleScheduleStats = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const stats = await VehicleSchedule.aggregate([
      {
        $match: {
          scheduleDate: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        }
      },
      {
        $group: {
          _id: {
            type: "$type",
            timeSlot: "$timeSlot"
          },
          count: { $sum: 1 },
          totalParcels: { $sum: { $size: "$assignedParcels" } },
          totalVolume: { $sum: "$totalVolume" },
          totalWeight: { $sum: "$totalWeight" }
        }
      },
      {
        $group: {
          _id: "$_id.type",
          timeSlots: {
            $push: {
              timeSlot: "$_id.timeSlot",
              count: "$count",
              totalParcels: "$totalParcels",
              totalVolume: "$totalVolume",
              totalWeight: "$totalWeight"
            }
          },
          totalSchedules: { $sum: "$count" },
          totalParcelsAllSlots: { $sum: "$totalParcels" },
          totalVolumeAllSlots: { $sum: "$totalVolume" },
          totalWeightAllSlots: { $sum: "$totalWeight" }
        }
      }
    ]);

    const formattedStats = {
      date: targetDate.toISOString().split('T')[0],
      pickup: stats.find(s => s._id === 'pickup') || { 
        totalSchedules: 0, 
        totalParcelsAllSlots: 0, 
        totalVolumeAllSlots: 0, 
        totalWeightAllSlots: 0, 
        timeSlots: [] 
      },
      delivery: stats.find(s => s._id === 'delivery') || { 
        totalSchedules: 0, 
        totalParcelsAllSlots: 0, 
        totalVolumeAllSlots: 0, 
        totalWeightAllSlots: 0, 
        timeSlots: [] 
      }
    };

    return res.status(200).json({
      success: true,
      data: formattedStats
    });

  } catch (error) {
    console.error("Error fetching vehicle schedule stats:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching schedule statistics",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getAllVehicleSchedules,
  getVehicleSchedulesByType,
  getVehicleScheduleById,
  getVehicleSchedulesByDriver,
  getVehicleScheduleStats
};
