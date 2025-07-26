const Staff = require("../../../../../models/StaffModel");
const { staffUpdateSchema } = require("../../../../../validations/adminValidation");
const { safeValidate } = require("../../../../../middleware/adminMiddleware/validationMiddleware");

const updateStaffById = async (req, res) => {
  try {
    const staffId = req.params.id;
    console.log("Updating staff with ID:", staffId);
    
    // 1. Validate update data using Zod schema (validation already done by middleware)
    const updateData = req.validatedData;

    // 2. Check if staff exists
    const existingStaff = await Staff.findOne({ _id:staffId });
    if (!existingStaff) {
      return res.status(404).json({
        status: "error",
        message: "Staff member not found",
        code: "STAFF_NOT_FOUND",
      });
    }

    // 3. Check for email uniqueness if email is being updated
    if (updateData.email && updateData.email !== existingStaff.email) {
      const existingStaffByEmail = await Staff.findOne({ 
        email: updateData.email,
        staffId: { $ne: staffId }
      });
      
      if (existingStaffByEmail) {
        return res.status(409).json({
          status: "error",
          message: "Staff member with this email already exists",
          code: "DUPLICATE_EMAIL",
        });
      }
    }

    // 4. Check for NIC uniqueness if NIC is being updated
    if (updateData.nic && updateData.nic !== existingStaff.nic) {
      const existingStaffByNic = await Staff.findOne({ 
        nic: updateData.nic,
        staffId: { $ne: staffId }
      });
      
      if (existingStaffByNic) {
        return res.status(409).json({
          status: "error",
          message: "Staff member with this NIC already exists",
          code: "DUPLICATE_NIC",
        });
      }
    }

    // 5. Update staff data
    const updatedStaff = await Staff.findOneAndUpdate(
      { staffId },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('branchId', 'location contact')
     .populate('adminId', 'name email');

    if (!updatedStaff) {
      return res.status(404).json({
        status: "error",
        message: "Failed to update staff member",
        code: "UPDATE_FAILED",
      });
    }

    // 6. Return success response
    return res.status(200).json({
      status: "success",
      message: "Staff member updated successfully",
      data: {
        staff: {
          staffId: updatedStaff.staffId,
          name: updatedStaff.name,
          email: updatedStaff.email,
          nic: updatedStaff.nic,
          contactNo: updatedStaff.contactNo,
          status: updatedStaff.status,
          profilePicLink: updatedStaff.profilePicLink,
          branch: updatedStaff.branchId,
          admin: updatedStaff.adminId,
          createdAt: updatedStaff.createdAt,
          updatedAt: updatedStaff.updatedAt
        }
      }
    });

  } catch (error) {
    console.error("Error updating staff:", error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        status: "error",
        message: "Staff validation failed",
        code: "VALIDATION_ERROR",
        errors: validationErrors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        status: "error",
        message: `Staff member with this ${field} already exists`,
        code: "DUPLICATE_KEY",
        field
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Internal server error while updating staff",
      code: "INTERNAL_ERROR",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = updateStaffById;
