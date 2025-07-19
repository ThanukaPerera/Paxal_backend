const express = require("express");
const router = express.Router();
const { createShipment } = require("../controllers/shipmentManagementControllers/createShipmentController");
const Shipment = require("../models/B2BShipmentModel");
const Parcel = require("../models/parcelModel");
const Branch = require("../models/BranchesModel");




// Route for creating manual shipments
router.post("/create", createShipment);

// Get completed shipments with assigned vehicles for a specific center
router.get("/completed/:centerId", async (req, res) => {
    try {
        const completedShipments = await Shipment.find({
            createdByCenter: req.params.centerId,
            status: 'Completed',
            assignedVehicle: { $exists: true, $ne: null }
        })
            .populate('parcels', 'parcelId weight status')
            .populate('assignedVehicle', 'vehicleNumber type')
            .populate('assignedDriver', 'name contactNumber')
            .populate('createdByCenter', 'location branchId')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: completedShipments.length,
            shipments: completedShipments
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get active shipments (Pending, Verified, In Transit) for a specific center
router.get("/active/:centerId", async (req, res) => {
    try {
        const activeShipments = await Shipment.find({
            createdByCenter: req.params.centerId,
            status: { $in: ['Pending', 'Verified', 'In Transit'] }
        })
            .populate('sourceCenter', 'branchId location')
            .populate('currentLocation', 'branchId location')
            .populate('route', 'branchId location')
            .populate('arrivalTimes.center', 'branchId location')
            .populate({
                path: 'parcels',
                populate: [
                    { path: 'from', select: 'location branchId' },
                    { path: 'to', select: 'location branchId' },
                    { path: 'senderId', select: 'name email phone' },
                    { path: 'receiverId', select: 'name email phone' },
                    { path: 'paymentId', select: 'amount method status' },
                    { path: 'orderPlacedStaffId', select: 'name email' }
                ]
            })
            .populate('assignedVehicle', 'vehicleNumber type capacity')
            .populate('assignedDriver', 'name contactNumber licenseNumber')
            .populate('createdByCenter', 'location branchId')
            .populate('createdByStaff', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: activeShipments.length,
            shipments: activeShipments
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get completed shipments with assigned vehicles
router.get("/completed", async (req, res) => {
    try {
        const completedShipments = await Shipment.find({
            status: 'Completed',
            assignedVehicle: { $exists: true, $ne: null }
        })
            .populate('parcels', 'parcelId weight status')
            .populate('assignedVehicle', 'vehicleNumber type')
            .populate('assignedDriver', 'name contactNumber')
            .populate('createdByCenter', 'location branchId')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: completedShipments.length,
            shipments: completedShipments
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get shipment manifest
router.get("/:shipmentId/manifest", async (req, res) => {
    try {
        const shipment = await Shipment.findOne({
            shipmentId: req.params.shipmentId
        })
            .populate('parcels')
            .populate('assignedVehicle', 'vehicleNumber type capacity')
            .populate('assignedDriver', 'name contactNumber licenseNumber')
            .populate('createdByCenter', 'location branchId')
            .populate('route', 'location branchId address contact');

        if (!shipment) {
            return res.status(404).json({
                success: false,
                error: "Shipment not found"
            });
        }

        // Calculate total weight and volume
        const totalWeight = shipment.parcels.reduce((total, parcel) => total + (parcel.weight || 0), 0);
        const totalVolume = shipment.parcels.reduce((total, parcel) => {
            if (parcel.dimensions) {
                const volume = (parcel.dimensions.length || 0) * (parcel.dimensions.width || 0) * (parcel.dimensions.height || 0) / 1000000; // Convert cm³ to m³
                return total + volume;
            }
            return total;
        }, 0);

        // Generate estimated arrival times based on route
        const arrivalTimes = shipment.route && shipment.route.length > 0 
            ? shipment.route.map((center, index) => ({
                center: center,
                time: (index + 1) * 2 // Assuming 2 hours between each center
            }))
            : [];

        // Calculate estimated total distance (placeholder logic)
        const totalDistance = shipment.route ? shipment.route.length * 50 : 0; // Assuming 50km between centers

        res.status(200).json({
            success: true,
            manifest: {
                shipmentId: shipment.shipmentId,
                deliveryType: shipment.deliveryType,
                status: shipment.status,
                createdAt: shipment.createdAt,
                updatedAt: shipment.updatedAt,
                vehicleAssignedAt: shipment.vehicleAssignedAt,
                transitStartedAt: shipment.transitStartedAt,
                completedAt: shipment.completedAt,
                assignedVehicle: shipment.assignedVehicle,
                assignedDriver: shipment.assignedDriver,
                createdByCenter: shipment.createdByCenter,
                route: shipment.route,
                arrivalTimes: arrivalTimes,
                parcels: shipment.parcels.map(parcel => ({
                    ...parcel.toObject(),
                    // Add additional calculated fields
                    createdAt: parcel.createdAt,
                    updatedAt: parcel.updatedAt,
                    // Add mock delivery history if not present
                    deliveryHistory: parcel.deliveryHistory || [
                        {
                            status: 'Parcel Created',
                            timestamp: parcel.createdAt,
                            location: 'Origin Center'
                        },
                        ...(parcel.status === 'InTransit' ? [{
                            status: 'In Transit',
                            timestamp: shipment.transitStartedAt || new Date(),
                            location: 'On Route'
                        }] : []),
                        ...(parcel.status === 'Delivered' ? [{
                            status: 'Delivered',
                            timestamp: shipment.completedAt || new Date(),
                            location: 'Destination'
                        }] : [])
                    ]
                })),
                totalWeight,
                totalVolume: totalVolume.toFixed(3),
                totalDistance,
                parcelCount: shipment.parcels.length
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// const Shipment = require("../models/B2BShipmentModel");
// const express = require("express");
// const router = express.Router();
// const { processAllShipments } = require("../controllers/shipmentManagementControllers/shipmentController");
// const Parcel = require("../models/ParcelModel"); // Make sure to require the Parcel model

// // Process all shipments
// router.get('/processExpressShipments/:center', async (req, res) => {
//     try {
//         const expressShipments = await processAllShipments('Express', req.params.center);
//         console.log('Express Shipments:', expressShipments);
//         res.status(201).json({ message: "Shipments created successfully", expressShipments });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// router.get('/processStandardShipments/:center', async (req, res) => {
//     try {
//         const standardShipments = await processAllShipments('Standard', req.params.center);
//         console.log('Standard Shipments:', standardShipments);
//         res.status(201).json({ message: "Shipments created successfully", standardShipments });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Add a new shipment
// router.post("/add", async (req, res) => {
//     try {
//         const shipment = new Shipment(req.body);
//         await shipment.save();
//         res.status(201).json({ message: "Shipment created successfully", shipment });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Get all shipments
// router.get("/", async (req, res) => {
//     try {
//         const shipments = await Shipment.find();
//         res.status(200).json(shipments);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Get shipments by center
// router.get("/:center/:shipmentType", async (req, res) => {
//     try {
//         const shipments = await Shipment.find({ sourceCenter: req.params.center, deliveryType: req.params.shipmentType });
//         res.json(shipments);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });


// // Update shipment details
// router.put("/:id", async (req, res) => {
//     try {
//         const updatedShipment = await Shipment.findOneAndUpdate(
//             { id: req.params.id },  // Search by custom ID field
//             req.body,
//             { new: true, runValidators: true }  // Return updated document & validate fields
//         );
//         if (!updatedShipment) {
//             return res.status(404).json({ message: "Shipment not found" });
//         }
//         res.json({ message: "Shipment updated successfully", updatedShipment });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Update all parcels' shipment ID to null in a specific shipment
// router.put("/resetParcels/:id", async (req, res) => {
//     try {
//         const shipment = await Shipment.findOne({ id: req.params.id }); // Using 'id' field instead of MongoDB _id
//         if (!shipment) {
//             return res.status(404).json({ message: "Shipment not found" });
//         }

//         // Update all parcels in the Parcel collection that belong to this shipment
//         await Parcel.updateMany(
//             { shipmentId: shipment.id },
//             { $set: { shipmentId: null } }
//         );

//         res.json({ message: "All parcels' shipment ID reset to null" });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });


// // Delete a shipment
// router.delete("/:id", async (req, res) => {
//     try {
//         const deletedShipment = await Shipment.findOneAndDelete({ id: req.params.id }); // Using 'id' field instead of MongoDB _id
//         if (!deletedShipment) {
//             return res.status(404).json({ message: "Shipment not found" });
//         }
//         res.json({ message: "Shipment deleted successfully", deletedShipment });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// module.exports = router;



const { processAllShipments } = require("../controllers/shipmentManagementControllers/shipmentController");

// Process shipments with staff authentication
router.post('/process/:type/:center', async (req, res) => {
    try {
        const { parcelIds } = req.body;
        
        if (!parcelIds || !Array.isArray(parcelIds) || parcelIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Valid parcel IDs array is required"
            });
        }
        
        const result = await processAllShipments(
            req.params.type,  // 'Express' or 'Standard'
            req.params.center,
            parcelIds  // Pass the parcel IDs to the controller
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(201).json({
            message: `${req.params.type} shipments processed successfully`,
            ...result
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get all shipments with pagination
router.get("/", async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const shipments = await Shipment.find()
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('parcels', 'parcelId status')
            .populate('createdByStaff', 'name email');

        const count = await Shipment.countDocuments();

        res.status(200).json({
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            shipments
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get shipments by center and type
router.get("/:center/:type", async (req, res) => {
    try {
        const shipments = await Shipment.find({
            createdByCenter: req.params.center,
            deliveryType: req.params.type
        }).populate('assignedVehicle assignedDriver', 'vehicleNumber name');

        res.status(200).json({
            success: true,
            count: shipments.length,
            shipments
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// Get shipments by center with complete data
router.get("/:center", async (req, res) => {
    try {
        const shipments = await Shipment.find()
            .populate('sourceCenter', 'branchId location')
            .populate('currentLocation', 'branchId location')
            .populate('route', 'branchId location')
            .populate('arrivalTimes.center', 'branchId location')
            .populate({
                path: 'parcels',
                populate: [
                    { path: 'from', select: 'location branchId' },
                    { path: 'to', select: 'location branchId' },
                    { path: 'senderId', select: 'name email phone' },
                    { path: 'receiverId', select: 'name email phone' },
                    { path: 'paymentId', select: 'amount method status' },
                    { path: 'orderPlacedStaffId', select: 'name email' }
                ]
            })
            .populate('assignedVehicle', 'vehicleNumber type capacity')
            .populate('assignedDriver', 'name contactNumber licenseNumber')
            .populate('createdByCenter', 'location branchId')
            .populate('createdByStaff', 'name email');

        res.status(200).json({
            success: true,
            count: shipments.length,
            shipments
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

// Verify shipment and set confirmed to true
router.put("/:shipmentId/verify", async (req, res) => {
    try {
        const shipment = await Shipment.findOne({
            $or: [
                { shipmentId: req.params.shipmentId },
                { _id: req.params.shipmentId }
            ]
        });

        if (!shipment) {
            return res.status(404).json({
                success: false,
                error: "Shipment not found"
            });
        }

        // Update shipment status to Verified and confirmed to true
        const updatedShipment = await Shipment.findByIdAndUpdate(
            shipment._id,
            { 
                status: 'Verified',
                confirmed: true 
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Shipment verified and confirmed successfully",
            shipment: updatedShipment
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete shipment (first nullify parcel shipmentIds, then delete shipment)
router.delete("/:shipmentId", async (req, res) => {
    try {
        const shipment = await Shipment.findOne({
            $or: [
                { shipmentId: req.params.shipmentId },
                { _id: req.params.shipmentId }
            ]
        }).populate('parcels');

        if (!shipment) {
            return res.status(404).json({
                success: false,
                error: "Shipment not found"
            });
        }

        // First, update all parcels in this shipment - set shipmentId to null and status to PendingPickup
        await Parcel.updateMany(
            { _id: { $in: shipment.parcels } },
            { 
                $unset: { shipmentId: "" },
                $set: { status: "PendingPickup" }
            }
        );

        // Then delete the shipment
        await Shipment.findByIdAndDelete(shipment._id);

        res.status(200).json({
            success: true,
            message: "Shipment deleted successfully and parcels updated",
            deletedShipmentId: shipment.shipmentId,
            updatedParcelsCount: shipment.parcels.length
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

module.exports = router;