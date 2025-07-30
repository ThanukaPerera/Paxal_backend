const nodemailer = require('nodemailer');
const path = require("path");
const fs = require("fs");

require('dotenv').config();

const sender = process.env.EMAIL_USER;

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

// get password reset email template 
const getResetEmail = (resetCode) => {

  // Path to access the email template.
  const resetEmailPath = path.join(
    "emails",
    "templates",
    "passwordResetEmail.html"
  );

  let htmlContent = fs.readFileSync(resetEmailPath, "utf8");
  return htmlContent.replace("{RESET_CODE}", resetCode);
};

// send password reset email
const sendPasswordResetEmail = async (email, resetCode) => {
  try {
    const htmlContent = getResetEmail(resetCode);

    const mailInfo = {
      from: `PAXAL Support ${sender}`,
      to: email,
      subject: "Your Password Reset Request",
      html: htmlContent,
    };

    const sentResult = await transporter.sendMail(mailInfo);
    console.log("password reset email sent");
    return { success: true, messageId: sentResult.messageId };

  } catch (error) {
    console.error("Password reset email sending failed", error);
    return { success: false, error: error.message,};
  }
};

// get tracking number email template
const getTrackingNumberEmail = (parcelId, trackingNumber) => {

  // ath to access the email template.
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

// send tracking number emails when parcel is registered
const sendTrackingNumberEmail = async (email, parcelId, trackingNumber) => {
  try {
    const htmlContent = getTrackingNumberEmail(parcelId, trackingNumber);

    const mailInfo = {
      from: `PAXAL Support ${sender}`,
      to: email,
      subject: "Your Parcel Tracking Number",
      html: htmlContent,
    };
    
    const sentResult = await transporter.sendMail(mailInfo);
    console.log("Parcel tracking number email sent");
    return { success: true, messageId: sentResult.messageId };

  } catch (error) {
    console.error("Parcel tracking number email sending failed ",error);
    return { success: false, error: error.message,};
  }
};


// get collection center arrived email template
const getCollectionCenterArrivedEmail = (decodedText, branchName) => {

  // ath to access the email template.
  const arrivedEmailPath = path.join(
    "emails",
    "templates",
    "parcelArrivedEmail.html"
  );

  let htmlContent = fs.readFileSync(arrivedEmailPath, "utf8");
  return htmlContent
    .replace("{PARCEL_ID}", decodedText)
    .replace("{BRANCH}", branchName);
};

// send tracking number emails when parcel is registered
const sendCollectionCenterArrivedEmail = async (email, decodedText, branchName) => {
  try {
    const htmlContent = getCollectionCenterArrivedEmail(decodedText, branchName);

    const mailInfo = {
      from: `PAXAL Support ${sender}`,
      to: email,
      subject: "Your Parcel Is Now At Collection Center",
      html: htmlContent,
    };
    
    const sentResult = await transporter.sendMail(mailInfo);
    console.log("Parcel Arrived at Collection Center email sent");
    return { success: true, messageId: sentResult.messageId };

  } catch (error) {
    console.error("Parcel Arrived at Collection Center email failed ",error);
    return { success: false, error: error.message,};
  }
};


// get collection center arrived email template
const getParcelDeliveredEmail = (parcelId) => {

  // ath to access the email template.
  const arrivedEmailPath = path.join(
    "emails",
    "templates",
    "parcelDeliveredEmail.html"
  );

  let htmlContent = fs.readFileSync(arrivedEmailPath, "utf8");
  return htmlContent
    .replace("{PARCEL_ID}", parcelId);
};

// send tracking number emails when parcel is registered
const sendParcelDeliveredEmail = async (email, parcelId) => {
  try {
    const htmlContent = getParcelDeliveredEmail(parcelId);

    const mailInfo = {
      from: `PAXAL Support ${sender}`,
      to: email,
      subject: "Your Parcel Has been Delivered",
      html: htmlContent,
    };
    
    const sentResult = await transporter.sendMail(mailInfo);
    console.log("Parcel Delivered Center email sent");
    return { success: true, messageId: sentResult.messageId };

  } catch (error) {
    console.error("Parcel Delivered email failed ",error);
    return { success: false, error: error.message,};
  }
};

// get collection center arrived email template
const getReturnToBranchEmail = (decodedText, branchName) => {

  // ath to access the email template.
  const arrivedtoReturnBranchEmailPath = path.join(
    "emails",
    "templates",
    "parcelAtReturnBranchEmail.html"
  );

  let htmlContent = fs.readFileSync(arrivedtoReturnBranchEmailPath, "utf8");
  return htmlContent
    .replace("{PARCEL_ID}", decodedText)
    .replace("{BRANCH}", branchName);
};

// send tracking number emails when parcel is registered
const sendReturnToBranchEmail = async (email, decodedText, branchName) => {
  try {
    const htmlContent = getReturnToBranchEmail(decodedText, branchName);

    const mailInfo = {
      from: `PAXAL Support ${sender}`,
      to: email,
      subject: "Your Parcel Is Returned to Branch",
      html: htmlContent,
    };
    
    const sentResult = await transporter.sendMail(mailInfo);
    console.log("Parcel Arrived at Return Branch email sent");
    return { success: true, messageId: sentResult.messageId };

  } catch (error) {
    console.error("Parcel Arrived at Return Branch email failed ",error);
    return { success: false, error: error.message,};
  }
};


// get inquiry reply email template
const getInquiryReplyEmail = (
  trackingNo, 
  customerName, 
  reply, 
  inquiryDate, 
  inquiry, 
  staffName
) => 
  {
    // Path to access the email template.
    const inquiryReplyEmailPath = path.join(
      "emails",
      "templates",
      "inquiryReplyEmail.html"
    );

    let htmlContent = fs.readFileSync(inquiryReplyEmailPath, "utf8");
    return htmlContent
      .replace("{CUSTOMER_NAME}", customerName)
      .replace("{TRACKING_NO}", trackingNo)
      .replace("{INQUIRY_DATE}", inquiryDate)
      .replace("{MESSAGE}", inquiry)
      .replace("{STAFF_NAME}", staffName)
      .replace("{REPLY}", reply);
};

// send inquiry reply email
const sendInquiryReplyEmail = async (
  email, 
  trackingNo, 
  name, 
  reply, 
  inquiryDate, 
  inquiry, 
  staffName
) => 
  {
    try {
      const htmlContent = getInquiryReplyEmail(trackingNo, name, reply, inquiryDate, inquiry, staffName);

      const mailInfo = {
        from: `PAXAL Support ${sender}`,
        to: email,
        subject: "Response to Your Inquiry",
        html: htmlContent,
      };

      const sentResult = await transporter.sendMail(mailInfo);
      console.log("Inquiry reply  email sent");
      return { success: true, messageId: sentResult.messageId };

    } catch (error) {
      console.error("Inquiry reply  email sending failed ",error);
      return { success: false, error: error.message,};
    }
};

// get use password email template 
const getUserPasswordEmail = (password) => {

  // Path to access the email template.
  const userPasswordEmailPath = path.join(
    "emails",
    "templates",
    "userPasswordEmail.html"
  );

  let htmlContent = fs.readFileSync(userPasswordEmailPath, "utf8");
  return htmlContent.replace("{TEMP_PASSWORD}", password);
};

// send user password email
const sendUserPasswordEmail = async (email, password) => {
  try {
    const htmlContent = getUserPasswordEmail(password);

    const mailInfo = {
      from: `PAXAL Support ${sender}`,
      to: email,
      subject: "Your Account Password",
      html: htmlContent,
    };

    const sentResult = await transporter.sendMail(mailInfo);
    console.log("user password email sent");
    return { success: true, messageId: sentResult.messageId };

  } catch (error) {
    console.error("User password email sending failed", error);
    return { success: false, error: error.message,};
  }
};

module.exports = { 
  sendPasswordResetEmail,
  sendTrackingNumberEmail,
  sendInquiryReplyEmail,
  sendCollectionCenterArrivedEmail,
  sendParcelDeliveredEmail,
  sendUserPasswordEmail,
  sendReturnToBranchEmail
};
