const express = require('express');
const router = express.Router();
const Parcel = require('../models/parcelModel');
const Shipment = require('../models/B2BShipmentModel');

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

module.exports = router;
