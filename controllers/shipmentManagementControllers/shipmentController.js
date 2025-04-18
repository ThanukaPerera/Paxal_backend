// //http://localhost:5000/shipments/processExpressShipments/Center01
// //http://localhost:5000/shipments/processStandardShipments/Center01

// const { buffer } = require('stream/consumers');
// const Parcel = require('../../models/ParcelModel');
// const Shipment = require('../../models/B2BShipmentModel');

// // Distance matrix and time matrix remain unchanged
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


// const constraints = {
//     Express: {
//         maxDistance: 150,
//         maxTime: 24,
//         maxVolume: 5,
//         maxWeight: 1000,
//         buffer: 1,
//         firstBuffer: 2  //1hour for each start and end centers
//     },
//     Standard: {
//         maxDistance: 300,
//         maxTime: 72,
//         maxVolume: 10,
//         maxWeight: 2500,
//         buffer: 2,
//         firstBuffer: 2
//     }
// };


// function calculateArrivalTimes(route, deliveryType) {
//     let arrivalTimes = {};
//     let currentTime = 0;
//     let centerBuffer = 0;
//     if (deliveryType === "Express") {
//         centerBuffer = 1;
//     } else {
//         centerBuffer = 2;
//     }
//     for (let i = 1; i < route.length; i++) {
//         let currentCenter = route[i - 1];
//         let nextCenter = route[i];

//         if (timeMatrix[currentCenter] && timeMatrix[currentCenter][nextCenter]) {
//             if (i === 1) {
//                 currentTime += timeMatrix[currentCenter][nextCenter] + 1; // Start center buffer
//             } else {
//                 currentTime += timeMatrix[currentCenter][nextCenter] + centerBuffer; // Regular stop buffer
//             }
//             arrivalTimes[nextCenter] = currentTime;
//         } else {
//             return null;
//         }
//     }
//     return arrivalTimes;
// }



// // Function to process shipments
// function processShipments(deliveryType, parcels, existingShipments, sourceCenter) {
//     let lastShipmentNumber = 0;
//     if (existingShipments.length > 0) {
//         const lastShipmentId = existingShipments[existingShipments.length - 1];
//         const match = lastShipmentId.match(/\d+/);
//         if (match) {
//             lastShipmentNumber = parseInt(match[0], 10);
//         }
//     }
//     const filteredParcels = parcels.filter(p => p.deliveryType === deliveryType);

//     const groups = {};
//     filteredParcels.forEach(p => {
//         if (!groups[p.destination]) {
//             groups[p.destination] = { parcels: [], totalWeight: 0, totalVolume: 0 };
//         }
//         groups[p.destination].parcels.push(p);
//         groups[p.destination].totalWeight += p.weight;
//         groups[p.destination].totalVolume += p.volume;
//     });

//     let groupArray = Object.keys(groups).map(destination => ({
//         destination,
//         totalWeight: groups[destination].totalWeight,
//         totalVolume: groups[destination].totalVolume,
//         parcels: groups[destination].parcels
//     }));

//     console.log("lastShipmentNumber: ", lastShipmentNumber);

//     let remainingGroups = [...groupArray];
//     const cons = constraints[deliveryType];
//     let shipments = [];
//     let shipmentCount = lastShipmentNumber + 1;
//     let currentShipment = null;

//     console.log("shipmentCount: ", shipmentCount);

//     while (remainingGroups.length > 0) {
//         if (!currentShipment) {
//             const id =
//                 (deliveryType === "Express" ? "EX" : "ST") +
//                 "-S" +
//                 shipmentCount.toString().padStart(3, "0") +
//                 sourceCenter;

//             currentShipment = {
//                 id: id,
//                 deliveryType: deliveryType,
//                 sourceCenter: sourceCenter,
//                 currentLocation: sourceCenter,
//                 totalTime: 0,
//                 arrivalTimes: [],
//                 totalDistance: 0,
//                 totalWeight: 0,
//                 totalVolume: 0,
//                 assignedVehicle: "",
//                 status: "Pending",
//                 parcelCount: 0,
//                 route: [sourceCenter],
//                 legs: 0,
//                 parcels: [],
//             };
//         }

//         const currentCenter = currentShipment.route[currentShipment.route.length - 1];
//         let candidate = null;

//         for (const group of remainingGroups) {
//             if (
//                 distanceMatrix[currentCenter] &&
//                 distanceMatrix[currentCenter][group.destination] !== undefined
//             ) {
//                 const dist = distanceMatrix[currentCenter][group.destination];
//                 if (!candidate || dist < candidate.distance) {
//                     candidate = {
//                         group,
//                         distance: dist,
//                         travelTime: timeMatrix[currentCenter][group.destination]
//                     };
//                 }
//             }
//         }

//         if (!candidate) {
//             shipments.push(currentShipment);
//             currentShipment = null;
//             shipmentCount++;
//             continue;
//         }
//         // Calculate additional time
//         const isFirstLeg = currentShipment.legs === 0;
//         const isFinalLeg = remainingGroups.length === 1; // Only one destination left

//         const initialBuffer = 2; // Fixed 2 hours for first and last centers
//         const middleCenterBuffer = cons.buffer; // 1 hour for Express, 2 hours for Standard

//         const additionalTime = isFirstLeg
//             ? candidate.travelTime + initialBuffer
//             : isFinalLeg
//                 ? candidate.travelTime + initialBuffer
//                 : candidate.travelTime + middleCenterBuffer;


//         console.log("additionalTime: ", additionalTime);
//         const newTotalDistance = currentShipment.totalDistance + candidate.distance;
//         const newTotalTime = currentShipment.totalTime + additionalTime;
//         const newTotalVolume = currentShipment.totalVolume + candidate.group.totalVolume;
//         const newTotalWeight = currentShipment.totalWeight + candidate.group.totalWeight;

//         if (
//             newTotalDistance <= cons.maxDistance &&
//             newTotalTime <= cons.maxTime &&
//             newTotalVolume <= cons.maxVolume &&
//             newTotalWeight <= cons.maxWeight
//         ) {
//             currentShipment.totalDistance = newTotalDistance;
//             currentShipment.totalTime = newTotalTime;
//             currentShipment.arrivalTimes = [];
//             currentShipment.totalVolume = newTotalVolume;
//             currentShipment.totalWeight = newTotalWeight;
//             currentShipment.route.push(candidate.group.destination);
//             currentShipment.parcels.push(...candidate.group.parcels);
//             currentShipment.parcelCount += candidate.group.parcels.length;
//             currentShipment.legs++;

//             remainingGroups = remainingGroups.filter(
//                 (grp) => grp.destination !== candidate.group.destination
//             );
//         } else {
//             currentShipment.arrivalTimes = Object.entries(calculateArrivalTimes(currentShipment.route, deliveryType))
//                 .map(([center, time]) => ({ center, time }));
//             shipments.push(currentShipment);
//             Promise.all(currentShipment.parcels.map(async parcel => {
//                 parcel.shipmentId = currentShipment.id;
//                 await Parcel.updateOne({ _id: parcel._id }, { $set: { shipmentId: currentShipment.id } });
//             }));
//             currentShipment = null;
//             shipmentCount++;
//         }
//     }

//     if (currentShipment) {
//         currentShipment.arrivalTimes = Object.entries(calculateArrivalTimes(currentShipment.route, deliveryType))
//             .map(([center, time]) => ({ center, time }));

//         Promise.all(currentShipment.parcels.map(async parcel => {
//             parcel.shipmentId = currentShipment.id;
//             await Parcel.updateOne({ _id: parcel._id }, { $set: { shipmentId: currentShipment.id } });
//         }));
//         shipments.push(currentShipment);
//     }

//     return shipments;
// }

// // Function to save shipments to the database
// const saveShipments = async (shipments) => {
//     try {
//         for (const shipment of shipments) {
//             if (shipment.id) {
//                 const newShipment = new Shipment(shipment);

//                 newShipment.status = "Pending";

//                 await newShipment.save();
//                 console.log("Shipment saved:", newShipment.id);

//                 // Use Promise.all to wait for all parcel updates to complete
//                 await Promise.all(newShipment.parcels.map(async parcel => {
//                     parcel.shipmentId = newShipment.id;
//                     await Parcel.updateOne({ _id: parcel._id }, { $set: { shipmentId: newShipment.id } });
//                 }));

//             } else {
//                 console.log("Shipment ID is null");
//             }
//         }
//         console.log('Shipments saved successfully.');
//     } catch (error) {
//         console.error('Error saving shipments:', error);
//         throw error;
//     }
// };

// // Function to process all shipments (Express or Standard)
// const processAllShipments = async (type, center) => {
//     const parcels = await Parcel.find({
//         deliveryType: type,
//         sourceCenter: center,
//         shipmentId: null
//     });

//     if (parcels.length === 0) return `No ${type} shipments to process`;

//     let existingShipments = [];
//     try {
//         const lastShipment = await Shipment.findOne({ deliveryType: type, sourceCenter: center })
//             .sort({ id: -1 })
//             .select('id')
//             .lean();

//         if (lastShipment) {
//             existingShipments = [lastShipment.id.replace(/EX-S|ST-S/, '')];
//         }
//     } catch (error) {
//         console.error("Error fetching existing shipments:", error);
//         throw error;
//     }

//     const shipments = processShipments(type, parcels, existingShipments, center);
//     await saveShipments(shipments);
//     return shipments;
// };

// module.exports = { processAllShipments };


//http://localhost:8000/shipments/process/Express/67c41df8c2ca1289195def43

//controllers/shipmentController.js

//

/// controllers/shipmentController.js
const Parcel = require('../../models/ParcelModel');
const B2BShipment = require('../../models/B2BShipmentModel');
const Branch = require('../../models/BranchesModel');
const mongoose = require('mongoose');

// Create distance and time matrices based on branch ObjectIds
// This function will build the matrices when needed
async function buildMatrices() {
    const branches = await Branch.find().lean();

    // Create maps for fast lookups
    const branchMap = {};
    const idToLocationMap = {};
    const locationToIdMap = {};

    branches.forEach(branch => {
        const id = branch._id.toString();
        branchMap[id] = branch;
        idToLocationMap[id] = branch.location;
        locationToIdMap[branch.location] = id;
    });

    // Existing district matrices
    const districtDistanceMatrix = {
        'Colombo': { 'Gampaha': 25, 'Kalutara': 45, 'Kandy': 120, 'Galle': 115, 'Hambantota': 160, 'Matale': 140, 'Batticaloa': 280, 'Nuwara Eliya': 150, 'Monaragala': 270 },
        'Gampaha': { 'Colombo': 25, 'Kalutara': 35, 'Kandy': 110, 'Galle': 130, 'Hambantota': 180, 'Matale': 130, 'Batticaloa': 300, 'Nuwara Eliya': 140, 'Monaragala': 290 },
        'Kalutara': { 'Colombo': 45, 'Gampaha': 35, 'Kandy': 90, 'Galle': 100, 'Hambantota': 140, 'Matale': 120, 'Batticaloa': 320, 'Nuwara Eliya': 160, 'Monaragala': 250 },
        'Kandy': { 'Colombo': 120, 'Gampaha': 110, 'Kalutara': 90, 'Galle': 150, 'Hambantota': 200, 'Matale': 30, 'Batticaloa': 160, 'Nuwara Eliya': 35, 'Monaragala': 120 },
        'Galle': { 'Colombo': 115, 'Gampaha': 130, 'Kalutara': 100, 'Kandy': 150, 'Hambantota': 70, 'Matale': 170, 'Batticaloa': 300, 'Nuwara Eliya': 180, 'Monaragala': 190 },
        'Hambantota': { 'Colombo': 160, 'Gampaha': 180, 'Kalutara': 140, 'Kandy': 200, 'Galle': 70, 'Matale': 220, 'Batticaloa': 250, 'Nuwara Eliya': 230, 'Monaragala': 90 },
        'Matale': { 'Colombo': 140, 'Gampaha': 130, 'Kalutara': 120, 'Kandy': 30, 'Galle': 170, 'Hambantota': 220, 'Batticaloa': 140, 'Nuwara Eliya': 50, 'Monaragala': 110 },
        'Batticaloa': { 'Colombo': 280, 'Gampaha': 300, 'Kalutara': 320, 'Kandy': 160, 'Galle': 300, 'Hambantota': 250, 'Matale': 140, 'Nuwara Eliya': 190, 'Monaragala': 130 },
        'Nuwara Eliya': { 'Colombo': 150, 'Gampaha': 140, 'Kalutara': 160, 'Kandy': 35, 'Galle': 180, 'Hambantota': 230, 'Matale': 50, 'Batticaloa': 190, 'Monaragala': 130 },
        'Monaragala': { 'Colombo': 270, 'Gampaha': 290, 'Kalutara': 250, 'Kandy': 120, 'Galle': 190, 'Hambantota': 90, 'Matale': 110, 'Batticaloa': 130, 'Nuwara Eliya': 130 }
    };

    const districtTimeMatrix = {
        'Colombo': { 'Gampaha': 1, 'Kalutara': 1.5, 'Kandy': 3, 'Galle': 3.5, 'Hambantota': 4.5, 'Matale': 3.5, 'Batticaloa': 7, 'Nuwara Eliya': 4, 'Monaragala': 6.5 },
        'Gampaha': { 'Colombo': 1, 'Kalutara': 1.2, 'Kandy': 2.8, 'Galle': 3.2, 'Hambantota': 5, 'Matale': 3.2, 'Batticaloa': 7.5, 'Nuwara Eliya': 3.7, 'Monaragala': 7 },
        'Kalutara': { 'Colombo': 1.5, 'Gampaha': 1.2, 'Kandy': 2.5, 'Galle': 2.8, 'Hambantota': 3.8, 'Matale': 3, 'Batticaloa': 8, 'Nuwara Eliya': 4.2, 'Monaragala': 6 },
        'Kandy': { 'Colombo': 3, 'Gampaha': 2.8, 'Kalutara': 2.5, 'Galle': 3.5, 'Hambantota': 5.5, 'Matale': 0.8, 'Batticaloa': 4, 'Nuwara Eliya': 1, 'Monaragala': 3 },
        'Galle': { 'Colombo': 3.5, 'Gampaha': 3.2, 'Kalutara': 2.8, 'Kandy': 3.5, 'Hambantota': 1.8, 'Matale': 4.5, 'Batticaloa': 7.5, 'Nuwara Eliya': 4.8, 'Monaragala': 4.5 },
        'Hambantota': { 'Colombo': 4.5, 'Gampaha': 5, 'Kalutara': 3.8, 'Kandy': 5.5, 'Galle': 1.8, 'Matale': 6, 'Batticaloa': 6.5, 'Nuwara Eliya': 6.2, 'Monaragala': 2.2 },
        'Matale': { 'Colombo': 3.5, 'Gampaha': 3.2, 'Kalutara': 3, 'Kandy': 0.8, 'Galle': 4.5, 'Hambantota': 6, 'Batticaloa': 3.5, 'Nuwara Eliya': 1.3, 'Monaragala': 2.8 },
        'Batticaloa': { 'Colombo': 7, 'Gampaha': 7.5, 'Kalutara': 8, 'Kandy': 4, 'Galle': 7.5, 'Hambantota': 6.5, 'Matale': 3.5, 'Nuwara Eliya': 5, 'Monaragala': 3.2 },
        'Nuwara Eliya': { 'Colombo': 4, 'Gampaha': 3.7, 'Kalutara': 4.2, 'Kandy': 1, 'Galle': 4.8, 'Hambantota': 6.2, 'Matale': 1.3, 'Batticaloa': 5, 'Monaragala': 3.2 },
        'Monaragala': { 'Colombo': 6.5, 'Gampaha': 7, 'Kalutara': 6, 'Kandy': 3, 'Galle': 4.5, 'Hambantota': 2.2, 'Matale': 2.8, 'Batticaloa': 3.2, 'Nuwara Eliya': 3.2 }
    };

    // Create new matrices based on ObjectIds
    const distanceMatrix = {};
    const timeMatrix = {};

    Object.keys(districtDistanceMatrix).forEach(source => {
        if (locationToIdMap[source]) {
            const sourceId = locationToIdMap[source];
            distanceMatrix[sourceId] = {};
            Object.keys(districtDistanceMatrix[source]).forEach(dest => {
                if (locationToIdMap[dest]) {
                    const destId = locationToIdMap[dest];
                    distanceMatrix[sourceId][destId] = districtDistanceMatrix[source][dest];
                }
            });
        }
    });

    Object.keys(districtTimeMatrix).forEach(source => {
        if (locationToIdMap[source]) {
            const sourceId = locationToIdMap[source];
            timeMatrix[sourceId] = {};
            Object.keys(districtTimeMatrix[source]).forEach(dest => {
                if (locationToIdMap[dest]) {
                    const destId = locationToIdMap[dest];
                    timeMatrix[sourceId][destId] = districtTimeMatrix[source][dest];
                }
            });
        }
    });

    return {
        distanceMatrix,
        timeMatrix,
        branchMap,
        idToLocationMap,
        locationToIdMap
    };
}

// Shipment constraints remain the same
const constraints = {
    Express: {
        maxDistance: 150,
        maxTime: 24,
        maxVolume: 5,
        maxWeight: 1000,
        buffer: 1,
        firstBuffer: 4
    },
    Standard: {
        maxDistance: 300,
        maxTime: 72,
        maxVolume: 10,
        maxWeight: 2500,
        buffer: 2,
        firstBuffer: 4
    }
};

// Buffer times configuration based on position in route
const bufferTimeConfig = {
    Express: {
        first: 2,
        intermediate: 1,
        last: 2
    },
    Standard: {
        first: 2,
        intermediate: 2,
        last: 2
    }
};

// Size-based specifications
const sizeSpecs = {
    small: { weight: 2, volume: 0.2 },
    medium: { weight: 5, volume: 0.5 },
    large: { weight: 10, volume: 1 }
};

/**
 * Calculate arrival times for each center in the route with proper buffer times
 * @param {Array} route - Array of centers in the route (ObjectIds as strings)
 * @param {String} deliveryType - Express or Standard
 * @param {Object} timeMatrix - Time matrix based on ObjectIds
 * @returns {Object} - Array of objects containing center and arrival time, plus shipment finish time
 */
function calculateArrivalTimes(route, deliveryType, timeMatrix) {
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

    return {
        arrivalTimes,
        shipmentFinishTime
    };
}

/**
 * Process parcels into shipments
 * @param {String} deliveryType - Express or Standard
 * @param {Array} parcels - Array of parcel documents
 * @param {ObjectId} sourceCenterId - MongoDB ObjectId of source center
 * @param {ObjectId} staffId - MongoDB ObjectId of staff member
 * @param {Object} matrices - Object containing distance and time matrices
 * @returns {Array} - Array of shipment documents
 */
async function processShipments(deliveryType, parcels, sourceCenterId, staffId, matrices) {
    console.log(`Processing ${deliveryType} shipments from ${sourceCenterId}`);
    const { distanceMatrix, timeMatrix, branchMap, idToLocationMap } = matrices;
    const sourceCenterIdStr = sourceCenterId.toString();

    let shipments = [];
    let lastShipmentNumber = 0;

    // Get last shipment number for the source center
    const lastShipment = await B2BShipment.findOne({ sourceCenter: sourceCenterId })
        .sort({ shipmentId: -1 })
        .select('shipmentId')
        .lean();

    if (lastShipment) {
        const match = lastShipment.shipmentId.match(/-S(\d+)-/);
        if (match) lastShipmentNumber = parseInt(match[1]);
    }

    // Process parcels and group by destination center
    const processedParcels = parcels.map(parcel => {
        return {
            ...parcel.toObject(),
            fromId: parcel.from.toString(),
            toId: parcel.to._id ? parcel.to._id.toString() : parcel.to.toString(),
            weight: sizeSpecs[parcel.itemSize].weight,
            volume: sizeSpecs[parcel.itemSize].volume
        };
    });

    // Group parcels by destination
    const destinationGroups = {};
    for (const parcel of processedParcels) {
        // Skip parcels destined for source center
        if (parcel.toId === sourceCenterIdStr) continue;

        const destId = parcel.toId;
        if (!destinationGroups[destId]) {
            destinationGroups[destId] = { parcels: [], totalWeight: 0, totalVolume: 0 };
        }
        destinationGroups[destId].parcels.push(parcel._id);
        destinationGroups[destId].totalWeight += parcel.weight;
        destinationGroups[destId].totalVolume += parcel.volume;
    }

    // Generate optimized route from source to all destinations
    const destinations = Object.keys(destinationGroups);
    if (destinations.length === 0) {
        console.log("No valid destinations found");
        return shipments;
    }

    const route = optimizeRoute(sourceCenterIdStr, destinations, distanceMatrix);
    console.log("Optimized route:", route);

    let currentShipment = null;
    let shipmentCount = lastShipmentNumber + 1;

    // Process each destination in the optimized route (excluding source center)
    for (let i = 1; i < route.length; i++) {
        const destination = route[i];
        const group = destinationGroups[destination];

        if (!group) {
            console.log(`No parcels for destination: ${destination}`);
            continue;
        }

        // Create new shipment if none exists
        if (!currentShipment) {
            currentShipment = createNewShipment(deliveryType, sourceCenterId, staffId, shipmentCount++, idToLocationMap);
        }

        // For a new shipment, we always go from source center to destination
        const prevCenter = currentShipment.route.length === 1 ?
            sourceCenterIdStr :
            currentShipment.route[currentShipment.route.length - 1].toString();

        if (!timeMatrix[prevCenter] || !timeMatrix[prevCenter][destination]) {
            console.log(`Missing time matrix data for route ${prevCenter} -> ${destination}`);
            continue;
        }

        const travelTime = timeMatrix[prevCenter][destination];

        // Apply the firstBuffer for the first leg from source center to first destination
        const isFirstLeg = currentShipment.route.length === 1;
        const bufferTime = isFirstLeg ? constraints[deliveryType].firstBuffer : constraints[deliveryType].buffer;
        const additionalTime = travelTime + bufferTime;

        // Check if current shipment can accommodate this group
        if (!canAddToShipment(currentShipment, destination, group, additionalTime, deliveryType, prevCenter, distanceMatrix)) {
            await finalizeShipment(currentShipment, deliveryType, timeMatrix);
            shipments.push(currentShipment);

            // Create new shipment starting from source center
            currentShipment = createNewShipment(deliveryType, sourceCenterId, staffId, shipmentCount++, idToLocationMap);

            // Recalculate travel time from source center to destination
            const directTravelTime = timeMatrix[sourceCenterIdStr][destination];
            const directAdditionalTime = directTravelTime + constraints[deliveryType].firstBuffer;

            // Add destination directly to new shipment (from source center)
            try {
                const destObjectId =new mongoose.Types.ObjectId(destination);
                currentShipment.route.push(destObjectId);
                currentShipment.totalDistance = distanceMatrix[sourceCenterIdStr][destination];
                currentShipment.totalTime = directAdditionalTime;
                currentShipment.parcels.push(...group.parcels);
                currentShipment.parcelCount = group.parcels.length;
                currentShipment.totalWeight = group.totalWeight;
                currentShipment.totalVolume = group.totalVolume;
            } catch (error) {
                console.error(`Error adding destination ${destination} to shipment:`, error);
                continue;
            }
        } else {
            // Add destination to current shipment
            try {
                const destObjectId =new mongoose.Types.ObjectId(destination);
                currentShipment.route.push(destObjectId);
                currentShipment.totalDistance += distanceMatrix[prevCenter][destination];
                currentShipment.totalTime += additionalTime;
                currentShipment.parcels.push(...group.parcels);
                currentShipment.parcelCount += group.parcels.length;
                currentShipment.totalWeight += group.totalWeight;
                currentShipment.totalVolume += group.totalVolume;
            } catch (error) {
                console.error(`Error adding destination ${destination} to shipment:`, error);
                continue;
            }
        }
    }

    // Finalize the last shipment
    if (currentShipment) {
        await finalizeShipment(currentShipment, deliveryType, timeMatrix);
        shipments.push(currentShipment);
    }

    return shipments;
}

// Optimize route using nearest neighbor algorithm
function optimizeRoute(source, destinations, distanceMatrix) {
    let route = [source];
    let remaining = [...destinations];

    while (remaining.length > 0) {
        const last = route[route.length - 1];

        // Check if distanceMatrix has data for the last point
        if (!distanceMatrix[last]) {
            console.log(`No distance data for ${last}, skipping route optimization`);
            return [source]; // Return only source if no data
        }

        let nearest = null;
        let shortestDistance = Infinity;

        for (const dest of remaining) {
            // Check if destination exists in the distance matrix
            if (distanceMatrix[last][dest] !== undefined) {
                const dist = distanceMatrix[last][dest];
                if (dist < shortestDistance) {
                    shortestDistance = dist;
                    nearest = dest;
                }
            }
        }

        // If no valid nearest destination was found, break the loop
        if (nearest === null) {
            console.log("No valid nearest destination found, ending route optimization");
            break;
        }

        route.push(nearest);
        remaining = remaining.filter(d => d !== nearest);
    }

    return route;
}

function createNewShipment(deliveryType, sourceCenterId, staffId, sequence, idToLocationMap) {
    const sourceLocation = idToLocationMap[sourceCenterId.toString()] || 'Unknown';
    const shipmentId = `${deliveryType === 'Express' ? 'EX' : 'ST'}-S${sequence.toString().padStart(3, '0')}-${sourceLocation}`;

    return new B2BShipment({
        shipmentId,
        deliveryType,
        sourceCenter: sourceCenterId,
        route: [sourceCenterId], // Always start with source center
        currentLocation: sourceCenterId,
        totalDistance: 0,
        totalTime: 0,
        totalWeight: 0,
        totalVolume: 0,
        parcelCount: 0,
        parcels: [],
        createdByCenter: sourceCenterId,
        createdByStaff: staffId,
        status: 'Pending'
    });
}

// Check if shipment can accommodate adding this destination's group
function canAddToShipment(shipment, destination, group, additionalTime, deliveryType, prevCenter, distanceMatrix) {
    const cons = constraints[deliveryType];

    // Safety check for missing data
    if (!distanceMatrix[prevCenter] || distanceMatrix[prevCenter][destination] === undefined) {
        console.log(`Missing distance data for ${prevCenter} -> ${destination}`);
        return false;
    }

    const addedDistance = distanceMatrix[prevCenter][destination];

    const newDistance = shipment.totalDistance + addedDistance;
    const newTime = shipment.totalTime + additionalTime;
    const newWeight = shipment.totalWeight + group.totalWeight;
    const newVolume = shipment.totalVolume + group.totalVolume;

    return newDistance <= cons.maxDistance &&
        newTime <= cons.maxTime &&
        newWeight <= cons.maxWeight &&
        newVolume <= cons.maxVolume;
}

// Finalize shipment details and save
async function finalizeShipment(shipment, deliveryType, timeMatrix) {
    try {
        // Convert ObjectIds to strings for calculation
        const routeIds = shipment.route.map(id => id.toString());

        // Use the arrival times calculation method
        const { arrivalTimes, shipmentFinishTime } = calculateArrivalTimes(routeIds, deliveryType, timeMatrix);

        // Convert arrival times back to ObjectIds
        shipment.arrivalTimes = arrivalTimes.map(at => ({
            center: new mongoose.Types.ObjectId(at.center), 
            time: at.time
        }));

        shipment.shipmentFinishTime = shipmentFinishTime;

        // Uncomment to save to database
         await shipment.save();
        // await Parcel.updateMany(
        //     { _id: { $in: shipment.parcels } },
        //     { shipmentId: shipment._id, status: 'ShipmentAssigned' }
        // );
    } catch (error) {
        console.error("Error finalizing shipment:", error);
        // Handle error but don't throw, so processing can continue
        shipment.arrivalTimes = [];
        shipment.shipmentFinishTime = shipment.totalTime;
    }
}

// Main controller function
exports.processAllShipments = async (deliveryType, sourceCenterId, staffId) => {
    try {
        // Ensure we have valid ObjectIds
        const sourceId = typeof sourceCenterId === 'string' ?
            new mongoose.Types.ObjectId(sourceCenterId) : sourceCenterId;

        const staffObjectId = typeof staffId === 'string' ?
            new mongoose.Types.ObjectId(staffId) : staffId;

        // First, build the matrices with ObjectIds
        const matrices = await buildMatrices();

        // Verify source center exists
        const sourceBranch = await Branch.findById(sourceId).lean();
        if (!sourceBranch) {
            return { success: false, message: 'Invalid source center ID' };
        }

        // Fetch parcels with the source center's ObjectId
        const parcels = await Parcel.find({
            shipmentId: null,
            shippingMethod: deliveryType,
            from: sourceId
        }).populate('to');

        if (parcels.length === 0) {
            return { success: false, message: 'No parcels available for shipment' };
        }

        console.log(`Found ${parcels.length} parcels for processing`);

        // Process the shipments using ObjectIds
        const shipments = await processShipments(deliveryType, parcels, sourceId, staffObjectId, matrices);

        return {
            success: true,
            count: shipments.length,
            shipments: shipments
        };

    } catch (error) {
        console.error('Shipment processing error:', error);
        return { success: false, error: error.message };
    }
};