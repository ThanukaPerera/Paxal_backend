


//http://localhost:8000/vehicles/assignVehicleToShipment/68136ad65f32baa9ccd2e923/express

const Vehicle = require("../../models/VehicleModel");
const B2BShipment = require("../../models/B2BShipmentModel");
const Parcel = require('../../models/parcelModel');
const Branch = require('../../models/BranchesModel');

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

        // Get selected parcels and calculate totals
        const selectedParcels = await Parcel.find({ _id: { $in: selectedParcelIds } });
        
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
            parcels: selectedParcelIds,
            isVehicleTransport: false, // STEP 5: Set to false after assignment
            isReverseShipment: true, // STEP 4: Mark as reverse shipment
            reverseShipmentDetails: {
                originalShipmentId: originalShipmentId,
                transportShipmentId: reverseShipmentId,
                vehicleFromCenter: fromLocation,
                vehicleToCenter: toLocation,
                parcelsCarried: selectedParcelIds,
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
            console.log(`Updated parcel ${parcel._id} for reverse shipment`);
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
                    parcelsCarried: selectedParcelIds,
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
                parcelsCarried: selectedParcelIds,
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

module.exports = { assignVehicle, findVehicleForShipment, findParcelsForVehicleTransport, createVehicleTransportWithParcels, createReverseShipment };