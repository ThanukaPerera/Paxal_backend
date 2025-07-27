const VehicleSchedule = require("../../../models/VehicleScheduleModel");
const Vehicle = require("../../../models/VehicleModel");
const Driver = require("../../../models/driverModel");
const Branch = require("../../../models/BranchesModel");
const mongoose = require("mongoose");

/**
 * Fetch all vehicle schedules with detailed vehicle and driver information
 * Supports filtering by type (pickup/delivery), date range, and branch
 */
const getAllVehicleSchedules = async (req, res) => {
  try {
    const {
      type,           // pickup or delivery
      startDate,      // Filter from date
      endDate,        // Filter to date
      branchId,       // Filter by branch
      page = 1,       // Pagination
      limit = 20      // Items per page
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (type && ['pickup', 'delivery'].includes(type)) {
      filter.type = type;
    }
    
    if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
      filter.branch = branchId;
    }
    
    if (startDate || endDate) {
      filter.scheduleDate = {};
      if (startDate) {
        filter.scheduleDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.scheduleDate.$lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch vehicle schedules with comprehensive population
    const schedules = await VehicleSchedule.find(filter)
      .populate({
        path: 'vehicle',
        select: 'vehicleId registrationNo vehicleType capableVolume capableWeight available',
        populate: {
          path: 'driverId',
          select: 'driverId name email contactNo licenseId',
          model: 'Driver'
        }
      })
      .populate({
        path: 'branch',
        select: 'branchId location contact'
      })
      .populate({
        path: 'assignedParcels',
        select: 'parcelId trackingNo status itemType itemSize submittingType receivingType',
        populate: [
          {
            path: 'from',
            select: 'branchId location'
          },
          {
            path: 'to', 
            select: 'branchId location'
          }
        ]
      })
      .sort({ scheduleDate: -1, timeSlot: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalCount = await VehicleSchedule.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    // Process and enhance the schedule data
    const processedSchedules = schedules.map(schedule => {
      const vehicle = schedule.vehicle;
      const driver = vehicle?.driverId;
      
      return {
        scheduleId: schedule._id,
        scheduleDate: schedule.scheduleDate,
        timeSlot: schedule.timeSlot,
        type: schedule.type,
        totalVolume: schedule.totalVolume,
        totalWeight: schedule.totalWeight,
        parcelCount: schedule.assignedParcels?.length || 0,
        
        // Vehicle Information
        vehicle: vehicle ? {
          vehicleId: vehicle.vehicleId,
          registrationNo: vehicle.registrationNo,
          vehicleType: vehicle.vehicleType,
          capableVolume: vehicle.capableVolume,
          capableWeight: vehicle.capableWeight,
          available: vehicle.available,
          utilizationVolume: vehicle.capableVolume > 0 ? 
            ((schedule.totalVolume / vehicle.capableVolume) * 100).toFixed(2) : 0,
          utilizationWeight: vehicle.capableWeight > 0 ? 
            ((schedule.totalWeight / vehicle.capableWeight) * 100).toFixed(2) : 0
        } : null,
        
        // Driver Information
        driver: driver ? {
          driverId: driver.driverId,
          name: driver.name,
          email: driver.email,
          contactNo: driver.contactNo,
          licenseId: driver.licenseId
        } : null,
        
        // Branch Information
        branch: schedule.branch ? {
          branchId: schedule.branch.branchId,
          location: schedule.branch.location,
          contact: schedule.branch.contact
        } : null,
        
        // Parcel Information
        parcels: schedule.assignedParcels?.map(parcel => ({
          parcelId: parcel.parcelId,
          trackingNo: parcel.trackingNo,
          status: parcel.status,
          itemType: parcel.itemType,
          itemSize: parcel.itemSize,
          submittingType: parcel.submittingType,
          receivingType: parcel.receivingType,
          from: parcel.from?.location || 'Unknown',
          to: parcel.to?.location || 'Unknown'
        })) || [],
        
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt
      };
    });

    // Generate summary statistics
    const summary = {
      totalSchedules: totalCount,
      pickupSchedules: await VehicleSchedule.countDocuments({ ...filter, type: 'pickup' }),
      deliverySchedules: await VehicleSchedule.countDocuments({ ...filter, type: 'delivery' }),
      totalParcels: processedSchedules.reduce((sum, schedule) => sum + schedule.parcelCount, 0),
      totalVolume: processedSchedules.reduce((sum, schedule) => sum + schedule.totalVolume, 0),
      totalWeight: processedSchedules.reduce((sum, schedule) => sum + schedule.totalWeight, 0)
    };

    return res.status(200).json({
      success: true,
      message: "Vehicle schedules fetched successfully",
      data: {
        schedules: processedSchedules,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRecords: totalCount,
          limit: parseInt(limit),
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        },
        summary,
        filters: {
          type: type || 'all',
          dateRange: {
            startDate: startDate || null,
            endDate: endDate || null
          },
          branchId: branchId || null
        }
      }
    });

  } catch (error) {
    console.error("Error fetching vehicle schedules:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle schedules",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = getAllVehicleSchedules;
