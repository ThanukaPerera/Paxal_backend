const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Professional PDF Export Service
 * Generates beautiful, branded PDF reports from data
 */
class PDFExportService {
  constructor() {
    this.colors = {
      primary: '#1f2937',      // Dark gray
      secondary: '#374151',    // Medium gray
      accent: '#3b82f6',       // Blue
      success: '#10b981',      // Green
      warning: '#f59e0b',      // Yellow
      danger: '#ef4444',       // Red
      light: '#f8fafc',        // Light gray
      white: '#ffffff'
    };
    
    this.fonts = {
      regular: 'Helvetica',
      bold: 'Helvetica-Bold',
      italic: 'Helvetica-Oblique',
      boldItalic: 'Helvetica-BoldOblique'
    };
  }

  /**
   * Generate a comprehensive report PDF
   */
  async generateReportPDF(reportData, reportType, options = {}) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    // Set up the document
    const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`;
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    
    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        resolve({
          buffer: result,
          filename,
          contentType: 'application/pdf'
        });
      });

      doc.on('error', reject);

      try {
        this.createReportContent(doc, reportData, reportType, options);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create the main report content
   */
  createReportContent(doc, reportData, reportType, options) {
    let yPosition = 50;

    // Header
    yPosition = this.addHeader(doc, reportType, yPosition);
    yPosition += 20;

    // Executive Summary
    if (reportData.executiveSummary) {
      yPosition = this.addExecutiveSummary(doc, reportData.executiveSummary, yPosition);
      yPosition += 20;
    }

    // KPI Cards
    if (reportData.kpis) {
      yPosition = this.addKPISection(doc, reportData.kpis, yPosition);
      yPosition += 20;
    }

    // Data Tables
    if (reportData.parcels) {
      yPosition = this.addParcelAnalysis(doc, reportData.parcels, yPosition);
      yPosition += 20;
    }

    if (reportData.users) {
      yPosition = this.addUserAnalysis(doc, reportData.users, yPosition);
      yPosition += 20;
    }

    if (reportData.payments) {
      yPosition = this.addPaymentAnalysis(doc, reportData.payments, yPosition);
      yPosition += 20;
    }

    // AI Insights
    if (options.aiInsights) {
      yPosition = this.addAIInsights(doc, options.aiInsights, yPosition);
    }

    // Footer
    this.addFooter(doc);
  }

  /**
   * Add professional header with branding
   */
  addHeader(doc, reportType, yPosition) {
    const pageWidth = doc.page.width - 100;
    
    // Company branding area
    doc.rect(50, yPosition, pageWidth, 80)
       .fill(this.colors.primary);
    
    // Company name
    doc.fillColor(this.colors.white)
       .font(this.fonts.bold)
       .fontSize(24)
       .text('PAXAL PMS', 70, yPosition + 20);
    
    // Report title
    doc.fontSize(16)
       .text(`${this.formatReportType(reportType)} Report`, 70, yPosition + 50);
    
    // Date and time
    doc.font(this.fonts.regular)
       .fontSize(10)
       .fillColor(this.colors.light)
       .text(`Generated on ${new Date().toLocaleString()}`, pageWidth - 150, yPosition + 25);
    
    return yPosition + 100;
  }

  /**
   * Add executive summary section
   */
  addExecutiveSummary(doc, summary, yPosition) {
    doc.fillColor(this.colors.primary)
       .font(this.fonts.bold)
       .fontSize(16)
       .text('Executive Summary', 50, yPosition);
    
    yPosition += 25;
    
    doc.fillColor(this.colors.secondary)
       .font(this.fonts.regular)
       .fontSize(11)
       .text(summary, 50, yPosition, { width: 500, align: 'justify' });
    
    return yPosition + 60;
  }

  /**
   * Add KPI metrics section
   */
  addKPISection(doc, kpis, yPosition) {
    doc.fillColor(this.colors.primary)
       .font(this.fonts.bold)
       .fontSize(16)
       .text('Key Performance Indicators', 50, yPosition);
    
    yPosition += 30;
    
    const kpiBoxes = [
      { label: 'Total Revenue', value: kpis.totalRevenue, format: 'currency' },
      { label: 'Total Parcels', value: kpis.totalParcels, format: 'number' },
      { label: 'Delivery Success Rate', value: kpis.deliverySuccessRate, format: 'percentage' },
      { label: 'Customer Satisfaction', value: kpis.customerSatisfaction, format: 'percentage' }
    ];
    
    const boxWidth = 120;
    const boxHeight = 60;
    let xPosition = 50;
    
    kpiBoxes.forEach((kpi, index) => {
      if (index > 0 && index % 4 === 0) {
        yPosition += boxHeight + 10;
        xPosition = 50;
      }
      
      // KPI box background
      doc.rect(xPosition, yPosition, boxWidth, boxHeight)
         .fill(this.colors.light)
         .stroke(this.colors.accent);
      
      // KPI value
      doc.fillColor(this.colors.accent)
         .font(this.fonts.bold)
         .fontSize(18)
         .text(this.formatValue(kpi.value, kpi.format), 
               xPosition + 10, yPosition + 15, 
               { width: boxWidth - 20, align: 'center' });
      
      // KPI label
      doc.fillColor(this.colors.secondary)
         .font(this.fonts.regular)
         .fontSize(9)
         .text(kpi.label, 
               xPosition + 10, yPosition + 40, 
               { width: boxWidth - 20, align: 'center' });
      
      xPosition += boxWidth + 10;
    });
    
    return yPosition + boxHeight + 20;
  }

  /**
   * Add parcel analysis section
   */
  addParcelAnalysis(doc, parcelData, yPosition) {
    if (yPosition > 700) {
      doc.addPage();
      yPosition = 50;
    }

    doc.fillColor(this.colors.primary)
       .font(this.fonts.bold)
       .fontSize(16)
       .text('Parcel Analysis', 50, yPosition);
    
    yPosition += 30;
    
    // Create table data
    const tableData = [
      ['Metric', 'Value', 'Details'],
      ['Total Parcels', parcelData.total?.toLocaleString() || '0', 'All parcels in system'],
      ['Average Weight', `${parcelData.averageWeight?.toFixed(2) || '0'} kg`, 'Per parcel average'],
      ['Total Revenue', `$${parcelData.totalRevenue?.toLocaleString() || '0'}`, 'From all parcels'],
      ['Delivery Rate', `${this.calculateDeliveryRate(parcelData)}%`, 'Successfully delivered']
    ];
    
    yPosition = this.addTable(doc, tableData, yPosition);
    
    // Status breakdown
    if (parcelData.byStatus) {
      yPosition += 20;
      doc.fillColor(this.colors.primary)
         .font(this.fonts.bold)
         .fontSize(14)
         .text('Status Breakdown', 50, yPosition);
      
      yPosition += 20;
      
      Object.entries(parcelData.byStatus).forEach(([status, count]) => {
        doc.fillColor(this.colors.secondary)
           .font(this.fonts.regular)
           .fontSize(11)
           .text(`${this.formatStatus(status)}: ${count} parcels`, 70, yPosition);
        yPosition += 15;
      });
    }
    
    return yPosition + 10;
  }

  /**
   * Add user analysis section
   */
  addUserAnalysis(doc, userData, yPosition) {
    if (yPosition > 650) {
      doc.addPage();
      yPosition = 50;
    }

    doc.fillColor(this.colors.primary)
       .font(this.fonts.bold)
       .fontSize(16)
       .text('User Analysis', 50, yPosition);
    
    yPosition += 30;
    
    const tableData = [
      ['Metric', 'Value', 'Details'],
      ['Total Users', userData.total?.toLocaleString() || '0', 'Registered users'],
      ['Active Users', userData.active?.toLocaleString() || '0', 'Currently active'],
      ['New Users (30d)', userData.newUsers?.toLocaleString() || '0', 'Recent registrations'],
      ['Activity Rate', `${((userData.active / userData.total) * 100).toFixed(1)}%`, 'Active vs total']
    ];
    
    return this.addTable(doc, tableData, yPosition);
  }

  /**
   * Add payment analysis section
   */
  addPaymentAnalysis(doc, paymentData, yPosition) {
    if (yPosition > 650) {
      doc.addPage();
      yPosition = 50;
    }

    doc.fillColor(this.colors.primary)
       .font(this.fonts.bold)
       .fontSize(16)
       .text('Payment Analysis', 50, yPosition);
    
    yPosition += 30;
    
    const tableData = [
      ['Metric', 'Value', 'Details'],
      ['Total Payments', paymentData.total?.toLocaleString() || '0', 'All payment records'],
      ['Total Amount', `$${paymentData.totalAmount?.toLocaleString() || '0'}`, 'Revenue generated'],
      ['Average Payment', `$${paymentData.averageAmount?.toFixed(2) || '0'}`, 'Per transaction'],
      ['Success Rate', this.calculatePaymentSuccessRate(paymentData), 'Completed payments']
    ];
    
    return this.addTable(doc, tableData, yPosition);
  }

  /**
   * Add AI insights section
   */
  addAIInsights(doc, aiInsights, yPosition) {
    if (yPosition > 600) {
      doc.addPage();
      yPosition = 50;
    }

    doc.fillColor(this.colors.primary)
       .font(this.fonts.bold)
       .fontSize(16)
       .text('AI-Powered Insights', 50, yPosition);
    
    yPosition += 30;
    
    // Executive Summary
    if (aiInsights.executiveSummary) {
      doc.fillColor(this.colors.secondary)
         .font(this.fonts.regular)
         .fontSize(11)
         .text(aiInsights.executiveSummary, 50, yPosition, { width: 500 });
      yPosition += 40;
    }
    
    // Key Findings
    if (aiInsights.keyFindings?.length > 0) {
      doc.fillColor(this.colors.primary)
         .font(this.fonts.bold)
         .fontSize(14)
         .text('Key Findings', 50, yPosition);
      yPosition += 20;
      
      aiInsights.keyFindings.forEach((finding, index) => {
        doc.fillColor(this.colors.secondary)
           .font(this.fonts.regular)
           .fontSize(10)
           .text(`${index + 1}. ${finding}`, 70, yPosition, { width: 470 });
        yPosition += 25;
      });
      yPosition += 10;
    }
    
    // Recommendations
    if (aiInsights.recommendations?.length > 0) {
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }
      
      doc.fillColor(this.colors.primary)
         .font(this.fonts.bold)
         .fontSize(14)
         .text('AI Recommendations', 50, yPosition);
      yPosition += 20;
      
      aiInsights.recommendations.slice(0, 3).forEach((rec, index) => {
        // Recommendation box
        doc.rect(50, yPosition, 500, 60)
           .fill(this.colors.light)
           .stroke(this.colors.accent);
        
        // Priority badge
        const priorityColor = rec.priority === 'High' ? this.colors.danger : 
                             rec.priority === 'Medium' ? this.colors.warning : this.colors.success;
        
        doc.rect(450, yPosition + 5, 40, 15)
           .fill(priorityColor);
        
        doc.fillColor(this.colors.white)
           .font(this.fonts.bold)
           .fontSize(8)
           .text(rec.priority, 455, yPosition + 8);
        
        // Title
        doc.fillColor(this.colors.primary)
           .font(this.fonts.bold)
           .fontSize(12)
           .text(rec.title, 60, yPosition + 10);
        
        // Description
        doc.fillColor(this.colors.secondary)
           .font(this.fonts.regular)
           .fontSize(9)
           .text(rec.description, 60, yPosition + 25, { width: 380 });
        
        // Impact
        doc.fillColor(this.colors.accent)
           .fontSize(8)
           .text(`Expected Impact: ${rec.expectedImpact}`, 60, yPosition + 45);
        
        yPosition += 70;
      });
    }
    
    return yPosition;
  }

  /**
   * Add a data table
   */
  addTable(doc, tableData, yPosition) {
    const startY = yPosition;
    const tableWidth = 500;
    const columnWidth = tableWidth / tableData[0].length;
    const rowHeight = 25;
    
    // Draw table
    tableData.forEach((row, rowIndex) => {
      const currentY = startY + (rowIndex * rowHeight);
      
      row.forEach((cell, cellIndex) => {
        const currentX = 50 + (cellIndex * columnWidth);
        
        // Cell background
        if (rowIndex === 0) {
          doc.rect(currentX, currentY, columnWidth, rowHeight)
             .fill(this.colors.accent);
        } else {
          doc.rect(currentX, currentY, columnWidth, rowHeight)
             .stroke(this.colors.secondary);
        }
        
        // Cell text
        const textColor = rowIndex === 0 ? this.colors.white : this.colors.secondary;
        const fontType = rowIndex === 0 ? this.fonts.bold : this.fonts.regular;
        
        doc.fillColor(textColor)
           .font(fontType)
           .fontSize(9)
           .text(cell, currentX + 5, currentY + 8, { 
             width: columnWidth - 10, 
             height: rowHeight - 6 
           });
      });
    });
    
    return startY + (tableData.length * rowHeight) + 10;
  }

  /**
   * Add footer with page numbers and branding
   */
  addFooter(doc) {
    const pages = doc.bufferedPageRange();
    
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      
      // Footer line
      doc.moveTo(50, doc.page.height - 50)
         .lineTo(doc.page.width - 50, doc.page.height - 50)
         .stroke(this.colors.secondary);
      
      // Footer text
      doc.fillColor(this.colors.secondary)
         .font(this.fonts.regular)
         .fontSize(8)
         .text('PAXAL Parcel Management System - Confidential Report', 
               50, doc.page.height - 40);
      
      // Page number
      doc.text(`Page ${i + 1} of ${pages.count}`, 
               doc.page.width - 100, doc.page.height - 40);
    }
  }

  /**
   * Helper methods
   */
  formatReportType(type) {
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1');
  }

  formatValue(value, format) {
    if (value === null || value === undefined) return 'N/A';
    
    switch (format) {
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
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  calculateDeliveryRate(parcelData) {
    if (!parcelData.byStatus || !parcelData.total) return '0.0';
    const delivered = parcelData.byStatus.delivered || 0;
    return ((delivered / parcelData.total) * 100).toFixed(1);
  }

  calculatePaymentSuccessRate(paymentData) {
    if (!paymentData.byStatus || !paymentData.total) return 'N/A';
    const completed = paymentData.byStatus.completed || 0;
    return `${((completed / paymentData.total) * 100).toFixed(1)}%`;
  }
}

module.exports = PDFExportService;
