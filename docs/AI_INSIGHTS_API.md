# AI Insights API Documentation

## Overview
The AI Insights API provides powerful business intelligence and analytics using Google's Gemini AI to analyze your parcel management system data.

## Base URL
```
http://your-backend-url/api/admin/ai
```

## Authentication
All AI endpoints require admin authentication. Include the admin token in cookies or headers.

---

## 🚀 API Endpoints

### 1. Generate Comprehensive AI Report
**POST** `/api/admin/ai/generate-report`

Generates a complete AI-powered business analysis with insights, recommendations, and performance metrics.

#### Request Body:
```json
{
  "reportType": "comprehensive",
  "dateRange": "{\"startDate\":\"2024-01-01\",\"endDate\":\"2024-12-31\"}",
  "branchId": "all"
}
```

#### Postman Setup:
```
Method: POST
URL: http://localhost:5000/api/admin/ai/generate-report
Headers: 
  Content-Type: application/json
  Cookie: adminToken=your_admin_token_here

Body (raw JSON):
{
  "reportType": "comprehensive",
  "dateRange": "{\"startDate\":\"2024-01-01\",\"endDate\":\"2024-12-31\"}",
  "branchId": "all"
}
```

#### Response Example:
```json
{
  "success": true,
  "data": {
    "reportType": "comprehensive",
    "filters": {
      "dateRange": "{\"startDate\":\"2024-01-01\",\"endDate\":\"2024-12-31\"}",
      "branchId": "all"
    },
    "reportData": {
      "users": {
        "total": 1250,
        "newUsers": 85,
        "activeUsers": 1180,
        "verifiedUsers": 1100
      },
      "parcels": {
        "total": 5430,
        "byStatus": {
          "Delivered": 4200,
          "In Transit": 800,
          "Pending": 430
        }
      },
      "kpis": {
        "deliveryRate": 85.2,
        "customerSatisfaction": 92.1,
        "revenueGrowth": 15.8
      }
    },
    "aiInsights": {
      "executiveSummary": "Business performance shows strong growth with 15.8% revenue increase and 92.1% customer satisfaction.",
      "keyFindings": [
        "Delivery efficiency improved by 12% compared to last quarter",
        "Customer retention rate increased to 94.5%",
        "Peak performance observed in metropolitan branches"
      ],
      "recommendations": [
        {
          "priority": "High",
          "category": "Operational",
          "title": "Expand Express Delivery",
          "description": "Increase express delivery capacity in high-demand areas",
          "expectedImpact": "20% revenue increase in express services",
          "timeframe": "3-6 months"
        }
      ],
      "performanceScore": {
        "overall": 87,
        "breakdown": {
          "operational": 89,
          "financial": 85,
          "customer": 91,
          "efficiency": 83
        }
      }
    },
    "generatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Get AI Insights for Existing Data
**POST** `/api/admin/ai/insights`

Analyze existing report data and get AI insights without collecting new data.

#### Request Body:
```json
{
  "reportType": "performance",
  "reportData": {
    "parcels": {
      "total": 1500,
      "delivered": 1200,
      "delayed": 150,
      "pending": 150
    },
    "revenue": {
      "total": 45000,
      "thisMonth": 15000,
      "lastMonth": 12000
    }
  }
}
```

#### Postman Setup:
```
Method: POST
URL: http://localhost:5000/api/admin/ai/insights
Headers: 
  Content-Type: application/json
  Cookie: adminToken=your_admin_token_here

Body (raw JSON):
{
  "reportType": "performance",
  "reportData": {
    "parcels": {
      "total": 1500,
      "delivered": 1200,
      "delayed": 150,
      "pending": 150
    },
    "revenue": {
      "total": 45000,
      "thisMonth": 15000,
      "lastMonth": 12000
    }
  }
}
```

---

### 3. Get Business Metrics
**GET** `/api/admin/ai/metrics`

Retrieve structured business metrics for AI analysis.

#### Query Parameters:
- `dateRange` (optional): `{"startDate":"2024-01-01","endDate":"2024-12-31"}`
- `branchId` (optional): specific branch ID or "all"

#### Postman Setup:
```
Method: GET
URL: http://localhost:5000/api/admin/ai/metrics?dateRange={"startDate":"2024-01-01","endDate":"2024-12-31"}&branchId=all
Headers: 
  Cookie: adminToken=your_admin_token_here
```

#### Response Example:
```json
{
  "success": true,
  "data": {
    "metrics": {
      "overview": {
        "totalUsers": 1250,
        "totalParcels": 5430,
        "totalRevenue": 234500,
        "totalBranches": 15,
        "b2bShipments": 320
      },
      "userMetrics": {
        "newUsers": 85,
        "activeUsers": 1180,
        "verifiedUsers": 1100
      },
      "parcelMetrics": {
        "byStatus": {
          "Delivered": 4200,
          "In Transit": 800,
          "Pending": 430
        },
        "averageWeight": 2.5,
        "totalWeight": 13575
      },
      "revenueMetrics": {
        "totalAmount": 234500,
        "averageTransaction": 187.6,
        "byMethod": {
          "card": 180000,
          "cash": 54500
        }
      }
    }
  }
}
```

---

### 4. Get Performance Analysis
**GET** `/api/admin/ai/performance`

Get detailed performance analysis data.

#### Query Parameters:
- `dateRange` (optional): Date range for analysis
- `branchId` (optional): Specific branch or "all"
- `analysisType` (optional): "comprehensive", "delivery", "financial"

#### Postman Setup:
```
Method: GET
URL: http://localhost:5000/api/admin/ai/performance?analysisType=comprehensive&dateRange={"startDate":"2024-01-01","endDate":"2024-12-31"}
Headers: 
  Cookie: adminToken=your_admin_token_here
```

---

## 🔧 Parameter Options

### Report Types:
- `"comprehensive"` - Complete business analysis
- `"parcels"` - Parcel-focused analysis
- `"financial"` - Revenue and payment analysis
- `"operational"` - Operational efficiency analysis
- `"customer"` - Customer behavior analysis

### Date Range Format:
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

### Branch ID Options:
- `"all"` - All branches
- `"branch_id_here"` - Specific branch ID

---

## 🛠️ Postman Collection Examples

### Environment Variables:
```
base_url: http://localhost:5000
admin_token: your_admin_jwt_token_here
```

### Example Requests:

#### 1. Quick Business Report:
```
POST {{base_url}}/api/admin/ai/generate-report
Cookie: adminToken={{admin_token}}

{
  "reportType": "comprehensive"
}
```

#### 2. Monthly Performance:
```
GET {{base_url}}/api/admin/ai/performance?dateRange={"startDate":"2024-12-01","endDate":"2024-12-31"}&analysisType=comprehensive
Cookie: adminToken={{admin_token}}
```

#### 3. Branch-Specific Metrics:
```
GET {{base_url}}/api/admin/ai/metrics?branchId=675a1b2c3d4e5f6789abcdef&dateRange={"startDate":"2024-01-01","endDate":"2024-12-31"}
Cookie: adminToken={{admin_token}}
```

---

## 🔐 Authentication Setup

### Method 1: Cookie Authentication
Add to Headers:
```
Cookie: adminToken=your_jwt_token_here
```

### Method 2: Authorization Header
Add to Headers:
```
Authorization: Bearer your_jwt_token_here
```

---

## 📊 Sample AI Insights Response

The AI will provide structured insights including:

- **Executive Summary**: High-level business overview
- **Key Findings**: Important metrics and trends
- **Recommendations**: Actionable business improvements
- **Risk Assessment**: Potential risks and mitigation strategies
- **Opportunities**: Growth and optimization opportunities
- **Performance Scores**: Quantified performance metrics
- **Trend Analysis**: Positive/concerning trends and predictions

---

## ⚠️ Error Handling

### Common Error Responses:

#### 401 Unauthorized:
```json
{
  "success": false,
  "message": "Access denied. Admin authentication required."
}
```

#### 400 Bad Request:
```json
{
  "success": false,
  "message": "Invalid request parameters"
}
```

#### 500 Server Error:
```json
{
  "success": false,
  "message": "Failed to generate AI insights",
  "error": "Unable to generate AI insights at this time"
}
```

---

## 🚀 Getting Started

1. **Set up Postman Environment**
2. **Authenticate as Admin** (get admin token)
3. **Start with**: `GET /api/admin/ai/metrics` (simple test)
4. **Generate Report**: `POST /api/admin/ai/generate-report`
5. **Analyze Results**: Review AI insights and recommendations

The AI system will analyze your actual business data and provide intelligent insights to help improve operations, increase revenue, and enhance customer satisfaction.
