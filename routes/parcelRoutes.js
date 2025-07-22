const express = require("express");
const router = express.Router();


const Shipment = require("../models/B2BShipmentModel");
const Parcel = require("../models/parcelModel.js");
const Branch = require("../models/BranchesModel");

const { addParcel } = require("../controllers/parcelController.js");
const  isAuthenticated= require("../middleware/isAuthenticated.js");
const isStaffAuthenticated = require("../middleware/staffAuth.js");
const {getUserParcels}=require("../controllers/parcelController.js");


// Define routes
router.post("/addparcel",isAuthenticated, addParcel); // Add a new parcel
router.get("/user_parcels", isAuthenticated, getUserParcels);




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
        
        // Parse date properly to avoid timezone issues
        const dateStr = req.params.date;
        const [year, month, day] = dateStr.split('-');
        const date = new Date(year, month - 1, day, 0, 0, 0, 0); // Local timezone
        const nextDay = new Date(year, month - 1, day, 23, 59, 59, 999); // End of day
        
        console.log("=== DASHBOARD STATS API CALLED ===");
        console.log("Center:", center);
        console.log("Date received:", req.params.date);
        console.log("Date parsed (start):", date);
        console.log("Date parsed (end):", nextDay);
        
        // 2. Arrived Parcels: arrivedToCollectionCenterTime === clickedDate && status === "ArrivedAtCollectionCenter"
        const arrivedParcels = await Parcel.countDocuments({
            to: center,
            status: "ArrivedAtCollectionCenter",
            arrivedToCollectionCenterTime: {
                $gte: date,
                $lte: nextDay
            }
        });
        
        console.log("Arrived parcels count:", arrivedParcels);

        // 3. Delivered Parcels: parcelDeliveredDate === clickedDate && status === "Delivered"
        const deliveredParcels = await Parcel.countDocuments({
            to: center,
            status: "Delivered",
            parcelDeliveredDate: {
                $gte: date,
                $lte: nextDay
            }
        });
        
        console.log("Delivered parcels count:", deliveredParcels);

        // 1. Total Parcels: (arrivedToCollectionCenterTime === clickedDate && status === "ArrivedAtCollectionCenter") OR (parcelDeliveredDate === clickedDate && status === "Delivered")
        const totalParcels = await Parcel.countDocuments({
            to: center,
            $or: [
                {
                    status: "ArrivedAtCollectionCenter",
                    arrivedToCollectionCenterTime: {
                        $gte: date,
                        $lte: nextDay
                    }
                },
                {
                    status: "Delivered",
                    parcelDeliveredDate: {
                        $gte: date,
                        $lte: nextDay
                    }
                }
            ]
        });
        
        console.log("Total parcels count:", totalParcels);

        // 4. Non-Delivered Parcels: arrivedToCollectionCenterTime === clickedDate && status IN ["NotAccepted", "WrongAddress", "Return"]
        const nonDeliveredParcels = await Parcel.countDocuments({
            to: center,
            status: { $in: ["NotAccepted", "WrongAddress", "Return"] },
            arrivedToCollectionCenterTime: {
                $gte: date,
                $lte: nextDay
            }
        });
        
        console.log("Non-delivered parcels count:", nonDeliveredParcels);
        
        console.log("Final stats object:", {
            total: totalParcels,
            arrived: arrivedParcels,
            delivered: deliveredParcels,
            nonDelivered: nonDeliveredParcels
        });

        res.status(200).json({
            success: true,
            stats: {
                total: totalParcels,
                arrived: arrivedParcels,
                delivered: deliveredParcels,
                nonDelivered: nonDeliveredParcels
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
        
        // Parse date properly to avoid timezone issues
        const dateStr = req.params.date;
        const [year, month, day] = dateStr.split('-');
        const date = new Date(year, month - 1, day, 0, 0, 0, 0); // Local timezone
        const nextDay = new Date(year, month - 1, day, 23, 59, 59, 999); // End of day
        
        console.log("=== DASHBOARD DAILY API CALLED ===");
        console.log("Center:", center);
        console.log("Date received:", req.params.date);
        console.log("Date parsed (start):", date);
        console.log("Date parsed (end):", nextDay);

        // Get all parcels that match the total parcels criteria
        let totalParcels = await Parcel.find({
            to: center,
            $or: [
                {
                    status: "ArrivedAtCollectionCenter",
                    arrivedToCollectionCenterTime: {
                        $gte: date,
                        $lte: nextDay
                    }
                },
                {
                    status: "Delivered",
                    parcelDeliveredDate: {
                        $gte: date,
                        $lte: nextDay
                    }
                }
            ]
        }).populate('from', 'location')
          .populate('to', 'location');
          
        console.log("Total parcels found:", totalParcels.length);
        
        // Get arrived parcels
        let arrivedParcels = await Parcel.find({
            to: center,
            status: "ArrivedAtCollectionCenter",
            arrivedToCollectionCenterTime: {
                $gte: date,
                $lte: nextDay
            }
        }).populate('from', 'location')
          .populate('to', 'location');

        // Get delivered parcels
        let deliveredParcels = await Parcel.find({
            to: center,
            status: "Delivered",
            parcelDeliveredDate: {
                $gte: date,
                $lte: nextDay
            }
        }).populate('from', 'location')
          .populate('to', 'location');

        // Get non-delivered parcels
        let nonDeliveredParcels = await Parcel.find({
            to: center,
            status: { $in: ["NotAccepted", "WrongAddress", "Return"] },
            arrivedToCollectionCenterTime: {
                $gte: date,
                $lte: nextDay
            }
        }).populate('from', 'location')
          .populate('to', 'location');
        
        console.log("Daily statistics calculated:");
        console.log("- Total count:", totalParcels.length);
        console.log("- Arrived count:", arrivedParcels.length);
        console.log("- Delivered count:", deliveredParcels.length);
        console.log("- Non-delivered count:", nonDeliveredParcels.length);

        // Format parcels for response - combine all parcels
        const allParcels = [...totalParcels];
        const parcelsFormatted = allParcels.map(parcel => ({
            _id: parcel._id,
            parcelId: parcel.parcelId,
            trackingNo: parcel.trackingNo,
            status: parcel.status,
            from: parcel.from?.location || 'N/A',
            to: parcel.to?.location || 'N/A',
            processedDate: parcel.status === "ArrivedAtCollectionCenter" ? 
                parcel.arrivedToCollectionCenterTime : 
                parcel.parcelDeliveredDate
        }));
        
        console.log("Formatted parcels:", parcelsFormatted.length, "items");

        res.status(200).json({
            success: true,
            data: {
                date: req.params.date,
                statistics: {
                    total: totalParcels.length,
                    arrived: arrivedParcels.length,
                    delivered: deliveredParcels.length,
                    failedDelivery: nonDeliveredParcels.length
                },
                parcels: parcelsFormatted,
                // Store arrays for filtering in frontend
                arrivedParcels: arrivedParcels.map(p => ({ _id: p._id, ...p.toObject() })),
                deliveredParcels: deliveredParcels.map(p => ({ _id: p._id, ...p.toObject() })),
                nonDeliveredParcels: nonDeliveredParcels.map(p => ({ _id: p._id, ...p.toObject() }))
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
        const centerParcels = await Parcel.find({ to: "682e1059ce33c2a891c9b168" }).limit(3);
        const allParcelsToCheck = await Parcel.find({}).limit(3).select('from to status createdAt updatedAt');
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
            status: 1,
            from: 1,
            to: 1
        });
        
        // Check parcels specifically with our center ID
        const centerSpecificParcels = await Parcel.find({
            to: "682e1059ce33c2a891c9b168"
        }).select('parcelId status from to createdAt updatedAt parcelArrivedDate parcelDeliveredDate parcelDispatchedDate').limit(5);
        
        res.json({
            totalParcels,
            centerParcelsCount: centerParcels.length,
            sampleParcels: allParcelsToCheck,
            statusCounts,
            dateFieldsExample: parcelWithDates,
            centerSpecificParcels
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create test parcels for today's date
router.post("/debug/create-test-data", async (req, res) => {
    try {
        const today = new Date();
        today.setHours(12, 0, 0, 0); // Set to noon today
        
        const testParcels = [
            {
                parcelId: "TEST001",
                trackingNo: "TR001",
                from: "682e1068ce33c2a891c9b174", // Different center
                to: "682e1059ce33c2a891c9b168", // Our test center
                status: "ArrivedAtCollectionCenter",
                parcelArrivedDate: today,
                weight: 1.5,
                itemType: "Electronics"
            },
            {
                parcelId: "TEST002",
                trackingNo: "TR002",
                from: "682e1077ce33c2a891c9b180",
                to: "682e1059ce33c2a891c9b168",
                status: "Delivered",
                parcelDeliveredDate: today,
                weight: 2.0,
                itemType: "Books"
            },
            {
                parcelId: "TEST003",
                trackingNo: "TR003",
                from: "682e1083ce33c2a891c9b18c",
                to: "682e1059ce33c2a891c9b168",
                status: "ArrivedAtCollectionCenter",
                parcelArrivedDate: today,
                weight: 0.5,
                itemType: "Documents"
            },
            {
                parcelId: "TEST004",
                trackingNo: "TR004",
                from: "682e1195ce33c2a891c9b258",
                to: "682e1059ce33c2a891c9b168",
                status: "NotAccepted",
                parcelDispatchedDate: today,
                weight: 3.0,
                itemType: "Fragile"
            },
            {
                parcelId: "TEST005",
                trackingNo: "TR005",
                from: "682e1195ce33c2a891c9b258",
                to: "682e1059ce33c2a891c9b168",
                status: "DeliveryDispatched",
                parcelDispatchedDate: today,
                weight: 1.2,
                itemType: "Clothing",
                deliveryInformation: {
                    staffId: null // Will be populated with actual staff ID if available
                }
            }
        ];
        
        const createdParcels = await Parcel.insertMany(testParcels);
        
        res.json({
            success: true,
            message: `Created ${createdParcels.length} test parcels for today (${today.toDateString()})`,
            parcels: createdParcels.map(p => ({
                parcelId: p.parcelId,
                status: p.status,
                dates: {
                    parcelArrivedDate: p.parcelArrivedDate,
                    parcelDeliveredDate: p.parcelDeliveredDate,
                    parcelDispatchedDate: p.parcelDispatchedDate
                }
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;