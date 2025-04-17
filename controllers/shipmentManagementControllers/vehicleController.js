//http://localhost:5000/vehicles/assignVehicleToShipment/67bb639b8e0bd5698ae0c770/Express

const Vehicle = require("../../models/vehicleModel");
const Shipment = require("../../models/B2BShipmentModel");
const Parcel = require('../../models/ParcelModel');

const distanceMatrix = {
    Center01: { Center02: 25, Center03: 65, Center04: 45, Center05: 30 },
    Center02: { Center01: 25, Center03: 40, Center04: 35, Center05: 50 },
    Center03: { Center01: 65, Center02: 40, Center04: 20, Center05: 55 },
    Center04: { Center01: 45, Center02: 35, Center03: 20, Center05: 25 },
    Center05: { Center01: 30, Center02: 50, Center03: 55, Center04: 25 }
};

const timeMatrix = {
    Center01: { Center02: 5, Center03: 6, Center04: 4, Center05: 3 },
    Center02: { Center01: 5, Center03: 4, Center04: 5, Center05: 5 },
    Center03: { Center01: 6, Center02: 4, Center04: 2, Center05: 5 },
    Center04: { Center01: 4, Center02: 5, Center03: 2, Center05: 5 },
    Center05: { Center01: 3, Center02: 5, Center03: 5, Center04: 5 }
};


async function findNearestVehicle(sourceCenter, weightRequired, volumeRequired) {
    let visitedCenters = new Set([sourceCenter]); // Start with the source center marked as visited
    let nearestCenter = null;
    let nearestVehicle = null;

    while (true) {
        let minDistance = Infinity;
        let nextCenter = null;

        // Search for an available vehicle in the current nearest center
        if (nearestCenter) {
            nearestVehicle = await Vehicle.findOne({
                belongsCenter: nearestCenter,
                currentCenter: nearestCenter,
                available: true,
                capableWeight: { $gte: weightRequired },
                capableVolume: { $gte: volumeRequired }
            });

            if (nearestVehicle) {
                nearestVehicle.available = false;
                await nearestVehicle.save();
                return nearestVehicle; // Return the found vehicle
            }
        }

        // Find the next nearest center
        for (let center in distanceMatrix[sourceCenter]) {
            if (!visitedCenters.has(center) && distanceMatrix[sourceCenter][center] < minDistance) {
                nextCenter = center;
                minDistance = distanceMatrix[sourceCenter][center];
            }
        }

        // If no new center is found, return false (no available vehicle)
        if (!nextCenter) return false;

        visitedCenters.add(nextCenter); // Mark the center as visited
        nearestCenter = nextCenter;
    }
}


// Assign a vehicle for the shipment
async function assignVehicle(shipmentId, shipmentType) {
    try {
        const shipment = await Shipment.findOne({
            id: shipmentId,
            deliveryType: shipmentType
        });

        if (!shipment) throw new Error("Shipment not found");

        let sourceCenter = shipment.sourceCenter;
        let weightRequired = shipment.totalWeight;
        let volumeRequired = shipment.totalVolume;

        let vehicle = await Vehicle.findOne({ currentCenter: sourceCenter, available: true, capableWeight: { $gte: weightRequired }, capableVolume: { $gte: volumeRequired } });

        if (vehicle) {
            vehicle.available = false;
            await vehicle.save();
            shipment.assignedVehicle = vehicle.vehicleId;
            shipment.assignedDriver = vehicle.assignedDriver;
            shipment.status = "Completed";
            await shipment.save();
            return vehicle;
        }

        // If no vehicle, search for the nearest center with an available vehicle
        const nearestVehicle = await findNearestVehicle(sourceCenter, weightRequired, volumeRequired);
        if (nearestVehicle) {
            nearestCenter = nearestVehicle.belongsCenter;
            shipment.assignedVehicle = nearestVehicle.vehicleId;
            shipment.assignedDriver = nearestVehicle.assignedDriver;

            if (shipmentType === "Express") {
                shipment.status = "Completed";

            } else {
                shipment.status = "In Transit";
            }
            await shipment.save();

            // Send parcels to Shipment controller for processing
            // Retrieve parcels with the specified criteria

            const parcels = await Parcel.find({
                deliveryType: shipmentType,
                sourceCenter: nearestCenter,
                destination: sourceCenter,
                shipmentId: null // Ensure the parcel is not already assigned to a shipment
            });
            console.log('Parcels:', parcels);

            if (parcels.length === 0) {
                console.log("No parcels found for the shipment. Vehicle assigned.");
                return nearestVehicle;
            }

            //retirive previous shipment id
            // Find the latest shipment of the given type
            let existingShipments = [];
            try {
                const lastShipment = await Shipment.findOne({ deliveryType: shipmentType, sourceCenter: nearestCenter })
                    .sort({ id: -1 })
                    .select('id')
                    .lean();

                if (lastShipment) {
                    existingShipments = [lastShipment.id.replace(/EX-S|ST-S/, '')];
                }

                let lastShipmentNumber = 0;
                if (existingShipments.length > 0) {
                    const lastShipmentId = existingShipments[existingShipments.length - 1];
                    const match = lastShipmentId.match(/\d+/);
                    if (match) {
                        lastShipmentNumber = parseInt(match[0], 10);
                    }
                }

                let shipmentCount = lastShipmentNumber + 1;

                const id =
                    (shipmentType === "Express" ? "EX" : "ST") +
                    "-S" +
                    shipmentCount.toString().padStart(3, "0") +
                    nearestCenter;

                // Create a new shipment
                const newShipment = new Shipment({
                    id: id,
                    deliveryType: shipmentType,
                    sourceCenter: nearestCenter,
                    route: [nearestCenter, sourceCenter],
                    currentLocation: nearestCenter,
                    // Calculate based on distance and speed
                    totalDistance: distanceMatrix[nearestCenter][sourceCenter],
                    totalTime: timeMatrix[nearestCenter][sourceCenter] + 2,
                    totalWeight: parcels.reduce((sum, parcel) => sum + parcel.weight, 0),
                    totalVolume: parcels.reduce((sum, parcel) => sum + parcel.volume, 0),
                    parcelCount: parcels.length,
                    assignedVehicle: nearestVehicle.vehicleId,
                    assignedDriver: nearestVehicle.assignedDriver,

                    status: 'Completed',
                    parcels: parcels.map(parcel => ({
                        id: parcel.id,
                        destination: parcel.destination,
                        source: parcel.source,
                        weight: parcel.weight,
                        volume: parcel.volume,
                        deliveryType: parcel.deliveryType,
                    }))
                });
                console.log(newShipment);
                await newShipment.save();

                // Update parcels to include the shipmentId
                for (let parcel of parcels) {
                    parcel.shipmentId = newShipment.id;
                    await parcel.save();
                }
                console.log(`Vehicle from ${nearestCenter} assigned and parcels processed. Informing ${nearestCenter} center.`);

            } catch (error) {
                console.error("Error fetching existing shipments:", error);
                throw error; // Optionally rethrow the error
            }


            return {
                message: `Vehicle from ${nearestCenter} assigned and parcels processed.`,
                vehicle: nearestVehicle
            };
        } else {
            return false;
        }




    } catch (error) {
        console.error(error);
        throw new Error("Server error");
    }
}

module.exports = { assignVehicle };
