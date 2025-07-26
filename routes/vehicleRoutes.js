
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const VehicleSchedule = require("../models/VehicleScheduleModel");
const Vehicle = require("../models/VehicleModel");
const Driver = require("../models/driverModel");
const isStaffAuthenticated = require("../middleware/staffAuth");
const { 
    assignVehicle, 
    findVehicleForShipment, 
    getPendingB2BShipments,
    getShipmentsByBranch,
    assignVehicleManual,
    assignVehicleSmart,
    confirmVehicleAssignment,
    // PHASE 4 - Additional Parcels functionality
    getAvailableParcelsForShipment,
    addParcelsToShipment,
    // ENHANCED API
    enhancedFindVehicleForShipment,
    findAvailableParcelsForRoute,
    addParcelsToCurrentShipment
} = require("../controllers/shipmentManagementControllers/vehicleController");
const shipmentModel = require("../models/B2BShipmentModel");

// Route to find available vehicle for a shipment (for user confirmation)
router.get("/findVehicleForShipment/:id/:deliveryType", isStaffAuthenticated, async (req, res) => {
    try {
        const shipmentId = req.params.id;
        const shipmentType = req.params.deliveryType;
        const vehicleDetails = await findVehicleForShipment(shipmentId, shipmentType);

        if (!vehicleDetails.success) {
            return res.status(404).json({ 
                success: false,
                message: vehicleDetails.message || "No available vehicle found for the shipment",
                error: vehicleDetails.error
            });
        }

        res.status(200).json({
            success: true,
            message: "Vehicle found successfully",
            data: vehicleDetails
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post("/assignVehicleToShipment/:id/:deliveryType", async (req, res) => {
    try {

        const shipmentId = req.params.id;
        const shipmentType = req.params.deliveryType;
        const vehicleAssigned = await assignVehicle(shipmentId, shipmentType);

        if (!vehicleAssigned) {
            return res.status(404).json({ message: "No available vehicle found for the shipment" });
        }
        res.status(200).json({
            message: "Vehicle assigned successfully",
            data: vehicleAssigned
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});


router.get("/b2b/shipments/branch/:branchId", getShipmentsByBranch);

//to get pending B2B shipments for a specific staff member's center
router.get("/b2b/shipments/:staffId", getPendingB2BShipments);


// Manual vehicle assignment
router.post("/b2b/shipments/:shipmentId/assign-vehicle/manual", assignVehicleManual);

// Smart vehicle assignment (find vehicle using 3-step search)
router.get("/b2b/shipments/:shipmentId/assign-vehicle/smart", assignVehicleSmart);

// Confirm vehicle assignment
router.post("/b2b/shipments/:shipmentId/assign-vehicle/confirm", confirmVehicleAssignment);

// Get available additional parcels for a shipment with assigned vehicle
router.get("/b2b/shipments/:shipmentId/available-parcels", getAvailableParcelsForShipment);

// Add selected parcels to shipment
router.post("/b2b/shipments/:shipmentId/add-parcels", addParcelsToShipment);

// ENHANCED VEHICLE ASSIGNMENT API - Complete 6-step workflow
router.get("/b2b/shipments/:shipmentId/:deliveryType/enhanced-find-vehicle", enhancedFindVehicleForShipment);

// Add parcels to current shipment and finalize assignment
router.post("/b2b/shipments/:shipmentId/add-parcels-to-current", addParcelsToCurrentShipment);

// Get vehicle schedule statistics for a specific date and branch
router.get("/schedules/stats/:branchId/:date", async (req, res) => {
    try {
        const branchId = req.params.branchId;
        const dateStr = req.params.date;
        
        // Parse date to handle different timezone storage formats in database
        const [year, month, day] = dateStr.split('-');
        
        console.log("=== VEHICLE SCHEDULE STATS API CALLED ===");
        console.log("Branch ID:", branchId);
        console.log("Date received:", req.params.date);
        console.log("Parsed year:", year, "month:", month, "day:", day);
        
        // First, let's check what schedules exist for this branch (any date)
        const allBranchSchedules = await VehicleSchedule.find({ branch: branchId });
        console.log("All schedules for this branch:", allBranchSchedules.length);
        
        // Let's also check all delivery schedules regardless of branch for this date
        const allDateSchedules = await VehicleSchedule.aggregate([
            {
                $match: {
                    type: "delivery",
                    $expr: {
                        $and: [
                            { $eq: [{ $year: "$scheduleDate" }, parseInt(year)] },
                            { $eq: [{ $month: "$scheduleDate" }, parseInt(month)] },
                            { $eq: [{ $dayOfMonth: "$scheduleDate" }, parseInt(day)] }
                        ]
                    }
                }
            }
        ]);
        console.log("All delivery schedules for this date (any branch):", allDateSchedules.length);
        
        // Now check our specific query
        const schedules = await VehicleSchedule.aggregate([
            {
                $match: {
                    branch: new mongoose.Types.ObjectId(branchId),
                    type: { $in: ["pickup", "delivery"] }, // Include both pickup and delivery
                    $expr: {
                        $and: [
                            { $eq: [{ $year: "$scheduleDate" }, parseInt(year)] },
                            { $eq: [{ $month: "$scheduleDate" }, parseInt(month)] },
                            { $eq: [{ $dayOfMonth: "$scheduleDate" }, parseInt(day)] }
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "vehicles",
                    localField: "vehicle",
                    foreignField: "_id",
                    as: "vehicle"
                }
            },
            {
                $unwind: {
                    path: "$vehicle",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "drivers",
                    localField: "vehicle.driverId",
                    foreignField: "_id",
                    as: "driver"
                }
            },
            {
                $unwind: {
                    path: "$driver",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "parcels",
                    localField: "assignedParcels",
                    foreignField: "_id",
                    as: "assignedParcels"
                }
            }
        ]);
        
        console.log("Schedules found:", schedules.length);
        schedules.forEach((schedule, index) => {
            console.log(`Schedule ${index + 1}:`, {
                id: schedule._id,
                vehicle: schedule.vehicle?.vehicleId,
                driver: schedule.driver?.name,
                parcels: schedule.assignedParcels?.length,
                timeSlot: schedule.timeSlot,
                scheduleDate: schedule.scheduleDate
            });
        });
        
        // Process schedules to create the response format
        const vehicleStats = schedules.map(schedule => {
            const vehicle = schedule.vehicle;
            const driver = schedule.driver;
            
            return {
                scheduleId: schedule._id,
                vehicleId: vehicle?.vehicleId || 'UNASSIGNED',
                vehicleRegistration: vehicle?.registrationNo || 'Unknown',
                driverId: driver?.driverId || 'UNASSIGNED',
                driverName: driver?.name || 'Unassigned',
                parcels: schedule.assignedParcels?.length || 0,
                parcelIds: schedule.assignedParcels?.map(p => p._id) || [],
                timeSlot: schedule.timeSlot,
                scheduleType: schedule.type,
                totalVolume: schedule.totalVolume,
                totalWeight: schedule.totalWeight,
                scheduleDate: schedule.scheduleDate
            };
        });
        
        // If no schedules found, show unassigned entry
        if (vehicleStats.length === 0) {
            vehicleStats.push({
                vehicleId: 'UNASSIGNED',
                vehicleRegistration: 'Unknown',
                driverId: 'UNASSIGNED',
                driverName: 'Unassigned',
                parcels: 0,
                timeSlot: 'N/A',
                totalVolume: 0,
                totalWeight: 0
            });
        }
        
        console.log("Final vehicle stats:", vehicleStats);
        
        res.status(200).json({
            success: true,
            vehicles: vehicleStats,
            totalSchedules: schedules.length,
            date: req.params.date
        });
        
    } catch (error) {
        console.error("=== VEHICLE SCHEDULE STATS ERROR ===");
        console.error("Error:", error);
        console.error("Stack trace:", error.stack);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get detailed parcel information for a specific vehicle schedule
router.get("/schedules/:scheduleId/parcels", async (req, res) => {
    try {
        const scheduleId = req.params.scheduleId;
        
        console.log("=== VEHICLE SCHEDULE PARCELS API CALLED ===");
        console.log("Schedule ID:", scheduleId);
        
        // Find the schedule with populated parcels (only essential fields)
        const schedule = await VehicleSchedule.findById(scheduleId)
            .populate({
                path: 'assignedParcels',
                select: 'parcelId trackingNo shippingMethod itemSize status'
            })
            .populate('vehicle', 'vehicleId registrationNo')
            .populate('branch', 'branchName address');
        
        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "Schedule not found"
            });
        }
        
        console.log("Schedule found with", schedule.assignedParcels?.length || 0, "parcels");
        
        // Format the parcel details (only essential 5 fields)
        const parcelDetails = schedule.assignedParcels?.map(parcel => ({
            parcelId: parcel.parcelId,
            trackingNumber: parcel.trackingNo || 'N/A',
            deliveryType: parcel.shippingMethod || 'N/A',
            itemSize: parcel.itemSize || 'N/A',
            status: parcel.status || 'Unknown'
        })) || [];
        
        res.status(200).json({
            success: true,
            schedule: {
                scheduleId: schedule._id,
                vehicleId: schedule.vehicle?.vehicleId || 'Unknown',
                vehicleRegistration: schedule.vehicle?.registrationNo || 'Unknown',
                timeSlot: schedule.timeSlot,
                scheduleType: schedule.type,
                scheduleDate: schedule.scheduleDate,
                branch: schedule.branch?.branchName || 'Unknown',
                totalVolume: schedule.totalVolume,
                totalWeight: schedule.totalWeight
            },
            parcels: parcelDetails,
            totalParcels: parcelDetails.length
        });
        
    } catch (error) {
        console.error("=== VEHICLE SCHEDULE PARCELS ERROR ===");
        console.error("Error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router; 