const Parcel = require("../../models/parcelModel");
const Staff = require("../../models/StaffModel");
const {
  generateTrackingNumber,
  generateQRCode,
} = require("./parcelControllers");

const { sendTrackingNumberEmail } = require("../../emails/emails");
// const User = require("../../models/userModel");
// const Receiver = require("../../models/receiverModel");

// GET ALL PICKUP REQUESTS
const viewAllPickupParcels = async (req, res) => {
  try {
    const staff_id = req.staff._id.toString();
    console.log(staff_id);
    const staff = await Staff.findById(staff_id);
    const branch_id = staff.branchId;
    const pickupParcels = await Parcel.find({
      submittingType: "pickup",
      status: "OrderPlaced",
      from: branch_id,
    });
    res.status(200).json(pickupParcels);
  } catch (error) {
    res.status(500).json({ message: "Error fetching parcels", error });
  }
};

// GET ONE PICKUP REQUEST
const getOnePickupParcel = async (req, res) => {
  try {
    const pickupParcel = await Parcel.findOne({
      parcelId: req.params.parcelId,
    });

    if (!pickupParcel) {
      return res.status(404).json({ message: "Parcel Not found" });
    }
    res.status(200).json(pickupParcel);
  } catch (error) {
    res.status(500).json({ message: "Error fetching the parcel", error });
  }
};

//GENERATE QR AND TRACKING NUMBER
const getQRandTrackingNumberForPickup = async (req, res) => {
  try {
    const parcelId = req.params.parcelId;

    const pickupParcel = await Parcel.findOne({ parcelId });

    // Generate a tracking number for the pickup parcel
    let trackingNumber;
    let numberExists;
    do {
      trackingNumber = await generateTrackingNumber(pickupParcel.createdAt);
      numberExists = await Parcel.findOne({ trackingNo: trackingNumber });
    } while (numberExists);

    // Generate a QR code for the pickup parcel
    const qrCodeString = await generateQRCode(parcelId);

    const updatedPickupParcel = {
      trackingNo: trackingNumber,
      qrCodeNo: qrCodeString,
      status: "PendingPickup",
    };

    const updatedParcel = await Parcel.findOneAndUpdate(
      { parcelId },
      updatedPickupParcel,
      { new: true }
    );

    // SEND EMAILS TO SENDER AND RECEIVER
    const sender = await User.findById(pickupParcel.userId);
    const receiver = await Receiver.findById(pickupParcel.receiverId);
    const senderEmail = sender.email;
    const receiverEmail = receiver.receiverEmail;

    await sendTrackingNumberEmail(senderEmail, parcelId, trackingNumber);
    await sendTrackingNumberEmail(receiverEmail, parcelId, trackingNumber);

    res.status(200).json({
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
  getOnePickupParcel,
  getQRandTrackingNumberForPickup,
};
