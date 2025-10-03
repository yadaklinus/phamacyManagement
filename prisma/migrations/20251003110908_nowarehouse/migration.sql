/*
  Warnings:

  - You are about to drop the `warehouses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `warehouseId` on the `Drug` table. All the data in the column will be lost.
  - You are about to drop the column `warehouseId` on the `DrugCategory` table. All the data in the column will be lost.
  - You are about to drop the column `warehousesId` on the `Product` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "warehouses_warehouseCode_idx";

-- DropIndex
DROP INDEX "warehouses_warehouseCode_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "warehouses";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Drug" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "description" TEXT,
    "activeIngredient" TEXT,
    "strength" TEXT,
    "dosageForm" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 0,
    "price" REAL NOT NULL,
    "cost" REAL NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'Pieces',
    "storageConditions" TEXT,
    "prescriptionRequired" BOOLEAN NOT NULL DEFAULT false,
    "supplier" TEXT,
    "isDisposed" BOOLEAN NOT NULL DEFAULT false,
    "disposalDate" DATETIME,
    "disposalMethod" TEXT,
    "disposalReason" TEXT,
    "disposalNotes" TEXT,
    "disposedBy" TEXT,
    "createdBy" TEXT,
    "lastStockUpdate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" DATETIME,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Drug" ("activeIngredient", "batchNumber", "category", "code", "cost", "createdAt", "createdBy", "description", "disposalDate", "disposalMethod", "disposalNotes", "disposalReason", "disposedBy", "dosageForm", "expiryDate", "id", "isDeleted", "isDisposed", "lastStockUpdate", "manufacturer", "name", "prescriptionRequired", "price", "quantity", "reorderLevel", "storageConditions", "strength", "supplier", "sync", "syncedAt", "unit", "updatedAt") SELECT "activeIngredient", "batchNumber", "category", "code", "cost", "createdAt", "createdBy", "description", "disposalDate", "disposalMethod", "disposalNotes", "disposalReason", "disposedBy", "dosageForm", "expiryDate", "id", "isDeleted", "isDisposed", "lastStockUpdate", "manufacturer", "name", "prescriptionRequired", "price", "quantity", "reorderLevel", "storageConditions", "strength", "supplier", "sync", "syncedAt", "unit", "updatedAt" FROM "Drug";
DROP TABLE "Drug";
ALTER TABLE "new_Drug" RENAME TO "Drug";
CREATE TABLE "new_DrugCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_DrugCategory" ("color", "createdAt", "createdBy", "description", "id", "isActive", "isDeleted", "name", "updatedAt") SELECT "color", "createdAt", "createdBy", "description", "id", "isActive", "isDeleted", "name", "updatedAt" FROM "DrugCategory";
DROP TABLE "DrugCategory";
ALTER TABLE "new_DrugCategory" RENAME TO "DrugCategory";
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "genericName" TEXT,
    "brandName" TEXT,
    "category" TEXT,
    "manufacturer" TEXT,
    "batchNumber" TEXT,
    "expiryDate" DATETIME,
    "wholeSalePrice" REAL NOT NULL,
    "retailPrice" REAL NOT NULL,
    "cost" REAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reorderLevel" INTEGER,
    "maxStockLevel" INTEGER,
    "taxRate" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dosageForm" TEXT,
    "strength" TEXT,
    "requiresPrescription" BOOLEAN NOT NULL DEFAULT true,
    "controlledSubstance" BOOLEAN NOT NULL DEFAULT false,
    "storageConditions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" DATETIME,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Product" ("barcode", "batchNumber", "brandName", "category", "controlledSubstance", "cost", "createdAt", "description", "dosageForm", "expiryDate", "genericName", "id", "isDeleted", "manufacturer", "maxStockLevel", "name", "quantity", "reorderLevel", "requiresPrescription", "retailPrice", "storageConditions", "strength", "sync", "syncedAt", "taxRate", "unit", "updatedAt", "wholeSalePrice") SELECT "barcode", "batchNumber", "brandName", "category", "controlledSubstance", "cost", "createdAt", "description", "dosageForm", "expiryDate", "genericName", "id", "isDeleted", "manufacturer", "maxStockLevel", "name", "quantity", "reorderLevel", "requiresPrescription", "retailPrice", "storageConditions", "strength", "sync", "syncedAt", "taxRate", "unit", "updatedAt", "wholeSalePrice" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
