const express = require("express");
const router = express.Router();
const { createShipment } = require("../controllers/shipmentManagementControllers/createShipmentController");
const { addMoreParcelsToStandardShipment } = require("../controllers/shipmentManagementControllers/standardShipmentNotificationController");
const isStaffAuthenticated = require("../middleware/staffAuth");
const Shipment = require("../models/B2BShipmentModel");
const Parcel = require("../models/parcelModel");
const Branch = require("../models/BranchesModel");
const Vehicle = require("../models/vehicleModel");




// Route for creating manual shipments with staff authentication
router.post("/create", isStaffAuthenticated, createShipment);

// Route for adding more parcels to standard shipments
router.post("/b2b/standard-shipments/:id/add-more", async (req, res) => {
    try {
        const shipmentId = req.params.id;

        // Validate shipment ID format
        if (!shipmentId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid shipment ID format'
            });
        }

        // Call the controller function
        const result = await addMoreParcelsToStandardShipment(shipmentId);

        // Return response based on result
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data,
            error: result.error
        });

    } catch (error) {
        console.error('Error in add-more-parcels route:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Route for manually adding a single parcel to standard shipment
router.post("/b2b/standard-shipments/:id/add-manual-parcel", async (req, res) => {
    try {
        const shipmentId = req.params.id;
        const { parcelId } = req.body;

        // Validate inputs
        if (!shipmentId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid shipment ID format'
            });
        }

        if (!parcelId) {
            return res.status(400).json({
                success: false,
                error: 'Parcel ID is required'
            });
        }

        // Find the shipment
        const shipment = await Shipment.findById(shipmentId);
        if (!shipment) {
            return res.status(404).json({
                success: false,
                error: 'Shipment not found'
            });
        }

        // Find the parcel
        const parcel = await Parcel.findById(parcelId);
        if (!parcel) {
            return res.status(404).json({
                success: false,
                error: 'Parcel not found'
            });
        }

        // Calculate parcel weight and volume
        const weightMap = { small: 1, medium: 3, large: 8 };
        const volumeMap = { small: 0.1, medium: 0.3, large: 0.8 };
        
        const parcelWeight = weightMap[parcel.itemSize] || 1;
        const parcelVolume = volumeMap[parcel.itemSize] || 0.1;

        // Update shipment
        shipment.parcels.push(parcelId);
        shipment.totalWeight = (shipment.totalWeight || 0) + parcelWeight;
        shipment.totalVolume = (shipment.totalVolume || 0) + parcelVolume;
        shipment.parcelCount = (shipment.parcelCount || 0) + 1;

        await shipment.save();

        // Update parcel
        parcel.shipmentId = shipmentId;
        parcel.status = "ShipmentAssigned";
        await parcel.save();

        return res.status(200).json({
            success: true,
            message: 'Parcel added to shipment successfully',
            data: {
                addedParcel: {
                    parcelId: parcel.parcelId,
                    itemSize: parcel.itemSize,
                    weight: parcelWeight,
                    volume: parcelVolume
                },
                newTotals: {
                    weight: shipment.totalWeight,
                    volume: shipment.totalVolume,
                    parcelCount: shipment.parcelCount
                }
            }
        });

    } catch (error) {
        console.error('Error adding manual parcel to shipment:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while adding parcel'
        });
    }
});

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
            .populate({
                path: 'parcels',
                select: 'parcelId trackingNo qrCodeNo itemType itemSize shippingMethod status submittingType receivingType specialInstructions pickupInformation deliveryInformation createdAt updatedAt',
                populate: [
                    { path: 'from', select: 'location branchId address contact' },
                    { path: 'to', select: 'location branchId address contact' },
                    { path: 'senderId', select: 'name email phone address' },
                    { path: 'receiverId', select: 'name email phone address' },
                    { path: 'paymentId', select: 'amount method status' }
                ]
            })
            .populate('assignedVehicle', 'vehicleId registrationNo vehicleType capableWeight capableVolume available')
            .populate('assignedDriver', 'name contactNo licenseId driverId')
            .populate('createdByCenter', 'location branchId')
            .populate('route', 'location branchId address contact');

        if (!shipment) {
            return res.status(404).json({
                success: false,
                error: "Shipment not found"
            });
        }

        // Since parcel schema doesn't have weight/dimensions, use placeholder values from shipment totals
        const totalWeight = shipment.totalWeight || 0;
        const totalVolume = shipment.totalVolume || 0;

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
                    // Only include fields that exist in parcel schema
                    _id: parcel._id,
                    parcelId: parcel.parcelId,
                    trackingNo: parcel.trackingNo,
                    qrCodeNo: parcel.qrCodeNo,
                    itemType: parcel.itemType,
                    itemSize: parcel.itemSize,
                    shippingMethod: parcel.shippingMethod,
                    status: parcel.status,
                    submittingType: parcel.submittingType,
                    receivingType: parcel.receivingType,
                    specialInstructions: parcel.specialInstructions,
                    senderId: parcel.senderId,
                    receiverId: parcel.receiverId,
                    paymentId: parcel.paymentId,
                    from: parcel.from,
                    to: parcel.to,
                    pickupInformation: parcel.pickupInformation,
                    deliveryInformation: parcel.deliveryInformation,
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
                totalVolume: totalVolume.toString(),
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
router.post('/process/:type/:center', isStaffAuthenticated, async (req, res) => {
    try {
        const { parcelIds } = req.body;
        
        // Verify that the center matches staff's branch
        if (req.params.center !== req.staff.branchId._id.toString()) {
            return res.status(403).json({
                success: false,
                error: "Access denied. You can only process shipments for your assigned branch."
            });
        }
        
        if (!parcelIds || !Array.isArray(parcelIds) || parcelIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Valid parcel IDs array is required"
            });
        }
        
        console.log(`Staff ${req.staff.name} from ${req.staff.branchId.location} is processing ${req.params.type} shipments`);
        
        const result = await processAllShipments(
            req.params.type,  // 'Express' or 'Standard'
            req.params.center,
            parcelIds  // Pass the parcel IDs to the controller
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(201).json({
            message: `${req.params.type} shipments processed successfully by ${req.staff.name}`,
            staffInfo: {
                name: req.staff.name,
                branch: req.staff.branchId.location
            },
            ...result
        });

    } catch (error) {
        console.error('Error in process shipments route:', error);
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

        // Free up the assigned vehicle if there is one
        if (shipment.assignedVehicle) {
            await Vehicle.updateOne(
                { _id: shipment.assignedVehicle },
                { $set: { available: true } }
            );
            console.log(`Vehicle ${shipment.assignedVehicle} made available after shipment deletion`);
        }

        // Then delete the shipment
        await Shipment.findByIdAndDelete(shipment._id);

        res.status(200).json({
            success: true,
            message: "Shipment deleted successfully, parcels updated, and vehicle made available",
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

// Route to dispatch a shipment (First branch action)
router.put("/:id/dispatch", async (req, res) => {
    try {
        const shipmentId = req.params.id;

        // Validate shipment ID format
        if (!shipmentId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid shipment ID format'
            });
        }

        // Find and update the shipment
        const shipment = await Shipment.findByIdAndUpdate(
            shipmentId,
            { 
                status: 'Dispatched',
                dispatchedAt: new Date()
            },
            { new: true }
        ).populate('sourceCenter', 'location branchName')
         .populate('route', 'location branchName')
         .populate('assignedVehicle', 'vehicleId registrationNo')
         .populate('assignedDriver', 'name contactNo');

        if (!shipment) {
            return res.status(404).json({
                success: false,
                error: 'Shipment not found'
            });
        }

        // Update all parcels in this shipment to 'InTransit' status
        await Parcel.updateMany(
            { _id: { $in: shipment.parcels } },
            { 
                $set: { 
                    status: 'InTransit',
                    updatedAt: new Date()
                }
            }
        );

        // Update vehicle's current branch to the source center when dispatching
        if (shipment.assignedVehicle && shipment.sourceCenter) {
            await Vehicle.updateOne(
                { _id: shipment.assignedVehicle },
                { $set: { currentBranch: shipment.sourceCenter } }
            );
            console.log(`Vehicle ${shipment.assignedVehicle} current branch updated to source center ${shipment.sourceCenter} for dispatch`);
        }

        console.log(`Updated ${shipment.parcels.length} parcels to InTransit status for shipment ${shipmentId}`);

        res.status(200).json({
            success: true,
            message: 'Shipment dispatched successfully and parcels updated to InTransit',
            shipment
        });

    } catch (error) {
        console.error('Error dispatching shipment:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Route to complete a shipment (Last branch action)
router.put("/:id/complete", async (req, res) => {
    try {
        const shipmentId = req.params.id;

        // Validate shipment ID format
        if (!shipmentId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid shipment ID format'
            });
        }

        // Find and update the shipment
        const shipment = await Shipment.findByIdAndUpdate(
            shipmentId,
            { 
                status: 'Completed',
                completedAt: new Date()
            },
            { new: true }
        ).populate('sourceCenter', 'location branchName')
         .populate('route', 'location branchName')
         .populate('assignedVehicle', 'vehicleId registrationNo')
         .populate('assignedDriver', 'name contactNo');

        if (!shipment) {
            return res.status(404).json({
                success: false,
                error: 'Shipment not found'
            });
        }

        // Update all parcels in this shipment to 'ArrivedAtCollectionCenter' status
        await Parcel.updateMany(
            { _id: { $in: shipment.parcels } },
            { 
                $set: { 
                    status: 'ArrivedAtCollectionCenter',
                    updatedAt: new Date()
                }
            }
        );

        // Make the assigned vehicle available again and update its current branch to the last branch in route
        if (shipment.assignedVehicle) {
            const updateData = { available: true };
            
            // Set current branch to the last branch in the route (destination)
            if (shipment.route && shipment.route.length > 0) {
                const lastBranch = shipment.route[shipment.route.length - 1];
                updateData.currentBranch = lastBranch;
                console.log(`Vehicle ${shipment.assignedVehicle} current branch updated to ${lastBranch}`);
            }
            
            await Vehicle.updateOne(
                { _id: shipment.assignedVehicle },
                { $set: updateData }
            );
            console.log(`Vehicle ${shipment.assignedVehicle} marked as available after shipment completion`);
        }

        console.log(`Updated ${shipment.parcels.length} parcels to ArrivedAtCollectionCenter status for shipment ${shipmentId}`);

        res.status(200).json({
            success: true,
            message: 'Shipment completed successfully, parcels updated to ArrivedAtCollectionCenter, and vehicle made available',
            shipment
        });

    } catch (error) {
        console.error('Error completing shipment:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;