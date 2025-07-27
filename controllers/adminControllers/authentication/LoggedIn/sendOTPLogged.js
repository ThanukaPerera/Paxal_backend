const Admin = require("../../../../models/AdminModel");
const sendEmail = require("../../../../utils/admin/sendEmail");

const sendOTPLogged = async (req, res) => {
  const email = req.admin.email;

  // Email template moved outside try-catch for better scoping
  const emailTemplate = (otp) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        .container { max-width: 600px; margin: 20px auto; padding: 30px; font-family: Arial, sans-serif; }
        .header { color: #2c3e50; border-bottom: 2px solid #ecf0f1; padding-bottom: 20px; }
        .content { margin: 25px 0; line-height: 1.6; }
        .otp-box { 
            background: #f8f9fa; 
            padding: 15px 25px; 
            border-radius: 5px; 
            font-size: 24px; 
            font-weight: bold;
            color: #2c3e50;
            margin: 20px 0;
            display: inline-block;
        }
        .footer { 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 2px solid #ecf0f1; 
            color: #7f8c8d; 
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Paxal Security Verification</h2>
        </div>
        
        <div class="content">
            <p>Hello,</p>
            <p>We received a request to verify your account security. Here is your One-Time Password (OTP):</p>
            
            <div class="otp-box">${otp}</div>
            
            <p>This code will expire in <strong>10 minutes</strong>. Please do not share this code with anyone.</p>
            <p>If you didn't request this OTP, please contact our support team immediately.</p>
        </div>

        <div class="footer">
            <p>Best regards,<br>Paxal Team</p>
            <p>Contact us at: <a href="mailto:support@paxal.com">support@paxal.com</a></p>
            <p>© ${new Date().getFullYear()} Paxal. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    admin.resetCode = otp;
    admin.resetCodeExpires = Date.now() + 600000; // 10 minutes
    await admin.save();

    // Send email with proper parameters
    await sendEmail({
      to: email,
      subject: "Your Security Verification Code - Paxal",
      html: emailTemplate(otp),
    });

    console.log("OTP sent to:", email);
    res.status(200).json({ message: "Password reset code sent" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = sendOTPLogged;

module.exports = sendOTPLogged;
