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
        
        // Get last shipment number for the source center and delivery type
        const prefix = deliveryType === 'express' ? 'EX' : 'ST';
        const lastShipment = await B2BShipment.findOne({ 
            sourceCenter,
            deliveryType,
            shipmentId: { $regex: `^${prefix}-S\\d+-${sourceLocation}$` } // More specific regex
        })
            .sort({ createdAt: -1 }) // Sort by creation date instead of shipmentId string
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
        
        // Get all shipments for this source center and delivery type to find the highest sequence number
        // This ensures we don't have conflicts even if sorting by date fails
        const allShipments = await B2BShipment.find({
            sourceCenter,
            deliveryType,
            shipmentId: { $regex: `^${prefix}-S\\d+-${sourceLocation}$` } // More specific regex
        }).select('shipmentId').lean();
        
        let maxSequenceNumber = 0;
        allShipments.forEach(shipment => {
            const match = shipment.shipmentId.match(/-S(\d+)-/);
            if (match) {
                const sequenceNumber = parseInt(match[1]);
                if (sequenceNumber > maxSequenceNumber) {
                    maxSequenceNumber = sequenceNumber;
                }
            }
        });
        
        // Use the higher of the two methods
        const finalSequenceNumber = Math.max(lastShipmentNumber, maxSequenceNumber);
        
        // Generate new shipment ID
        const newSequence = finalSequenceNumber + 1;
        const shipmentId = `${prefix}-S${newSequence.toString().padStart(3, '0')}-${sourceLocation}`;
        
        console.log(`=== GENERATING SHIPMENT ID ===`);
        console.log(`Delivery Type: ${deliveryType}`);
        console.log(`Source Location: ${sourceLocation}`);
        console.log(`Prefix: ${prefix}`);
        console.log(`Found ${allShipments.length} existing shipments`);
        console.log(`- Last shipment (by date): ${lastShipment?.shipmentId || 'None'}`);
        console.log(`- Last sequence number (by date): ${lastShipmentNumber}`);
        console.log(`- Max sequence number (all shipments): ${maxSequenceNumber}`);
        console.log(`- Final sequence number: ${finalSequenceNumber}`);
        console.log(`- New sequence number: ${newSequence}`);
        console.log(`- Generated shipment ID: ${shipmentId}`);
        console.log(`=== END ID GENERATION ===`);
        
        return shipmentId;
    } catch (error) {
        console.error('Error generating shipment ID:', error);
        throw error;
    }
};

const createShipment = async (req, res) => {
    try {
        console.log('=== SHIPMENT CREATION REQUEST ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
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
            createdByStaff,
            confirmed
        } = req.body;
        console.log('Parsed request data:', createdByStaff);

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

        // Check if shipment ID already exists and retry with incremented sequence if needed
        let finalShipmentId = shipmentId;
        let existingShipment = await B2BShipment.findOne({ shipmentId: finalShipmentId });
        let attempts = 0;
        const maxAttempts = 10;
        
        while (existingShipment && attempts < maxAttempts) {
            attempts++;
            const retrySequence = newSequence + attempts;
            finalShipmentId = `${prefix}-S${retrySequence.toString().padStart(3, '0')}-${sourceLocation}`;
            existingShipment = await B2BShipment.findOne({ shipmentId: finalShipmentId });
            
            if (!existingShipment) {
                console.log(`Shipment ID conflict resolved. Using: ${finalShipmentId} (attempt ${attempts})`);
                break;
            }
        }
        
        if (existingShipment) {
            console.error(`Failed to generate unique shipment ID after ${maxAttempts} attempts`);
            return res.status(500).json({ message: 'Failed to generate unique shipment ID. Please try again.' });
        }

        // Verify that all parcels exist
        const existingParcels = await Parcel.find({ _id: { $in: parcels } });
        if (existingParcels.length !== parcels.length) {
            return res.status(400).json({ message: 'Some parcels do not exist' });
        }

        // Create new shipment
        const newShipment = new B2BShipment({
            shipmentId: finalShipmentId,
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
            createdByStaff: createdByStaff || req.staff._id,
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
