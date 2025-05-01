//http://localhost:5000/standardShipments/notifyAboutShipment/67bcec6e8a5f92217616f7e6
const { time } = require("console");
const Shipment = require("../../models/B2BShipmentModel");
const Parcel = require("../../models/ParcelModel");
const timeMatrix = {
  Center01: { Center02: 5, Center03: 6, Center04: 4, Center05: 3 },
  Center02: { Center01: 5, Center03: 4, Center04: 5, Center05: 5 },
  Center03: { Center01: 6, Center02: 4, Center04: 2, Center05: 5 },
  Center04: { Center01: 4, Center02: 5, Center03: 2, Center05: 5 },
  Center05: { Center01: 3, Center02: 5, Center03: 5, Center04: 5 },
};

const maxWeight = 2500;
const maxVolume = 10;

async function processParcelsForShipment(shipment, nextCenter) {
  try {
    // Get the current center index in the shipment route
    const currentIndex = shipment.route.indexOf(shipment.currentLocation);
    if (currentIndex === -1) {
      console.error("Current center not found in route");
      return false;
    }

    console.log(`Processing parcels at ${shipment.currentLocation}`);

    // Get the remaining centers in the shipment route
    const remainingCenters = shipment.route.slice(currentIndex + 1);
    console.log("Remaining centers in route:", remainingCenters);

    if (remainingCenters.length === 0) {
      console.log("No remaining centers to process.");
      shipment.status = "Completed";
      return false;
    }

    // Fetch parcels that are at the current location and destined for remaining centers
    let parcelsToProcess = await Parcel.find({
      destination: { $in: remainingCenters },
      sourceCenter: shipment.currentLocation,
      shipmentId: null,
      weight: { $lte: maxWeight },
      volume: { $lte: maxVolume },
      deliveryType: "Standard",
    });

    if (parcelsToProcess.length === 0) {
      console.log("No parcels available for processing.");
      return false;
    }

    console.log("Retrieved parcels:", parcelsToProcess);

    // Group parcels by destination center
    let groupedParcels = {};
    parcelsToProcess.forEach((parcel) => {
      if (!groupedParcels[parcel.destination]) {
        groupedParcels[parcel.destination] = [];
      }
      groupedParcels[parcel.destination].push(parcel);
    });

    // Iterate through each group and check constraints
    for (const [center, parcels] of Object.entries(groupedParcels)) {
      let totalWeight = parcels.reduce((sum, p) => sum + p.weight, 0);
      let totalVolume = parcels.reduce((sum, p) => sum + p.volume, 0);

      console.log(
        `Checking parcels from ${shipment.currentLocation} to ${center}: Total Weight=${totalWeight}, Total Volume=${totalVolume}`,
      );

      // Check if adding parcels exceeds shipment constraints
      if (
        shipment.totalWeight + totalWeight > maxWeight ||
        shipment.totalVolume + totalVolume > maxVolume
      ) {
        console.log(`Shipment constraints exceeded. Stopping process.`);
        shipment.status = "Completed";
        return false;
      }

      // Add parcels to shipment
      parcels.forEach((parcel) => {
        parcel.shipmentId = shipment.id;
      });

      shipment.parcels.push(...parcels);
      shipment.totalWeight += totalWeight;
      shipment.totalVolume += totalVolume;
      shipment.parcelCount += parcels.length;

      console.log(`Added parcels to shipment: 
                Updated weight: ${shipment.totalWeight}, 
                Volume: ${shipment.totalVolume}`);
    }
    const parcelIds = shipment.parcels.map((parcel) => parcel._id);
    await Parcel.updateMany(
      { _id: { $in: parcelIds } },
      { shipmentId: shipment.id },
    );
    console.log("Parcels successfully added. Continuing shipment.");
    return true;
  } catch (error) {
    console.error("Parcel processing error:", error);
    return false;
  }
}

async function notifyNextCenter(shipmentId) {
  try {
    const shipment = await Shipment.findOne({
      id: shipmentId,
      deliveryType: "Standard",
    });

    if (!shipment) {
      console.error("Shipment not found:", shipmentId);
      return null;
    }

    const lastCenter = shipment.route[shipment.route.length - 1];
    console.log("Last center:", lastCenter);
    console.log("Current location:", shipment.currentLocation);

    const currentIndex = shipment.route.indexOf(shipment.currentLocation);

    if (currentIndex === -1) {
      console.error("Error: Current location not found in route.");
      return null;
    }

    const currentCenter = shipment.route[currentIndex];
    const nextCenter = shipment.route[currentIndex + 1];

    console.log("Next center:", nextCenter || "None (End of Route)");
    // If shipment has reached the final center
    if (currentCenter === lastCenter) {
      console.log(
        `Shipment has reached the final center: ${shipment.currentLocation}`,
      );
      shipment.status = "Completed";
      await shipment.save();
      return shipment; // ✅ Ensure final shipment is returned
    }

    const estimatedTimesMap = Object.fromEntries(
      (shipment.arrivalTimes || []).map(({ center, time }) => [center, time]),
    );

    if (currentCenter === lastCenter) {
      let timeArrive = estimatedTimesMap?.[currentCenter] ?? "Unknown";
      console.log(
        `Notifying ${currentCenter} about shipment ${shipmentId}. Arrival in ${timeArrive} hours.`,
      );
    } else {
      let timeArrive = estimatedTimesMap?.[nextCenter] ?? "Unknown";
      console.log(
        `Notifying ${nextCenter} about shipment ${shipmentId}. Arrival in ${timeArrive} hours.`,
      );
    }

    // Process parcels for next center
    const addedParcels = await processParcelsForShipment(shipment, nextCenter);
    console.log("Added parcels:", addedParcels);

    // Move shipment to next center
    shipment.currentLocation = nextCenter;
    shipment.status = "In Transit";
    await shipment.save();

    // Continue to the next center and return its result
    return await notifyNextCenter(shipmentId); // ✅ Ensure recursion returns a value
  } catch (error) {
    console.error("Notification error:", error);
    return null;
  }
}

module.exports = { notifyNextCenter };
