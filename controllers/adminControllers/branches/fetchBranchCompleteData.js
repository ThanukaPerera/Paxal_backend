const Branch = require("../../../models/BranchesModel");
const Driver = require("../../../models/DriverModel");
const Staff = require("../../../models/StaffModel");
const Parcel = require("../../../models/ParcelModel");
const Vehicle = require("../../../models/VehicleModel");
const VehicleSchedule = require("../../../models/VehicleScheduleModel");
const B2BShipment = require("../../../models/B2BShipmentModel");
const { ObjectId } = require('mongoose').Types;

const fetchBranchCompleteData = async (req, res) => {
  const { id } = req.params;

  try {
    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid branch ID format" 
      });
    }

    // Check if branch exists
    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({ 
        success: false,
        message: "Branch not found" 
      });
    }

    // Convert string ID to ObjectId
    const branchObjectId = new ObjectId(id);
    
    // Get today's date range
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    // Fetch all branch-related data in parallel
    const [
      drivers,
      staff,
      parcels,
      vehicles,
      vehicleSchedules,
      shipments,
      parcelStats,
      driverStats,
      staffStats,
      vehicleStats
    ] = await Promise.all([
      // Fetch drivers with better population
      Driver.find({ branchId: branchObjectId })
        .populate({
          path: 'vehicleId',
          select: 'vehicleId registrationNo vehicleType available capableVolume capableWeight',
          match: { _id: { $exists: true } }
        })
        .populate('branchId', 'branchId location')
        .select('-password')
        .lean(),

      // Fetch staff
      Staff.find({ branchId: branchObjectId })
        .populate('branchId', 'branchId location')
        .select('-password -resetPasswordToken -resetPasswordTokenExpires')
        .lean(),

      // Fetch recent parcels (last 20)
      Parcel.find({
        $or: [
          { from: branchObjectId },
          { to: branchObjectId }
        ]
      })
        .populate('senderId', 'name email fName lName userId')
        .populate('receiverId', 'name email')
        .populate('from', 'branchId location')
        .populate('to', 'branchId location')
        .populate('orderPlacedStaffId', 'staffId name')
        .populate('shipmentId', 'shipmentId status')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),

      // Fetch vehicles assigned to this branch
      Vehicle.find({ assignedBranch: branchObjectId })
        .populate('assignedBranch', 'branchId location')
        .populate('currentBranch', 'branchId location')
        .lean(),

      // Fetch today's vehicle schedules
      VehicleSchedule.find({ 
        branch: branchObjectId,
        scheduleDate: {
          $gte: startOfToday,
          $lt: endOfToday
        }
      })
        .populate('vehicle', 'vehicleId registrationNo vehicleType')
        .populate('assignedParcels', 'parcelId trackingNo status itemType')
        .populate('branch', 'branchId location')
        .lean(),

      // Fetch shipments related to this branch
      B2BShipment.find({
        $or: [
          { sourceCenter: branchObjectId },
          { createdByCenter: branchObjectId },
          { route: { $in: [branchObjectId] } },
          { currentLocation: branchObjectId }
        ]
      })
        .populate('sourceCenter', 'branchId location')
        .populate('currentLocation', 'branchId location')
        .populate('route', 'branchId location')
        .populate('assignedVehicle', 'vehicleId registrationNo vehicleType')
        .populate('assignedDriver', 'driverId name')
        .populate('parcels', 'parcelId trackingNo status')
        .populate('createdByStaff', 'staffId name')
        .sort({ createdAt: -1 })
        .lean(),

      // Get comprehensive parcel statistics
      Parcel.aggregate([
        { 
          $match: { 
            $or: [
              { from: branchObjectId }, 
              { to: branchObjectId }
            ] 
          } 
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Get accurate driver statistics
      Driver.aggregate([
        { $match: { branchId: branchObjectId } },
        {
          $lookup: {
            from: 'vehicles',
            localField: 'vehicleId',
            foreignField: '_id',
            as: 'vehicle'
          }
        },
        {
          $addFields: {
            hasVehicle: { 
              $and: [
                { $ne: ['$vehicleId', null] },
                { $gt: [{ $size: '$vehicle' }, 0] }
              ]
            },
            vehicleAvailable: { 
              $cond: {
                if: { $gt: [{ $size: '$vehicle' }, 0] },
                then: { $arrayElemAt: ['$vehicle.available', 0] },
                else: false
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            totalDrivers: { $sum: 1 },
            driversWithVehicles: { $sum: { $cond: ['$hasVehicle', 1, 0] } },
            driversWithAvailableVehicles: { 
              $sum: { $cond: [{ $and: ['$hasVehicle', '$vehicleAvailable'] }, 1, 0] } 
            }
          }
        }
      ]),

      // Get staff statistics by status
      Staff.aggregate([
        { $match: { branchId: branchObjectId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Get vehicle statistics
      Vehicle.aggregate([
        { $match: { assignedBranch: branchObjectId } },
        {
          $group: {
            _id: '$available',
            count: { $sum: 1 },
            totalVolume: { $sum: '$capableVolume' },
            totalWeight: { $sum: '$capableWeight' }
          }
        }
      ])
    ]);

    // Debug logging for count verification
    console.log(`Branch ${id} Data Summary:`);
    console.log(`- Drivers found: ${drivers.length}`);
    console.log(`- Staff found: ${staff.length}`);
    console.log(`- Vehicles found: ${vehicles.length}`);
    console.log(`- Recent parcels: ${parcels.length}`);
    console.log(`- Today's schedules: ${vehicleSchedules.length}`);
    console.log(`- Shipments found: ${shipments.length}`);
    console.log(`- Driver stats:`, driverStats);
    console.log(`- Staff stats:`, staffStats);
    console.log(`- Vehicle stats RAW:`, JSON.stringify(vehicleStats, null, 2));
    console.log(`- Vehicles list sample:`, vehicles.slice(0, 3).map(v => ({ id: v._id, available: v.available, vehicleId: v.vehicleId })));

    // Get today's schedule summary with enhanced data
    const todayScheduleSummary = {
      totalSchedules: vehicleSchedules.length,
      pickupSchedules: vehicleSchedules.filter(s => s.type === 'pickup').length,
      deliverySchedules: vehicleSchedules.filter(s => s.type === 'delivery').length,
      totalParcelsScheduled: vehicleSchedules.reduce((sum, schedule) => sum + (schedule.assignedParcels?.length || 0), 0),
      schedulesByTimeSlot: vehicleSchedules.reduce((acc, schedule) => {
        const slot = schedule.timeSlot || 'Unknown';
        acc[slot] = (acc[slot] || 0) + 1;
        return acc;
      }, {})
    };

    // Format parcel statistics with enhanced data
    const parcelStatistics = {
      total: parcels.length,
      byStatus: parcelStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      totalInSystem: parcelStats.reduce((sum, stat) => sum + stat.count, 0)
    };

    // Format driver statistics with accurate counts
    const driverStatistics = driverStats[0] || {
      totalDrivers: 0,
      driversWithVehicles: 0,
      driversWithAvailableVehicles: 0
    };

    // Format staff statistics
    const staffStatistics = {
      total: staff.length,
      byStatus: staffStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      activeCount: staffStats.find(s => s._id === 'active')?.count || 0,
      inactiveCount: staffStats.find(s => s._id === 'inactive')?.count || 0
    };

    // Format vehicle statistics with improved logic
    const vehicleStatistics = {
      total: vehicles.length,
      available: 0,
      inUse: 0,
      totalCapacity: {
        volume: 0,
        weight: 0
      }
    };

    // Process vehicle stats more carefully
    if (vehicleStats && vehicleStats.length > 0) {
      vehicleStats.forEach(stat => {
        if (stat._id === true) {
          vehicleStatistics.available = stat.count || 0;
        } else if (stat._id === false) {
          vehicleStatistics.inUse = stat.count || 0;
        }
        vehicleStatistics.totalCapacity.volume += stat.totalVolume || 0;
        vehicleStatistics.totalCapacity.weight += stat.totalWeight || 0;
      });
    }

    // Fallback: count manually from vehicles array if aggregation didn't work
    if (vehicleStatistics.available === 0 && vehicleStatistics.inUse === 0 && vehicles.length > 0) {
      console.log('Aggregation failed, counting manually...');
      vehicleStatistics.available = vehicles.filter(v => v.available === true).length;
      vehicleStatistics.inUse = vehicles.filter(v => v.available === false).length;
      vehicleStatistics.totalCapacity.volume = vehicles.reduce((sum, v) => sum + (v.capableVolume || 0), 0);
      vehicleStatistics.totalCapacity.weight = vehicles.reduce((sum, v) => sum + (v.capableWeight || 0), 0);
    }

    console.log('Processed vehicle statistics:', vehicleStatistics);

    // Calculate branch performance metrics with correct ObjectId usage
    const performanceMetrics = {
      totalParcelsToday: await Parcel.countDocuments({
        $or: [{ from: branchObjectId }, { to: branchObjectId }],
        createdAt: {
          $gte: startOfToday,
          $lt: endOfToday
        }
      }),
      deliveredToday: await Parcel.countDocuments({
        $or: [{ from: branchObjectId }, { to: branchObjectId }],
        status: 'Delivered',
        updatedAt: {
          $gte: startOfToday,
          $lt: endOfToday
        }
      }),
      pendingPickups: await Parcel.countDocuments({
        from: branchObjectId,
        status: 'PendingPickup'
      }),
      inTransit: await Parcel.countDocuments({
        $or: [{ from: branchObjectId }, { to: branchObjectId }],
        status: 'InTransit'
      }),
      shipmentsPending: await B2BShipment.countDocuments({
        $or: [
          { sourceCenter: branchObjectId },
          { createdByCenter: branchObjectId }
        ],
        status: 'Pending'
      }),
      shipmentsInTransit: await B2BShipment.countDocuments({
        $or: [
          { sourceCenter: branchObjectId },
          { route: { $in: [branchObjectId] } }
        ],
        status: 'In Transit'
      })
    };

    // Enhanced shipment data
    const shipmentData = {
      list: shipments,
      statistics: {
        total: shipments.length,
        byStatus: shipments.reduce((acc, shipment) => {
          acc[shipment.status] = (acc[shipment.status] || 0) + 1;
          return acc;
        }, {}),
        totalParcelsInShipments: shipments.reduce((sum, shipment) => sum + (shipment.parcels?.length || 0), 0)
      }
    };

    res.status(200).json({
      success: true,
      message: "Complete branch data fetched successfully",
      data: {
        branch: {
          id: branch._id,
          branchId: branch.branchId,
          location: branch.location,
          contact: branch.contact,
          createdAt: branch.createdAt,
          updatedAt: branch.updatedAt
        },
        summary: {
          totalDrivers: drivers.length,
          totalStaff: staff.length,
          totalVehicles: vehicles.length,
          recentParcels: parcels.length,
          todaySchedules: vehicleSchedules.length,
          totalShipments: shipments.length
        },
        drivers: {
          list: drivers,
          statistics: driverStatistics
        },
        staff: {
          list: staff,
          statistics: staffStatistics
        },
        parcels: {
          recent: parcels,
          statistics: parcelStatistics
        },
        vehicles: {
          list: vehicles,
          schedules: vehicleSchedules,
          todayScheduleSummary,
          statistics: vehicleStatistics
        },
        shipments: shipmentData,
        performanceMetrics,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Error fetching complete branch data:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = fetchBranchCompleteData;
