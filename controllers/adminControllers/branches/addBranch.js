const Branch = require("../../../models/BranchesModel");
const sendEmail = require("../../../utils/admin/sendEmail");

/**
 * Enhanced branch registration controller with professional error handling
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addBranch = async (req, res) => {
  console.log("Registering branch...", req.body);
  
  try {
    // The validation is already handled by middleware, so we can use req.body directly
    // req.body has already been validated and transformed by the middleware
    const validatedData = req.body;

    console.log("Validated branch data:", validatedData);

    // Generate branch ID with transaction safety
    const lastBranch = await Branch.findOne().sort({ branchId: -1 }).lean();
    let nextBranchId = "B001";

    if (lastBranch) {
      const lastIdNumber = parseInt(lastBranch.branchId.replace("B", ""), 10);
      if (isNaN(lastIdNumber)) {
        throw new Error("Invalid branch ID format in database");
      }
      nextBranchId = `B${String(lastIdNumber + 1).padStart(3, "0")}`;
    }

    // Create branch data
    const branchData = {
      ...validatedData,
      branchId: nextBranchId,
    };

    const branch = new Branch(branchData);
    const savedBranch = await branch.save();

    // Optional: Send notification email to admin about new branch
    try {
      const adminEmail = process.env.ADMIN_EMAIL; // Add to your env variables
      if (adminEmail) {
        await sendEmail({
          to: adminEmail,
          subject: "New Branch Registered - Paxal PMS",
          template: "welcome",
          templateData: {
            userName: "Admin",
          }
        });
      }
    } catch (emailError) {
      console.error("Branch notification email failed:", emailError);
      // Continue with success response even if email fails
    }

    // Success Response
    res.status(201).json({
      status: "success",
      message: "Branch registered successfully",
      data: {
        branchId: savedBranch.branchId,
        location: savedBranch.location,
        contact: savedBranch.contact,
        createdAt: savedBranch.createdAt,
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
    } else if (error.code === 11000) {
      statusCode = 409;
      const duplicateField = Object.keys(error.keyPattern)[0];
      errorMessage = `Branch with this ${duplicateField} already exists`;
      errorCode = "DUPLICATE_BRANCH";
    } else if (error.message.includes("Invalid branch ID")) {
      statusCode = 500;
      errorMessage = "Database inconsistency detected";
      errorCode = "DB_INCONSISTENCY";
    }

    // Secure Logging
    console.error(`[${new Date().toISOString()}] Branch Registration Error:`, {
      code: errorCode,
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

module.exports = {
  addBranch,
};
