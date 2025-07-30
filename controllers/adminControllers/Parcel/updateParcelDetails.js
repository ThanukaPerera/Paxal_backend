const Parcel = require("../../../models/parcelModel");
const Branch = require("../../../models/BranchesModel");
const catchAsync = require("../../../utils/catchAscync");
const AppError = require("../../../utils/appError");

const updateParcelDetails = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  // Find the parcel
  const parcel = await Parcel.findById(id);
  if (!parcel) {
    return next(new AppError("Parcel not found", 404));
  }

  // Validate branch references if provided
  if (updateData.from || updateData.to) {
    const branchIds = [];
    if (updateData.from) branchIds.push(updateData.from);
    if (updateData.to) branchIds.push(updateData.to);
    
    const branches = await Branch.find({ _id: { $in: branchIds } });
    if (branches.length !== branchIds.length) {
      return next(new AppError("One or more branch references are invalid", 400));
    }
  }

  // Fields that are allowed to be updated
  const allowedFields = [
    'itemType',
    'itemSize',
    'specialInstructions',
    'submittingType',
    'receivingType',
    'shippingMethod',
    'from',
    'to',
    'pickupInformation',
    'deliveryInformation'
  ];

  // Filter updateData to only include allowed fields
  const filteredUpdateData = {};
  Object.keys(updateData).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredUpdateData[key] = updateData[key];
    }
  });

  // Add updatedAt timestamp
  filteredUpdateData.updatedAt = new Date();

  // Update the parcel
  const updatedParcel = await Parcel.findByIdAndUpdate(
    id,
    filteredUpdateData,
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
    message: "Parcel details updated successfully",
    data: {
      parcel: updatedParcel
    }
  });
});

module.exports = updateParcelDetails;
