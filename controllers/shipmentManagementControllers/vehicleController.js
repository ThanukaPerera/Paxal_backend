//http://localhost:5000/vehicles/assignVehicleToShipment/67bb639b8e0bd5698ae0c770/Express

// const Vehicle = require("../../models/vehicleModel");
// const Shipment = require("../../models/B2BShipmentModel");
// const Parcel = require('../../models/ParcelModel');

// const distanceMatrix = {
//     Center01: { Center02: 25, Center03: 65, Center04: 45, Center05: 30 },
//     Center02: { Center01: 25, Center03: 40, Center04: 35, Center05: 50 },
//     Center03: { Center01: 65, Center02: 40, Center04: 20, Center05: 55 },
//     Center04: { Center01: 45, Center02: 35, Center03: 20, Center05: 25 },
//     Center05: { Center01: 30, Center02: 50, Center03: 55, Center04: 25 }
// };

// const timeMatrix = {
//     Center01: { Center02: 5, Center03: 6, Center04: 4, Center05: 3 },
//     Center02: { Center01: 5, Center03: 4, Center04: 5, Center05: 5 },
//     Center03: { Center01: 6, Center02: 4, Center04: 2, Center05: 5 },
//     Center04: { Center01: 4, Center02: 5, Center03: 2, Center05: 5 },
//     Center05: { Center01: 3, Center02: 5, Center03: 5, Center04: 5 }
// };


// async function findNearestVehicle(sourceCenter, weightRequired, volumeRequired) {
//     let visitedCenters = new Set([sourceCenter]); // Start with the source center marked as visited
//     let nearestCenter = null;
//     let nearestVehicle = null;

//     while (true) {
//         let minDistance = Infinity;
//         let nextCenter = null;

//         // Search for an available vehicle in the current nearest center
//         if (nearestCenter) {
//             nearestVehicle = await Vehicle.findOne({
//                 belongsCenter: nearestCenter,
//                 currentCenter: nearestCenter,
//                 available: true,
//                 capableWeight: { $gte: weightRequired },
//                 capableVolume: { $gte: volumeRequired }
//             });

//             if (nearestVehicle) {
//                 nearestVehicle.available = false;
//                 await nearestVehicle.save();
//                 return nearestVehicle; // Return the found vehicle
//             }
//         }

//         // Find the next nearest center
//         for (let center in distanceMatrix[sourceCenter]) {
//             if (!visitedCenters.has(center) && distanceMatrix[sourceCenter][center] < minDistance) {
//                 nextCenter = center;
//                 minDistance = distanceMatrix[sourceCenter][center];
//             }
//         }

//         // If no new center is found, return false (no available vehicle)
//         if (!nextCenter) return false;

//         visitedCenters.add(nextCenter); // Mark the center as visited
//         nearestCenter = nextCenter;
//     }
// }


// // Assign a vehicle for the shipment
// async function assignVehicle(shipmentId, shipmentType) {
//     try {
//         const shipment = await Shipment.findOne({
//             id: shipmentId,
//             deliveryType: shipmentType
//         });

//         if (!shipment) throw new Error("Shipment not found");

//         let sourceCenter = shipment.sourceCenter;
//         let weightRequired = shipment.totalWeight;
//         let volumeRequired = shipment.totalVolume;

//         let vehicle = await Vehicle.findOne({ currentCenter: sourceCenter, available: true, capableWeight: { $gte: weightRequired }, capableVolume: { $gte: volumeRequired } });

//         if (vehicle) {
//             vehicle.available = false;
//             await vehicle.save();
//             shipment.assignedVehicle = vehicle.vehicleId;
//             shipment.assignedDriver = vehicle.assignedDriver;
//             shipment.status = "Completed";
//             await shipment.save();
//             return vehicle;
//         }

//         // If no vehicle, search for the nearest center with an available vehicle
//         const nearestVehicle = await findNearestVehicle(sourceCenter, weightRequired, volumeRequired);
//         if (nearestVehicle) {
//             nearestCenter = nearestVehicle.belongsCenter;
//             shipment.assignedVehicle = nearestVehicle.vehicleId;
//             shipment.assignedDriver = nearestVehicle.assignedDriver;

//             if (shipmentType === "Express") {
//                 shipment.status = "Completed";

//             } else {
//                 shipment.status = "In Transit";
//             }
//             await shipment.save();

//             // Send parcels to Shipment controller for processing
//             // Retrieve parcels with the specified criteria

//             const parcels = await Parcel.find({
//                 deliveryType: shipmentType,
//                 sourceCenter: nearestCenter,
//                 destination: sourceCenter,
//                 shipmentId: null // Ensure the parcel is not already assigned to a shipment
//             });
//             console.log('Parcels:', parcels);

//             if (parcels.length === 0) {
//                 console.log("No parcels found for the shipment. Vehicle assigned.");
//                 return nearestVehicle;
//             }

//             //retirive previous shipment id
//             // Find the latest shipment of the given type
//             let existingShipments = [];
//             try {
//                 const lastShipment = await Shipment.findOne({ deliveryType: shipmentType, sourceCenter: nearestCenter })
//                     .sort({ id: -1 })
//                     .select('id')
//                     .lean();

//                 if (lastShipment) {
//                     existingShipments = [lastShipment.id.replace(/EX-S|ST-S/, '')];
//                 }

//                 let lastShipmentNumber = 0;
//                 if (existingShipments.length > 0) {
//                     const lastShipmentId = existingShipments[existingShipments.length - 1];
//                     const match = lastShipmentId.match(/\d+/);
//                     if (match) {
//                         lastShipmentNumber = parseInt(match[0], 10);
//                     }
//                 }

//                 let shipmentCount = lastShipmentNumber + 1;

//                 const id =
//                     (shipmentType === "Express" ? "EX" : "ST") +
//                     "-S" +
//                     shipmentCount.toString().padStart(3, "0") +
//                     nearestCenter;

//                 // Create a new shipment
//                 const newShipment = new Shipment({
//                     id: id,
//                     deliveryType: shipmentType,
//                     sourceCenter: nearestCenter,
//                     route: [nearestCenter, sourceCenter],
//                     currentLocation: nearestCenter,
//                     // Calculate based on distance and speed
//                     totalDistance: distanceMatrix[nearestCenter][sourceCenter],
//                     totalTime: timeMatrix[nearestCenter][sourceCenter] + 2,
//                     totalWeight: parcels.reduce((sum, parcel) => sum + parcel.weight, 0),
//                     totalVolume: parcels.reduce((sum, parcel) => sum + parcel.volume, 0),
//                     parcelCount: parcels.length,
//                     assignedVehicle: nearestVehicle.vehicleId,
//                     assignedDriver: nearestVehicle.assignedDriver,

//                     status: 'Completed',
//                     parcels: parcels.map(parcel => ({
//                         id: parcel.id,
//                         destination: parcel.destination,
//                         source: parcel.source,
//                         weight: parcel.weight,
//                         volume: parcel.volume,
//                         deliveryType: parcel.deliveryType,
//                     }))
//                 });
//                 console.log(newShipment);
//                 await newShipment.save();

//                 // Update parcels to include the shipmentId
//                 for (let parcel of parcels) {
//                     parcel.shipmentId = newShipment.id;
//                     await parcel.save();
//                 }
//                 console.log(`Vehicle from ${nearestCenter} assigned and parcels processed. Informing ${nearestCenter} center.`);

//             } catch (error) {
//                 console.error("Error fetching existing shipments:", error);
//                 throw error; // Optionally rethrow the error
//             }


//             return {
//                 message: `Vehicle from ${nearestCenter} assigned and parcels processed.`,
//                 vehicle: nearestVehicle
//             };
//         } else {
//             return false;
//         }




//     } catch (error) {
//         console.error(error);
//         throw new Error("Server error");
//     }
// }

// module.exports = { assignVehicle };


const Vehicle = require("../../models/VehicleModel");
const B2BShipment = require("../../models/B2BShipmentModel");
const Parcel = require('../../models/ParcelModel');
const Branch = require('../../models/BranchesModel');

// District-based distance matrix (km) - same as previous shipmentController.js
const distanceMatrix = {
    'Colombo': { 'Gampaha': 25, 'Kalutara': 45, 'Kandy': 120, 'Galle': 115 },
    'Gampaha': { 'Colombo': 25, 'Kalutara': 35, 'Kandy': 110, 'Galle': 130 },
    'Kalutara': { 'Colombo': 45, 'Gampaha': 35, 'Kandy': 90, 'Galle': 100 },
    'Kandy': { 'Colombo': 120, 'Gampaha': 110, 'Kalutara': 90, 'Galle': 150 },
    'Galle': { 'Colombo': 115, 'Gampaha': 130, 'Kalutara': 100, 'Kandy': 150 }
};

// District-based time matrix (hours) - same as previous shipmentController.js
const timeMatrix = {
    'Colombo': { 'Gampaha': 1, 'Kalutara': 1.5, 'Kandy': 3, 'Galle': 3.5 },
    'Gampaha': { 'Colombo': 1, 'Kalutara': 1.2, 'Kandy': 2.8, 'Galle': 3.2 },
    'Kalutara': { 'Colombo': 1.5, 'Gampaha': 1.2, 'Kandy': 2.5, 'Galle': 2.8 },
    'Kandy': { 'Colombo': 3, 'Gampaha': 2.8, 'Kalutara': 2.5, 'Galle': 3.5 },
    'Galle': { 'Colombo': 3.5, 'Gampaha': 3.2, 'Kalutara': 2.8, 'Kandy': 3.5 }
};

// Buffer times configuration based on position in route
const bufferTimeConfig = {
    Express: {
        first: 2,  // First center has 2 hours buffer
        intermediate: 1, // Centers between first and last have 1 hour buffer
        last: 2    // Last center has 2 hours buffer
    },
    Standard: {
        first: 2,  // First center has 2 hours buffer
        intermediate: 2, // Centers between first and last have 2 hours buffer 
        last: 2    // Last center has 2 hours buffer
    }
};

/**
 * Calculate arrival times for each center in the route with proper buffer times
 * @param {Array} route - Array of centers in the route
 * @param {String} deliveryType - Express or Standard
 * @returns {Object} - Object containing arrival times array and shipment finish time
 */
function calculateArrivalTimes(route, deliveryType) {
    const arrivalTimes = [];
    let cumulativeTime = 0;

    // First center (source) has arrival time of 0
    arrivalTimes.push({ center: route[0], time: 0 });

    // For each subsequent center in the route, calculate the arrival time
    for (let i = 1; i < route.length; i++) {
        const previousCenter = route[i - 1];
        const currentCenter = route[i];

        // Apply buffer time for previous center based on its position
        let bufferTime;
        if (i === 1) {
            // First center in the route
            bufferTime = bufferTimeConfig[deliveryType].first;
        } else {
            // Intermediate center in the route
            bufferTime = bufferTimeConfig[deliveryType].intermediate;
        }

        // Add buffer time for previous center
        cumulativeTime += bufferTime;

        // Add travel time from previous to current center
        const travelTime = timeMatrix[previousCenter][currentCenter];
        cumulativeTime += travelTime;

        // Add arrival time for current center
        arrivalTimes.push({
            center: currentCenter,
            time: cumulativeTime
        });
    }

    // Calculate shipment finish time (add buffer time for the last center)
    const lastBufferTime = bufferTimeConfig[deliveryType].last;
    const shipmentFinishTime = cumulativeTime + lastBufferTime;

    // For logging purposes
    console.log(`Arrival times calculated for route ${route.join(' -> ')}:`);
    arrivalTimes.forEach(at => console.log(`  ${at.center}: ${at.time}h`));
    console.log(`Shipment finish time: ${shipmentFinishTime}h`);

    return {
        arrivalTimes,
        shipmentFinishTime
    };
}

/**
 * Find the nearest available vehicle from surrounding branches
 * @param {String} sourceCenter - The center where shipment originates
 * @param {Number} weightRequired - Required weight capacity
 * @param {Number} volumeRequired - Required volume capacity
 * @returns {Object|false} - The nearest vehicle or false if none found
 */
async function findNearestVehicle(sourceCenter, weightRequired, volumeRequired) {
    try {
        // First try to find a branch ID for the source center
        const sourceBranch = await Branch.findOne({ name: sourceCenter });

        if (!sourceBranch) {
            console.error(`Branch not found for center: ${sourceCenter}`);
            return false;
        }

        // First, check for available vehicle in the source center
        const localVehicle = await Vehicle.findOne({
            currentBranch: sourceBranch._id,
            vehicleType: "shipment",
            available: true,
            capableWeight: { $gte: weightRequired },
            capableVolume: { $gte: volumeRequired }
        });

        if (localVehicle) {
            console.log(`Found available vehicle at ${sourceCenter}: ${localVehicle.vehicleId}`);
            return localVehicle;
        }

        // If no vehicle available at source, find nearest centers
        let visitedCenters = new Set([sourceCenter]);
        let centersToCheck = Object.keys(distanceMatrix[sourceCenter])
            .sort((a, b) => distanceMatrix[sourceCenter][a] - distanceMatrix[sourceCenter][b]);

        for (const centerName of centersToCheck) {
            if (visitedCenters.has(centerName)) continue;
            visitedCenters.add(centerName);

            // Find the branch for this center
            const branch = await Branch.findOne({ name: centerName });
            if (!branch) {
                console.log(`Branch not found for center: ${centerName}`);
                continue;
            }

            // Look for available vehicle in this center
            const vehicle = await Vehicle.findOne({
                currentBranch: branch._id,
                vehicleType: "shipment",
                available: true,
                capableWeight: { $gte: weightRequired },
                capableVolume: { $gte: volumeRequired }
            });

            if (vehicle) {
                console.log(`Found available vehicle at ${centerName}: ${vehicle.vehicleId}`);
                return vehicle;
            }
        }

        console.log(`No suitable vehicle found for shipment requirements: weight=${weightRequired}kg, volume=${volumeRequired}m³`);
        return false;
    } catch (error) {
        console.error("Error finding nearest vehicle:", error);
        return false;
    }
}

/**
 * Assign a vehicle to a shipment
 * @param {String} shipmentId - ID of the shipment
 * @param {String} shipmentType - Type of shipment (Express or Standard)
 * @returns {Object} - Result of the assignment operation
 */
async function assignVehicle(shipmentId, shipmentType) {
    try {
        console.log(`Assigning vehicle for shipment ${shipmentId} of type ${shipmentType}`);

        // Find the shipment by ID
        const shipment = await B2BShipment.findById(shipmentId);

        if (!shipment) {
            console.error(`Shipment not found with ID: ${shipmentId}`);
            throw new Error("Shipment not found");
        }

        // Verify the shipment type matches
        if (shipment.deliveryType !== shipmentType) {
            console.error(`Shipment type mismatch. Expected: ${shipmentType}, Found: ${shipment.deliveryType}`);
            throw new Error("Shipment type mismatch");
        }

        // Get the source center and requirements
        const sourceCenter = shipment.sourceCenter;
        const weightRequired = shipment.totalWeight;
        const volumeRequired = shipment.totalVolume;

        console.log(`Requirements: sourceCenter=${sourceCenter}, weight=${weightRequired}kg, volume=${volumeRequired}m³`);

        // Find the nearest available vehicle
        const vehicle = await findNearestVehicle(sourceCenter, weightRequired, volumeRequired);

        if (!vehicle) {
            console.log("No suitable vehicle found for assignment");
            return {
                success: false,
                message: "No suitable vehicle available for this shipment"
            };
        }

        // Get the branch information for the vehicle's current location
        const vehicleBranch = await Branch.findById(vehicle.currentBranch);
        const vehicleCenter = vehicleBranch ? vehicleBranch.name : "Unknown";

        // Update the vehicle status
        vehicle.available = false;
       // await vehicle.save();
        console.log(`Vehicle ${vehicle.vehicleId} marked as unavailable`);

        // Update the shipment with vehicle assignment
        shipment.assignedVehicle = vehicle._id;

        // Update status based on shipment type and vehicle location
        if (vehicleCenter === sourceCenter) {
            // If vehicle is at the source center, update status based on delivery type
            shipment.status = shipmentType === "Express" ? "Verified" : "In Transit";
        } else {
            // If vehicle is coming from another center, status is pending until it arrives
            shipment.status = "Pending";

            // Create a reverse shipment to bring the vehicle to the source center
            await createReverseShipment(vehicle, vehicleCenter, sourceCenter, shipmentType);
        }

        // Save the updated shipment
       // await shipment.save();
        console.log(`Shipment ${shipmentId} updated with vehicle ${vehicle.vehicleId}`);

        return {
            success: true,
            message: vehicleCenter === sourceCenter ?
                `Vehicle ${vehicle.vehicleId} assigned to shipment` :
                `Vehicle ${vehicle.vehicleId} from ${vehicleCenter} assigned and will be dispatched to ${sourceCenter}`,
            vehicle: vehicle
        };
    } catch (error) {
        console.error("Error assigning vehicle:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Create a reverse shipment to bring a vehicle from one center to another
 * @param {Object} vehicle - The vehicle object
 * @param {String} fromCenter - The center where the vehicle is currently located
 * @param {String} toCenter - The destination center where the vehicle needs to go
 * @param {String} shipmentType - Type of the shipment (Express or Standard)
 */
async function createReverseShipment(vehicle, fromCenter, toCenter, shipmentType) {
    try {
        console.log(`Creating reverse shipment for vehicle ${vehicle.vehicleId} from ${fromCenter} to ${toCenter}`);

        // Generate a unique shipment ID for the reverse shipment
        const lastShipment = await B2BShipment.findOne({ sourceCenter: fromCenter })
            .sort({ shipmentId: -1 })
            .select('shipmentId')
            .lean();

        let shipmentCount = 1;
        if (lastShipment) {
            const match = lastShipment.shipmentId.match(/\d+/);
            if (match) {
                shipmentCount = parseInt(match[0], 10) + 1;
            }
        }

        const reverseShipmentId = `${shipmentType === "Express" ? "EX" : "ST"}-S${shipmentCount.toString().padStart(3, '0')}-${fromCenter}`;

        // Calculate the route details
        const route = [fromCenter, toCenter];
        const totalDistance = distanceMatrix[fromCenter][toCenter];

        // Calculate arrival times and total time
        const { arrivalTimes, shipmentFinishTime } = calculateArrivalTimes(route, shipmentType);

        // Create the reverse shipment
        const reverseShipment = new B2BShipment({
            shipmentId: reverseShipmentId,
            deliveryType: shipmentType,
            sourceCenter: fromCenter,
            route: route,
            currentLocation: fromCenter,
            totalDistance: totalDistance,
            totalTime: shipmentFinishTime,
            arrivalTimes: arrivalTimes,
            shipmentFinishTime: shipmentFinishTime,
            totalWeight: 0, // No actual parcels being transported
            totalVolume: 0, // No actual parcels being transported
            parcelCount: 0,
            assignedVehicle: vehicle._id,
            status: 'In Transit',
            parcels: [], // No parcels for vehicle transfer
            createdByCenter: fromCenter,
            createdAt: new Date()
        });

        //await reverseShipment.save();
        console.log(`Reverse shipment ${reverseShipmentId} created for vehicle transfer`);

        return reverseShipment;
    } catch (error) {
        console.error("Error creating reverse shipment:", error);
        throw error;
    }
}

module.exports = { assignVehicle };