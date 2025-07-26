const Driver = require("../../../../../models/driverModel");
const { driverUpdateSchema } = require("../../../../../validations/adminValidation");
const { safeValidate } = require("../../../../../middleware/adminMiddleware/validationMiddleware");

const updateDriverById = async (req, res) => {
  try {
    const driverId = req.params.id;
    
    // 1. Validate update data using Zod schema (validation already done by middleware)
    const updateData = req.validatedData;

    // 2. Check if driver exists
    const existingDriver = await Driver.findOne({ driverId });
    if (!existingDriver) {
      return res.status(404).json({
        status: "error",
        message: "Driver not found",
        code: "DRIVER_NOT_FOUND",
      });
    }

    // 3. Check for email uniqueness if email is being updated
    if (updateData.email && updateData.email !== existingDriver.email) {
      const existingDriverByEmail = await Driver.findOne({ 
        email: updateData.email,
        driverId: { $ne: driverId }
      });
      
      if (existingDriverByEmail) {
        return res.status(409).json({
          status: "error",
          message: "Driver with this email already exists",
          code: "DUPLICATE_EMAIL",
        });
      }
    }

    // 4. Check for NIC uniqueness if NIC is being updated
    if (updateData.nic && updateData.nic !== existingDriver.nic) {
      const existingDriverByNic = await Driver.findOne({ 
        nic: updateData.nic,
        driverId: { $ne: driverId }
      });
      
      if (existingDriverByNic) {
        return res.status(409).json({
          status: "error",
          message: "Driver with this NIC already exists",
          code: "DUPLICATE_NIC",
        });
      }
    }

    // 5. Check for license ID uniqueness if licenseId is being updated
    if (updateData.licenseId && updateData.licenseId !== existingDriver.licenseId) {
      const existingDriverByLicense = await Driver.findOne({ 
        licenseId: updateData.licenseId,
        driverId: { $ne: driverId }
      });
      
      if (existingDriverByLicense) {
        return res.status(409).json({
          status: "error",
          message: "Driver with this license ID already exists",
          code: "DUPLICATE_LICENSE",
        });
      }
    }

    // 6. Update driver data
    const updatedDriver = await Driver.findOneAndUpdate(
      { driverId },
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
     .populate('adminId', 'name email')
     .populate('vehicleId', 'vehicleNumber vehicleType');

    if (!updatedDriver) {
      return res.status(404).json({
        status: "error",
        message: "Failed to update driver",
        code: "UPDATE_FAILED",
      });
    }

    // 7. Return success response
    return res.status(200).json({
      status: "success",
      message: "Driver updated successfully",
      data: {
        driver: {
          driverId: updatedDriver.driverId,
          name: updatedDriver.name,
          email: updatedDriver.email,
          nic: updatedDriver.nic,
          contactNo: updatedDriver.contactNo,
          licenseId: updatedDriver.licenseId,
          branch: updatedDriver.branchId,
          admin: updatedDriver.adminId,
          vehicle: updatedDriver.vehicleId,
          createdAt: updatedDriver.createdAt,
          updatedAt: updatedDriver.updatedAt
        }
      }
    });

  } catch (error) {
    console.error("Error updating driver:", error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        status: "error",
        message: "Driver validation failed",
        code: "VALIDATION_ERROR",
        errors: validationErrors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        status: "error",
        message: `Driver with this ${field} already exists`,
        code: "DUPLICATE_KEY",
        field
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Internal server error while updating driver",
      code: "INTERNAL_ERROR",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = updateDriverById;
