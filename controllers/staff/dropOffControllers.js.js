const Parcel = require("../../models/parcelModel");
const Staff = require("../../models/StaffModel");
const {
  generateTrackingNumber,
  generateQRCode,
} = require("./parcelControllers");

const { sendTrackingNumberEmail } = require("../../emails/emails");

// GET ALL DROP-OFF PARCELS
const viewAllDropOffupParcels = async (req, res) => {
  try {
    const staff_id = req.staff._id.toString();
    console.log(staff_id);
    const staff = await Staff.findById(staff_id);
    const branch_id = staff.branchId;
    const dropOffParcels = await Parcel.find({
      submittingType: "drop-off",
      status: "OrderPlaced",
      from: branch_id,
    })
      .populate("senderId", "fName lName")
      .sort({
        createdAt: -1,
      });

    res.status(200).json(dropOffParcels);
  } catch (error) {
    res.status(500).json({ message: "Error fetching drop-off parcels", error });
  }
};

// GET ONE DROP-OFF PARCEL
const getOneDropOffParcel = async (req, res) => {
  try {
    const dropOffParcel = await Parcel.findOne({
      parcelId: req.params.parcelId,
    });

    if (!dropOffParcel) {
      return res.status(404).json({ message: "Parcel Not found" });
    }
    res.status(200).json(dropOffParcel);
  } catch (error) {
    res.status(500).json({ message: "Error fetching the parcel", error });
  }
};

//GENERATE QR AND TRACKING NUMBER
const getQRandTrackingNumberForDropOff = async (req, res) => {
  try {
    const parcelId = req.params.parcelId;

    const dropOffParcel = await Parcel.findOne({ parcelId });

    // Generate a tracking number for the dropOff parcel
    let trackingNumber;
    let numberExists;
    do {
      trackingNumber = await generateTrackingNumber(dropOffParcel.createdAt);
      numberExists = await Parcel.findOne({ trackingNo: trackingNumber });
    } while (numberExists);

    // Generate a QR code for the pickup parcel
    const qrCodeString = await generateQRCode(parcelId);

    const updatedDropOffParcel = {
      trackingNo: trackingNumber,
      qrCodeNo: qrCodeString,
      status: "ArrivedAtDistributionCenter",
    };

    const updatedParcel = await Parcel.findOneAndUpdate(
      { parcelId },
      updatedDropOffParcel,
      { new: true },
    );

    // SEND EMAILS TO SENDER AND RECEIVER
    const sender = await Customer.findById(dropOffParcel.senderId);
    const receiver = await Customer.findById(dropOffParcel.receiverId);
    const senderEmail = sender.customerEmail;
    const receiverEmail = receiver.receiverEmail;

    await sendTrackingNumberEmail(senderEmail, parcelId, trackingNumber);
    await sendTrackingNumberEmail(receiverEmail, parcelId, trackingNumber);

    res.status(200).json({
      message:
        "QR and Tracking number successfully generated - arrived at distribution center",
      updatedParcel,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error in generating qr and tracking number for drop-off",
      error,
    });
  }
};

module.exports = {
  viewAllDropOffupParcels,
  getOneDropOffParcel,
  getQRandTrackingNumberForDropOff,
};
