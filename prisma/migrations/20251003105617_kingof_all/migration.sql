-- CreateTable
CREATE TABLE "Drug" (
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
    "warehouseId" TEXT NOT NULL,
    "createdBy" TEXT,
    "lastStockUpdate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" DATETIME,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Drug_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses" ("warehouseCode") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DrugCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "warehouseId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "DrugCategory_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses" ("warehouseCode") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DrugStockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "drugId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "balanceAfter" INTEGER NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL DEFAULT 'system',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DrugStockMovement_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DrugDisposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "drugId" TEXT NOT NULL,
    "disposalMethod" TEXT NOT NULL,
    "disposalReason" TEXT NOT NULL,
    "notes" TEXT,
    "warehouseId" TEXT NOT NULL,
    "disposedBy" TEXT NOT NULL,
    "disposalDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DrugDisposal_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "warehouseCode" TEXT NOT NULL,
    "warehouseName" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" DATETIME,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "warehousesId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" DATETIME,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Product_warehousesId_fkey" FOREIGN KEY ("warehousesId") REFERENCES "warehouses" ("warehouseCode") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("barcode", "batchNumber", "brandName", "category", "controlledSubstance", "cost", "createdAt", "description", "dosageForm", "expiryDate", "genericName", "id", "isDeleted", "manufacturer", "maxStockLevel", "name", "quantity", "reorderLevel", "requiresPrescription", "retailPrice", "storageConditions", "strength", "taxRate", "unit", "updatedAt", "wholeSalePrice") SELECT "barcode", "batchNumber", "brandName", "category", "controlledSubstance", "cost", "createdAt", "description", "dosageForm", "expiryDate", "genericName", "id", "isDeleted", "manufacturer", "maxStockLevel", "name", "quantity", "reorderLevel", "requiresPrescription", "retailPrice", "storageConditions", "strength", "taxRate", "unit", "updatedAt", "wholeSalePrice" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE INDEX "Product_expiryDate_idx" ON "Product"("expiryDate");
CREATE INDEX "Product_quantity_idx" ON "Product"("quantity");
CREATE INDEX "Product_warehousesId_idx" ON "Product"("warehousesId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Drug_warehouseId_category_idx" ON "Drug"("warehouseId", "category");

-- CreateIndex
CREATE INDEX "Drug_warehouseId_expiryDate_idx" ON "Drug"("warehouseId", "expiryDate");

-- CreateIndex
CREATE INDEX "Drug_warehouseId_quantity_idx" ON "Drug"("warehouseId", "quantity");

-- CreateIndex
CREATE INDEX "Drug_code_warehouseId_idx" ON "Drug"("code", "warehouseId");

-- CreateIndex
CREATE INDEX "DrugCategory_warehouseId_name_idx" ON "DrugCategory"("warehouseId", "name");

-- CreateIndex
CREATE INDEX "DrugStockMovement_drugId_createdAt_idx" ON "DrugStockMovement"("drugId", "createdAt");

-- CreateIndex
CREATE INDEX "DrugStockMovement_warehouseId_createdAt_idx" ON "DrugStockMovement"("warehouseId", "createdAt");

-- CreateIndex
CREATE INDEX "DrugDisposal_drugId_idx" ON "DrugDisposal"("drugId");

-- CreateIndex
CREATE INDEX "DrugDisposal_warehouseId_disposalDate_idx" ON "DrugDisposal"("warehouseId", "disposalDate");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_warehouseCode_key" ON "warehouses"("warehouseCode");

-- CreateIndex
CREATE INDEX "warehouses_warehouseCode_idx" ON "warehouses"("warehouseCode");
