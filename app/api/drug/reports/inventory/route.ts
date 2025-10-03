import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

interface InventoryReportFilters {
  warehouseId: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  includeDeleted?: boolean;
  groupBy?: 'category' | 'manufacturer' | 'expiry' | 'stock_status';
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
  if (diffDays <= 90) return 'expiring_later';
  return 'valid';
}

export async function POST(req: NextRequest) {
  try {
    const filters: InventoryReportFilters = await req.json();
    const {
      warehouseId: warehousesId,
      startDate,
      endDate,
      category,
      includeDeleted = false,
      groupBy
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

    // Get drugs with related data
    const drugs = await prisma.product.findMany({
      where: whereClause,
      include: {
        prescriptionItems: {
          where: {
            isDeleted: false
          },
          select: {
            quantityPrescribed: true,
            quantityDispensed: true,
            createdAt: true
          }
        },
        purchaseItem: {
          where: {
            isDeleted: false
          },
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

    // Calculate enhanced metrics for each drug
    const enhancedDrugs = drugs.map(drug => {
      const stockStatus = getStockStatus(drug.quantity, drug.reorderLevel || 0);
      const expiryStatus = getExpiryStatus(drug.expiryDate);
      
      // Calculate days until expiry
      let daysUntilExpiry = null;
      if (drug.expiryDate) {
        const today = new Date();
        const diffTime = drug.expiryDate.getTime() - today.getTime();
        daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Calculate prescription metrics
      const totalPrescribed = drug.prescriptionItems.reduce((sum, item) => sum + item.quantityPrescribed, 0);
      const totalDispensed = drug.prescriptionItems.reduce((sum, item) => sum + item.quantityDispensed, 0);
      
      // Calculate purchase metrics
      const totalPurchased = drug.purchaseItem.reduce((sum, item) => sum + item.quantity, 0);
      const averagePurchaseCost = drug.purchaseItem.length > 0 
        ? drug.purchaseItem.reduce((sum, item) => sum + item.cost, 0) / drug.purchaseItem.length 
        : drug.cost;

      // Calculate financial metrics
      const currentValue = drug.retailPrice * drug.quantity;
      const costValue = drug.cost * drug.quantity;
      const potentialProfit = currentValue - costValue;
      const turnoverRate = totalDispensed > 0 ? totalPurchased / totalDispensed : 0;

      return {
        ...drug,
        stockStatus,
        expiryStatus,
        daysUntilExpiry,
        metrics: {
          totalPrescribed,
          totalDispensed,
          totalPurchased,
          averagePurchaseCost,
          currentValue,
          costValue,
          potentialProfit,
          turnoverRate,
          stockLevel: drug.quantity,
          reorderLevel: drug.reorderLevel || 0,
          stockDifference: drug.quantity - (drug.reorderLevel || 0)
        },
        prescriptionItems: undefined,
        purchaseItem: undefined
      };
    });

    // Calculate overall statistics
    const overallStats = {
      totalDrugs: enhancedDrugs.length,
      totalQuantity: enhancedDrugs.reduce((sum, drug) => sum + drug.quantity, 0),
      totalValue: enhancedDrugs.reduce((sum, drug) => sum + drug.metrics.currentValue, 0),
      totalCostValue: enhancedDrugs.reduce((sum, drug) => sum + drug.metrics.costValue, 0),
      totalPotentialProfit: enhancedDrugs.reduce((sum, drug) => sum + drug.metrics.potentialProfit, 0),
      
      stockStatusBreakdown: {
        in_stock: enhancedDrugs.filter(d => d.stockStatus === 'in_stock').length,
        near_reorder: enhancedDrugs.filter(d => d.stockStatus === 'near_reorder').length,
        low_stock: enhancedDrugs.filter(d => d.stockStatus === 'low_stock').length,
        out_of_stock: enhancedDrugs.filter(d => d.stockStatus === 'out_of_stock').length
      },
      
      expiryStatusBreakdown: {
        valid: enhancedDrugs.filter(d => d.expiryStatus === 'valid').length,
        expiring_later: enhancedDrugs.filter(d => d.expiryStatus === 'expiring_later').length,
        expiring_soon: enhancedDrugs.filter(d => d.expiryStatus === 'expiring_soon').length,
        expired: enhancedDrugs.filter(d => d.expiryStatus === 'expired').length,
        no_expiry: enhancedDrugs.filter(d => d.expiryStatus === 'no_expiry').length
      }
    };

    // Group data if requested
    let groupedData = null;
    if (groupBy) {
      const groups = new Map();
      
      enhancedDrugs.forEach(drug => {
        let groupKey;
        switch (groupBy) {
          case 'category':
            groupKey = drug.category || 'Uncategorized';
            break;
          case 'manufacturer':
            groupKey = drug.manufacturer || 'Unknown';
            break;
          case 'expiry':
            groupKey = drug.expiryStatus;
            break;
          case 'stock_status':
            groupKey = drug.stockStatus;
            break;
          default:
            groupKey = 'All';
        }
        
        if (!groups.has(groupKey)) {
          groups.set(groupKey, {
            groupName: groupKey,
            drugs: [],
            count: 0,
            totalValue: 0,
            totalCostValue: 0,
            totalQuantity: 0
          });
        }
        
        const group = groups.get(groupKey);
        group.drugs.push(drug);
        group.count++;
        group.totalValue += drug.metrics.currentValue;
        group.totalCostValue += drug.metrics.costValue;
        group.totalQuantity += drug.quantity;
      });
      
      groupedData = Array.from(groups.values()).sort((a, b) => b.totalValue - a.totalValue);
    }

    const reportData = {
      metadata: {
        generatedAt: new Date(),
        filters,
        reportType: 'inventory_report'
      },
      overallStats,
      drugs: enhancedDrugs,
      ...(groupedData && { groupedData })
    };

    return NextResponse.json({
      success: true,
      data: reportData
    }, { status: 200 });

  } catch (error) {
    console.error('Inventory report API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate inventory report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}