const crypto = require("crypto");
const QRCode = require("qrcode");
const User = require("../../models/userModel");
const Receiver = require("../../models/ReceiverModel");
const Parcel = require("../../models/parcelModel");
const Staff = require("../../models/StaffModel");
const Branch = require("../../models/BranchesModel");
const { sendCollectionCenterArrivedEmail } = require("../../emails/emails");
const notificationController = require("../notificationController");

// generate a tracking number
const generateTrackingNumber = async (regTime) => {
  try {
    const randomCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    // Add the timestamp to the tracking number.
    const timestamp = Math.floor(regTime / 1000).toString();
    console.log("------Tracking number generated------");

    return `${randomCode}-${timestamp}`;
  } catch (error) {
    console.log("Error in generating the tracking number", error);
  }
};

// generate the qr code
const generateQRCode = async (parcelData) => {
  try {
    const qr = await QRCode.toDataURL(parcelData, {
      errorCorrectionLevel: "H",
    });
    console.log("-----QR Generated-------");
    return qr;
  } catch (error) {
    console.error("Error in generating the qr code", error);
  }
};

// scan the qr code and update parcel status to "ArrivedAtCollectionCenter"
const scanQRCode = async (req, res) => {
  try {
    console.log("Updating parcel status...");
    const { decodedText } = req.body;

    console.log("QR Code Data:", decodedText);

    const staff_id = req.staff._id.toString();
    const staff = await Staff.findById(staff_id);
    const branch_id = staff.branchId;
    const branch = await Branch.findById(branch_id);

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const branchName = branch.location;
    console.log("Branch Name:", branchName);

    // Find parcel by parcelId
    const parcel = await Parcel.findOne({ parcelId: decodedText });

    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    if (parcel.to.equals(staff.branchId)) {
      // Check if already updated
      if (parcel.status === "ArrivedAtCollectionCenter") {
        return res.status(400).json({
          message: "Parcel is already marked as arrived at collection center",
        });
      }

      // Updating parcel.
      parcel.status = "ArrivedAtCollectionCenter";
      parcel.arrivedToCollectionCenterTime = new Date();
      const updatedParcel = await parcel.save();
      console.log("Parcel updated successfully:", updatedParcel);

      // Send a notification to the user in the application
      await notificationController.createNotification(
        parcel.senderId,
        `Your parcel (#${parcel.parcelId}) has arrived at ${branchName} branch.`,
        "parcel_arrived_atCollectionCenter",
        { id: updatedParcel._id, type: "Parcel" }
      );

      console.log("Sending emails..");
      // Send emails to the sender and receiver with the tracking number.
      const sender = await User.findById(updatedParcel.senderId);
      const receiver = await Receiver.findById(updatedParcel.receiverId);
      const senderEmail = sender.email;
      const receiverEmail = receiver.receiverEmail;

      console.log("Email Info: ", senderEmail, receiverEmail);

      const result1 = await sendCollectionCenterArrivedEmail(
        senderEmail,
        decodedText,
        branchName
      );
      if (!result1.success) {
        console.log("Error in sending the email with tracking number", result1);
      }
      const result2 = await sendCollectionCenterArrivedEmail(
        receiverEmail,
        decodedText,
        branchName
      );
      if (!result2.success) {
        console.log("Error in sending the email with tracking number", result2);
      }

      return res.status(200).json({
        success: true,
        message: "Parcel status updated successfully",
        data: updatedParcel,
      });
    } else if (parcel.from.equals(staff.branchId)) {
      // Check if already updated
      if (parcel.status === "ArrivedAtDistributionCenter") {
        return res.status(400).json({
          message: "Parcel is already marked as arrived at distribution center",
        });
      }

      // Updating parcel.
      parcel.status = "ArrivedAtDistributionCenter";
      parcel.arrivedToDistributionCenterTime = new Date();
      const updatedParcel = await parcel.save();
      console.log("Parcel updated successfully:", updatedParcel);

      // Send a notification to the user in the application
      await notificationController.createNotification(
        parcel.senderId,
        `Your parcel (#${parcel.parcelId}) has arrived at ${branchName} branch.`,
        "parcel_arrived_atDistributionCenter",
        { id: updatedParcel._id, type: "Parcel" }
      );

      return res.status(200).json({
        success: true,
        message: "Parcel status updated successfully",
        data: updatedParcel,
      });
    } else {
      console.log("Parcel is not for this branch");
      return res.status(400).json({ message: "Parcel is not for this branch" });
    }
  } catch (error) {
    console.error("Error scanning QR code:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error scanning QR code" });
  }
};

module.exports = {
  generateQRCode,
  generateTrackingNumber,
  scanQRCode,
};
