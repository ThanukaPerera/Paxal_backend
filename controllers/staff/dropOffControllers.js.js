const Parcel = require("../../models/parcelModel");
const Staff = require("../../models/StaffModel");
const User = require("../../models/userModel");
const Receiver = require("../../models/receiverModel");
const {
  generateTrackingNumber,
  generateQRCode,
} = require("./qrAndTrackingNumber");
const { sendTrackingNumberEmail } = require("../../emails/emails");
const notificationController = require("../notificationController");

// get all drop-off parcels
const viewAllDropOffupParcels = async (req, res) => {
  try {
    // Find the branch that requests drop-off parcels using staff ID.
    const staff_id = req.staff._id.toString();
    console.log(staff_id);
    const staff = await Staff.findById(staff_id);
    const branch_id = staff.branchId;

    const dropOffParcels = await Parcel.find({
      submittingType: "drop-off",
      status: "OrderPlaced",
      from: branch_id,
    })
      .populate({ path: "senderId", select: "fName lName" })
      .sort({
        createdAt: -1,
      });

    return res.status(200).json(dropOffParcels);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching drop-off parcels", error });
  }
};

// update drop-off parcel when collected
const getQRandTrackingNumberForDropOff = async (req, res) => {
  try {
    const parcelId = req.params.parcelId;
    console.log(parcelId);
    const dropOffParcel = await Parcel.findOne({ parcelId });

    // Generate a tracking number for the parcel.
    let trackingNumber;
    let numberExists;
    do {
      trackingNumber = await generateTrackingNumber(dropOffParcel.createdAt);
      numberExists = await Parcel.findOne({ trackingNo: trackingNumber });
    } while (numberExists);

   
    // Generate a QR code for the parcel.
    const qrCodeString = await generateQRCode(parcelId);
    

    // Get the staff who collected the parcel.
    const staff_id = req.staff._id;
    console.log("Staff ID:", staff_id);

    const updatedDropOffParcel = {
      trackingNo: trackingNumber,
      qrCodeNo: qrCodeString,
      status: "ArrivedAtDistributionCenter",
      arrivedToDistributionCenterTime:new Date(),
      orderPlacedStaffId: staff_id,
    };

     const updatedParcel = await Parcel.findOneAndUpdate(
      { parcelId },
      updatedDropOffParcel,
      { new: true },
    );
    console.log("updated");
 // Send a notification to the user in the application
await notificationController.createNotification(
  updatedParcel.senderId,
  `Your parcel (#${updatedParcel.parcelId}) has been registered successfully! \nTrack it anytime using the tracking number: ${updatedParcel.trackingNo}.`,
  'parcel_registered',
  { id: updatedParcel._id, type: 'Parcel' }
);
     console.log("notification sent");
    
    // Send emails to sender and receiver with the tracking number.
    const sender = await User.findById(dropOffParcel.senderId);
    const receiver = await Receiver.findById(dropOffParcel.receiverId);
    const senderEmail = sender.email;
    const receiverEmail = receiver.receiverEmail;
    console.log("Drop-offs collected and updated.Sending emails....",senderEmail, receiverEmail);
    const result1 = await sendTrackingNumberEmail(
      senderEmail,
      parcelId,
      trackingNumber
    );
    if (!result1.success) {
      console.log("Error in sending the email with tracking number", result1);
      return res.status(500).json({
        success: false,
        message: "Drop-off parcel collected.Error in sending the email with tracking number",
        error: result1?.error.message || "Email service error",
      });
    }

    const result2 = await sendTrackingNumberEmail(
      receiverEmail,
      parcelId,
      trackingNumber
    );
    if (!result1.success) {
      console.log("Error in sending the email with tracking number", result2);
      return res.status(500).json({
        success: false,
        message: "Drop-off parcel collected.Error in sending the email with tracking number",
        error:  result2?.error.message || "Email service error",
      });
    }

    console.log("Drop-off parcel collected and emails sent successfully");
    
    return res.status(200).json({
      success: true,
      message:
        "QR and Tracking number successfully generated - arrived at distribution center",
      updatedParcel
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error in generating qr and tracking number for drop-off parcel",
      error,
    });
  }
};

// Get drop-offs stats
const getDropOffsStats = async (req, res) => {
  try {
    // Find the branch using staff ID.
    const staff_id = req.staff._id.toString();
    console.log(staff_id);
    const staff = await Staff.findById(staff_id);
    const branch_id = staff.branchId;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);


    // Count the number of drop-offs made today.
    const dropOffsToday = await Parcel.countDocuments({
      submittingType: "drop-off",
      status: "OrderPlaced",
      from: branch_id,
      createdAt: { $gte: startOfToday, $lt: endOfToday },
    });

     // Count the number of pending pickup requests.
    const pendingDropOffs= await Parcel.countDocuments({
      submittingType: "drop-off",
      status: "OrderPlaced",
      from: branch_id,
    });

    return res.status(200).json({ dropOffsToday: dropOffsToday, pendingDropOffs: pendingDropOffs });
  } catch (error) {
    console.error("Error fetching drop-offs stats:", error);
    return res.status(500).json({ message: "Error fetching drop-offs stats", error });
  }
};

module.exports = {
  viewAllDropOffupParcels,
  getQRandTrackingNumberForDropOff,
  getDropOffsStats
};
