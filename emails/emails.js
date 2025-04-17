const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

require("dotenv").config();

const sender = process.env.EMAIL;

// Setup email transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: sender,
    pass: process.env.EMAIL_PASS,
  },
});

// GET PASSWORD RESET EMAIL TEMPLATE
const getResetEmail = (resetCode) => {
  const resetEmailPath = path.join(
    "emails",
    "templates",
    "passwordResetEmail.html"
  );
  let htmlContent = fs.readFileSync(resetEmailPath, "utf8");
  return htmlContent.replace("{RESET_CODE}", resetCode);
};

// SEND PASSWORD RESET EMAIL
const sendPasswordResetEmail = async (email, resetCode) => {
  try {
    const htmlContent = getResetEmail(resetCode);

    const mailInfo = {
      from: sender,
      to: email,
      subject: "Reset Your Password",
      html: htmlContent,
    };

    const sentResult = await transporter.sendMail(mailInfo);
    console.log("email sent");
    return sentResult;
  } catch (error) {
    console.error(error);
  }
};

// SEND TRACKING NUMBER EMAILS WHEN THE PARCEL IS REGISTERED

const getTrackingNumberEmail = (parcelId, trackingNumber) => {
  const trackingNumberEmailPath = path.join(
    "emails",
    "templates",
    "trackingNumberEmail.html"
  );
  let htmlContent = fs.readFileSync(trackingNumberEmailPath, "utf8");
  return htmlContent
    .replace("{PARCEL_ID}", parcelId)
    .replace("{TRACKING_NO}", trackingNumber);
};

const sendTrackingNumberEmail = async (email, parcelId, trackingNumber) => {
  try {
    const htmlContent = getTrackingNumberEmail(parcelId, trackingNumber);

    const mailInfo = {
      from: sender,
      to: email,
      subject: "Your Parcel Tracking Number",
      html: htmlContent,
    };
    const sentResult = await transporter.sendMail(mailInfo);
    console.log("email sent");
    return sentResult;
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  transporter,
  sendPasswordResetEmail,
  sendTrackingNumberEmail
};
