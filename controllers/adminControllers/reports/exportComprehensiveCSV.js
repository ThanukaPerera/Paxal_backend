const Admin = require("../../../models/AdminModel");
const B2BShipment = require("../../../models/B2BShipmentModel");
const Branch = require("../../../models/BranchesModel");
const Driver = require("../../../models/DriverModel");
const Inquiry = require("../../../models/inquiryModel");
const Notification = require("../../../models/Notification");
const Parcel = require("../../../models/parcelModel");
const Payment = require("../../../models/PaymentModel");
const Receiver = require("../../../models/receiverModel");
const Staff = require("../../../models/StaffModel");
const User = require("../../../models/userModel");
const Vehicle = require("../../../models/vehicleModel");
const VehicleSchedule = require("../../../models/VehicleScheduleModel");

/**
 * Export comprehensive report as CSV
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const exportComprehensiveReportCSV = async (req, res) => {
  try {
    // Set default date range (last 30 days)
    const endDateObj = new Date();
    const startDateObj = new Date();
    startDateObj.setDate(startDateObj.getDate() - 30);

    // Build base filter for date range
    const dateFilter = {
      createdAt: { $gte: startDateObj, $lte: endDateObj },
    };

    // Generate comprehensive report data
    const reportData = await generateComprehensiveReportData(dateFilter, startDateObj, endDateObj);

    // Convert to CSV format
    const csvContent = await convertReportToCSV(reportData);

    // Set headers for CSV download
    const filename = `comprehensive_report_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');

    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error exporting CSV report:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to export CSV report",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
    });
  }
};

/**
 * Generate comprehensive report data
 */
async function generateComprehensiveReportData(dateFilter, startDate, endDate) {
  const [
    systemOverview,
    parcelAnalytics,
    shipmentAnalytics,
    userAnalytics,
    financialAnalytics,
    operationalAnalytics,
    branchPerformance,
  ] = await Promise.all([
    getSystemOverview(dateFilter),
    getParcelAnalytics(dateFilter),
    getShipmentAnalytics(dateFilter),
    getUserAnalytics(dateFilter),
    getFinancialAnalytics(dateFilter),
    getOperationalAnalytics(dateFilter),
    getBranchPerformance(dateFilter),
  ]);

  return {
    systemOverview,
    parcelAnalytics,
    shipmentAnalytics,
    userAnalytics,
    financialAnalytics,
    operationalAnalytics,
    branchPerformance,
    trends: await getTrendAnalysis(startDate, endDate, null, dateFilter),
    metadata: {
      generatedAt: new Date(),
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      reportType: "comprehensive",
      branchId: "all",
      format: "csv",
    }
  };
}

/**
 * Convert report data to CSV format with enhanced analytics
 */
async function convertReportToCSV(reportData) {
  let csvContent = '';

  // Add BOM for Excel compatibility
  csvContent += '\uFEFF';

  // Report Header
  csvContent += `PAXAL Parcel Management System - Comprehensive Report\n`;
  csvContent += `Generated At: ${new Date().toLocaleString()}\n`;
  csvContent += `Date Range: ${new Date(reportData.metadata.dateRange.startDate).toLocaleDateString()} to ${new Date(reportData.metadata.dateRange.endDate).toLocaleDateString()}\n`;
  csvContent += `\n`;

  // Executive Summary (Key Performance Indicators)
  csvContent += `EXECUTIVE SUMMARY - KEY PERFORMANCE INDICATORS\n`;
  csvContent += `KPI,Value,Status\n`;
  
  if (reportData.systemOverview && reportData.parcelAnalytics && reportData.financialAnalytics) {
    const deliveredParcels = reportData.parcelAnalytics.statusBreakdown?.find(s => s._id === 'Delivered')?.count || 0;
    const totalParcels = reportData.systemOverview.totalParcels || 0;
    const deliveryRate = totalParcels > 0 ? ((deliveredParcels / totalParcels) * 100).toFixed(2) : 0;
    
    const paidAmount = reportData.financialAnalytics.overview?.paidPayments || 0;
    const totalAmount = reportData.financialAnalytics.overview?.totalRevenue || 0;
    const paymentSuccessRate = totalAmount > 0 ? ((paidAmount / totalAmount) * 100).toFixed(2) : 0;
    
    const completedShipments = reportData.shipmentAnalytics?.statusBreakdown?.find(s => s._id === 'Completed')?.count || 0;
    const totalShipments = reportData.systemOverview.totalShipments || 0;
    const shipmentCompletionRate = totalShipments > 0 ? ((completedShipments / totalShipments) * 100).toFixed(2) : 0;
    
    csvContent += `Delivery Success Rate,${deliveryRate}%,${deliveryRate >= 80 ? 'Good' : deliveryRate >= 60 ? 'Average' : 'Needs Improvement'}\n`;
    csvContent += `Payment Success Rate,${paymentSuccessRate}%,${paymentSuccessRate >= 80 ? 'Good' : paymentSuccessRate >= 60 ? 'Average' : 'Needs Improvement'}\n`;
    csvContent += `Shipment Completion Rate,${shipmentCompletionRate}%,${shipmentCompletionRate >= 80 ? 'Good' : shipmentCompletionRate >= 60 ? 'Average' : 'Needs Improvement'}\n`;
    csvContent += `Total Revenue,Rs. ${(reportData.systemOverview.totalRevenue || 0).toLocaleString()},Revenue Generated\n`;
    csvContent += `Active Branches,${reportData.systemOverview.totalBranches || 0},Operational Coverage\n`;
    
    const totalVehicles = reportData.systemOverview.totalVehicles || 1;
    const utilizedVehicles = reportData.operationalAnalytics?.vehicleBreakdown?.reduce((sum, v) => sum + (v.count - v.available), 0) || 0;
    const vehicleUtilization = ((utilizedVehicles / totalVehicles) * 100).toFixed(2);
    csvContent += `Vehicle Utilization,${vehicleUtilization}%,Fleet Usage\n`;
  }
  csvContent += `\n`;

  // System Overview Section
  csvContent += `SYSTEM OVERVIEW\n`;
  csvContent += `Metric,Value,Notes\n`;
  if (reportData.systemOverview) {
    csvContent += `Total Parcels,${reportData.systemOverview.totalParcels || 0},Total parcels in system\n`;
    csvContent += `Total Shipments,${reportData.systemOverview.totalShipments || 0},Total shipment operations\n`;
    csvContent += `Total Branches,${reportData.systemOverview.totalBranches || 0},Service locations\n`;
    csvContent += `Total Vehicles,${reportData.systemOverview.totalVehicles || 0},Fleet size\n`;
    csvContent += `Total Staff,${reportData.systemOverview.totalStaff || 0},Administrative personnel\n`;
    csvContent += `Total Drivers,${reportData.systemOverview.totalDrivers || 0},Delivery personnel\n`;
    csvContent += `Total Revenue,Rs. ${(reportData.systemOverview.totalRevenue || 0).toLocaleString()},Total earnings\n`;
  }
  csvContent += `\n`;

  // Parcel Status Breakdown with Analytics
  csvContent += `PARCEL STATUS ANALYSIS\n`;
  csvContent += `Status,Count,Percentage,Description\n`;
  if (reportData.parcelAnalytics && reportData.parcelAnalytics.statusBreakdown) {
    const totalParcels = reportData.systemOverview?.totalParcels || 1;
    reportData.parcelAnalytics.statusBreakdown.forEach(status => {
      const percentage = ((status.count / totalParcels) * 100).toFixed(2);
      const description = getStatusDescription(status._id);
      csvContent += `${status._id || 'Unknown'},${status.count || 0},${percentage}%,${description}\n`;
    });
  }
  csvContent += `\n`;

  // Financial Performance Analysis
  csvContent += `FINANCIAL PERFORMANCE ANALYSIS\n`;
  csvContent += `Metric,Amount (Rs.),Percentage,Status\n`;
  if (reportData.financialAnalytics && reportData.financialAnalytics.overview) {
    const overview = reportData.financialAnalytics.overview;
    const paidPercentage = overview.totalRevenue > 0 ? ((overview.paidPayments / overview.totalRevenue) * 100).toFixed(2) : 0;
    const pendingPercentage = overview.totalRevenue > 0 ? ((overview.pendingPayments / overview.totalRevenue) * 100).toFixed(2) : 0;
    
    csvContent += `Total Revenue,${(overview.totalRevenue || 0).toLocaleString()},100%,Total Earnings\n`;
    csvContent += `Paid Payments,${(overview.paidPayments || 0).toLocaleString()},${paidPercentage}%,Collected\n`;
    csvContent += `Pending Payments,${(overview.pendingPayments || 0).toLocaleString()},${pendingPercentage}%,Outstanding\n`;
    csvContent += `Average Transaction Value,${(overview.averageTransactionValue || 0).toFixed(2)},Per Transaction,Avg Deal Size\n`;
  }
  csvContent += `\n`;

  // Payment Method Performance
  csvContent += `PAYMENT METHOD PERFORMANCE\n`;
  csvContent += `Payment Method,Transaction Count,Total Amount (Rs.),Average Amount (Rs.),Market Share\n`;
  if (reportData.financialAnalytics && reportData.financialAnalytics.paymentMethodBreakdown) {
    const totalAmount = reportData.financialAnalytics.overview?.totalRevenue || 1;
    reportData.financialAnalytics.paymentMethodBreakdown.forEach(method => {
      const avgAmount = method.count > 0 ? (method.totalAmount / method.count).toFixed(2) : 0;
      const marketShare = ((method.totalAmount / totalAmount) * 100).toFixed(2);
      csvContent += `${method._id || 'Unknown'},${method.count || 0},${(method.totalAmount || 0).toLocaleString()},${avgAmount},${marketShare}%\n`;
    });
  }
  csvContent += `\n`;

  // Shipment Performance Analysis
  csvContent += `SHIPMENT PERFORMANCE ANALYSIS\n`;
  csvContent += `Metric,Value,Performance\n`;
  if (reportData.shipmentAnalytics && reportData.shipmentAnalytics.overview) {
    const overview = reportData.shipmentAnalytics.overview;
    const avgDistance = overview.totalShipments > 0 ? (overview.totalDistance / overview.totalShipments).toFixed(2) : 0;
    const avgTime = overview.totalShipments > 0 ? (overview.totalTime / overview.totalShipments).toFixed(2) : 0;
    
    csvContent += `Total Shipments,${overview.totalShipments || 0},-\n`;
    csvContent += `Total Distance,${overview.totalDistance || 0} km,Coverage\n`;
    csvContent += `Average Distance per Shipment,${avgDistance} km,Efficiency\n`;
    csvContent += `Total Time,${overview.totalTime || 0} hours,Duration\n`;
    csvContent += `Average Time per Shipment,${avgTime} hours,Speed\n`;
    csvContent += `Average Parcels per Shipment,${overview.averageParcelCount || 0},Consolidation\n`;
  }
  csvContent += `\n`;

  // Operational Efficiency
  csvContent += `OPERATIONAL EFFICIENCY\n`;
  csvContent += `Resource Type,Total Count,Available,Utilized,Utilization Rate\n`;
  if (reportData.operationalAnalytics && reportData.operationalAnalytics.vehicleBreakdown) {
    reportData.operationalAnalytics.vehicleBreakdown.forEach(vehicle => {
      const utilized = vehicle.count - vehicle.available;
      const utilizationRate = vehicle.count > 0 ? ((utilized / vehicle.count) * 100).toFixed(2) : 0;
      csvContent += `${vehicle._id || 'Unknown'} Vehicles,${vehicle.count || 0},${vehicle.available || 0},${utilized},${utilizationRate}%\n`;
    });
  }
  csvContent += `\n`;

  // Branch Performance Ranking
  csvContent += `TOP PERFORMING BRANCHES\n`;
  csvContent += `Rank,Branch ID,Location,Total Parcels,Staff,Drivers,Vehicles,Performance Score\n`;
  if (reportData.branchPerformance && reportData.branchPerformance.branchStats) {
    reportData.branchPerformance.branchStats
      .sort((a, b) => b.totalParcels - a.totalParcels)
      .slice(0, 10)
      .forEach((branch, index) => {
        const performanceScore = calculateBranchPerformanceScore(branch);
        csvContent += `${index + 1},${branch.branchId || 'N/A'},${branch.location || 'N/A'},${branch.totalParcels || 0},${branch.staffCount || 0},${branch.driverCount || 0},${branch.vehicleCount || 0},${performanceScore}\n`;
      });
  }

  return csvContent;
}

// Helper function to get status descriptions
function getStatusDescription(status) {
  const descriptions = {
    'OrderPlaced': 'Initial order received',
    'PendingPickup': 'Awaiting collection',
    'ArrivedAtCollectionCenter': 'At origin hub',
    'ShipmentAssigned': 'Assigned to transport',
    'InTransit': 'Currently moving',
    'ArrivedAtDistributionCenter': 'At destination hub',
    'DeliveryDispatched': 'Out for delivery',
    'Delivered': 'Successfully delivered',
    'NotAccepted': 'Delivery refused',
    'WrongAddress': 'Address issue',
    'Return': 'Returned to sender'
  };
  return descriptions[status] || 'Status update';
}

// Helper function to calculate branch performance score
function calculateBranchPerformanceScore(branch) {
  let score = 0;
  score += (branch.totalParcels || 0) * 2;
  score += (branch.staffCount || 0) * 10;
  score += (branch.driverCount || 0) * 15;
  score += (branch.vehicleCount || 0) * 12;
  return Math.min(100, score).toFixed(1);
}

// Helper functions (using existing functions from generateReport.js)
async function getSystemOverview(dateFilter) {
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
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
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

async function getParcelAnalytics(dateFilter) {
  const [overview, statusBreakdown, deliveryTypeBreakdown] = await Promise.all([
    Parcel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalParcels: { $sum: 1 },
          totalWeight: { $sum: "$weight" },
          totalVolume: { $sum: "$volume" },
          averagePrice: { $avg: "$price" },
          statusBreakdown: { $push: "$status" },
          deliveryTypeBreakdown: { $push: "$deliveryType" },
          submittingTypeBreakdown: { $push: "$submittingType" }
        }
      }
    ]),
    Parcel.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Parcel.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$deliveryType", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  return {
    overview: overview[0] || {},
    statusBreakdown,
    deliveryTypeBreakdown
  };
}

async function getShipmentAnalytics(dateFilter) {
  const [overview, statusBreakdown, deliveryTypeBreakdown] = await Promise.all([
    B2BShipment.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalShipments: { $sum: 1 },
          totalDistance: { $sum: "$totalDistance" },
          totalTime: { $sum: "$totalTime" },
          totalWeight: { $sum: "$totalWeight" },
          totalVolume: { $sum: "$totalVolume" },
          averageParcelCount: { 
            $avg: { 
              $cond: [
                { $isArray: "$parcels" },
                { $size: "$parcels" },
                0
              ]
            }
          }
        }
      }
    ]),
    B2BShipment.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    B2BShipment.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$deliveryType", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  return {
    overview: overview[0] || {},
    statusBreakdown,
    deliveryTypeBreakdown
  };
}

async function getUserAnalytics(dateFilter) {
  const [userOverview, staffStatusBreakdown, totalDrivers] = await Promise.all([
    User.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          verifiedUsers: { $sum: { $cond: [{ $eq: ["$isVerified", true] }, 1, 0] } },
          unverifiedUsers: { $sum: { $cond: [{ $eq: ["$isVerified", false] }, 1, 0] } }
        }
      }
    ]),
    Staff.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),
    Driver.countDocuments(dateFilter)
  ]);

  return {
    userOverview: userOverview[0] || {},
    staffStatusBreakdown,
    totalDrivers
  };
}

async function getFinancialAnalytics(dateFilter) {
  const [overview, paymentMethodBreakdown] = await Promise.all([
    Payment.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalTransactions: { $sum: 1 },
          pendingPayments: { $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, "$totalAmount", 0] } },
          paidPayments: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0] } },
          averageTransactionValue: { $avg: "$totalAmount" },
          paidTransactions: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] } },
          pendingTransactions: { $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0] } }
        }
      }
    ]),
    Payment.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" }
        }
      },
      { $sort: { totalAmount: -1 } }
    ])
  ]);

  return {
    overview: overview[0] || {},
    paymentMethodBreakdown
  };
}

async function getOperationalAnalytics(dateFilter) {
  const [vehicleBreakdown, scheduleBreakdown, inquiryBreakdown] = await Promise.all([
    Vehicle.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          available: { $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] } }
        }
      }
    ]),
    VehicleSchedule.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalParcels: { 
            $sum: { 
              $cond: [
                { $isArray: "$parcels" },
                { $size: "$parcels" },
                0
              ]
            }
          }
        }
      }
    ]),
    Inquiry.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ])
  ]);

  return {
    vehicleBreakdown,
    scheduleBreakdown,
    inquiryBreakdown
  };
}

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
        foreignField: "branchId",
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

  return { branchStats };
}

async function getTrendAnalysis(startDate, endDate, categories, dateFilter) {
  // Simple trend analysis - you can enhance this based on your needs
  return {
    parcelTrend: {
      growth: 0,
      period: `${startDate.toDateString()} to ${endDate.toDateString()}`
    },
    shipmentTrend: {
      growth: 0,
      period: `${startDate.toDateString()} to ${endDate.toDateString()}`
    },
    userTrend: {
      growth: 0,
      period: `${startDate.toDateString()} to ${endDate.toDateString()}`
    },
    revenueTrend: {
      growth: 0,
      period: `${startDate.toDateString()} to ${endDate.toDateString()}`
    },
    vehicleTrend: {
      growth: 0,
      period: "Current utilization rate"
    }
  };
}

module.exports = {
  exportComprehensiveReportCSV
};
