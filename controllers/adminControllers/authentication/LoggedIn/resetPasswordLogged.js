const bcrypt = require("bcryptjs");
const Admin = require("../../../../models/AdminModel");

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

const resetPasswordLogged = async (req, res) => {
    const { otp, password, confirmPassword } = req.body;
    const email = req.admin.email; // Get email from authenticated admin

    try {
        // Validate required fields
        if (!otp) {
            return res.status(400).json({ 
                success: false, 
                message: "Verification code is required" 
            });
        }

        if (!password) {
            return res.status(400).json({ 
                success: false, 
                message: "New password is required" 
            });
        }

        if (!confirmPassword) {
            return res.status(400).json({ 
                success: false, 
                message: "Password confirmation is required" 
            });
        }

        // Validate password confirmation
        if (password !== confirmPassword) {
            return res.status(400).json({ 
                success: false, 
                message: "Password and confirmation password do not match" 
            });
        }

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({ 
                success: false, 
                message: "Password does not meet security requirements",
                errors: passwordValidation.errors
            });
        }

        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(404).json({ 
                success: false, 
                message: "Admin not found" 
            });
        }

        // Validate OTP
        if (!admin.resetCode || admin.resetCode !== parseInt(otp)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid verification code" 
            });
        }

        if (Date.now() > admin.resetCodeExpires) {
            return res.status(400).json({ 
                success: false, 
                message: "Verification code has expired. Please request a new one." 
            });
        }

        // Hash the new password with increased salt rounds for better security
        const hashedPassword = await bcrypt.hash(password, 12);
        admin.password = hashedPassword;
        admin.resetCode = null;
        admin.resetCodeExpires = null;

        await admin.save();

        console.log("Password reset successfully for logged-in admin:", admin.name);
        
        res.status(200).json({ 
            success: true, 
            message: "Password reset successfully. Please use your new password for future logins." 
        });

    } catch (err) {
        console.error("Password reset error:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error. Please try again later." 
        });
    }
};

module.exports = resetPasswordLogged;