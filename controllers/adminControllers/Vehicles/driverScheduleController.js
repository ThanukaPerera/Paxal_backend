const VehicleSchedule = require("../../../models/VehicleScheduleModel");
const Vehicle = require("../../../models/VehicleModel");
const Driver = require("../../../models/driverModel");
const mongoose = require("mongoose");

/**
 * Get driver's own vehicle schedules
 * @param {Object} req - Request object (should contain driver info from auth middleware)
 * @param {Object} res - Response object
 */
const getMyVehicleSchedules = async (req, res) => {
  try {
    const driverId = req.driver?.driverId || req.params.driverId;
    const { startDate, endDate, type } = req.query;

    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: "Driver ID is required"
      });
    }

    // Find vehicles assigned to this driver
    const vehicles = await Vehicle.find({ driverId }).select('_id vehicleId registrationNo').lean();
    
    if (vehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No vehicles assigned to this driver"
      });
    }

    const vehicleIds = vehicles.map(v => v._id);
    const filter = { vehicle: { $in: vehicleIds } };

    // Add filters
    if (type && ['pickup', 'delivery'].includes(type)) {
      filter.type = type;
    }

    if (startDate || endDate) {
      filter.scheduleDate = {};
      if (startDate) filter.scheduleDate.$gte = new Date(startDate);
      if (endDate) filter.scheduleDate.$lte = new Date(endDate);
    }

    const schedules = await VehicleSchedule.find(filter)
      .populate({
        path: 'vehicle',
        select: 'vehicleId registrationNo vehicleType capableVolume capableWeight'
      })
      .populate('branch', 'branchId location contact')
      .populate({
        path: 'assignedParcels',
        select: 'parcelId trackingNo itemType itemSize status pickupInformation deliveryInformation',
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

    // Format response for driver mobile app or interface
    const formattedSchedules = schedules.map(schedule => ({
      scheduleId: schedule._id,
      date: schedule.scheduleDate,
      timeSlot: schedule.timeSlot,
      type: schedule.type,
      status: getScheduleStatus(schedule.scheduleDate, schedule.timeSlot),
      
      // Vehicle info
      vehicle: {
        vehicleId: schedule.vehicle?.vehicleId,
        registrationNo: schedule.vehicle?.registrationNo,
        type: schedule.vehicle?.vehicleType
      },
      
      // Branch info
      branch: {
        location: schedule.branch?.location,
        contact: schedule.branch?.contact
      },
      
      // Parcels summary
      parcels: {
        total: schedule.assignedParcels?.length || 0,
        completed: schedule.assignedParcels?.filter(p => 
          p.status === 'Delivered' || p.status === 'PickedUp'
        ).length || 0,
        pending: schedule.assignedParcels?.filter(p => 
          p.status !== 'Delivered' && p.status !== 'PickedUp'
        ).length || 0,
        list: schedule.assignedParcels?.map(parcel => ({
          parcelId: parcel.parcelId,
          trackingNo: parcel.trackingNo,
          itemType: parcel.itemType,
          itemSize: parcel.itemSize,
          status: parcel.status,
          
          // Pickup details if type is pickup
          pickupDetails: schedule.type === 'pickup' && parcel.pickupInformation ? {
            address: parcel.pickupInformation.address,
            city: parcel.pickupInformation.city,
            pickupDate: parcel.pickupInformation.pickupDate,
            pickupTime: parcel.pickupInformation.pickupTime
          } : null,
          
          // Delivery details if type is delivery
          deliveryDetails: schedule.type === 'delivery' && parcel.deliveryInformation ? {
            address: parcel.deliveryInformation.deliveryAddress,
            city: parcel.deliveryInformation.deliveryCity,
            postalCode: parcel.deliveryInformation.postalCode
          } : null,
          
          // Contact info
          sender: parcel.senderId ? {
            name: parcel.senderId.name,
            contact: parcel.senderId.contactNo
          } : null,
          
          receiver: parcel.receiverId ? {
            name: parcel.receiverId.name,
            contact: parcel.receiverId.contactNo
          } : null
        })) || []
      },
      
      // Load info
      load: {
        totalVolume: schedule.totalVolume,
        totalWeight: schedule.totalWeight,
        vehicleCapacity: {
          volume: schedule.vehicle?.capableVolume,
          weight: schedule.vehicle?.capableWeight
        }
      }
    }));

    return res.status(200).json({
      success: true,
      driverInfo: {
        driverId: driverId,
        assignedVehicles: vehicles.length,
        totalSchedules: schedules.length
      },
      data: formattedSchedules
    });

  } catch (error) {
    console.error("Error fetching driver schedules:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching your schedules",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get today's schedules for driver
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getTodaySchedules = async (req, res) => {
  try {
    const driverId = req.driver?.driverId || req.params.driverId;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find vehicles assigned to this driver
    const vehicles = await Vehicle.find({ driverId }).select('_id').lean();
    const vehicleIds = vehicles.map(v => v._id);

    const todaySchedules = await VehicleSchedule.find({
      vehicle: { $in: vehicleIds },
      scheduleDate: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .populate('vehicle', 'vehicleId registrationNo')
    .populate('branch', 'location contact')
    .populate({
      path: 'assignedParcels',
      select: 'parcelId trackingNo status pickupInformation deliveryInformation',
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
    .sort({ timeSlot: 1 })
    .lean();

    const summary = {
      totalSchedules: todaySchedules.length,
      pickupSchedules: todaySchedules.filter(s => s.type === 'pickup').length,
      deliverySchedules: todaySchedules.filter(s => s.type === 'delivery').length,
      totalParcels: todaySchedules.reduce((sum, s) => sum + (s.assignedParcels?.length || 0), 0),
      completedParcels: todaySchedules.reduce((sum, s) => 
        sum + (s.assignedParcels?.filter(p => p.status === 'Delivered' || p.status === 'PickedUp').length || 0), 0
      )
    };

    return res.status(200).json({
      success: true,
      date: today.toISOString().split('T')[0],
      summary,
      schedules: todaySchedules
    });

  } catch (error) {
    console.error("Error fetching today's schedules:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching today's schedules",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update parcel status in schedule (for drivers)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateParcelStatusInSchedule = async (req, res) => {
  try {
    const { scheduleId, parcelId } = req.params;
    const { status, notes } = req.body;
    const driverId = req.driver?.driverId;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(scheduleId) || !mongoose.Types.ObjectId.isValid(parcelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid schedule or parcel ID format"
      });
    }

    const validStatuses = ['PickedUp', 'Delivered', 'NotAccepted', 'WrongAddress'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: " + validStatuses.join(', ')
      });
    }

    // Find the schedule and verify driver ownership
    const schedule = await VehicleSchedule.findById(scheduleId)
      .populate('vehicle')
      .lean();

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found"
      });
    }

    // Verify driver owns this vehicle
    if (schedule.vehicle.driverId.toString() !== driverId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: This schedule is not assigned to you"
      });
    }

    // Update the parcel status
    const parcel = await Parcel.findById(parcelId);
    if (!parcel) {
      return res.status(404).json({
        success: false,
        message: "Parcel not found"
      });
    }

    // Update parcel with timestamp
    const updateData = { 
      status,
      updatedAt: new Date()
    };

    if (status === 'PickedUp') {
      updateData.parcelPickedUpDate = new Date();
    } else if (status === 'Delivered') {
      updateData.parcelDeliveredDate = new Date();
    }

    await Parcel.findByIdAndUpdate(parcelId, updateData);

    return res.status(200).json({
      success: true,
      message: `Parcel status updated to ${status}`,
      data: {
        parcelId: parcel.parcelId,
        newStatus: status,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error("Error updating parcel status:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating parcel status",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Helper function to determine schedule status
const getScheduleStatus = (scheduleDate, timeSlot) => {
  const now = new Date();
  const scheduleDateTime = new Date(scheduleDate);
  
  // Set time based on time slot
  if (timeSlot === "08:00 - 12:00") {
    scheduleDateTime.setHours(8, 0, 0, 0);
  } else {
    scheduleDateTime.setHours(13, 0, 0, 0);
  }

  if (scheduleDateTime > now) {
    return 'upcoming';
  } else if (scheduleDateTime.toDateString() === now.toDateString()) {
    return 'active';
  } else {
    return 'completed';
  }
};

module.exports = {
  getMyVehicleSchedules,
  getTodaySchedules,
  updateParcelStatusInSchedule
};
