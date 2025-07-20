const mongoose = require("mongoose");
const Branch = require("../../../models/BranchesModel");

/**
 * Enhanced branch deletion controller with professional error handling
 * @param {Object} req - Express request object (with validated branch from middleware)
 * @param {Object} res - Express response object
 */
const deleteBranch = async (req, res) => {
  console.log("Deleting branch...", req.params.id);
  
  try {
    const { id } = req.params;
    const branch = req.branch; // From validation middleware

    console.log("Branch to delete:", branch.branchId, branch.location);

    // TODO: Add check for dependencies (e.g., staff assigned to this branch)
    // const assignedStaff = await Staff.countDocuments({ branchId: branch._id });
    // if (assignedStaff > 0) {
    //   return res.status(409).json({
    //     status: "error",
    //     message: `Cannot delete branch. ${assignedStaff} staff member(s) are assigned to this branch.`,
    //     code: "BRANCH_HAS_DEPENDENCIES"
    //   });
    // }

    const deletedBranch = await Branch.findByIdAndDelete(id);

    if (!deletedBranch) {
      return res.status(404).json({ 
        status: "error", 
        message: "Branch not found during deletion",
        code: "BRANCH_DELETE_FAILED"
      });
    }

    // Success Response
    res.status(200).json({
      status: "success",
      message: "Branch deleted successfully",
      data: {
        branchId: deletedBranch.branchId,
        location: deletedBranch.location,
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
      errorMessage = "Invalid branch ID format";
      errorCode = "INVALID_BRANCH_ID";
    }

    // Secure Logging
    console.error(`[${new Date().toISOString()}] Branch Delete Error:`, {
      code: errorCode,
      branchId: req.params.id,
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

module.exports = deleteBranch;
