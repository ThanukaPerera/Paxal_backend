const Admin = require("../../../models/AdminModel");
const B2BShipment = require("../../../models/B2BShipmentModel");
const Branch = require("../../../models/BranchesModel");
const Driver = require("../../../models/driverModel");
const Inquiry = require("../../../models/inquiryModel");
const Notification = require("../../../models/Notification");
const Parcel = require("../../../models/parcelModel");
const Payment = require("../../../models/paymentModel");
const Receiver = require("../../../models/receiverModel");
const Staff = require("../../../models/StaffModel");
const User = require("../../../models/userModel");
const Vehicle = require("../../../models/vehicleModel");
const VehicleSchedule = require("../../../models/VehicleScheduleModel");

/**
 * Generate comprehensive report for Parcel Management System
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      reportType = "comprehensive", // comprehensive, parcels, shipments, users, financial
      branchId,
      format = "json" // json, csv, pdf
    } = req.query;

    // Set default date range if not provided (last 30 days)
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const startDateObj = startDate ? new Date(startDate) : (() => {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      return date;
    })();

    // Validate date range
    if (startDateObj > endDateObj) {
      return res.status(400).json({
        status: "error",
        message: "Start date cannot be after end date"
      });
    }

    // Build base filter for date range
    const dateFilter = {
      createdAt: { $gte: startDateObj, $lte: endDateObj }
    };

    // Build branch filter if specified
    const branchFilter = branchId ? { $match: { branchId: branchId } } : null;

    let reportData = {};

    switch (reportType) {
      case "comprehensive":
        reportData = await generateComprehensiveReport(dateFilter, branchFilter, startDateObj, endDateObj);
        break;
      case "parcels":
        reportData = await generateParcelReport(dateFilter, branchFilter);
        break;
      case "shipments":
        reportData = await generateShipmentReport(dateFilter, branchFilter);
        break;
      case "users":
        reportData = await generateUserReport(dateFilter);
        break;
      case "financial":
        reportData = await generateFinancialReport(dateFilter, branchFilter);
        break;
      case "operational":
        reportData = await generateOperationalReport(dateFilter, branchFilter);
        break;
      default:
        return res.status(400).json({
          status: "error",
          message: "Invalid report type"
        });
    }

    // Add metadata
    const reportMetadata = {
      generatedAt: new Date(),
      dateRange: {
        startDate: startDateObj.toISOString(),
        endDate: endDateObj.toISOString()
      },
      reportType,
      branchId: branchId || "all",
      format
    };

    const response = {
      status: "success",
      message: "Report generated successfully",
      metadata: reportMetadata,
      data: reportData
    };

    // Return data based on format
    if (format === "csv") {
      return generateCSVResponse(res, reportData, reportType, reportMetadata);
    }

    res.status(200).json(response);

  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong"
    });
  }
};

/**
 * Generate comprehensive system report
 */
async function generateComprehensiveReport(dateFilter, branchFilter, startDate, endDate) {
  const [
    systemOverview,
    parcelAnalytics,
    shipmentAnalytics,
    userAnalytics,
    financialAnalytics,
    operationalAnalytics,
    branchPerformance
  ] = await Promise.all([
    getSystemOverview(),
    getParcelAnalytics(dateFilter),
    getShipmentAnalytics(dateFilter),
    getUserAnalytics(dateFilter),
    getFinancialAnalytics(dateFilter),
    getOperationalAnalytics(dateFilter),
    getBranchPerformance(dateFilter)
  ]);

  return {
    systemOverview,
    parcelAnalytics,
    shipmentAnalytics,
    userAnalytics,
    financialAnalytics,
    operationalAnalytics,
    branchPerformance,
    trends: await getTrendAnalysis(startDate, endDate)
  };
}

/**
 * Generate parcel-focused report
 */
async function generateParcelReport(dateFilter, branchFilter) {
  const parcelData = await Parcel.aggregate([
    { $match: dateFilter },
    ...(branchFilter ? [branchFilter] : []),
    {
      $lookup: {
        from: "branches",
        localField: "from",
        foreignField: "_id",
        as: "sourceBranch"
      }
    },
    {
      $lookup: {
        from: "branches",
        localField: "to",
        foreignField: "_id",
        as: "destinationBranch"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "senderId",
        foreignField: "_id",
        as: "sender"
      }
    },
    {
      $lookup: {
        from: "receivers",
        localField: "receiverId",
        foreignField: "_id",
        as: "receiver"
      }
    }
  ]);

  const analytics = await getParcelAnalytics(dateFilter);
  
  return {
    parcels: parcelData,
    analytics,
    summary: {
      totalParcels: parcelData.length,
      averageWeight: parcelData.reduce((sum, p) => sum + (p.weight || 0), 0) / parcelData.length,
      averageVolume: parcelData.reduce((sum, p) => sum + (p.volume || 0), 0) / parcelData.length
    }
  };
}

/**
 * Generate shipment-focused report
 */
async function generateShipmentReport(dateFilter, branchFilter) {
  const shipmentData = await B2BShipment.aggregate([
    { $match: dateFilter },
    {
      $lookup: {
        from: "branches",
        localField: "sourceCenter",
        foreignField: "_id",
        as: "sourceBranch"
      }
    },
    {
      $lookup: {
        from: "vehicles",
        localField: "assignedVehicle",
        foreignField: "_id",
        as: "vehicle"
      }
    },
    {
      $lookup: {
        from: "drivers",
        localField: "assignedDriver",
        foreignField: "_id",
        as: "driver"
      }
    },
    {
      $lookup: {
        from: "parcels",
        localField: "parcels",
        foreignField: "_id",
        as: "parcelDetails"
      }
    }
  ]);

  const analytics = await getShipmentAnalytics(dateFilter);

  return {
    shipments: shipmentData,
    analytics,
    summary: {
      totalShipments: shipmentData.length,
      averageDistance: shipmentData.reduce((sum, s) => sum + (s.totalDistance || 0), 0) / shipmentData.length,
      averageTime: shipmentData.reduce((sum, s) => sum + (s.totalTime || 0), 0) / shipmentData.length
    }
  };
}

/**
 * Generate user-focused report
 */
async function generateUserReport(dateFilter) {
  const [users, staff, drivers, admins] = await Promise.all([
    User.find(dateFilter).select("-password -passwordconfirm -otp -resetPasswordOTP"),
    Staff.find(dateFilter).select("-password -resetPasswordToken").populate("branchId", "location"),
    Driver.find(dateFilter).select("-password").populate("branchId", "location").populate("vehicleId", "registrationNo"),
    Admin.find(dateFilter).select("-password -resetCode")
  ]);

  const analytics = await getUserAnalytics(dateFilter);

  return {
    users: {
      customers: users,
      staff,
      drivers,
      admins
    },
    analytics,
    summary: {
      totalUsers: users.length + staff.length + drivers.length + admins.length,
      customerCount: users.length,
      staffCount: staff.length,
      driverCount: drivers.length,
      adminCount: admins.length
    }
  };
}

/**
 * Generate financial report
 */
async function generateFinancialReport(dateFilter, branchFilter) {
  const paymentData = await Payment.aggregate([
    { $match: dateFilter },
    {
      $lookup: {
        from: "parcels",
        localField: "parcelId",
        foreignField: "_id",
        as: "parcel"
      }
    },
    {
      $unwind: { path: "$parcel", preserveNullAndEmptyArrays: true }
    },
    {
      $lookup: {
        from: "branches",
        localField: "parcel.from",
        foreignField: "_id",
        as: "sourceBranch"
      }
    }
  ]);

  const analytics = await getFinancialAnalytics(dateFilter);

  return {
    payments: paymentData,
    analytics,
    summary: {
      totalRevenue: paymentData.reduce((sum, p) => sum + (p.amount || 0), 0),
      totalTransactions: paymentData.length,
      averageTransactionValue: paymentData.length > 0 ? 
        paymentData.reduce((sum, p) => sum + (p.amount || 0), 0) / paymentData.length : 0
    }
  };
}

/**
 * Generate operational report
 */
async function generateOperationalReport(dateFilter, branchFilter) {
  const [vehicles, schedules, inquiries] = await Promise.all([
    Vehicle.find().populate("assignedBranch", "location").populate("currentBranch", "location"),
    VehicleSchedule.find(dateFilter).populate("vehicle", "registrationNo").populate("branch", "location"),
    Inquiry.find(dateFilter).populate("staffId", "name")
  ]);

  const analytics = await getOperationalAnalytics(dateFilter);

  return {
    vehicles,
    schedules,
    inquiries,
    analytics
  };
}

/**
 * Get system overview statistics
 */
async function getSystemOverview() {
  const [
    totalUsers,
    totalParcels,
    totalShipments,
    totalBranches,
    totalVehicles,
    totalStaff,
    totalDrivers,
    totalRevenue
  ] = await Promise.all([
    User.countDocuments(),
    Parcel.countDocuments(),
    B2BShipment.countDocuments(),
    Branch.countDocuments(),
    Vehicle.countDocuments(),
    Staff.countDocuments(),
    Driver.countDocuments(),
    Payment.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ])
  ]);

  return {
    totalUsers,
    totalParcels,
    totalShipments,
    totalBranches,
    totalVehicles,
    totalStaff,
    totalDrivers,
    totalRevenue: totalRevenue[0]?.total || 0
  };
}

/**
 * Get parcel analytics
 */
async function getParcelAnalytics(dateFilter) {
  const parcelStats = await Parcel.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalParcels: { $sum: 1 },
        totalWeight: { $sum: "$weight" },
        totalVolume: { $sum: "$volume" },
        averagePrice: { $avg: "$price" },
        statusBreakdown: {
          $push: "$status"
        },
        deliveryTypeBreakdown: {
          $push: "$deliveryType"
        },
        submittingTypeBreakdown: {
          $push: "$submittingType"
        }
      }
    }
  ]);

  const statusCounts = await Parcel.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  const deliveryTypeCounts = await Parcel.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: "$deliveryType",
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    overview: parcelStats[0] || {},
    statusBreakdown: statusCounts,
    deliveryTypeBreakdown: deliveryTypeCounts
  };
}

/**
 * Get shipment analytics
 */
async function getShipmentAnalytics(dateFilter) {
  const shipmentStats = await B2BShipment.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalShipments: { $sum: 1 },
        totalDistance: { $sum: "$totalDistance" },
        totalTime: { $sum: "$totalTime" },
        totalWeight: { $sum: "$totalWeight" },
        totalVolume: { $sum: "$totalVolume" },
        averageParcelCount: { $avg: "$parcelCount" }
      }
    }
  ]);

  const statusCounts = await B2BShipment.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  const deliveryTypeCounts = await B2BShipment.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: "$deliveryType",
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    overview: shipmentStats[0] || {},
    statusBreakdown: statusCounts,
    deliveryTypeBreakdown: deliveryTypeCounts
  };
}

/**
 * Get user analytics
 */
async function getUserAnalytics(dateFilter) {
  const [userStats, staffStats, driverStats] = await Promise.all([
    User.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          verifiedUsers: { $sum: { $cond: ["$isVerify", 1, 0] } },
          unverifiedUsers: { $sum: { $cond: ["$isVerify", 0, 1] } }
        }
      }
    ]),
    Staff.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]),
    Driver.countDocuments(dateFilter)
  ]);

  return {
    userOverview: userStats[0] || {},
    staffStatusBreakdown: staffStats,
    totalDrivers: driverStats
  };
}

/**
 * Get financial analytics
 */
async function getFinancialAnalytics(dateFilter) {
  const paymentStats = await Payment.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$amount" },
        totalTransactions: { $sum: 1 },
        averageTransactionValue: { $avg: "$amount" },
        paidTransactions: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] } },
        pendingTransactions: { $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0] } }
      }
    }
  ]);

  const paymentMethodBreakdown = await Payment.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: "$paymentMethod",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" }
      }
    }
  ]);

  return {
    overview: paymentStats[0] || {},
    paymentMethodBreakdown
  };
}

/**
 * Get operational analytics
 */
async function getOperationalAnalytics(dateFilter) {
  const [vehicleStats, scheduleStats, inquiryStats] = await Promise.all([
    Vehicle.aggregate([
      {
        $group: {
          _id: "$vehicleType",
          count: { $sum: 1 },
          available: { $sum: { $cond: ["$available", 1, 0] } }
        }
      }
    ]),
    VehicleSchedule.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalParcels: { $sum: { $size: "$assignedParcels" } }
        }
      }
    ]),
    Inquiry.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  return {
    vehicleBreakdown: vehicleStats,
    scheduleBreakdown: scheduleStats,
    inquiryBreakdown: inquiryStats
  };
}

/**
 * Get branch performance analytics
 */
async function getBranchPerformance(dateFilter) {
  const branchStats = await Branch.aggregate([
    {
      $lookup: {
        from: "parcels",
        localField: "_id",
        foreignField: "from",
        as: "originatingParcels"
      }
    },
    {
      $lookup: {
        from: "parcels",
        localField: "_id",
        foreignField: "to",
        as: "destinationParcels"
      }
    },
    {
      $lookup: {
        from: "staffs",
        localField: "_id",
        foreignField: "branchId",
        as: "staff"
      }
    },
    {
      $lookup: {
        from: "drivers",
        localField: "_id",
        foreignField: "branchId",
        as: "drivers"
      }
    },
    {
      $lookup: {
        from: "vehicles",
        localField: "_id",
        foreignField: "assignedBranch",
        as: "vehicles"
      }
    },
    {
      $project: {
        branchId: 1,
        location: 1,
        contact: 1,
        originatingParcels: { $size: "$originatingParcels" },
        destinationParcels: { $size: "$destinationParcels" },
        staffCount: { $size: "$staff" },
        driverCount: { $size: "$drivers" },
        vehicleCount: { $size: "$vehicles" },
        totalParcels: { $add: [{ $size: "$originatingParcels" }, { $size: "$destinationParcels" }] }
      }
    },
    { $sort: { totalParcels: -1 } }
  ]);

  return branchStats;
}

/**
 * Get trend analysis
 */
async function getTrendAnalysis(startDate, endDate) {
  const parcelTrends = await Parcel.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" }
        },
        count: { $sum: 1 },
        totalRevenue: { $sum: "$price" }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
  ]);

  const shipmentTrends = await B2BShipment.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" }
        },
        count: { $sum: 1 },
        totalDistance: { $sum: "$totalDistance" }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
  ]);

  return {
    parcelTrends,
    shipmentTrends
  };
}

/**
 * Generate CSV response
 */
function generateCSVResponse(res, reportData, reportType, metadata) {
  // Implementation for CSV export would go here
  // For now, returning JSON with CSV headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="report_${reportType}_${new Date().toISOString().split('T')[0]}.json"`);
  
  return res.json({
    status: "success",
    message: "CSV export functionality to be implemented",
    metadata,
    data: reportData
  });
}

module.exports = {
  generateReport
};
