const Parcel = require("../../../models/parcelModel");
const B2BShipment = require("../../../models/B2BShipmentModel");
const mongoose = require("mongoose");


const getResponsiblePerson = (parcel, status) => {
  switch (status) {
    case "Picked Up":
    case "Delivered":
      // For these statuses, check if driver is assigned via shipment
      if (parcel.shipmentId?.assignedDriver?.name) {
        return `${parcel.shipmentId.assignedDriver.name} (Driver)`;
      }
      // Fallback to staff from pickup/delivery information
      if (status === "Picked Up" && parcel.pickupInformation?.staffId?.name) {
        return `${parcel.pickupInformation.staffId.name} (Staff)`;
      }
      if (status === "Delivered" && parcel.deliveryInformation?.staffId?.name) {
        return `${parcel.deliveryInformation.staffId.name} (Staff)`;
      }
      return "Driver";
    
    case "Order Placed":
      return parcel?.submittingType === "pickup" ? "User (Pickup)" : "Branch";
    
    case "Pending Pickup":
      return parcel?.pickupInformation?.staffId?.name || "Not Assigned";
    
    case "Shipment Assigned":
      return "System";
    
    case "In Transit":
      return parcel.shipmentId?.assignedDriver?.name 
        ? `${parcel.shipmentId.assignedDriver.name} (Driver)` 
        : "Transport Team";
    
    default:
      return parcel?.orderPlacedStaffId?.name || "Staff";
  }
};

const getStatusLocation = (parcel, status) => {
  switch (status) {
    case "Order Placed":
      return parcel?.from?.location || "Unknown";
    
    case "Pending Pickup":
    case "Picked Up":
      if (parcel.submittingType === "pickup") {
        return parcel?.pickupInformation?.address || parcel?.from?.location || "Unknown";
      }
      return parcel?.from?.location || "Unknown";
    
    case "In Transit":
      return `${parcel?.from?.location || "Unknown"} → ${parcel?.to?.location || "Unknown"}`;
    
    case "Arrived at Collection Center":
    case "Delivery Dispatched":
      return parcel?.to?.location || "Collection Center";
    
    case "Delivered":
      if (parcel.receivingType === "collection_center") {
        return parcel?.to?.location || "Collection Center";
      }
      return parcel?.deliveryInformation?.deliveryAddress || "Delivery Address";
    
    default:
      return parcel?.from?.location || "Unknown";
  }
};

const getStatusNote = (parcel, status) => {
  switch (status) {
    case "Shipment Assigned":
      return parcel?.shipmentId?.shipmentId ? `Shipment: ${parcel.shipmentId.shipmentId}` : "-";
    
    case "Delivered":
      return `Delivery Type: ${parcel.receivingType === "collection_center" ? "Collection Center" : "Doorstep"}`;
    
    default:
      return "-";
  }
};

const buildStatusResponse = (status, time, parcel) => {
  if (!time) return null;
  
  return {
    status,
    time,
    location: getStatusLocation(parcel, status),
    handledBy: getResponsiblePerson(parcel, status),
    note: getStatusNote(parcel, status),
  };
};

const isValidParcelId = (parcelId) => {
  return parcelId && mongoose.Types.ObjectId.isValid(parcelId);
};

const handleDatabaseError = (operation, error) => {
  console.error(`Error in ${operation}:`, error);
  return null;
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

    // Single optimized query to get all required data
    const parcel = await Parcel.findOne({ _id: parcelId })
      .select(`
        createdAt status submittingType receivingType
        parcelPickedUpDate arrivedToDistributionCenterTime shipmentAssignedTime
        intransitedDate arrivedToCollectionCenterTime parcelDispatchedDate parcelDeliveredDate
        pickupInformation deliveryInformation orderPlacedStaffId shipmentId
      `)
      .populate("from", "location")
      .populate("to", "location")
      .populate("orderPlacedStaffId", "name")
      .populate({
        path: "pickupInformation",
        populate: {
          path: "staffId",
          select: "name"
        }
      })
      .populate({
        path: "deliveryInformation", 
        populate: {
          path: "staffId",
          select: "name"
        }
      })
      .populate({
        path: "shipmentId",
        select: "shipmentId status",
        populate: {
          path: "assignedDriver",
          select: "name"
        }
      })
      .lean()
      .exec();

    // Check if parcel exists
    if (!parcel) {
      return res.status(404).json({
        success: false,
        message: "Parcel not found",
      });
    }

    console.log("Fetched parcel:", parcel);

    // Build timeline array based on parcel status progression
    const timeline = [];

    // 1. Order Placed (always present)
    timeline.push(buildStatusResponse("Order Placed", parcel.createdAt, parcel));

    // 2. Pending Pickup (only for pickup type parcels)
    if (parcel.submittingType === "pickup" && parcel.pickupInformation?.createdAt) {
      timeline.push(buildStatusResponse("Pending Pickup", parcel.pickupInformation.createdAt, parcel));
    }

    // Define status hierarchy for progression check
    const statusHierarchy = [
      "OrderPlaced",
      "PendingPickup", 
      "PickedUp",
      "ArrivedAtDistributionCenter",
      "ShipmentAssigned",
      "InTransit", 
      "ArrivedAtCollectionCenter",
      "DeliveryDispatched",
      "Delivered"
    ];

    const currentStatusIndex = statusHierarchy.indexOf(parcel.status);
    
    // 3. Picked Up (if status progressed beyond PendingPickup)
    if (currentStatusIndex >= statusHierarchy.indexOf("PickedUp")) {
      const pickupTime = parcel.parcelPickedUpDate || 
        (parcel.submittingType === "pickup" ? parcel.pickupInformation?.updatedAt : parcel.createdAt);
      timeline.push(buildStatusResponse("Picked Up", pickupTime, parcel));
    }

    // 4. Arrived at Distribution Center (if status progressed)
    if (currentStatusIndex >= statusHierarchy.indexOf("ArrivedAtDistributionCenter") && 
        parcel.arrivedToDistributionCenterTime) {
      timeline.push(buildStatusResponse("Arrived at Distribution Center", 
        parcel.arrivedToDistributionCenterTime, parcel));
    }

    // 5. Shipment Assigned (if status progressed)
    if (currentStatusIndex >= statusHierarchy.indexOf("ShipmentAssigned")) {
      const shipmentTime = parcel.shipmentAssignedTime || parcel.updatedAt;
      timeline.push(buildStatusResponse("Shipment Assigned", shipmentTime, parcel));
    }

    // 6. In Transit (if status progressed)
    if (currentStatusIndex >= statusHierarchy.indexOf("InTransit") && parcel.intransitedDate) {
      timeline.push(buildStatusResponse("In Transit", parcel.intransitedDate, parcel));
    }

    // 7. Arrived at Collection Center (if status progressed)
    if (currentStatusIndex >= statusHierarchy.indexOf("ArrivedAtCollectionCenter") && 
        parcel.arrivedToCollectionCenterTime) {
      timeline.push(buildStatusResponse("Arrived at Collection Center", 
        parcel.arrivedToCollectionCenterTime, parcel));
    }

    // 8. Delivery Dispatched (if status progressed)
    if (currentStatusIndex >= statusHierarchy.indexOf("DeliveryDispatched") && 
        parcel.parcelDispatchedDate) {
      timeline.push(buildStatusResponse("Delivery Dispatched", 
        parcel.parcelDispatchedDate, parcel));
    }

    // 9. Delivered (if completed)
    if (parcel.status === "Delivered" && parcel.parcelDeliveredDate) {
      timeline.push(buildStatusResponse("Delivered", parcel.parcelDeliveredDate, parcel));
    }

    // Filter out null values and sort chronologically
    const timeData = timeline
      .filter(item => item !== null)
      .sort((a, b) => new Date(a.time) - new Date(b.time));

    // Return successful response with tracking data
    return res.status(200).json({
      success: true,
      data: timeData,
      totalStatuses: timeData.length,
      currentStatus: parcel.status,
      parcelInfo: {
        parcelId: parcel.parcelId,
        submittingType: parcel.submittingType,
        receivingType: parcel.receivingType,
        shipmentId: parcel.shipmentId?.shipmentId || null
      }
    });

  } catch (error) {
    console.error("Error in trackStatuses controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = trackStatuses;
