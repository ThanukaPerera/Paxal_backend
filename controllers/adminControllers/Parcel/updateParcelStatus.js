const Parcel = require("../../../models/parcelModel");
const catchAsync = require("../../../utils/catchAscync");
const AppError = require("../../../utils/appError");

const updateParcelStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, reason, description } = req.body;
  
  // Only admins can cancel or return parcels
  if ((status === "Cancelled" || status === "Return") && !req.admin) {
    return next(new AppError("Only administrators can cancel or return parcels", 403));
  }
  
  // Determine user type and ID
  let userId, userType;
  if (req.admin) {
    userId = req.admin._id;
    userType = 'Admin';
  } else if (req.staff) {
    userId = req.staff._id;
    userType = 'Staff';
  } else {
    return next(new AppError("Authentication required", 401));
  }

  // Validate required fields
  if (!status) {
    return next(new AppError("Status is required", 400));
  }

  // Find the parcel
  const parcel = await Parcel.findById(id);
  if (!parcel) {
    return next(new AppError("Parcel not found", 404));
  }

  // Prepare update object
  const updateData = {
    status,
    updatedAt: new Date()
  };

  // Handle Cancelled status - Only by Admin
  if (status === "Cancelled") {
    updateData.cancellationInfo = {
      reason: reason || "No reason provided",
      description: description || "",
      cancelledBy: userId, // This will be admin ID
      cancelledByModel: 'Admin', // Always Admin for cancellations
      cancelledAt: new Date()
    };
  }

  // Handle Return status - Only by Admin
  if (status === "Return") {
    updateData.returnInfo = {
      reason: reason || "No reason provided",
      description: description || "",
      returnedBy: userId, // This will be admin ID
      returnedByModel: 'Admin', // Always Admin for returns
      returnedAt: new Date()
    };
  }

  // Handle Reactivation - clear cancellation/return info and reset to OrderPlaced
  if (status === "OrderPlaced") {
    // Clear any existing cancellation or return information
    updateData.$unset = {
      "cancellationInfo": "",
      "returnInfo": "",
      // Reset all timestamp fields to null
      "parcelPickedUpDate": "",
      "arrivedToDistributionCenterTime": "",
      "shipmentAssignedTime": "",
      "intransitedDate": "",
      "arrivedToCollectionCenterTime": "",
      "parcelDispatchedDate": "",
      "parcelDeliveredDate": ""
    };
  }

  // Update status-specific timestamps
  const now = new Date();
  switch (status) {
    case "PickedUp":
      updateData.parcelPickedUpDate = now;
      break;
    case "ArrivedAtDistributionCenter":
      updateData.arrivedToDistributionCenterTime = now;
      break;
    case "ShipmentAssigned":
      updateData.shipmentAssignedTime = now;
      break;
    case "InTransit":
      updateData.intransitedDate = now;
      break;
    case "ArrivedAtCollectionCenter":
      updateData.arrivedToCollectionCenterTime = now;
      break;
    case "DeliveryDispatched":
      updateData.parcelDispatchedDate = now;
      break;
    case "Delivered":
      updateData.parcelDeliveredDate = now;
      break;
  }

  // Update the parcel
  const updatedParcel = await Parcel.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate([
    { path: "senderId", select: "fName lName email contact" },
    { path: "receiverId", select: "receiverFullName receiverContact receiverEmail" },
    { path: "paymentId" },
    { path: "from", select: "branchId location" },
    { path: "to", select: "branchId location" },
    { path: "cancellationInfo.cancelledBy", select: "staffId fName lName" },
    { path: "returnInfo.returnedBy", select: "staffId fName lName" }
  ]);

  res.status(200).json({
    status: "success",
    message: `Parcel status updated to ${status} successfully`,
    data: {
      parcel: updatedParcel
    }
  });
});

module.exports = updateParcelStatus;
