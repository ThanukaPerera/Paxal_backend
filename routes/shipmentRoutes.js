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

const express = require("express");
const router = express.Router();
const Shipment = require("../models/B2BShipmentModel");
const { processAllShipments } = require("../controllers/shipmentManagementControllers/shipmentController");
const Parcel = require("../models/ParcelModel");
const Branch = require("../models/BranchesModel");

// Process shipments with staff authentication
router.post('/process/:type/:center', async (req, res) => {
    try {
        
        const result = await processAllShipments(
            req.params.type,  // 'Express' or 'Standard'
            req.params.center
           // req.user.staffId // Assuming authentication middleware provides user
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

module.exports = router;