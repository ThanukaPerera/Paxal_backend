const Staff = require("../../models/StaffModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { sendPasswordResetEmail } = require("../../emails/emails");

require("dotenv").config();

// Server route (add this to your backend)
const checkAuthenticity = (req, res) => {
  res.status(200).json({ isAuthenticated: true, user: req.staff });
};

// // ADD NEW STAFF
// const addNewStaff = async (req, res) => {
//   try {
//     const { email } = req.body;

//     const staffAlreadyExists = await Staff.findOne({ email });
//     if (staffAlreadyExists) {
//       return res.status(400).json({ message: "Staff already exists" });
//     }
//     // Find last staff ID and generate the next one
//     const lastStaff = await Staff.findOne().sort({ staffId: -1 }).lean();
//     let nextStaffId = "STAFF001"; // Default ID if no staffs exist

//     if (lastStaff) {
//       const lastIdNumber = parseInt(lastStaff.staffId.replace("STAFF", ""), 10);
//       nextStaffId = `STAFF${String(lastIdNumber + 1).padStart(3, "0")}`;
//     }

//     const hashedPassword = await bcrypt.hash(req.body.password, 12);

//     // Create new staff with the generated ID
//     const staffData = {
//       ...req.body,
//       staffId: nextStaffId,
//       password: hashedPassword,
//     };
//     const staff = new Staff(staffData);
//     console.log("Staff registered", staffData);
//     const savedStaff = await staff.save();
//     res.status(201).json({ message: "Staff registered", savedStaff });
//   } catch (error) {
//     res.status(500).json({ message: "Error registering staff", error });
//   }
// };

// STAFF LOGIN
const staffLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(500).json("All fields must be filled");
    }

    // Find staff by email
    const staff = await Staff.findOne({ email });

    if (!staff) {
      return res.status(401).json({ message: "Invalid staff credentials" });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, staff.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid staff credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { _id: staff._id, email: staff.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    ); // Use a strong secret in production

    res.cookie("StaffToken", token, {
      httpOnly: true, // cookie cannot be accessed by client side js
      //secure: process.env.NODE_ENV === "production",
      secure: false,
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "Login successful", email, token });
  } catch (error) {
    res.status(500).json(error);
  }
};

// STAFF LOGOUT
const staffLogout = (req, res) => {
  res.clearCookie("StaffToken");
  res.status(200).json({ message: "Logged out Successfully" });
};

// STAFF FORGOT PASSWORD REQUEST
const staffForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const staff = await Staff.findOne({ email });

    if (!staff) {
      return res
        .status(400)
        .json({ success: false, message: "Staff does not exist" });
    }

    // Generate reset token and expiry date
    const resetStaffToken = crypto.randomInt(100000, 999999).toString();

    staff.resetPasswordToken = resetStaffToken;
    console.log(resetStaffToken);
    staff.resetPasswordTokenExpires = Date.now() + 1 * 60 * 60 * 1000; //1 hour

    await staff.save();

    // send email

    await sendPasswordResetEmail(email, resetStaffToken);

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//FORGOT PASSWORD - RESET CODE
const staffPasswordResetCode = async (req, res) => {
  try {
    const { email, resetCode } = req.body;

    const staff = await Staff.findOne({ email });

    if (!staff) {
      return res.status(400).json({ message: "Staff not found" });
    }

    // Check if the reset code matches
    if (staff.resetPasswordToken !== String(resetCode)) {
      console.log("Invalid reset code");
      return res.status(400).json({ message: "Invalid reset code" });
    }

    // Check if the reset code has expired
    if (new Date(staff.resetPasswordTokenExpires).getTime() < Date.now()) {
      return res
        .status(400)
        .json({ success: false, message: "Reset code has expired" });
    }

    res.status(200).json({ success: true, message: "Reset Code is valid" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//FORGOT PASSWORD - PASSWORD UPDATE
const staffPasswordUpdate = async (req, res) => {
  try {
    const { newPassword, resetCode, email } = req.body;

    const staff = await Staff.findOne({ email });

    if (!staff) {
      return res
        .status(400)
        .json({ success: false, message: "Staff not found" });
    }

    if (
      staff.resetPasswordToken !== String(resetCode) ||
      Date.now() > staff.resetPasswordTokenExpires
    ) {
      console.log("Invalid or expired reset code");
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the password and remove the reset token
    staff.password = hashedPassword;
    staff.resetPasswordToken = undefined;
    staff.resetPasswordTokenExpires = undefined;

    await staff.save();

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully!" });
  } catch (error) {}
};

// STAFF LOGGED PAGE
const getStaffLoggedPage = (req, res) => {
  res.json({ message: "Welcome to Staff Main Menu", staff: req.staff });
};

module.exports = {
  checkAuthenticity,
  staffLogin,
  staffLogout,
  staffForgotPassword,
  staffPasswordResetCode,
  staffPasswordUpdate,
  getStaffLoggedPage,
};
