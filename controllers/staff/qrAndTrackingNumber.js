const crypto = require("crypto");
const QRCode = require("qrcode");

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

    // const updatedParcel = await Parcel.findOneAndUpdate(
    //   { parcelId },
    //   { status: "ArrivedAtCollectionCenter" },
    //   { new: true }
    // );

    // if (!updatedParcel) {
    //   return res.status(404).json({ message: "Parcel not found" });
    // }

    return res
      .status(200)
      .json({
        success: true,
        message: "Parcel status updated successfully",
        // data: updatedParcel,
      });
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
