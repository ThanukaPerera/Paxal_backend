const { date } = require("zod");
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
 * Get dashboard analytics for admin portal
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDashboardAnalytics = async (req, res) => {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);


    const dateFilter = {
      createdAt: { $gte: startDate, $lte: endDate }
    };
    
    // Get all analytics in parallel
    const [
      kpiMetrics,
      chartData,
      recentActivities,
      systemHealth,
      branchMetrics,
      alertsAndNotifications
    ] = await Promise.all([
      getKPIMetrics(dateFilter),
      getChartData(startDate, endDate),
      getRecentActivities(),
      getSystemHealth(),
      getBranchMetrics(dateFilter),
      getAlertsAndNotifications()
    ]);

    const response = {
      status: "success",
      message: "Dashboard analytics fetched successfully",
      data: {
        period:"current-month",
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          month: new Date().toLocaleString('default', { month: 'long' }),
          year: new Date().getFullYear()
        },
        kpi: kpiMetrics,
        charts: chartData,
        recentActivities,
        systemHealth,
        branchMetrics,
        alerts: alertsAndNotifications,
        lastUpdated: new Date().toISOString()
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong"
    });
  }
};

/**
 * Get Key Performance Indicators
 */
async function getKPIMetrics(dateFilter) {
  const [
    totalParcels,
    totalRevenue,
    pendingPayments,
    totalShipments,
    activeVehicles,
    parcelStatus,
    paymentStatus,
    previousPeriodParcels,
    previousPeriodRevenue
  ] = await Promise.all([
    Parcel.countDocuments(dateFilter),
    Payment.aggregate([
      { $match: { ...dateFilter, paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]),
    Payment.aggregate([
      { $match: { ...dateFilter, paymentStatus: "pending" } },
      { $group: { _id: null, count: { $sum: "$amount" } } }
    ]),
    B2BShipment.countDocuments(dateFilter),
    Vehicle.countDocuments({ available: true }),
    Parcel.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),
    Payment.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$paymentStatus", count: { $sum: 1 } } }
    ]),
    // Previous period for comparison
    Parcel.countDocuments({
      createdAt: {
        $gte: new Date(dateFilter.createdAt.$gte.getTime() - (dateFilter.createdAt.$lte.getTime() - dateFilter.createdAt.$gte.getTime())),
        $lt: dateFilter.createdAt.$gte
      }
    }),
    Payment.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          createdAt: {
            $gte: new Date(dateFilter.createdAt.$gte.getTime() - (dateFilter.createdAt.$lte.getTime() - dateFilter.createdAt.$gte.getTime())),
            $lt: dateFilter.createdAt.$gte
          }
        }
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ])
  ]);

  const revenue = totalRevenue[0]?.total || 0;
  // Get previous month's data for comparison
  const previousMonthStart = new Date(dateFilter.createdAt.$gte);
  previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
  const previousMonthEnd = new Date(dateFilter.createdAt.$gte);
  previousMonthEnd.setDate(previousMonthEnd.getDate() - 1);

  const previousRevenue = previousPeriodRevenue[0]?.total || 0;
  
  // Calculate percentage changes
  const parcelChange = previousPeriodParcels > 0 ? 
    ((totalParcels - previousPeriodParcels) / previousPeriodParcels) * 100 : 0;
  const revenueChange = previousRevenue > 0 ? 
    ((revenue - previousRevenue) / previousRevenue) * 100 : 0;

  // Calculate delivery success rate
  const deliveredParcels = parcelStatus.find(p => p._id === "Delivered")?.count || 0;
  const deliveryRate = totalParcels > 0 ? (deliveredParcels / totalParcels) * 100 : 0;

  // Calculate payment success rate
  const paidPayments = paymentStatus.find(p => p._id === "paid")?.count || 0;
  const totalPayments = paymentStatus.reduce((sum, p) => sum + p.count, 0);
  const paymentRate = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;

  return {
    totalParcels: {
      value: totalParcels,
      change: parcelChange,
      trend: parcelChange >= 0 ? "up" : "down"
    },
    totalRevenue: {
      value: revenue,
      change: revenueChange,
      trend: revenueChange >= 0 ? "up" : "down",
      formatted: `Rs. ${revenue.toLocaleString()}`
    },
    pendingPayments: {
      value: pendingPayments[0]?.count || 0,
      change: 0,
      trend: "up"
    },
    totalShipments: {
      value: totalShipments,
      change: 0, // Would need previous period calculation
      trend: "up"
    },
    activeVehicles: {
      value: activeVehicles,
      change: 0,
      trend: "stable"
    },
    deliverySuccessRate: {
      value: deliveryRate.toFixed(1),
      status: deliveryRate >= 90 ? "excellent" : deliveryRate >= 80 ? "good" : "needs-improvement",
      target: 90
    },
    paymentSuccessRate: {
      value: paymentRate.toFixed(1),
      status: paymentRate >= 95 ? "excellent" : paymentRate >= 85 ? "good" : "needs-improvement",
      target: 95
    }
  };
}

/**
 * Get chart data for dashboard visualizations
 */
async function getChartData(startDate, endDate, period) {
  let groupBy;
  
  // Determine grouping based on period
  switch (period) {
    case "1d":
      groupBy = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" },
        hour: { $hour: "$createdAt" }
      };
      break;
    case "7d":
    case "30d":
      groupBy = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" }
      };
      break;
    case "90d":
    case "1y":
      groupBy = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" }
      };
      break;
    default:
      groupBy = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" }
      };
  }

  const [parcelTrends, revenueTrends, statusDistribution, deliveryTypeDistribution] = await Promise.all([
    // Parcel trends over time
    Parcel.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } }
    ]),

    // Revenue trends over time
    Payment.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: "paid"
        } 
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } }
    ]),

    // Status distribution (pie chart data)
    Parcel.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]),

    // Delivery type distribution
    Parcel.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: "$deliveryType",
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  return {
    parcelTrends: parcelTrends.map(item => ({
      date: formatDateForChart(item._id, period),
      value: item.count
    })),
    revenueTrends: revenueTrends.map(item => ({
      date: formatDateForChart(item._id, period),
      value: item.revenue
    })),
    statusDistribution: statusDistribution.map(item => ({
      label: item._id || "Unknown",
      value: item.count
    })),
    deliveryTypeDistribution: deliveryTypeDistribution.map(item => ({
      label: item._id || "Unknown",
      value: item.count
    }))
  };
}

/**
 * Get recent activities for the activity feed
 */
async function getRecentActivities() {
  const [recentParcels, recentShipments, recentPayments] = await Promise.all([
    Parcel.find()
      .populate("from", "location")
      .populate("to", "location")
      .populate("senderId", "fName lName")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),

    B2BShipment.find()
      .populate("sourceCenter", "location")
      .populate("assignedVehicle", "registrationNo")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),

    Payment.find()
      .populate("parcelId", "trackingNo")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
  ]);

  const activities = [];

  // Add parcel activities
  recentParcels.forEach(parcel => {
    activities.push({
      type: "parcel",
      action: "created",
      description: `New parcel ${parcel.trackingNo} from ${parcel.from?.location || 'Unknown'} to ${parcel.to?.location || 'Unknown'}`,
      timestamp: parcel.createdAt,
      entity: {
        id: parcel._id,
        trackingNo: parcel.trackingNo
      }
    });
  });

  // Add shipment activities
  recentShipments.forEach(shipment => {
    activities.push({
      type: "shipment",
      action: "created",
      description: `New shipment ${shipment.shipmentId} from ${shipment.sourceCenter?.location || 'Unknown'}`,
      timestamp: shipment.createdAt,
      entity: {
        id: shipment._id,
        shipmentId: shipment.shipmentId
      }
    });
  });

  // Add payment activities
  recentPayments.forEach(payment => {
    activities.push({
      type: "payment",
      action: payment.paymentStatus === "paid" ? "completed" : "pending",
      description: `Payment of Rs. ${payment.amount} for parcel ${payment.parcelId?.trackingNo || 'Unknown'}`,
      timestamp: payment.createdAt,
      entity: {
        id: payment._id,
        amount: payment.amount
      }
    });
  });

  // Sort by timestamp and return top 10
  return activities
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);
}

/**
 * Get system health metrics
 */
async function getSystemHealth() {
  const [
    totalBranches,
    activeBranches,
    totalVehicles,
    availableVehicles,
    totalStaff,
    activeStaff,
    pendingInquiries,
    systemErrors
  ] = await Promise.all([
    Branch.countDocuments(),
    Branch.countDocuments(), // Assume all branches are active for now
    Vehicle.countDocuments(),
    Vehicle.countDocuments({ available: true }),
    Staff.countDocuments(),
    Staff.countDocuments({ status: "active" }),
    Inquiry.countDocuments({ status: "new" }),
    0 // Would need error logging system
  ]);

  return {
    branches: {
      total: totalBranches,
      active: activeBranches,
      health: activeBranches === totalBranches ? "healthy" : "warning"
    },
    vehicles: {
      total: totalVehicles,
      available: availableVehicles,
      utilizationRate: totalVehicles > 0 ? ((totalVehicles - availableVehicles) / totalVehicles * 100).toFixed(1) : 0,
      health: (availableVehicles / totalVehicles) > 0.7 ? "healthy" : "warning"
    },
    staff: {
      total: totalStaff,
      active: activeStaff,
      health: activeStaff === totalStaff ? "healthy" : "warning"
    },
    inquiries: {
      pending: pendingInquiries,
      health: pendingInquiries < 10 ? "healthy" : pendingInquiries < 50 ? "warning" : "critical"
    },
    overall: "healthy" // Calculate based on individual metrics
  };
}

/**
 * Get branch-wise metrics
 */
async function getBranchMetrics(dateFilter) {
  const branchData = await Branch.aggregate([
    {
      $lookup: {
        from: "parcels",
        let: { branchId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$from", "$$branchId"] },
              ...dateFilter
            }
          }
        ],
        as: "originatingParcels"
      }
    },
    {
      $lookup: {
        from: "parcels",
        let: { branchId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$to", "$$branchId"] },
              ...dateFilter
            }
          }
        ],
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
        parcelsSent: { $size: "$originatingParcels" },
        parcelsReceived: { $size: "$destinationParcels" },
        totalParcels: { $add: [{ $size: "$originatingParcels" }, { $size: "$destinationParcels" }] },
        staffCount: { $size: "$staff" },
        vehicleCount: { $size: "$vehicles" },
        performance: {
          $cond: {
            if: { $gt: [{ $add: [{ $size: "$originatingParcels" }, { $size: "$destinationParcels" }] }, 50] },
            then: "high",
            else: {
              $cond: {
                if: { $gt: [{ $add: [{ $size: "$originatingParcels" }, { $size: "$destinationParcels" }] }, 20] },
                then: "medium",
                else: "low"
              }
            }
          }
        }
      }
    },
    { $sort: { totalParcels: -1 } }
  ]);

  return branchData;
}

/**
 * Get alerts and notifications
 */
async function getAlertsAndNotifications() {
  const [
    lowStockAlerts,
    vehicleMaintenanceAlerts,
    pendingInquiries,
    highValueParcels
  ] = await Promise.all([
    // This would need inventory tracking - placeholder for now
    [],
    
    // Vehicle maintenance alerts - placeholder
    Vehicle.find({ available: false }).populate("assignedBranch", "location").limit(5),
    
    // High priority inquiries
    Inquiry.find({ status: "new" })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    
    // High value parcels needing attention
    Parcel.find({ 
      price: { $gte: 10000 },
      status: { $in: ["OrderPlaced", "InTransit"] }
    })
    .sort({ price: -1 })
    .limit(5)
    .lean()
  ]);

  const alerts = [];

  // Vehicle alerts
  vehicleMaintenanceAlerts.forEach(vehicle => {
    alerts.push({
      type: "warning",
      category: "Vehicle",
      title: "Vehicle Unavailable",
      message: `Vehicle ${vehicle.registrationNo} at ${vehicle.assignedBranch?.location || 'Unknown'} is currently unavailable`,
      timestamp: new Date(),
      priority: "medium"
    });
  });

  // Inquiry alerts
  if (pendingInquiries.length > 10) {
    alerts.push({
      type: "warning",
      category: "Customer Service",
      title: "High Inquiry Volume",
      message: `${pendingInquiries.length} pending customer inquiries require attention`,
      timestamp: new Date(),
      priority: "high"
    });
  }

  // High value parcel alerts
  highValueParcels.forEach(parcel => {
    alerts.push({
      type: "info",
      category: "High Value",
      title: "High Value Parcel",
      message: `Parcel ${parcel.trackingNo} worth Rs. ${parcel.price} requires special attention`,
      timestamp: parcel.createdAt,
      priority: "medium"
    });
  });

  return alerts.slice(0, 10); // Return top 10 alerts
}

/**
 * Format date for chart display
 */
function formatDateForChart(dateObj, period) {
  switch (period) {
    case "1d":
      return `${dateObj.hour}:00`;
    case "7d":
    case "30d":
      return `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
    case "90d":
    case "1y":
      return `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}`;
    default:
      return `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
  }
}

module.exports = {
  getDashboardAnalytics
};
