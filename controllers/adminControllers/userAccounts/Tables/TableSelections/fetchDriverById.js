const Driver = require("../../../../../models/driverModel");
const Vehicle = require("../../../../../models/vehicleModel");
const VehicleSchedule = require("../../../../../models/VehicleScheduleModel");
const B2BShipment = require("../../../../../models/B2BShipmentModel");
const Branch = require("../../../../../models/BranchesModel");
const { AppError } = require("../../../../../utils/appError");
const catchAsync = require("../../../../../utils/catchAscync");

const fetchDriverById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new AppError("Driver ID is required", 400));
  }

  try {
    // Fetch driver data with populated references
    const driver = await Driver.findById(id)
      .populate('branchId', 'branchId location contact')
      .populate('adminId', 'name email')
      .populate('vehicleId', 'vehicleId registrationNo vehicleType capableVolume capableWeight')
      .lean();

    if (!driver) {
      return next(new AppError("Driver not found", 404));
    }

    // Check vehicle type to determine what data to fetch and display
    const isShipmentVehicle = driver.vehicleId?.vehicleType === 'shipment';
    let driverStats = {};
    let recentActivities = [];
    let vehicleSchedules = [];
    let shipments = [];

    if (isShipmentVehicle) {
      // For shipment vehicles - fetch shipment data
      shipments = await B2BShipment.find({
        assignedDriver: driver._id
      })
        .populate('sourceCenter', 'branchId location contact')
        .populate('route', 'branchId location contact')
        .populate('assignedVehicle', 'registrationNo vehicleType')
        .populate('parcels', 'trackingNo status')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      // Calculate shipment statistics
      const totalShipments = shipments.length;
      const completedShipments = shipments.filter(s => s.status === 'Completed').length;
      const inTransitShipments = shipments.filter(s => s.status === 'In Transit').length;
      const pendingShipments = shipments.filter(s => s.status === 'Pending').length;

      driverStats = {
        totalShipments,
        completedShipments,
        inTransitShipments,
        pendingShipments,
        completionRate: totalShipments > 0 ? ((completedShipments / totalShipments) * 100).toFixed(1) : 0,
      };

      // Get recent shipment activities
      recentActivities = shipments.slice(0, 8).map(shipment => ({
        action: "Shipment Assignment",
        timestamp: shipment.createdAt,
        description: `Assigned to shipment ${shipment.shipmentId} (${shipment.status})`,
        type: "shipment",
        relatedId: shipment._id
      }));

    } else {
      // For pickup/delivery vehicles - fetch schedule data
      vehicleSchedules = await VehicleSchedule.find({
        vehicle: driver.vehicleId._id
      })
        .populate('branch', 'branchId location contact')
        .populate('assignedParcels', 'trackingNo status itemType')
        .sort({ scheduleDate: -1 })
        .limit(10)
        .lean();

      // Calculate schedule statistics
      const totalSchedules = vehicleSchedules.length;
      const completedSchedules = vehicleSchedules.filter(s => 
        new Date(s.scheduleDate) < new Date() && s.assignedParcels?.length > 0
      ).length;
      const activeSchedules = vehicleSchedules.filter(s => 
        new Date(s.scheduleDate) >= new Date()
      ).length;

      driverStats = {
        totalSchedules,
        completedSchedules,
        activeSchedules,
        completionRate: totalSchedules > 0 ? ((completedSchedules / totalSchedules) * 100).toFixed(1) : 0,
      };

      // Get recent schedule activities
      recentActivities = vehicleSchedules.slice(0, 8).map(schedule => ({
        action: "Schedule Assignment",
        timestamp: schedule.createdAt,
        description: `Scheduled for ${schedule.type} on ${new Date(schedule.scheduleDate).toLocaleDateString()}`,
        type: "schedule",
        relatedId: schedule._id
      }));
    }

    const responseData = {
      ...driver,
      vehicleSchedules: isShipmentVehicle ? [] : vehicleSchedules,
      shipments: isShipmentVehicle ? shipments : [],
      driverStats,
      recentActivities,
      vehicleType: driver.vehicleId?.vehicleType || 'unknown'
    };

    res.status(200).json({
      success: true,
      message: "Driver details fetched successfully",
      driver: responseData
    });

  } catch (error) {
    console.error("Error in fetchDriverById:", error);
    return next(new AppError("Failed to fetch driver details", 500));
  }
});

module.exports = fetchDriverById;
