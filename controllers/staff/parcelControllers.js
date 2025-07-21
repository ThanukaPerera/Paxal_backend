const mongoose = require("mongoose");
const Parcel = require("../../models/parcelModel");
const Staff = require("../../models/StaffModel");

const { sendTrackingNumberEmail } = require("../../emails/emails");
const {
  generateQRCode,
  generateTrackingNumber,
} = require("./qrAndTrackingNumber");
const { registerNewUser } = require("./userController");
const { addReceiver } = require("./receiverController");
const { savePayment } = require("./paymentController");

// add new parcel by the staff
const registerParcel = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const requestTime = new Date();

    // Find or create the sender and receiver.
    const sender_id = await registerNewUser(req.body, session);
    const receiver_id = await addReceiver(req.body, session);

    // Create Payment.
    const payment_id = await savePayment(req.body, session);

    // Get the staff who register the parcel.
    const staff_id = req.staff._id;

    // Find last parcel ID and generate the next one.
    const lastParcel = await Parcel.findOne().sort({ parcelId: -1 }).lean();
    let nextParcelId = "PARCEL001"; // Default ID if no parcels exists.

    if (lastParcel) {
      const lastIdNumber = parseInt(
        lastParcel.parcelId.replace("PARCEL", ""),
        10
      );
      nextParcelId = `PARCEL${String(lastIdNumber + 1).padStart(3, "0")}`;
    }

    // Generate a tracking number for the new parcel.
    let trackingNumber;
    let numberExists;
    do {
      trackingNumber = await generateTrackingNumber(requestTime, session);
      numberExists = await Parcel.findOne({
        trackingNo: trackingNumber,
      }).session(session);
    } while (numberExists);

    // Generate a QR code for the new parcel.
    const qrCodeString = await generateQRCode(nextParcelId);

    // Create new parcel with the generated ID.
    const parcelData = {
      ...req.body,
      senderId: sender_id,
      receiverId: receiver_id,
      paymentId: payment_id,
      parcelId: nextParcelId,
      trackingNo: trackingNumber,
      qrCodeNo: qrCodeString,
      submittingType: "branch",
      status: "ArrivedAtDistributionCenter",
      orderPlacedStaffId: staff_id,
    };
    const parcel = new Parcel(parcelData);
    const savedParcel = await parcel.save({ session });
    console.log("------A new parcel registered------");

    await session.commitTransaction();

    // Send emails to sender and receiver with the tracking number.
    const senderEmail = req.body.email;
    const receiverEmail = req.body.receiverEmail;

    const result1 = await sendTrackingNumberEmail(senderEmail,parcelData.parcelId,parcelData.trackingNo);
    if (!result1.success) {
      console.log("Error in sending the email with tracking number", result1);
    }

    const result2 = await sendTrackingNumberEmail(receiverEmail,parcelData.parcelId,parcelData.trackingNo
    );
    if (!result1.success) {
      console.log("Error in sending the email with tracking number", result2);
    }

    return res
      .status(201)
      .json({
        message: "Parcel registered successfully",
        parcelId: parcelData.parcelId,
      });
  } catch (error) {
    await session.abortTransaction();
    return res
      .status(500)
      .json({ message: "Error in registering the parcel", error });
  } finally {
    session.endSession();
  }
};

// get all parcels
const getAllParcels = async (req, res) => {
  try {
    // Find the branch requesting parcel details.
    const staff_id = req.staff._id.toString();
    const staff = await Staff.findById(staff_id);
    const branch_id = staff.branchId;

    const parcels = await Parcel.find({ from: branch_id }).sort({
      createdAt: -1,
    });
    return res.status(200).json(parcels);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching parcels", error });
  }
};

// get one parcel details
const getOneParcel = async (req, res) => {
  try {
    // Find the parcel using parcel ID.
    const parcel = await Parcel.findOne({ parcelId: req.params.parcelId })
      .populate("senderId")
      .populate("receiverId")
      .populate("paymentId")
      .populate("to");

    if (!parcel) {
      return res.status(404).json({ message: "Parcel Not found" });
    }

    return res.status(200).json(parcel);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching the parcel", error });
  }
};

module.exports = {
  registerParcel,
  getAllParcels,
  getOneParcel,
};
