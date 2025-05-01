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
    console.log("Error in generating the tracking number", error)
  }
};

// generate the qr code
const generateQRCode = async (parcelData) => {
  try {
    const qr = await QRCode.toDataURL(parcelData, {errorCorrectionLevel: "H",});
    console.log("-----QR Generated-------");
    return qr;
  } catch (error) {
    console.error("Error in generating the qr code",error);
  }
};

module.exports= {
  generateQRCode,
  generateTrackingNumber
}