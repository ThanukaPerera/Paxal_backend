# Branch Data Fetching API Documentation

This document describes the enhanced API endpoints for fetching branch-related data including parcels, drivers, and staff.

## Base URL
```
/api/branches
```

## Endpoints

### 1. Fetch Parcels by Branch ID
**GET** `/api/branches/:id/parcels`

Retrieves all parcels associated with a specific branch, including those originating from or destined to the branch.

#### Parameters
- `id` (path parameter): Branch ObjectId

#### Query Parameters
- `status` (optional): Filter by parcel status
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 10): Number of items per page
- `sortBy` (optional, default: 'createdAt'): Field to sort by
- `sortOrder` (optional, default: 'desc'): Sort order (asc/desc)
- `itemType` (optional): Filter by item type
- `shippingMethod` (optional): Filter by shipping method

#### Response
```json
{
  "success": true,
  "message": "Parcels fetched successfully",
  "data": {
    "branch": {
      "id": "64abc123...",
      "branchId": "BR001",
      "location": "Colombo Main",
      "contact": "+94711234567"
    },
    "parcels": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalParcels": 47,
      "hasNext": true,
      "hasPrev": false,
      "limit": 10
    },
    "statusDistribution": [
      { "_id": "OrderPlaced", "count": 10 },
      { "_id": "InTransit", "count": 15 }
    ],
    "filters": {
      "status": null,
      "itemType": null,
      "shippingMethod": null,
      "sortBy": "createdAt",
      "sortOrder": "desc"
    }
  }
}
```

### 2. Fetch Drivers by Branch ID
**GET** `/api/branches/:id/drivers`

Retrieves all drivers assigned to a specific branch with their vehicle information.

#### Parameters
- `id` (path parameter): Branch ObjectId

#### Query Parameters
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 10): Number of items per page
- `sortBy` (optional, default: 'createdAt'): Field to sort by
- `sortOrder` (optional, default: 'desc'): Sort order (asc/desc)
- `search` (optional): Search term for driver name, ID, email, NIC, or license
- `status` (optional, default: 'all'): Filter by status (active/inactive/all)

#### Response
```json
{
  "success": true,
  "message": "Drivers fetched successfully",
  "data": {
    "branch": {
      "id": "64abc123...",
      "branchId": "BR001",
      "location": "Colombo Main",
      "contact": "+94711234567"
    },
    "drivers": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalDrivers": 15,
      "hasNext": true,
      "hasPrev": false,
      "limit": 10
    },
    "statistics": {
      "totalDrivers": 15,
      "availableVehicles": 12,
      "unavailableVehicles": 3,
      "pickupDeliveryVehicles": 10,
      "shipmentVehicles": 5
    },
    "recentActivities": [...],
    "filters": {
      "search": "",
      "status": "all",
      "sortBy": "createdAt",
      "sortOrder": "desc"
    }
  }
}
```

### 3. Fetch Staff by Branch ID
**GET** `/api/branches/:id/staff`

Retrieves all staff members assigned to a specific branch with their activity statistics.

#### Parameters
- `id` (path parameter): Branch ObjectId

#### Query Parameters
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 10): Number of items per page
- `sortBy` (optional, default: 'createdAt'): Field to sort by
- `sortOrder` (optional, default: 'desc'): Sort order (asc/desc)
- `search` (optional): Search term for staff name, ID, email, NIC, or contact
- `status` (optional, default: 'all'): Filter by status (active/inactive/all)

#### Response
```json
{
  "success": true,
  "message": "Staff members fetched successfully",
  "data": {
    "branch": {
      "id": "64abc123...",
      "branchId": "BR001",
      "location": "Colombo Main",
      "contact": "+94711234567"
    },
    "staff": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalStaff": 25,
      "hasNext": true,
      "hasPrev": false,
      "limit": 10
    },
    "statistics": {
      "totalStaff": 25,
      "activeStaff": 22,
      "inactiveStaff": 3
    },
    "staffActivity": [
      {
        "staffId": "64def456...",
        "name": "John Doe",
        "totalParcelsHandled": 145,
        "recentParcelsHandled": 23
      }
    ],
    "recentActivities": [...],
    "filters": {
      "search": "",
      "status": "all",
      "sortBy": "createdAt",
      "sortOrder": "desc"
    }
  }
}
```

### 4. Fetch Complete Branch Data
**GET** `/api/branches/:id/complete`

Retrieves comprehensive data for a branch including drivers, staff, parcels, vehicles, and performance metrics.

#### Parameters
- `id` (path parameter): Branch ObjectId

#### Response
```json
{
  "success": true,
  "message": "Complete branch data fetched successfully",
  "data": {
    "branch": {
      "id": "64abc123...",
      "branchId": "BR001",
      "location": "Colombo Main",
      "contact": "+94711234567",
      "createdAt": "2024-01-15T08:30:00.000Z",
      "updatedAt": "2024-01-20T10:45:00.000Z"
    },
    "summary": {
      "totalDrivers": 15,
      "totalStaff": 25,
      "totalVehicles": 18,
      "recentParcels": 20,
      "todaySchedules": 8
    },
    "drivers": {
      "list": [...],
      "statistics": {
        "totalDrivers": 15,
        "availableVehicles": 12
      }
    },
    "staff": {
      "list": [...],
      "statistics": {
        "total": 25,
        "byStatus": {
          "active": 22,
          "inactive": 3
        }
      }
    },
    "parcels": {
      "recent": [...],
      "statistics": {
        "total": 20,
        "byStatus": {
          "OrderPlaced": 5,
          "InTransit": 8,
          "Delivered": 7
        }
      }
    },
    "vehicles": {
      "list": [...],
      "schedules": [...],
      "todayScheduleSummary": {
        "totalSchedules": 8,
        "pickupSchedules": 4,
        "deliverySchedules": 4,
        "totalParcelsScheduled": 32
      }
    },
    "performanceMetrics": {
      "totalParcelsToday": 12,
      "deliveredToday": 8,
      "pendingPickups": 15,
      "inTransit": 23
    },
    "lastUpdated": "2024-01-20T12:30:45.123Z"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid branch ID format"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Branch not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details (only in development mode)"
}
```

## Usage Examples

### Fetch parcels with filters
```javascript
GET /api/branches/64abc123def456/parcels?status=InTransit&page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

### Search drivers
```javascript
GET /api/branches/64abc123def456/drivers?search=john&status=active&page=1
```

### Get staff with pagination
```javascript
GET /api/branches/64abc123def456/staff?page=2&limit=15&sortBy=name&sortOrder=asc
```

### Get complete branch overview
```javascript
GET /api/branches/64abc123def456/complete
```

## Notes

1. All endpoints support pagination where applicable
2. Search functionality is case-insensitive and supports partial matches
3. Sensitive data like passwords are automatically excluded from responses
4. ObjectId validation is performed on all branch ID parameters
5. Performance metrics are calculated in real-time
6. Date-based filters use the current date/time for "today" calculations
