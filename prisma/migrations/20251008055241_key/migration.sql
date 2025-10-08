-- CreateEnum
CREATE TYPE "mode" AS ENUM ('dark', 'light');

-- CreateEnum
CREATE TYPE "role" AS ENUM ('admin', 'physician', 'pharmacist', 'receptionist', 'nurse');

-- CreateEnum
CREATE TYPE "unit" AS ENUM ('kg', 'piece', 'liter', 'meter', 'tablet', 'capsule', 'ml', 'mg', 'bottle', 'tube', 'sachet');

-- CreateEnum
CREATE TYPE "type" AS ENUM ('COMPANY', 'INDIVIDUAL', 'GOVERNMENT', 'NON_PROFIT', 'retail', 'wholesale');

-- CreateEnum
CREATE TYPE "priority" AS ENUM ('emergency', 'urgent', 'normal');

-- CreateEnum
CREATE TYPE "consultationStatus" AS ENUM ('waiting', 'in_progress', 'completed', 'cancelled', 'referred');

-- CreateEnum
CREATE TYPE "prescriptionStatus" AS ENUM ('pending', 'approved', 'dispensed', 'partially_dispensed', 'cancelled', 'expired');

-- CreateTable
CREATE TABLE "superAdmin" (
    "id" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "superAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "role" NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "setting_id" INTEGER NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyEmail" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "websiteURL" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "defaultCurrency" TEXT NOT NULL,
    "taxRate" INTEGER NOT NULL,
    "mode" "mode" NOT NULL,
    "itermsPerPage" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("setting_id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "matricNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "otherNames" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "department" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "faculty" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "genotype" TEXT,
    "allergies" TEXT,
    "chronicConditions" TEXT,
    "emergencyContact" TEXT NOT NULL,
    "emergencyPhone" TEXT NOT NULL,
    "emergencyRelationship" TEXT,
    "profilePhoto" TEXT,
    "address" TEXT,
    "stateOfOrigin" TEXT,
    "nationality" TEXT DEFAULT 'Nigerian',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Physician" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "otherNames" TEXT,
    "specialization" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "profilePhoto" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Physician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Queue" (
    "id" TEXT NOT NULL,
    "queueNumber" INTEGER NOT NULL,
    "studentId" TEXT NOT NULL,
    "priority" "priority" NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "checkInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calledTime" TIMESTAMP(3),
    "completedTime" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "appointmentNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "physicianId" TEXT,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "appointmentTime" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VitalSigns" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "consultationId" TEXT,
    "temperature" DOUBLE PRECISION,
    "bloodPressure" TEXT,
    "pulse" INTEGER,
    "respiratoryRate" INTEGER,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "oxygenSaturation" INTEGER,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VitalSigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "consultationNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "physicianId" TEXT NOT NULL,
    "chiefComplaint" TEXT NOT NULL,
    "historyOfPresenting" TEXT,
    "symptoms" TEXT NOT NULL,
    "physicalExamination" TEXT,
    "diagnosis" TEXT NOT NULL,
    "differentialDiagnosis" TEXT,
    "treatmentPlan" TEXT,
    "notes" TEXT,
    "followUpDate" TIMESTAMP(3),
    "status" "consultationStatus" NOT NULL DEFAULT 'waiting',
    "priority" "priority" NOT NULL DEFAULT 'normal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "prescriptionNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "physicianId" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "instructions" TEXT,
    "status" "prescriptionStatus" NOT NULL DEFAULT 'pending',
    "priority" "priority" NOT NULL DEFAULT 'normal',
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "isDispensed" BOOLEAN NOT NULL DEFAULT false,
    "dispensedBy" TEXT,
    "dispensedAt" TIMESTAMP(3),
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pharmacyNotified" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "studentNotified" BOOLEAN NOT NULL DEFAULT false,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionItem" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "drugName" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "route" TEXT,
    "instructions" TEXT NOT NULL,
    "quantityPrescribed" INTEGER NOT NULL,
    "quantityDispensed" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "isDispensed" BOOLEAN NOT NULL DEFAULT false,
    "dispensedAt" TIMESTAMP(3),
    "dispensedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugDispensal" (
    "id" TEXT NOT NULL,
    "dispensalNo" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "prescriptionNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "dispensedBy" TEXT NOT NULL,
    "dispensedItems" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DrugDispensal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "recordData" TEXT,
    "attachments" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "genericName" TEXT,
    "brandName" TEXT,
    "category" TEXT,
    "manufacturer" TEXT,
    "batchNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "wholeSalePrice" DOUBLE PRECISION NOT NULL,
    "retailPrice" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reorderLevel" INTEGER,
    "maxStockLevel" INTEGER,
    "taxRate" INTEGER NOT NULL,
    "unit" "unit" NOT NULL,
    "description" TEXT NOT NULL,
    "dosageForm" TEXT,
    "strength" TEXT,
    "requiresPrescription" BOOLEAN NOT NULL DEFAULT true,
    "controlledSubstance" BOOLEAN NOT NULL DEFAULT false,
    "storageConditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "taxRate" DOUBLE PRECISION NOT NULL,
    "subTotal" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "amountPaid" DOUBLE PRECISION,
    "grandTotal" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "referenceNo" TEXT NOT NULL,
    "supplierId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseItem" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "cost" DOUBLE PRECISION NOT NULL,
    "productName" TEXT,
    "selectedPrice" DOUBLE PRECISION NOT NULL,
    "priceType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "profit" DOUBLE PRECISION NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "purchaseId" TEXT,
    "customRetailPrice" DOUBLE PRECISION,
    "customWholesalePrice" DOUBLE PRECISION,
    "expiryDate" TIMESTAMP(3),
    "batchNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BalanceTransaction" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "reference" TEXT,
    "prescriptionId" TEXT,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BalanceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "companyName" TEXT,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptSettings" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "receiptTitle" TEXT,
    "headerMessage" TEXT,
    "footerMessage" TEXT,
    "showLogo" BOOLEAN DEFAULT true,
    "logoUrl" TEXT,
    "showQrCode" BOOLEAN DEFAULT true,
    "qrCodeContent" TEXT DEFAULT 'website',
    "customQrContent" TEXT,
    "showStudentInfo" BOOLEAN DEFAULT true,
    "showPhysicianInfo" BOOLEAN DEFAULT true,
    "showPharmacistInfo" BOOLEAN DEFAULT true,
    "showDrugCodes" BOOLEAN DEFAULT true,
    "showDrugDescriptions" BOOLEAN DEFAULT true,
    "showDosageInstructions" BOOLEAN DEFAULT true,
    "showTimestamp" BOOLEAN DEFAULT true,
    "use24HourFormat" BOOLEAN DEFAULT false,
    "paperSize" TEXT DEFAULT '80mm',
    "fontSize" TEXT DEFAULT 'normal',
    "printDensity" TEXT DEFAULT 'normal',
    "lineSpacing" TEXT DEFAULT 'normal',
    "primaryColor" TEXT DEFAULT '#000000',
    "accentColor" TEXT DEFAULT '#666666',
    "fontFamily" TEXT DEFAULT 'monospace',
    "printCopyCount" INTEGER DEFAULT 1,
    "autoPrint" BOOLEAN DEFAULT false,
    "language" TEXT DEFAULT 'en',
    "currency" TEXT DEFAULT 'NGN',
    "currencySymbol" TEXT DEFAULT '₦',
    "currencyPosition" TEXT DEFAULT 'before',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ReceiptSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drug" (
    "id" TEXT NOT NULL,
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
    "price" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'Pieces',
    "storageConditions" TEXT,
    "prescriptionRequired" BOOLEAN NOT NULL DEFAULT false,
    "supplier" TEXT,
    "isDisposed" BOOLEAN NOT NULL DEFAULT false,
    "disposalDate" TIMESTAMP(3),
    "disposalMethod" TEXT,
    "disposalReason" TEXT,
    "disposalNotes" TEXT,
    "disposedBy" TEXT,
    "createdBy" TEXT,
    "lastStockUpdate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Drug_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DrugCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugStockMovement" (
    "id" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "balanceAfter" INTEGER NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL DEFAULT 'system',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrugStockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugDisposal" (
    "id" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "disposalMethod" TEXT NOT NULL,
    "disposalReason" TEXT NOT NULL,
    "notes" TEXT,
    "warehouseId" TEXT NOT NULL,
    "disposedBy" TEXT NOT NULL,
    "disposalDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrugDisposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "superAdmin_email_key" ON "superAdmin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_userName_key" ON "users"("userName");

-- CreateIndex
CREATE UNIQUE INDEX "Student_matricNumber_key" ON "Student"("matricNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Physician_staffId_key" ON "Physician"("staffId");

-- CreateIndex
CREATE INDEX "Queue_status_idx" ON "Queue"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_appointmentNo_key" ON "Appointment"("appointmentNo");

-- CreateIndex
CREATE UNIQUE INDEX "Consultation_consultationNo_key" ON "Consultation"("consultationNo");

-- CreateIndex
CREATE INDEX "Consultation_status_idx" ON "Consultation"("status");

-- CreateIndex
CREATE INDEX "Consultation_physicianId_status_idx" ON "Consultation"("physicianId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_prescriptionNo_key" ON "Prescription"("prescriptionNo");

-- CreateIndex
CREATE INDEX "Prescription_status_idx" ON "Prescription"("status");

-- CreateIndex
CREATE INDEX "Prescription_status_priority_idx" ON "Prescription"("status", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "DrugDispensal_dispensalNo_key" ON "DrugDispensal"("dispensalNo");

-- CreateIndex
CREATE INDEX "DrugDispensal_createdAt_idx" ON "DrugDispensal"("createdAt");

-- CreateIndex
CREATE INDEX "MedicalRecord_studentId_recordType_idx" ON "MedicalRecord"("studentId", "recordType");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_referenceNo_key" ON "Purchase"("referenceNo");

-- CreateIndex
CREATE INDEX "DrugStockMovement_drugId_createdAt_idx" ON "DrugStockMovement"("drugId", "createdAt");

-- CreateIndex
CREATE INDEX "DrugStockMovement_warehouseId_createdAt_idx" ON "DrugStockMovement"("warehouseId", "createdAt");

-- CreateIndex
CREATE INDEX "DrugDisposal_drugId_idx" ON "DrugDisposal"("drugId");

-- CreateIndex
CREATE INDEX "DrugDisposal_warehouseId_disposalDate_idx" ON "DrugDisposal"("warehouseId", "disposalDate");

-- AddForeignKey
ALTER TABLE "Queue" ADD CONSTRAINT "Queue_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_physicianId_fkey" FOREIGN KEY ("physicianId") REFERENCES "Physician"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalSigns" ADD CONSTRAINT "VitalSigns_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalSigns" ADD CONSTRAINT "VitalSigns_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_physicianId_fkey" FOREIGN KEY ("physicianId") REFERENCES "Physician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_physicianId_fkey" FOREIGN KEY ("physicianId") REFERENCES "Physician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("prescriptionNo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugDispensal" ADD CONSTRAINT "DrugDispensal_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("referenceNo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceTransaction" ADD CONSTRAINT "BalanceTransaction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugStockMovement" ADD CONSTRAINT "DrugStockMovement_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugDisposal" ADD CONSTRAINT "DrugDisposal_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
