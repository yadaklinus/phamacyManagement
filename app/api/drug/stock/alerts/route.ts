import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

// Helper function to calculate stock status
function getStockStatus(quantity: number, reorderLevel: number) {
  if (quantity === 0) return 'out_of_stock';
  if (quantity <= reorderLevel) return 'low_stock';
  if (quantity <= reorderLevel * 1.1) return 'near_reorder';
  return 'in_stock';
}

// Helper function to calculate expiry status
function getExpiryStatus(expiryDate: Date | null) {
  if (!expiryDate) return 'no_expiry';
  
  const today = new Date();
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'expiring_soon';
  return 'valid';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const warehousesId = searchParams.get('warehouseId');
    const alertType = searchParams.get('type'); // 'stock', 'expiry', 'all'
    
    if (!warehousesId) {
      return NextResponse.json({
        success: false,
        error: 'Warehouse ID is required'
      }, { status: 400 });
    }

    // Get all active drugs
    const drugs = await prisma.product.findMany({
      where: {
        warehousesId,
        isDeleted: false
      },
      orderBy: [
        { quantity: 'asc' },
        { expiryDate: 'asc' }
      ]
    });

    // Categorize alerts
    const stockAlerts = {
      outOfStock: [] as any[],
      lowStock: [] as any[],
      nearReorder: [] as any[]
    };

    const expiryAlerts = {
      expired: [] as any[],
      expiringSoon: [] as any[]
    };

    drugs.forEach(drug => {
      const stockStatus = getStockStatus(drug.quantity, drug.reorderLevel || 0);
      const expiryStatus = getExpiryStatus(drug.expiryDate);

      // Calculate days until expiry
      let daysUntilExpiry = null;
      if (drug.expiryDate) {
        const today = new Date();
        const diffTime = drug.expiryDate.getTime() - today.getTime();
        daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      const enhancedDrug = {
        ...drug,
        stockStatus,
        expiryStatus,
        daysUntilExpiry,
        currentValue: drug.retailPrice * drug.quantity
      };

      // Stock alerts
      if (stockStatus === 'out_of_stock') {
        stockAlerts.outOfStock.push(enhancedDrug);
      } else if (stockStatus === 'low_stock') {
        stockAlerts.lowStock.push(enhancedDrug);
      } else if (stockStatus === 'near_reorder') {
        stockAlerts.nearReorder.push(enhancedDrug);
      }

      // Expiry alerts
      if (expiryStatus === 'expired') {
        expiryAlerts.expired.push(enhancedDrug);
      } else if (expiryStatus === 'expiring_soon') {
        expiryAlerts.expiringSoon.push(enhancedDrug);
      }
    });

    // Calculate summary statistics
    const summary = {
      totalDrugs: drugs.length,
      stockAlerts: {
        outOfStock: stockAlerts.outOfStock.length,
        lowStock: stockAlerts.lowStock.length,
        nearReorder: stockAlerts.nearReorder.length,
        total: stockAlerts.outOfStock.length + stockAlerts.lowStock.length + stockAlerts.nearReorder.length
      },
      expiryAlerts: {
        expired: expiryAlerts.expired.length,
        expiringSoon: expiryAlerts.expiringSoon.length,
        total: expiryAlerts.expired.length + expiryAlerts.expiringSoon.length
      },
      totalAlerts: stockAlerts.outOfStock.length + stockAlerts.lowStock.length + 
                   stockAlerts.nearReorder.length + expiryAlerts.expired.length + 
                   expiryAlerts.expiringSoon.length
    };

    // Filter response based on alert type
    let responseData: any = {
      summary,
      stockAlerts,
      expiryAlerts
    };

    if (alertType === 'stock') {
      responseData = {
        summary: { ...summary, expiryAlerts: undefined },
        stockAlerts
      };
    } else if (alertType === 'expiry') {
      responseData = {
        summary: { ...summary, stockAlerts: undefined },
        expiryAlerts
      };
    }

    return NextResponse.json({
      success: true,
      data: responseData
    }, { status: 200 });

  } catch (error) {
    console.error('Stock alerts API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch stock alerts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Update reorder levels for multiple drugs
export async function POST(req: NextRequest) {
  try {
    const { updates, warehouseId } = await req.json();
    
    if (!Array.isArray(updates) || !warehouseId) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request format. Expected updates array and warehouseId'
      }, { status: 400 });
    }

    // Validate updates format
    for (const update of updates) {
      if (!update.drugId || update.reorderLevel === undefined) {
        return NextResponse.json({
          success: false,
          error: 'Each update must have drugId and reorderLevel'
        }, { status: 400 });
      }
    }

    // Update reorder levels in transaction
    const results = await prisma.$transaction(
      updates.map(update => 
        prisma.product.update({
          where: { 
            id: update.drugId,
            warehousesId: warehouseId
          },
          data: {
            reorderLevel: parseInt(update.reorderLevel),
            maxStockLevel: update.maxStockLevel ? parseInt(update.maxStockLevel) : undefined,
            updatedAt: new Date(),
            sync: false
          }
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Updated reorder levels for ${results.length} drugs`,
      data: results
    }, { status: 200 });

  } catch (error) {
    console.error('Update reorder levels API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update reorder levels',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}