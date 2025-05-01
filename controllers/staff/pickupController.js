
const Parcel = require("../../models/parcelModel");
const Staff = require("../../models/StaffModel");
const User = require("../../models/userModel");
const Receiver = require("../../models/ReceiverModel");

const {generateTrackingNumber,generateQRCode} = require("./qrAndTrackingNumber");
const { sendTrackingNumberEmail } = require("../../emails/emails");


// Get all new pickup requests so the staff can assign drivers to pick them up.
const viewAllPickupParcels = async (req, res) => {
  try {

    // Find the branch that requests pickup parcels using staff ID.
    const staff_id = req.staff._id.toString();
    console.log(staff_id);
    const staff = await Staff.findById(staff_id);
    const branch_id = staff.branchId;

    const pickupParcels = await Parcel.find({
      submittingType: "pickup",
      status: "OrderPlaced",
      from: branch_id,
    });
    
    return res.status(200).json(pickupParcels);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching pickup parcels", error });
  }
};

// Generate a QR code and tracking number for the pickup parcel
// and update the parcel status to "PendingPickup"
const getQRandTrackingNumberForPickup = async (req, res) => {
  try {
    console.log("Updating a pickup parcel");
    const {parcelId} = req.body;

    const pickupParcel = await Parcel.findOne({ parcelId });

    // Generate a tracking number for the pickup parcel.
    let trackingNumber;
    let numberExists;
    do {
      trackingNumber = await generateTrackingNumber(pickupParcel.createdAt);
      numberExists = await Parcel.findOne({ trackingNo: trackingNumber });
    } while (numberExists);

    // Generate a QR code for the pickup parcel.
    const qrCodeString = await generateQRCode(parcelId);

    // Get the staff who register the pickup parcel.
    const staff_id = req.staff._id;
    console.log(staff_id)

    // Update the pickup parcel.
    // Add the staff who handled the pickup request.
    const updatedPickupParcel = {
      trackingNo: trackingNumber,
      qrCodeNo: qrCodeString,
      status: "PendingPickup",
      pickupInformation: { staffId: staff_id },
    };

    const updatedParcel = await Parcel.findOneAndUpdate(
      { parcelId },
      updatedPickupParcel,
      { new: true }
    );

    // Send emails to the sender and receiver with the tracking number.
    const sender = await User.findById(pickupParcel.userId);
    const receiver = await Receiver.findById(pickupParcel.receiverId);
    const senderEmail = sender.email;
    const receiverEmail = receiver.receiverEmail;

    const result1 = await sendTrackingNumberEmail(senderEmail, parcelId, trackingNumber);
    if(!result1.success) {
      console.log("Error in sending the email with tracking number",result1)
    }
    const result2 = await sendTrackingNumberEmail(receiverEmail, parcelId, trackingNumber);
    if(!result1.success) {
      console.log("Error in sending the email with tracking number",result2)
    }
    
    return res.status(200).json({
      message: "QR and Tracking number successfully generated - pending pickup",
      updatedParcel,
    });
    
  } catch (error) {
    res.status(500).json({
      message: "Error in generating qr and tracking number for pickup",
      error,
    });
  }
};

module.exports = {
  viewAllPickupParcels,
  getQRandTrackingNumberForPickup,
};
