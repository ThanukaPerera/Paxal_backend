const Vehicle = require("../../../models/VehicleModel");

/**
 * Enhanced vehicle deletion controller with professional error handling
 * @param {Object} req - Express request object (with validated vehicle ID and existing vehicle)
 * @param {Object} res - Express response object
 */
const deleteVehicle = async (req, res) => {
  console.log("Deleting vehicle...", req.params.id);
  
  try {
    // The validation is already handled by middleware
    // req.existingVehicle contains the vehicle to delete
    const { id } = req.params;
    const existingVehicle = req.existingVehicle;

    // Store vehicle details for response
    const vehicleDetails = {
      vehicleId: existingVehicle.vehicleId,
      registrationNo: existingVehicle.registrationNo,
      vehicleType: existingVehicle.vehicleType,
      assignedBranch: existingVehicle.assignedBranch,
    };

    console.log("Deleting vehicle:", vehicleDetails.vehicleId);

    // Delete the vehicle
    const deletedVehicle = await Vehicle.findByIdAndDelete(id);

    if (!deletedVehicle) {
      return res.status(404).json({
        status: "error",
        message: "Vehicle not found or already deleted",
        code: "VEHICLE_DELETE_FAILED"
      });
    }

    // Success Response
    res.status(200).json({
      status: "success",
      message: "Vehicle deleted successfully",
      data: {
        deletedVehicle: vehicleDetails,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    // Error Classification
    let statusCode = 500;
    let errorMessage = "Internal server error";
    let errorCode = "SERVER_ERROR";

    // Handle specific error types
    if (error.name === "CastError") {
      statusCode = 400;
      errorMessage = "Invalid vehicle ID format";
      errorCode = "INVALID_VEHICLE_ID";
    } else if (error.name === "ValidationError") {
      statusCode = 400;
      errorMessage = "Validation error during deletion";
      errorCode = "VALIDATION_ERROR";
    } else if (error.code === 11000) {
      statusCode = 409;
      errorMessage = "Database constraint violation";
      errorCode = "DATABASE_CONSTRAINT_ERROR";
    }

    // Secure Logging
    console.error(`[${new Date().toISOString()}] Vehicle Deletion Error:`, {
      code: errorCode,
      vehicleId: req.params.id,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
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

module.exports = deleteVehicle;
