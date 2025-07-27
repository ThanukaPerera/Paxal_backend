// Example: Password Change Controller with Zod Validation
const bcrypt = require("bcryptjs");
const { passwordSchema, adminIdSchema } = require("../../validations/adminValidation");
const { safeValidate } = require("../../middleware/validationMiddleware");
const findAdminFunction = require("../../utils/findAdminFunction");

const changeAdminPassword = async (req, res) => {
  try {
    // 1. Validate admin ID parameter
    const adminIdValidation = safeValidate(adminIdSchema, { adminId: req.params.adminId });
    if (!adminIdValidation.success) {
      return res.status(400).json({
        status: "error",
        message: "Invalid admin ID format",
        code: "INVALID_ADMIN_ID",
        errors: adminIdValidation.errors,
      });
    }

    // 2. Validate password data
    const passwordValidation = safeValidate(passwordSchema, req.body);
    if (!passwordValidation.success) {
      return res.status(400).json({
        status: "error",
        message: "Password validation failed",
        code: "VALIDATION_ERROR",
        errors: passwordValidation.errors,
      });
    }

    const { currentPassword, newPassword } = passwordValidation.data;
    const adminId = req.params.adminId;

    // 3. Find admin
    const admin = await findAdminFunction(adminId);
    if (!admin) {
      return res.status(404).json({
        status: "error",
        message: "Admin not found",
        code: "ADMIN_NOT_FOUND",
      });
    }

    // 4. Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        status: "error",
        message: "Current password is incorrect",
        code: "INVALID_CURRENT_PASSWORD",
      });
    }

    // 5. Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // 6. Update password
    admin.password = hashedNewPassword;
    await admin.save();

    // 7. Success response
    res.status(200).json({
      status: "success",
      message: "Password updated successfully",
      data: {
        adminId: admin.adminId,
        updatedAt: admin.updatedAt,
      },
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Password Change Error:`, {
      adminId: req.params.adminId,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });

    res.status(500).json({
      status: "error",
      message: "Internal server error",
      code: "SERVER_ERROR",
    });
  }
};

module.exports = changeAdminPassword;
