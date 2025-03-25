const { Parcel } = require("../models/parcelModels");
const crypto = require("crypto");
const QRCode = require("qrcode");
const {sendTrackingNumberEmail} = require("../emails/emails")

//GENERATE TRACKING NUMBER
const generateTrackingNumber = async (regTime) => {
  const randomCode = crypto.randomBytes(4).toString("hex").toUpperCase();
  const timestamp = Math.floor(regTime / 1000).toString();
  console.log("------Tracking number generated------");

  return `${randomCode}-${timestamp}`;
};

// GENERATE THE QR CODE
const generateQRCode = async (parcelData) => {
  try {
    const qr = await QRCode.toDataURL(parcelData, {
      errorCorrectionLevel: "H",
    });

    console.log("------QR code generated------");
    return qr;
  } catch (error) {
    console.error(error);
  }
};

// ADD NEW PARCEL - PARCEL REGISTRATION FORM
const registerParcel = async (req, res) => {
  try {
    // Find last parcel ID and generate the next one
    const lastParcel = await Parcel.findOne().sort({ parcelId: -1 }).lean();
    let nextParcelId = "PARCEL001"; // Default ID if no parcels exist

    if (lastParcel) {
      const lastIdNumber = parseInt(
        lastParcel.parcelId.replace("PARCEL", ""),
        10
      );
      nextParcelId = `PARCEL${String(lastIdNumber + 1).padStart(3, "0")}`;
    }

    let trackingNumber;
    let numberExists;
    do {
      trackingNumber = await generateTrackingNumber(req.updatedData.orderTime);
      numberExists = await Parcel.findOne({ trackingNumber });
    } while (numberExists);

    // Create new parcel with the generated ID
    const parcelData = {
      ...req.updatedData.originalData,
      senderId: req.updatedData.customerRef,
      receiverId: req.updatedData.receiverRef,
      parcelId: nextParcelId,
      trackingNo: trackingNumber,
      submittingType: "branch",
      orderPlacedTime: req.updatedData.orderTime,
    };

    // Generate the qr code for the parcel
    //const qrCodeString = await generateQRCode(JSON.stringify(parcelData)); to encode all data
    const qrCodeString = await generateQRCode(parcelData.parcelId);
    parcelData.qrCodeNo = qrCodeString;

    const parcel = new Parcel(parcelData);
    
    const savedParcel = await parcel.save();
    console.log("Parcel registered");

    // SEND EMAILS TO SENDER AND RECEIVER
    const senderEmail = parcelData.customerEmail;
    const receiverEmail = parcelData.receiverEmail;
    console.log(senderEmail, receiverEmail)
    await sendTrackingNumberEmail(senderEmail, parcelData.parcelId, parcelData.trackingNo);
    await sendTrackingNumberEmail(receiverEmail, parcelData.parcelId, parcelData.trackingNo);



    res.status(201).json({ message: "Parcel registered", savedParcel });
  } catch (error) {
    res.status(500).json({ message: "Error registering parcel", error });
  }
};

module.exports = {
  registerParcel,
};
