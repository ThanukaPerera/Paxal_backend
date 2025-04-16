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




// controllers/shipmentController.js
const mongoose = require('mongoose');
const Parcel = require('../../models/ParcelModel');
const B2BShipment = require('../../models/B2BShipmentModel');
const Branch = require('../../models/StaffModel');

// District-based distance matrix (km)
const distanceMatrix = {
    'Colombo': { 'Gampaha': 25, 'Kalutara': 45, 'Kandy': 120, 'Galle': 115 },
    'Gampaha': { 'Colombo': 25, 'Kalutara': 35, 'Kandy': 110, 'Galle': 130 },
    'Kalutara': { 'Colombo': 45, 'Gampaha': 35, 'Kandy': 90, 'Galle': 100 },
    'Kandy': { 'Colombo': 120, 'Gampaha': 110, 'Kalutara': 90, 'Galle': 150 },
    'Galle': { 'Colombo': 115, 'Gampaha': 130, 'Kalutara': 100, 'Kandy': 150 }
};

// District-based time matrix (hours)
const timeMatrix = {
    'Colombo': { 'Gampaha': 1, 'Kalutara': 1.5, 'Kandy': 3, 'Galle': 3.5 },
    'Gampaha': { 'Colombo': 1, 'Kalutara': 1.2, 'Kandy': 2.8, 'Galle': 3.2 },
    'Kalutara': { 'Colombo': 1.5, 'Gampaha': 1.2, 'Kandy': 2.5, 'Galle': 2.8 },
    'Kandy': { 'Colombo': 3, 'Gampaha': 2.8, 'Kalutara': 2.5, 'Galle': 3.5 },
    'Galle': { 'Colombo': 3.5, 'Gampaha': 3.2, 'Kalutara': 2.8, 'Kandy': 3.5 }
};

const constraints = {
    Express: {
        maxDistance: 150,
        maxTime: 24,
        maxVolume: 5,
        maxWeight: 1000,
        buffer: 1,
        firstBuffer: 2
    },
    Standard: {
        maxDistance: 300,
        maxTime: 72,
        maxVolume: 10,
        maxWeight: 2500,
        buffer: 2,
        firstBuffer: 2
    }
};

// Size-based specifications
const sizeSpecs = {
    small: { weight: 2, volume: 0.2 },
    medium: { weight: 5, volume: 0.5 },
    large: { weight: 10, volume: 1 }
};

// Helper function to get district information
async function getDistrictInfo(parcel) {
    let sourceDistrict, destDistrict;

    // Try to get from/to branches first
    if (parcel.from) {
        const branch = await Branch.findById(parcel.from).select('district').lean();
        sourceDistrict = branch?.district;
    }
    if (parcel.to) {
        const branch = await Branch.findById(parcel.to).select('district').lean();
        destDistrict = branch?.district;
    }

    // Fallback to pickup/delivery information
    if (!sourceDistrict && parcel.pickupInformation) {
        sourceDistrict = parcel.pickupInformation.district;
    }
    if (!destDistrict && parcel.deliveryInformation) {
        destDistrict = parcel.deliveryInformation.deliveryDistrict;
    }

    return { sourceDistrict, destDistrict };
}

function calculateArrivalTimes(route, deliveryType) {
    let arrivalTimes = [];
    let currentTime = 0;
    const buffer = deliveryType === 'Express' ? 1 : 2;

    for (let i = 1; i < route.length; i++) {
        const prev = route[i - 1];
        const curr = route[i];
        const travelTime = timeMatrix[prev][curr];

        currentTime += travelTime + (i === 1 ? constraints[deliveryType].firstBuffer : buffer);
        arrivalTimes.push({ center: curr, time: currentTime });
    }
    return arrivalTimes;
}

async function processShipments(deliveryType, parcels, sourceCenter, staffId) {
    let shipments = [];
    let lastShipmentNumber = 0;

    // Get existing shipment numbers
    const lastShipment = await B2BShipment.findOne({ sourceCenter })
        .sort({ shipmentId: -1 })
        .select('shipmentId')
        .lean();

    if (lastShipment) {
        const match = lastShipment.shipmentId.match(/-S(\d+)-/);
        if (match) lastShipmentNumber = parseInt(match[1]);
    }

    // Process parcels and group by destination
    const processedParcels = await Promise.all(parcels.map(async parcel => {
        const { sourceDistrict, destDistrict } = await getDistrictInfo(parcel);
        if (!sourceDistrict || !destDistrict) return null;

        return {
            ...parcel.toObject(),
            sourceDistrict,
            destDistrict,
            weight: sizeSpecs[parcel.itemSize].weight,
            volume: sizeSpecs[parcel.itemSize].volume
        };
    }));

    // Filter and group valid parcels
    const validParcels = processedParcels.filter(p => p !== null);
    const destinationGroups = validParcels.reduce((groups, parcel) => {
        const key = parcel.destDistrict;
        if (!groups[key]) {
            groups[key] = { parcels: [], totalWeight: 0, totalVolume: 0 };
        }
        groups[key].parcels.push(parcel._id);
        groups[key].totalWeight += parcel.weight;
        groups[key].totalVolume += parcel.volume;
        return groups;
    }, {});

    // Create optimized routes
    const destinations = Object.keys(destinationGroups);
    const route = optimizeRoute(sourceCenter, destinations);

    // Process shipments with original logic
    let currentShipment = null;
    let shipmentCount = lastShipmentNumber + 1;

    for (const destination of route) {
        const group = destinationGroups[destination];
        if (!group) continue;

        const isFirstLeg = !currentShipment;
        const isFinalLeg = destination === route[route.length - 1];

        // Create new shipment if needed
        if (!currentShipment) {
            currentShipment = createNewShipment(
                deliveryType,
                sourceCenter,
                staffId,
                shipmentCount++
            );
        }

        // Calculate additional time
        const prevCenter = currentShipment.route.slice(-1)[0];
        const travelTime = timeMatrix[prevCenter][destination];
        const additionalTime = isFirstLeg ?
            travelTime + constraints[deliveryType].firstBuffer :
            travelTime + constraints[deliveryType].buffer;

        // Check constraints
        if (!canAddToShipment(currentShipment, group, additionalTime, deliveryType)) {
            await finalizeShipment(currentShipment, deliveryType);
            shipments.push(currentShipment);
            currentShipment = createNewShipment(
                deliveryType,
                sourceCenter,
                staffId,
                shipmentCount++
            );
        }

        // Add to current shipment
        currentShipment.route.push(destination);
        currentShipment.totalDistance += distanceMatrix[prevCenter][destination];
        currentShipment.totalTime += additionalTime;
        currentShipment.parcels.push(...group.parcels);
        currentShipment.parcelCount += group.parcels.length;
        currentShipment.totalWeight += group.totalWeight;
        currentShipment.totalVolume += group.totalVolume;
    }

    if (currentShipment) {
        await finalizeShipment(currentShipment, deliveryType);
        shipments.push(currentShipment);
    }

    return shipments;
}

// Helper functions
function optimizeRoute(source, destinations) {
    let route = [source];
    let remaining = [...destinations];

    while (remaining.length > 0) {
        const last = route[route.length - 1];
        const nearest = remaining.reduce((closest, current) =>
            distanceMatrix[last][current] < distanceMatrix[last][closest] ? current : closest
        );
        route.push(nearest);
        remaining = remaining.filter(d => d !== nearest);
    }
    return route;
}

function createNewShipment(deliveryType, sourceCenter, staffId, sequence) {
    return new B2BShipment({
        shipmentId: `${deliveryType === 'Express' ? 'EX' : 'ST'}-S${sequence.toString().padStart(3, '0')}-${sourceCenter}`,
        deliveryType,
        sourceCenter,
        route: [sourceCenter],
        currentLocation: sourceCenter,
        totalDistance: 0,
        totalTime: 0,
        totalWeight: 0,
        totalVolume: 0,
        parcelCount: 0,
        parcels: [],
        createdByCenter: sourceCenter,
        createdByStaff: staffId,
        status: 'Pending'
    });
}

function canAddToShipment(shipment, group, additionalTime, deliveryType) {
    const cons = constraints[deliveryType];
    return (shipment.totalDistance + distanceMatrix[shipment.route.slice(-1)[0]][group.destDistrict]) <= cons.maxDistance &&
        (shipment.totalTime + additionalTime) <= cons.maxTime &&
        (shipment.totalWeight + group.totalWeight) <= cons.maxWeight &&
        (shipment.totalVolume + group.totalVolume) <= cons.maxVolume;
}

async function finalizeShipment(shipment, deliveryType) {
    shipment.arrivalTimes = calculateArrivalTimes(shipment.route, deliveryType);

    // Save shipment and update parcels
    await shipment.save();
    await Parcel.updateMany(
        { _id: { $in: shipment.parcels } },
        {
            shipmentId: shipment._id,
            status: 'ShipmentAssigned'
        }
    );
}

// Main controller function
exports.processAllShipments = async (deliveryType, sourceCenter, staffId) => {
    try {
        console.log('Processing shipments...');
        const parcels = await Parcel.find({
            shippingMethod: deliveryType,
            status: 'PendingPickup',
            $or: [
                { from: sourceCenter },
                { 'pickupInformation.district': sourceCenter }
            ]
        });

        if (parcels.length === 0) {
            return { success: false, message: 'No parcels available for shipment' };
        }

        const shipments = await processShipments(deliveryType, parcels, sourceCenter, staffId);
        return {
            success: true,
            count: shipments.length,
            shipments: shipments.map(s => s._id)
        };

    } catch (error) {
        console.error('Shipment processing error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};