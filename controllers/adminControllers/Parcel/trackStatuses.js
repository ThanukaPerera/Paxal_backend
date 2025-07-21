const Parcel = require("../../../models/parcelModel");
const VehicleSchedule = require("../../../models/VehicleScheduleModel");
const Staff = require("../../../models/StaffModel");
const mongoose = require("mongoose");

/**
 * Validates if a parcel ID is valid MongoDB ObjectId
 * @param {string} parcelId - The parcel ID to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidParcelId = (parcelId) => {
  return parcelId && mongoose.Types.ObjectId.isValid(parcelId);
};

/**
 * Common error handler for database operations
 * @param {string} operation - The operation being performed
 * @param {Error} error - The error that occurred
 * @returns {null} - Always returns null for consistent error handling
 */
const handleDatabaseError = (operation, error) => {
  console.error(`Error in ${operation}:`, error);
  return null;
};

const fetchOrderPlacedTime = async (parcelId) => {
  try {
    if (!isValidParcelId(parcelId)) {
      return null;
    }

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
      location: parcel?.from?.location || "Unknown",
      handledBy,
      note,
    };
  } catch (error) {
    return handleDatabaseError("fetchOrderPlacedTime", error);
  }
};
const findPendingPickupDetails = async (parcelId) => {
  try {
    if (!isValidParcelId(parcelId)) {
      return null;
    }

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
    return handleDatabaseError("findPendingPickupDetails", error);
  }
};

const findDeliveryDetails = async (parcelId) => {
  try {
    if (!isValidParcelId(parcelId)) {
      return null;
    }

    const parcel = await Parcel.findOne({ _id: parcelId })
      .select("deliveryInformation from submittingType")
      .lean()
      .populate("deliveryInformation.staffId", "name")
      .populate("from", "location");

    if (!parcel) return null;
    if (parcel.submittingType !== "delivery") {
      return null;
    }

    return {
      status: "Delivery Dispatched",
      time: parcel?.deliveryInformation?.createdAt,
      location: parcel?.from?.location || "Unknown",
      handledBy: parcel?.deliveryInformation?.staffId?.name || "Driver",
    };
  } catch (error) {
    return handleDatabaseError("findDeliveryDetails", error);
  }
};

const findPickedUpDetails = async (parcelId) => {
  try {
    if (!isValidParcelId(parcelId)) {
      return null;
    }

    const parcel = await Parcel.findOne({ _id: parcelId })
      .select("pickupInformation from submittingType status")
      .lean()
      .populate("pickupInformation.staffId", "name")
      .populate("from", "location");

    if (!parcel) return null;
    if (parcel.submittingType !== "pickup" || !parcel.pickupInformation) {
      return null;
    }

    return {
      status: "PickedUp",
      time: parcel?.pickupInformation?.pickupTime,
      location:
        parcel?.pickupInformation?.address ||
        parcel?.from?.location ||
        "Unknown",
      handledBy: parcel?.pickupInformation?.staffId?.name || "Staff",
    };
  } catch (error) {
    return handleDatabaseError("findPickedUpDetails", error);
  }
};

const findArrivedAtDistributionCenterDetails = async (parcelId) => {
  try {
    if (!isValidParcelId(parcelId)) {
      return null;
    }

    const parcel = await Parcel.findOne({ _id: parcelId })
      .select(
        "pickupInformation from submittingType arrivedToDistributionCenterTime"
      )
      .lean()
      .populate("pickupInformation.staffId", "name")
      .populate("from", "location");

    if (!parcel) return null;
    if (parcel.submittingType !== "pickup") {
      return null;
    }

    return {
      status: "Arrived to distribution center",
      time:
        parcel?.arrivedToDistributionCenterTime ||
        parcel?.pickupInformation?.pickupTime,
      location:
        parcel?.pickupInformation?.address ||
        parcel?.from?.location ||
        "Unknown",
      handledBy: parcel?.pickupInformation?.staffId?.name || "Staff",
    };
  } catch (error) {
    return handleDatabaseError("findArrivedAtDistributionCenterDetails", error);
  }
};

const findShipmentAssignedDetails = async (parcelId) => {
  try {
    if (!isValidParcelId(parcelId)) {
      return null;
    }

    const parcel = await Parcel.findOne({ _id: parcelId })
      .select(
        "status pickupInformation from submittingType shipmentAssignedTime"
      )
      .lean()
      .populate("pickupInformation.staffId", "name")
      .populate("from", "location");

    if (!parcel) return null;

    // Define valid statuses for shipment assignment
    const validStatuses = [
      "ShipmentAssigned",
      "InTransit",
      "ArrivedAtCollectionCenter",
      "DeliveryDispatched",
      "Delivered",
      "NotAccepted",
      "WrongAddress",
      "Return",
    ];

    if (!validStatuses.includes(parcel.status)) {
      return null;
    }

    return {
      status: "Shipment Assigned",
      time:
        parcel?.shipmentAssignedTime || parcel?.pickupInformation?.pickupTime,
      location:
        parcel?.pickupInformation?.address ||
        parcel?.from?.location ||
        "Unknown",
      handledBy: parcel?.pickupInformation?.staffId?.name || "Staff",
    };
  } catch (error) {
    return handleDatabaseError("findShipmentAssignedDetails", error);
  }
};

const findInTransitDetails = async (parcelId) => {
  try {
    const parcel = await Parcel.findOne({ _id: parcelId })
      .select("status deliveryInformation from inTransitTime")
      .lean()
      .populate("deliveryInformation.staffId", "name")
      .populate("from", "location");

    if (!parcel) return null;

    // Define valid statuses for in-transit
    const validStatuses = [
      "InTransit",
      "ArrivedAtCollectionCenter",
      "DeliveryDispatched",
      "Delivered",
      "NotAccepted",
      "WrongAddress",
      "Return",
    ];

    if (!validStatuses.includes(parcel.status)) {
      return null;
    }

    return {
      status: "In Transit",
      time: parcel?.inTransitTime || parcel?.deliveryInformation?.createdAt,
      location: parcel?.from?.location || "Unknown",
      handledBy: parcel?.deliveryInformation?.staffId?.name || "Staff",
    };
  } catch (error) {
    return handleDatabaseError("findInTransitDetails", error);
  }
};
const findArrivedAtCollectionCenterDetails = async (parcelId) => {
  try {
    if (!isValidParcelId(parcelId)) {
      return null;
    }

    const parcel = await Parcel.findOne({ _id: parcelId })
      .select("arrivedToCollectionCenterTime to orderPlacedStaffId")
      .lean()
      .populate("to", "location")
      .populate("orderPlacedStaffId", "name");

    if (!parcel) return null;
    if (!parcel.arrivedToCollectionCenterTime) {
      return null;
    }

    return {
      status: "Arrived to Collection Center",
      time: parcel?.arrivedToCollectionCenterTime,
      location: parcel?.to?.location || "Unknown",
      handledBy: parcel?.orderPlacedStaffId?.name
        ? `${parcel.orderPlacedStaffId.name} (Staff)`
        : "Not Assigned",
    };
  } catch (error) {
    return handleDatabaseError("findArrivedAtCollectionCenterDetails", error);
  }
};
const findDeliveredDetails = async (parcelId) => {
  try {
    const parcel = await Parcel.findOne({ _id: parcelId })
      .select("deliveryInformation from submittingType status")
      .lean()
      .populate("deliveryInformation.staffId", "name");

    if (!parcel) return null;
    if (parcel.status !== "Delivered") {
      return null;
    }

    return {
      status: "Delivered",
      time: parcel?.deliveryInformation?.createdAt,
      location: parcel?.from?.location || "Unknown",
      handledBy: parcel?.deliveryInformation?.staffId?.name || "Driver",
    };
  } catch (error) {
    return handleDatabaseError("findDeliveredDetails", error);
  }
};

const trackStatuses = async (req, res) => {
  try {
    const { parcelId } = req.params;

    // Validate parcelId parameter
    if (!parcelId) {
      return res.status(400).json({
        success: false,
        message: "Parcel ID is required",
      });
    }

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(parcelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid parcel ID format",
      });
    }

    // Execute all status checks concurrently for better performance
    const [
      orderPlacedDetails,
      pendingPickupDetails,
      deliveryDetachedDetails,
      pickedUpDetails,
      arrivedAtDistributionCenterDetails,
      shipmentAssignedDetails,
      inTransitDetails,
      arrivedAtCollectionCenterDetails,
      deliveredDetails,
    ] = await Promise.all([
      fetchOrderPlacedTime(parcelId),
      findPendingPickupDetails(parcelId),
      findDeliveryDetails(parcelId),
      findPickedUpDetails(parcelId),
      findArrivedAtDistributionCenterDetails(parcelId),
      findShipmentAssignedDetails(parcelId),
      findInTransitDetails(parcelId),
      findArrivedAtCollectionCenterDetails(parcelId),
      findDeliveredDetails(parcelId),
    ]);

    // Check if parcel exists by verifying order placed details
    if (!orderPlacedDetails) {
      return res.status(404).json({
        success: false,
        message: "Parcel not found",
      });
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

    // Return successful response with tracking data
    return res.status(200).json({
      success: true,
      data: timeData,
    });
  } catch (error) {
    console.error("Error in trackStatuses controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

module.exports = trackStatuses;
