const VehicleSchedule = require("../../../models/VehicleScheduleModel");
const Vehicle = require("../../../models/VehicleModel");
const Driver = require("../../../models/driverModel");
const Branch = require("../../../models/BranchesModel");
const mongoose = require("mongoose");

/**
 * Fetch today's vehicle schedules with driver and vehicle details
 * Optimized for daily operations dashboard
 */
const getTodayVehicleSchedules = async (req, res) => {
  try {
    const { 
      branchId,
      timeSlot,
      type
    } = req.query;

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Build filter for today's schedules
    const filter = {
      scheduleDate: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    };

    if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
      filter.branch = branchId;
    }

    if (timeSlot && ['08:00 - 12:00', '13:00 - 17:00'].includes(timeSlot)) {
      filter.timeSlot = timeSlot;
    }

    if (type && ['pickup', 'delivery'].includes(type)) {
      filter.type = type;
    }

    // Fetch today's schedules with all details
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
      .sort({ timeSlot: 1, type: 1 })
      .lean();

    // Process schedules with operational status
    const processedSchedules = schedules.map(schedule => {
      const vehicle = schedule.vehicle;
      const driver = vehicle?.driverId;
      
      // Determine operational status
      const currentHour = new Date().getHours();
      let operationalStatus = 'pending';
      
      if (schedule.timeSlot === '08:00 - 12:00' && currentHour >= 8 && currentHour < 12) {
        operationalStatus = 'in_progress';
      } else if (schedule.timeSlot === '13:00 - 17:00' && currentHour >= 13 && currentHour < 17) {
        operationalStatus = 'in_progress';
      } else if (
        (schedule.timeSlot === '08:00 - 12:00' && currentHour >= 12) ||
        (schedule.timeSlot === '13:00 - 17:00' && currentHour >= 17)
      ) {
        operationalStatus = 'completed';
      }

      return {
        scheduleId: schedule._id,
        type: schedule.type,
        timeSlot: schedule.timeSlot,
        operationalStatus,
        
        // Quick Stats
        stats: {
          totalParcels: schedule.assignedParcels?.length || 0,
          totalVolume: schedule.totalVolume,
          totalWeight: schedule.totalWeight,
          utilizationVolume: vehicle?.capableVolume > 0 ? 
            ((schedule.totalVolume / vehicle.capableVolume) * 100).toFixed(1) : 0,
          utilizationWeight: vehicle?.capableWeight > 0 ? 
            ((schedule.totalWeight / vehicle.capableWeight) * 100).toFixed(1) : 0
        },
        
        // Vehicle Info
        vehicle: vehicle ? {
          vehicleId: vehicle.vehicleId,
          registrationNo: vehicle.registrationNo,
          vehicleType: vehicle.vehicleType,
          available: vehicle.available,
          capacity: {
            volume: vehicle.capableVolume,
            weight: vehicle.capableWeight
          }
        } : null,
        
        // Driver Info
        driver: driver ? {
          driverId: driver.driverId,
          name: driver.name,
          contactNo: driver.contactNo,
          licenseId: driver.licenseId
        } : null,
        
        // Branch Info
        branch: schedule.branch ? {
          branchId: schedule.branch.branchId,
          location: schedule.branch.location,
          contact: schedule.branch.contact
        } : null,
        
        // Parcel Summary
        parcelSummary: {
          total: schedule.assignedParcels?.length || 0,
          byStatus: schedule.assignedParcels?.reduce((acc, parcel) => {
            acc[parcel.status] = (acc[parcel.status] || 0) + 1;
            return acc;
          }, {}) || {},
          byType: schedule.assignedParcels?.reduce((acc, parcel) => {
            acc[parcel.itemType] = (acc[parcel.itemType] || 0) + 1;
            return acc;
          }, {}) || {},
          bySize: schedule.assignedParcels?.reduce((acc, parcel) => {
            acc[parcel.itemSize] = (acc[parcel.itemSize] || 0) + 1;
            return acc;
          }, {}) || {}
        },
        
        // Route Information (for pickups/deliveries)
        routes: schedule.assignedParcels?.map(parcel => ({
          parcelId: parcel.parcelId,
          from: parcel.from?.location || 'Unknown',
          to: parcel.to?.location || 'Unknown',
          status: parcel.status
        })) || []
      };
    });

    // Group by time slot and type for better organization
    const organizedSchedules = {
      morning: {
        pickup: processedSchedules.filter(s => s.timeSlot === '08:00 - 12:00' && s.type === 'pickup'),
        delivery: processedSchedules.filter(s => s.timeSlot === '08:00 - 12:00' && s.type === 'delivery')
      },
      afternoon: {
        pickup: processedSchedules.filter(s => s.timeSlot === '13:00 - 17:00' && s.type === 'pickup'),
        delivery: processedSchedules.filter(s => s.timeSlot === '13:00 - 17:00' && s.type === 'delivery')
      }
    };

    // Generate today's summary
    const todaySummary = {
      totalSchedules: processedSchedules.length,
      byType: {
        pickup: processedSchedules.filter(s => s.type === 'pickup').length,
        delivery: processedSchedules.filter(s => s.type === 'delivery').length
      },
      byTimeSlot: {
        morning: processedSchedules.filter(s => s.timeSlot === '08:00 - 12:00').length,
        afternoon: processedSchedules.filter(s => s.timeSlot === '13:00 - 17:00').length
      },
      byStatus: {
        pending: processedSchedules.filter(s => s.operationalStatus === 'pending').length,
        inProgress: processedSchedules.filter(s => s.operationalStatus === 'in_progress').length,
        completed: processedSchedules.filter(s => s.operationalStatus === 'completed').length
      },
      totalParcels: processedSchedules.reduce((sum, s) => sum + s.stats.totalParcels, 0),
      totalVolume: processedSchedules.reduce((sum, s) => sum + s.stats.totalVolume, 0),
      totalWeight: processedSchedules.reduce((sum, s) => sum + s.stats.totalWeight, 0),
      driversAssigned: processedSchedules.filter(s => s.driver).length,
      driversNotAssigned: processedSchedules.filter(s => !s.driver).length
    };

    return res.status(200).json({
      success: true,
      message: "Today's vehicle schedules fetched successfully",
      data: {
        date: today.toISOString().split('T')[0],
        schedules: {
          all: processedSchedules,
          organized: organizedSchedules
        },
        summary: todaySummary,
        filters: {
          branchId: branchId || null,
          timeSlot: timeSlot || null,
          type: type || null
        }
      }
    });

  } catch (error) {
    console.error("Error fetching today's vehicle schedules:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch today's vehicle schedules",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = getTodayVehicleSchedules;
