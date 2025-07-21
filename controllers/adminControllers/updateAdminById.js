const findAdminFunction = require("../../utils/findAdminFunction");
const { adminUpdateSchema, adminIdSchema, emailCheckSchema, nicCheckSchema } = require("../../validations/adminValidation");
const { safeValidate } = require("../../middleware/adminMiddleware/validationMiddleware");
const Admin = require("../../models/AdminModel");

const updateAdminById = async (req, res) => {
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

    // 2. Validate update data
    const updateValidation = safeValidate(adminUpdateSchema, req.body);
    if (!updateValidation.success) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        errors: updateValidation.errors,
      });
    }

    const validatedData = updateValidation.data;
    const adminId = req.params.adminId;

    // 3. Check if admin exists
    const admin = await findAdminFunction(adminId);
    if (!admin) {
      return res.status(404).json({
        status: "error",
        message: "Admin not found",
        code: "ADMIN_NOT_FOUND",
      });
    }

    // 4. Check for email uniqueness if email is being updated
    if (validatedData.email && validatedData.email !== admin.email) {
      const emailValidation = safeValidate(emailCheckSchema, { 
        email: validatedData.email, 
        excludeAdminId: adminId 
      });
      
      if (!emailValidation.success) {
        return res.status(400).json({
          status: "error",
          message: "Email validation failed",
          code: "EMAIL_VALIDATION_ERROR",
          errors: emailValidation.errors,
        });
      }

      const existingAdminByEmail = await Admin.findOne({ 
        email: validatedData.email,
        adminId: { $ne: adminId }
      });
      
      if (existingAdminByEmail) {
        return res.status(409).json({
          status: "error",
          message: "Admin with this email already exists",
          code: "DUPLICATE_EMAIL",
        });
      }
    }

    // 5. Check for NIC uniqueness if NIC is being updated
    if (validatedData.nic && validatedData.nic !== admin.nic) {
      const nicValidation = safeValidate(nicCheckSchema, { 
        nic: validatedData.nic, 
        excludeAdminId: adminId 
      });
      
      if (!nicValidation.success) {
        return res.status(400).json({
          status: "error",
          message: "NIC validation failed",
          code: "NIC_VALIDATION_ERROR",
          errors: nicValidation.errors,
        });
      }

      const existingAdminByNic = await Admin.findOne({ 
        nic: validatedData.nic,
        adminId: { $ne: adminId }
      });
      
      if (existingAdminByNic) {
        return res.status(409).json({
          status: "error",
          message: "Admin with this NIC already exists",
          code: "DUPLICATE_NIC",
        });
      }
    }

    // 6. Update admin with validated data
    Object.assign(admin, validatedData);
    const updatedAdmin = await admin.save();

    // 7. Success response (exclude sensitive information)
    const responseData = {
      adminId: updatedAdmin.adminId,
      name: updatedAdmin.name,
      email: updatedAdmin.email,
      contactNo: updatedAdmin.contactNo,
      nic: updatedAdmin.nic,
      profilePicLink: updatedAdmin.profilePicLink,
      updatedAt: updatedAdmin.updatedAt,
    };

    res.status(200).json({
      status: "success",
      message: "Admin updated successfully",
      data: responseData,
    });
  } catch (error) {
    // Error handling
    let statusCode = 500;
    let errorMessage = "Internal server error";
    let errorCode = "SERVER_ERROR";

    // Handle specific error types
    if (error.name === "ValidationError") {
      statusCode = 400;
      errorMessage = Object.values(error.errors)
        .map((val) => val.message)
        .join(", ");
      errorCode = "MONGOOSE_VALIDATION_ERROR";
    } else if (error.name === "CastError") {
      statusCode = 400;
      errorMessage = "Invalid data format";
      errorCode = "CAST_ERROR";
    }

    // Secure logging
    console.error(`[${new Date().toISOString()}] Admin Update Error:`, {
      adminId: req.params.adminId,
      code: errorCode,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      requestBody: process.env.NODE_ENV === "development" ? req.body : undefined,
    });

    res.status(statusCode).json({
      status: "error",
      message: errorMessage,
      code: errorCode,
      ...(process.env.NODE_ENV === "development" && {
        debug: {
          message: error.message,
          stack: error.stack,
        },
      }),
    });
  }
};

  module.exports = updateAdminById;