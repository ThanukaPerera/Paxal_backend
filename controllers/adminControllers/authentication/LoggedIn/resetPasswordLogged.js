const bcrypt = require("bcryptjs");
const Admin = require("../../../../models/AdminModel");

const resetPasswordLogged = async (req, res) => {
    const { otp, password, confirmPassword } = req.body;
    const email = req.admin.email; // Get email from authenticated admin

    if (!password || !confirmPassword) {
        return res.status(400).json({ 
            success: false, 
            message: "Both password fields are required" 
        });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ 
            success: false, 
            message: "Passwords do not match" 
        });
    }

    try {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(404).json({ 
                success: false, 
                message: "Admin not found" 
            });
        }

        if (admin.resetCode !== parseInt(otp) || Date.now() > admin.resetCodeExpires) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid or expired verification code" 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        admin.password = hashedPassword;
        admin.resetCode = null;
        admin.resetCodeExpires = null;

        await admin.save();

        res.status(200).json({ 
            success: true, 
            message: "Password reset successfully" 
        });

    } catch (err) {
        console.error("Password reset error:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

module.exports = resetPasswordLogged;