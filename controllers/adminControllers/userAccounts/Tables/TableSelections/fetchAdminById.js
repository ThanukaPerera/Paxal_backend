const Admin = require("../../../../../models/AdminModel");
const { AppError } = require("../../../../../utils/appError");
const catchAsync = require("../../../../../utils/catchAscync");

const fetchAdminById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new AppError("Admin ID is required", 400));
  }

  try {
    // Fetch admin data
    const admin = await Admin.findById(id).lean();

    if (!admin) {
      return next(new AppError("Admin not found", 404));
    }

    // Get recent activities (you can customize this based on your logging system)
    // For now, we'll create mock recent activities based on admin data
    const recentActivities = [
      {
        action: "Login",
        timestamp: new Date(),
        description: "Administrator logged into the system"
      },
      {
        action: "Profile Update",
        timestamp: admin.updatedAt,
        description: "Profile information was updated"
      },
      {
        action: "Account Created",
        timestamp: admin.createdAt,
        description: "Administrator account was created"
      }
    ];

    // Calculate admin statistics
    const adminStats = {
      accountAge: Math.floor((new Date() - new Date(admin.createdAt)) / (1000 * 60 * 60 * 24)),
      lastActivity: admin.updatedAt,
      status: "Active", // You can implement status logic based on your requirements
      permissions: ["User Management", "Report Generation", "System Administration", "Data Export"]
    };

    const responseData = {
      ...admin,
      recentActivities,
      adminStats
    };

    res.status(200).json({
      success: true,
      message: "Admin details fetched successfully",
      userData: responseData
    });

  } catch (error) {
    console.error("Error in fetchAdminById:", error);
    return next(new AppError("Failed to fetch admin details", 500));
  }
});

module.exports = fetchAdminById;
