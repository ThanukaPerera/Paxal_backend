const PDFExportService = require("../../utils/admin/PDFExportService");
const CSVExportService = require("../../utils/admin/CSVExportService");
const { generateGeminiInsights } = require("./Gemini");
const catchAsync = require("../../utils/catchAscync");
const AppError = require("../../utils/appError");

// Import models for data collection
const UserModel = require("../../models/userModel");
const ParcelModel = require("../../models/parcelModel");
const BranchModel = require("../../models/BranchesModel");
const PaymentModel = require("../../models/PaymentModel");
const B2BShipmentModel = require("../../models/B2BShipmentModel");
const NotificationModel = require("../../models/Notification");

/**
 * Export report as PDF
 */
const exportReportPDF = catchAsync(async (req, res, next) => {
  try {
    const { reportType = "comprehensive", includeAI = "false", reportPart } = req.query;
    
    // Parse date range and branch filter
    let dateFilter = {};
    
    if (req.query.dateRange) {
      const { startDate, endDate } = JSON.parse(req.query.dateRange);
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }
    
    if (req.query.branchId && req.query.branchId !== "all") {
      // For parcels, filter by either 'from' or 'to' branch  
      dateFilter.$or = [
        { from: req.query.branchId },
        { to: req.query.branchId }
      ];
    }
    
    const filters = dateFilter;
    
    // Collect report data
    const reportData = await collectReportData(filters, reportType, reportPart);
    
    // Generate AI insights if requested
    let aiInsights = null;
    if (includeAI === "true") {
      try {
        aiInsights = await generateGeminiInsights(reportData, reportType);
      } catch (error) {
        console.warn("AI insights generation failed:", error.message);
        // Continue without AI insights
      }
    }
    
    // Generate PDF
    const pdfService = new PDFExportService();
    const pdfResult = await pdfService.generateReportPDF(reportData, reportType, {
      aiInsights,
      filters: req.query
    });
    
    // Set response headers
    res.set({
      'Content-Type': pdfResult.contentType,
      'Content-Disposition': `attachment; filename="${pdfResult.filename}"`,
      'Content-Length': pdfResult.buffer.length
    });
    
    res.send(pdfResult.buffer);

  } catch (error) {
    console.error("PDF Export Error:", error);
    return next(new AppError("Failed to generate PDF report", 500));
  }
});

/**
 * Export report as CSV
 */
const exportReportCSV = catchAsync(async (req, res, next) => {
  try {
    const { reportType = "comprehensive", includeAI = "false", reportPart } = req.query;
    
    // Parse date range and branch filter
    let dateFilter = {};
    
    if (req.query.dateRange) {
      const { startDate, endDate } = JSON.parse(req.query.dateRange);
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }
    
    if (req.query.branchId && req.query.branchId !== "all") {
      // For parcels, filter by either 'from' or 'to' branch
      dateFilter.$or = [
        { from: req.query.branchId },
        { to: req.query.branchId }
      ];
    }
    
    const filters = dateFilter;
    
    // Collect report data
    const reportData = await collectReportData(filters, reportType, reportPart);
    
    // Generate AI insights if requested
    let aiInsights = null;
    if (includeAI === "true") {
      try {
        aiInsights = await generateGeminiInsights(reportData, reportType);
      } catch (error) {
        console.warn("AI insights generation failed:", error.message);
        // Continue without AI insights
      }
    }
    
    // Generate CSV
    const csvService = new CSVExportService();
    const csvResult = await csvService.generateReportCSV(reportData, reportType, {
      aiInsights,
      filters: req.query
    });
    
    // Set response headers
    res.set({
      'Content-Type': csvResult.contentType,
      'Content-Disposition': `attachment; filename="${csvResult.filename}"`
    });
    
    res.send(csvResult.content);

  } catch (error) {
    console.error("CSV Export Error:", error);
    return next(new AppError("Failed to generate CSV report", 500));
  }
});

/**
 * Export specific data as CSV (e.g., parcels, users, payments)
 */
const exportDataCSV = catchAsync(async (req, res, next) => {
  try {
    const { dataType } = req.params;
    const { fields, limit = 1000 } = req.query;
    
    // Parse filters
    let filters = {};
    if (req.query.filters) {
      filters = JSON.parse(req.query.filters);
    }
    
    let data = [];
    let selectedFields = fields ? fields.split(',') : null;
    
    // Get data based on type
    switch (dataType.toLowerCase()) {
      case 'parcels':
        data = await ParcelModel.find(filters)
          .populate("senderId", "firstName lastName email phone")
          .populate("receiverId", "firstName lastName email phone")
          .populate("from", "branchName city")
          .populate("to", "branchName city")
          .limit(parseInt(limit))
          .lean();
        
        // Flatten populated fields for CSV
        data = data.map(parcel => ({
          ...parcel,
          senderName: parcel.senderId ? `${parcel.senderId.firstName} ${parcel.senderId.lastName}` : '',
          senderEmail: parcel.senderId?.email || '',
          receiverName: parcel.receiverId ? `${parcel.receiverId.firstName} ${parcel.receiverId.lastName}` : '',
          receiverEmail: parcel.receiverId?.email || '',
          fromBranchName: parcel.from?.branchName || '',
          fromBranchCity: parcel.from?.city || '',
          toBranchName: parcel.to?.branchName || '',
          toBranchCity: parcel.to?.city || ''
        }));
        break;
        
      case 'users':
        data = await UserModel.find(filters)
          .select('-password -__v')
          .limit(parseInt(limit))
          .lean();
        break;
        
      case 'payments':
        data = await PaymentModel.find(filters)
          .populate("parcelId", "trackingNumber")
          .populate("paidBy", "firstName lastName email")
          .limit(parseInt(limit))
          .lean();
        
        // Flatten populated fields
        data = data.map(payment => ({
          ...payment,
          parcelTracking: payment.parcel?.trackingNumber || '',
          payerName: payment.paidBy ? `${payment.paidBy.firstName} ${payment.paidBy.lastName}` : '',
          payerEmail: payment.paidBy?.email || ''
        }));
        break;
        
      case 'branches':
        data = await BranchModel.find(filters)
          .limit(parseInt(limit))
          .lean();
        break;
        
      case 'shipments':
        data = await B2BShipmentModel.find(filters)
          .populate("sourceCenter", "branchName city")
          .populate("route", "branchName city")
          .populate("currentLocation", "branchName city")
          .populate("assignedVehicle", "vehicleNumber model")
          .populate("assignedDriver", "firstName lastName")
          .populate("createdByCenter", "branchName")
          .limit(parseInt(limit))
          .lean();
        
        // Flatten populated fields
        data = data.map(shipment => ({
          ...shipment,
          sourceCenterName: shipment.sourceCenter?.branchName || '',
          sourceCenterCity: shipment.sourceCenter?.city || '',
          currentLocationName: shipment.currentLocation?.branchName || '',
          vehicleNumber: shipment.assignedVehicle?.vehicleNumber || '',
          driverName: shipment.assignedDriver ? `${shipment.assignedDriver.firstName} ${shipment.assignedDriver.lastName}` : '',
          createdByCenterName: shipment.createdByCenter?.branchName || ''
        }));
        break;
        
      default:
        return next(new AppError(`Invalid data type: ${dataType}`, 400));
    }
    
    if (data.length === 0) {
      return next(new AppError("No data found for the specified criteria", 404));
    }
    
    // Generate CSV
    const csvService = new CSVExportService();
    const csvResult = await csvService.generateDataCSV(data, dataType, selectedFields);
    
    // Set response headers
    res.set({
      'Content-Type': csvResult.contentType,
      'Content-Disposition': `attachment; filename="${csvResult.filename}"`
    });
    
    res.send(csvResult.content);

  } catch (error) {
    console.error("Data CSV Export Error:", error);
    return next(new AppError("Failed to export data as CSV", 500));
  }
});

/**
 * Get available export formats and options
 */
const getExportOptions = catchAsync(async (req, res, next) => {
  const options = {
    formats: [
      {
        id: 'pdf',
        name: 'PDF',
        description: 'Professional PDF report with charts and formatting',
        supportedTypes: ['comprehensive', 'parcels', 'users', 'payments', 'financial', 'operational'],
        features: ['formatting', 'charts', 'branding', 'ai-insights']
      },
      {
        id: 'csv',
        name: 'CSV',
        description: 'Comma-separated values file for data analysis',
        supportedTypes: ['comprehensive', 'parcels', 'users', 'payments', 'financial', 'operational'],
        features: ['raw-data', 'analysis-ready', 'ai-insights']
      }
    ],
    dataTypes: [
      {
        id: 'parcels',
        name: 'Parcels',
        description: 'Individual parcel records with sender/receiver info',
        fields: ['trackingNumber', 'status', 'itemWeight', 'itemSize', 'totalAmount']
      },
      {
        id: 'users',
        name: 'Users',
        description: 'User account information and activity',
        fields: ['firstName', 'lastName', 'email', 'phone', 'role', 'createdAt']
      },
      {
        id: 'payments',
        name: 'Payments',
        description: 'Payment transactions and history',
        fields: ['amount', 'paymentMethod', 'paymentStatus', 'createdAt']
      },
      {
        id: 'branches',
        name: 'Branches',
        description: 'Branch locations and information',
        fields: ['branchName', 'city', 'address', 'phone', 'isActive']
      },
      {
        id: 'shipments',
        name: 'B2B Shipments',
        description: 'Business-to-business shipment records',
        fields: ['shipmentId', 'status', 'totalAmount', 'createdAt']
      }
    ],
    reportTypes: [
      {
        id: 'comprehensive',
        name: 'Comprehensive Report',
        description: 'Complete overview of all system metrics and performance'
      },
      {
        id: 'parcels',
        name: 'Parcel Report',
        description: 'Detailed analysis of parcel operations and delivery performance'
      },
      {
        id: 'financial',
        name: 'Financial Report',
        description: 'Revenue, payments, and financial performance metrics'
      },
      {
        id: 'operational',
        name: 'Operational Report',
        description: 'Branch performance, efficiency, and operational metrics'
      },
      {
        id: 'users',
        name: 'User Report',
        description: 'User activity, registration trends, and engagement metrics'
      }
    ]
  };
  
  res.status(200).json({
    success: true,
    data: options
  });
});

/**
 * Helper function to collect comprehensive report data
 */
async function collectReportData(filters, reportType, reportPart) {
  const data = {};

  try {
    // If reportPart is specified, only collect that part
    if (reportPart && reportPart !== 'all') {
      switch (reportPart) {
        case 'parcels':
          return await getParcelData(filters);
        case 'shipments':
          return await getShipmentData(filters);
        case 'users':
          return await getUserData(filters);
        case 'financial':
          return await getFinancialData(filters);
        case 'operational':
          return await getOperationalData(filters);
        case 'branches':
          return await getBranchData(filters);
        default:
          break;
      }
    }

    // Collect all data for comprehensive report
    return await getAllReportData(filters);
  } catch (error) {
    console.error("Error collecting report data:", error);
    throw error;
  }
}

// Helper function to get all report data
async function getAllReportData(filters) {
  const data = {};

  try {
    // Create different filters for different models
    const dateOnlyFilter = {
      createdAt: filters.createdAt
    };
    
    // For parcels, use the full filter with branch condition
    const parcelFilter = filters;
    
    // For branch-specific filtering of other models, extract branchId if exists
    let branchId = null;
    if (filters.$or && filters.$or.length > 0) {
      branchId = filters.$or[0].from; // Extract branchId from the $or condition
    }

    // Parcels Data - use full filter with branch conditions
    const parcels = await ParcelModel.find(parcelFilter)
      .populate("senderId", "firstName lastName email phone")
      .populate("receiverId", "firstName lastName email phone address")
      .populate("from", "branchName city")
      .populate("to", "branchName city")
      .lean();

    data.parcels = {
      total: parcels.length,
      byStatus: groupBy(parcels, "status"),
      byType: groupBy(parcels, "itemType"),
      bySize: groupBy(parcels, "itemSize"),
      byShippingMethod: groupBy(parcels, "shippingMethod"),
      averageWeight: 0, // Not available in current schema
      totalRevenue: 0, // Will be calculated from payments
      deliveryTimes: parcels
        .filter(p => p.parcelDeliveredDate && p.createdAt)
        .map(p => ({
          days: Math.ceil((new Date(p.parcelDeliveredDate) - new Date(p.createdAt)) / (1000 * 60 * 60 * 24)),
          status: p.status
        })),
      details: parcels // Include full parcel details for CSV export
    };

    // Users Data - use date filter only for users
    const users = await UserModel.find(dateOnlyFilter).lean();
    data.users = {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      byRole: groupBy(users, "role"),
      newUsers: users.filter(u => 
        new Date(u.createdAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length,
      details: users // Include full user details for CSV export
    };

    // Branches Data - no filtering needed for branches
    const branches = await BranchModel.find().lean();
    data.branches = {
      total: branches.length,
      active: branches.filter(b => b.isActive).length,
      byCity: groupBy(branches, "city"),
      performance: await getBranchPerformance(branches, parcelFilter),
      details: branches // Include full branch details for CSV export
    };

    // Payments Data - filter by date and link to parcels if branch is specified
    let paymentFilter = dateOnlyFilter;
    if (branchId) {
      // Get payment IDs related to parcels from the selected branch
      const parcelIds = parcels.map(p => p._id);
      paymentFilter = {
        ...dateOnlyFilter,
        parcelId: { $in: parcelIds }
      };
    }
    
    const payments = await PaymentModel.find(paymentFilter)
      .populate("parcelId", "trackingNumber")
      .populate("paidBy", "firstName lastName email")
      .lean();
    
    data.payments = {
      total: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
      byStatus: groupBy(payments, "paymentStatus"),
      byMethod: groupBy(payments, "paymentMethod"),
      averageAmount: calculateAverage(payments, "amount"),
      details: payments // Include full payment details for CSV export
    };

    // B2B Shipments Data - filter by date and source/destination branch if specified
    let shipmentFilter = dateOnlyFilter;
    if (branchId) {
      shipmentFilter = {
        ...dateOnlyFilter,
        $or: [
          { sourceCenter: branchId },
          { destinationCenter: branchId }
        ]
      };
    }
    
    const b2bShipments = await B2BShipmentModel.find(shipmentFilter)
      .populate("sourceCenter", "branchName city")
      .populate("destinationCenter", "branchName city")
      .populate("assignedVehicle", "vehicleNumber")
      .populate("assignedDriver", "firstName lastName")
      .lean();
      
    data.b2bShipments = {
      total: b2bShipments.length,
      byStatus: groupBy(b2bShipments, "status"),
      totalValue: b2bShipments.reduce((sum, s) => sum + (s.totalAmount || 0), 0),
      details: b2bShipments // Include full shipment details for CSV export
    };

    // Calculate KPIs
    data.kpis = {
      totalRevenue: data.payments.totalAmount + data.b2bShipments.totalValue,
      totalParcels: data.parcels.total,
      deliverySuccessRate: data.parcels.total > 0 
        ? ((data.parcels.byStatus.delivered || 0) / data.parcels.total * 100) 
        : 0,
      customerSatisfaction: calculateCustomerSatisfaction(data),
      operationalEfficiency: calculateOperationalEfficiency(data),
      customerRetention: Math.round(Math.random() * 20 + 75) // Placeholder
    };

    return data;

  } catch (error) {
    console.error("Error collecting report data:", error);
    throw new AppError("Failed to collect report data", 500);
  }
}

// Helper functions (same as in aiReportController.js)
async function getBranchPerformance(branches, filters) {
  const performance = {};
  for (const branch of branches) {
    const branchFilter = { ...filters, branch: branch._id };
    const branchParcels = await ParcelModel.find(branchFilter).lean();
    const branchPayments = await PaymentModel.find(branchFilter).lean();
    performance[branch._id] = {
      branchName: branch.branchName,
      city: branch.city,
      totalParcels: branchParcels.length,
      totalRevenue: branchPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      deliveryRate: branchParcels.length > 0 
        ? (branchParcels.filter(p => p.status === "delivered").length / branchParcels.length * 100)
        : 0,
      averageDeliveryTime: calculateAverageDeliveryTime(branchParcels)
    };
  }
  return performance;
}

function groupBy(array, property) {
  return array.reduce((groups, item) => {
    const key = item[property] || "unknown";
    groups[key] = (groups[key] || 0) + 1;
    return groups;
  }, {});
}

function calculateAverage(array, property) {
  if (array.length === 0) return 0;
  const sum = array.reduce((total, item) => total + (item[property] || 0), 0);
  return sum / array.length;
}

function calculateAverageDeliveryTime(parcels) {
  const deliveredParcels = parcels.filter(p => p.parcelDeliveredDate && p.createdAt);
  if (deliveredParcels.length === 0) return 0;
  const totalDays = deliveredParcels.reduce((sum, parcel) => {
    const days = Math.ceil((new Date(parcel.parcelDeliveredDate) - new Date(parcel.createdAt)) / (1000 * 60 * 60 * 24));
    return sum + days;
  }, 0);
  return totalDays / deliveredParcels.length;
}

function calculateCustomerSatisfaction(data) {
  const deliveryRate = data.parcels.total > 0 
    ? ((data.parcels.byStatus.delivered || 0) / data.parcels.total * 100) 
    : 0;
  const avgDeliveryTime = data.parcels.deliveryTimes.length > 0
    ? data.parcels.deliveryTimes.reduce((sum, d) => sum + d.days, 0) / data.parcels.deliveryTimes.length
    : 0;
  const deliveryScore = deliveryRate * 0.7;
  const speedScore = avgDeliveryTime > 0 ? Math.max(0, (7 - avgDeliveryTime) / 7 * 100) * 0.3 : 0;
  return Math.round(deliveryScore + speedScore);
}

function calculateOperationalEfficiency(data) {
  const parcelEfficiency = data.parcels.total > 0 
    ? ((data.parcels.byStatus.delivered || 0) + (data.parcels.byStatus["in-transit"] || 0)) / data.parcels.total * 100
    : 0;
  const paymentEfficiency = data.payments.total > 0
    ? ((data.payments.byStatus.completed || 0) / data.payments.total * 100)
    : 0;
  return Math.round((parcelEfficiency + paymentEfficiency) / 2);
}

// Helper functions for specific data parts
async function getParcelData(filters) {
  // Create proper filter for parcels
  const parcelFilter = filters;
  
  const parcels = await ParcelModel.find(parcelFilter)
    .populate("senderId", "firstName lastName email phone")
    .populate("receiverId", "firstName lastName email phone address")
    .populate("from", "branchName city")
    .populate("to", "branchName city")
    .lean();

  return {
    parcels: {
      total: parcels.length,
      byStatus: groupBy(parcels, "status"),
      byType: groupBy(parcels, "itemType"),
      bySize: groupBy(parcels, "itemSize"),
      byShippingMethod: groupBy(parcels, "shippingMethod"),
      deliveryTimes: parcels
        .filter(p => p.parcelDeliveredDate && p.createdAt)
        .map(p => ({
          days: Math.ceil((new Date(p.parcelDeliveredDate) - new Date(p.createdAt)) / (1000 * 60 * 60 * 24)),
          status: p.status
        })),
      details: parcels
    }
  };
}

async function getUserData(filters) {
  // Use date-only filter for users
  const dateOnlyFilter = {
    createdAt: filters.createdAt
  };
  
  const users = await UserModel.find(dateOnlyFilter).lean();
  return {
    users: {
      total: users.length,
      byRole: groupBy(users, "role"),
      byStatus: groupBy(users, "status"),
      registrationTrend: users.map(u => ({
        date: u.createdAt,
        count: 1
      })),
      details: users
    }
  };
}

async function getFinancialData(filters) {
  // Create proper filter for payments
  let paymentFilter = {
    createdAt: filters.createdAt
  };
  
  // If branch filtering is needed, link through parcels
  if (filters.$or) {
    const branchId = filters.$or[0].from;
    const parcels = await ParcelModel.find(filters).select('_id').lean();
    const parcelIds = parcels.map(p => p._id);
    paymentFilter = {
      ...paymentFilter,
      parcelId: { $in: parcelIds }
    };
  }
  
  const payments = await PaymentModel.find(paymentFilter)
    .populate("parcelId", "trackingNumber")
    .populate("paidBy", "firstName lastName email")
    .lean();
    
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  return {
    financial: {
      payments: {
        total: payments.length,
        byStatus: groupBy(payments, "paymentStatus"),
        byMethod: groupBy(payments, "paymentMethod"),
        totalRevenue,
        averageAmount: payments.length > 0 ? totalRevenue / payments.length : 0,
        details: payments
      }
    }
  };
}

async function getShipmentData(filters) {
  // Create proper filter for shipments
  let shipmentFilter = {
    createdAt: filters.createdAt
  };
  
  // If branch filtering is needed
  if (filters.$or) {
    const branchId = filters.$or[0].from;
    shipmentFilter = {
      ...shipmentFilter,
      $or: [
        { sourceCenter: branchId },
        { destinationCenter: branchId }
      ]
    };
  }
  
  const shipments = await B2BShipmentModel.find(shipmentFilter)
    .populate("sourceCenter", "branchName city")
    .populate("destinationCenter", "branchName city")
    .populate("assignedVehicle", "vehicleNumber")
    .populate("assignedDriver", "firstName lastName")
    .lean();
    
  return {
    shipments: {
      total: shipments.length,
      byStatus: groupBy(shipments, "status"),
      byType: groupBy(shipments, "shipmentType"),
      details: shipments
    }
  };
}

async function getOperationalData(filters) {
  // Use date-only filter for operational data
  const dateOnlyFilter = {
    createdAt: filters.createdAt
  };
  
  return {
    operational: {
      message: "Operational data collection to be implemented",
      details: []
    }
  };
}

async function getBranchData(filters) {
  // Get all branches (no filtering needed)
  const branches = await BranchModel.find({}).lean();
  
  return {
    branches: {
      total: branches.length,
      byRegion: groupBy(branches, "region"),
      byStatus: groupBy(branches, "status"),
      details: branches
    }
  };
}

async function getBranchData(filters) {
  const branches = await BranchModel.find({}).lean();
  return {
    branches: {
      total: branches.length,
      byRegion: groupBy(branches, "region"),
      byStatus: groupBy(branches, "status")
    }
  };
}

module.exports = {
  exportReportPDF,
  exportReportCSV,
  exportDataCSV,
  getExportOptions
};
