const express = require("express");
const router = express.Router();
const {
  notifyNextCenter,
} = require("../controllers/shipmentManagementControllers/standardShipmentNotificationController");
const { addParcel } = require("../controllers/parcelController.js");
const isAuthenticated = require("../middleware/isAuthenticated.js");
const { getUserParcels } = require("../controllers/parcelController.js");
const {
  getParcelByTrackingNumber,
} = require("../controllers/parcelController.js");
const {getParcelById } = require("../controllers/parcelController.js");


// Define routes
router.post("/addparcel", isAuthenticated, addParcel); // Add a new parcel
router.get("/user_parcels", isAuthenticated, getUserParcels);
router.get("/track/:trackingNo", getParcelByTrackingNumber);
router.get("/:id", getParcelById);



// Get parcels by staff's assigned branch (exclude same origin-destination parcels)
router.get("/staff/assigned-parcels", isStaffAuthenticated, async (req, res) => {
    try {
        console.log("Fetching parcels for staff:", req.staff.name, "at branch:", req.staff.branchId.location);
        
        const parcels = await Parcel.find({
            from: req.staff.branchId._id,
            shipmentId: null,
            $expr: { $ne: ["$from", "$to"] } // Exclude parcels where from equals to
        }).populate('from', 'location')
          .populate('to', 'location');

        res.status(200).json({
            success: true,
            count: parcels.length,
            parcels,
            staffInfo: {
                name: req.staff.name,
                branch: req.staff.branchId.location,
                branchId: req.staff.branchId._id
            }
        });

    } catch (error) {
        console.error("Error fetching staff parcels:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get parcels by center (exclude same origin-destination parcels) - Keep for backward compatibility
router.get("/:center", async (req, res) => {
    try {
        console.log("Fetching parcels for center:", req.params.center);
        const parcels = await Parcel.find({
            from: req.params.center,
            shipmentId: null,
            $expr: { $ne: ["$from", "$to"] } // Exclude parcels where from equals to
        }).populate('from', 'location')
          .populate('to', 'location');

        res.status(200).json({
            success: true,
            count: parcels.length,
            parcels,
            
            
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get dashboard statistics for a center and date
router.get("/dashboard/stats/:center/:date", async (req, res) => {
    try {
        const center = req.params.center;
        const date = new Date(req.params.date);
        const nextDay = new Date(date);
        nextDay.setDate(date.getDate() + 1);
        
        console.log("=== DASHBOARD STATS API CALLED ===");
        console.log("Center:", center);
        console.log("Date received:", req.params.date);
        console.log("Date parsed:", date);
        console.log("Next day:", nextDay);
        
        // Let's first check if there are any parcels in the database at all
        const totalParcelsInDb = await Parcel.countDocuments({});
        console.log("Total parcels in database:", totalParcelsInDb);
        
        // Check parcels related to this center
        const centerParcels = await Parcel.countDocuments({
            $or: [{ from: center }, { to: center }]
        });
        console.log("Parcels related to center:", centerParcels);
        
        // Check parcels with specific statuses
        const arrivedStatusParcels = await Parcel.countDocuments({
            status: "ArrivedAtCollectionCenter"
        });
        console.log("Parcels with ArrivedAtCollectionCenter status:", arrivedStatusParcels);
        
        const deliveredStatusParcels = await Parcel.countDocuments({
            status: "Delivered"
        });
        console.log("Parcels with Delivered status:", deliveredStatusParcels);
        
        // Get arrived parcels for the selected date
        const arrivedParcels = await Parcel.countDocuments({
            $or: [{ from: center }, { to: center }],
            status: "ArrivedAtCollectionCenter",
            parcelArrivedDate: {
                $gte: date,
                $lt: nextDay
            }
        });
        
        console.log("Arrived parcels query completed. Count:", arrivedParcels);

        // Get delivered parcels for the selected date
        const deliveredParcels = await Parcel.countDocuments({
            $or: [{ from: center }, { to: center }],
            status: "Delivered",
            parcelDeliveredDate: {
                $gte: date,
                $lt: nextDay
            }
        });
        
        console.log("Delivered parcels query completed. Count:", deliveredParcels);

        // Total parcels = Arrived + Delivered
        const totalParcels = arrivedParcels + deliveredParcels;
        
        console.log("Total parcels calculated:", totalParcels);
        console.log("Final stats object:", {
            total: totalParcels,
            arrived: arrivedParcels,
            delivered: deliveredParcels
        });

        res.status(200).json({
            success: true,
            stats: {
                total: totalParcels,
                arrived: arrivedParcels,
                delivered: deliveredParcels
            }
        });

    } catch (error) {
        console.error("=== DASHBOARD STATS ERROR ===");
        console.error("Error:", error);
        console.error("Stack trace:", error.stack);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get daily parcel details for a center
router.get("/dashboard/daily/:center/:date", async (req, res) => {
    try {
        const center = req.params.center;
        const date = new Date(req.params.date);
        const nextDay = new Date(date);
        nextDay.setDate(date.getDate() + 1);
        
        console.log("=== DASHBOARD DAILY API CALLED ===");
        console.log("Center:", center);
        console.log("Date received:", req.params.date);
        console.log("Date parsed:", date);
        console.log("Next day:", nextDay);

        // Get all parcels processed on that date (arrived or delivered)
        const processedParcels = await Parcel.find({
            $and: [
                { $or: [{ from: center }, { to: center }] },
                {
                    $or: [
                        {
                            status: "ArrivedAtCollectionCenter",
                            parcelArrivedDate: {
                                $gte: date,
                                $lt: nextDay
                            }
                        },
                        {
                            status: "Delivered",
                            parcelDeliveredDate: {
                                $gte: date,
                                $lt: nextDay
                            }
                        }
                    ]
                }
            ]
        }).populate('from', 'location')
          .populate('to', 'location');
          
        console.log("Processed parcels found:", processedParcels.length);

        // Calculate statistics for the selected date
        const arrivedCount = await Parcel.countDocuments({
            $or: [{ from: center }, { to: center }],
            status: "ArrivedAtCollectionCenter",
            parcelArrivedDate: {
                $gte: date,
                $lt: nextDay
            }
        });

        const deliveredCount = await Parcel.countDocuments({
            $or: [{ from: center }, { to: center }],
            status: "Delivered",
            parcelDeliveredDate: {
                $gte: date,
                $lt: nextDay
            }
        });

        const totalCount = arrivedCount + deliveredCount;

        // Get failed delivery count (dispatched but not delivered)
        const failedDeliveryCount = await Parcel.countDocuments({
            $or: [{ from: center }, { to: center }],
            status: { $in: ["NotAccepted", "WrongAddress", "Return"] },
            parcelDispatchedDate: {
                $gte: date,
                $lt: nextDay
            }
        });
        
        console.log("Daily statistics calculated:");
        console.log("- Arrived count:", arrivedCount);
        console.log("- Delivered count:", deliveredCount);
        console.log("- Total count:", totalCount);
        console.log("- Failed delivery count:", failedDeliveryCount);

        // Format parcels for response
        const parcelsFormatted = processedParcels.map(parcel => ({
            parcelId: parcel.parcelId,
            trackingNo: parcel.trackingNo,
            status: parcel.status,
            processedDate: parcel.status === "ArrivedAtCollectionCenter" ? parcel.parcelArrivedDate : parcel.parcelDeliveredDate
        }));
        
        console.log("Formatted parcels:", parcelsFormatted.length, "items");

        res.status(200).json({
            success: true,
            data: {
                date: req.params.date,
                statistics: {
                    total: totalCount,
                    arrived: arrivedCount,
                    delivered: deliveredCount,
                    failedDelivery: failedDeliveryCount
                },
                parcels: parcelsFormatted
            }
        });

    } catch (error) {
        console.error("=== DASHBOARD DAILY ERROR ===");
        console.error("Error:", error);
        console.error("Stack trace:", error.stack);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Track parcel by tracking number
router.get("/track/:trackingNumber", async (req, res) => {
    try {
        const trackingNumber = req.params.trackingNumber;
        
        const parcel = await Parcel.findOne({
            $or: [
                { trackingNo: trackingNumber },
                { parcelId: trackingNumber }
            ]
        }).populate('from', 'location branchId address')
          .populate('to', 'location branchId address');

        if (!parcel) {
            return res.status(404).json({
                success: false,
                message: "Parcel not found with this tracking number"
            });
        }

        // Add mock tracking history if not present
        const trackingHistory = parcel.trackingHistory || [
            {
                status: 'Parcel Created',
                location: parcel.from?.location || 'Origin',
                timestamp: parcel.createdAt
            },
            ...(parcel.status === 'InTransit' ? [{
                status: 'In Transit',
                location: 'On Route',
                timestamp: parcel.updatedAt
            }] : []),
            ...(parcel.status === 'Delivered' ? [{
                status: 'Delivered',
                location: parcel.to?.location || 'Destination',
                timestamp: parcel.updatedAt
            }] : [])
        ];

        res.status(200).json({
            success: true,
            parcel: {
                ...parcel.toObject(),
                trackingHistory
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update shipment status
router.patch("/:shipmentId/status", async (req, res) => {
    try {
        const updated = await Shipment.findOneAndUpdate(
            { shipmentId: req.params.shipmentId },
            { status: req.body.status },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                error: "Shipment not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Shipment status updated",
            shipment: updated
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Reset parcels in shipment
router.patch("/:shipmentId/reset-parcels", async (req, res) => {
    try {
        const shipment = await Shipment.findOne({
            shipmentId: req.params.shipmentId
        });

        if (!shipment) {
            return res.status(404).json({
                success: false,
                error: "Shipment not found"
            });
        }

        await Parcel.updateMany(
            { _id: { $in: shipment.parcels } },
            { $set: { shipmentId: null, status: "PendingPickup" } }
        );

        await Shipment.deleteOne({ shipmentId: req.params.shipmentId });

        res.status(200).json({
            success: true,
            message: "Parcels reset and shipment deleted"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get shipment details
router.get("/:shipmentId", async (req, res) => {
    try {
        const shipment = await Shipment.findOne({
            shipmentId: req.params.shipmentId
        })
            .populate('parcels')
            .populate('assignedVehicle assignedDriver');

        if (!shipment) {
            return res.status(404).json({
                success: false,
                error: "Shipment not found"
            });
        }

        res.status(200).json({
            success: true,
            shipment
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get filtered parcels for dashboard cards
router.get("/dashboard/parcels/:center/:date/:type", async (req, res) => {
    try {
        const center = req.params.center;
        const date = new Date(req.params.date);
        const type = req.params.type;
        const nextDay = new Date(date);
        nextDay.setDate(date.getDate() + 1);

        let query = {
            $or: [{ from: center }, { to: center }]
        };

        if (type === 'arrived') {
            query = {
                $and: [
                    { $or: [{ from: center }, { to: center }] },
                    {
                        status: "ArrivedAtCollectionCenter",
                        parcelArrivedDate: {
                            $gte: date,
                            $lt: nextDay
                        }
                    }
                ]
            };
        } else if (type === 'delivered') {
            query = {
                $and: [
                    { $or: [{ from: center }, { to: center }] },
                    {
                        status: "Delivered",
                        parcelDeliveredDate: {
                            $gte: date,
                            $lt: nextDay
                        }
                    }
                ]
            };
        } else if (type === 'total') {
            query = {
                $and: [
                    { $or: [{ from: center }, { to: center }] },
                    {
                        $or: [
                            {
                                status: "ArrivedAtCollectionCenter",
                                parcelArrivedDate: {
                                    $gte: date,
                                    $lt: nextDay
                                }
                            },
                            {
                                status: "Delivered",
                                parcelDeliveredDate: {
                                    $gte: date,
                                    $lt: nextDay
                                }
                            }
                        ]
                    }
                ]
            };
        }

        const parcels = await Parcel.find(query)
            .populate('from', 'location branchId')
            .populate('to', 'location branchId')
            .populate('senderId', 'name email contactNo')
            .populate('receiverId', 'name email contactNo')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: parcels.length,
            parcels: parcels
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Validate if a parcel can be added to a specific shipment
 * POST /parcels/validate-for-shipment
 */
router.post('/validate-for-shipment', async (req, res) => {
    try {
        const { parcelId, shipmentId } = req.body;

        if (!parcelId || !shipmentId) {
            return res.status(400).json({
                success: false,
                error: 'Parcel ID and Shipment ID are required'
            });
        }

        // Find the parcel
        const parcel = await Parcel.findOne({ parcelId: parcelId.trim() });
        
        if (!parcel) {
            return res.status(404).json({
                success: false,
                error: 'Parcel not found with the provided ID'
            });
        }

        // Check if parcel is already assigned to a shipment
        if (parcel.shipmentId) {
            return res.status(400).json({
                success: false,
                error: 'Parcel is already assigned to another shipment'
            });
        }

        // Check delivery type (case-insensitive)
        const deliveryType = parcel.shippingMethod?.toLowerCase().trim();
        if (deliveryType !== 'standard') {
            return res.status(400).json({
                success: false,
                error: `Parcel delivery type is "${parcel.shippingMethod}", but only Standard parcels can be added to this shipment`
            });
        }

        // Get shipment to check capacity constraints
        const shipment = await Shipment.findById(shipmentId);
        if (!shipment) {
            return res.status(404).json({
                success: false,
                error: 'Shipment not found'
            });
        }

        // Calculate parcel weight and volume based on item size
        const weightMap = { small: 1, medium: 3, large: 8 };
        const volumeMap = { small: 0.1, medium: 0.3, large: 0.8 };
        
        const parcelWeight = weightMap[parcel.itemSize] || 1;
        const parcelVolume = volumeMap[parcel.itemSize] || 0.1;

        // Check capacity constraints (Standard shipment limits: 2500kg, 10m³)
        const MAX_WEIGHT = 2500;
        const MAX_VOLUME = 10;
        
        const newTotalWeight = (shipment.totalWeight || 0) + parcelWeight;
        const newTotalVolume = (shipment.totalVolume || 0) + parcelVolume;

        if (newTotalWeight > MAX_WEIGHT) {
            return res.status(400).json({
                success: false,
                error: `Adding this parcel would exceed weight limit. Current: ${shipment.totalWeight}kg, Parcel: ${parcelWeight}kg, Max: ${MAX_WEIGHT}kg`
            });
        }

        if (newTotalVolume > MAX_VOLUME) {
            return res.status(400).json({
                success: false,
                error: `Adding this parcel would exceed volume limit. Current: ${shipment.totalVolume}m³, Parcel: ${parcelVolume}m³, Max: ${MAX_VOLUME}m³`
            });
        }

        // Parcel is valid for addition
        return res.status(200).json({
            success: true,
            message: 'Parcel is valid for addition to shipment',
            parcel: {
                _id: parcel._id,
                parcelId: parcel.parcelId,
                itemSize: parcel.itemSize,
                itemType: parcel.itemType,
                shippingMethod: parcel.shippingMethod,
                weight: parcelWeight,
                volume: parcelVolume
            },
            capacityInfo: {
                currentWeight: shipment.totalWeight || 0,
                currentVolume: shipment.totalVolume || 0,
                newWeight: newTotalWeight,
                newVolume: newTotalVolume,
                remainingWeight: MAX_WEIGHT - newTotalWeight,
                remainingVolume: MAX_VOLUME - newTotalVolume
            }
        });

    } catch (error) {
        console.error('Error validating parcel for shipment:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error during parcel validation'
        });
    }
});

// Debug endpoint to check database content
router.get("/debug/parcels", async (req, res) => {
    try {
        const totalParcels = await Parcel.countDocuments({});
        const allParcels = await Parcel.find({}).limit(3); // Get first 3 parcels
        const statusCounts = await Parcel.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        
        // Check what date fields exist
        const parcelWithDates = await Parcel.findOne({}, {
            parcelArrivedDate: 1,
            parcelDeliveredDate: 1,
            parcelDispatchedDate: 1,
            createdAt: 1,
            updatedAt: 1,
            status: 1
        });
        
        res.json({
            totalParcels,
            sampleParcels: allParcels,
            statusCounts,
            dateFieldsExample: parcelWithDates
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
