const Admin = require("../../../models/AdminModel");
const sendEmail = require("../../../utils/sendEmail");

const requestPasswordReset = async (req, res) => {
    const email = req.body.email;

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000);
        const otpExpiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

        // Store OTP and expiry in DB
        admin.resetCode = otp;
        admin.resetCodeExpires = otpExpiry;
        await admin.save();

        // Send OTP via email
        await sendEmail(email, "Password Reset Code", `Your password reset code is: ${otp}`);

        console.log("OTP has sent to your email",email);

        
        res.status(200).json({ message: "Password reset code sent to your email" });

    } catch (err) {
        console.error("Error sending reset code:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = requestPasswordReset;
