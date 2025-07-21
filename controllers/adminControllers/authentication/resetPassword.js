const bcrypt = require("bcryptjs");
const Admin = require("../../../models/AdminModel");

// Password validation function
const validatePassword = (password) => {
    const errors = [];
    
    if (!password) {
        errors.push("Password is required");
        return { isValid: false, errors };
    }
    
    if (password.length < 8) {
        errors.push("Password must be at least 8 characters long");
    }
    
    if (password.length > 128) {
        errors.push("Password must not exceed 128 characters");
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter");
    }
    
    if (!/[0-9]/.test(password)) {
        errors.push("Password must contain at least one number");
    }
    
    if (!/[@$!%*?&]/.test(password)) {
        errors.push("Password must contain at least one special character (@$!%*?&)");
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

const resetPassword = async (req, res) => {
    const { email, otp, password, confirmPassword } = req.body;

    console.log("Reset password request received for:", email);
    
    try {
        // Validate required fields
        if (!email && !otp) {
            return res.status(400).json({ 
                success: false, 
                message: "Email or OTP is required for password reset." 
            });
        }
        
        if (!password) {
            return res.status(400).json({ 
                success: false, 
                message: "New password is required." 
            });
        }
        
        if (!confirmPassword) {
            return res.status(400).json({ 
                success: false, 
                message: "Password confirmation is required." 
            });
        }
        
        // Validate password confirmation
        if (password !== confirmPassword) {
            return res.status(400).json({ 
                success: false, 
                message: "Password and confirmation password do not match." 
            });
        }
        
        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({ 
                success: false, 
                message: "Password does not meet security requirements.",
                errors: passwordValidation.errors
            });
        }

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
        const hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds for better security
        admin.password = hashedPassword;

        // Clear reset code fields after successful reset
        admin.resetCode = null;
        admin.resetCodeExpires = null;

        await admin.save();

        console.log("Password reset successfully for admin:", admin.name);
        res.status(200).json({ 
            success: true, 
            message: "Password reset successfully. You can now login with your new password." 
        });

    } catch (err) {
        console.error("Error resetting password:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error. Please try again later." 
        });
    }
};

module.exports = resetPassword;
