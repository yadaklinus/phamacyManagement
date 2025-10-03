import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

interface ExportFilters {
  warehouseId: string;
  format: 'csv' | 'excel' | 'json';
  includeFields?: string[];
  category?: string;
  stockStatus?: string;
  expiryStatus?: string;
  includeDeleted?: boolean;
  startDate?: string;
  endDate?: string;
}

// Helper functions
function getStockStatus(quantity: number, reorderLevel: number) {
  if (quantity === 0) return 'out_of_stock';
  if (quantity <= reorderLevel) return 'low_stock';
  if (quantity <= reorderLevel * 1.1) return 'near_reorder';
  return 'in_stock';
}

function getExpiryStatus(expiryDate: Date | null) {
  if (!expiryDate) return 'no_expiry';
  
  const today = new Date();
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'expiring_soon';
  return 'valid';
}

function formatDateForExport(date: Date | null): string {
  if (!date) return '';
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

function formatCurrencyForExport(amount: number): string {
  return amount.toFixed(2);
}

export async function POST(req: NextRequest) {
  try {
    const filters: ExportFilters = await req.json();
    const {
      warehouseId: warehousesId,
      format = 'csv',
      includeFields,
      category,
      stockStatus,
      expiryStatus,
      includeDeleted = false,
      startDate,
      endDate
    } = filters;

    if (!warehousesId) {
      return NextResponse.json({
        success: false,
        error: 'Warehouse ID is required'
      }, { status: 400 });
    }

    // Build where clause
    const whereClause: any = {
      warehousesId,
      isDeleted: includeDeleted ? undefined : false
    };

    if (category && category !== 'all') {
      whereClause.category = category;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    // Get drugs with related data for comprehensive export
    const drugs = await prisma.product.findMany({
      where: whereClause,
      include: {
        prescriptionItems: {
          where: { isDeleted: false },
          select: {
            quantityPrescribed: true,
            quantityDispensed: true,
            unitPrice: true,
            createdAt: true
          }
        },
        purchaseItem: {
          where: { isDeleted: false },
          select: {
            quantity: true,
            cost: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Filter by stock status if specified
    let filteredDrugs = drugs;
    if (stockStatus && stockStatus !== 'all') {
      filteredDrugs = drugs.filter(drug => {
        const status = getStockStatus(drug.quantity, drug.reorderLevel || 0);
        return status === stockStatus;
      });
    }

    // Filter by expiry status if specified
    if (expiryStatus && expiryStatus !== 'all') {
      filteredDrugs = filteredDrugs.filter(drug => {
        const status = getExpiryStatus(drug.expiryDate);
        return status === expiryStatus;
      });
    }

    // Calculate enhanced data for each drug
    const enhancedDrugs = filteredDrugs.map(drug => {
      const stockStatus = getStockStatus(drug.quantity, drug.reorderLevel || 0);
      const expiryStatus = getExpiryStatus(drug.expiryDate);
      
      // Calculate days until expiry
      let daysUntilExpiry = null;
      if (drug.expiryDate) {
        const today = new Date();
        const diffTime = drug.expiryDate.getTime() - today.getTime();
        daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Calculate prescription and purchase metrics
      const totalPrescribed = drug.prescriptionItems.reduce((sum, item) => sum + item.quantityPrescribed, 0);
      const totalDispensed = drug.prescriptionItems.reduce((sum, item) => sum + item.quantityDispensed, 0);
      const totalRevenue = drug.prescriptionItems.reduce((sum, item) => sum + (item.quantityDispensed * item.unitPrice), 0);
      const totalPurchased = drug.purchaseItem.reduce((sum, item) => sum + item.quantity, 0);
      const averagePurchaseCost = drug.purchaseItem.length > 0 
        ? drug.purchaseItem.reduce((sum, item) => sum + item.cost, 0) / drug.purchaseItem.length 
        : drug.cost;

      // Calculate financial metrics
      const currentValue = drug.retailPrice * drug.quantity;
      const costValue = drug.cost * drug.quantity;
      const potentialProfit = currentValue - costValue;
      const profitMargin = drug.retailPrice > 0 ? ((drug.retailPrice - drug.cost) / drug.retailPrice * 100) : 0;

      return {
        // Basic Information
        drugId: drug.id,
        drugCode: drug.barcode,
        drugName: drug.name,
        genericName: drug.genericName || '',
        brandName: drug.brandName || '',
        category: drug.category || 'Uncategorized',
        manufacturer: drug.manufacturer || '',
        batchNumber: drug.batchNumber || '',
        
        // Drug Details
        dosageForm: drug.dosageForm || '',
        strength: drug.strength || '',
        unit: drug.unit,
        description: drug.description,
        storageConditions: drug.storageConditions || '',
        
        // Regulatory
        requiresPrescription: drug.requiresPrescription ? 'Yes' : 'No',
        controlledSubstance: drug.controlledSubstance ? 'Yes' : 'No',
        
        // Stock Information
        currentQuantity: drug.quantity,
        reorderLevel: drug.reorderLevel || 0,
        maxStockLevel: drug.maxStockLevel || '',
        stockStatus: stockStatus,
        stockDifference: drug.quantity - (drug.reorderLevel || 0),
        
        // Pricing
        costPrice: formatCurrencyForExport(drug.cost),
        wholesalePrice: formatCurrencyForExport(drug.wholeSalePrice),
        retailPrice: formatCurrencyForExport(drug.retailPrice),
        profitMargin: formatCurrencyForExport(profitMargin),
        taxRate: drug.taxRate,
        
        // Financial Metrics
        currentValue: formatCurrencyForExport(currentValue),
        costValue: formatCurrencyForExport(costValue),
        potentialProfit: formatCurrencyForExport(potentialProfit),
        
        // Expiry Information
        expiryDate: formatDateForExport(drug.expiryDate),
        daysUntilExpiry: daysUntilExpiry || '',
        expiryStatus: expiryStatus,
        
        // Usage Statistics
        totalPrescribed: totalPrescribed,
        totalDispensed: totalDispensed,
        totalRevenue: formatCurrencyForExport(totalRevenue),
        totalPurchased: totalPurchased,
        averagePurchaseCost: formatCurrencyForExport(averagePurchaseCost),
        turnoverRate: totalPurchased > 0 ? formatCurrencyForExport(totalDispensed / totalPurchased) : '0.00',
        
        // Timestamps
        createdAt: formatDateForExport(drug.createdAt),
        updatedAt: formatDateForExport(drug.updatedAt),
        
        // System Fields
        isDeleted: drug.isDeleted ? 'Yes' : 'No',
        isSynced: drug.sync ? 'Yes' : 'No'
      };
    });

    // Filter fields if specified
    let exportData = enhancedDrugs;
    if (includeFields && includeFields.length > 0) {
      exportData = enhancedDrugs.map(drug => {
        const filteredDrug: any = {};
        includeFields.forEach(field => {
          if (field in drug) {
            filteredDrug[field] = (drug as any)[field];
          }
        });
        return filteredDrug;
      });
    }

    // Generate export metadata
    const exportMetadata = {
      exportedAt: new Date().toISOString(),
      warehouseId: warehousesId,
      totalRecords: exportData.length,
      filters: {
        category: category || 'all',
        stockStatus: stockStatus || 'all',
        expiryStatus: expiryStatus || 'all',
        includeDeleted,
        dateRange: {
          start: startDate || null,
          end: endDate || null
        }
      },
      format,
      includeFields: includeFields || 'all'
    };

    // Return data based on format
    switch (format) {
      case 'json':
        return NextResponse.json({
          success: true,
          data: {
            metadata: exportMetadata,
            drugs: exportData
          }
        }, { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="drug_inventory_${new Date().toISOString().split('T')[0]}.json"`
          }
        });

      case 'csv':
      case 'excel':
      default:
        // For CSV/Excel, return the data array that can be processed by the frontend
        return NextResponse.json({
          success: true,
          data: exportData,
          metadata: exportMetadata
        }, { status: 200 });
    }

  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to export drug data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// GET method for simple export with query parameters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const warehousesId = searchParams.get('warehouseId');
    const format = searchParams.get('format') || 'csv';
    
    if (!warehousesId) {
      return NextResponse.json({
        success: false,
        error: 'Warehouse ID is required'
      }, { status: 400 });
    }

    // Simple export - just get basic drug data
    const drugs = await prisma.product.findMany({
      where: {
        warehousesId,
        isDeleted: false
      },
      orderBy: {
        name: 'asc'
      }
    });

    const exportData = drugs.map(drug => ({
      drugCode: drug.barcode,
      drugName: drug.name,
      category: drug.category || 'Uncategorized',
      quantity: drug.quantity,
      retailPrice: drug.retailPrice,
      expiryDate: drug.expiryDate ? formatDateForExport(drug.expiryDate) : '',
      stockStatus: getStockStatus(drug.quantity, drug.reorderLevel || 0)
    }));

    return NextResponse.json({
      success: true,
      data: exportData
    }, { status: 200 });

  } catch (error) {
    console.error('Simple export API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to export drug data'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}