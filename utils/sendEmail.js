// const nodemailer = require("nodemailer");

// const sendEmail = async (to, subject, text) => {
//     try {
//         const transporter = nodemailer.createTransport({
//             service: "gmail",
//             auth: {
//                 user: process.env.EMAIL_USER,
//                 pass: process.env.EMAIL_PASS,
//             },
//         });

//         const mailOptions = {
//             from: process.env.EMAIL_USER,
//             to,
//             subject,
//             text,
//         };
//         console.log("Sending email to:", to,"....");

//         await transporter.sendMail(mailOptions);
//         console.log("Email sent successfully");
//         return { success: true, message: "Email sent successfully" };

//     } catch (error) {
//         console.error("Error sending email:", error);
//         return { success: false, message: "Error sending email" };
//     }
// };

// module.exports = sendEmail;

const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // Accept single options object
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Paxal Support" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html, // Make sure this line exists
      text: `Your Paxal verification code is: ${
        options.html.match(/\d{6}/)?.[0] || ""
      }`, // Fallback text version
    };

    console.log("Sending email to:", options.to);
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, message: "Error sending email" };
  }
};

module.exports = sendEmail;
