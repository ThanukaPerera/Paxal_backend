const express = require("express");
const router = express.Router();


const Shipment = require("../models/B2BShipmentModel");
const Parcel = require("../models/parcelModel.js");
const Branch = require("../models/BranchesModel");

const { addParcel } = require("../controllers/parcelController.js");
const  isAuthenticated= require("../middleware/isAuthenticated.js");
const {getUserParcels}=require("../controllers/parcelController.js");


// Define routes
router.post("/addparcel",isAuthenticated, addParcel); // Add a new parcel
router.get("/user_parcels", isAuthenticated, getUserParcels);




// Get parcels by center (exclude same origin-destination parcels)
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
        
        // Get arrived parcels for the selected date
        const arrivedParcels = await Parcel.countDocuments({
            $or: [{ from: center }, { to: center }],
            status: "ArrivedAtCollectionCenter",
            parcelArrivedDate: {
                $gte: date,
                $lt: nextDay
            }
        });

        // Get delivered parcels for the selected date
        const deliveredParcels = await Parcel.countDocuments({
            $or: [{ from: center }, { to: center }],
            status: "Delivered",
            parcelDeliveredDate: {
                $gte: date,
                $lt: nextDay
            }
        });

        // Total parcels = Arrived + Delivered
        const totalParcels = arrivedParcels + deliveredParcels;

        res.status(200).json({
            success: true,
            stats: {
                total: totalParcels,
                arrived: arrivedParcels,
                delivered: deliveredParcels
            }
        });

    } catch (error) {
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

        // Format parcels for response
        const parcelsFormatted = processedParcels.map(parcel => ({
            parcelId: parcel.parcelId,
            trackingNo: parcel.trackingNo,
            status: parcel.status,
            processedDate: parcel.status === "ArrivedAtCollectionCenter" ? parcel.parcelArrivedDate : parcel.parcelDeliveredDate
        }));

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




module.exports = router;