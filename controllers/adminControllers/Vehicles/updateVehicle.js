const Vehicle = require("../../../models/VehicleModel");

/**
 * Enhanced vehicle update controller with professional error handling
 * @param {Object} req - Express request object (with validated data and existing vehicle)
 * @param {Object} res - Express response object
 */
const updateVehicle = async (req, res) => {
  console.log("Updating vehicle...", req.params.id, req.body);
  
  try {
    // The validation is already handled by middleware
    // req.body contains validated data, req.existingVehicle contains current vehicle
    const { id } = req.params;
    const validatedData = req.body;
    const existingVehicle = req.existingVehicle;

    console.log("Validated update data:", validatedData);
    console.log("Existing vehicle:", existingVehicle.vehicleId);

    // Update the vehicle with validated data
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      validatedData,
      { 
        new: true, 
        runValidators: true,
        lean: false // We want the full document for population
      }
    );

    if (!updatedVehicle) {
      return res.status(404).json({
        status: "error",
        message: "Vehicle not found after update",
        code: "VEHICLE_UPDATE_FAILED"
      });
    }

    // Populate the updated vehicle with branch information
    const populatedVehicle = await Vehicle.findById(updatedVehicle._id)
      .populate('assignedBranch', 'branchId location')
      .populate('currentBranch', 'branchId location')
      .lean();

    // Success Response
    res.status(200).json({
      status: "success",
      message: "Vehicle updated successfully",
      data: {
        vehicleId: populatedVehicle.vehicleId,
        registrationNo: populatedVehicle.registrationNo,
        vehicleType: populatedVehicle.vehicleType,
        assignedBranch: populatedVehicle.assignedBranch,
        currentBranch: populatedVehicle.currentBranch,
        capableVolume: populatedVehicle.capableVolume,
        capableWeight: populatedVehicle.capableWeight,
        available: populatedVehicle.available,
        updatedAt: populatedVehicle.updatedAt,
      },
    });
  } catch (error) {
    // Error Classification
    let statusCode = 500;
    let errorMessage = "Internal server error";
    let errorCode = "SERVER_ERROR";

    // Handle specific error types
    if (error.name === "ValidationError") {
      statusCode = 400;
      errorMessage = Object.values(error.errors)
        .map((val) => val.message)
        .join(", ");
      errorCode = "VALIDATION_ERROR";
    } else if (error.name === "CastError") {
      statusCode = 400;
      errorMessage = "Invalid vehicle ID format";
      errorCode = "INVALID_VEHICLE_ID";
    } else if (error.code === 11000) {
      statusCode = 409;
      const duplicateField = Object.keys(error.keyPattern)[0];
      if (duplicateField === 'registrationNo') {
        errorMessage = "Vehicle with this registration number already exists";
        errorCode = "DUPLICATE_REGISTRATION_NUMBER";
      } else {
        errorMessage = `Vehicle with this ${duplicateField} already exists`;
        errorCode = "DUPLICATE_VEHICLE";
      }
    }

    // Secure Logging
    console.error(`[${new Date().toISOString()}] Vehicle Update Error:`, {
      code: errorCode,
      vehicleId: req.params.id,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      requestBody:
        process.env.NODE_ENV === "development" ? req.body : undefined,
    });

    // Client Response
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

module.exports = updateVehicle;
