const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Validate required options
    if (!options.to) throw new Error("Missing 'to' field in email options");
    if (!options.subject)throw new Error("Missing 'subject' field in email options");
    if (!options.html) throw new Error("Missing 'html' field in email options");

    const mailOptions = {
      from: `"Paxal Support" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text:
        options.html && typeof options.html === "string"
          ? `Your Paxal verification code is: ${
              options.html.match(/\d{6}/)?.[0] || "N/A"
            }`
          : "Your Paxal verification code is not available.",
    };

    console.log("Sending email to:", options.to);
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, message: `Error sending email: ${error.message}` };
  }
};

module.exports = sendEmail;
