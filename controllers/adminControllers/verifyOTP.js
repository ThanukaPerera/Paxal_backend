const { Admin } = require("../../models/models");

const verifyOTP = async (req, res) => {
    console.log("Verifying OTP....");
    const { email, resetCode } = req.body;
    console.log("Email:", email);
    console.log("Reset code:", resetCode);

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            console.log("Admin not found");
            return res.status(404).json({ message: "Admin not found" });
        }
        console.log("Admin found:", admin.name);
        if (admin.resetCode !== parseInt(resetCode) || Date.now() > admin.resetCodeExpires) {
            console.log("Invalid or expired reset code");
            return res.status(400).json({ message: "Invalid or expired reset code" });
        }
        console.log("Reset code verified successfully");
        res.status(200).json({ message: "Reset code verified successfully" });

    } catch (err) {
        console.error("Error verifying reset code:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = verifyOTP;
