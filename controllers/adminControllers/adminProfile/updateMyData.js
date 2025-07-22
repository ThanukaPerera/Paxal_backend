const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Admin = require("../../../models/AdminModel");

// Validation middleware (named export)
const validateProfileUpdate = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 50 })
    .withMessage("Name must be less than 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("nic")
    .trim()
    .notEmpty()
    .withMessage("NIC is required")
    .matches(/^(?:\d{9}[vVxX]|\d{12})$/)
    .withMessage("Invalid NIC format"),

  body("contactNo")
    .trim()
    .notEmpty()
    .withMessage("Contact number is required")
    .matches(/^(?:\+94|94|0)(\d{9})$/)
    .withMessage("Invalid contact number format"),
];

// Update profile handler (named export)
const updateMyData = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((err) => ({
          field: err.param,
          message: err.msg,
        })),
      });
    }

    const userId = req.admin._id; // Corrected line
    const updateData = req.body;

    const existingAdmin = await Admin.findOne({
      $and: [
        { _id: { $ne: userId } },
        { $or: [{ email: updateData.email }, { nic: updateData.nic }] },
      ],
    });

    if (existingAdmin) {
      const conflicts = [];
      if (existingAdmin.email === updateData.email)
        conflicts.push({ field: "email", message: "Email already in use" });
      if (existingAdmin.nic === updateData.nic)
        conflicts.push({ field: "nic", message: "NIC already in use" });
      return res.status(409).json({ success: false, errors: conflicts });
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("-password -__v");

    if (!updatedAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedAdmin,
    });
  } catch (error) {
    console.error("Profile update error:", error);

    if (error instanceof mongoose.Error.ValidationError) {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return res.status(400).json({ success: false, errors });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
module.exports = {
  validateProfileUpdate,
  updateMyData,
};
