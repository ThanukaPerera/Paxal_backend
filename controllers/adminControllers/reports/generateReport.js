// const Admin = require("../../../models/AdminModel");
// const B2BShipment = require("../../../models/B2BShipmentModel");
// const Branch = require("../../../models/BranchesModel");
// const Driver = require("../../../models/driverModel");
// const Inquiry = require("../../../models/inquiryModel");
// const Notification = require("../../../models/Notification");
// const Parcel = require("../../../models/parcelModel");
// const Payment = require("../../../models/paymentModel");
// const Receiver = require("../../../models/receiverModel");
// const Staff = require("../../../models/StaffModel");
// const User = require("../../../models/userModel");
// const Vehicle = require("../../../models/vehicleModel");
// const VehicleSchedule = require("../../../models/VehicleScheduleModel");

// /**
//  * Generate comprehensive report for Parcel Management System
//  * @param {Object} req - Express request object
//  * @param {Object} res - Express response object
//  */
// const generateReport = async (req, res) => {
//   try {
//     const {
//       startDate,
//       endDate,
//       reportType = "comprehensive", // comprehensive, parcels, shipments, users, financial
//       branchId,
//       reportPart, // all, parcels, shipments, users, financial, operational, branches
//       format = "json", // json, csv, pdf
//     } = req.query;

//     // Set default date range if not provided (last 30 days)
//     const endDateObj = endDate ? new Date(endDate) : new Date();
//     const startDateObj = startDate
//       ? new Date(startDate)
//       : (() => {
//           const date = new Date();
//           date.setDate(date.getDate() - 30);
//           return date;
//         })();

//     // Validate date range
//     if (startDateObj > endDateObj) {
//       return res.status(400).json({
//         status: "error",
//         message: "Start date cannot be after end date",
//       });
//     }

//     // Build base filter for date range
//     const dateFilter = {
//       createdAt: { $gte: startDateObj, $lte: endDateObj },
//     };

//     // Add branch filter if specified
//     if (branchId && branchId !== "all") {
//       // For parcels, we need to filter by either 'from' or 'to' branch
//       dateFilter.$or = [{ from: branchId }, { to: branchId }];
//     }

//     let reportData = {};

//     switch (reportType) {
//       case "comprehensive":
//         reportData = await generateComprehensiveReport(
//           dateFilter,
//           startDateObj,
//           endDateObj,
//           reportPart
//         );
//         break;
//       case "parcels":
//         reportData = await generateParcelReport(dateFilter);
//         break;
//       case "shipments":
//         reportData = await generateShipmentReport(dateFilter);
//         break;
//       case "users":
//         reportData = await generateUserReport(dateFilter);
//         break;
//       case "financial":
//         reportData = await generateFinancialReport(dateFilter);
//         break;
//       case "operational":
//         reportData = await generateOperationalReport(dateFilter);
//         break;
//       default:
//         return res.status(400).json({
//           status: "error",
//           message: "Invalid report type",
//         });
//     }

//     // Add metadata
//     const reportMetadata = {
//       generatedAt: new Date(),
//       dateRange: {
//         startDate: startDateObj.toISOString(),
//         endDate: endDateObj.toISOString(),
//       },
//       reportType,
//       branchId: branchId || "all",
//       format,
//     };

//     const response = {
//       status: "success",
//       message: "Report generated successfully",
//       metadata: reportMetadata,
//       data: reportData,
//     };

//     // Return data based on format
//     if (format === "csv") {
//       return generateCSVResponse(res, reportData, reportType, reportMetadata);
//     }

//     res.status(200).json(response);
//   } catch (error) {
//     console.error("Error generating report:", error);
//     res.status(500).json({
//       status: "error",
//       message: "Internal server error",
//       error:
//         process.env.NODE_ENV === "development"
//           ? error.message
//           : "Something went wrong",
//     });
//   }
// };

// /**
//  * Generate comprehensive system report
//  */
// async function generateComprehensiveReport(
//   dateFilter,
//   startDate,
//   endDate,
//   reportPart
// ) {
//   // If reportPart is specified, only generate that part
//   if (reportPart && reportPart !== "all") {
//     switch (reportPart) {
//       case "parcels":
//         return {
//           parcelAnalytics: await getParcelAnalytics(dateFilter),
//           trends: await getTrendAnalysis(
//             startDate,
//             endDate,
//             ["parcels"],
//             dateFilter
//           ),
//         };
//       case "shipments":
//         return {
//           shipmentAnalytics: await getShipmentAnalytics(dateFilter),
//           trends: await getTrendAnalysis(
//             startDate,
//             endDate,
//             ["shipments"],
//             dateFilter
//           ),
//         };
//       case "users":
//         return {
//           userAnalytics: await getUserAnalytics(dateFilter),
//           trends: await getTrendAnalysis(
//             startDate,
//             endDate,
//             ["users"],
//             dateFilter
//           ),
//         };
//       case "financial":
//         return {
//           financialAnalytics: await getFinancialAnalytics(dateFilter),
//           trends: await getTrendAnalysis(
//             startDate,
//             endDate,
//             ["financial"],
//             dateFilter
//           ),
//         };
//       case "operational":
//         return {
//           operationalAnalytics: await getOperationalAnalytics(dateFilter),
//           trends: await getTrendAnalysis(
//             startDate,
//             endDate,
//             ["operational"],
//             dateFilter
//           ),
//         };
//       case "branches":
//         return {
//           branchPerformance: await getBranchPerformance(dateFilter),
//           trends: await getTrendAnalysis(
//             startDate,
//             endDate,
//             ["branches"],
//             dateFilter
//           ),
//         };
//       default:
//         break;
//     }
//   }

//   // Generate full comprehensive report
//   const [
//     systemOverview,
//     parcelAnalytics,
//     shipmentAnalytics,
//     userAnalytics,
//     financialAnalytics,
//     operationalAnalytics,
//     branchPerformance,
//   ] = await Promise.all([
//     getSystemOverview(dateFilter),
//     getParcelAnalytics(dateFilter),
//     getShipmentAnalytics(dateFilter),
//     getUserAnalytics(dateFilter),
//     getFinancialAnalytics(dateFilter),
//     getOperationalAnalytics(dateFilter),
//     getBranchPerformance(dateFilter),
//   ]);

//   return {
//     systemOverview,
//     parcelAnalytics,
//     shipmentAnalytics,
//     userAnalytics,
//     financialAnalytics,
//     operationalAnalytics,
//     branchPerformance,
//     trends: await getTrendAnalysis(startDate, endDate, null, dateFilter),
//   };
// }

// /**
//  * Generate parcel-focused report
//  */
// async function generateParcelReport(dateFilter) {
//   const parcelData = await Parcel.aggregate([
//     { $match: dateFilter },
//     {
//       $lookup: {
//         from: "branches",
//         localField: "from",
//         foreignField: "_id",
//         as: "sourceBranch",
//       },
//     },
//     {
//       $lookup: {
//         from: "branches",
//         localField: "to",
//         foreignField: "_id",
//         as: "destinationBranch",
//       },
//     },
//     {
//       $lookup: {
//         from: "users",
//         localField: "senderId",
//         foreignField: "_id",
//         as: "sender",
//       },
//     },
//     {
//       $lookup: {
//         from: "receivers",
//         localField: "receiverId",
//         foreignField: "_id",
//         as: "receiver",
//       },
//     },
//   ]);

//   const analytics = await getParcelAnalytics(dateFilter);

//   return {
//     parcels: parcelData,
//     analytics,
//     summary: {
//       totalParcels: parcelData.length,
//       averageWeight:
//         parcelData.reduce((sum, p) => sum + (p.weight || 0), 0) /
//         parcelData.length,
//       averageVolume:
//         parcelData.reduce((sum, p) => sum + (p.volume || 0), 0) /
//         parcelData.length,
//     },
//   };
// }

// /**
//  * Generate shipment-focused report
//  */
// async function generateShipmentReport(dateFilter) {
//   const shipmentData = await B2BShipment.aggregate([
//     { $match: dateFilter },
//     {
//       $lookup: {
//         from: "branches",
//         localField: "sourceCenter",
//         foreignField: "_id",
//         as: "sourceBranch",
//       },
//     },
//     {
//       $lookup: {
//         from: "vehicles",
//         localField: "assignedVehicle",
//         foreignField: "_id",
//         as: "vehicle",
//       },
//     },
//     {
//       $lookup: {
//         from: "drivers",
//         localField: "assignedDriver",
//         foreignField: "_id",
//         as: "driver",
//       },
//     },
//     {
//       $lookup: {
//         from: "parcels",
//         localField: "parcels",
//         foreignField: "_id",
//         as: "parcelDetails",
//       },
//     },
//   ]);

//   const analytics = await getShipmentAnalytics(dateFilter);

//   return {
//     shipments: shipmentData,
//     analytics,
//     summary: {
//       totalShipments: shipmentData.length,
//       averageDistance:
//         shipmentData.reduce((sum, s) => sum + (s.totalDistance || 0), 0) /
//         shipmentData.length,
//       averageTime:
//         shipmentData.reduce((sum, s) => sum + (s.totalTime || 0), 0) /
//         shipmentData.length,
//     },
//   };
// }

// /**
//  * Generate user-focused report
//  */
// async function generateUserReport(dateFilter) {
//   const [users, staff, drivers, admins] = await Promise.all([
//     User.find(dateFilter).select(
//       "-password -passwordconfirm -otp -resetPasswordOTP"
//     ),
//     Staff.find(dateFilter)
//       .select("-password -resetPasswordToken")
//       .populate("branchId", "location"),
//     Driver.find(dateFilter)
//       .select("-password")
//       .populate("branchId", "location")
//       .populate("vehicleId", "registrationNo"),
//     Admin.find(dateFilter).select("-password -resetCode"),
//   ]);

//   const analytics = await getUserAnalytics(dateFilter);

//   return {
//     users: {
//       customers: users,
//       staff,
//       drivers,
//       admins,
//     },
//     analytics,
//     summary: {
//       totalUsers: users.length + staff.length + drivers.length + admins.length,
//       customerCount: users.length,
//       staffCount: staff.length,
//       driverCount: drivers.length,
//       adminCount: admins.length,
//     },
//   };
// }

// /**
//  * Generate financial report
//  */
// async function generateFinancialReport(dateFilter) {
//   const paymentData = await Payment.aggregate([
//     { $match: dateFilter },
//     {
//       $lookup: {
//         from: "parcels",
//         localField: "parcelId",
//         foreignField: "_id",
//         as: "parcel",
//       },
//     },
//     {
//       $unwind: { path: "$parcel", preserveNullAndEmptyArrays: true },
//     },
//     {
//       $lookup: {
//         from: "branches",
//         localField: "parcel.from",
//         foreignField: "_id",
//         as: "sourceBranch",
//       },
//     },
//   ]);

//   const analytics = await getFinancialAnalytics(dateFilter);

//   return {
//     payments: paymentData,
//     analytics,
//     summary: {
//       totalRevenue: paymentData.reduce((sum, p) => sum + (p.amount || 0), 0),
//       totalTransactions: paymentData.length,
//       averageTransactionValue:
//         paymentData.length > 0
//           ? paymentData.reduce((sum, p) => sum + (p.amount || 0), 0) /
//             paymentData.length
//           : 0,
//     },
//   };
// }

// /**
//  * Generate operational report
//  */
// async function generateOperationalReport(dateFilter) {
//   const [vehicles, schedules, inquiries] = await Promise.all([
//     Vehicle.find()
//       .populate("assignedBranch", "location")
//       .populate("currentBranch", "location"),
//     VehicleSchedule.find(dateFilter)
//       .populate("vehicle", "registrationNo")
//       .populate("branch", "location"),
//     Inquiry.find(dateFilter).populate("staffId", "name"),
//   ]);

//   const analytics = await getOperationalAnalytics(dateFilter);

//   return {
//     vehicles,
//     schedules,
//     inquiries,
//     analytics,
//   };
// }

// /**
//  * Get system overview statistics
//  */
// async function getSystemOverview(dateFilter = {}) {
//   const [
//     totalUsers,
//     totalParcels,
//     totalShipments,
//     totalBranches,
//     totalVehicles,
//     totalStaff,
//     totalDrivers,
//     totalRevenue,
//   ] = await Promise.all([
//     User.countDocuments(dateFilter),
//     Parcel.countDocuments(dateFilter),
//     B2BShipment.countDocuments(dateFilter),
//     Branch.countDocuments(),
//     Vehicle.countDocuments(),
//     Staff.countDocuments(),
//     Driver.countDocuments(),
//     Payment.aggregate([
//       { $match: dateFilter },
//       { $group: { _id: null, total: { $sum: "$amount" } } },
//     ]),
//   ]);

//   return {
//     totalUsers,
//     totalParcels,
//     totalShipments,
//     totalBranches,
//     totalVehicles,
//     totalStaff,
//     totalDrivers,
//     totalRevenue: totalRevenue[0]?.total || 0,
//   };
// }

// /**
//  * Get parcel analytics
//  */
// async function getParcelAnalytics(dateFilter) {
//   const parcelStats = await Parcel.aggregate([
//     { $match: dateFilter },
//     {
//       $group: {
//         _id: null,
//         totalParcels: { $sum: 1 },
//         totalWeight: { $sum: "$weight" },
//         totalVolume: { $sum: "$volume" },
//         averagePrice: { $avg: "$price" },
//         statusBreakdown: {
//           $push: "$status",
//         },
//         deliveryTypeBreakdown: {
//           $push: "$deliveryType",
//         },
//         submittingTypeBreakdown: {
//           $push: "$submittingType",
//         },
//       },
//     },
//   ]);

//   const statusCounts = await Parcel.aggregate([
//     { $match: dateFilter },
//     {
//       $group: {
//         _id: "$status",
//         count: { $sum: 1 },
//       },
//     },
//   ]);

//   const deliveryTypeCounts = await Parcel.aggregate([
//     { $match: dateFilter },
//     {
//       $group: {
//         _id: "$deliveryType",
//         count: { $sum: 1 },
//       },
//     },
//   ]);

//   return {
//     overview: parcelStats[0] || {},
//     statusBreakdown: statusCounts,
//     deliveryTypeBreakdown: deliveryTypeCounts,
//   };
// }

// /**
//  * Get shipment analytics
//  */
// async function getShipmentAnalytics(dateFilter) {
//   const shipmentStats = await B2BShipment.aggregate([
//     { $match: dateFilter },
//     {
//       $group: {
//         _id: null,
//         totalShipments: { $sum: 1 },
//         totalDistance: { $sum: "$totalDistance" },
//         totalTime: { $sum: "$totalTime" },
//         totalWeight: { $sum: "$totalWeight" },
//         totalVolume: { $sum: "$totalVolume" },
//         averageParcelCount: { $avg: "$parcelCount" },
//       },
//     },
//   ]);

//   const statusCounts = await B2BShipment.aggregate([
//     { $match: dateFilter },
//     {
//       $group: {
//         _id: "$status",
//         count: { $sum: 1 },
//       },
//     },
//   ]);

//   const deliveryTypeCounts = await B2BShipment.aggregate([
//     { $match: dateFilter },
//     {
//       $group: {
//         _id: "$deliveryType",
//         count: { $sum: 1 },
//       },
//     },
//   ]);

//   return {
//     overview: shipmentStats[0] || {},
//     statusBreakdown: statusCounts,
//     deliveryTypeBreakdown: deliveryTypeCounts,
//   };
// }

// /**
//  * Get user analytics
//  */
// async function getUserAnalytics(dateFilter) {
//   const [userStats, staffStats, driverStats] = await Promise.all([
//     User.aggregate([
//       { $match: dateFilter },
//       {
//         $group: {
//           _id: null,
//           totalUsers: { $sum: 1 },
//           verifiedUsers: { $sum: { $cond: ["$isVerify", 1, 0] } },
//           unverifiedUsers: { $sum: { $cond: ["$isVerify", 0, 1] } },
//         },
//       },
//     ]),
//     Staff.aggregate([
//       { $match: dateFilter },
//       {
//         $group: {
//           _id: "$status",
//           count: { $sum: 1 },
//         },
//       },
//     ]),
//     Driver.countDocuments(dateFilter),
//   ]);

//   return {
//     userOverview: userStats[0] || {},
//     staffStatusBreakdown: staffStats,
//     totalDrivers: driverStats,
//   };
// }

// /**
//  * Get financial analytics
//  */
// async function getFinancialAnalytics(dateFilter) {
//   const paymentStats = await Payment.aggregate([
//     { $match: dateFilter },
//     {
//       $group: {
//         _id: null,
//         totalRevenue: { $sum: "$amount" },
//         totalTransactions: { $sum: 1 },
//         pendingPayments: {
//           $sum: {
//             $cond: [{ $eq: ["$paymentStatus", "pending"] }, "$amount", 0],
//           },
//         },
//         paidPayments: {
//           $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$amount", 0] },
//         },
//         averageTransactionValue: { $avg: "$amount" },
//         paidTransactions: {
//           $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] },
//         },
//         pendingTransactions: {
//           $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0] },
//         },
//       },
//     },
//   ]);

//   const paymentMethodBreakdown = await Payment.aggregate([
//     { $match: dateFilter },
//     {
//       $group: {
//         _id: "$paymentMethod",
//         count: { $sum: 1 },
//         totalAmount: { $sum: "$amount" },
//       },
//     },
//   ]);

//   return {
//     overview: paymentStats[0] || {},
//     paymentMethodBreakdown,
//   };
// }

// /**
//  * Get operational analytics
//  */
// async function getOperationalAnalytics(dateFilter) {
//   const [vehicleStats, scheduleStats, inquiryStats] = await Promise.all([
//     Vehicle.aggregate([
//       {
//         $group: {
//           _id: "$vehicleType",
//           count: { $sum: 1 },
//           available: { $sum: { $cond: ["$available", 1, 0] } },
//         },
//       },
//     ]),
//     VehicleSchedule.aggregate([
//       { $match: dateFilter },
//       {
//         $group: {
//           _id: "$type",
//           count: { $sum: 1 },
//           totalParcels: { $sum: { $size: "$assignedParcels" } },
//         },
//       },
//     ]),
//     Inquiry.aggregate([
//       { $match: dateFilter },
//       {
//         $group: {
//           _id: "$status",
//           count: { $sum: 1 },
//         },
//       },
//     ]),
//   ]);

//   return {
//     vehicleBreakdown: vehicleStats,
//     scheduleBreakdown: scheduleStats,
//     inquiryBreakdown: inquiryStats,
//   };
// }

// /**
//  * Get branch performance analytics
//  */
// async function getBranchPerformance(dateFilter) {
//   const branchStats = await Branch.aggregate([
//     {
//       $lookup: {
//         from: "parcels",
//         localField: "_id",
//         foreignField: "from",
//         as: "originatingParcels",
//       },
//     },
//     {
//       $lookup: {
//         from: "parcels",
//         localField: "_id",
//         foreignField: "to",
//         as: "destinationParcels",
//       },
//     },
//     {
//       $lookup: {
//         from: "staffs",
//         localField: "_id",
//         foreignField: "branchId",
//         as: "staff",
//       },
//     },
//     {
//       $lookup: {
//         from: "drivers",
//         localField: "_id",
//         foreignField: "branchId",
//         as: "drivers",
//       },
//     },
//     {
//       $lookup: {
//         from: "vehicles",
//         localField: "_id",
//         foreignField: "assignedBranch",
//         as: "vehicles",
//       },
//     },
//     {
//       $project: {
//         branchId: 1,
//         location: 1,
//         contact: 1,
//         originatingParcels: { $size: "$originatingParcels" },
//         destinationParcels: { $size: "$destinationParcels" },
//         staffCount: { $size: "$staff" },
//         driverCount: { $size: "$drivers" },
//         vehicleCount: { $size: "$vehicles" },
//         totalParcels: {
//           $add: [
//             { $size: "$originatingParcels" },
//             { $size: "$destinationParcels" },
//           ],
//         },
//       },
//     },
//     { $sort: { totalParcels: -1 } },
//   ]);

//   return branchStats;
// }

// /**
//  * Get trend analysis
//  */
// async function getTrendAnalysis(
//   startDate,
//   endDate,
//   categories = null,
//   dateFilter = {}
// ) {
//   const trends = {};

//   // Create base filter combining date range and any additional filters
//   const baseFilter = {
//     createdAt: { $gte: startDate, $lte: endDate },
//     ...dateFilter,
//   };

//   // If categories is specified, only calculate trends for those categories
//   const includeCategories = categories || [
//     "parcels",
//     "shipments",
//     "users",
//     "financial",
//     "operational",
//     "branches",
//   ];

//   if (includeCategories.includes("parcels")) {
//     const parcelTrends = await Parcel.aggregate([
//       {
//         $match: baseFilter,
//       },
//       {
//         $group: {
//           _id: {
//             year: { $year: "$createdAt" },
//             month: { $month: "$createdAt" },
//             day: { $dayOfMonth: "$createdAt" },
//           },
//           count: { $sum: 1 },
//           totalRevenue: { $sum: "$price" },
//         },
//       },
//       { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
//     ]);

//     trends.parcelTrend = {
//       growth: calculateGrowthRate(parcelTrends, "count"),
//       period: `${startDate.toDateString()} to ${endDate.toDateString()}`,
//     };
//   }

//   if (includeCategories.includes("financial")) {
//     const financialTrends = await Payment.aggregate([
//       {
//         $match: baseFilter,
//       },
//       {
//         $group: {
//           _id: {
//             year: { $year: "$createdAt" },
//             month: { $month: "$createdAt" },
//           },
//           totalRevenue: { $sum: "$amount" },
//           count: { $sum: 1 },
//         },
//       },
//       { $sort: { "_id.year": 1, "_id.month": 1 } },
//     ]);

//     trends.revenueTrend = {
//       growth: calculateGrowthRate(financialTrends, "totalRevenue"),
//       period: `${startDate.toDateString()} to ${endDate.toDateString()}`,
//     };
//   }

//   if (includeCategories.includes("users")) {
//     const userTrends = await User.aggregate([
//       {
//         $match: baseFilter,
//       },
//       {
//         $group: {
//           _id: {
//             year: { $year: "$createdAt" },
//             month: { $month: "$createdAt" },
//           },
//           count: { $sum: 1 },
//         },
//       },
//       { $sort: { "_id.year": 1, "_id.month": 1 } },
//     ]);

//     trends.userTrend = {
//       growth: calculateGrowthRate(userTrends, "count"),
//       period: `${startDate.toDateString()} to ${endDate.toDateString()}`,
//     };
//   }

//   if (includeCategories.includes("shipments")) {
//     const shipmentTrends = await B2BShipment.aggregate([
//       {
//         $match: baseFilter,
//       },
//       {
//         $group: {
//           _id: {
//             year: { $year: "$createdAt" },
//             month: { $month: "$createdAt" },
//           },
//           count: { $sum: 1 },
//         },
//       },
//       { $sort: { "_id.year": 1, "_id.month": 1 } },
//     ]);

//     trends.shipmentTrend = {
//       growth: calculateGrowthRate(shipmentTrends, "count"),
//       period: `${startDate.toDateString()} to ${endDate.toDateString()}`,
//     };
//   }

//   if (includeCategories.includes("operational")) {
//     const vehicleTrends = await Vehicle.aggregate([
//       {
//         $group: {
//           _id: "$status",
//           count: { $sum: 1 },
//         },
//       },
//     ]);

//     const utilizationRate =
//       vehicleTrends.find((v) => v._id === "busy")?.count || 0;
//     const totalVehicles = vehicleTrends.reduce((sum, v) => sum + v.count, 0);

//     trends.vehicleTrend = {
//       growth:
//         totalVehicles > 0
//           ? Math.round((utilizationRate / totalVehicles) * 100)
//           : 0,
//       period: "Current utilization rate",
//     };
//   }

//   return trends;
// }

// /**
//  * Calculate growth rate from trend data
//  */
// function calculateGrowthRate(trendData, field) {
//   if (!trendData || trendData.length < 2) return 0;

//   const firstPeriod = trendData[0][field] || 0;
//   const lastPeriod = trendData[trendData.length - 1][field] || 0;

//   if (firstPeriod === 0) return lastPeriod > 0 ? 100 : 0;

//   return Math.round(((lastPeriod - firstPeriod) / firstPeriod) * 100);
// }

// /**
//  * Generate CSV response
//  */
// function generateCSVResponse(res, reportData, reportType, metadata) {
//   // Implementation for CSV export would go here
//   // For now, returning JSON with CSV headers
//   res.setHeader("Content-Type", "application/json");
//   res.setHeader(
//     "Content-Disposition",
//     `attachment; filename="report_${reportType}_${
//       new Date().toISOString().split("T")[0]
//     }.json"`
//   );

//   return res.json({
//     status: "success",
//     message: "CSV export functionality to be implemented",
//     metadata,
//     data: reportData,
//   });
// }

// module.exports = {
//   generateReport,
// };


const mongoose = require("mongoose");
const { Parser } = require("json2csv");
const Admin = require("../../../models/AdminModel");
const B2BShipment = require("../../../models/B2BShipmentModel");
const Branch = require("../../../models/BranchesModel");
const Driver = require("../../../models/driverModel");
const Inquiry = require("../../../models/inquiryModel");
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
    let {
      startDate,
      endDate,
      reportType = "comprehensive",
      branchId = "all",
      reportPart = "all",
      format = "json",
    } = req.query;

    // Normalize empty strings to 'all'
    branchId = branchId === "" ? "all" : branchId;
    reportPart = reportPart === "" ? "all" : reportPart;

    // Validate format
    if (!["json", "csv"].includes(format)) {
      return res.status(400).json({ status: "error", message: "Invalid format. Use 'json' or 'csv'" });
    }

    // Validate dates
    if (startDate && isNaN(new Date(startDate))) {
      return res.status(400).json({ status: "error", message: "Invalid startDate format. Use ISO format (e.g., 2025-06-25T00:00:00.000Z)" });
    }
    if (endDate && isNaN(new Date(endDate))) {
      return res.status(400).json({ status: "error", message: "Invalid endDate format. Use ISO format (e.g., 2025-07-25T00:00:00.000Z)" });
    }

    // Set default date range (last 30 days)
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const startDateObj = startDate
      ? new Date(startDate)
      : new Date(endDateObj.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Validate date range
    if (startDateObj > endDateObj) {
      return res.status(400).json({ status: "error", message: "Start date cannot be after end date" });
    }

    // Validate branchId
    if (branchId && branchId !== "all") {
      if (!mongoose.Types.ObjectId.isValid(branchId)) {
        return res.status(400).json({ status: "error", message: "Invalid branchId format. Must be a valid ObjectId" });
      }
      const branchExists = await Branch.exists({ _id: branchId });
      if (!branchExists) {
        return res.status(400).json({ status: "error", message: "Branch not found" });
      }
    }

    // Validate reportType
    const validReportTypes = [
      "comprehensive",
      "parcels",
      "shipments",
      "users",
      "financial",
      "operational",
    ];
    if (!validReportTypes.includes(reportType)) {
      return res.status(400).json({ status: "error", message: `Invalid report type. Must be one of: ${validReportTypes.join(", ")}` });
    }

    // Validate reportPart
    const validReportParts = [
      "all",
      "parcels",
      "shipments",
      "users",
      "financial",
      "operational",
      "branches",
    ];
    if (reportType === "comprehensive" && !validReportParts.includes(reportPart)) {
      return res.status(400).json({ status: "error", message: `Invalid report part. Must be one of: ${validReportParts.join(", ")}` });
    }

    // Build base filter for date range
    const dateFilter = {
      createdAt: { $gte: startDateObj, $lte: endDateObj },
    };

    // Apply branch filter conditionally
    let parcelFilter = { ...dateFilter };
    let shipmentFilter = { ...dateFilter };
    let userFilter = { ...dateFilter };
    let paymentFilter = { ...dateFilter };
    let operationalFilter = { ...dateFilter };

    if (branchId && branchId !== "all") {
      parcelFilter.$or = [{ from: branchId }, { to: branchId }];
      shipmentFilter.$or = [{ sourceCenter: branchId }, { currentLocation: branchId }];
      userFilter.branchId = branchId;
      operationalFilter.branch = branchId;
      paymentFilter = {
        createdAt: { $gte: startDateObj, $lte: endDateObj },
        parcelId: {
          $in: await Parcel.find({ $or: [{ from: branchId }, { to: branchId }] }).distinct("_id"),
        },
      };
    }

    let reportData = {};

    switch (reportType) {
      case "comprehensive":
        reportData = await generateComprehensiveReport(
          parcelFilter,
          shipmentFilter,
          userFilter,
          paymentFilter,
          operationalFilter,
          startDateObj,
          endDateObj,
          reportPart
        );
        break;
      case "parcels":
        reportData = await generateParcelReport(parcelFilter);
        break;
      case "shipments":
        reportData = await generateShipmentReport(shipmentFilter);
        break;
      case "users":
        reportData = await generateUserReport(userFilter);
        break;
      case "financial":
        reportData = await generateFinancialReport(paymentFilter);
        break;
      case "operational":
        reportData = await generateOperationalReport(operationalFilter);
        break;
    }

    // Add metadata
    const reportMetadata = {
      generatedAt: new Date().toISOString(),
      dateRange: {
        startDate: startDateObj.toISOString(),
        endDate: endDateObj.toISOString(),
      },
      reportType,
      branchId: branchId || "all",
      format,
      recordCount: Object.values(reportData).reduce(
        (sum, data) => sum + (Array.isArray(data) ? data.length : 0),
        0
      ),
    };

    if (format === "csv") {
      // Generate CSV
      const fields = [
        { label: "Report Type", value: "metadata.reportType" },
        { label: "Generated At", value: "metadata.generatedAt" },
        { label: "Start Date", value: "metadata.dateRange.startDate" },
        { label: "End Date", value: "metadata.dateRange.endDate" },
        { label: "Branch ID", value: "metadata.branchId" },
        ...Object.keys(reportData).flatMap((key) =>
          Array.isArray(reportData[key])
            ? reportData[key].map((_, index) => ({
                label: `${key}[${index}]`,
                value: `${key}[${index}]`,
              }))
            : { label: key, value: key }
        ),
      ];
      const parser = new Parser({ fields });
      const csv = parser.parse({ metadata: reportMetadata, data: reportData });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="report_${reportType}_${new Date().toISOString().split("T")[0]}.csv"`
      );
      return res.send(csv);
    } else {
      // Return JSON
      return res.json({ status: "success", data: { ...reportData, metadata: reportMetadata } });
    }
  } catch (error) {
    console.error("Error generating report:", error.message, error.stack);
    if (error.name === "CastError") {
      return res.status(400).json({ status: "error", message: "Invalid ID format in query" });
    }
    if (error.code === 17124) {
      return res.status(400).json({ status: "error", message: "Aggregation error: Invalid data structure in query" });
    }
    res.status(500).json({ status: "error", message: `Internal server error: ${error.message}` });
  }
};

/**
 * Generate comprehensive system report
 */
async function generateComprehensiveReport(
  parcelFilter,
  shipmentFilter,
  userFilter,
  paymentFilter,
  operationalFilter,
  startDate,
  endDate,
  reportPart
) {
  if (reportPart !== "all") {
    switch (reportPart) {
      case "parcels":
        return {
          parcelAnalytics: await getParcelAnalytics(parcelFilter),
          trends: await getTrendAnalysis(
            startDate,
            endDate,
            ["parcels"],
            parcelFilter
          ),
        };
      case "shipments":
        return {
          shipmentAnalytics: await getShipmentAnalytics(shipmentFilter),
          trends: await getTrendAnalysis(
            startDate,
            endDate,
            ["shipments"],
            shipmentFilter
          ),
        };
      case "users":
        return {
          userAnalytics: await getUserAnalytics(userFilter),
          trends: await getTrendAnalysis(startDate, endDate, ["users"], userFilter),
        };
      case "financial":
        return {
          financialAnalytics: await getFinancialAnalytics(paymentFilter),
          trends: await getTrendAnalysis(
            startDate,
            endDate,
            ["financial"],
            paymentFilter
          ),
        };
      case "operational":
        return {
          operationalAnalytics: await getOperationalAnalytics(operationalFilter),
          trends: await getTrendAnalysis(
            startDate,
            endDate,
            ["operational"],
            operationalFilter
          ),
        };
      case "branches":
        return {
          branchPerformance: await getBranchPerformance(parcelFilter),
          trends: await getTrendAnalysis(
            startDate,
            endDate,
            ["parcels"],
            parcelFilter
          ),
        };
    }
  }

  const [
    systemOverview,
    parcelAnalytics,
    shipmentAnalytics,
    userAnalytics,
    financialAnalytics,
    operationalAnalytics,
    branchPerformance,
  ] = await Promise.all([
    getSystemOverview(parcelFilter),
    getParcelAnalytics(parcelFilter),
    getShipmentAnalytics(shipmentFilter),
    getUserAnalytics(userFilter),
    getFinancialAnalytics(paymentFilter),
    getOperationalAnalytics(operationalFilter),
    getBranchPerformance(parcelFilter),
  ]);

  return {
    systemOverview,
    parcelAnalytics,
    shipmentAnalytics,
    userAnalytics,
    financialAnalytics,
    operationalAnalytics,
    branchPerformance,
    trends: await getTrendAnalysis(startDate, endDate, null, parcelFilter),
  };
}

/**
 * Generate parcel-focused report
 */
async function generateParcelReport(dateFilter) {
  const parcelData = await Parcel.aggregate([
    { $match: dateFilter },
    {
      $lookup: {
        from: "branches",
        localField: "from",
        foreignField: "_id",
        as: "sourceBranch",
        pipeline: [{ $project: { location: 1, contact: 1 } }],
      },
    },
    {
      $lookup: {
        from: "branches",
        localField: "to",
        foreignField: "_id",
        as: "destinationBranch",
        pipeline: [{ $project: { location: 1, contact: 1 } }],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "senderId",
        foreignField: "_id",
        as: "sender",
        pipeline: [{ $project: { email: 1, fName: 1, lName: 1 } }],
      },
    },
    {
      $lookup: {
        from: "receivers",
        localField: "receiverId",
        foreignField: "_id",
        as: "receiver",
        pipeline: [{ $project: { receiverFullName: 1, receiverContact: 1 } }],
      },
    },
  ]);

  const analytics = await getParcelAnalytics(dateFilter);

  return {
    parcels: parcelData,
    analytics,
    summary: {
      totalParcels: parcelData.length,
      averageWeight: parcelData.length
        ? parcelData.reduce((sum, p) => sum + (p.weight || 0), 0) / parcelData.length
        : 0,
      averageVolume: parcelData.length
        ? parcelData.reduce((sum, p) => sum + (p.volume || 0), 0) / parcelData.length
        : 0,
    },
    message: parcelData.length ? undefined : "No parcels found",
  };
}

/**
 * Generate shipment-focused report
 */
async function generateShipmentReport(dateFilter) {
  const shipmentData = await B2BShipment.aggregate([
    { $match: dateFilter },
    {
      $lookup: {
        from: "branches",
        localField: "sourceCenter",
        foreignField: "_id",
        as: "sourceBranch",
        pipeline: [{ $project: { location: 1, contact: 1 } }],
      },
    },
    {
      $lookup: {
        from: "vehicles",
        localField: "assignedVehicle",
        foreignField: "_id",
        as: "vehicle",
        pipeline: [{ $project: { registrationNo: 1, vehicleType: 1 } }],
      },
    },
    {
      $lookup: {
        from: "drivers",
        localField: "assignedDriver",
        foreignField: "_id",
        as: "driver",
        pipeline: [{ $project: { name: 1, contactNo: 1 } }],
      },
    },
    {
      $lookup: {
        from: "parcels",
        localField: "parcels",
        foreignField: "_id",
        as: "parcelDetails",
        pipeline: [{ $project: { trackingNo: 1, itemType: 1 } }],
      },
    },
  ]);

  const analytics = await getShipmentAnalytics(dateFilter);

  return {
    shipments: shipmentData,
    analytics,
    summary: {
      totalShipments: shipmentData.length,
      averageDistance: shipmentData.length
        ? shipmentData.reduce((sum, s) => sum + (s.totalDistance || 0), 0) / shipmentData.length
        : 0,
      averageTime: shipmentData.length
        ? shipmentData.reduce((sum, s) => sum + (s.totalTime || 0), 0) / shipmentData.length
        : 0,
    },
    message: shipmentData.length ? undefined : "No shipments found",
  };
}

/**
 * Generate user-focused report
 */
async function generateUserReport(dateFilter) {
  const [users, staff, drivers, admins] = await Promise.all([
    User.find(dateFilter).select("-password -passwordconfirm -otp -resetPasswordOTP"),
    Staff.find(dateFilter)
      .select("-password -resetPasswordToken")
      .populate("branchId", "location"),
    Driver.find(dateFilter)
      .select("-password")
      .populate("branchId", "location")
      .populate("vehicleId", "registrationNo"),
    Admin.find(dateFilter).select("-password -resetCode"),
  ]);

  const analytics = await getUserAnalytics(dateFilter);

  return {
    users: {
      customers: users,
      staff,
      drivers,
      admins,
    },
    analytics,
    summary: {
      totalUsers: users.length + staff.length + drivers.length + admins.length,
      customerCount: users.length,
      staffCount: staff.length,
      driverCount: drivers.length,
      adminCount: admins.length,
    },
    message: users.length + staff.length + drivers.length + admins.length ? undefined : "No users found",
  };
}

/**
 * Generate financial report
 */
async function generateFinancialReport(dateFilter) {
  const paymentData = await Payment.aggregate([
    { $match: dateFilter },
    {
      $lookup: {
        from: "parcels",
        localField: "parcelId",
        foreignField: "_id",
        as: "parcel",
        pipeline: [{ $project: { trackingNo: 1, from: 1 } }],
      },
    },
    {
      $unwind: { path: "$parcel", preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: "branches",
        localField: "parcel.from",
        foreignField: "_id",
        as: "sourceBranch",
        pipeline: [{ $project: { location: 1 } }],
      },
    },
  ]);

  const analytics = await getFinancialAnalytics(dateFilter);

  return {
    payments: paymentData,
    analytics,
    summary: {
      totalRevenue: paymentData.length
        ? paymentData.reduce((sum, p) => sum + (p.amount || 0), 0)
        : 0,
      totalTransactions: paymentData.length,
      averageTransactionValue: paymentData.length
        ? paymentData.reduce((sum, p) => sum + (p.amount || 0), 0) / paymentData.length
        : 0,
    },
    message: paymentData.length ? undefined : "No payments found",
  };
}

/**
 * Generate operational report
 */
async function generateOperationalReport(dateFilter) {
  const [vehicles, schedules, inquiries] = await Promise.all([
    Vehicle.find()
      .populate("assignedBranch", "location")
      .populate("currentBranch", "location"),
    VehicleSchedule.find(dateFilter)
      .populate("vehicle", "registrationNo")
      .populate("branch", "location"),
    Inquiry.find(dateFilter).populate("staffId", "name"),
  ]);

  const analytics = await getOperationalAnalytics(dateFilter);

  return {
    vehicles,
    schedules,
    inquiries,
    analytics,
    message: vehicles.length || schedules.length || inquiries.length ? undefined : "No operational data found",
  };
}

/**
 * Get system overview statistics
 */
async function getSystemOverview(dateFilter) {
  const [
    totalUsers,
    totalParcels,
    totalShipments,
    totalBranches,
    totalVehicles,
    totalStaff,
    totalDrivers,
    totalRevenue,
  ] = await Promise.all([
    User.countDocuments(dateFilter),
    Parcel.countDocuments(dateFilter),
    B2BShipment.countDocuments(dateFilter),
    Branch.countDocuments(),
    Vehicle.countDocuments(),
    Staff.countDocuments(),
    Driver.countDocuments(),
    Payment.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  return {
    totalUsers,
    totalParcels,
    totalShipments,
    totalBranches,
    totalVehicles,
    totalStaff,
    totalDrivers,
    totalRevenue: totalRevenue[0]?.total || 0,
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
        statusBreakdown: { $push: "$status" },
        deliveryTypeBreakdown: { $push: "$deliveryType" },
        submittingTypeBreakdown: { $push: "$submittingType" },
      },
    },
  ]);

  const [statusCounts, deliveryTypeCounts] = await Promise.all([
    Parcel.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Parcel.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$deliveryType", count: { $sum: 1 } } },
    ]),
  ]);

  return {
    overview: parcelStats[0] || {},
    statusBreakdown: statusCounts,
    deliveryTypeBreakdown: deliveryTypeCounts,
    message: parcelStats.length ? undefined : "No parcel analytics data",
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
        averageParcelCount: { $avg: "$parcelCount" },
      },
    },
  ]);

  const [statusCounts, deliveryTypeCounts] = await Promise.all([
    B2BShipment.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    B2BShipment.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$normalizedDeliveryType", count: { $sum: 1 } } },
    ]),
  ]);

  return {
    overview: shipmentStats[0] || {},
    statusBreakdown: statusCounts,
    deliveryTypeBreakdown: deliveryTypeCounts,
    message: shipmentStats.length ? undefined : "No shipment analytics data",
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
          unverifiedUsers: { $sum: { $cond: ["$isVerify", 0, 1] } },
        },
      },
    ]),
    Staff.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Driver.countDocuments(dateFilter),
  ]);

  return {
    userOverview: userStats[0] || {},
    staffStatusBreakdown: staffStats,
    totalDrivers: driverStats,
    message: userStats.length || staffStats.length || driverStats ? undefined : "No user analytics data",
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
        pendingPayments: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, "$amount", 0] },
        },
        paidPayments: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$amount", 0] },
        },
        averageTransactionValue: { $avg: "$amount" },
        paidTransactions: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] },
        },
        pendingTransactions: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0] },
        },
      },
    },
  ]);

  const paymentMethodBreakdown = await Payment.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: "$paymentMethod",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  return {
    overview: paymentStats[0] || {},
    paymentMethodBreakdown,
    message: paymentStats.length ? undefined : "No financial analytics data",
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
          available: { $sum: { $cond: ["$available", 1, 0] } },
        },
      },
    ]),
    VehicleSchedule.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalParcels: { $sum: { $size: { $ifNull: ["$assignedParcels", []] } } },
        },
      },
    ]),
    Inquiry.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  return {
    vehicleBreakdown: vehicleStats,
    scheduleBreakdown: scheduleStats,
    inquiryBreakdown: inquiryStats,
    message: vehicleStats.length || scheduleStats.length || inquiryStats.length
      ? undefined
      : "No operational analytics data",
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
        as: "originatingParcels",
        pipeline: [{ $match: dateFilter }, { $project: { _id: 1 } }],
      },
    },
    {
      $lookup: {
        from: "parcels",
        localField: "_id",
        foreignField: "to",
        as: "destinationParcels",
        pipeline: [{ $match: dateFilter }, { $project: { _id: 1 } }],
      },
    },
    {
      $lookup: {
        from: "staffs",
        localField: "_id",
        foreignField: "branchId",
        as: "staff",
        pipeline: [{ $project: { _id: 1 } }],
      },
    },
    {
      $lookup: {
        from: "drivers",
        localField: "_id",
        foreignField: "branchId",
        as: "drivers",
        pipeline: [{ $project: { _id: 1 } }],
      },
    },
    {
      $lookup: {
        from: "vehicles",
        localField: "_id",
        foreignField: "assignedBranch",
        as: "vehicles",
        pipeline: [{ $project: { _id: 1 } }],
      },
    },
    {
      $project: {
        branchId: 1,
        location: 1,
        contact: 1,
        originatingParcels: { $size: { $ifNull: ["$originatingParcels", []] } },
        destinationParcels: { $size: { $ifNull: ["$destinationParcels", []] } },
        staffCount: { $size: { $ifNull: ["$staff", []] } },
        driverCount: { $size: { $ifNull: ["$drivers", []] } },
        vehicleCount: { $size: { $ifNull: ["$vehicles", []] } },
        totalParcels: {
          $add: [
            { $size: { $ifNull: ["$originatingParcels", []] } },
            { $size: { $ifNull: ["$destinationParcels", []] } },
          ],
        },
      },
    },
    { $sort: { totalParcels: -1 } },
  ]);

  return {
    branchStats,
    message: branchStats.length ? undefined : "No branch performance data",
  };
}

/**
 * Get trend analysis
 */
async function getTrendAnalysis(startDate, endDate, categories = null, dateFilter = {}) {
  const trends = {};
  const baseFilter = { createdAt: { $gte: startDate, $lte: endDate }, ...dateFilter };
  const includeCategories = categories || ["parcels", "shipments", "users", "financial", "operational"];

  const pipeline = [
    { $match: baseFilter },
    {
      $facet: {
        ...(includeCategories.includes("parcels") && {
          parcels: [
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                  day: { $dayOfMonth: "$createdAt" },
                },
                count: { $sum: 1 },
                totalRevenue: { $sum: "$price" },
              },
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
          ],
        }),
        ...(includeCategories.includes("shipments") && {
          shipments: [
            { $match: baseFilter },
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
          ],
        }),
        ...(includeCategories.includes("users") && {
          users: [
            { $match: baseFilter },
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
          ],
        }),
        ...(includeCategories.includes("financial") && {
          financial: [
            { $match: baseFilter },
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                },
                totalRevenue: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
          ],
        }),
        ...(includeCategories.includes("operational") && {
          operational: [
            { $match: baseFilter },
            {
              $group: {
                _id: "$type",
                count: { $sum: 1 },
                totalParcels: { $sum: { $size: { $ifNull: ["$assignedParcels", []] } } },
              },
            },
          ],
        }),
      },
    },
  ];

  const results = await Promise.all([
    includeCategories.includes("parcels") ? Parcel.aggregate(pipeline) : [],
    includeCategories.includes("shipments") ? B2BShipment.aggregate(pipeline) : [],
    includeCategories.includes("users") ? User.aggregate(pipeline) : [],
    includeCategories.includes("financial") ? Payment.aggregate(pipeline) : [],
    includeCategories.includes("operational") ? VehicleSchedule.aggregate(pipeline) : [],
  ]);

  if (includeCategories.includes("parcels")) {
    trends.parcelTrend = {
      growth: calculateGrowthRate(results[0].parcels, "count"),
      period: `${startDate.toDateString()} to ${endDate.toDateString()}`,
    };
  }

  if (includeCategories.includes("shipments")) {
    trends.shipmentTrend = {
      growth: calculateGrowthRate(results[1].shipments, "count"),
      period: `${startDate.toDateString()} to ${endDate.toDateString()}`,
    };
  }

  if (includeCategories.includes("users")) {
    trends.userTrend = {
      growth: calculateGrowthRate(results[2].users, "count"),
      period: `${startDate.toDateString()} to ${endDate.toDateString()}`,
    };
  }

  if (includeCategories.includes("financial")) {
    trends.revenueTrend = {
      growth: calculateGrowthRate(results[3].financial, "totalRevenue"),
      period: `${startDate.toDateString()} to ${endDate.toDateString()}`,
    };
  }

  if (includeCategories.includes("operational")) {
    const vehicleTrends = await Vehicle.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const utilizationRate = vehicleTrends.find((v) => v._id === "busy")?.count || 0;
    const totalVehicles = vehicleTrends.reduce((sum, v) => sum + v.count, 0);

    trends.vehicleTrend = {
      growth: totalVehicles > 0 ? Math.round((utilizationRate / totalVehicles) * 100) : 0,
      period: "Current utilization rate",
    };
  }

  return trends;
}

/**
 * Calculate growth rate from trend data
 */
function calculateGrowthRate(trendData, field) {
  if (!trendData || trendData.length < 2) return 0;
  const firstPeriod = trendData[0][field] || 0;
  const lastPeriod = trendData[trendData.length - 1][field] || 0;
  return firstPeriod === 0 ? (lastPeriod > 0 ? 100 : 0) : Math.round(((lastPeriod - firstPeriod) / firstPeriod) * 100);
}

module.exports = {
  generateReport,
};



