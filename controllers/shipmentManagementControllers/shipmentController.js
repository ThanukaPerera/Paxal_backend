


//http://localhost:8000/shipments/process/Express/67c41df8c2ca1289195def43


const Parcel = require('../../models/parcelModel');
const B2BShipment = require('../../models/B2BShipmentModel');
const Branch = require('../../models/BranchesModel');
const mongoose = require('mongoose');


async function buildMatrices() {
    const branches = await Branch.find().lean();

   
    const branchMap = {};
    const idToLocationMap = {};
    const locationToIdMap = {};

    branches.forEach(branch => {
        const id = branch._id.toString();
        branchMap[id] = branch;
        idToLocationMap[id] = branch.location;
        locationToIdMap[branch.location] = id;
    });


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

const constraints = {
    express: {
        maxDistance: 150,
        maxTime: 24,
        maxVolume: 5,
        maxWeight: 1000,
        buffer: 1,
        firstBuffer: 4
    },
    standard: {
        maxDistance: 300,
        maxTime: 72,
        maxVolume: 10,
        maxWeight: 2500,
        buffer: 2,
        firstBuffer: 4
    }
};


const bufferTimeConfig = {
    express: {
        first: 2,
        intermediate: 1,
        last: 2
    },
    standard: {
        first: 2,
        intermediate: 2,
        last: 2
    }
};


const sizeSpecs = {
    small: { weight: 2, volume: 0.2 },
    medium: { weight: 5, volume: 0.5 },
    large: { weight: 10, volume: 1 }
};



function calculateArrivalTimes(route, deliveryType, timeMatrix) {
    const arrivalTimes = [];
    let cumulativeTime = 0;

  
    arrivalTimes.push({ center: route[0], time: 0 });

   
    for (let i = 1; i < route.length; i++) {
        const previousCenter = route[i - 1];
        const currentCenter = route[i];

        let bufferTime;
        if (i === 1) {
        
            bufferTime = bufferTimeConfig[deliveryType].first;
        } else {
           
            bufferTime = bufferTimeConfig[deliveryType].intermediate;
        }

 
        cumulativeTime += bufferTime;

  
        const travelTime = timeMatrix[previousCenter][currentCenter];
        cumulativeTime += travelTime;

      
        arrivalTimes.push({
            center: currentCenter,
            time: cumulativeTime
        });
    }

    const lastBufferTime = bufferTimeConfig[deliveryType].last;
    const shipmentFinishTime = cumulativeTime + lastBufferTime;

    return {
        arrivalTimes,
        shipmentFinishTime
    };
}


async function processShipments(deliveryType, parcels, sourceCenterId, staffId, matrices) {
    console.log(`Processing ${deliveryType} shipments from ${sourceCenterId}`);
    const { distanceMatrix, timeMatrix, branchMap, idToLocationMap } = matrices;
    const sourceCenterIdStr = sourceCenterId.toString();

    let shipments = [];
    let lastShipmentNumber = 0;

    const lastShipment = await B2BShipment.findOne({ sourceCenter: sourceCenterId })
        .sort({ shipmentId: -1 })
        .select('shipmentId')
        .lean();

    if (lastShipment) {
        const match = lastShipment.shipmentId.match(/-S(\d+)-/);
        if (match) lastShipmentNumber = parseInt(match[1]);
    }
    //console.log(parcels);
    const processedParcels = parcels.map(parcel => {
        // Validate that parcel has required fields
        if (!parcel.from) {
            console.warn(`Parcel ${parcel._id} has no 'from' field`);   
            return null;
        }

        if (!parcel.to) {
            console.warn(`Parcel ${parcel._id} has no 'to' field`);
            return null;
        }

        let toId;
        if (parcel.to._id) {
            toId = parcel.to._id.toString();
        } else if (typeof parcel.to === 'object' && parcel.to !== null) {
            toId = parcel.to.toString();
        } else {
            console.warn(`Parcel ${parcel._id} has invalid 'to' field:`, parcel.to);
            return null;
        }
        if (!parcel.itemSize || !sizeSpecs[parcel.itemSize]) {
            console.warn(`Parcel ${parcel._id} has invalid itemSize:`, parcel.itemSize);
            return null;
        }

        return {
            ...parcel.toObject(),
            fromId: parcel.from.toString(),
            toId: toId,
            weight: sizeSpecs[parcel.itemSize].weight,
            volume: sizeSpecs[parcel.itemSize].volume
        };
    }).filter(parcel => parcel !== null);

 
    if (processedParcels.length === 0) {
        console.log("No valid parcels to process after filtering");
        return shipments;
    }

    console.log(`Successfully processed ${processedParcels.length} out of ${parcels.length} parcels`);

    const destinationGroups = {};
    for (const parcel of processedParcels) {
        if (parcel.toId === sourceCenterIdStr) continue;

        const destId = parcel.toId;
        if (!destinationGroups[destId]) {
            destinationGroups[destId] = { parcels: [], totalWeight: 0, totalVolume: 0 };
        }
        destinationGroups[destId].parcels.push(parcel._id);
        destinationGroups[destId].totalWeight += parcel.weight;
        destinationGroups[destId].totalVolume += parcel.volume;
    }
    const destinations = Object.keys(destinationGroups);
    if (destinations.length === 0) {
        console.log("No valid destinations found");
        return shipments;
    }

    const route = optimizeRoute(sourceCenterIdStr, destinations, distanceMatrix);
    console.log("Optimized route:", route);

    let currentShipment = null;
    let shipmentCount = lastShipmentNumber + 1;

    for (let i = 1; i < route.length; i++) {
        const destination = route[i];
        const group = destinationGroups[destination];

        if (!group) {
            console.log(`No parcels for destination: ${destination}`);
            continue;
        }
        if (!currentShipment) {
            currentShipment = createNewShipment(deliveryType, sourceCenterId, staffId, shipmentCount++, idToLocationMap);
        }

        const prevCenter = currentShipment.route.length === 1 ?
            sourceCenterIdStr :
            currentShipment.route[currentShipment.route.length - 1].toString();

        if (!timeMatrix[prevCenter] || !timeMatrix[prevCenter][destination]) {
            console.log(`Missing time matrix data for route ${prevCenter} -> ${destination}`);
            continue;
        }

        const travelTime = timeMatrix[prevCenter][destination];

        const isFirstLeg = currentShipment.route.length === 1;
        const bufferTime = isFirstLeg ? constraints[deliveryType].firstBuffer : constraints[deliveryType].buffer;
        const additionalTime = travelTime + bufferTime;

        if (!canAddToShipment(currentShipment, destination, group, additionalTime, deliveryType, prevCenter, distanceMatrix)) {
            await finalizeShipment(currentShipment, deliveryType, timeMatrix);
            shipments.push(currentShipment);
            currentShipment = createNewShipment(deliveryType, sourceCenterId, staffId, shipmentCount++, idToLocationMap);
            const directTravelTime = timeMatrix[sourceCenterIdStr][destination];
            const directAdditionalTime = directTravelTime + constraints[deliveryType].firstBuffer;
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
    if (currentShipment) {
        await finalizeShipment(currentShipment, deliveryType, timeMatrix);
        shipments.push(currentShipment);
    }

    return shipments;
}

function optimizeRoute(source, destinations, distanceMatrix) {
    let route = [source];
    let remaining = [...destinations];

    while (remaining.length > 0) {
        const last = route[route.length - 1];

        if (!distanceMatrix[last]) {
            console.log(`No distance data for ${last}, skipping route optimization`);
            return [source]; 
        }

        let nearest = null;
        let shortestDistance = Infinity;

        for (const dest of remaining) {
            if (distanceMatrix[last][dest] !== undefined) {
                const dist = distanceMatrix[last][dest];
                if (dist < shortestDistance) {
                    shortestDistance = dist;
                    nearest = dest;
                }
            }
        }

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
    const shipmentId = `${deliveryType === 'express' ? 'EX' : 'ST'}-S${sequence.toString().padStart(3, '0')}-${sourceLocation}`;

    return new B2BShipment({
        shipmentId,
        deliveryType,
        sourceCenter: sourceCenterId,
        route: [sourceCenterId], 
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

function canAddToShipment(shipment, destination, group, additionalTime, deliveryType, prevCenter, distanceMatrix) {
    const cons = constraints[deliveryType];


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


async function finalizeShipment(shipment, deliveryType, timeMatrix) {
    try {
  
        const routeIds = shipment.route.map(id => id.toString());

        const { arrivalTimes, shipmentFinishTime } = calculateArrivalTimes(routeIds, deliveryType, timeMatrix);

        // Convert arrival times back to ObjectIds
        shipment.arrivalTimes = arrivalTimes.map(at => ({
            center: new mongoose.Types.ObjectId(at.center), 
            time: at.time
        }));

        shipment.shipmentFinishTime = shipmentFinishTime;

  
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
exports.processAllShipments = async (deliveryType, sourceCenterId, parcelIds) => {
    try {

        console.log(`Processing ${deliveryType} shipments for source center: ${sourceCenterId}`);
       // console.log(`Parcel IDs: ${parcelIds}`);
        
       
        //Convert parcel IDs to ObjectIds
        const parcelObjectIds = parcelIds.map(id => 
            typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id
        );

        //First, build the matrices with ObjectIds
        const matrices = await buildMatrices();

        // Verify source center exists
        const sourceBranch = await Branch.findById(sourceCenterId).lean();  
        if (!sourceBranch) {
            return { success: false, message: 'Invalid source center ID' };
        }

        // Fetch only the specific parcels that match the IDs provided
        // Fetch parcels by their IDs without additional filtering
        const parcels = await Parcel.find({
             _id: { $in: parcelObjectIds },
            from: sourceCenterId,
            shipmentId: null // Ensure these parcels are not already assigned to a shipment
        }).populate('to').populate('from');

        // Validate shipping method compatibility
        if (parcels.length > 0) {
            const incompatibleParcels = parcels.filter(parcel => 
                parcel.shippingMethod?.toLowerCase() !== deliveryType.toLowerCase()
            );

            if (incompatibleParcels.length > 0) {
                const incompatibleCount = incompatibleParcels.length;
                const sampleParcel = incompatibleParcels[0];
                return { 
                    success: false, 
                    message: `Cannot create ${deliveryType} shipment! ${incompatibleCount} selected parcel(s) have "${sampleParcel.shippingMethod}" shipping method. All parcels must have "${deliveryType}" shipping method.`
                };
            }
        }
 
      //  console.log(`Requested parcels: ${parcelObjectIds.length}, Found parcels: ${parcels.length}`);

        // Check if all requested parcels were found
        if (parcels.length === 0) {
            return { success: false, message: 'No matching parcels available for shipment' };
        }

        if (parcels.length !== parcelIds.length) {
            console.log(`Warning: Only ${parcels.length} of ${parcelIds.length} requested parcels were found`);
        }

        console.log(`Found ${parcels.length} parcels for processing`);
        //console.log(parcels);

        // Get the staff ID from one of the parcels or set a default
        const staffId = parcels[0].registeredBy || new mongoose.Types.ObjectId();

        // Process the shipments using ObjectIds
        const shipments = await processShipments(deliveryType, parcels, sourceCenterId, staffId, matrices);

        return {
            success: true,
            count: shipments.length,
            processedParcels: parcels.length,
            shipments: shipments
        };

    } catch (error) {
        console.error('Shipment processing error:', error);
        return { success: false, error: error.message };
    }
};