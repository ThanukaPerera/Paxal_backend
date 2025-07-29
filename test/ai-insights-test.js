// AI Insights API Test Examples
// Use these in Postman or any API testing tool

/* 
=== POSTMAN TESTING GUIDE ===

Base URL: http://localhost:5000/api/admin
Headers: 
  Content-Type: application/json
  Cookie: adminToken=YOUR_ADMIN_TOKEN_HERE

=== TEST 1: Get Business Metrics ===
Method: GET
URL: {{base_url}}/ai/metrics
Query Params:
  - dateRange: {"startDate":"2024-01-01","endDate":"2024-12-31"}
  - branchId: all

Expected: Business metrics data structure

=== TEST 2: Generate Comprehensive AI Report ===
Method: POST
URL: {{base_url}}/ai/generate-report

Body (JSON):
{
  "reportType": "comprehensive",
  "dateRange": "{\"startDate\":\"2024-01-01\",\"endDate\":\"2024-12-31\"}",
  "branchId": "all"
}

Expected: Full AI analysis with insights and recommendations

=== TEST 3: Get AI Insights for Custom Data ===
Method: POST
URL: {{base_url}}/ai/insights

Body (JSON):
{
  "reportType": "performance",
  "reportData": {
    "parcels": {
      "total": 1000,
      "delivered": 800,
      "pending": 150,
      "delayed": 50
    },
    "revenue": {
      "total": 50000,
      "paid": 45000,
      "pending": 5000
    },
    "users": {
      "total": 500,
      "active": 450,
      "new": 25
    }
  }
}

Expected: AI insights based on provided data

=== TEST 4: Performance Analysis ===
Method: GET
URL: {{base_url}}/ai/performance
Query Params:
  - analysisType: comprehensive
  - dateRange: {"startDate":"2024-01-01","endDate":"2024-12-31"}
  - branchId: all

Expected: Detailed performance analysis

=== AUTHENTICATION ===
1. First login as admin: POST {{base_url}}/auth/login
2. Copy the token from response
3. Add to Cookie header: adminToken=YOUR_TOKEN

=== ERROR TESTING ===
- Try without authentication (should get 401)
- Try with invalid dateRange format (should get 400)
- Try with missing required fields (should get 400)

*/

// Sample expected responses for testing

const expectedMetricsResponse = {
  success: true,
  data: {
    metrics: {
      overview: {
        totalUsers: 1250,
        totalParcels: 5430,
        totalRevenue: 234500,
        totalBranches: 15,
        b2bShipments: 320
      },
      userMetrics: {
        newUsers: 85,
        activeUsers: 1180,
        verifiedUsers: 1100
      },
      parcelMetrics: {
        byStatus: {
          "Delivered": 4200,
          "In Transit": 800,
          "Pending": 430
        },
        averageWeight: 2.5,
        totalWeight: 13575
      }
    }
  }
};

const expectedAIInsights = {
  success: true,
  data: {
    aiInsights: {
      executiveSummary: "Business performance shows strong growth...",
      keyFindings: [
        "Delivery efficiency improved by 12%",
        "Customer retention rate increased to 94.5%"
      ],
      recommendations: [
        {
          priority: "High",
          category: "Operational",
          title: "Expand Express Delivery",
          description: "Increase express delivery capacity",
          expectedImpact: "20% revenue increase",
          timeframe: "3-6 months"
        }
      ],
      performanceScore: {
        overall: 87,
        breakdown: {
          operational: 89,
          financial: 85,
          customer: 91,
          efficiency: 83
        }
      }
    }
  }
};

module.exports = {
  expectedMetricsResponse,
  expectedAIInsights
};
