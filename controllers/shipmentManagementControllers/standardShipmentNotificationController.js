// //http://localhost:5000/standardShipments/notifyAboutShipment/67bcec6e8a5f92217616f7e6
// const { time } = require('console');
// const Shipment = require('../../models/B2BShipmentModel');
// const Parcel = require('../../models/ParcelModel');
// const timeMatrix = {
//     Center01: { Center02: 5, Center03: 6, Center04: 4, Center05: 3 },
//     Center02: { Center01: 5, Center03: 4, Center04: 5, Center05: 5 },
//     Center03: { Center01: 6, Center02: 4, Center04: 2, Center05: 5 },
//     Center04: { Center01: 4, Center02: 5, Center03: 2, Center05: 5 },
//     Center05: { Center01: 3, Center02: 5, Center03: 5, Center04: 5 }
// };

// const maxWeight = 2500;
// const maxVolume = 10;





// async function processParcelsForShipment(shipment, nextCenter) {
//     try {
//         // Get the current center index in the shipment route
//         const currentIndex = shipment.route.indexOf(shipment.currentLocation);
//         if (currentIndex === -1) {
//             console.error('Current center not found in route');
//             return false;
//         }

//         console.log(`Processing parcels at ${shipment.currentLocation}`);

//         // Get the remaining centers in the shipment route
//         const remainingCenters = shipment.route.slice(currentIndex + 1);
//         console.log('Remaining centers in route:', remainingCenters);

//         if (remainingCenters.length === 0) {
//             console.log('No remaining centers to process.');
//             shipment.status = 'Completed';
//             return false;
//         }

//         // Fetch parcels that are at the current location and destined for remaining centers
//         let parcelsToProcess = await Parcel.find({
//             destination: { $in: remainingCenters },
//             sourceCenter: shipment.currentLocation,
//             shipmentId: null,
//             weight: { $lte: maxWeight },
//             volume: { $lte: maxVolume },
//             deliveryType: "Standard"
//         });

//         if (parcelsToProcess.length === 0) {
//             console.log('No parcels available for processing.');
//             return false;
//         }

//         console.log('Retrieved parcels:', parcelsToProcess);

//         // Group parcels by destination center
//         let groupedParcels = {};
//         parcelsToProcess.forEach(parcel => {
//             if (!groupedParcels[parcel.destination]) {
//                 groupedParcels[parcel.destination] = [];
//             }
//             groupedParcels[parcel.destination].push(parcel);
//         });

//         // Iterate through each group and check constraints
//         for (const [center, parcels] of Object.entries(groupedParcels)) {
//             let totalWeight = parcels.reduce((sum, p) => sum + p.weight, 0);
//             let totalVolume = parcels.reduce((sum, p) => sum + p.volume, 0);

//             console.log(`Checking parcels from ${shipment.currentLocation} to ${center}: Total Weight=${totalWeight}, Total Volume=${totalVolume}`);

//             // Check if adding parcels exceeds shipment constraints
//             if ((shipment.totalWeight + totalWeight) > maxWeight ||
//                 (shipment.totalVolume + totalVolume) > maxVolume) {
//                 console.log(`Shipment constraints exceeded. Stopping process.`);
//                 shipment.status = 'Completed';
//                 return false;
//             }

//             // Add parcels to shipment
//             parcels.forEach(parcel => {
//                 parcel.shipmentId = shipment.id;
//             });

//             shipment.parcels.push(...parcels);
//             shipment.totalWeight += totalWeight;
//             shipment.totalVolume += totalVolume;
//             shipment.parcelCount += parcels.length;

//             console.log(`Added parcels to shipment:
//                 Updated weight: ${shipment.totalWeight},
//                 Volume: ${shipment.totalVolume}`);
//         }
//         const parcelIds = shipment.parcels.map(parcel => parcel._id);
//         await Parcel.updateMany({ _id: { $in: parcelIds } }, { shipmentId: shipment.id });
//         console.log('Parcels successfully added. Continuing shipment.');
//         return true;

//     } catch (error) {
//         console.error('Parcel processing error:', error);
//         return false;
//     }
// }


// async function notifyNextCenter(shipmentId) {
//     try {
//         const shipment = await Shipment.findOne({
//             id: shipmentId,
//             deliveryType: "Standard"
//         });

//         if (!shipment) {
//             console.error('Shipment not found:', shipmentId);
//             return null;
//         }

//         const lastCenter = shipment.route[shipment.route.length - 1];
//         console.log('Last center:', lastCenter);
//         console.log('Current location:', shipment.currentLocation);

//         const currentIndex = shipment.route.indexOf(shipment.currentLocation);


//         if (currentIndex === -1) {
//             console.error('Error: Current location not found in route.');
//             return null;
//         }



//         const currentCenter = shipment.route[currentIndex];
//         const nextCenter = shipment.route[currentIndex + 1];

//         console.log('Next center:', nextCenter || "None (End of Route)");
//         // If shipment has reached the final center
//         if (currentCenter === lastCenter) {
//             console.log(`Shipment has reached the final center: ${shipment.currentLocation}`);
//             shipment.status = 'Completed';
//             await shipment.save();
//             return shipment;  // ✅ Ensure final shipment is returned
//         }

//         const estimatedTimesMap = Object.fromEntries(
//             (shipment.arrivalTimes || []).map(({ center, time }) => [center, time])
//         );

//         if (currentCenter === lastCenter) {
//             let timeArrive = estimatedTimesMap?.[currentCenter] ?? "Unknown";
//             console.log(`Notifying ${currentCenter} about shipment ${shipmentId}. Arrival in ${timeArrive} hours.`);
//         } else {
//             let timeArrive = estimatedTimesMap?.[nextCenter] ?? "Unknown";
//             console.log(`Notifying ${nextCenter} about shipment ${shipmentId}. Arrival in ${timeArrive} hours.`);
//         }



//         // Process parcels for next center
//         const addedParcels = await processParcelsForShipment(shipment, nextCenter);
//         console.log('Added parcels:', addedParcels);

//         // Move shipment to next center
//         shipment.currentLocation = nextCenter;
//         shipment.status = 'In Transit';
//         await shipment.save();

//         // Continue to the next center and return its result
//         return await notifyNextCenter(shipmentId);  // ✅ Ensure recursion returns a value

//     } catch (error) {
//         console.error('Notification error:', error);
//         return null;
//     }
// }



const mongoose = require('mongoose');
const Shipment = require('../../models/B2BShipmentModel');
const Parcel = require('../../models/ParcelModel');
const Branch = require('../../models/BranchesModel');

// Maximum weight and volume constraints for standard shipments
const MAX_WEIGHT = 5000; // in kg
const MAX_VOLUME = 20;   // in cubic meters

/**
 * Process a standard shipment through its route
 * This function simulates moving a shipment through its route, collecting parcels at each stop
 * @param {String} shipmentId - The MongoDB ObjectId of the shipment to process
 * @returns {Promise<Object|null>} - The processed shipment or null if error
 */
async function processStandardShipment(shipmentId) {
    try {
        // Find the shipment by ID and populate parcels
        const shipment = await Shipment.findById(shipmentId)
            .populate('parcels');

        if (!shipment) {
            console.error(`Shipment not found: ${shipmentId}`);
            return null;
        }

        // Ensure it's a standard shipment
        if (shipment.deliveryType !== "Standard") {
            console.error(`Not a standard shipment: ${shipmentId}`);
            return null;
        }

        // Get the start location and store it to return to at the end
        const startLocation = shipment.currentLocation;
        console.log(`Starting to process standard shipment ${shipment.shipmentId} from ${startLocation}`);

        // Process the full route - go through each center in order
        for (let i = 0; i < shipment.route.length - 1; i++) {
            const currentCenter = shipment.route[i];
            const nextCenter = shipment.route[i + 1];

            // If we're at the current location, start the process
            if (i >= shipment.route.indexOf(shipment.currentLocation)) {
                console.log(`Processing at center: ${currentCenter}, next destination: ${nextCenter}`);

                // 1. Process parcels at current center going to remaining centers
                await processParcelsAtCenter(shipment, i);

                // 2. Notify the next center about the shipment arrival
                const nextArrival = shipment.arrivalTimes.find(at => at.center === nextCenter);
                const estimatedArrival = nextArrival ? nextArrival.time : "Unknown";
                console.log(`Notifying ${nextCenter} about incoming shipment. ETA: ${estimatedArrival} hours`);

                // 3. Update shipment location to the next center for processing
                shipment.currentLocation = nextCenter;
                shipment.status = 'In Transit';
               // await shipment.save();

                // 4. Update status of all parcels in this shipment that haven't reached their destination
                await Parcel.updateMany(
                    {
                        shipmentId: shipment._id,
                        status: { $ne: "ArrivedAtCollectionCenter" }
                    },
                    { status: "InTransit" }
                );
            }
        }

        // After processing the entire route, update parcels at the final destination
        const finalCenter = shipment.route[shipment.route.length - 1];
        console.log(`Shipment ${shipment.shipmentId} has reached final destination: ${finalCenter}`);

        // Update parcels that have reached their final destination
        await updateParcelsAtFinalDestination(shipment);

        // Return shipment to starting center
        shipment.currentLocation = startLocation;
        shipment.status = 'Completed';
        //await shipment.save();

        console.log(`Shipment processing completed and returned to ${startLocation}`);
        return shipment;
    } catch (error) {
        console.error('Error processing standard shipment:', error);
        return null;
    }
}

/**
 * Process parcels at a center and add them to the shipment
 * @param {Object} shipment - The shipment object
 * @param {Number} centerIndex - Index of the current center in the route
 * @returns {Promise<Boolean>} - Whether parcels were added
 */
async function processParcelsAtCenter(shipment, centerIndex) {
    try {
        const currentCenter = shipment.route[centerIndex];
        const remainingCenters = shipment.route.slice(centerIndex + 1);

        console.log(`Looking for parcels at ${currentCenter} heading to: ${remainingCenters.join(', ')}`);

        if (remainingCenters.length === 0) {
            return false;
        }

        // Find the branch documents for current and remaining centers
        const branches = await Branch.find({
            location: { $in: [currentCenter, ...remainingCenters] }
        });

        // Create a map of location names to branch ObjectIds
        const locationToBranchObjectId = {};
        branches.forEach(branch => {
            locationToBranchObjectId[branch.location] = branch._id;
        });

        // Verify we have the branch ObjectId for current location
        if (!locationToBranchObjectId[currentCenter]) {
            console.log(`Could not find branch for location: ${currentCenter}`);
            return false;
        }

        // Get target branch ObjectIds from the remaining centers
        const targetBranchIds = remainingCenters
            .map(center => locationToBranchObjectId[center])
            .filter(id => id); // Filter out any undefined values

        if (targetBranchIds.length === 0) {
            console.log(`No target branches found for remaining centers`);
            return false;
        }

        // Find parcels at current center's branch going to remaining centers' branches
        const parcelsToProcess = await Parcel.find({
            from: locationToBranchObjectId[currentCenter], // Reference branch by ObjectId
            to: { $in: targetBranchIds }, // Reference destination branches by ObjectId
            shipmentId: null, // Not assigned to any shipment yet
            shippingMethod: "Standard"
        });

        if (parcelsToProcess.length === 0) {
            console.log(`No eligible parcels found at ${currentCenter}`);
            return false;
        }

        console.log(`Found ${parcelsToProcess.length} parcels to process at ${currentCenter}`);

        // Process each parcel
        let addedCount = 0;
        for (const parcel of parcelsToProcess) {
            // Calculate weight and volume based on item size
            const weightMap = { small: 1, medium: 3, large: 8 };
            const volumeMap = { small: 0.1, medium: 0.3, large: 0.8 };

            const parcelWeight = weightMap[parcel.itemSize] || 1;
            const parcelVolume = volumeMap[parcel.itemSize] || 0.1;

            // Check if adding this parcel would exceed shipment constraints
            if (shipment.totalWeight + parcelWeight > MAX_WEIGHT ||
                shipment.totalVolume + parcelVolume > MAX_VOLUME) {
                console.log(`Cannot add parcel ${parcel._id} - would exceed capacity`);
                continue;
            }

            // Add parcel to shipment
            shipment.parcels.push(parcel._id);
            shipment.totalWeight += parcelWeight;
            shipment.totalVolume += parcelVolume;
            shipment.parcelCount += 1;

            // Update parcel record
            parcel.shipmentId = shipment._id;
            parcel.status = "ShipmentAssigned";
            //await parcel.save();

            addedCount++;
        }

        if (addedCount > 0) {
            console.log(`Added ${addedCount} parcels to shipment ${shipment.shipmentId}`);
            //await shipment.save();
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error processing parcels at center:', error);
        return false;
    }
}

/**
 * Update parcels that have reached their final destination
 * @param {Object} shipment - The shipment object
 * @returns {Promise<Boolean>} - Whether update was successful
 */
async function updateParcelsAtFinalDestination(shipment) {
    try {
        const finalCenter = shipment.route[shipment.route.length - 1];

        // Find the branch document for the final center
        const finalBranch = await Branch.findOne({ location: finalCenter });

        if (!finalBranch) {
            console.log(`Could not find branch for final location: ${finalCenter}`);
            return false;
        }

        // Update parcels that have reached their destination
        const updateResult = await Parcel.updateMany(
            {
                shipmentId: shipment._id,
                toBranch: finalBranch._id // Use the branch ObjectId
            },
            {
                status: "ArrivedAtCollectionCenter",
                arrivedToCollectionCenterTime: new Date()
            }
        );

        console.log(`Updated ${updateResult.modifiedCount} parcels at final destination ${finalCenter}`);
        return true;
    } catch (error) {
        console.error('Error updating parcels at final destination:', error);
        return false;
    }
} 

// Export the main function
module.exports = { processStandardShipment };