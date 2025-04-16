const bcrypt = require("bcryptjs");
const Admin = require("../../models/AdminModel");

const resetPassword = async (req, res) => {
    const { email, otp, password,confirmPassword } = req.body;

    console.log("Reset password request received for:", email);
    
    try {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            console.log("Admin not found.");
            return res.status(404).json({ success: false, message: "Admin not found." });
        }

        if (admin.resetCode !== parseInt(otp) || Date.now() > admin.resetCodeExpires) {
            console.log("Invalid or expired reset code.");
            return res.status(400).json({ success: false, message: "Invalid or expired reset code." });
        }

        // Hash the new password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        admin.password = hashedPassword;

        // Clear reset code fields after successful reset
        admin.resetCode = null;
        admin.resetCodeExpires = null;

        await admin.save();

        console.log("Password reset successfully.");
        res.status(200).json({ success: true, message: "Password reset successfully." });

    } catch (err) {
        console.error("Error resetting password:", err);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};

module.exports = resetPassword;
