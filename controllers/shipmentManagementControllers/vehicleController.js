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
//                 assignedBranch: nearestCenter,
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
//             nearestCenter = nearestVehicle.assignedBranch;
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

//http://localhost:8000/vehicles/assignVehicleToShipment/6800c4d4145113a6e369c3e0/Express
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
 * Find the nearest available vehicle following a three-step search approach:
 * 1. Find vehicle that belongs to and is currently at the source center
 * 2. Find vehicle that belongs to source center but is currently at another center (up to 3 nearest)
 * 3. Find vehicle from nearest center (belongs to and currently at that center)
 * 
 * @param {String} sourceCenter - The center where shipment originates
 * @param {Number} weightRequired - Required weight capacity
 * @param {Number} volumeRequired - Required volume capacity
 * @returns {Object|false} - The nearest vehicle or false if none found
 */
async function findNearestVehicle(sourceCenter, weightRequired, volumeRequired) {
    try {
        console.log(`Finding nearest vehicle for source center: ${sourceCenter}, required weight: ${weightRequired}kg, volume: ${volumeRequired}m³`);

        // Find the branch document for the source center
        const sourceBranch = await Branch.findOne({ location: sourceCenter });

        if (!sourceBranch) {
            console.error(`Branch not found for center: ${sourceCenter}`); 
            return false;
        }

        console.log(`Source branch found: ${sourceBranch._id} (${sourceCenter})`);

        // STEP 1: Find vehicle that belongs to and is currently at the source center
        console.log("STEP 1: Searching for vehicles belonging to and currently at source center");
        const localVehicle = await Vehicle.findOne({
            assignedBranch: sourceBranch._id,
            currentBranch: sourceBranch._id,
            vehicleType: "shipment",
            available: true,
            capableWeight: { $gte: weightRequired },
            capableVolume: { $gte: volumeRequired }
        });

        if (localVehicle) {
            console.log(`✓ Found local vehicle at ${sourceCenter}: ${localVehicle.vehicleId}`);
            return localVehicle;
        }
        console.log(`✗ No suitable local vehicle found at ${sourceCenter}`);

        // STEP 2: Find vehicle that belongs to source center but is currently at another center
        console.log("STEP 2: Searching for vehicles belonging to source center but located elsewhere");

        // Get all branches sorted by distance from source center
        const allBranches = await Branch.find({ location: { $ne: sourceCenter } });

        // Sort branches by their distance from source center
        const sortedBranches = allBranches
            .filter(branch => distanceMatrix[sourceCenter][branch.location])
            .sort((a, b) =>
                distanceMatrix[sourceCenter][a.location] - distanceMatrix[sourceCenter][b.location]
            );

        // Check up to 3 nearest branches for vehicles that belong to source center
        const nearestBranches = sortedBranches.slice(0, 3);
        console.log(`Checking ${nearestBranches.length} nearest branches for source-owned vehicles`);

        for (const branch of nearestBranches) {
            console.log(`Checking branch ${branch.location} for vehicles belonging to ${sourceCenter}`);

            const vehicle = await Vehicle.findOne({
                assignedBranch: sourceBranch._id, // Belongs to source center
                currentBranch: branch._id,       // But currently at another branch
                vehicleType: "shipment",
                available: true,
                capableWeight: { $gte: weightRequired },
                capableVolume: { $gte: volumeRequired }
            });

            if (vehicle) {
                console.log(`✓ Found source-owned vehicle at ${branch.location}: ${vehicle.vehicleId}`);
                return vehicle;
            }
        }
        console.log(`✗ No suitable source-owned vehicles found in nearby centers`);

        // STEP 3: Find vehicle from nearest center (belongs to and currently at that center)
        console.log("STEP 3: Searching for vehicles that belong to and are currently at nearest centers");

        for (const branch of nearestBranches) {
            console.log(`Checking branch ${branch.location} for local vehicles`);

            const vehicle = await Vehicle.findOne({
                assignedBranch: branch._id,      // Belongs to this branch
                currentBranch: branch._id,      // And currently at this branch
                vehicleType: "shipment",
                available: true,
                capableWeight: { $gte: weightRequired },
                capableVolume: { $gte: volumeRequired }
            });

            if (vehicle) {
                console.log(`✓ Found vehicle at ${branch.location}: ${vehicle.vehicleId}`);
                return vehicle;
            }
        }

        console.log(`✗ No suitable vehicle found after all search steps. Requirements: weight=${weightRequired}kg, volume=${volumeRequired}m³`);
        return false;
    } catch (error) {
        console.error(`Error finding nearest vehicle: ${error.message}`, error);
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
       
        const vehicleCenter = vehicleBranch ? vehicleBranch.location : "Unknown";

        

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
 * Also finds and includes parcels that need to be shipped along the same route
 * @param {Object} vehicle - The vehicle object
 * @param {String} fromCenter - The center where the vehicle is currently located (as a string)
 * @param {String} toCenter - The destination center where the vehicle needs to go (as a string)
 * @param {String} shipmentType - Type of the shipment (Express or Standard)
 */
async function createReverseShipment(vehicle, fromCenter, toCenter, shipmentType) {
    try {
        console.log(`Creating reverse shipment for vehicle ${vehicle.vehicleId} from ${fromCenter} to ${toCenter}`);

        // Size specifications for parcels
        const sizeSpecs = {
            small: { weight: 2, volume: 0.2 },
            medium: { weight: 5, volume: 0.5 },
            large: { weight: 10, volume: 1 }
        };

        // First, get the Branch ObjectIds for source and destination centers
        const sourceBranch = await Branch.findOne({ location: fromCenter });
        const destinationBranch = await Branch.findOne({ location: toCenter });

        if (!sourceBranch || !destinationBranch) {
            throw new Error(`Unable to find branch information for ${!sourceBranch ? fromCenter : toCenter}`);
        }

        console.log(`Found branch IDs - Source: ${sourceBranch._id}, Destination: ${destinationBranch._id}`);

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

        // Find parcels that need to be shipped from fromCenter to toCenter
        const pendingParcels = await Parcel.find({
            shippingMethod: shipmentType,
            from: sourceBranch,
            to: destinationBranch,
           // status: 'Ready',
            shipmentId: null
        }).sort({ createdAt: 1 }); // Process oldest parcels first (FIFO)

        if (pendingParcels.length === 0) {
            console.log(`No parcels found for reverse shipment from ${fromCenter} to ${toCenter}`);
            return false;
        }

        console.log(`Found ${pendingParcels.length} pending parcels from ${fromCenter} to ${toCenter}`);

        // Initialize shipment metrics
        let totalWeight = 0;
        let totalVolume = 0;
        let selectedParcels = [];

        // Calculate vehicle capacity
        const vehicleMaxWeight = vehicle.capableWeight;
        const vehicleMaxVolume = vehicle.capableVolume;

        // Add parcels to the shipment until capacity is reached
        for (const parcel of pendingParcels) {
            // Get weight and volume based on parcel's size
            const itemSize = parcel.itemSize?.toLowerCase() || 'medium'; // Default to medium if not specified

            // Ensure the itemSize is valid, default to medium if not
            const sizeSpec = sizeSpecs[itemSize] || sizeSpecs.medium;

            const parcelWeight = sizeSpec.weight;
            const parcelVolume = sizeSpec.volume;

            // Check if adding this parcel would exceed vehicle capacity
            if ((totalWeight + parcelWeight <= vehicleMaxWeight) &&
                (totalVolume + parcelVolume <= vehicleMaxVolume)) {

                // Add parcel to selected parcels
                selectedParcels.push(parcel._id);
                totalWeight += parcelWeight;
                totalVolume += parcelVolume;

                // Update parcel status and shipment ID
                parcel.status = 'In Transit';
                parcel.shipmentId = reverseShipmentId;
                //await parcel.save();

                console.log(`Added parcel ${parcel._id} (${itemSize}) to reverse shipment, weight: ${parcelWeight}kg, volume: ${parcelVolume}m³`);
            } else {
                // Vehicle capacity reached
                console.log(`Vehicle capacity reached. Skipping remaining parcels.`);
                break;
            }
        }

        // Create the reverse shipment with the selected parcels
        const reverseShipment = new B2BShipment({
            shipmentId: reverseShipmentId,
            deliveryType: shipmentType,
            sourceCenter: fromCenter,
            sourceBranch: sourceBranch._id,
            destinationBranch: destinationBranch._id,
            route: route,
            currentLocation: fromCenter,
            totalDistance: totalDistance,
            totalTime: shipmentFinishTime,
            arrivalTimes: arrivalTimes,
            shipmentFinishTime: shipmentFinishTime,
            totalWeight: totalWeight,
            totalVolume: totalVolume,
            parcelCount: selectedParcels.length,
            assignedVehicle: vehicle._id,
            status: 'In Transit',
            parcels: selectedParcels,
            createdByCenter: fromCenter,
            createdAt: new Date()
        });

        //await reverseShipment.save();

        // Update vehicle status
        vehicle.available = false;
        vehicle.currentShipment = reverseShipment._id;
       // await vehicle.save();

        console.log(`Reverse shipment ${reverseShipmentId} created with ${selectedParcels.length} parcels, total weight: ${totalWeight}kg, total volume: ${totalVolume}m³`);

        return reverseShipment;
    } catch (error) {
        console.error("Error creating reverse shipment:", error);
        throw error;
    }
}
module.exports = { assignVehicle };