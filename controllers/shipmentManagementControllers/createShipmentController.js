const B2BShipment = require('../../models/B2BShipmentModel');
const Parcel = require('../../models/parcelModel');
const Branch = require('../../models/BranchesModel');

// Function to generate proper shipment ID
const generateShipmentId = async (deliveryType, sourceCenter) => {
    try {
        // Get source center location
        const sourceBranch = await Branch.findById(sourceCenter).lean();
        if (!sourceBranch) {
            throw new Error('Source center not found');
        }
        
        const sourceLocation = sourceBranch.location;
        
        // Get last shipment number for the source center
        const lastShipment = await B2BShipment.findOne({ sourceCenter })
            .sort({ shipmentId: -1 })
            .select('shipmentId')
            .lean();
        
        let lastShipmentNumber = 0;
        if (lastShipment) {
            // Extract sequence number from shipment ID (format: EX-S009-Colombo or ST-S009-Colombo)
            const match = lastShipment.shipmentId.match(/-S(\d+)-/);
            if (match) {
                lastShipmentNumber = parseInt(match[1]);
            }
        }
        
        // Generate new shipment ID
        const newSequence = lastShipmentNumber + 1;
        const prefix = deliveryType === 'express' ? 'EX' : 'ST';
        const shipmentId = `${prefix}-S${newSequence.toString().padStart(3, '0')}-${sourceLocation}`;
        
        return shipmentId;
    } catch (error) {
        console.error('Error generating shipment ID:', error);
        throw error;
    }
};

const createShipment = async (req, res) => {
    try {
        console.log('Received shipment creation request:', req.body);
        
        const {
            deliveryType,
            sourceCenter,
            route,
            totalTime,
            arrivalTimes,
            totalDistance,
            totalWeight,
            totalVolume,
            parcelCount,
            parcels,
            status,
            createdByCenter,
            confirmed
        } = req.body;

        // Validation
        if (!deliveryType) {
            return res.status(400).json({ message: 'Delivery type is required' });
        }

        if (!sourceCenter) {
            return res.status(400).json({ message: 'Source center is required' });
        }

        if (!route || route.length === 0) {
            return res.status(400).json({ message: 'Route is required' });
        }

        if (!parcels || parcels.length === 0) {
            return res.status(400).json({ message: 'Parcels are required' });
        }

        if (totalTime === undefined || totalTime === null) {
            return res.status(400).json({ message: 'Total time is required' });
        }

        if (totalDistance === undefined || totalDistance === null) {
            return res.status(400).json({ message: 'Total distance is required' });
        }

        // Generate proper shipment ID
        const shipmentId = await generateShipmentId(deliveryType, sourceCenter);

        // Check if shipment ID already exists (should not happen with proper sequence)
        const existingShipment = await B2BShipment.findOne({ shipmentId });
        if (existingShipment) {
            return res.status(400).json({ message: 'Shipment ID already exists' });
        }

        // Verify that all parcels exist
        const existingParcels = await Parcel.find({ _id: { $in: parcels } });
        if (existingParcels.length !== parcels.length) {
            return res.status(400).json({ message: 'Some parcels do not exist' });
        }

        // Create new shipment
        const newShipment = new B2BShipment({
            shipmentId,
            deliveryType,
            sourceCenter,
            route,
            currentLocation: sourceCenter, // Set to source center initially
            totalTime,
            arrivalTimes: arrivalTimes || [],
            totalDistance,
            totalWeight: totalWeight || 0,
            totalVolume: totalVolume || 0,
            parcelCount: parcelCount || parcels.length,
            parcels,
            status: status || 'Pending',
            createdByCenter: createdByCenter || sourceCenter,
            confirmed: confirmed || false,
            createdAt: new Date()
        });

        // Save shipment
        const savedShipment = await newShipment.save();

        // Update parcels to mark them as assigned to this shipment
        await Parcel.updateMany(
            { _id: { $in: parcels } },
            { 
                $set: { 
                    shipmentId: savedShipment._id,
                    status: 'ShipmentAssigned'
                }
            }
        );

        console.log('Shipment created successfully:', savedShipment.shipmentId);

        res.status(201).json({
            message: 'Shipment created successfully',
            shipment: savedShipment
        });

    } catch (error) {
        console.error('Error creating shipment:', error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                message: 'Validation error', 
                errors: validationErrors 
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'Shipment ID must be unique' 
            });
        }

        res.status(500).json({ 
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    createShipment
};
