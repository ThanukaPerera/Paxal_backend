const Parcel = require("../../../models/parcelModel");
const VehicleSchedule = require("../../../models/VehicleScheduleModel");
const Staff = require("../../../models/StaffModel");
const mongoose = require("mongoose");

const fetchOrderPlacedTime = async (parcelId) => {
  const parcel = await Parcel.findOne({ _id: parcelId })
    .select("createdAt from submittingType")
    .populate("from", "location")
    .lean()
    .exec();

  if (!parcel) {
    return null;
  }

  const handledBy =
    parcel?.submittingType === "pickup" ? "User (Pickup)" : "Branch";
  const note = "-";

  return {
    status: "order placed",
    time: parcel?.createdAt,
    location: parcel?.from?.location,
    handledBy,
    note,
  };
};
const findPendingPickupDetails = async (parcelId) => {
  try {
    const parcel = await Parcel.findOne({ _id: parcelId })
      .select("pickupInformation from submittingType")
      .lean()
      .populate("pickupInformation.staffId", "name") // Populate only the name field
      .populate("from", "location"); // Populate only the location field

    if (
      !parcel ||
      (parcel.submittingType === "pickup" && !parcel?.pickupInformation)
    ) {
      return null;
    }

    // Only return pickup details if submittingType is "pickup"
    if (parcel.submittingType !== "pickup") {
      return null;
    }

    return {
      status: "Pending Pickup",
      time: parcel?.pickupInformation?.createdAt || null,
      location: parcel?.from?.location || "Unknown",
      handledBy: parcel?.pickupInformation?.staffId?.name || "Not Assigned",
    };
  } catch (error) {
    console.error("Error fetching pending pickup details:", error);
    return null;
  }
};

const findDeliveryDetails = async (parcelId) => {
  const parcel = await Parcel.findOne({ _id: parcelId })
    .select()
    .lean()
    .populate("deliveryInformation.staffId", "name")
    .populate("from", "location");

  if (!parcel) return null;
  if (parcel.submittingType !== "delivery") {
    return null;
  }
  console.log("Parcel details for delivery:", parcel);
  return {
    status: "Delivery Dispatched",
    time: parcel?.deliveryInformation?.createdAt,
    location: parcel?.from?.location,
    handledBy: parcel?.deliveryInformation?.name || "Driver",
  };
};

const findPickedUpDetails = async (parcelId) => {
  const parcel = await Parcel.findOne({ _id: parcelId })
    .select()
    .lean()
    .populate("pickupInformation");

  if (!parcel) return null;
  if (parcel.submittingType !== "pickup") {
    return null;
  }

  return {
    status: "PickedUp",
    time: parcel?.pickupInformation?.pickupTime,
    location: parcel?.pickupInformation?.address || parcel?.from?.location,
    handledBy: "Put the driver name here" || parcel?.from?.location,
  };
};

const findArrivedAtDistributionCenterDetails = async (parcelId) => {
  const parcel = await Parcel.findOne({ _id: parcelId })
    .select()
    .lean()
    .populate("pickupInformation");

  if (!parcel) return null;
  if (parcel.submittingType !== "pickup") {
    return null;
  }

  return {
    status: "Arrived to distribution center",
    time: parcel?.pickupInformation?.pickupTime,
    location: parcel?.pickupInformation?.address || parcel?.from?.location,
    handledBy: "Put the driver name here" || parcel?.from?.location,
  };
};

const findShipmentAssignedDetails = async (parcelId) => {
  const parcel = await Parcel.findOne({ _id: parcelId })
    .select()
    .lean()
    .populate("pickupInformation");

  if (!parcel) return null;

  return {
    status: "Shipment Assigned",
    time: parcel?.pickupInformation?.pickupTime,
    location: parcel?.pickupInformation?.address || parcel?.from?.location,
    handledBy: "Put the driver name here" || parcel?.from?.location,
  };
};

const findInTransitDetails = async (parcelId) => {
  const parcel = await Parcel.findOne({ _id: parcelId })
    .select()
    .lean()
    .populate("deliveryInformation.staffId");

  if (!parcel) return null;

  return {
    status: "In Transit",
    time: parcel?.deliveryInformation?.createdAt,
    location: parcel?.from?.location,
    handledBy: parcel?.deliveryInformation?.staffId,
  };
};
const findArrivedAtCollectionCenterDetails = async (parcelId) => {
  const parcel = await Parcel.findOne({ _id: parcelId })
    .select()
    .lean()

    .populate("to", "location")
    .populate("orderPlacedStaffId", "name");

  if (!parcel) return null;

  return {
    status: "Arrived to Collection Center",
    time: parcel?.arrivedToCollectionCenterTime || null,
    location: parcel?.to?.location || "Unknown",
    handledBy: `${parcel?.orderPlacedStaffId?.name}(staff)` || "Not Assigned",
  };
};
const findDeliveredDetails = async (parcelId) => {
  const parcel = await Parcel.findOne({ _id: parcelId })
    .select()
    .lean()
    .populate("deliveryInformation.staffId");

  if (!parcel) return null;
  if (parcel.submittingType !== "delivery") {
    return null;
  }
  return {
    status: "Delivered",
    time: parcel?.deliveryInformation?.createdAt,
    location: parcel?.from?.location,
    handledBy: parcel?.deliveryInformation?.name,
  };
};

const trackStatuses = async (req, res) => {
  try {
    const parcelId = req.params.parcelId;

    if (!mongoose.Types.ObjectId.isValid(parcelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid parcel ID",
      });
    }

    const orderPlacedDetails = await fetchOrderPlacedTime(parcelId);
    const pendingPickupDetails = await findPendingPickupDetails(parcelId);
    const deliveryDetachedDetails = await findDeliveryDetails(parcelId);
    const pickedUpDetails = await findPickedUpDetails(parcelId);
    const arrivedAtDistributionCenterDetails =
      await findArrivedAtDistributionCenterDetails(parcelId);
    const shipmentAssignedDetails = await findShipmentAssignedDetails(parcelId);
    const inTransitDetails = await findInTransitDetails(parcelId);
    const arrivedAtCollectionCenterDetails =
      await findArrivedAtCollectionCenterDetails(parcelId);
    const deliveredDetails = await findDeliveredDetails(parcelId);

    if (!orderPlacedDetails) {
      return res
        .status(404)
        .json({ status: "error", message: "Parcel not found" });
    }

    // Filter out null values and include only relevant statuses based on parcel progress
    const timeData = [
      orderPlacedDetails,
      pendingPickupDetails,
      pickedUpDetails,
      arrivedAtDistributionCenterDetails,
      shipmentAssignedDetails,
      inTransitDetails,
      arrivedAtCollectionCenterDetails,
      deliveryDetachedDetails,
      deliveredDetails,
    ].filter((detail) => detail !== null);

    res.status(200).json({ status: "success", timeData });
  } catch (error) {
    console.error("Error in trackStatuses:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

module.exports = trackStatuses;
