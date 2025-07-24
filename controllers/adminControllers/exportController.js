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
    const { reportType = "comprehensive", includeAI = "false" } = req.query;
    
    // Parse date range and branch filter
    let dateFilter = {};
    let branchFilter = {};
    
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
      branchFilter = { branch: req.query.branchId };
    }
    
    const filters = { ...dateFilter, ...branchFilter };
    
    // Collect report data
    const reportData = await collectReportData(filters, reportType);
    
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
    const { reportType = "comprehensive", includeAI = "false" } = req.query;
    
    // Parse date range and branch filter
    let dateFilter = {};
    let branchFilter = {};
    
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
      branchFilter = { branch: req.query.branchId };
    }
    
    const filters = { ...dateFilter, ...branchFilter };
    
    // Collect report data
    const reportData = await collectReportData(filters, reportType);
    
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
          .populate("parcel", "trackingNumber")
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
async function collectReportData(filters, reportType) {
  const data = {};

  try {
    // Parcels Data
    const parcels = await ParcelModel.find(filters)
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
        }))
    };

    // Users Data
    const users = await UserModel.find(filters).lean();
    data.users = {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      byRole: groupBy(users, "role"),
      newUsers: users.filter(u => 
        new Date(u.createdAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length
    };

    // Branches Data
    const branches = await BranchModel.find().lean();
    data.branches = {
      total: branches.length,
      active: branches.filter(b => b.isActive).length,
      byCity: groupBy(branches, "city"),
      performance: await getBranchPerformance(branches, filters)
    };

    // Payments Data
    const payments = await PaymentModel.find(filters).lean();
    data.payments = {
      total: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
      byStatus: groupBy(payments, "paymentStatus"),
      byMethod: groupBy(payments, "paymentMethod"),
      averageAmount: calculateAverage(payments, "amount")
    };

    // B2B Shipments Data
    const b2bShipments = await B2BShipmentModel.find(filters).lean();
    data.b2bShipments = {
      total: b2bShipments.length,
      byStatus: groupBy(b2bShipments, "status"),
      totalValue: b2bShipments.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
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

module.exports = {
  exportReportPDF,
  exportReportCSV,
  exportDataCSV,
  getExportOptions
};
