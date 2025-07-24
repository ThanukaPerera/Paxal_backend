


//http://localhost:8000/vehicles/assignVehicleToShipment/68136ad65f32baa9ccd2e923/express

const Vehicle = require("../../models/vehicleModel");
const B2BShipment = require("../../models/B2BShipmentModel");
const Parcel = require('../../models/parcelModel');
const Branch = require('../../models/BranchesModel');

/**
 * PHASE 4 - Find additional parcels from other centers that can be added to the shipment
 * @param {ObjectId} vehicleCurrentBranch - Current location of the assigned vehicle
 * @param {Array} shipmentRoute - Route of the main shipment
 * @param {String} deliveryType - Express or Standard
 * @param {Number} remainingWeight - Remaining weight capacity of vehicle
 * @param {Number} remainingVolume - Remaining volume capacity of vehicle
 * @returns {Object} Grouped parcels by destination center
 */
async function findAdditionalParcels(vehicleCurrentBranch, shipmentRoute, deliveryType, remainingWeight, remainingVolume) {
    try {
        // Find all unassigned parcels at the vehicle's current location with same shipping method
        const unassignedParcels = await Parcel.find({
            shipmentId: null, // Unassigned parcels
            from: vehicleCurrentBranch,  // Changed from currentLocation to from
            shippingMethod: { $regex: new RegExp(`^${deliveryType}$`, 'i') }, // Case-insensitive matching
            status: { $in: ['ArrivedAtCollectionCenter', 'OrderPlaced', 'PendingPickup', 'PickedUp'] } // Added PendingPickup
        }).populate('to', 'location branchId')     // Changed from receiverLocation to to
          .populate('from', 'location branchId');  // Changed from senderLocation and currentLocation to from

        if (unassignedParcels.length === 0) {
            return {
                success: true,
                availableParcels: [],
                groupedByDestination: {},
                totalAvailable: 0,
                message: 'No additional parcels available at vehicle current location'
            };
        }

        // Group parcels by destination center (to field)
        const groupedByDestination = {};
        let totalAvailableWeight = 0;
        let totalAvailableVolume = 0;

        unassignedParcels.forEach(parcel => {
            const destinationId = parcel.to._id.toString(); // Changed from receiverLocation to to
            const destinationName = parcel.to.location;

            if (!groupedByDestination[destinationId]) {
                groupedByDestination[destinationId] = {
                    destinationId,
                    destinationName,
                    branchId: parcel.to.branchId, // Changed from branchName to branchId
                    parcels: [],
                    totalWeight: 0,
                    totalVolume: 0,
                    parcelCount: 0,
                    canAddAll: true,
                    isOnRoute: shipmentRoute.some(routeCenter => routeCenter._id.toString() === destinationId)
                };
            }

            // Calculate weight and volume from itemSize since parcel model doesn't have direct weight/volume
            const sizeSpecs = {
                small: { weight: 2, volume: 0.2 },
                medium: { weight: 5, volume: 0.5 },
                large: { weight: 10, volume: 1 }
            };
            const itemSize = parcel.itemSize?.toLowerCase() || 'medium';
            const sizeSpec = sizeSpecs[itemSize] || sizeSpecs.medium;

            groupedByDestination[destinationId].parcels.push({
                parcelId: parcel.parcelId,     // Changed from _id to parcelId
                trackingId: parcel.trackingNo, // Changed to trackingNo
                weight: sizeSpec.weight,       // Using calculated weight
                volume: sizeSpec.volume,       // Using calculated volume
                itemSize: parcel.itemSize,
                itemType: parcel.itemType,
                status: parcel.status,
                createdAt: parcel.createdAt
            });

            groupedByDestination[destinationId].totalWeight += sizeSpec.weight;
            groupedByDestination[destinationId].totalVolume += sizeSpec.volume;
            groupedByDestination[destinationId].parcelCount += 1;

            totalAvailableWeight += sizeSpec.weight;
            totalAvailableVolume += sizeSpec.volume;
        });

        // Check constraints for each destination group
        Object.values(groupedByDestination).forEach(group => {
            group.canAddAll = (group.totalWeight <= remainingWeight && group.totalVolume <= remainingVolume);
            
            // If can't add all, calculate maximum parcels that can be added
            if (!group.canAddAll) {
                let runningWeight = 0;
                let runningVolume = 0;
                let maxParcels = 0;

                for (const parcel of group.parcels) {
                    if (runningWeight + parcel.weight <= remainingWeight && 
                        runningVolume + parcel.volume <= remainingVolume) {
                        runningWeight += parcel.weight;
                        runningVolume += parcel.volume;
                        maxParcels++;
                    } else {
                        break;
                    }
                }

                group.maxPossibleParcels = maxParcels;
                group.maxPossibleWeight = runningWeight;
                group.maxPossibleVolume = runningVolume;
            } else {
                group.maxPossibleParcels = group.parcelCount;
                group.maxPossibleWeight = group.totalWeight;
                group.maxPossibleVolume = group.totalVolume;
            }
        });

        // Sort groups by priority: On-route destinations first, then by parcel count
        const sortedGroups = Object.values(groupedByDestination).sort((a, b) => {
            if (a.isOnRoute && !b.isOnRoute) return -1;
            if (!a.isOnRoute && b.isOnRoute) return 1;
            return b.parcelCount - a.parcelCount;
        });

        return {
            success: true,
            availableParcels: unassignedParcels.length,
            groupedByDestination: groupedByDestination,
            sortedGroups: sortedGroups,
            totalAvailable: unassignedParcels.length,
            totalAvailableWeight,
            totalAvailableVolume,
            constraints: {
                remainingWeight,
                remainingVolume,
                canFitWeight: totalAvailableWeight <= remainingWeight,
                canFitVolume: totalAvailableVolume <= remainingVolume
            }
        };

    } catch (error) {
        console.error('Error finding additional parcels:', error);
        return {
            success: false,
            message: 'Error finding additional parcels',
            error: error.message
        };
    }
}

/**
 * Generate distance and time matrices based on fetched branch data
 * @returns {Object} Object containing distance and time matrices with ObjectIds as keys
 */
async function generateMatrices() {
    try {
        // Fetch all branches
        const branches = await Branch.find().lean();

        // Create mappings between branch ObjectIds and location names
        const branchIdToLocation = {};
        const locationToBranchId = {};

        branches.forEach(branch => {
            branchIdToLocation[branch._id.toString()] = branch.location;
            locationToBranchId[branch.location] = branch._id.toString();
        });

        // Static distance matrix (km) from the original code
        const distanceByLocation = {
            'Colombo': { 'Gampaha': 25, 'Kalutara': 45, 'Kandy': 120, 'Galle': 115 },
            'Gampaha': { 'Colombo': 25, 'Kalutara': 35, 'Kandy': 110, 'Galle': 130 },
            'Kalutara': { 'Colombo': 45, 'Gampaha': 35, 'Kandy': 90, 'Galle': 100 },
            'Kandy': { 'Colombo': 120, 'Gampaha': 110, 'Kalutara': 90, 'Galle': 150 },
            'Galle': { 'Colombo': 115, 'Gampaha': 130, 'Kalutara': 100, 'Kandy': 150 }
        };

        // Static time matrix (hours) from the original code
        const timeByLocation = {
            'Colombo': { 'Gampaha': 1, 'Kalutara': 1.5, 'Kandy': 3, 'Galle': 3.5 },
            'Gampaha': { 'Colombo': 1, 'Kalutara': 1.2, 'Kandy': 2.8, 'Galle': 3.2 },
            'Kalutara': { 'Colombo': 1.5, 'Gampaha': 1.2, 'Kandy': 2.5, 'Galle': 2.8 },
            'Kandy': { 'Colombo': 3, 'Gampaha': 2.8, 'Kalutara': 2.5, 'Galle': 3.5 },
            'Galle': { 'Colombo': 3.5, 'Gampaha': 3.2, 'Kalutara': 2.8, 'Kandy': 3.5 }
        };

        // Create new matrices that use ObjectIds as keys
        const distanceMatrix = {};
        const timeMatrix = {};

        // Build the new matrices
        Object.keys(distanceByLocation).forEach(fromLocation => {
            const fromId = locationToBranchId[fromLocation];
            if (fromId) {
                distanceMatrix[fromId] = {};
                timeMatrix[fromId] = {};

                Object.keys(distanceByLocation[fromLocation]).forEach(toLocation => {
                    const toId = locationToBranchId[toLocation];
                    if (toId) {
                        distanceMatrix[fromId][toId] = distanceByLocation[fromLocation][toLocation];
                        timeMatrix[fromId][toId] = timeByLocation[fromLocation][toLocation];
                    }
                });
            }
        });

        return {
            distanceMatrix,
            timeMatrix,
            branchIdToLocation,
            locationToBranchId
        };
    } catch (error) {
        console.error("Error generating matrices:", error);
        throw error;
    }
}

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
 * @param {Array} route - Array of center ObjectIds in the route
 * @param {String} deliveryType - Express or Standard
 * @param {Object} timeMatrix - Travel time matrix with ObjectIds as keys
 * @returns {Object} - Object containing arrival times array and shipment finish time
 */
function calculateArrivalTimes(route, deliveryType, timeMatrix) {
    const arrivalTimes = [];
    let cumulativeTime = 0;

    // Get buffer time configuration using B2BShipment static method
    const bufferTimeConfig = B2BShipment.getBufferTimeConfig();
    const normalizedDeliveryType = B2BShipment.normalizeDeliveryType(deliveryType);
    const config = bufferTimeConfig[normalizedDeliveryType];

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
            bufferTime = config.first;
        } else if (i === route.length - 1) {
            // Last center in the route
            bufferTime = config.last;
        } else {
            // Intermediate center in the route
            bufferTime = config.intermediate;
        }

        // Add buffer time for previous center
        cumulativeTime += bufferTime;

        // Add travel time from previous to current center
        const travelTime = timeMatrix[previousCenter.toString()][currentCenter.toString()];
        cumulativeTime += travelTime;

        // Add arrival time for current center
        arrivalTimes.push({
            center: currentCenter,
            time: cumulativeTime
        });
    }

    // Calculate shipment finish time (add buffer time for the last center)
    const lastBufferTime = config.last;
    const shipmentFinishTime = cumulativeTime + lastBufferTime;

    // For logging purposes
    console.log(`Arrival times calculated for route (${normalizedDeliveryType}):`);
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
 * @param {ObjectId} sourceCenterId - The center ObjectId where shipment originates
 * @param {Number} weightRequired - Required weight capacity
 * @param {Number} volumeRequired - Required volume capacity
 * @param {Object} matrices - Contains distanceMatrix and helper mappings
 * @returns {Object|false} - The nearest vehicle or false if none found
 */
async function findNearestVehicle(sourceCenterId, weightRequired, volumeRequired, matrices) {
    try {
        const { distanceMatrix, branchIdToLocation } = matrices;
        const sourceLocation = branchIdToLocation[sourceCenterId.toString()];

        console.log(`Finding nearest vehicle for source center ID: ${sourceCenterId} (${sourceLocation}), required weight: ${weightRequired}kg, volume: ${volumeRequired}m³`);

        // STEP 1: Find vehicle that belongs to and is currently at the source center
        console.log("STEP 1: Searching for vehicles belonging to and currently at source center");
        const localVehicle = await Vehicle.findOne({
            assignedBranch: sourceCenterId,
            currentBranch: sourceCenterId,
            vehicleType: "shipment",
            available: true,
            $or: [
                { currentShipment: { $exists: false } },
                { currentShipment: null }
            ],
            capableWeight: { $gte: weightRequired },
            capableVolume: { $gte: volumeRequired }
        });

        if (localVehicle) {
            console.log(`✓ Found local vehicle at ${sourceLocation}: ${localVehicle.vehicleId}`);
            return localVehicle;
        }
        console.log(`✗ No suitable local vehicle found at ${sourceLocation}`);

        // STEP 2: Find vehicle that belongs to source center but is currently at another center
        console.log("STEP 2: Searching for vehicles belonging to source center but located elsewhere");

        // Get all branches except the source
        const allBranches = await Branch.find({ _id: { $ne: sourceCenterId } });

        // Sort branches by their distance from source center
        const sortedBranches = allBranches
            .filter(branch => {
                const fromId = sourceCenterId.toString();
                const toId = branch._id.toString();
                return distanceMatrix[fromId] && distanceMatrix[fromId][toId];
            })
            .sort((a, b) => {
                const fromId = sourceCenterId.toString();
                const toIdA = a._id.toString();
                const toIdB = b._id.toString();
                return distanceMatrix[fromId][toIdA] - distanceMatrix[fromId][toIdB];
            });

        // Check up to 3 nearest branches for vehicles that belong to source center
        const nearestBranches = sortedBranches.slice(0, 3);
        console.log(`Checking ${nearestBranches.length} nearest branches for source-owned vehicles`);

        for (const branch of nearestBranches) {
            const branchLocation = branchIdToLocation[branch._id.toString()];
            console.log(`Checking branch ${branchLocation} for vehicles belonging to ${sourceLocation}`);

            const vehicle = await Vehicle.findOne({
                assignedBranch: sourceCenterId, // Belongs to source center
                currentBranch: branch._id,       // But currently at another branch
                vehicleType: "shipment",
                available: true,
                $or: [
                    { currentShipment: { $exists: false } },
                    { currentShipment: null }
                ],
                capableWeight: { $gte: weightRequired },
                capableVolume: { $gte: volumeRequired }
            });

            if (vehicle) {
                console.log(`✓ Found source-owned vehicle at ${branchLocation}: ${vehicle.vehicleId}`);
                return vehicle;
            }
        }
        console.log(`✗ No suitable source-owned vehicles found in nearby centers`);

        // STEP 3: Find vehicle from nearest center (belongs to and currently at that center)
        console.log("STEP 3: Searching for vehicles that belong to and are currently at nearest centers");

        for (const branch of nearestBranches) {
            const branchLocation = branchIdToLocation[branch._id.toString()];
            console.log(`Checking branch ${branchLocation} for local vehicles`);

            const vehicle = await Vehicle.findOne({
                assignedBranch: branch._id,      // Belongs to this branch
                currentBranch: branch._id,      // And currently at this branch
                vehicleType: "shipment",
                available: true,
                $or: [
                    { currentShipment: { $exists: false } },
                    { currentShipment: null }
                ],
                capableWeight: { $gte: weightRequired },
                capableVolume: { $gte: volumeRequired }
            });

            if (vehicle) {
                console.log(`✓ Found vehicle at ${branchLocation}: ${vehicle.vehicleId}`);
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

        // Generate matrices needed for calculations
        const matrices = await generateMatrices();
        const { branchIdToLocation } = matrices;

        // Find the shipment by ID
        const shipment = await B2BShipment.findById(shipmentId).populate('sourceCenter');

        if (!shipment) {
            console.error(`Shipment not found with ID: ${shipmentId}`);
            throw new Error("Shipment not found");
        }

        // Check if vehicle is already assigned to prevent double assignment
        if (shipment.assignedVehicle) {
            console.log(`Vehicle already assigned to shipment ${shipmentId}: ${shipment.assignedVehicle}`);
            return {
                success: false,
                message: "Vehicle already assigned to this shipment"
            };
        }

        // Verify the shipment type matches
        if (shipment.deliveryType !== shipmentType) {
            console.error(`Shipment type mismatch. Expected: ${shipmentType}, Found: ${shipment.deliveryType}`);
            throw new Error("Shipment type mismatch");
        }

        // Get the source center and requirements
        const sourceCenterId = shipment.sourceCenter._id;
        const sourceLocation = branchIdToLocation[sourceCenterId.toString()];
        const weightRequired = shipment.totalWeight;
        const volumeRequired = shipment.totalVolume;

        console.log(`Requirements: sourceCenter=${sourceLocation} (${sourceCenterId}), weight=${weightRequired}kg, volume=${volumeRequired}m³`);

        // Find the nearest available vehicle
        const vehicle = await findNearestVehicle(sourceCenterId, weightRequired, volumeRequired, matrices);

        if (!vehicle) {
            console.log("No suitable vehicle found for assignment");
            return {
                success: false,
                message: "No suitable vehicle available for this shipment"
            };
        }

        // Get the branch information for the vehicle's current location
        const vehicleBranch = await Branch.findById(vehicle.currentBranch);
        const vehicleBranchId = vehicleBranch._id;
        const vehicleLocation = branchIdToLocation[vehicleBranchId.toString()];

        // Update the shipment with vehicle assignment
        shipment.assignedVehicle = vehicle._id;
        // Assign driver if vehicle has one
        if (vehicle.assignedDriver) {
            shipment.assignedDriver = vehicle.assignedDriver;
        }

        // Update status based on shipment type and vehicle location
        if (vehicleBranchId.equals(sourceCenterId)) {
            // If vehicle is at the source center, update status based on delivery type
            shipment.status = shipmentType.toLowerCase() === "express" ? "Verified" : "In Transit";
            shipment.isVehicleTransport = false;
            
            // Update parcels to 'ShipmentAssigned' status when shipment goes to 'In Transit'
            if (shipment.status === "In Transit") {
                await Parcel.updateMany(
                    { _id: { $in: shipment.parcels } },
                    { 
                        $set: { 
                            status: 'ShipmentAssigned',
                            updatedAt: new Date()
                        }
                    }
                );
                console.log(`Updated ${shipment.parcels.length} parcels to ShipmentAssigned status for shipment ${shipment._id}`);
            }
            
            // Update the vehicle status
            vehicle.available = false;
            await vehicle.save();
            console.log(`Vehicle ${vehicle.vehicleId} marked as unavailable`);
        } else {
            // If vehicle is coming from another center, status is pending until it arrives
            shipment.status = "Pending";

            // Create a vehicle transport shipment and embed details in original shipment
            console.log(`Creating vehicle transport: ${vehicle.vehicleId} from ${vehicleLocation} to ${sourceLocation}`);
            const transportDetails = await createVehicleTransport(vehicle, vehicleBranchId, sourceCenterId, shipmentType, matrices, shipment._id);
            
            if (transportDetails) {
                // Set vehicle transport details
                shipment.vehicleTransport = {
                    isRequired: true,
                    fromCenter: vehicleBranchId,
                    transportShipment: transportDetails
                };

                // Set reverse shipment details for UI display
                shipment.reverseShipmentDetails = {
                    transportShipmentId: transportDetails.shipmentId,
                    vehicleFromCenter: branchIdToLocation[vehicleBranchId.toString()],
                    vehicleToCenter: branchIdToLocation[sourceCenterId.toString()],
                    parcelsCarried: transportDetails.parcelsCarried,
                    parcelCount: transportDetails.parcelsCarried.length,
                    totalWeight: transportDetails.totalWeight,
                    totalVolume: transportDetails.totalVolume,
                    status: 'InTransit',
                    createdAt: new Date()
                };
                
                console.log(`Vehicle transport details embedded in original shipment ${shipment.shipmentId}`);
            } else {
                console.error(`Failed to create vehicle transport for ${vehicle.vehicleId}`);
                // If transport creation fails, don't assign the vehicle
                return {
                    success: false,
                    message: "Failed to create vehicle transport shipment"
                };
            }
        }

        await shipment.save();
        console.log(`Shipment ${shipmentId} updated with vehicle ${vehicle.vehicleId}`);

        return {
            success: true,
            message: vehicleBranchId.equals(sourceCenterId) ?
                `Vehicle ${vehicle.vehicleId} assigned to shipment at source location` :
                `Vehicle ${vehicle.vehicleId} assigned - transport required from ${vehicleLocation} to ${sourceLocation}`,
            vehicle: {
                _id: vehicle._id,
                vehicleId: vehicle.vehicleId,
                vehicleType: vehicle.vehicleType,
                capableWeight: vehicle.capableWeight,
                capableVolume: vehicle.capableVolume,
                assignedBranch: vehicle.assignedBranch,
                currentBranch: vehicle.currentBranch,
                available: vehicle.available,
                currentLocation: vehicleLocation,
                sourceLocation: sourceLocation,
                isAtSource: vehicleBranchId.equals(sourceCenterId)
            },
            shipmentDetails: {
                shipmentId: shipment.shipmentId,
                deliveryType: shipment.deliveryType,
                sourceCenter: shipment.sourceCenter,
                totalWeight: shipment.totalWeight,
                totalVolume: shipment.totalVolume,
                status: shipment.status,
                assignedVehicle: vehicle._id,
                assignedDriver: shipment.assignedDriver || null,
                isVehicleTransport: shipment.isVehicleTransport,
                requiresReverseShipment: !vehicleBranchId.equals(sourceCenterId)
            }
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
 * Create a vehicle transport shipment to bring a vehicle from one center to another
 * Also finds and includes parcels that need to be shipped along the same route
 * 
 * @param {Object} vehicle - The vehicle object
 * @param {ObjectId} fromCenterId - The center ObjectId where the vehicle is currently located
 * @param {ObjectId} toCenterId - The destination center ObjectId where the vehicle needs to go
 * @param {String} shipmentType - Type of the shipment (Express or Standard)
 * @param {Object} matrices - Contains distance and time matrices with ObjectIds as keys
 * @returns {Object} - Transport shipment details to embed in original shipment
 */
async function createVehicleTransport(vehicle, fromCenterId, toCenterId, shipmentType, matrices, originalShipmentId = null) {
    try {
        const { distanceMatrix, timeMatrix, branchIdToLocation } = matrices;
        const fromLocation = branchIdToLocation[fromCenterId.toString()];
        const toLocation = branchIdToLocation[toCenterId.toString()];

        console.log(`Creating vehicle transport for vehicle ${vehicle.vehicleId} from ${fromLocation} (${fromCenterId}) to ${toLocation} (${toCenterId})`);

        // Size specifications for parcels
        const sizeSpecs = {
            small: { weight: 2, volume: 0.2 },
            medium: { weight: 5, volume: 0.5 },
            large: { weight: 10, volume: 1 }
        };

        // Find parcels that need to be shipped from fromCenter to toCenter
        const pendingParcels = await Parcel.find({
            shippingMethod: { $regex: new RegExp(`^${shipmentType}$`, 'i') },
            from: fromCenterId,
            to: toCenterId,
            shipmentId: null
        }).sort({ createdAt: 1 }); // Process oldest parcels first (FIFO)

        console.log(`Found ${pendingParcels.length} pending parcels from ${fromLocation} to ${toLocation}`);

        // Generate a unique transport shipment ID
        const lastShipment = await B2BShipment.findOne({ sourceCenter: fromCenterId })
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

        const transportShipmentId = `${shipmentType.toLowerCase() === "express" ? "EX" : "ST"}-T${shipmentCount.toString().padStart(3, '0')}-${fromLocation}`;

        // Calculate the route details
        const route = [fromCenterId, toCenterId];
        const totalDistance = distanceMatrix[fromCenterId.toString()][toCenterId.toString()];

        // Calculate arrival times and total time
        const { arrivalTimes, shipmentFinishTime } = calculateArrivalTimes(route, shipmentType, timeMatrix);

        // Initialize shipment metrics
        let totalWeight = 0;
        let totalVolume = 0;
        let selectedParcels = [];

        // Calculate vehicle capacity
        const vehicleMaxWeight = vehicle.capableWeight;
        const vehicleMaxVolume = vehicle.capableVolume;

        // Add parcels to the transport shipment until capacity is reached
        for (const parcel of pendingParcels) {
            const itemSize = parcel.itemSize?.toLowerCase() || 'medium';
            const sizeSpec = sizeSpecs[itemSize] || sizeSpecs.medium;
            const parcelWeight = sizeSpec.weight;
            const parcelVolume = sizeSpec.volume;

            if ((totalWeight + parcelWeight <= vehicleMaxWeight) &&
                (totalVolume + parcelVolume <= vehicleMaxVolume)) {
                
                selectedParcels.push(parcel._id);
                totalWeight += parcelWeight;
                totalVolume += parcelVolume;

                // Update parcel with proper values - now we can update since it's for transport
                parcel.status = 'InTransit';
                parcel.shipmentId = null; // Will be set to transport shipment ObjectId after creation
                
                console.log(`Added parcel ${parcel._id} (${itemSize}) to transport shipment, weight: ${parcelWeight}kg, volume: ${parcelVolume}m³`);
            } else {
                console.log(`Vehicle capacity reached. Skipping remaining parcels.`);
                break;
            }
        }

        // Create the vehicle transport shipment
        const transportShipment = new B2BShipment({
            shipmentId: transportShipmentId,
            deliveryType: shipmentType,
            sourceCenter: fromCenterId,
            route: route,
            currentLocation: fromCenterId,
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
           // createdByCenter: fromCenterId,
            isVehicleTransport: true,
            isReverseShipment: true,  // This is a reverse shipment
            reverseShipmentDetails: {
                originalShipmentId: originalShipmentId,
                transportShipmentId: transportShipmentId,
                vehicleFromCenter: fromLocation,
                vehicleToCenter: toLocation,
                parcelsCarried: selectedParcels,
                parcelCount: selectedParcels.length,
                totalWeight: totalWeight,
                totalVolume: totalVolume,
                status: 'InTransit',
                createdAt: new Date()
            },
            createdAt: new Date()
        });

        await transportShipment.save();

        // Update parcels with the transport shipment ObjectId
        for (const parcel of pendingParcels.slice(0, selectedParcels.length)) {
            parcel.shipmentId = transportShipment._id;
            await parcel.save();
        }

        // Mark vehicle as unavailable and assign to transport shipment
        vehicle.available = false;
        vehicle.currentShipment = transportShipment._id;
        await vehicle.save();
        console.log(`Vehicle ${vehicle.vehicleId} marked as unavailable and assigned to transport shipment`);

        console.log(`Vehicle transport shipment ${transportShipmentId} created with ${selectedParcels.length} parcels, total weight: ${totalWeight}kg, total volume: ${totalVolume}m³`);

        // Return details to embed in original shipment
        return {
            shipmentId: transportShipmentId,
            parcelsCarried: selectedParcels,
            totalWeight: totalWeight,
            totalVolume: totalVolume,
            status: 'InTransit',
            createdAt: new Date()
        };

    } catch (error) {
        console.error("Error creating vehicle transport:", error);
        return null;
    }
}

/**
 * Find available vehicle for a shipment without assigning it
 * @param {String} shipmentId - ID of the shipment
 * @param {String} shipmentType - Type of shipment (Express or Standard)
 * @returns {Object} - Details of the found vehicle for user confirmation
 */
async function findVehicleForShipment(shipmentId, shipmentType) {
    try {
        console.log(`Finding vehicle for shipment ${shipmentId} of type ${shipmentType}`);

        // Generate matrices needed for calculations
        const matrices = await generateMatrices();
        const { branchIdToLocation } = matrices;

        // Find the shipment by ID
        const shipment = await B2BShipment.findById(shipmentId).populate('sourceCenter');

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
        const sourceCenterId = shipment.sourceCenter._id;
        const sourceLocation = branchIdToLocation[sourceCenterId.toString()];
        const weightRequired = shipment.totalWeight;
        const volumeRequired = shipment.totalVolume;

        console.log(`Requirements: sourceCenter=${sourceLocation} (${sourceCenterId}), weight=${weightRequired}kg, volume=${volumeRequired}m³`);

        // Find the nearest available vehicle
        const vehicle = await findNearestVehicle(sourceCenterId, weightRequired, volumeRequired, matrices);

        if (!vehicle) {
            console.log("No suitable vehicle found");
            return {
                success: false,
                message: "No suitable vehicle available for this shipment",
                requirements: {
                    sourceLocation,
                    weightRequired,
                    volumeRequired
                }
            };
        }

        // Get the branch information for the vehicle's current location
        const vehicleBranch = await Branch.findById(vehicle.currentBranch);
        const vehicleBranchId = vehicleBranch._id;
        const vehicleLocation = branchIdToLocation[vehicleBranchId.toString()];

        return {
            success: true,
            vehicle: {
                _id: vehicle._id,
                vehicleId: vehicle.vehicleId,
                vehicleType: vehicle.vehicleType,
                capableWeight: vehicle.capableWeight,
                capableVolume: vehicle.capableVolume,
                assignedBranch: vehicle.assignedBranch,
                currentBranch: vehicle.currentBranch,
                currentLocation: vehicleLocation,
                sourceLocation: sourceLocation,
                isAtSource: vehicleBranchId.equals(sourceCenterId),
                distance: vehicleBranchId.equals(sourceCenterId) ? 0 : matrices.distanceMatrix[sourceCenterId.toString()][vehicleBranchId.toString()],
                estimatedTime: vehicleBranchId.equals(sourceCenterId) ? 0 : matrices.timeMatrix[sourceCenterId.toString()][vehicleBranchId.toString()]
            },
            shipmentDetails: {
                shipmentId: shipment.shipmentId,
                deliveryType: shipment.deliveryType,
                sourceCenter: shipment.sourceCenter,
                totalWeight: shipment.totalWeight,
                totalVolume: shipment.totalVolume,
                requirements: {
                    weightRequired,
                    volumeRequired
                }
            },
            needsTransport: !vehicleBranchId.equals(sourceCenterId),
            message: vehicleBranchId.equals(sourceCenterId) ?
                `Vehicle ${vehicle.vehicleId} found at source location ${sourceLocation}` :
                `Vehicle ${vehicle.vehicleId} found at ${vehicleLocation}, will need transport to ${sourceLocation}`
        };
    } catch (error) {
        console.error("Error finding vehicle:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Find available parcels for a route (excluding the vehicle's current center)
 * @param {ObjectId} vehicleCurrentCenter - Where the vehicle is currently located
 * @param {Array} destinationCenters - Array of centers in the shipment route (excluding vehicle center)
 * @param {String} deliveryType - Express or Standard  
 * @returns {Object} - Grouped parcels by destination with capacity validation
 */
async function findAvailableParcelsForRoute(vehicleCurrentCenter, destinationCenters, deliveryType) {
    try {
        console.log(`Searching parcels from vehicle center ${vehicleCurrentCenter} to destinations: [${destinationCenters.map(d => `\n  new ObjectId('${d}')`).join(',')}${destinationCenters.length > 0 ? '\n' : ''}]`);
        console.log(`Using delivery type: ${deliveryType}, looking for shippingMethod: ${deliveryType} (case-insensitive)`);

        // Convert string IDs to ObjectIds if needed
        const mongoose = require('mongoose');
        const vehicleObjectId = mongoose.Types.ObjectId.isValid(vehicleCurrentCenter) ? 
            (typeof vehicleCurrentCenter === 'string' ? new mongoose.Types.ObjectId(vehicleCurrentCenter) : vehicleCurrentCenter) : vehicleCurrentCenter;
        const destinationObjectIds = destinationCenters.map(d => 
            mongoose.Types.ObjectId.isValid(d) ? 
                (typeof d === 'string' ? new mongoose.Types.ObjectId(d) : d) : d
        );

        // Debug: Show a few parcels from database to understand data structure
        const debugParcels = await Parcel.find({})
            .populate('from', 'location branchId')
            .populate('to', 'location branchId')
            .limit(5);
        
        console.log(`Debug: Found ${debugParcels.length} total parcels at vehicle center (showing first 5):`);
        debugParcels.forEach(p => {
            if (p.from && p.from._id.equals(vehicleObjectId)) {
                console.log(`  Parcel ${p.parcelId}: shippingMethod=${p.shippingMethod}, status=${p.status}, shipmentId=${p.shipmentId}, to=${p.to ? p.to._id : 'null'}`);
            }
        });

        // Find parcels from vehicle center to any destination center
        const availableParcels = await Parcel.find({
            from: vehicleObjectId,
            to: { $in: destinationObjectIds },
            $or: [
                // Parcels that arrived at collection center are available regardless of shipmentId
                { status: 'ArrivedAtCollectionCenter' },
                // Other status parcels must have no shipment assigned
                { 
                    shipmentId: null,
                    status: { $in: ['OrderPlaced', 'PendingPickup', 'PickedUp', 'ArrivedAtDistributionCenter'] }
                }
            ],
            shippingMethod: { $regex: new RegExp(`^${deliveryType}$`, 'i') }
        })
        .populate('to', 'location branchId')
        .populate('from', 'location branchId');

        console.log(`Found ${availableParcels.length} available parcels for route`);

        if (availableParcels.length > 0) {
            console.log(`Available parcels details:`);
            availableParcels.forEach(p => {
                console.log(`  ${p.parcelId}: ${p.from?.location} → ${p.to?.location} (${p.shippingMethod}, ${p.status})`);
            });
        }

        // Group parcels by destination
        const parcelGroups = {};
        const sizeSpecs = {
            small: { weight: 2, volume: 0.2 },
            medium: { weight: 5, volume: 0.5 },
            large: { weight: 10, volume: 1 }
        };

        availableParcels.forEach(parcel => {
            const destinationId = parcel.to._id.toString();
            const destinationName = parcel.to.location;

            if (!parcelGroups[destinationId]) {
                parcelGroups[destinationId] = {
                    destination: destinationName,
                    destinationId: destinationId,
                    parcels: [],
                    totalWeight: 0,
                    totalVolume: 0,
                    parcelCount: 0
                };
            }

            const itemSize = parcel.itemSize?.toLowerCase() || 'medium';
            const sizeSpec = sizeSpecs[itemSize] || sizeSpecs.medium;

            parcelGroups[destinationId].parcels.push({
                _id: parcel._id,
                parcelId: parcel.parcelId,
                trackingNo: parcel.trackingNo,
                itemType: parcel.itemType,
                itemSize: parcel.itemSize,
                weight: sizeSpec.weight,
                volume: sizeSpec.volume,
                status: parcel.status,
                shippingMethod: parcel.shippingMethod,
                from: {
                    _id: parcel.from._id,
                    location: parcel.from.location,
                    branchId: parcel.from.branchId
                },
                to: {
                    _id: parcel.to._id,
                    location: parcel.to.location,
                    branchId: parcel.to.branchId
                }
            });

            parcelGroups[destinationId].totalWeight += sizeSpec.weight;
            parcelGroups[destinationId].totalVolume += sizeSpec.volume;
            parcelGroups[destinationId].parcelCount += 1;
        });

        const groupCount = Object.keys(parcelGroups).length;
        console.log(`Found ${groupCount} parcel group${groupCount !== 1 ? 's' : ''} for route`);

        return {
            success: true,
            parcelGroups,
            totalParcels: availableParcels.length,
            totalGroups: groupCount,
            message: groupCount > 0 ? `Found ${availableParcels.length} parcels across ${groupCount} destination${groupCount !== 1 ? 's' : ''}` : 'No available parcels found for route'
        };

    } catch (error) {
        console.error('Error finding available parcels for route:', error);
        return {
            success: false,
            message: 'Error finding available parcels',
            error: error.message
        };
    }
}

/**
 * Find available parcels for vehicle transport when vehicle comes from another center
 * @param {String|ObjectId} fromCenterId - Center where vehicle is currently located
 * @param {String|ObjectId} toCenterId - Center where vehicle needs to go
 * @param {String} shipmentType - Type of shipment (Express or Standard)
 * @param {Object} vehicle - Vehicle object
 * @returns {Object} - Details of found parcels for user confirmation
 */
async function findParcelsForVehicleTransport(fromCenterId, toCenterId, shipmentType, vehicle) {
    try { 
        // Convert string IDs to ObjectIds if needed
        const mongoose = require('mongoose');
        const fromObjectId = mongoose.Types.ObjectId.isValid(fromCenterId) ? 
            (typeof fromCenterId === 'string' ? new mongoose.Types.ObjectId(fromCenterId) : fromCenterId) : fromCenterId;
        const toObjectId = mongoose.Types.ObjectId.isValid(toCenterId) ? 
            (typeof toCenterId === 'string' ? new mongoose.Types.ObjectId(toCenterId) : toCenterId) : toCenterId;

        const matrices = await generateMatrices();
        const { branchIdToLocation, distanceMatrix } = matrices;
        const fromLocation = branchIdToLocation[fromObjectId.toString()];
        const toLocation = branchIdToLocation[toObjectId.toString()];

        console.log(`Finding parcels for vehicle transport from ${fromLocation} (${fromObjectId}) to ${toLocation} (${toObjectId})`);
        console.log(`Vehicle: ${vehicle.vehicleId}, Shipment Type: ${shipmentType}`);
        console.log(`VEHICLE TRANSPORT LOGIC: Vehicle at ${fromLocation} needs to go to ${toLocation}, so looking for parcels ${fromLocation} → ${toLocation}`);
        console.log(`Using case-insensitive shipping method filter: /^${shipmentType}$/i`);

        // Size specifications for parcels
        const sizeSpecs = {
            small: { weight: 2, volume: 0.2 },
            medium: { weight: 5, volume: 0.5 },
            large: { weight: 10, volume: 1 }
        };

        // Find parcels that need to be shipped from fromCenter to toCenter
        console.log(`Database query parameters:`);
        console.log(`  shippingMethod (case-insensitive): /^${shipmentType}$/i`);
        console.log(`  from: ${fromObjectId}`);
        console.log(`  to: ${toObjectId}`);
        console.log(`  shipmentId: null`);

        const pendingParcels = await Parcel.find({
            shippingMethod: { $regex: new RegExp(`^${shipmentType}$`, 'i') },
            from: fromObjectId,
            to: toObjectId,
            shipmentId: null
        })

       

        .populate('senderId', 'name email phone')
        .populate('receiverId', 'name email phone')
        .populate('from', 'location branchId')
        .populate('to', 'location branchId')
        .sort({ createdAt: 1 }); // Process oldest parcels first (FIFO)
        
        console.log(`Query result: Found ${pendingParcels.length} pending parcels matching criteria`);
        
        // Debug: Show sample parcels from database for comparison
        const sampleParcels = await Parcel.find({})
            .populate('from', 'location branchId')
            .populate('to', 'location branchId')
            .limit(5)
            .select('shippingMethod from to shipmentId');
    
        console.log(`Found ${pendingParcels.length} pending parcels matching criteria`);

        if (pendingParcels.length === 0) {
            console.log(`No pending parcels found for route ${fromLocation} → ${toLocation}`);
                return {
                success: true, // Changed to true so frontend can handle this case properly
                message: `No pending parcels found for route ${fromLocation} → ${toLocation}`,
                parcelsFound: 0,
                fromCenter: fromLocation,
                toCenter: toLocation,
                route: {
                    from: fromLocation,
                    to: toLocation,
                    fromId: fromObjectId,
                    toId: toObjectId
                },
                parcels: [],
                summary: {
                    totalParcels: 0,
                    totalWeight: 0,
                    totalVolume: 0,
                    totalDistance: distanceMatrix[fromObjectId.toString()]?.[toObjectId.toString()] || 0
                }
            };
        }

        // Calculate vehicle capacity
        const vehicleMaxWeight = vehicle.capableWeight;
        const vehicleMaxVolume = vehicle.capableVolume;

        // Calculate which parcels can fit
        let totalWeight = 0;
        let totalVolume = 0;
        let selectedParcels = [];
        let skippedParcels = [];

        for (const parcel of pendingParcels) {
            const itemSize = parcel.itemSize?.toLowerCase() || 'medium';
            const sizeSpec = sizeSpecs[itemSize] || sizeSpecs.medium;
            const parcelWeight = sizeSpec.weight;
            const parcelVolume = sizeSpec.volume;

            if ((totalWeight + parcelWeight <= vehicleMaxWeight) &&
                (totalVolume + parcelVolume <= vehicleMaxVolume)) {
                
                selectedParcels.push({
                    _id: parcel._id,
                    parcelId: parcel.parcelId,
                    trackingNo: parcel.trackingNo,
                    itemType: parcel.itemType,
                    itemSize: parcel.itemSize,
                    itemValue: parcel.itemValue,
                    weight: parcelWeight,
                    volume: parcelVolume,
                    sender: {
                        name: parcel.senderId?.name || 'N/A',
                        email: parcel.senderId?.email || 'N/A',
                        phone: parcel.senderId?.phone || 'N/A'
                    },
                    receiver: {
                        name: parcel.receiverId?.name || 'N/A',
                        email: parcel.receiverId?.email || 'N/A',
                        phone: parcel.receiverId?.phone || 'N/A'
                    },
                    route: {
                        from: parcel.from?.location || fromLocation,
                        to: parcel.to?.location || toLocation
                    },
                    createdAt: parcel.createdAt,
                    status: parcel.status || 'Pending Pickup',
                    shippingMethod: parcel.shippingMethod
                });
                
                totalWeight += parcelWeight;
                totalVolume += parcelVolume;
            } else {
                skippedParcels.push({
                    _id: parcel._id,
                    parcelId: parcel.parcelId,
                    reason: 'Exceeds vehicle capacity'
                });
            }
        }

        return {
            success: true,
            fromCenter: fromLocation,
            toCenter: toLocation,
            route: {
                from: fromLocation,
                to: toLocation,
                fromId: fromObjectId,
                toId: toObjectId
            },
            vehicleDetails: {
                vehicleId: vehicle.vehicleId,
                vehicleType: vehicle.vehicleType,
                maxWeight: vehicleMaxWeight,
                maxVolume: vehicleMaxVolume,
                remainingWeight: vehicleMaxWeight - totalWeight,
                remainingVolume: vehicleMaxVolume - totalVolume
            },
            parcels: selectedParcels, // Changed from selectedParcels to parcels for consistency
            parcelsAnalysis: {
                totalFound: pendingParcels.length,
                canFit: selectedParcels.length,
                skipped: skippedParcels.length,
                totalWeight,
                totalVolume
            },
            summary: {
                totalParcels: selectedParcels.length,
                totalWeight,
                totalVolume,
                totalDistance: distanceMatrix[fromObjectId.toString()]?.[toObjectId.toString()] || 0
            },
            selectedParcels, // Keep this for backward compatibility
            skippedParcels: skippedParcels.slice(0, 5), // Only show first 5 skipped for brevity
            message: selectedParcels.length > 0 ? 
                `Found ${selectedParcels.length} parcels that can fit in the vehicle (${totalWeight}kg, ${totalVolume}m³)` :
                `Found ${pendingParcels.length} parcels but none can fit in the vehicle due to capacity constraints`
        };
    } catch (error) {
        console.error("Error finding parcels for reverse shipment:", error);
        throw error;
    }
}

/**
 * Create vehicle transport shipment with user-selected parcels
 * @param {Object} params - Parameters for vehicle transport creation
 * @returns {Object} - Created transport shipment details
 */
async function createVehicleTransportWithParcels(params) {
    const { 
        vehicle, 
        fromCenterId, 
        toCenterId, 
        shipmentType, 
        selectedParcelIds, 
        originalShipmentId,
        createdByCenter 
    } = params;
    
    try {
        const matrices = await generateMatrices();
        const { distanceMatrix, timeMatrix, branchIdToLocation } = matrices;
        const fromLocation = branchIdToLocation[fromCenterId.toString()];
        const toLocation = branchIdToLocation[toCenterId.toString()];

        console.log(`Creating vehicle transport with ${selectedParcelIds.length} selected parcels`);

        // Size specifications for parcels
        const sizeSpecs = {
            small: { weight: 2, volume: 0.2 },
            medium: { weight: 5, volume: 0.5 },
            large: { weight: 10, volume: 1 }
        };

        // Generate a unique shipment ID for the reverse shipment
        const lastShipment = await B2BShipment.findOne({ sourceCenter: fromCenterId })
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

        const transportShipmentId = `${shipmentType.toLowerCase() === "express" ? "EX" : "ST"}-T${shipmentCount.toString().padStart(3, '0')}-${fromLocation}`;

        // Calculate the route details
        const route = [fromCenterId, toCenterId];
        const totalDistance = distanceMatrix[fromCenterId.toString()][toCenterId.toString()];

        // Calculate arrival times and total time
        const { arrivalTimes, shipmentFinishTime } = calculateArrivalTimes(route, shipmentType, timeMatrix);

        // Create the vehicle transport shipment first to get its ObjectId
        const transportShipment = new B2BShipment({
            shipmentId: transportShipmentId,
            deliveryType: shipmentType,
            sourceCenter: fromCenterId,
            route: route,
            currentLocation: fromCenterId,
            totalDistance: totalDistance,
            totalTime: shipmentFinishTime,
            arrivalTimes: arrivalTimes,
            shipmentFinishTime: shipmentFinishTime,
            totalWeight: 0, // Will be updated after processing parcels
            totalVolume: 0, // Will be updated after processing parcels
            parcelCount: 0, // Will be updated after processing parcels
            assignedVehicle: vehicle._id,
            status: 'In Transit',
            parcels: [], // Will be updated after processing parcels
            createdByCenter: createdByCenter, // The center that found the vehicle
            isVehicleTransport: true,
            createdAt: new Date()
        });

        await transportShipment.save();

        // Get selected parcels and calculate totals
        const selectedParcels = await Parcel.find({ _id: { $in: selectedParcelIds } });
        
        let totalWeight = 0;
        let totalVolume = 0;

        for (const parcel of selectedParcels) {
            const itemSize = parcel.itemSize?.toLowerCase() || 'medium';
            const sizeSpec = sizeSpecs[itemSize] || sizeSpecs.medium;
            totalWeight += sizeSpec.weight;
            totalVolume += sizeSpec.volume;

            // Update parcel with proper values according to schema
            parcel.status = 'InTransit'; // Correct enum value (no space)
            parcel.shipmentId = transportShipment._id; // Use ObjectId instead of string
            
            // Set required fields if not already set
            if (!parcel.arrivedToCollectionCenterTime) {
                parcel.arrivedToCollectionCenterTime = new Date();
            }

            try {
                await parcel.save();
                console.log(`Updated parcel ${parcel._id} for vehicle transport`);
            } catch (parcelError) {
                console.error(`Error updating parcel ${parcel._id}:`, parcelError.message);
                // Continue with other parcels even if one fails
            }
        }

        // Update the transport shipment with actual parcel data
        transportShipment.totalWeight = totalWeight;
        transportShipment.totalVolume = totalVolume;
        transportShipment.parcelCount = selectedParcels.length;
        transportShipment.parcels = selectedParcelIds;
        await transportShipment.save();

        // Update the original shipment with transport details if provided
        if (originalShipmentId) {
            await B2BShipment.findByIdAndUpdate(originalShipmentId, {
                vehicleTransport: {
                    isRequired: true,
                    fromCenter: fromCenterId,
                    transportShipment: {
                        shipmentId: transportShipmentId,
                        parcelsCarried: selectedParcelIds,
                        totalWeight: totalWeight,
                        totalVolume: totalVolume,
                        status: 'In Transit',
                        createdAt: new Date()
                    }
                }
            });
        }

        // Update vehicle status
        vehicle.available = false;
        vehicle.currentShipment = transportShipment._id;
        await vehicle.save();

        return {
            success: true,
            transportShipmentId: transportShipmentId,
            shipmentDetails: {
                shipmentId: transportShipmentId,
                deliveryType: shipmentType,
                sourceCenter: fromCenterId,
                destinationCenter: toCenterId,
                route: route,
                totalDistance: totalDistance,
                totalTime: shipmentFinishTime,
                totalWeight: totalWeight,
                totalVolume: totalVolume,
                parcelCount: selectedParcels.length,
                status: 'In Transit',
                createdAt: new Date(),
                isVehicleTransport: true
            },
            vehicleDetails: {
                vehicleId: vehicle.vehicleId,
                from: fromLocation,
                to: toLocation,
                status: 'In Transit'
            },
            parcelsIncluded: selectedParcels.length,
            message: `Vehicle transport shipment created successfully with ${selectedParcels.length} parcels`
        };
    } catch (error) {
        console.error("Error creating vehicle transport with parcels:", error);
        throw error;
    }
}

/**
 * Create reverse shipment after user confirmation
 * @param {Object} params - Parameters for reverse shipment creation
 * @returns {Object} - Created reverse shipment details
 */
async function createReverseShipment(params) {
    const { 
        originalShipmentId,
        vehicle, 
        fromCenterId, 
        toCenterId, 
        shipmentType, 
        selectedParcelIds,
        assignedDriver
    } = params;
    
    try {
        const matrices = await generateMatrices();
        const { distanceMatrix, timeMatrix, branchIdToLocation } = matrices;
        const fromLocation = branchIdToLocation[fromCenterId.toString()];
        const toLocation = branchIdToLocation[toCenterId.toString()];

        console.log(`Creating reverse shipment with ${selectedParcelIds.length} selected parcels`);

        // Size specifications for parcels
        const sizeSpecs = {
            small: { weight: 2, volume: 0.2 },
            medium: { weight: 5, volume: 0.5 },
            large: { weight: 10, volume: 1 }
        };

        // Generate a unique shipment ID for the reverse shipment
        const lastShipment = await B2BShipment.findOne({ sourceCenter: fromCenterId })
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

        const reverseShipmentId = `${shipmentType.toLowerCase() === "express" ? "EX" : "ST"}-R${shipmentCount.toString().padStart(3, '0')}-${fromLocation}`;

        // Calculate the route details
        const route = [fromCenterId, toCenterId];
        const totalDistance = distanceMatrix[fromCenterId.toString()][toCenterId.toString()];

        // Calculate arrival times and total time
        const { arrivalTimes, shipmentFinishTime } = calculateArrivalTimes(route, shipmentType, timeMatrix);

        // If no specific parcels are selected, find available parcels for the reverse route
        let finalSelectedParcelIds = selectedParcelIds;
        if (selectedParcelIds.length === 0) {
            console.log(`No parcels specified, searching for available parcels from ${fromLocation} to ${toLocation}`);
            
            // Find parcels that need to go from the vehicle's current location to the shipment source
            const availableParcels = await Parcel.find({
                // Parcel is at the vehicle's current location (fromCenterId)
                from: fromCenterId,  // Changed from currentLocation to from
                // Parcel is not already in a shipment
                shipmentId: null,
                // Parcel status allows it to be picked up
                status: { $in: ['ArrivedAtCollectionCenter', 'OrderPlaced', 'PickedUp'] } // Using correct status values
            }).limit(10); // Limit to prevent overloading

            console.log(`Found ${availableParcels.length} parcels at ${fromLocation} available for reverse shipment:`);
            availableParcels.forEach(p => {
                console.log(`  - Parcel ${p.trackingNo}: ${p.itemType} (${p.itemSize})`); // Using correct field names
            });

            finalSelectedParcelIds = availableParcels.map(p => p._id);
        }

        // Get selected parcels and calculate totals
        const selectedParcels = await Parcel.find({ _id: { $in: finalSelectedParcelIds } });
        
        let totalWeight = 0;
        let totalVolume = 0;

        for (const parcel of selectedParcels) {
            const itemSize = parcel.itemSize?.toLowerCase() || 'medium';
            const sizeSpec = sizeSpecs[itemSize] || sizeSpecs.medium;
            totalWeight += sizeSpec.weight;
            totalVolume += sizeSpec.volume;
        }

        // STEP 4: Create the reverse shipment with isReverseShipment = true
        const reverseShipment = new B2BShipment({
            shipmentId: reverseShipmentId,
            deliveryType: shipmentType,
            sourceCenter: fromCenterId,
            route: route,
            currentLocation: fromCenterId,
            totalDistance: totalDistance,
            totalTime: shipmentFinishTime,
            arrivalTimes: arrivalTimes,
            shipmentFinishTime: shipmentFinishTime,
            totalWeight: totalWeight,
            totalVolume: totalVolume,
            parcelCount: selectedParcels.length,
            assignedVehicle: vehicle._id, // STEP 5: Same vehicle as original
            assignedDriver: assignedDriver, // STEP 5: Same driver as original
            status: 'In Transit',
            parcels: finalSelectedParcelIds,
            isVehicleTransport: false, // STEP 5: Set to false after assignment
            isReverseShipment: true, // STEP 4: Mark as reverse shipment
            reverseShipmentDetails: {
                originalShipmentId: originalShipmentId,
                transportShipmentId: reverseShipmentId,
                vehicleFromCenter: fromLocation,
                vehicleToCenter: toLocation,
                parcelsCarried: finalSelectedParcelIds,
                parcelCount: selectedParcels.length,
                totalWeight: totalWeight,
                totalVolume: totalVolume,
                status: 'In Transit',
                createdAt: new Date()
            },
            createdAt: new Date()
        });

        await reverseShipment.save();

        // Update parcels with the reverse shipment ObjectId
        for (const parcel of selectedParcels) {
            parcel.status = 'InTransit';
            parcel.shipmentId = reverseShipment._id;
            
            if (!parcel.arrivedToCollectionCenterTime) {
                parcel.arrivedToCollectionCenterTime = new Date();
            }

            await parcel.save();
            console.log(`Updated parcel ${parcel.parcelId} for reverse shipment`); // Using parcelId instead of _id
        }

        // STEP 5: Update vehicle allocation to reverse shipment
        vehicle.available = false;
        vehicle.currentShipment = reverseShipment._id;
        await vehicle.save();
        console.log(`Vehicle ${vehicle.vehicleId} allocated to reverse shipment ${reverseShipmentId}`);

        // STEP 6: Update original shipment with reverse shipment details
        await B2BShipment.findByIdAndUpdate(originalShipmentId, {
            isVehicleTransport: false, // STEP 5: Reset after reverse shipment creation
            vehicleTransport: {
                isRequired: true,
                fromCenter: fromCenterId,
                transportShipment: {
                    shipmentId: reverseShipmentId,
                    parcelsCarried: finalSelectedParcelIds,
                    totalWeight: totalWeight,
                    totalVolume: totalVolume,
                    status: 'In Transit',
                    createdAt: new Date()
                }
            },
            reverseShipmentDetails: {
                transportShipmentId: reverseShipmentId,
                vehicleFromCenter: fromLocation,
                vehicleToCenter: toLocation,
                parcelsCarried: finalSelectedParcelIds,
                parcelCount: selectedParcels.length,
                totalWeight: totalWeight,
                totalVolume: totalVolume,
                status: 'In Transit',
                createdAt: new Date()
            }
        });

        console.log(`Original shipment ${originalShipmentId} updated with reverse shipment details`);

        return {
            success: true,
            reverseShipmentId: reverseShipmentId,
            reverseShipmentDetails: {
                shipmentId: reverseShipmentId,
                deliveryType: shipmentType,
                sourceCenter: fromCenterId,
                destinationCenter: toCenterId,
                route: route,
                totalDistance: totalDistance,
                totalTime: shipmentFinishTime,
                totalWeight: totalWeight,
                totalVolume: totalVolume,
                parcelCount: selectedParcels.length,
                status: 'In Transit',
                createdAt: new Date(),
                isReverseShipment: true
            },
            vehicleDetails: {
                vehicleId: vehicle.vehicleId,
                from: fromLocation,
                to: toLocation,
                status: 'In Transit',
                allocatedTo: 'reverse_shipment'
            },
            parcelsIncluded: selectedParcels.length,
            message: `Reverse shipment created successfully with ${selectedParcels.length} parcels. Original shipment updated with complete reverse shipment data.`
        };
    } catch (error) {
        console.error("Error creating reverse shipment:", error);
        throw error;
    }
}

/**
 * Get pending B2B shipments for a specific center/branch
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getPendingB2BShipments = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { status, all } = req.query;

        // Find the staff to get their branch ID
        const Staff = require('../../models/StaffModel');
        const staff = await Staff.findById(staffId).select('branchId');
        
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }

        // Build base query filter to include shipments where branch is in the route or is the source center
        const queryFilter = {
            $or: [
                { sourceCenter: staff.branchId },  // Shipments created by this branch
                { route: { $in: [staff.branchId] } }  // Shipments that pass through this branch
            ]
        };

        // Only add status filter if status is provided and all is not requested
        if (status && !all) {
            queryFilter.status = status;
        }
        // If 'all' parameter is true, don't add any status filter to get all shipments

        // Fetch B2B shipments with the specified status for the staff's branch
        const shipments = await B2BShipment.find(queryFilter)
            .populate('sourceCenter', 'location branchName')
            .populate('route', 'location branchName')
            .populate('currentLocation', 'location branchName')
            .populate({
                path: 'assignedVehicle',
                select: 'vehicleId registrationNo vehicleType capableWeight capableVolume currentBranch assignedBranch available',
                populate: {
                    path: 'currentBranch assignedBranch',
                    select: 'location branchName'
                }
            })
            .populate('assignedDriver', 'name contactNo driverId licenseId')
            .populate({
                path: 'parcels',
                select: 'parcelId trackingNo qrCodeNo itemType itemSize shippingMethod status submittingType receivingType specialInstructions pickupInformation deliveryInformation weight volume',
                populate: [
                    { path: 'from', select: 'location branchId' },
                    { path: 'to', select: 'location branchId' },
                    { path: 'senderId', select: 'name email phone' },
                    { path: 'receiverId', select: 'name email phone' },
                    { path: 'paymentId', select: 'amount method status' }
                ]
            })
            .populate('createdByStaff', 'name staffId')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: shipments.length,
            shipments: shipments,
            message: all ? `Found ${shipments.length} shipments (all stages) for the center` : `Found ${shipments.length} ${status?.toLowerCase() || ''} shipments for the center`
        });

    } catch (error) {
        console.error('Error fetching pending B2B shipments:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching shipments',
            error: error.message
        });
    }
};

// New function to get shipments by branch ID directly (for ViewShipmentsPage)
const getShipmentsByBranch = async (req, res) => {
    try {
        const { branchId } = req.params;
        const { status, all } = req.query;

        // Build query filter with different logic for own center vs other centers in route
        const queryFilter = {
            $or: [
                // Case 1: Shipments created by this branch (show all statuses based on filter)
                (() => {
                    const ownCenterQuery = { sourceCenter: branchId };
                    // Apply status filter for own center shipments if specified
                    if (status && !all) {
                        ownCenterQuery.status = status;
                    }
                    return ownCenterQuery;
                })(),
                
                // Case 2: Shipments that pass through this branch (only show Dispatched status)
                {
                    route: { $in: [branchId] },
                    sourceCenter: { $ne: branchId }, // Not created by this branch
                    status: 'Dispatched' // Only show dispatched shipments to other centers in route
                }
            ]
        };

        // Fetch B2B shipments with the specified criteria for the branch
        const shipments = await B2BShipment.find(queryFilter)
            .populate('sourceCenter', 'location branchName')
            .populate('route', 'location branchName')
            .populate('currentLocation', 'location branchName')
            .populate({
                path: 'assignedVehicle',
                select: 'vehicleId registrationNo vehicleType capableWeight capableVolume currentBranch assignedBranch available',
                populate: {
                    path: 'currentBranch assignedBranch',
                    select: 'location branchName'
                }
            })
            .populate('assignedDriver', 'name contactNo driverId licenseId')
            .populate({
                path: 'parcels',
                select: 'parcelId trackingNo qrCodeNo itemType itemSize shippingMethod status submittingType receivingType specialInstructions pickupInformation deliveryInformation weight volume',
                populate: [
                    { path: 'from', select: 'location branchId' },
                    { path: 'to', select: 'location branchId' },
                    { path: 'senderId', select: 'name email phone' },
                    { path: 'receiverId', select: 'name email phone' },
                    { path: 'paymentId', select: 'amount method status' }
                ]
            })
            .populate('createdByStaff', 'name staffId')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: shipments.length,
            shipments: shipments,
            message: all ? `Found ${shipments.length} shipments (all stages) for the branch` : `Found ${shipments.length} ${status?.toLowerCase() || ''} shipments for the branch`
        });

    } catch (error) {
        console.error('Error fetching shipments by branch:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching shipments',
            error: error.message
        });
    }
};

/**
 * Manual Vehicle Assignment - Assign specific vehicle by registration number
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const assignVehicleManual = async (req, res) => {
    try {
        const { shipmentId } = req.params;
        const { vehicleRegistration } = req.body;

        if (!vehicleRegistration) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle registration number is required'
            });
        }

        // Find the shipment
        const shipment = await B2BShipment.findById(shipmentId)
            .populate('sourceCenter', 'location branchName');

        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: 'Shipment not found'
            });
        }

        if (shipment.assignedVehicle) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle already assigned to this shipment'
            });
        }

        // Find vehicle by registration number
        const vehicle = await Vehicle.findOne({ 
            registrationNo: vehicleRegistration,
            vehicleType: "shipment"
        }).populate('assignedBranch', 'location branchName')
         .populate('currentBranch', 'location branchName')
         .populate('driverId', 'name contactNo licenseId driverId');

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found with the provided registration number'
            });
        }

        // Check if vehicle is available
        if (!vehicle.available) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle is currently not available'
            });
        }

        // Check capacity
        if (vehicle.capableWeight < shipment.totalWeight) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle Not Capable - Weight exceeds capacity',
                details: {
                    required: shipment.totalWeight,
                    available: vehicle.capableWeight,
                    type: 'weight'
                }
            });
        }

        if (vehicle.capableVolume < shipment.totalVolume) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle Not Capable - Volume exceeds capacity',
                details: {
                    required: shipment.totalVolume,
                    available: vehicle.capableVolume,
                    type: 'volume'
                }
            });
        }

        // Generate matrices for location calculations
        const matrices = await generateMatrices();
        const { branchIdToLocation } = matrices;

        // Assign vehicle to shipment
        shipment.assignedVehicle = vehicle._id;
        if (vehicle.driverId) {
            shipment.assignedDriver = vehicle.driverId._id;
        }

        // Always set status to "In Transit" when vehicle is assigned, regardless of location
        shipment.status = "In Transit";
        
        // Update all parcels in this shipment to 'ShipmentAssigned' status
        await Parcel.updateMany(
            { _id: { $in: shipment.parcels } },
            { 
                $set: { 
                    status: 'ShipmentAssigned',
                    updatedAt: new Date()
                }
            }
        );

        console.log(`Updated ${shipment.parcels.length} parcels to ShipmentAssigned status for shipment ${shipment._id}`);
        
        // Check if vehicle is at source center
        const isAtSource = vehicle.currentBranch.equals(shipment.sourceCenter._id);
        
        // Mark vehicle as unavailable when assigned
        vehicle.available = false;
        await vehicle.save();

        await shipment.save();

        return res.status(200).json({
            success: true,
            message: 'Vehicle assigned successfully',
            data: {
                shipment: {
                    shipmentId: shipment.shipmentId,
                    status: shipment.status,
                    assignedVehicle: {
                        vehicleId: vehicle.vehicleId,
                        registrationNo: vehicle.registrationNo
                    },
                    assignedDriver: vehicle.driverId ? {
                        driverId: vehicle.driverId.driverId,
                        name: vehicle.driverId.name,
                        contactNo: vehicle.driverId.contactNo,
                        licenseId: vehicle.driverId.licenseId
                    } : null
                },
                vehicle: {
                    vehicleId: vehicle.vehicleId,
                    registrationNo: vehicle.registrationNo,
                    currentLocation: vehicle.currentBranch.location,
                    currentBranch: {
                        branchId: vehicle.currentBranch._id,
                        location: vehicle.currentBranch.location,
                        branchName: vehicle.currentBranch.branchName
                    },
                    isAtSource: isAtSource,
                    capacity: {
                        weight: vehicle.capableWeight,
                        volume: vehicle.capableVolume
                    },
                    driver: vehicle.driverId ? {
                        driverId: vehicle.driverId.driverId,
                        name: vehicle.driverId.name,
                        contactNo: vehicle.driverId.contactNo,
                        licenseId: vehicle.driverId.licenseId
                    } : null
                },
                needsTransport: !isAtSource
            }
        });

    } catch (error) {
        console.error('Error in manual vehicle assignment:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Smart Vehicle Assignment - Use 3-step search algorithm
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const assignVehicleSmart = async (req, res) => {
    try {
        const { shipmentId } = req.params;

        // Find the shipment
        const shipment = await B2BShipment.findById(shipmentId)
            .populate('sourceCenter', 'location branchName');

        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: 'Shipment not found'
            });
        }

        if (shipment.assignedVehicle) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle already assigned to this shipment'
            });
        }

        // Generate matrices for calculations
        const matrices = await generateMatrices();
        const { branchIdToLocation, distanceMatrix } = matrices;

        // Use existing 3-step vehicle search
        const foundVehicle = await findNearestVehicle(
            shipment.sourceCenter._id,
            shipment.totalWeight,
            shipment.totalVolume,
            matrices
        );

        if (!foundVehicle) {
            return res.status(404).json({
                success: false,
                message: 'No suitable vehicle available',
                searchSteps: {
                    step1: 'No vehicles at source center',
                    step2: 'No source-owned vehicles at nearby centers',
                    step3: 'No vehicles at nearest 3 centers'
                }
            });
        }

        // Populate vehicle data with branch and driver information
        const vehicle = await Vehicle.findById(foundVehicle._id)
            .populate('assignedBranch', 'location branchName')
            .populate('currentBranch', 'location branchName')
            .populate('driverId', 'name contactNo licenseId driverId');

        // Get vehicle location details
        const sourceLocation = branchIdToLocation[shipment.sourceCenter._id.toString()];
        const vehicleLocation = branchIdToLocation[vehicle.currentBranch._id.toString()];
        const isAtSource = vehicle.currentBranch._id.equals(shipment.sourceCenter._id);

        // Calculate distance and time if not at source
        let distance = 0;
        let estimatedTime = 0;
        if (!isAtSource) {
            const fromId = vehicle.currentBranch._id.toString();
            const toId = shipment.sourceCenter._id.toString();
            distance = distanceMatrix[fromId][toId] || 0;
            // Rough estimation: 40 km/h average speed
            estimatedTime = Math.ceil(distance / 40);
        }

        // Check if vehicle is at a different center and if there are parcels to collect
        let availableParcelGroups = null;
        if (!isAtSource) {
            // Find parcels at vehicle's current center that can go to route destinations
            availableParcelGroups = await findAvailableParcelsForRoute(
                vehicle.currentBranch._id,
                shipment.route,
                shipment.deliveryType,
                shipment.totalWeight,
                shipment.totalVolume
            );
        }

        return res.status(200).json({
            success: true,
            message: 'Vehicle found successfully',
            data: {
                shipment: {
                    shipmentId: shipment.shipmentId,
                    deliveryType: shipment.deliveryType,
                    totalWeight: shipment.totalWeight,
                    totalVolume: shipment.totalVolume,
                    parcelCount: shipment.parcelCount,
                    sourceCenter: sourceLocation,
                    route: shipment.route
                },
                vehicle: {
                    vehicleId: vehicle.vehicleId,
                    registrationNo: vehicle.registrationNo,
                    vehicleType: vehicle.vehicleType,
                    currentLocation: vehicleLocation,
                    currentBranch: {
                        branchId: vehicle.currentBranch._id,
                        location: vehicle.currentBranch.location,
                        branchName: vehicle.currentBranch.branchName
                    },
                    sourceLocation: sourceLocation,
                    isAtSource: isAtSource,
                    distance: distance,
                    estimatedTime: estimatedTime,
                    capacity: {
                        weight: vehicle.capableWeight,
                        volume: vehicle.capableVolume
                    },
                    driver: vehicle.driverId ? {
                        driverId: vehicle.driverId.driverId,
                        name: vehicle.driverId.name,
                        contactNo: vehicle.driverId.contactNo,
                        licenseId: vehicle.driverId.licenseId
                    } : null
                },
                needsTransport: !isAtSource,
                searchResult: {
                    foundAt: isAtSource ? 'source' : 'remote',
                    step: isAtSource ? 1 : (vehicle.assignedBranch.equals(shipment.sourceCenter._id) ? 2 : 3)
                },
                availableParcelGroups: availableParcelGroups
            }
        });

    } catch (error) {
        console.error('Error in smart vehicle assignment:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * PHASE 4 - Get available additional parcels for a shipment with assigned vehicle
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAvailableParcelsForShipment = async (req, res) => {
    try {
        const { shipmentId } = req.params;

        // Find the shipment with its assigned vehicle
        const shipment = await B2BShipment.findById(shipmentId)
            .populate('assignedVehicle', 'vehicleId registrationNo currentBranch capableWeight capableVolume')
            .populate('route', 'location branchName')
            .populate('parcels', 'weight volume');

        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: 'Shipment not found'
            });
        }

        if (!shipment.assignedVehicle) {
            return res.status(400).json({
                success: false,
                message: 'No vehicle assigned to this shipment'
            });
        }

        // Calculate remaining capacity
        const currentWeight = shipment.totalWeight || 0;
        const currentVolume = shipment.totalVolume || 0;
        const remainingWeight = (shipment.assignedVehicle.capableWeight || 0) - currentWeight;
        const remainingVolume = (shipment.assignedVehicle.capableVolume || 0) - currentVolume;

        if (remainingWeight <= 0 || remainingVolume <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle is at full capacity',
                data: {
                    remainingWeight,
                    remainingVolume,
                    currentWeight,
                    currentVolume,
                    maxWeight: shipment.assignedVehicle.capableWeight,
                    maxVolume: shipment.assignedVehicle.capableVolume
                }
            });
        }

        // Find additional parcels
        const additionalParcelsResult = await findAdditionalParcels(
            shipment.assignedVehicle.currentBranch,
            shipment.route,
            shipment.deliveryType,
            remainingWeight,
            remainingVolume
        );

        if (!additionalParcelsResult.success) {
            return res.status(500).json({
                success: false,
                message: additionalParcelsResult.message,
                error: additionalParcelsResult.error
            });
        }

        return res.status(200).json({
            success: true,
            message: `Found ${additionalParcelsResult.totalAvailable} additional parcels available`,
            data: {
                shipmentId: shipment.shipmentId,
                vehicleInfo: {
                    vehicleId: shipment.assignedVehicle.vehicleId,
                    registrationNo: shipment.assignedVehicle.registrationNo,
                    currentCapacity: {
                        weight: currentWeight,
                        volume: currentVolume
                    },
                    remainingCapacity: {
                        weight: remainingWeight,
                        volume: remainingVolume
                    },
                    maxCapacity: {
                        weight: shipment.assignedVehicle.capableWeight,
                        volume: shipment.assignedVehicle.capableVolume
                    }
                },
                shipmentRoute: shipment.route.map(r => ({
                    branchId: r._id,
                    location: r.location,
                    branchName: r.branchName
                })),
                ...additionalParcelsResult
            }
        });

    } catch (error) {
        console.error('Error getting available parcels for shipment:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * PHASE 4 - Add selected parcels to shipment
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const addParcelsToShipment = async (req, res) => {
    try {
        const { shipmentId } = req.params;
        const { selectedParcelIds } = req.body;

        if (!selectedParcelIds || !Array.isArray(selectedParcelIds) || selectedParcelIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No parcels selected'
            });
        }

        // Find the shipment
        const shipment = await B2BShipment.findById(shipmentId)
            .populate('assignedVehicle', 'capableWeight capableVolume')
            .populate('parcels');

        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: 'Shipment not found'
            });
        }

        // Find selected parcels
        const selectedParcels = await Parcel.find({
            _id: { $in: selectedParcelIds },
            shipmentId: null // Ensure they're still unassigned
        });

        if (selectedParcels.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid unassigned parcels found'
            });
        }

        // Calculate new totals
        const additionalWeight = selectedParcels.reduce((sum, p) => sum + (p.weight || 0), 0);
        const additionalVolume = selectedParcels.reduce((sum, p) => sum + (p.volume || 0), 0);
        const newTotalWeight = (shipment.totalWeight || 0) + additionalWeight;
        const newTotalVolume = (shipment.totalVolume || 0) + additionalVolume;

        // Check capacity constraints
        if (newTotalWeight > shipment.assignedVehicle.capableWeight) {
            return res.status(400).json({
                success: false,
                message: 'Adding these parcels would exceed vehicle weight capacity',
                data: {
                    newTotalWeight,
                    maxWeight: shipment.assignedVehicle.capableWeight,
                    excess: newTotalWeight - shipment.assignedVehicle.capableWeight
                }
            });
        }

        if (newTotalVolume > shipment.assignedVehicle.capableVolume) {
            return res.status(400).json({
                success: false,
                message: 'Adding these parcels would exceed vehicle volume capacity',
                data: {
                    newTotalVolume,
                    maxVolume: shipment.assignedVehicle.capableVolume,
                    excess: newTotalVolume - shipment.assignedVehicle.capableVolume
                }
            });
        }

        // Update parcels - assign them to this shipment
        await Parcel.updateMany(
            { _id: { $in: selectedParcelIds } },
            { 
                shipmentId: shipment._id,
                status: 'In Transit'
            }
        );

        // Update shipment with new totals
        const updatedParcels = [...shipment.parcels.map(p => p._id), ...selectedParcelIds];
        
        await B2BShipment.findByIdAndUpdate(shipmentId, {
            parcels: updatedParcels,
            totalWeight: newTotalWeight,
            totalVolume: newTotalVolume,
            parcelCount: updatedParcels.length
        });

        // Get updated shipment data
        const updatedShipment = await B2BShipment.findById(shipmentId)
            .populate('parcels', 'trackingId weight volume senderName receiverName')
            .populate('assignedVehicle', 'vehicleId registrationNo')
            .populate('assignedDriver', 'name contactNo driverId');

        return res.status(200).json({
            success: true,
            message: `Successfully added ${selectedParcels.length} parcels to shipment`,
            data: {
                shipmentId: shipment.shipmentId,
                addedParcels: selectedParcels.length,
                addedWeight: additionalWeight,
                addedVolume: additionalVolume,
                updatedTotals: {
                    totalWeight: newTotalWeight,
                    totalVolume: newTotalVolume,
                    parcelCount: updatedParcels.length
                },
                remainingCapacity: {
                    weight: shipment.assignedVehicle.capableWeight - newTotalWeight,
                    volume: shipment.assignedVehicle.capableVolume - newTotalVolume
                },
                shipment: {
                    shipmentId: updatedShipment.shipmentId,
                    status: updatedShipment.status,
                    totalWeight: updatedShipment.totalWeight,
                    totalVolume: updatedShipment.totalVolume,
                    parcelCount: updatedShipment.parcelCount,
                    assignedVehicle: updatedShipment.assignedVehicle,
                    assignedDriver: updatedShipment.assignedDriver
                }
            }
        });

    } catch (error) {
        console.error('Error adding parcels to shipment:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
/**
 * Find available parcels from a vehicle's center to route destinations
 */
async function findAvailableParcelsForRoute(vehicleCenterId, shipmentRoute, deliveryType, currentWeight, currentVolume) {
    try {
        // Constraints for different delivery types
        const constraints = {
            express: { maxVolume: 5, maxWeight: 1000 },
            standard: { maxVolume: 10, maxWeight: 2500 }
        };

        const maxCapacity = constraints[deliveryType.toLowerCase()] || constraints.standard;
        const remainWeight = maxCapacity.maxWeight - currentWeight;
        const remainVolume = maxCapacity.maxVolume - currentVolume;

        // Convert to ObjectId if needed and filter route destinations excluding the vehicle's current center
        const mongoose = require('mongoose');
        const vehicleObjectId = mongoose.Types.ObjectId.isValid(vehicleCenterId) ? 
            new mongoose.Types.ObjectId(vehicleCenterId) : vehicleCenterId;

        const destinationCenters = shipmentRoute.filter(centerId => {
            const centerObjectId = mongoose.Types.ObjectId.isValid(centerId) ? 
                new mongoose.Types.ObjectId(centerId) : centerId;
            return !centerObjectId.equals(vehicleObjectId);
        });

        if (destinationCenters.length === 0) {
            console.log('No valid destinations after filtering vehicle center');
            return null; // No valid destinations
        }

        console.log(`Searching parcels from vehicle center ${vehicleCenterId} to destinations:`, destinationCenters);
        console.log(`Using delivery type: ${deliveryType}, looking for shippingMethod: ${deliveryType} (case-insensitive)`);

        // Debug: First check if there are any parcels at the vehicle center at all
        const allParcelsAtCenter = await Parcel.find({ from: vehicleObjectId }).limit(5);
        console.log(`Debug: Found ${allParcelsAtCenter.length} total parcels at vehicle center (showing first 5):`);
        allParcelsAtCenter.forEach(p => {
            console.log(`  Parcel ${p.parcelId}: shippingMethod=${p.shippingMethod}, status=${p.status}, shipmentId=${p.shipmentId}, to=${p.to}`);
        });

        // Find parcels at vehicle's center going to route destinations
        // Using broader status criteria to catch more parcels
        // FIXED: Case-insensitive shipping method matching
        const availableParcels = await Parcel.find({
            from: vehicleObjectId,                                    // Parcel source center
            to: { $in: destinationCenters },                        // Parcel destinations in route
            $or: [
                // Parcels that arrived at collection center are available regardless of shipmentId
                { status: 'ArrivedAtCollectionCenter' },
                // Other status parcels must have no shipment assigned
                { 
                    shipmentId: null,
                    status: { $in: ['OrderPlaced', 'PendingPickup', 'PickedUp', 'ArrivedAtDistributionCenter'] }
                }
            ],
            shippingMethod: { $regex: new RegExp(`^${deliveryType}$`, 'i') } // Case-insensitive matching
        }).populate('to', 'location branchId')
          .populate('from', 'location branchId');

        console.log(`Found ${availableParcels.length} available parcels for route`);

        // Debug: Show details of found parcels
        if (availableParcels.length > 0) {
            console.log('Available parcels details:');
            availableParcels.forEach(p => {
                console.log(`  ${p.parcelId}: ${p.from?.location} → ${p.to?.location} (${p.shippingMethod}, ${p.status})`);
            });
        }

        // Group parcels by destination
        const groupedParcels = {};
        const sizeSpecs = {
            small: { weight: 2, volume: 0.2 },
            medium: { weight: 5, volume: 0.5 },
            large: { weight: 10, volume: 1 }
        };

        for (const parcel of availableParcels) {
            if (parcel.to) {
                const destId = parcel.to._id.toString();
                const destName = parcel.to.location;

                if (!groupedParcels[destId]) {
                    groupedParcels[destId] = {
                        destinationId: destId,
                        destinationName: destName,
                        parcels: [],
                        totalWeight: 0,
                        totalVolume: 0
                    };
                }

                // Calculate parcel weight and volume
                const itemSize = parcel.itemSize?.toLowerCase() || 'medium';
                const sizeSpec = sizeSpecs[itemSize] || sizeSpecs.medium;

                groupedParcels[destId].parcels.push({
                    _id: parcel._id,
                    parcelId: parcel.parcelId,
                    trackingNo: parcel.trackingNo,
                    weight: sizeSpec.weight,
                    volume: sizeSpec.volume,
                    itemSize: parcel.itemSize,
                    itemType: parcel.itemType,
                    shippingMethod: parcel.shippingMethod,
                    status: parcel.status,
                    from: parcel.from,
                    to: parcel.to
                });

                groupedParcels[destId].totalWeight += sizeSpec.weight;
                groupedParcels[destId].totalVolume += sizeSpec.volume;
            }
        }

        // Check capacity constraints for each group and determine feasibility
        const finalGroups = {};
        let runningWeight = 0;
        let runningVolume = 0;

        for (const [destId, group] of Object.entries(groupedParcels)) {
            const groupWeight = group.totalWeight;
            const groupVolume = group.totalVolume;

            // Check if this group can fit with current running totals
            const canFit = (runningWeight + groupWeight <= remainWeight) && 
                          (runningVolume + groupVolume <= remainVolume);

            finalGroups[destId] = {
                ...group,
                canFit: canFit,
                runningWeight: runningWeight + groupWeight,
                runningVolume: runningVolume + groupVolume
            };

            // Only update running totals if this group can fit
            if (canFit) {
                runningWeight += groupWeight;
                runningVolume += groupVolume;
            }
        }

        console.log(`Found ${Object.keys(finalGroups).length} parcel groups for route`);

        return {
            constraints: {
                maxWeight: maxCapacity.maxWeight,
                maxVolume: maxCapacity.maxVolume,
                currentWeight: currentWeight,
                currentVolume: currentVolume,
                remainingWeight: remainWeight,
                remainingVolume: remainVolume
            },
            parcelGroups: finalGroups,
            totalGroupsFound: Object.keys(finalGroups).length,
            totalParcelsFound: Object.values(finalGroups).reduce((sum, group) => sum + group.parcels.length, 0)
        };

    } catch (error) {
        console.error('Error finding parcels for route:', error);
        return null;
    }
}

const confirmVehicleAssignment = async (req, res) => {
    try {
        const { shipmentId } = req.params;
        const { vehicleId, createReverseShipment: shouldCreateReverse = false } = req.body;

        if (!vehicleId) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle ID is required'
            });
        }

        // Find shipment and vehicle
        const shipment = await B2BShipment.findById(shipmentId);
        
        // Find vehicle by vehicleId (registration number) instead of _id
        const vehicle = await Vehicle.findOne({ vehicleId: vehicleId })
            .populate('driverId', 'name contactNo licenseId driverId');

        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: 'Shipment not found'
            });
        }

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        if (shipment.assignedVehicle) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle already assigned to this shipment'
            });
        }

        // Generate matrices
        const matrices = await generateMatrices();
        const { branchIdToLocation } = matrices;

        // Assign vehicle
        shipment.assignedVehicle = vehicle._id;
        if (vehicle.driverId) {
            shipment.assignedDriver = vehicle.driverId._id;
        }

        // Always set status to "In Transit" when vehicle is assigned, regardless of location
        shipment.status = "In Transit";
        
        // Update all parcels in this shipment to 'ShipmentAssigned' status
        await Parcel.updateMany(
            { _id: { $in: shipment.parcels } },
            { 
                $set: { 
                    status: 'ShipmentAssigned',
                    updatedAt: new Date()
                }
            }
        );

        console.log(`Updated ${shipment.parcels.length} parcels to ShipmentAssigned status for shipment ${shipment._id}`);
        
        const isAtSource = vehicle.currentBranch.equals(shipment.sourceCenter);
        
        // Mark vehicle as unavailable when assigned
        vehicle.available = false;
        await vehicle.save();

        let reverseShipmentDetails = null;

        // Handle reverse shipment creation if requested and vehicle is not at source
        if (shouldCreateReverse && !isAtSource) {
            try {
                const reverseResult = await createReverseShipment({
                    originalShipmentId: shipment._id,
                    vehicle: vehicle,
                    fromCenterId: vehicle.currentBranch,
                    toCenterId: shipment.sourceCenter,
                    shipmentType: shipment.deliveryType,
                    selectedParcelIds: [], // Empty for now, as reverse shipment parcels are found internally
                    assignedDriver: vehicle.driverId
                });
                
                if (reverseResult.success) {
                    reverseShipmentDetails = reverseResult;
                }
            } catch (error) {
                console.error('Error creating reverse shipment:', error);
            }
        }

        await shipment.save();

        return res.status(200).json({
            success: true,
            message: 'Vehicle assigned successfully',
            data: {
                shipmentDetails: {
                    shipmentId: shipment.shipmentId,
                    status: shipment.status,
                    assignedVehicle: {
                        vehicleId: vehicle.vehicleId,
                        registrationNo: vehicle.registrationNo
                    },
                    assignedDriver: vehicle.driverId ? {
                        driverId: vehicle.driverId.driverId,
                        name: vehicle.driverId.name,
                        contactNo: vehicle.driverId.contactNo,
                        licenseId: vehicle.driverId.licenseId
                    } : null
                },
                vehicle: {
                    vehicleId: vehicle.vehicleId,
                    registrationNo: vehicle.registrationNo,
                    currentLocation: branchIdToLocation[vehicle.currentBranch.toString()],
                    currentBranch: {
                        branchId: vehicle.currentBranch._id,
                        location: branchIdToLocation[vehicle.currentBranch.toString()],
                        branchName: vehicle.currentBranch.branchName || branchIdToLocation[vehicle.currentBranch.toString()]
                    },
                    isAtSource: isAtSource,
                    driver: vehicle.driverId ? {
                        driverId: vehicle.driverId.driverId,
                        name: vehicle.driverId.name,
                        contactNo: vehicle.driverId.contactNo,
                        licenseId: vehicle.driverId.licenseId
                    } : null
                },
                reverseShipment: reverseShipmentDetails
            }
        });

    } catch (error) {
        console.error('Error confirming vehicle assignment:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * ENHANCED VEHICLE ASSIGNMENT API - Find vehicle with parcel search logic
 * Implements the complete 6-step workflow as specified
 */
const enhancedFindVehicleForShipment = async (req, res) => {
    try {
        const { shipmentId, deliveryType } = req.params;
        console.log(`=== ENHANCED VEHICLE ASSIGNMENT START ===`);
        console.log(`Shipment ID: ${shipmentId}, Delivery Type: ${deliveryType}`);

        // Generate matrices needed for calculations
        const matrices = await generateMatrices();
        const { branchIdToLocation } = matrices;

        // Find the shipment by ID
        const shipment = await B2BShipment.findById(shipmentId)
            .populate('sourceCenter', 'location branchId')
            .populate({
                path: 'route',
                select: 'location branchId'
            });

        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: 'Shipment not found'
            });
        }

        // Verify the shipment type matches
        if (shipment.deliveryType.toLowerCase() !== deliveryType.toLowerCase()) {
            return res.status(400).json({
                success: false,
                message: `Shipment type mismatch. Expected: ${deliveryType}, Found: ${shipment.deliveryType}`
            });
        }

        // Get shipment details
        const sourceCenterId = shipment.sourceCenter._id;
        const sourceLocation = branchIdToLocation[sourceCenterId.toString()];
        const weightRequired = shipment.totalWeight;
        const volumeRequired = shipment.totalVolume;
        const shipmentRoute = shipment.route || [];

        console.log(`STEP 1: Shipment Analysis`);
        console.log(`Source: ${sourceLocation} (${sourceCenterId})`);
        console.log(`Route: ${shipmentRoute.map(r => r.location).join(' → ')}`);
        console.log(`Requirements: ${weightRequired}kg, ${volumeRequired}m³`);
        console.log(`Current weight: ${shipment.totalWeight}kg, volume: ${shipment.totalVolume}m³`);

        // STEP 2: Find nearest available vehicle using 3-step search
        console.log(`STEP 2: Vehicle Search (3-step approach)`);
        const vehicle = await findNearestVehicle(sourceCenterId, weightRequired, volumeRequired, matrices);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "No suitable vehicle available for this shipment",
                step: 'vehicle_search',
                requirements: {
                    sourceLocation,
                    weightRequired,
                    volumeRequired,
                    searchSteps: [
                        'Local vehicles at source center',
                        'Source-owned vehicles at other centers', 
                        'Vehicles from nearest centers'
                    ]
                }
            });
        }

        // Get the branch information for the vehicle's current location
        const vehicleBranch = await Branch.findById(vehicle.currentBranch);
        const vehicleBranchId = vehicleBranch._id;
        const vehicleLocation = branchIdToLocation[vehicleBranchId.toString()];
        const isVehicleAtSource = vehicleBranchId.equals(sourceCenterId);

        console.log(`STEP 3: Vehicle Found`);
        console.log(`Vehicle: ${vehicle.vehicleId} at ${vehicleLocation}`);
        console.log(`Is at source: ${isVehicleAtSource ? 'YES' : 'NO'}`);
        console.log(`Capacity: ${vehicle.capableWeight}kg, ${vehicle.capableVolume}m³`);

        // Prepare vehicle details
        const vehicleDetails = {
            _id: vehicle._id,
            vehicleId: vehicle.vehicleId,
            vehicleType: vehicle.vehicleType,
            capableWeight: vehicle.capableWeight,
            capableVolume: vehicle.capableVolume,
            assignedBranch: vehicle.assignedBranch,
            currentBranch: vehicle.currentBranch,
            currentLocation: vehicleLocation,
            sourceLocation: sourceLocation,
            isAtSource: isVehicleAtSource
        };

        // STEP 4: If vehicle is from another center, check for available parcels
        let availableParcelGroups = null;
        let parcelSearchLogic = null;
        
        if (!isVehicleAtSource) {
            console.log(`STEP 4: Vehicle from Another Center - Searching for Additional Parcels`);
            console.log(`Vehicle at: ${vehicleLocation}, needs to go to: ${sourceLocation}`);
            
            // Create destination centers list (exclude vehicle's current center from route)
            const destinationCenters = shipmentRoute
                .filter(center => !center._id.equals(vehicleBranchId))
                .map(center => center._id);
            
            console.log(`STEP 5: Parcel Search Logic`);
            console.log(`Key Check: Excluding ${vehicleLocation} (vehicle center) from parcel search`);
            console.log(`Searching for parcels FROM ${vehicleLocation} TO route centers:`);
            destinationCenters.forEach(centerId => {
                const centerName = branchIdToLocation[centerId.toString()];
                console.log(`  → ${centerName}`);
            });

            if (destinationCenters.length > 0) {
                const parcelSearchResult = await findAvailableParcelsForRoute(
                    vehicleBranchId, 
                    destinationCenters, 
                    deliveryType
                );

                console.log(`PARCEL SEARCH RESULT:`, parcelSearchResult);

                if (parcelSearchResult && parcelSearchResult.parcelGroups) {
                    console.log(`✅ PARCELS FOUND: ${parcelSearchResult.totalParcelsFound} parcels in ${parcelSearchResult.totalGroupsFound} groups`);
                    availableParcelGroups = parcelSearchResult;
                    
                    // STEP 6: Calculate capacity constraints
                    const constraints = {
                        express: { maxWeight: 1000, maxVolume: 5 },
                        standard: { maxWeight: 2500, maxVolume: 10 }
                    };
                    
                    const vehicleConstraints = constraints[deliveryType.toLowerCase()] || constraints.standard;
                    const remainingWeight = vehicleConstraints.maxWeight - shipment.totalWeight;
                    const remainingVolume = vehicleConstraints.maxVolume - shipment.totalVolume;
                    
                    console.log(`STEP 6: Capacity Validation`);
                    console.log(`Vehicle limits: ${vehicleConstraints.maxWeight}kg, ${vehicleConstraints.maxVolume}m³`);
                    console.log(`Current shipment: ${shipment.totalWeight}kg, ${shipment.totalVolume}m³`);
                    console.log(`Remaining capacity: ${remainingWeight}kg, ${remainingVolume}m³`);

                    // Add capacity validation to each group
                    let totalGroupWeight = 0;
                    let totalGroupVolume = 0;
                    
                    Object.values(parcelSearchResult.parcelGroups).forEach(group => {
                        totalGroupWeight += group.totalWeight;
                        totalGroupVolume += group.totalVolume;
                        
                        group.canAddAll = (group.totalWeight <= remainingWeight && group.totalVolume <= remainingVolume);
                        group.remainingWeight = remainingWeight;
                        group.remainingVolume = remainingVolume;
                        
                        if (!group.canAddAll) {
                            // Calculate maximum parcels that can fit
                            let runningWeight = 0;
                            let runningVolume = 0;
                            let maxParcels = 0;

                            for (const parcel of group.parcels) {
                                if (runningWeight + parcel.weight <= remainingWeight && 
                                    runningVolume + parcel.volume <= remainingVolume) {
                                    runningWeight += parcel.weight;
                                    runningVolume += parcel.volume;
                                    maxParcels++;
                                } else {
                                    break;
                                }
                            }

                            group.maxPossibleParcels = maxParcels;
                            group.maxPossibleWeight = runningWeight;
                            group.maxPossibleVolume = runningVolume;
                        }
                    });

                    // Check if all parcels together would exceed capacity
                    const wouldExceedCapacity = (totalGroupWeight > remainingWeight) || (totalGroupVolume > remainingVolume);
                    
                    console.log(`STEP 6: Capacity Analysis`);
                    console.log(`All parcels total: ${totalGroupWeight}kg, ${totalGroupVolume}m³`);
                    console.log(`Remaining capacity: ${remainingWeight}kg, ${remainingVolume}m³`);
                    console.log(`Would exceed capacity: ${wouldExceedCapacity ? 'YES' : 'NO'}`);

                    // Add capacity analysis to the response
                    availableParcelGroups.capacityAnalysis = {
                        totalParcelWeight: totalGroupWeight,
                        totalParcelVolume: totalGroupVolume,
                        remainingWeight: remainingWeight,
                        remainingVolume: remainingVolume,
                        wouldExceedCapacity: wouldExceedCapacity,
                        exceededBy: wouldExceedCapacity ? {
                            weight: Math.max(0, totalGroupWeight - remainingWeight),
                            volume: Math.max(0, totalGroupVolume - remainingVolume)
                        } : null
                    };
                }
            } else {
                console.log(`❌ NO PARCELS FOUND: parcelSearchResult was null, empty, or had no parcelGroups`);
                console.log(`Search details: Vehicle at ${vehicleLocation}, destinations:`, destinationCenters.map(id => branchIdToLocation[id.toString()]));
            }

            parcelSearchLogic = {
                vehicleCenter: vehicleLocation,
                searchedDestinations: destinationCenters.map(id => branchIdToLocation[id.toString()]),
                excludedFromSearch: vehicleLocation,
                reason: 'Vehicle center excluded from search as per requirements'
            };
        }

        // Prepare response with all the required information
        const response = {
            success: true,
            step: isVehicleAtSource ? 'vehicle_at_source' : 'vehicle_from_other_center',
            vehicle: vehicleDetails,
            shipmentDetails: {
                shipmentId: shipment.shipmentId,
                deliveryType: shipment.deliveryType,
                sourceCenter: sourceLocation,
                route: shipmentRoute.map(r => r.location),
                totalWeight: shipment.totalWeight,
                totalVolume: shipment.totalVolume,
                parcelCount: shipment.parcelCount,
                requirements: {
                    weightRequired,
                    volumeRequired
                }
            },
            needsTransport: !isVehicleAtSource,
            message: isVehicleAtSource ? 
                `✅ Vehicle ${vehicle.vehicleId} found at source location ${sourceLocation}` :
                `🚚 Vehicle ${vehicle.vehicleId} found at ${vehicleLocation}, transport required to ${sourceLocation}`
        };

        // Add parcel information if vehicle is from another center
        if (!isVehicleAtSource) {
            if (availableParcelGroups && availableParcelGroups.parcelGroups && Object.keys(availableParcelGroups.parcelGroups).length > 0) {
                // Parcels found - include them in the response
                response.availableParcelGroups = availableParcelGroups;
                response.parcelSearchLogic = parcelSearchLogic;
                response.userOptions = {
                    assignOnly: "Assign Vehicle Only - Immediate assignment",
                    checkParcels: "Check for Parcels - Search and select additional parcels to carry"
                };
                console.log(`✅ PARCELS FOUND: ${availableParcelGroups.totalParcelsFound} parcels in ${availableParcelGroups.totalGroupsFound} groups`);
            } else {
                // No parcels found - still provide structure but empty
                response.availableParcelGroups = {
                    constraints: {
                        maxWeight: 2500,
                        maxVolume: 10,
                        currentWeight: shipment.totalWeight,
                        currentVolume: shipment.totalVolume,
                        remainingWeight: 2500 - shipment.totalWeight,
                        remainingVolume: 10 - shipment.totalVolume
                    },
                    parcelGroups: {},
                    totalGroupsFound: 0,
                    totalParcelsFound: 0
                };
                response.parcelSearchLogic = parcelSearchLogic || {
                    vehicleCenter: vehicleLocation,
                    searchedDestinations: [],
                    excludedFromSearch: vehicleLocation,
                    reason: 'No parcels found for route'
                };
                response.userOptions = {
                    assignOnly: "Assign Vehicle Only - No additional parcels available"
                };
                console.log(`ℹ️ NO PARCELS FOUND: Vehicle can be assigned but no additional parcels available`);
            }
        }

        console.log(`=== ENHANCED VEHICLE ASSIGNMENT COMPLETE ===`);
        console.log(`Response: ${isVehicleAtSource ? 'DIRECT ASSIGNMENT' : 'PARCEL SELECTION REQUIRED'}`);
        
        return res.status(200).json(response);

    } catch (error) {
        console.error('Error in enhanced vehicle assignment:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during vehicle assignment',
            error: error.message
        });
    }
};

/**
 * Add selected parcels to current shipment and finalize assignment
 */
const addParcelsToCurrentShipment = async (req, res) => {
    try {
        const { shipmentId } = req.params;
        const { selectedParcelIds, vehicleId } = req.body;

        console.log(`=== ADDING PARCELS TO CURRENT SHIPMENT ===`);
        console.log(`Shipment ID: ${shipmentId}`);
        console.log(`Selected Parcels: ${selectedParcelIds?.length || 0}`);
        console.log(`Vehicle ID: ${vehicleId}`);

        // Find the shipment
        const shipment = await B2BShipment.findById(shipmentId);
        if (!shipment) {
            return res.status(404).json({
                success: false,
                message: 'Shipment not found'
            });
        }

        // Find the vehicle
        const vehicle = await Vehicle.findOne({ vehicleId: vehicleId });
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        // Get selected parcels
        const selectedParcels = await Parcel.find({ _id: { $in: selectedParcelIds } })
            .populate('from', 'location')
            .populate('to', 'location');

        if (selectedParcels.length !== selectedParcelIds.length) {
            return res.status(400).json({
                success: false,
                message: 'Some selected parcels not found'
            });
        }

        // Calculate additional weight and volume
        const sizeSpecs = {
            small: { weight: 2, volume: 0.2 },
            medium: { weight: 5, volume: 0.5 },
            large: { weight: 10, volume: 1 }
        };

        let additionalWeight = 0;
        let additionalVolume = 0;
        const parcelSummary = [];

        selectedParcels.forEach(parcel => {
            const itemSize = parcel.itemSize?.toLowerCase() || 'medium';
            const sizeSpec = sizeSpecs[itemSize] || sizeSpecs.medium;
            
            additionalWeight += sizeSpec.weight;
            additionalVolume += sizeSpec.volume;

            parcelSummary.push({
                parcelId: parcel.parcelId,
                trackingNo: parcel.trackingNo,
                from: parcel.from?.location,
                to: parcel.to?.location,
                itemType: parcel.itemType,
                itemSize: parcel.itemSize,
                weight: sizeSpec.weight,
                volume: sizeSpec.volume,
                status: parcel.status
            });
        });

        // Update parcels with shipment ID
        await Parcel.updateMany(
            { _id: { $in: selectedParcelIds } },
            { 
                shipmentId: shipment._id,
                status: 'InTransit',
                updatedAt: new Date()
            }
        );

        // Update shipment with new totals and parcels
        const newTotalWeight = shipment.totalWeight + additionalWeight;
        const newTotalVolume = shipment.totalVolume + additionalVolume;
        const newParcelCount = shipment.parcelCount + selectedParcels.length;

        // Add selected parcels to existing parcels array
        const existingParcels = shipment.parcels || [];
        const updatedParcels = [...existingParcels, ...selectedParcelIds];

        // Update the shipment
        await B2BShipment.findByIdAndUpdate(shipmentId, {
            totalWeight: newTotalWeight,
            totalVolume: newTotalVolume,
            parcelCount: newParcelCount,
            parcels: updatedParcels,
            assignedVehicle: vehicle._id,
            status: 'In Transit',
            updatedAt: new Date()
        });

        // Mark vehicle as unavailable
        vehicle.available = false;
        vehicle.currentShipment = shipment._id;
        await vehicle.save();

        console.log(`✅ Successfully added ${selectedParcels.length} parcels to shipment`);
        console.log(`Updated totals: ${newTotalWeight}kg, ${newTotalVolume}m³, ${newParcelCount} parcels`);

        return res.status(200).json({
            success: true,
            message: `Successfully added ${selectedParcels.length} parcels to shipment and assigned vehicle`,
            data: {
                shipmentId: shipment.shipmentId,
                addedParcels: selectedParcels.length,
                parcelSummary: parcelSummary,
                updatedTotals: {
                    totalWeight: newTotalWeight,
                    totalVolume: newTotalVolume,
                    parcelCount: newParcelCount
                },
                additionalTotals: {
                    additionalWeight,
                    additionalVolume,
                    additionalParcels: selectedParcels.length
                },
                vehicleAssigned: {
                    vehicleId: vehicle.vehicleId,
                    currentLocation: vehicle.currentBranch,
                    status: 'Assigned'
                },
                shipmentStatus: 'In Transit'
            }
        });

    } catch (error) {
        console.error('❌ Error adding parcels to current shipment:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = { 
    assignVehicle, 
    findVehicleForShipment, 
    findParcelsForVehicleTransport, 
    createVehicleTransportWithParcels, 
    createReverseShipment, 
    getPendingB2BShipments,
    getShipmentsByBranch,
    assignVehicleManual,
    assignVehicleSmart,
    confirmVehicleAssignment,
    // PHASE 4 - Additional Parcels functionality
    getAvailableParcelsForShipment,
    addParcelsToShipment,
    findAdditionalParcels,
    // ENHANCED API
    enhancedFindVehicleForShipment,
    findAvailableParcelsForRoute,
    addParcelsToCurrentShipment
};