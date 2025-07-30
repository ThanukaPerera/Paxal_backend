const Parcel = require("../../../models/parcelModel");
const Payment = require("../../../models/PaymentModel");
const Staff = require("../../../models/StaffModel");
const Admin = require("../../../models/AdminModel");
const mongoose = require('mongoose')

const fetchParcelById = async (req, res) => {
  try {
    const parcelId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(parcelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid parcel ID",
      });
    }

    // Find parcel by custom ID
    const parcel = await Parcel.findOne({_id:parcelId})
      .select("-__v")
      .populate(
        "senderId",
        "-password -__v -resetPasswordOTP -resetPasswordOTPExpires"
      )
      .populate("receiverId", "-__v")
      .populate("paymentId", "-__v")
      .populate("from", "-__v")
      .populate("to", "-__v")
      .populate("cancellationInfo.cancelledBy", "-__v")
      .populate("returnInfo.returnedBy", "-__v")
      .lean()
      .exec();

    if (!parcel) {
      return res.status(404).json({
        success: false,
        message: "Parcel not found",
      });
    }

    // Manually populate cancellation and return information - Only Admin operations
    if (parcel.cancellationInfo?.cancelledBy) {
      const cancelledByData = await Admin.findById(parcel.cancellationInfo.cancelledBy)
        .select('adminId name email nic contactNo')
        .lean();
      
      if (cancelledByData) {
        parcel.cancellationInfo.cancelledBy = {
          ...cancelledByData,
          userType: 'Admin'
        };
      }
    }

    if (parcel.returnInfo?.returnedBy) {
      const returnedByData = await Admin.findById(parcel.returnInfo.returnedBy)
        .select('adminId name email nic contactNo')
        .lean();
      
      if (returnedByData) {
        parcel.returnInfo.returnedBy = {
          ...returnedByData,
          userType: 'Admin'
        };
      }
    }
    if (!parcel) {
      return res.status(404).json({
        success: false,
        message: "Parcel not found",
      });
    }
    res.status(200).json({
      success: true,
      data: parcel,
    });
  } catch (error) {
    console.error("Error fetching parcel:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = fetchParcelById;
