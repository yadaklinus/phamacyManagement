# Drug Inventory Management API Documentation

## Overview
This document describes the comprehensive API endpoints for the Drug Inventory Management system. All endpoints follow RESTful conventions and return JSON responses.

## Base URL
```
/api/drug
```

## Authentication
All endpoints require valid warehouse authentication. Include `warehouseId` in request body or query parameters.

---

## 📋 **Drug CRUD Operations**

### 1. Create Drug
**POST** `/api/drug`

Creates a new drug in the inventory.

**Request Body:**
```json
{
  "name": "Paracetamol",
  "barcode": "PAR001",
  "genericName": "Acetaminophen",
  "brandName": "Tylenol",
  "category": "Painkiller",
  "manufacturer": "PharmaCorp",
  "batchNumber": "BATCH001",
  "expiryDate": "2025-12-31",
  "wholeSalePrice": 8.00,
  "retailPrice": 10.00,
  "cost": 5.00,
  "quantity": 100,
  "reorderLevel": 20,
  "maxStockLevel": 500,
  "taxRate": 5,
  "unit": "tablet",
  "description": "Pain relief medication",
  "dosageForm": "Tablet",
  "strength": "500mg",
  "requiresPrescription": false,
  "controlledSubstance": false,
  "storageConditions": "Store in cool, dry place",
  "warehousesId": "warehouse-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Drug created successfully",
  "data": {
    "id": "drug-id",
    "name": "Paracetamol",
    "barcode": "PAR001",
    // ... other drug fields
  }
}
```

### 2. Update Drug
**PUT** `/api/drug`

Updates an existing drug.

**Request Body:**
```json
{
  "drugId": "drug-id",
  "name": "Updated Drug Name",
  // ... other fields to update
}
```

### 3. Get Drug Details
**GET** `/api/drug/[id]`

Retrieves detailed information about a specific drug including prescription history and purchase records.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "drug-id",
    "name": "Paracetamol",
    "stockStatus": "in_stock",
    "expiryStatus": "valid",
    "daysUntilExpiry": 365,
    "metrics": {
      "totalPrescribed": 150,
      "totalDispensed": 120,
      "totalPurchased": 500,
      "currentValue": 1000.00,
      "costValue": 500.00
    },
    "prescriptionItems": [...],
    "purchaseItem": [...]
  }
}
```

### 4. Delete Drug
**DELETE** `/api/drug/[id]`

Soft deletes a drug from the inventory.

---

## 🔍 **Search & List Operations**

### 5. Enhanced Drug List
**POST** `/api/drug/list`

Retrieves drugs with advanced filtering, sorting, and pagination.

**Request Body:**
```json
{
  "warehouseId": "warehouse-id",
  "search": "paracetamol",
  "category": "Painkiller",
  "stockStatus": "low_stock",
  "expiryStatus": "expiring_soon",
  "sortBy": "name",
  "sortOrder": "asc",
  "limit": 50,
  "offset": 0
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "drug-id",
      "name": "Paracetamol",
      "stockStatus": "in_stock",
      "expiryStatus": "valid",
      "daysUntilExpiry": 365,
      // ... other enhanced fields
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  },
  "stats": {
    "totalDrugs": 150,
    "lowStockCount": 5,
    "expiringSoonCount": 3,
    "totalValue": 50000.00
  }
}
```

### 6. Drug Search
**POST** `/api/drug/search`

Advanced search with relevance scoring and suggestions.

**Request Body:**
```json
{
  "warehouseId": "warehouse-id",
  "query": "paracet",
  "searchFields": ["name", "barcode", "genericName"],
  "limit": 20
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "drug-id",
        "name": "Paracetamol",
        "relevanceScore": 95,
        "matchedFields": ["name", "genericName"]
      }
    ],
    "suggestions": [
      {
        "type": "category",
        "value": "Painkiller",
        "label": "Category: Painkiller"
      }
    ]
  }
}
```

---

## 📦 **Stock Management**

### 7. Stock Adjustment
**POST** `/api/drug/stock/adjust`

Adjusts drug stock levels with tracking.

**Request Body:**
```json
{
  "drugId": "drug-id",
  "adjustmentType": "increase",
  "quantity": 50,
  "reason": "New stock received",
  "notes": "Batch ABC123",
  "userId": "user-id",
  "batchNumber": "ABC123",
  "expiryDate": "2025-12-31"
}
```

### 8. Stock Alerts
**GET** `/api/drug/stock/alerts?warehouseId=warehouse-id&type=all`

Retrieves stock and expiry alerts.

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalDrugs": 150,
      "stockAlerts": {
        "outOfStock": 2,
        "lowStock": 5,
        "nearReorder": 3
      },
      "expiryAlerts": {
        "expired": 1,
        "expiringSoon": 4
      }
    },
    "stockAlerts": {
      "outOfStock": [...],
      "lowStock": [...],
      "nearReorder": [...]
    },
    "expiryAlerts": {
      "expired": [...],
      "expiringSoon": [...]
    }
  }
}
```

### 9. Update Reorder Levels
**POST** `/api/drug/stock/alerts`

Bulk update reorder levels for multiple drugs.

**Request Body:**
```json
{
  "warehouseId": "warehouse-id",
  "updates": [
    {
      "drugId": "drug-id-1",
      "reorderLevel": 25,
      "maxStockLevel": 500
    }
  ]
}
```

---

## 🏷️ **Category Management**

### 10. Get Categories
**GET** `/api/drug/categories?warehouseId=warehouse-id`

Retrieves all drug categories with statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "name": "Painkiller",
        "totalDrugs": 25,
        "totalQuantity": 1500,
        "totalValue": 15000.00,
        "lowStockCount": 2,
        "expiredCount": 0
      }
    ],
    "overallStats": {
      "totalCategories": 8,
      "totalDrugs": 150,
      "totalValue": 50000.00
    }
  }
}
```

### 11. Update Categories
**POST** `/api/drug/categories`

Bulk update drug categories.

**Request Body:**
```json
{
  "warehouseId": "warehouse-id",
  "updates": [
    {
      "drugId": "drug-id-1",
      "category": "Antibiotics"
    }
  ]
}
```

---

## 🔄 **Bulk Operations**

### 12. Bulk Delete
**POST** `/api/drug/bulk/delete`

Deletes multiple drugs with conflict checking.

**Request Body:**
```json
{
  "drugIds": ["drug-id-1", "drug-id-2"],
  "warehouseId": "warehouse-id",
  "force": false
}
```

### 13. Bulk Update
**POST** `/api/drug/bulk/update`

Updates multiple drugs with various operations.

**Request Body:**
```json
{
  "drugIds": ["drug-id-1", "drug-id-2"],
  "warehouseId": "warehouse-id",
  "updates": {
    "category": "Antibiotics",
    "reorderLevel": 20,
    "retailPriceAdjustment": {
      "type": "percentage",
      "value": 10
    }
  }
}
```

---

## 📊 **Reports & Analytics**

### 14. Inventory Report
**POST** `/api/drug/reports/inventory`

Generates comprehensive inventory reports.

**Request Body:**
```json
{
  "warehouseId": "warehouse-id",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "category": "all",
  "groupBy": "category"
}
```

### 15. Analytics Report
**POST** `/api/drug/reports/analytics`

Generates analytics with trends and performance metrics.

**Request Body:**
```json
{
  "warehouseId": "warehouse-id",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "period": "monthly"
}
```

---

## 📤 **Import/Export**

### 16. CSV Import
**POST** `/api/drug/import/csv`

Imports drugs from CSV data with validation.

**Request Body:**
```json
{
  "csvData": [
    {
      "name": "Drug Name",
      "barcode": "DRUG001",
      "retailPrice": "10.00",
      "cost": "5.00",
      "quantity": "100"
    }
  ],
  "warehouseId": "warehouse-id",
  "options": {
    "skipDuplicates": true,
    "updateExisting": false,
    "validateOnly": false
  }
}
```

### 17. Export Data
**POST** `/api/drug/export`

Exports drug data in various formats.

**Request Body:**
```json
{
  "warehouseId": "warehouse-id",
  "format": "csv",
  "includeFields": ["drugCode", "drugName", "quantity"],
  "category": "all",
  "stockStatus": "all"
}
```

---

## 🔧 **Response Format**

All API responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

---

## 📈 **Status Codes**

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## 🏷️ **Data Types**

### Stock Status
- `in_stock` - Above reorder level
- `near_reorder` - Within 10% of reorder level
- `low_stock` - At or below reorder level
- `out_of_stock` - Zero quantity

### Expiry Status
- `valid` - More than 30 days until expiry
- `expiring_soon` - 30 days or less until expiry
- `expired` - Past expiry date
- `no_expiry` - No expiry date set

### Units
- `tablet`, `capsule`, `ml`, `mg`, `bottle`, `tube`, `sachet`, `piece`, `kg`, `liter`, `meter`

---

## 🔍 **Search Fields**
Available fields for search operations:
- `name` - Drug name
- `barcode` - Drug code/barcode
- `genericName` - Generic drug name
- `brandName` - Brand name
- `manufacturer` - Manufacturer name
- `batchNumber` - Batch number
- `category` - Drug category

---

## 📝 **Notes**

1. All date fields should be in ISO 8601 format (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ`)
2. Monetary values are in the warehouse's default currency
3. Soft deletes are used - deleted items have `isDeleted: true`
4. All endpoints support the `warehouseId` parameter for multi-tenant support
5. Pagination is available on list endpoints with `limit` and `offset` parameters
6. Search operations are case-insensitive and support partial matching

---

This API provides comprehensive drug inventory management capabilities including CRUD operations, advanced search and filtering, stock management, bulk operations, reporting, and import/export functionality.