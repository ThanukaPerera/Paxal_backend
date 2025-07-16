const Parcel = require("../../../models/parcelModel");
const VehicleSchedule = require("../../../models/VehicleScheduleModel");
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
  const parcel = await Parcel.findOne({ _id: parcelId })
    .select()
    .lean()
    .populate("pickupInformation.staffId");

  if (!parcel) return null;

  return {
    status: "Pending Pickup",
    time: parcel?.pickupInformation?.createdAt,
    location: parcel?.from?.location,
    handledBy: parcel?.pickupInformation?.staffId,
  };
};

const findDeliveryDetails = async (parcelId) => {
  const parcel = await Parcel.findOne({ _id: parcelId })
    .select()
    .lean()
    .populate("deliveryInformation.staffId");

  if (!parcel) return null;

  return {
    status: "Delivery Dispatched",
    time: parcel?.deliveryInformation?.createdAt,
    location: parcel?.from?.location,
    handledBy: parcel?.deliveryInformation?.staffId,
  };
};

const findPickedUpDetails = async (parcelId) => {
  const parcel = await Parcel.findOne({ _id: parcelId })
    .select()
    .lean()
    .populate("pickupInformation");

  if (!parcel) return null;

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
  const parcel = await Parcel.findOne({ parcelId })
    .select()
    .lean()
    .populate("deliveryInformation.staffId");

  if (!parcel) return null;

  return {
    status: "Arrived to Collection Center",
    time: parcel?.deliveryInformation?.createdAt,
    location: parcel?.from?.location,
    handledBy: parcel?.deliveryInformation?.staffId,
  };
};
const findDeliveredDetails = async (parcelId) => {
  const parcel = await Parcel.findOne({ _id: parcelId })
    .select()
    .lean()
    .populate("deliveryInformation.staffId");

  if (!parcel) return null;

  return {
    status: "Delivered",
    time: parcel?.deliveryInformation?.createdAt,
    location: parcel?.from?.location,
    handledBy: parcel?.deliveryInformation?.staffId,
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
    const deliveryDetails = await findDeliveryDetails(parcelId);
    const PickedUpDetails = await findPickedUpDetails(parcelId);
    const ArrivedAtDistributionCenterDetails =
      await findArrivedAtDistributionCenterDetails(parcelId);
    const ShipmentAssignedDetails = await findShipmentAssignedDetails(parcelId);
    const InTransitDetails = await findInTransitDetails(parcelId);
    const ArrivedAtCollectionCenterDetails =
      await findArrivedAtCollectionCenterDetails(parcelId);
    const DeliveredDetails = await findDeliveredDetails(parcelId);

    if (!orderPlacedDetails || !pendingPickupDetails) {
      return res
        .status(404)
        .json({ status: "error", message: "Parcel not found" });
    }

    const timeData = [
      orderPlacedDetails,
      pendingPickupDetails,
      PickedUpDetails,
      ArrivedAtDistributionCenterDetails,
      ShipmentAssignedDetails,
      InTransitDetails,
      ArrivedAtCollectionCenterDetails,
      deliveryDetails,
      DeliveredDetails,
    ];

    res.status(200).json({ status: "success", timeData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

module.exports = trackStatuses;
