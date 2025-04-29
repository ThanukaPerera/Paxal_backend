const findAdminFunction = require("../../utils/findAdminFunction.js");

const adminLogout = async (req, res) => {
 
  try {
    // Validate admin session first
    if (!req.admin?.adminId) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated",
      });
    }

    // Clear cookie with proper security settings
    // res.clearCookie("AdminToken", {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    //   path: "/"
    // });
    res.clearCookie("AdminToken");
    res.clearCookie("AdminRefreshToken");

    // Fetch admin details for audit logging
    const reqAdmin = await findAdminFunction(req.admin.adminId);

    // Log the logout action
    console.log(
      `${reqAdmin.adminId} (${reqAdmin.name}) logged out successfully`
    );

    // Send success response
    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    // Handle specific error types
    let statusCode = 500;
    let errorMessage = "Failed to complete logout process";

    switch (error.name) {
      case "AdminNotFoundError":
        statusCode = 404;
        errorMessage = "Admin account not found";
        break;
      case "JWTError":
        statusCode = 401;
        errorMessage = "Invalid authentication token";
        break;
      case "DatabaseError":
        statusCode = 503;
        errorMessage = "Service temporarily unavailable";
        break;
    }

    console.error(`Logout Error (${statusCode}):`, error.message);

    res.status(statusCode).json({
      status: "error",
      message: errorMessage,
      // Only include stack in development
      error:
        process.env.NODE_ENV === "development"
          ? {
              message: error.message,
              stack: error.stack,
            }
          : undefined,
    });
  }
};

module.exports = adminLogout;

// const findAdminFunction = require("../../utils/findAdminFunction.js");

// const adminLogout = async (req, res) => {
//     try {
//       res.clearCookie("AdminToken", { httpOnly: true, secure: true, sameSite: "None" });
//       res.status(200).json({ message: "Logged out Successfully" });

//       const reqAdmin = await findAdminFunction(req.admin.adminId);
//       console.log(reqAdmin.adminId,reqAdmin.name,"Logged out Successfully");
//     } catch (error) {
//       res.status(500).json({ message: "Cannot logout", error });
//     }
//   };

//     module.exports=adminLogout;
