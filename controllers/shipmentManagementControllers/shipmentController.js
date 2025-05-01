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
const mongoose = require("mongoose");
const Parcel = require("../../models/ParcelModel");
const B2BShipment = require("../../models/B2BShipmentModel");
const Branch = require("../../models/StaffModel");

// District-based distance matrix (km)
const distanceMatrix = {
  Colombo: { Gampaha: 25, Kalutara: 45, Kandy: 120, Galle: 115 },
  Gampaha: { Colombo: 25, Kalutara: 35, Kandy: 110, Galle: 130 },
  Kalutara: { Colombo: 45, Gampaha: 35, Kandy: 90, Galle: 100 },
  Kandy: { Colombo: 120, Gampaha: 110, Kalutara: 90, Galle: 150 },
  Galle: { Colombo: 115, Gampaha: 130, Kalutara: 100, Kandy: 150 },
};

// District-based time matrix (hours)
const timeMatrix = {
  Colombo: { Gampaha: 1, Kalutara: 1.5, Kandy: 3, Galle: 3.5 },
  Gampaha: { Colombo: 1, Kalutara: 1.2, Kandy: 2.8, Galle: 3.2 },
  Kalutara: { Colombo: 1.5, Gampaha: 1.2, Kandy: 2.5, Galle: 2.8 },
  Kandy: { Colombo: 3, Gampaha: 2.8, Kalutara: 2.5, Galle: 3.5 },
  Galle: { Colombo: 3.5, Gampaha: 3.2, Kalutara: 2.8, Kandy: 3.5 },
};

const constraints = {
  Express: {
    maxDistance: 150,
    maxTime: 24,
    maxVolume: 5,
    maxWeight: 1000,
    buffer: 1,
    firstBuffer: 4, // Added firstBuffer for first leg of journey
  },
  Standard: {
    maxDistance: 300,
    maxTime: 72,
    maxVolume: 10,
    maxWeight: 2500,
    buffer: 2,
    firstBuffer: 4, // Added firstBuffer for first leg of journey
  },
};

// Buffer times configuration based on position in route
const bufferTimeConfig = {
  Express: {
    first: 2, // First center has 2 hours buffer
    intermediate: 1, // Centers between first and last have 1 hour buffer
    last: 2, // Last center has 2 hours buffer
  },
  Standard: {
    first: 2, // First center has 2 hours buffer
    intermediate: 2, // Centers between first and last have 2 hours buffer
    last: 2, // Last center has 2 hours buffer
  },
};

// Size-based specifications
const sizeSpecs = {
  small: { weight: 2, volume: 0.2 },
  medium: { weight: 5, volume: 0.5 },
  large: { weight: 10, volume: 1 },
};

// Helper function to get district information
async function getDistrictInfo(parcel) {
  return {
    sourceDistrict: parcel.from,
    destDistrict: parcel.to,
  };
}

/**
 * Calculate arrival times for each center in the route with proper buffer times
 * @param {Array} route - Array of centers in the route
 * @param {String} deliveryType - Express or Standard
 * @returns {Array} - Array of objects containing center and arrival time
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
      time: cumulativeTime,
    });
  }

  // Calculate shipment finish time (add buffer time for the last center)
  const lastBufferTime = bufferTimeConfig[deliveryType].last;
  const shipmentFinishTime = cumulativeTime + lastBufferTime;

  // For logging purposes
  console.log(`Arrival times calculated for route ${route.join(" -> ")}:`);
  arrivalTimes.forEach((at) => console.log(`  ${at.center}: ${at.time}h`));
  console.log(`Shipment finish time: ${shipmentFinishTime}h`);

  return {
    arrivalTimes,
    shipmentFinishTime,
  };
}

async function processShipments(deliveryType, parcels, sourceCenter, staffId) {
  let shipments = [];
  let lastShipmentNumber = 0;

  // Get last shipment number for the source center
  const lastShipment = await B2BShipment.findOne({ sourceCenter })
    .sort({ shipmentId: -1 })
    .select("shipmentId")
    .lean();

  if (lastShipment) {
    const match = lastShipment.shipmentId.match(/-S(\d+)-/);
    if (match) lastShipmentNumber = parseInt(match[1]);
  }

  // Process parcels and group by destination
  const processedParcels = await Promise.all(
    parcels.map(async (parcel) => {
      const { sourceDistrict, destDistrict } = await getDistrictInfo(parcel);
      if (!sourceDistrict || !destDistrict) {
        console.log(`Parcel ${parcel._id} missing district info`);
        return null;
      }

      return {
        ...parcel.toObject(),
        sourceDistrict,
        destDistrict,
        weight: sizeSpecs[parcel.itemSize].weight,
        volume: sizeSpecs[parcel.itemSize].volume,
      };
    }),
  );

  // Filter valid parcels and group by destination
  const validParcels = processedParcels.filter((p) => p !== null);

  // Group parcels by destination, excluding the source center itself
  const destinationGroups = validParcels.reduce((groups, parcel) => {
    // Skip parcels destined for source center
    if (parcel.destDistrict === sourceCenter) return groups;

    const key = parcel.destDistrict;
    if (!groups[key]) {
      groups[key] = { parcels: [], totalWeight: 0, totalVolume: 0 };
    }
    groups[key].parcels.push(parcel._id);
    groups[key].totalWeight += parcel.weight;
    groups[key].totalVolume += parcel.volume;
    return groups;
  }, {});

  console.log(
    "Destination Groups:",
    JSON.stringify(destinationGroups, null, 2),
  );

  // Generate optimized route from source to all destinations
  const destinations = Object.keys(destinationGroups);
  const route = optimizeRoute(sourceCenter, destinations);
  console.log(`Optimized Route: ${route.join(" -> ")}`);

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

    console.log(
      `Processing destination: ${destination} with ${group.parcels.length} parcels`,
    );

    // Create new shipment if none exists
    if (!currentShipment) {
      currentShipment = createNewShipment(
        deliveryType,
        sourceCenter,
        staffId,
        shipmentCount++,
      );
      console.log(`Created new shipment ${currentShipment.shipmentId}`);
    }

    // For a new shipment, we always go from source center to destination
    const prevCenter =
      currentShipment.route.length === 1
        ? sourceCenter
        : currentShipment.route.slice(-1)[0];
    const travelTime = timeMatrix[prevCenter][destination];

    // Apply the firstBuffer (4 hours) for the first leg from source center to first destination
    const isFirstLeg = currentShipment.route.length === 1;
    const bufferTime = isFirstLeg
      ? constraints[deliveryType].firstBuffer
      : constraints[deliveryType].buffer;
    const additionalTime = travelTime + bufferTime;

    console.log(
      `From ${prevCenter} to ${destination}: Travel time ${travelTime}h + Buffer ${bufferTime}h = ${additionalTime}h`,
    );

    // Check if current shipment can accommodate this group
    if (
      !canAddToShipment(
        currentShipment,
        destination,
        group,
        additionalTime,
        deliveryType,
      )
    ) {
      console.log(
        `Shipment constraints exceeded. Finalizing current shipment ${currentShipment.shipmentId}`,
      );
      await finalizeShipment(currentShipment, deliveryType);
      shipments.push(currentShipment);
      console.log(
        `===============================Shipment finished ${currentShipment.shipmentId}==============================`,
      );

      // Create new shipment starting from source center
      currentShipment = createNewShipment(
        deliveryType,
        sourceCenter,
        staffId,
        shipmentCount++,
      );
      console.log(
        `Created new shipment ${currentShipment.shipmentId} for remaining parcels`,
      );

      // Recalculate travel time from source center to destination
      const directTravelTime = timeMatrix[sourceCenter][destination];
      const directAdditionalTime =
        directTravelTime + constraints[deliveryType].firstBuffer;

      // Add destination directly to new shipment (from source center)
      console.log(
        `Adding ${destination} to shipment ${currentShipment.shipmentId}`,
      );
      currentShipment.route.push(destination);
      currentShipment.totalDistance = distanceMatrix[sourceCenter][destination];
      currentShipment.totalTime = directAdditionalTime;
      currentShipment.parcels.push(...group.parcels);
      currentShipment.parcelCount = group.parcels.length;
      currentShipment.totalWeight = group.totalWeight;
      currentShipment.totalVolume = group.totalVolume;

      console.log(
        `Updated shipment: Distance ${currentShipment.totalDistance}km, Time ${currentShipment.totalTime}h, Weight ${currentShipment.totalWeight}kg, Volume ${currentShipment.totalVolume}m³`,
      );
    } else {
      // Add destination to current shipment
      console.log(
        `Adding ${destination} to shipment ${currentShipment.shipmentId}`,
      );
      currentShipment.route.push(destination);
      currentShipment.totalDistance += distanceMatrix[prevCenter][destination];
      currentShipment.totalTime += additionalTime;
      currentShipment.parcels.push(...group.parcels);
      currentShipment.parcelCount += group.parcels.length;
      currentShipment.totalWeight += group.totalWeight;
      currentShipment.totalVolume += group.totalVolume;

      console.log(
        `Updated shipment: Distance ${currentShipment.totalDistance}km, Time ${currentShipment.totalTime}h, Weight ${currentShipment.totalWeight}kg, Volume ${currentShipment.totalVolume}m³`,
      );
    }
  }

  // Finalize the last shipment
  if (currentShipment) {
    console.log(`Finalizing last shipment ${currentShipment.shipmentId}`);
    await finalizeShipment(currentShipment, deliveryType);
    shipments.push(currentShipment);
  }

  return shipments;
}

// Optimize route using nearest neighbor algorithm
function optimizeRoute(source, destinations) {
  let route = [source];
  let remaining = [...destinations];

  while (remaining.length > 0) {
    const last = route[route.length - 1];
    let nearest = remaining[0];
    let shortestDistance = distanceMatrix[last][nearest];

    for (const dest of remaining) {
      const dist = distanceMatrix[last][dest];
      if (dist < shortestDistance) {
        shortestDistance = dist;
        nearest = dest;
      }
    }

    route.push(nearest);
    remaining = remaining.filter((d) => d !== nearest);
  }

  return route;
}

function createNewShipment(deliveryType, sourceCenter, staffId, sequence) {
  const shipmentId = `${deliveryType === "Express" ? "EX" : "ST"}-S${sequence.toString().padStart(3, "0")}-${sourceCenter}`;
  console.log(`Creating new shipment ${shipmentId}`);
  return new B2BShipment({
    shipmentId,
    deliveryType,
    sourceCenter,
    route: [sourceCenter], // Always start with source center
    currentLocation: sourceCenter,
    totalDistance: 0,
    totalTime: 0,
    totalWeight: 0,
    totalVolume: 0,
    parcelCount: 0,
    parcels: [],
    createdByCenter: sourceCenter,
    createdByStaff: staffId,
    status: "Pending",
  });
}

// Check if shipment can accommodate adding this destination's group
function canAddToShipment(
  shipment,
  destination,
  group,
  additionalTime,
  deliveryType,
) {
  const cons = constraints[deliveryType];
  const prevCenter = shipment.route.slice(-1)[0];
  const addedDistance = distanceMatrix[prevCenter][destination];

  const newDistance = shipment.totalDistance + addedDistance;
  const newTime = shipment.totalTime + additionalTime;
  const newWeight = shipment.totalWeight + group.totalWeight;
  const newVolume = shipment.totalVolume + group.totalVolume;

  console.log(
    `Checking constraints for ${destination}: Distance ${newDistance}/${cons.maxDistance}km, Time ${newTime}/${cons.maxTime}h, Weight ${newWeight}/${cons.maxWeight}kg, Volume ${newVolume}/${cons.maxVolume}m³`,
  );

  // Fixed the volume constraint check
  return (
    newDistance <= cons.maxDistance &&
    newTime <= cons.maxTime &&
    newWeight <= cons.maxWeight &&
    newVolume <= cons.maxVolume
  );
}

// Finalize shipment details and save
async function finalizeShipment(shipment, deliveryType) {
  // Use the new arrival times calculation method
  const { arrivalTimes, shipmentFinishTime } = calculateArrivalTimes(
    shipment.route,
    deliveryType,
  );

  // Update shipment with calculated arrival times and shipment finish time
  shipment.arrivalTimes = arrivalTimes;
  shipment.shipmentFinishTime = shipmentFinishTime;

  console.log(
    `Finalizing shipment ${shipment.shipmentId} with route ${shipment.route.join(" -> ")}`,
  );
  console.log(`Shipment finish time: ${shipmentFinishTime}h`);

  // Uncomment to save to database
  await shipment.save();
  await Parcel.updateMany(
    { _id: { $in: shipment.parcels } },
    { shipmentId: shipment._id, status: "ShipmentAssigned" },
  );
}

// Main controller function
exports.processAllShipments = async (deliveryType, sourceCenter, staffId) => {
  try {
    console.log(
      `Starting shipment processing for ${deliveryType} shipments from ${sourceCenter}`,
    );

    const parcels = await Parcel.find({
      shipmentId: null,
      shippingMethod: deliveryType,
      from: sourceCenter,
    });

    if (parcels.length === 0) {
      console.log("No parcels found for processing");
      return { success: false, message: "No parcels available for shipment" };
    }

    console.log(`Found ${parcels.length} parcels to process`);
    const shipments = await processShipments(
      deliveryType,
      parcels,
      sourceCenter,
      staffId,
    );

    console.log("Shipments", shipments);

    return {
      success: true,
      count: shipments.length,
      shipments: shipments,
    };
  } catch (error) {
    console.error("Shipment processing error:", error);
    return { success: false, error: error.message };
  }
};

//http://localhost:8000/shipments/process/Express/Colombo
