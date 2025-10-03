import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

interface DrugImportRow {
  name: string;
  barcode: string;
  genericName?: string;
  brandName?: string;
  category?: string;
  manufacturer?: string;
  batchNumber?: string;
  expiryDate?: string;
  wholeSalePrice: number;
  retailPrice: number;
  cost: number;
  quantity: number;
  reorderLevel?: number;
  maxStockLevel?: number;
  taxRate?: number;
  unit?: string;
  description?: string;
  dosageForm?: string;
  strength?: string;
  requiresPrescription?: boolean;
  controlledSubstance?: boolean;
  storageConditions?: string;
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  errors: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  duplicates: Array<{
    row: number;
    barcode: string;
    existingDrugName: string;
  }>;
  importedDrugs: Array<{
    id: string;
    name: string;
    barcode: string;
  }>;
}

// Validate and parse CSV row data
function validateAndParseRow(rowData: any, rowIndex: number): { isValid: boolean; drug?: DrugImportRow; error?: string } {
  try {
    // Required fields validation
    const requiredFields = ['name', 'barcode', 'retailPrice', 'cost', 'quantity'];
    for (const field of requiredFields) {
      if (!rowData[field] && rowData[field] !== 0) {
        return {
          isValid: false,
          error: `Missing required field: ${field}`
        };
      }
    }

    // Parse and validate numeric fields
    const retailPrice = parseFloat(rowData.retailPrice);
    const cost = parseFloat(rowData.cost);
    const quantity = parseInt(rowData.quantity);
    const wholeSalePrice = rowData.wholeSalePrice ? parseFloat(rowData.wholeSalePrice) : retailPrice * 0.8;

    if (isNaN(retailPrice) || retailPrice < 0) {
      return { isValid: false, error: 'Invalid retail price' };
    }
    if (isNaN(cost) || cost < 0) {
      return { isValid: false, error: 'Invalid cost' };
    }
    if (isNaN(quantity) || quantity < 0) {
      return { isValid: false, error: 'Invalid quantity' };
    }

    // Parse optional numeric fields
    const reorderLevel = rowData.reorderLevel ? parseInt(rowData.reorderLevel) : undefined;
    const maxStockLevel = rowData.maxStockLevel ? parseInt(rowData.maxStockLevel) : undefined;
    const taxRate = rowData.taxRate ? parseInt(rowData.taxRate) : 0;

    // Parse boolean fields
    const requiresPrescription = rowData.requiresPrescription !== undefined 
      ? ['true', '1', 'yes', 'y'].includes(String(rowData.requiresPrescription).toLowerCase())
      : true;
    const controlledSubstance = rowData.controlledSubstance !== undefined
      ? ['true', '1', 'yes', 'y'].includes(String(rowData.controlledSubstance).toLowerCase())
      : false;

    // Parse date field
    let expiryDate: string | undefined;
    if (rowData.expiryDate) {
      const parsedDate = new Date(rowData.expiryDate);
      if (isNaN(parsedDate.getTime())) {
        return { isValid: false, error: 'Invalid expiry date format' };
      }
      expiryDate = parsedDate.toISOString();
    }

    const drug: DrugImportRow = {
      name: String(rowData.name).trim(),
      barcode: String(rowData.barcode).trim(),
      genericName: rowData.genericName ? String(rowData.genericName).trim() : undefined,
      brandName: rowData.brandName ? String(rowData.brandName).trim() : undefined,
      category: rowData.category ? String(rowData.category).trim() : undefined,
      manufacturer: rowData.manufacturer ? String(rowData.manufacturer).trim() : undefined,
      batchNumber: rowData.batchNumber ? String(rowData.batchNumber).trim() : undefined,
      expiryDate,
      wholeSalePrice,
      retailPrice,
      cost,
      quantity,
      reorderLevel,
      maxStockLevel,
      taxRate,
      unit: rowData.unit || 'piece',
      description: rowData.description ? String(rowData.description).trim() : '',
      dosageForm: rowData.dosageForm ? String(rowData.dosageForm).trim() : undefined,
      strength: rowData.strength ? String(rowData.strength).trim() : undefined,
      requiresPrescription,
      controlledSubstance,
      storageConditions: rowData.storageConditions ? String(rowData.storageConditions).trim() : undefined
    };

    return { isValid: true, drug };
  } catch (error) {
    return {
      isValid: false,
      error: `Row parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { csvData, warehouseId, options = {} } = await req.json();
    
    if (!csvData || !Array.isArray(csvData)) {
      return NextResponse.json({
        success: false,
        error: 'CSV data is required and must be an array'
      }, { status: 400 });
    }

    if (!warehouseId) {
      return NextResponse.json({
        success: false,
        error: 'Warehouse ID is required'
      }, { status: 400 });
    }

    const {
      skipDuplicates = true,
      updateExisting = false,
      validateOnly = false
    } = options;

    const result: ImportResult = {
      success: false,
      totalRows: csvData.length,
      successfulImports: 0,
      failedImports: 0,
      errors: [],
      duplicates: [],
      importedDrugs: []
    };

    // Validate all rows first
    const validatedRows: Array<{ row: number; drug: DrugImportRow }> = [];
    
    for (let i = 0; i < csvData.length; i++) {
      const validation = validateAndParseRow(csvData[i], i + 1);
      
      if (!validation.isValid) {
        result.errors.push({
          row: i + 1,
          data: csvData[i],
          error: validation.error!
        });
        result.failedImports++;
        continue;
      }
      
      validatedRows.push({ row: i + 1, drug: validation.drug! });
    }

    // Check for duplicates in database
    const barcodes = validatedRows.map(item => item.drug.barcode);
    const existingDrugs = await prisma.product.findMany({
      where: {
        barcode: { in: barcodes },
        warehousesId: warehouseId,
        isDeleted: false
      },
      select: {
        id: true,
        barcode: true,
        name: true
      }
    });

    const existingBarcodes = new Set(existingDrugs.map(drug => drug.barcode));
    
    // Filter out duplicates or prepare for updates
    const rowsToProcess = validatedRows.filter(item => {
      if (existingBarcodes.has(item.drug.barcode)) {
        const existingDrug = existingDrugs.find(d => d.barcode === item.drug.barcode);
        result.duplicates.push({
          row: item.row,
          barcode: item.drug.barcode,
          existingDrugName: existingDrug?.name || 'Unknown'
        });
        
        if (!updateExisting && skipDuplicates) {
          result.failedImports++;
          return false;
        }
        return updateExisting;
      }
      return true;
    });

    // If validation only, return results without importing
    if (validateOnly) {
      result.success = result.errors.length === 0;
      return NextResponse.json({
        success: true,
        message: 'Validation completed',
        data: result
      }, { status: 200 });
    }

    // Process imports/updates
    const importOperations = [];
    
    for (const item of rowsToProcess) {
      const { drug } = item;
      
      try {
        if (updateExisting && existingBarcodes.has(drug.barcode)) {
          // Update existing drug
          const existingDrug = existingDrugs.find(d => d.barcode === drug.barcode);
          if (existingDrug) {
            const updateOperation = prisma.product.update({
              where: { id: existingDrug.id },
              data: {
                name: drug.name,
                genericName: drug.genericName,
                brandName: drug.brandName,
                category: drug.category,
                manufacturer: drug.manufacturer,
                batchNumber: drug.batchNumber,
                expiryDate: drug.expiryDate ? new Date(drug.expiryDate) : null,
                wholeSalePrice: drug.wholeSalePrice,
                retailPrice: drug.retailPrice,
                cost: drug.cost,
                quantity: drug.quantity,
                reorderLevel: drug.reorderLevel,
                maxStockLevel: drug.maxStockLevel,
                taxRate: drug.taxRate,
                unit: drug.unit as any,
                description: drug.description,
                dosageForm: drug.dosageForm,
                strength: drug.strength,
                requiresPrescription: drug.requiresPrescription,
                controlledSubstance: drug.controlledSubstance,
                storageConditions: drug.storageConditions,
                updatedAt: new Date(),
                sync: false
              }
            });
            importOperations.push(updateOperation);
          }
        } else {
          // Create new drug
          const createOperation = prisma.product.create({
            data: {
              name: drug.name,
              barcode: drug.barcode,
              genericName: drug.genericName,
              brandName: drug.brandName,
              category: drug.category,
              manufacturer: drug.manufacturer,
              batchNumber: drug.batchNumber,
              expiryDate: drug.expiryDate ? new Date(drug.expiryDate) : null,
              wholeSalePrice: drug.wholeSalePrice,
              retailPrice: drug.retailPrice,
              cost: drug.cost,
              quantity: drug.quantity,
              reorderLevel: drug.reorderLevel,
              maxStockLevel: drug.maxStockLevel,
              taxRate: drug.taxRate || 0,
              unit: drug.unit as any,
              description: drug.description || '',
              dosageForm: drug.dosageForm,
              strength: drug.strength,
              requiresPrescription: drug.requiresPrescription !== false,
              controlledSubstance: drug.controlledSubstance || false,
              storageConditions: drug.storageConditions,
              warehousesId: warehouseId,
              sync: false
            }
          });
          importOperations.push(createOperation);
        }
      } catch (error) {
        result.errors.push({
          row: item.row,
          data: drug,
          error: `Import error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        result.failedImports++;
      }
    }

    // Execute all operations in a transaction
    if (importOperations.length > 0) {
      const importedDrugs = await prisma.$transaction(importOperations);
      
      result.successfulImports = importedDrugs.length;
      result.importedDrugs = importedDrugs.map(drug => ({
        id: drug.id,
        name: drug.name,
        barcode: drug.barcode
      }));
    }

    result.success = result.successfulImports > 0 || result.errors.length === 0;

    return NextResponse.json({
      success: true,
      message: `Import completed. ${result.successfulImports} drugs imported successfully.`,
      data: result
    }, { status: 200 });

  } catch (error) {
    console.error('CSV import API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to import CSV data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}