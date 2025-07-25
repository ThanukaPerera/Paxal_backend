const { Parser } = require('@json2csv/plainjs');

/**
 * Professional CSV Export Service
 * Generates well-formatted CSV files from report data
 */
class CSVExportService {
  constructor() {
    this.defaultOptions = {
      header: true,
      delimiter: ',',
      quote: '"',
      escape: '"',
      excelStrings: false,
      withBOM: true
    };
  }

  /**
   * Generate comprehensive CSV report
   */
  async generateReportCSV(reportData, reportType, options = {}) {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${reportType}_report_${timestamp}.csv`;
    
    let csvContent = '';
    
    // Add report header
    csvContent += this.generateReportHeader(reportType, reportData);
    csvContent += '\n\n';
    
    // Add KPI summary
    if (reportData.kpis) {
      csvContent += this.generateKPISection(reportData.kpis);
      csvContent += '\n\n';
    }
    
    // Add detailed data sections based on what's available
    if (reportData.parcels) {
      csvContent += this.generateParcelSection(reportData.parcels);
      csvContent += '\n\n';
      
      // Add detailed parcel data if available
      if (reportData.parcels.details && reportData.parcels.details.length > 0) {
        csvContent += this.generateDetailedParcelData(reportData.parcels.details);
        csvContent += '\n\n';
      }
    }
    
    if (reportData.users) {
      csvContent += this.generateUserSection(reportData.users);
      csvContent += '\n\n';
      
      // Add detailed user data if available
      if (reportData.users.details && reportData.users.details.length > 0) {
        csvContent += this.generateDetailedUserData(reportData.users.details);
        csvContent += '\n\n';
      }
    }
    
    if (reportData.payments) {
      csvContent += this.generatePaymentSection(reportData.payments);
      csvContent += '\n\n';
      
      // Add detailed payment data if available
      if (reportData.payments.details && reportData.payments.details.length > 0) {
        csvContent += this.generateDetailedPaymentData(reportData.payments.details);
        csvContent += '\n\n';
      }
    }
    
    if (reportData.b2bShipments) {
      csvContent += this.generateShipmentSection(reportData.b2bShipments);
      csvContent += '\n\n';
      
      // Add detailed shipment data if available
      if (reportData.b2bShipments.details && reportData.b2bShipments.details.length > 0) {
        csvContent += this.generateDetailedShipmentData(reportData.b2bShipments.details);
        csvContent += '\n\n';
      }
    }
    
    if (reportData.branches) {
      csvContent += this.generateBranchSection(reportData.branches);
      csvContent += '\n\n';
      
      // Add detailed branch data if available
      if (reportData.branches.details && reportData.branches.details.length > 0) {
        csvContent += this.generateDetailedBranchData(reportData.branches.details);
        csvContent += '\n\n';
      }
    }
    
    // Handle single-section reports
    if (reportData.financial && reportData.financial.payments) {
      csvContent += this.generatePaymentSection(reportData.financial.payments);
      csvContent += '\n\n';
      
      if (reportData.financial.payments.details && reportData.financial.payments.details.length > 0) {
        csvContent += this.generateDetailedPaymentData(reportData.financial.payments.details);
        csvContent += '\n\n';
      }
    }
    
    if (reportData.shipments) {
      csvContent += this.generateShipmentSection(reportData.shipments);
      csvContent += '\n\n';
      
      if (reportData.shipments.details && reportData.shipments.details.length > 0) {
        csvContent += this.generateDetailedShipmentData(reportData.shipments.details);
        csvContent += '\n\n';
      }
    }
    
    // Add AI insights if available
    if (options.aiInsights) {
      csvContent += this.generateAIInsightsSection(options.aiInsights);
    }
    
    return {
      content: csvContent,
      filename,
      contentType: 'text/csv; charset=utf-8'
    };
  }

  /**
   * Generate report header information
   */
  generateReportHeader(reportType, reportData) {
    const header = [
      'PAXAL PARCEL MANAGEMENT SYSTEM',
      `${this.formatReportType(reportType)} Report`,
      `Generated on: ${new Date().toLocaleString()}`,
      '==================================='
    ];
    
    return header.join('\n');
  }

  /**
   * Generate KPI summary section
   */
  generateKPISection(kpis) {
    let section = 'KEY PERFORMANCE INDICATORS\n';
    section += 'Metric,Value,Format\n';
    
    const kpiData = [
      ['Total Revenue', kpis.totalRevenue || 0, 'Currency'],
      ['Total Parcels', kpis.totalParcels || 0, 'Number'],
      ['Delivery Success Rate', kpis.deliverySuccessRate || 0, 'Percentage'],
      ['Customer Satisfaction', kpis.customerSatisfaction || 0, 'Percentage'],
      ['Operational Efficiency', kpis.operationalEfficiency || 0, 'Percentage'],
      ['Customer Retention', kpis.customerRetention || 0, 'Percentage']
    ];
    
    kpiData.forEach(([metric, value, format]) => {
      const formattedValue = this.formatValue(value, format);
      section += `"${metric}","${formattedValue}","${format}"\n`;
    });
    
    return section;
  }

  /**
   * Generate parcel analysis section
   */
  generateParcelSection(parcelData) {
    let section = 'PARCEL ANALYSIS\n';
    
    // Summary metrics
    section += 'Parcel Summary\n';
    section += 'Metric,Value\n';
    section += `"Total Parcels","${parcelData.total || 0}"\n`;
    section += `"Average Weight","${(parcelData.averageWeight || 0).toFixed(2)} kg"\n`;
    section += `"Total Revenue","$${(parcelData.totalRevenue || 0).toLocaleString()}"\n`;
    section += '\n';
    
    // Status breakdown
    if (parcelData.byStatus) {
      section += 'Status Breakdown\n';
      section += 'Status,Count,Percentage\n';
      
      const total = parcelData.total || 1;
      Object.entries(parcelData.byStatus).forEach(([status, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        section += `"${this.formatStatus(status)}","${count}","${percentage}%"\n`;
      });
      section += '\n';
    }
    
    // Type breakdown
    if (parcelData.byType) {
      section += 'Type Breakdown\n';
      section += 'Type,Count,Percentage\n';
      
      const total = parcelData.total || 1;
      Object.entries(parcelData.byType).forEach(([type, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        section += `"${this.formatStatus(type)}","${count}","${percentage}%"\n`;
      });
      section += '\n';
    }
    
    // Priority breakdown
    if (parcelData.byPriority) {
      section += 'Priority Breakdown\n';
      section += 'Priority,Count,Percentage\n';
      
      const total = parcelData.total || 1;
      Object.entries(parcelData.byPriority).forEach(([priority, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        section += `"${this.formatStatus(priority)}","${count}","${percentage}%"\n`;
      });
      section += '\n';
    }
    
    // Delivery times analysis
    if (parcelData.deliveryTimes && parcelData.deliveryTimes.length > 0) {
      section += 'Delivery Performance\n';
      section += 'Metric,Value\n';
      
      const deliveryTimes = parcelData.deliveryTimes.map(d => d.days);
      const avgDeliveryTime = deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length;
      const minDeliveryTime = Math.min(...deliveryTimes);
      const maxDeliveryTime = Math.max(...deliveryTimes);
      
      section += `"Average Delivery Time","${avgDeliveryTime.toFixed(1)} days"\n`;
      section += `"Minimum Delivery Time","${minDeliveryTime} days"\n`;
      section += `"Maximum Delivery Time","${maxDeliveryTime} days"\n`;
      section += `"On-time Deliveries (<= 3 days)","${deliveryTimes.filter(t => t <= 3).length}"\n`;
    }
    
    return section;
  }

  /**
   * Generate user analysis section
   */
  generateUserSection(userData) {
    let section = 'USER ANALYSIS\n';
    section += 'Metric,Value\n';
    
    section += `"Total Users","${userData.total || 0}"\n`;
    section += `"Active Users","${userData.active || 0}"\n`;
    section += `"New Users (30 days)","${userData.newUsers || 0}"\n`;
    
    if (userData.total > 0) {
      const activityRate = ((userData.active / userData.total) * 100).toFixed(1);
      section += `"Activity Rate","${activityRate}%"\n`;
    }
    
    // Role breakdown
    if (userData.byRole) {
      section += '\nUser Roles\n';
      section += 'Role,Count,Percentage\n';
      
      const total = userData.total || 1;
      Object.entries(userData.byRole).forEach(([role, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        section += `"${this.formatStatus(role)}","${count}","${percentage}%"\n`;
      });
    }
    
    return section;
  }

  /**
   * Generate payment analysis section
   */
  generatePaymentSection(paymentData) {
    let section = 'PAYMENT ANALYSIS\n';
    section += 'Metric,Value\n';
    
    section += `"Total Payments","${paymentData.total || 0}"\n`;
    section += `"Total Amount","$${(paymentData.totalAmount || 0).toLocaleString()}"\n`;
    section += `"Average Payment","$${(paymentData.averageAmount || 0).toFixed(2)}"\n`;
    
    // Status breakdown
    if (paymentData.byStatus) {
      section += '\nPayment Status\n';
      section += 'Status,Count,Amount,Percentage\n';
      
      const total = paymentData.total || 1;
      Object.entries(paymentData.byStatus).forEach(([status, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        // Note: We don't have amount per status, so using count for now
        section += `"${this.formatStatus(status)}","${count}","N/A","${percentage}%"\n`;
      });
      section += '\n';
    }
    
    // Method breakdown
    if (paymentData.byMethod) {
      section += 'Payment Methods\n';
      section += 'Method,Count,Percentage\n';
      
      const total = paymentData.total || 1;
      Object.entries(paymentData.byMethod).forEach(([method, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        section += `"${this.formatStatus(method)}","${count}","${percentage}%"\n`;
      });
    }
    
    return section;
  }

  /**
   * Generate branch analysis section
   */
  generateBranchSection(branchData) {
    let section = 'BRANCH ANALYSIS\n';
    section += 'Summary\n';
    section += 'Metric,Value\n';
    
    section += `"Total Branches","${branchData.total || 0}"\n`;
    section += `"Active Branches","${branchData.active || 0}"\n`;
    
    // City breakdown
    if (branchData.byCity) {
      section += '\nBranches by City\n';
      section += 'City,Count,Percentage\n';
      
      const total = branchData.total || 1;
      Object.entries(branchData.byCity).forEach(([city, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        section += `"${city}","${count}","${percentage}%"\n`;
      });
      section += '\n';
    }
    
    // Branch performance
    if (branchData.performance) {
      section += 'Branch Performance\n';
      section += 'Branch,City,Parcels,Revenue,Delivery Rate,Avg Delivery Time\n';
      
      Object.entries(branchData.performance).forEach(([branchId, perf]) => {
        section += `"${perf.branchName}","${perf.city}","${perf.totalParcels}",`;
        section += `"$${perf.totalRevenue.toLocaleString()}","${perf.deliveryRate.toFixed(1)}%",`;
        section += `"${perf.averageDeliveryTime.toFixed(1)} days"\n`;
      });
    }
    
    return section;
  }

  /**
   * Generate AI insights section
   */
  generateAIInsightsSection(aiInsights) {
    let section = 'AI-POWERED INSIGHTS\n';
    
    // Executive summary
    if (aiInsights.executiveSummary) {
      section += 'Executive Summary\n';
      section += `"${aiInsights.executiveSummary.replace(/"/g, '""')}"\n\n`;
    }
    
    // Key findings
    if (aiInsights.keyFindings && aiInsights.keyFindings.length > 0) {
      section += 'Key Findings\n';
      section += 'Finding\n';
      
      aiInsights.keyFindings.forEach((finding, index) => {
        section += `"${index + 1}. ${finding.replace(/"/g, '""')}"\n`;
      });
      section += '\n';
    }
    
    // Recommendations
    if (aiInsights.recommendations && aiInsights.recommendations.length > 0) {
      section += 'AI Recommendations\n';
      section += 'Title,Priority,Category,Description,Expected Impact,Timeframe\n';
      
      aiInsights.recommendations.forEach(rec => {
        section += `"${rec.title || 'N/A'}",`;
        section += `"${rec.priority || 'Medium'}",`;
        section += `"${rec.category || 'General'}",`;
        section += `"${(rec.description || '').replace(/"/g, '""')}",`;
        section += `"${rec.expectedImpact || 'N/A'}",`;
        section += `"${rec.timeframe || 'N/A'}"\n`;
      });
      section += '\n';
    }
    
    // Performance scores
    if (aiInsights.performanceScore) {
      section += 'Performance Scores\n';
      section += 'Category,Score\n';
      
      section += `"Overall","${aiInsights.performanceScore.overall || 0}%"\n`;
      
      if (aiInsights.performanceScore.breakdown) {
        Object.entries(aiInsights.performanceScore.breakdown).forEach(([category, score]) => {
          section += `"${this.formatStatus(category)}","${score}%"\n`;
        });
      }
      section += '\n';
    }
    
    // Risk assessment
    if (aiInsights.riskAssessment) {
      section += 'Risk Assessment\n';
      section += 'Risk Level,Risk\n';
      
      if (aiInsights.riskAssessment.highRisks) {
        aiInsights.riskAssessment.highRisks.forEach(risk => {
          section += `"High","${risk.replace(/"/g, '""')}"\n`;
        });
      }
      
      if (aiInsights.riskAssessment.mediumRisks) {
        aiInsights.riskAssessment.mediumRisks.forEach(risk => {
          section += `"Medium","${risk.replace(/"/g, '""')}"\n`;
        });
      }
      section += '\n';
    }
    
    // Opportunities
    if (aiInsights.opportunities && aiInsights.opportunities.length > 0) {
      section += 'Growth Opportunities\n';
      section += 'Area,Description,Potential Impact\n';
      
      aiInsights.opportunities.forEach(opp => {
        section += `"${opp.area || 'General'}",`;
        section += `"${(opp.description || '').replace(/"/g, '""')}",`;
        section += `"${opp.potentialImpact || 'N/A'}"\n`;
      });
    }
    
    return section;
  }

  /**
   * Generate structured data CSV for specific data types
   */
  async generateDataCSV(data, dataType, fields = null) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Data must be a non-empty array');
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${dataType}_data_${timestamp}.csv`;
    
    // Auto-detect fields if not provided
    if (!fields) {
      fields = Object.keys(data[0]);
    }
    
    const parser = new Parser({ 
      fields,
      ...this.defaultOptions 
    });
    
    const csvContent = parser.parse(data);
    
    return {
      content: csvContent,
      filename,
      contentType: 'text/csv; charset=utf-8'
    };
  }

  /**
   * Helper methods
   */
  formatReportType(type) {
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1');
  }

  formatValue(value, format) {
    if (value === null || value === undefined) return 'N/A';
    
    switch (format?.toLowerCase()) {
      case 'currency':
        return `$${Number(value).toLocaleString()}`;
      case 'percentage':
        return `${Number(value).toFixed(1)}%`;
      case 'number':
        return Number(value).toLocaleString();
      default:
        return String(value);
    }
  }

  formatStatus(status) {
    return String(status)
      .split(/[-_\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Escape CSV values to prevent CSV injection
   */
  escapeCSVValue(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    
    // Remove potentially dangerous characters
    value = value.replace(/[=+\-@]/g, '');
    
    // Escape quotes
    value = value.replace(/"/g, '""');
    
    return value;
  }

  /**
   * Generate detailed parcel data section
   */
  generateDetailedParcelData(parcels) {
    let section = 'DETAILED PARCEL DATA\n';
    section += 'Tracking Number,Status,Sender Name,Sender Email,Receiver Name,Receiver Email,From Branch,To Branch,Item Type,Item Weight,Item Size,Total Amount,Shipping Method,Created Date,Delivery Date,Days to Deliver\n';
    
    parcels.forEach(parcel => {
      const senderName = parcel.senderId ? `${parcel.senderId.firstName || ''} ${parcel.senderId.lastName || ''}`.trim() : 'N/A';
      const senderEmail = parcel.senderId?.email || 'N/A';
      const receiverName = parcel.receiverId ? `${parcel.receiverId.firstName || ''} ${parcel.receiverId.lastName || ''}`.trim() : 'N/A';
      const receiverEmail = parcel.receiverId?.email || 'N/A';
      const fromBranch = parcel.from?.branchName || 'N/A';
      const toBranch = parcel.to?.branchName || 'N/A';
      const createdDate = parcel.createdAt ? new Date(parcel.createdAt).toLocaleDateString() : 'N/A';
      const deliveryDate = parcel.parcelDeliveredDate ? new Date(parcel.parcelDeliveredDate).toLocaleDateString() : 'N/A';
      const daysToDeliver = (parcel.parcelDeliveredDate && parcel.createdAt) 
        ? Math.ceil((new Date(parcel.parcelDeliveredDate) - new Date(parcel.createdAt)) / (1000 * 60 * 60 * 24))
        : 'N/A';
      
      section += `"${parcel.trackingNumber || 'N/A'}","${parcel.status || 'N/A'}","${senderName}","${senderEmail}","${receiverName}","${receiverEmail}","${fromBranch}","${toBranch}","${parcel.itemType || 'N/A'}","${parcel.itemWeight || 'N/A'}","${parcel.itemSize || 'N/A'}","${parcel.totalAmount || 'N/A'}","${parcel.shippingMethod || 'N/A'}","${createdDate}","${deliveryDate}","${daysToDeliver}"\n`;
    });
    
    return section;
  }

  /**
   * Generate detailed user data section
   */
  generateDetailedUserData(users) {
    let section = 'DETAILED USER DATA\n';
    section += 'First Name,Last Name,Email,Phone,Role,Status,Verified,Created Date,Last Login,Address\n';
    
    users.forEach(user => {
      const createdDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
      const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A';
      const address = user.address ? `${user.address.street || ''}, ${user.address.city || ''}, ${user.address.state || ''} ${user.address.zipCode || ''}`.trim() : 'N/A';
      
      section += `"${user.firstName || 'N/A'}","${user.lastName || 'N/A'}","${user.email || 'N/A'}","${user.phone || 'N/A'}","${user.role || 'N/A'}","${user.status || 'N/A'}","${user.isVerify ? 'Yes' : 'No'}","${createdDate}","${lastLogin}","${address}"\n`;
    });
    
    return section;
  }

  /**
   * Generate detailed payment data section
   */
  generateDetailedPaymentData(payments) {
    let section = 'DETAILED PAYMENT DATA\n';
    section += 'Payment ID,Amount,Payment Method,Payment Status,Parcel Tracking,Payer Name,Payer Email,Created Date,Updated Date\n';
    
    payments.forEach(payment => {
      const payerName = payment.paidBy ? `${payment.paidBy.firstName || ''} ${payment.paidBy.lastName || ''}`.trim() : 'N/A';
      const payerEmail = payment.paidBy?.email || 'N/A';
      const parcelTracking = payment.parcelId?.trackingNumber || 'N/A';
      const createdDate = payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A';
      const updatedDate = payment.updatedAt ? new Date(payment.updatedAt).toLocaleDateString() : 'N/A';
      
      section += `"${payment._id || 'N/A'}","${payment.amount || 'N/A'}","${payment.paymentMethod || 'N/A'}","${payment.paymentStatus || 'N/A'}","${parcelTracking}","${payerName}","${payerEmail}","${createdDate}","${updatedDate}"\n`;
    });
    
    return section;
  }

  /**
   * Generate detailed shipment data section
   */
  generateDetailedShipmentData(shipments) {
    let section = 'DETAILED SHIPMENT DATA\n';
    section += 'Shipment ID,Status,Source Center,Destination Center,Vehicle Number,Driver Name,Total Amount,Total Weight,Total Volume,Created Date,Estimated Delivery\n';
    
    shipments.forEach(shipment => {
      const sourceCenter = shipment.sourceCenter?.branchName || 'N/A';
      const destinationCenter = shipment.destinationCenter?.branchName || 'N/A';
      const vehicleNumber = shipment.assignedVehicle?.vehicleNumber || 'N/A';
      const driverName = shipment.assignedDriver ? `${shipment.assignedDriver.firstName || ''} ${shipment.assignedDriver.lastName || ''}`.trim() : 'N/A';
      const createdDate = shipment.createdAt ? new Date(shipment.createdAt).toLocaleDateString() : 'N/A';
      const estimatedDelivery = shipment.estimatedDeliveryDate ? new Date(shipment.estimatedDeliveryDate).toLocaleDateString() : 'N/A';
      
      section += `"${shipment._id || 'N/A'}","${shipment.status || 'N/A'}","${sourceCenter}","${destinationCenter}","${vehicleNumber}","${driverName}","${shipment.totalAmount || 'N/A'}","${shipment.totalWeight || 'N/A'}","${shipment.totalVolume || 'N/A'}","${createdDate}","${estimatedDelivery}"\n`;
    });
    
    return section;
  }

  /**
   * Generate detailed branch data section
   */
  generateDetailedBranchData(branches) {
    let section = 'DETAILED BRANCH DATA\n';
    section += 'Branch Name,Location,City,State,Phone,Email,Manager,Status,Created Date,Total Staff\n';
    
    branches.forEach(branch => {
      const createdDate = branch.createdAt ? new Date(branch.createdAt).toLocaleDateString() : 'N/A';
      const location = `${branch.address || ''}, ${branch.city || ''}, ${branch.state || ''}`.trim();
      
      section += `"${branch.branchName || 'N/A'}","${location}","${branch.city || 'N/A'}","${branch.state || 'N/A'}","${branch.phone || 'N/A'}","${branch.email || 'N/A'}","${branch.manager || 'N/A'}","${branch.isActive ? 'Active' : 'Inactive'}","${createdDate}","${branch.totalStaff || 'N/A'}"\n`;
    });
    
    return section;
  }

  /**
   * Generate shipment section (for backward compatibility)
   */
  generateShipmentSection(shipmentData) {
    let section = 'SHIPMENT ANALYSIS\n';
    section += 'Metric,Value\n';
    
    section += `"Total Shipments","${shipmentData.total || 0}"\n`;
    section += `"Total Value","$${(shipmentData.totalValue || 0).toLocaleString()}"\n`;
    
    // Status breakdown
    if (shipmentData.byStatus) {
      section += '\nShipment Status Breakdown\n';
      section += 'Status,Count,Percentage\n';
      
      const total = shipmentData.total || 1;
      Object.entries(shipmentData.byStatus).forEach(([status, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        section += `"${this.formatStatus(status)}","${count}","${percentage}%"\n`;
      });
    }
    
    return section;
  }
}

module.exports = CSVExportService;
