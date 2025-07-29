const  Staff  = require("../../models/StaffModel")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { sendPasswordResetEmail } = require("../../emails/emails");

require("dotenv").config();

// server route 
const checkAuthenticity = (req, res) => {
  res.status(200).json({ isAuthenticated: true, user: req.staff });
};


// staff login
const staffLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Search for a staff member with the email.
    const staff = await Staff.findOne({ email });

    if (!staff) {
      return res.status(401).json({ message: "Invalid staff credentials" });
    }
 
    const isPasswordValid = await bcrypt.compare(password, staff.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid staff credentials" });
    }

    // Generate JWT Token.
    const token = jwt.sign(
      { _id: staff._id, email: staff.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    ); 

    res.cookie("StaffToken", token, {
      httpOnly: true, 
      secure:true, //  In production, set this to true to allow only HTTPS . 
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.status(200).json({ message: "Login successful", staff });
  } catch (error) {
    return res.status(500).json({ message: "Server error, please try again later", error }) 
  }
};


// staff logout
const staffLogout = (req, res) => {
  try {
    res.clearCookie("StaffToken", {
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: false
    });
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.log("Logout error: ", error);
    return res.status(500).json({success: false, message: "Error in loggin out, Please try again"})
  }
};


// staff forgot password request handler
const staffForgotPassword = async (req, res) => {
  try {
    
    const { email } = req.body;
    console.log(email);

    // Search for a staff member with the email.
    const staff = await Staff.findOne({ email });
    
    if (!staff) {
      return res.status(400).json({ message: "No staff found with the provided email" });
    }

    // Generate a reset token and set an expiry date for the token.
    const resetStaffToken = crypto.randomInt(100000, 999999).toString();

    // Save the reset token and expiry date to the staff document.
    staff.resetPasswordToken = resetStaffToken;
    staff.resetPasswordTokenExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
    await staff.save();

    // Send the email with the reset token.
    const result = await sendPasswordResetEmail(email, resetStaffToken);
    if (!result.success) {
      return res.status(500).json({message: result.messageId})
    }
    console.log("Password reset email has  been sent")
    return res.status(200).json({ message: "Password reset code has been sent to your email" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error, please try again later" });
  }
};


// staff password reset code verification
const staffPasswordResetCode = async (req, res) => {
  try {
    
    const {email, resetCode } = req.body;
    
    // Search for a staff member with the email.
    const staff = await Staff.findOne({ email});    
    
    if (!staff) {
      return res.status(400).json({message: "No staff found with the provided email" });
    }

    // Check if the reset code matches.
    if (staff.resetPasswordToken !== String(resetCode)) {
      return res.status(400).json({ message: "Invalid password reset code" });
    }

    // Check if the reset code has expired.
    if (new Date(staff.resetPasswordTokenExpires).getTime() < Date.now()) {
      return res.status(400).json({ message: "Password reset code has expired" });
    }
   
    return res.status(200).json({ success:true, message: "Password reset code is valid" });
  } catch (error) {

    res.status(500).json({ success: false, message: "Server error, please try again later" });
  }
};

// update the staff passowrd
const staffPasswordUpdate = async (req, res) => {
  try {    
    const { newPassword , resetCode , email} = req.body;
    
    // Search for a staff member with the email.
    const staff = await Staff.findOne({ email });

    if (!staff) {
      return res.status(400).json({ message: "No staff found with the provided email" });
    }
    
    if (staff.resetPasswordToken !== String(resetCode) || Date.now() > staff.resetPasswordTokenExpires) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    // Hash the new password for security.
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the password and remove the reset token.
    staff.password = hashedPassword;
    staff.resetPasswordToken = undefined;
    staff.resetPasswordTokenExpires = undefined;

    await staff.save();

    res.status(200).json({ success: true, message: "Password updated successfully!" });
  } catch (error) {
    res.status(500).json({success:false, message:"Failed to update the password"})
  }
};

// STAFF LOGGED PAGE
const getStaffLoggedPage = (req, res) => {
  res.json({ message: "Welcome to Staff Main Menu", staff: req.staff });
};

// get Staff Information
const getStaffInfo = async(req, res) => {
  try {
    const staffId = req.staff._id;
    const staff = await Staff.findOne({staffId: staffId});

    if(!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    console.log("Staff information retrieved successfully");
    return res.status(200).json(staff);
  }catch (error) {
    console.error("Error fetching staff information:", error);
    return res.status(500).json({ message: "Error fetching staff information", error });
  }
}

//update the staff information
const updateStaffInfo = async (req, res) => {
  try {
    const staffId = req.staff._id; 
    const { name, email, contactNo, nic } = req.body;

    const updatedStaff = await Staff.findByIdAndUpdate(
      staffId,
      { name, email, contactNo, nic },
      { new: true } 
    );

    if (!updatedStaff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    res.status(200).json(updatedStaff);
  } catch (error) {
    console.error("Error updating staff profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// staff profile picture update

const staffProfilePicUpdate = async (req, res) => {
  try {
    const { public_id, userId } = req.uploadData;
    
    
    const updatedStaff = await Staff.findByIdAndUpdate(
      userId,
      { profilePicLink: public_id },
      { new: true, runValidators: true }
    );

    
    if (!updatedStaff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }
    console.log("Profile picture updated successfully");
    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      profilePicLink: updatedStaff.profilePicLink,
    });
  } catch (error) {
    console.error("Database update error:", error);
    res.status(500).json({message: "Failed to update profile picture",error: error.message,})
  }
};

// Get staff's branch
const getStaffBranch = async (req, res) => {
  try {
    // Find the branch.
    const staff_id = req.staff._id.toString();
    const staff = await Staff.findById(staff_id);
    const branch_id = staff.branchId;
    const branch = await Branch.findById(branch_id);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    const from = branch.location;
    console.log(from);

    return res.status(200).json({from});
  } catch (error) {
    console.log("Error fetching staff's branch:", error);
    return res
      .status(500)
      .json({ message: "Error fetching staff's branch", error });
  }
};

module.exports = {
  checkAuthenticity,
  staffLogin,
  staffLogout,
  staffForgotPassword,
  staffPasswordResetCode,
  staffPasswordUpdate,
  getStaffLoggedPage, 
  getStaffInfo,
  updateStaffInfo,
  staffProfilePicUpdate,
  getStaffBranch
};
