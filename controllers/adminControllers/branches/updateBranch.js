const Branch = require("../../../models/BranchesModel");

/**
 * Enhanced branch update controller with professional error handling
 * @param {Object} req - Express request object (with validated data and existing branch)
 * @param {Object} res - Express response object
 */
const updateBranch = async (req, res) => {
  console.log("Updating branch...", req.params.id, req.body);
  
  try {
    // The validation is already handled by middleware
    // req.body contains validated data, req.existingBranch contains current branch
    const { id } = req.params;
    const validatedData = req.body;
    const existingBranch = req.existingBranch;

    console.log("Validated update data:", validatedData);
    console.log("Existing branch:", existingBranch.branchId);

    // Update the branch with validated data
    const updatedBranch = await Branch.findByIdAndUpdate(
      id,
      validatedData,
      { 
        new: true, 
        runValidators: true,
        lean: true 
      }
    );

    if (!updatedBranch) {
      return res.status(404).json({
        status: "error",
        message: "Branch not found after update",
        code: "BRANCH_UPDATE_FAILED"
      });
    }

    // Success Response
    res.status(200).json({
      status: "success",
      message: "Branch updated successfully",
      data: {
        branchId: updatedBranch.branchId,
        location: updatedBranch.location,
        contact: updatedBranch.contact,
        updatedAt: updatedBranch.updatedAt,
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
      errorMessage = "Invalid branch ID format";
      errorCode = "INVALID_BRANCH_ID";
    } else if (error.code === 11000) {
      statusCode = 409;
      const duplicateField = Object.keys(error.keyPattern)[0];
      errorMessage = `Branch with this ${duplicateField} already exists`;
      errorCode = "DUPLICATE_BRANCH";
    }

    // Secure Logging
    console.error(`[${new Date().toISOString()}] Branch Update Error:`, {
      code: errorCode,
      branchId: req.params.id,
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

module.exports = updateBranch;