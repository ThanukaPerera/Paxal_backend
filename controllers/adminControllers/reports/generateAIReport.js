const { generateReport } = require("./generateReport");

/**
 * Generate AI-powered insights and recommendations for the report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateAIReport = async (req, res) => {
  try {
    // First generate the regular report data
    const reportReq = { ...req };
    const reportRes = {
      status: (code) => ({ json: (data) => ({ statusCode: code, data }) }),
      json: (data) => data
    };

    // Get the base report data
    const baseReport = await new Promise((resolve) => {
      const mockRes = {
        status: () => ({
          json: (data) => resolve(data)
        }),
        json: (data) => resolve(data)
      };
      generateReport(reportReq, mockRes);
    });

    if (baseReport.status !== "success") {
      return res.status(400).json(baseReport);
    }

    // Generate AI insights
    const aiInsights = await generateAIInsights(baseReport.data);

    const response = {
      status: "success",
      message: "AI-powered report generated successfully",
      metadata: {
        ...baseReport.metadata,
        aiPowered: true,
        insightsGenerated: new Date()
      },
      data: {
        ...baseReport.data,
        aiInsights
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error("Error generating AI report:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong"
    });
  }
};

/**
 * Generate AI insights based on report data
 */
async function generateAIInsights(reportData) {
  try {
    const insights = {
      performanceAnalysis: await analyzePerformance(reportData),
      recommendations: await generateRecommendations(reportData),
      trends: await analyzeTrends(reportData),
      riskAssessment: await assessRisks(reportData),
      opportunities: await identifyOpportunities(reportData)
    };

    return insights;
  } catch (error) {
    console.error("Error generating AI insights:", error);
    return {
      performanceAnalysis: "Unable to generate performance analysis",
      recommendations: ["Unable to generate recommendations"],
      trends: "Unable to analyze trends",
      riskAssessment: "Unable to assess risks",
      opportunities: ["Unable to identify opportunities"]
    };
  }
}

/**
 * Analyze performance metrics
 */
async function analyzePerformance(reportData) {
  const analysis = {
    overallScore: 0,
    strengths: [],
    weaknesses: [],
    kpiAnalysis: {}
  };

  try {
    // Parcel performance analysis
    if (reportData.parcelAnalytics) {
      const parcelData = reportData.parcelAnalytics.overview;
      
      // Calculate delivery success rate
      const statusBreakdown = reportData.parcelAnalytics.statusBreakdown || [];
      const totalParcels = statusBreakdown.reduce((sum, item) => sum + item.count, 0);
      const deliveredParcels = statusBreakdown.find(item => item._id === "Delivered")?.count || 0;
      const deliveryRate = totalParcels > 0 ? (deliveredParcels / totalParcels) * 100 : 0;

      analysis.kpiAnalysis.deliverySuccessRate = {
        value: deliveryRate.toFixed(2),
        status: deliveryRate >= 90 ? "excellent" : deliveryRate >= 80 ? "good" : deliveryRate >= 70 ? "average" : "poor",
        benchmark: "90%"
      };

      if (deliveryRate >= 90) {
        analysis.strengths.push("Excellent delivery success rate");
      } else if (deliveryRate < 70) {
        analysis.weaknesses.push("Low delivery success rate needs improvement");
      }
    }

    // Financial performance analysis
    if (reportData.financialAnalytics) {
      const financialData = reportData.financialAnalytics.overview;
      const totalRevenue = financialData.totalRevenue || 0;
      const averageTransaction = financialData.averageTransactionValue || 0;
      const paidTransactions = financialData.paidTransactions || 0;
      const totalTransactions = financialData.totalTransactions || 0;
      const paymentSuccessRate = totalTransactions > 0 ? (paidTransactions / totalTransactions) * 100 : 0;

      analysis.kpiAnalysis.paymentSuccessRate = {
        value: paymentSuccessRate.toFixed(2),
        status: paymentSuccessRate >= 95 ? "excellent" : paymentSuccessRate >= 85 ? "good" : "needs improvement",
        benchmark: "95%"
      };

      analysis.kpiAnalysis.averageTransactionValue = {
        value: averageTransaction.toFixed(2),
        status: averageTransaction >= 1000 ? "high" : averageTransaction >= 500 ? "medium" : "low"
      };

      if (paymentSuccessRate >= 95) {
        analysis.strengths.push("High payment success rate");
      } else {
        analysis.weaknesses.push("Payment collection needs improvement");
      }
    }

    // Operational efficiency analysis
    if (reportData.operationalAnalytics) {
      const vehicleData = reportData.operationalAnalytics.vehicleBreakdown || [];
      const totalVehicles = vehicleData.reduce((sum, item) => sum + item.count, 0);
      const availableVehicles = vehicleData.reduce((sum, item) => sum + item.available, 0);
      const utilizationRate = totalVehicles > 0 ? (availableVehicles / totalVehicles) * 100 : 0;

      analysis.kpiAnalysis.vehicleUtilization = {
        value: utilizationRate.toFixed(2),
        status: utilizationRate >= 80 ? "good" : utilizationRate >= 60 ? "average" : "poor",
        benchmark: "80%"
      };
    }

    // Calculate overall performance score
    const scores = Object.values(analysis.kpiAnalysis).map(kpi => {
      switch (kpi.status) {
        case "excellent": return 100;
        case "good": return 80;
        case "average": return 60;
        case "medium": return 60;
        default: return 40;
      }
    });

    analysis.overallScore = scores.length > 0 ? 
      Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;

    return analysis;
  } catch (error) {
    console.error("Error in performance analysis:", error);
    return analysis;
  }
}

/**
 * Generate recommendations based on data
 */
async function generateRecommendations(reportData) {
  const recommendations = [];

  try {
    // Parcel-based recommendations
    if (reportData.parcelAnalytics) {
      const statusBreakdown = reportData.parcelAnalytics.statusBreakdown || [];
      const pendingParcels = statusBreakdown.find(item => item._id === "OrderPlaced")?.count || 0;
      const inTransitParcels = statusBreakdown.find(item => item._id === "InTransit")?.count || 0;
      
      if (pendingParcels > inTransitParcels * 2) {
        recommendations.push({
          category: "Operations",
          priority: "High",
          title: "Reduce Parcel Processing Backlog",
          description: "High number of pending parcels detected. Consider increasing processing capacity or improving workflow efficiency.",
          impact: "Improved customer satisfaction and delivery times"
        });
      }

      const returnedParcels = statusBreakdown.find(item => item._id === "Return")?.count || 0;
      const totalParcels = statusBreakdown.reduce((sum, item) => sum + item.count, 0);
      const returnRate = totalParcels > 0 ? (returnedParcels / totalParcels) * 100 : 0;

      if (returnRate > 5) {
        recommendations.push({
          category: "Quality",
          priority: "Medium",
          title: "Investigate High Return Rate",
          description: `Return rate of ${returnRate.toFixed(1)}% is above optimal threshold. Review delivery processes and customer communication.`,
          impact: "Reduced costs and improved customer experience"
        });
      }
    }

    // Financial recommendations
    if (reportData.financialAnalytics) {
      const paymentMethods = reportData.financialAnalytics.paymentMethodBreakdown || [];
      const codPayments = paymentMethods.find(pm => pm._id === "COD")?.count || 0;
      const totalPayments = paymentMethods.reduce((sum, pm) => sum + pm.count, 0);
      const codRate = totalPayments > 0 ? (codPayments / totalPayments) * 100 : 0;

      if (codRate > 60) {
        recommendations.push({
          category: "Finance",
          priority: "Medium",
          title: "Promote Online Payment Methods",
          description: `${codRate.toFixed(1)}% of payments are COD. Incentivize online payments to improve cash flow and reduce collection costs.`,
          impact: "Better cash flow and reduced operational costs"
        });
      }
    }

    // Operational recommendations
    if (reportData.operationalAnalytics) {
      const inquiryBreakdown = reportData.operationalAnalytics.inquiryBreakdown || [];
      const newInquiries = inquiryBreakdown.find(item => item._id === "new")?.count || 0;
      const solvedInquiries = inquiryBreakdown.find(item => item._id === "solved")?.count || 0;
      
      if (newInquiries > solvedInquiries) {
        recommendations.push({
          category: "Customer Service",
          priority: "High",
          title: "Address Customer Inquiry Backlog",
          description: "Number of unresolved inquiries is increasing. Consider adding customer service staff or improving response processes.",
          impact: "Improved customer satisfaction and retention"
        });
      }
    }

    // Branch performance recommendations
    if (reportData.branchPerformance) {
      const branches = reportData.branchPerformance || [];
      if (branches.length > 0) {
        const topBranch = branches[0];
        const bottomBranch = branches[branches.length - 1];
        
        if (topBranch.totalParcels > bottomBranch.totalParcels * 3) {
          recommendations.push({
            category: "Branch Management",
            priority: "Medium",
            title: "Balance Branch Workload",
            description: `Significant performance gap between branches. Consider redistributing resources or implementing best practices from ${topBranch.location}.`,
            impact: "More efficient resource utilization across branches"
          });
        }
      }
    }

    // If no specific recommendations, add general ones
    if (recommendations.length === 0) {
      recommendations.push({
        category: "General",
        priority: "Low",
        title: "Continue Monitoring Performance",
        description: "System is performing well. Continue regular monitoring and maintain current service levels.",
        impact: "Sustained operational excellence"
      });
    }

    return recommendations;
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return [{
      category: "System",
      priority: "Low",
      title: "Data Analysis Error",
      description: "Unable to generate specific recommendations due to data processing issues.",
      impact: "Manual review recommended"
    }];
  }
}

/**
 * Analyze trends in the data
 */
async function analyzeTrends(reportData) {
  try {
    const trends = {
      parcelTrends: "Stable",
      revenueTrends: "Growing",
      operationalTrends: "Improving",
      seasonalPatterns: []
    };

    // Analyze parcel trends
    if (reportData.trends && reportData.trends.parcelTrends) {
      const parcelData = reportData.trends.parcelTrends;
      if (parcelData.length > 1) {
        const firstPeriod = parcelData[0].count;
        const lastPeriod = parcelData[parcelData.length - 1].count;
        const growth = ((lastPeriod - firstPeriod) / firstPeriod) * 100;

        if (growth > 10) {
          trends.parcelTrends = "Growing strongly";
        } else if (growth > 0) {
          trends.parcelTrends = "Growing";
        } else if (growth > -10) {
          trends.parcelTrends = "Stable";
        } else {
          trends.parcelTrends = "Declining";
        }
      }
    }

    // Analyze revenue trends
    if (reportData.financialAnalytics) {
      const revenue = reportData.financialAnalytics.overview.totalRevenue || 0;
      trends.revenueTrends = revenue > 100000 ? "Strong" : revenue > 50000 ? "Growing" : "Moderate";
    }

    return trends;
  } catch (error) {
    console.error("Error analyzing trends:", error);
    return {
      parcelTrends: "Unable to analyze",
      revenueTrends: "Unable to analyze",
      operationalTrends: "Unable to analyze",
      seasonalPatterns: []
    };
  }
}

/**
 * Assess operational risks
 */
async function assessRisks(reportData) {
  const risks = [];

  try {
    // Vehicle availability risk
    if (reportData.operationalAnalytics) {
      const vehicleData = reportData.operationalAnalytics.vehicleBreakdown || [];
      const totalVehicles = vehicleData.reduce((sum, item) => sum + item.count, 0);
      const availableVehicles = vehicleData.reduce((sum, item) => sum + item.available, 0);
      
      if (totalVehicles > 0 && (availableVehicles / totalVehicles) < 0.3) {
        risks.push({
          category: "Operational",
          level: "High",
          description: "Low vehicle availability may impact delivery capacity",
          mitigation: "Consider maintenance scheduling or fleet expansion"
        });
      }
    }

    // Payment collection risk
    if (reportData.financialAnalytics) {
      const financialData = reportData.financialAnalytics.overview;
      const pendingTransactions = financialData.pendingTransactions || 0;
      const totalTransactions = financialData.totalTransactions || 0;
      
      if (totalTransactions > 0 && (pendingTransactions / totalTransactions) > 0.2) {
        risks.push({
          category: "Financial",
          level: "Medium",
          description: "High percentage of pending payments affects cash flow",
          mitigation: "Implement automated payment reminders and collection procedures"
        });
      }
    }

    return risks;
  } catch (error) {
    console.error("Error assessing risks:", error);
    return [{
      category: "System",
      level: "Low",
      description: "Unable to assess risks due to data processing issues",
      mitigation: "Manual risk assessment recommended"
    }];
  }
}

/**
 * Identify growth opportunities
 */
async function identifyOpportunities(reportData) {
  const opportunities = [];

  try {
    // Branch expansion opportunities
    if (reportData.branchPerformance) {
      const branches = reportData.branchPerformance || [];
      const highPerformingBranches = branches.filter(branch => branch.totalParcels > 100);
      
      if (highPerformingBranches.length > 0) {
        opportunities.push({
          category: "Expansion",
          title: "Branch Network Expansion",
          description: "High-performing branches indicate potential for expansion in similar markets",
          potential: "High",
          timeframe: "6-12 months"
        });
      }
    }

    // Service optimization opportunities
    if (reportData.parcelAnalytics) {
      const deliveryTypes = reportData.parcelAnalytics.deliveryTypeBreakdown || [];
      const expressDeliveries = deliveryTypes.find(dt => dt._id === "Express")?.count || 0;
      const standardDeliveries = deliveryTypes.find(dt => dt._id === "Standard")?.count || 0;
      
      if (expressDeliveries > standardDeliveries) {
        opportunities.push({
          category: "Service",
          title: "Premium Service Expansion",
          description: "High demand for express delivery suggests opportunity for premium service tiers",
          potential: "Medium",
          timeframe: "3-6 months"
        });
      }
    }

    // Technology opportunities
    opportunities.push({
      category: "Technology",
      title: "Automation Implementation",
      description: "Consider implementing automated sorting and tracking systems for improved efficiency",
      potential: "High",
      timeframe: "12-18 months"
    });

    return opportunities;
  } catch (error) {
    console.error("Error identifying opportunities:", error);
    return [{
      category: "Analysis",
      title: "Manual Opportunity Assessment",
      description: "Unable to automatically identify opportunities. Manual review recommended.",
      potential: "Unknown",
      timeframe: "Immediate"
    }];
  }
}

module.exports = {
  generateAIReport
};
