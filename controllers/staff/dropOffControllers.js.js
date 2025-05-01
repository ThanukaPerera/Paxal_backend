


const Parcel = require("../../models/parcelModel");

const Staff = require("../../models/StaffModel");
const {generateTrackingNumber,generateQRCode,} = require("./qrAndTrackingNumber");
const { sendTrackingNumberEmail } = require("../../emails/emails");

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
    }).populate({path:"senderId", select:"fName lName"})
      .sort({
        createdAt: -1,
      });
   
    return res.status(200).json(dropOffParcels);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching drop-off parcels", error });
  }
};

// update drop-off parcel when collected
const getQRandTrackingNumberForDropOff = async (req, res) => {
  try {
    const parcelId = req.params.parcelId;
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

    const updatedDropOffParcel = {
      trackingNo: trackingNumber,
      qrCodeNo: qrCodeString,
      status: "ArrivedAtDistributionCenter",
      orderPlacedStaffId: staff_id,
    };

    const updatedParcel = await Parcel.findOneAndUpdate(
      { parcelId },
      updatedDropOffParcel,
      { new: true }
    );

    // Send emails to sender and receiver with the tracking number.
    const sender = await Customer.findById(dropOffParcel.senderId);
    const receiver = await Customer.findById(dropOffParcel.receiverId);
    const senderEmail = sender.customerEmail;
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
      message:"QR and Tracking number successfully generated - arrived at distribution center",
      updatedParcel,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error in generating qr and tracking number for drop-off parcel",
      error,
    });
  }
};

module.exports = {
  viewAllDropOffupParcels,
  getQRandTrackingNumberForDropOff,
};
