// const nodemailer = require("nodemailer");

// const sendEmail = async (options) => {
//   console.log("Sending email to:", options.email);
//   console.log(process.env.EMAIL_USER, process.env.EMAIL_PASS);
//   const transporter = nodemailer.createTransport({
//     service: "Gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   const mailOptions = {
//     from: '"WELCOME TO THE PAXAL" <dbihimuthu@gmail.com>',
//     to: options.email,
//     subject: options.subject,
//     html: options.html,
//   };

//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;





const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  try {
    // Input validation
    if (!options) {
      throw new Error("Email options are required");
    }

    if (!options.email) {
      throw new Error("Recipient email address is required");
    }

    if (!options.subject) {
      throw new Error("Email subject is required");
    }

    if (!options.html && !options.text) {
      throw new Error("Email content (html or text) is required");
    }

    // Environment validation
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Email credentials are not configured. Please set EMAIL_USER and EMAIL_PASS environment variables");
    }

    console.log("Sending email to:", options.email);
    
    // Create transporter with error handling
    const transporter = nodemailer.createTransporter({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Add connection timeout and retry options
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 5000,    // 5 seconds
      socketTimeout: 10000,     // 10 seconds
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log("SMTP connection verified successfully");
    } catch (verifyError) {
      console.error("SMTP verification failed:", verifyError.message);
      throw new Error(`Email service configuration error: ${verifyError.message}`);
    }

    const mailOptions = {
      from: `"WELCOME TO THE PAXAL" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
      text: options.text, // Include text fallback if provided
    };

    // Send email with detailed error handling
    const info = await transporter.sendMail(mailOptions);
    
    console.log("Email sent successfully:", {
      messageId: info.messageId,
      to: options.email,
      subject: options.subject
    });

    return {
      success: true,
      messageId: info.messageId,
      message: "Email sent successfully"
    };

  } catch (error) {
    console.error("Email sending failed:", {
      error: error.message,
      stack: error.stack,
      recipient: options?.email,
      subject: options?.subject
    });

    // Categorize errors for better handling
    let errorMessage = "Failed to send email";
    let errorCode = "EMAIL_SEND_FAILED";

    if (error.code === "EAUTH" || error.responseCode === 535) {
      errorMessage = "Email authentication failed. Please check email credentials";
      errorCode = "EMAIL_AUTH_FAILED";
    } else if (error.code === "ECONNECTION" || error.code === "ETIMEDOUT") {
      errorMessage = "Failed to connect to email server. Please check internet connection";
      errorCode = "EMAIL_CONNECTION_FAILED";
    } else if (error.code === "EMESSAGE") {
      errorMessage = "Invalid email message format";
      errorCode = "EMAIL_MESSAGE_INVALID";
    } else if (error.message.includes("Invalid login")) {
      errorMessage = "Invalid email credentials";
      errorCode = "EMAIL_INVALID_CREDENTIALS";
    }

    // Re-throw with enhanced error information
    const enhancedError = new Error(errorMessage);
    enhancedError.code = errorCode;
    enhancedError.originalError = error;
    enhancedError.recipient = options?.email;
    
    throw enhancedError;
  }
};

module.exports = sendEmail;
