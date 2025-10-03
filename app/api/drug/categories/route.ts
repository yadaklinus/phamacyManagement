import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

// Get all drug categories with statistics
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const warehousesId = searchParams.get('warehouseId');
    
    if (!warehousesId) {
      return NextResponse.json({
        success: false,
        error: 'Warehouse ID is required'
      }, { status: 400 });
    }

    // Get all drugs with categories
    const drugs = await prisma.product.findMany({
      where: {
        warehousesId,
        isDeleted: false
      },
      select: {
        id: true,
        category: true,
        quantity: true,
        retailPrice: true,
        cost: true,
        reorderLevel: true,
        expiryDate: true
      }
    });

    // Group drugs by category and calculate statistics
    const categoryStats = new Map();
    
    drugs.forEach(drug => {
      const category = drug.category || 'Uncategorized';
      
      if (!categoryStats.has(category)) {
        categoryStats.set(category, {
          name: category,
          totalDrugs: 0,
          totalQuantity: 0,
          totalValue: 0,
          totalCostValue: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
          expiredCount: 0,
          expiringSoonCount: 0
        });
      }
      
      const stats = categoryStats.get(category);
      stats.totalDrugs++;
      stats.totalQuantity += drug.quantity;
      stats.totalValue += drug.retailPrice * drug.quantity;
      stats.totalCostValue += drug.cost * drug.quantity;
      
      // Stock status
      if (drug.quantity === 0) {
        stats.outOfStockCount++;
      } else if (drug.quantity <= (drug.reorderLevel || 0)) {
        stats.lowStockCount++;
      }
      
      // Expiry status
      if (drug.expiryDate) {
        const today = new Date();
        const diffTime = drug.expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          stats.expiredCount++;
        } else if (diffDays <= 30) {
          stats.expiringSoonCount++;
        }
      }
    });

    // Convert map to array and sort by total drugs
    const categories = Array.from(categoryStats.values()).sort((a, b) => b.totalDrugs - a.totalDrugs);

    // Calculate overall statistics
    const overallStats = {
      totalCategories: categories.length,
      totalDrugs: drugs.length,
      totalValue: categories.reduce((sum, cat) => sum + cat.totalValue, 0),
      totalCostValue: categories.reduce((sum, cat) => sum + cat.totalCostValue, 0),
      categoriesWithAlerts: categories.filter(cat => 
        cat.lowStockCount > 0 || cat.outOfStockCount > 0 || 
        cat.expiredCount > 0 || cat.expiringSoonCount > 0
      ).length
    };

    return NextResponse.json({
      success: true,
      data: {
        categories,
        overallStats
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Get categories API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch categories',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Update drug categories (bulk update)
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
      if (!update.drugId || !update.category) {
        return NextResponse.json({
          success: false,
          error: 'Each update must have drugId and category'
        }, { status: 400 });
      }
    }

    // Update categories in transaction
    const results = await prisma.$transaction(
      updates.map(update => 
        prisma.product.update({
          where: { 
            id: update.drugId,
            warehousesId: warehouseId
          },
          data: {
            category: update.category,
            updatedAt: new Date(),
            sync: false
          }
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Updated categories for ${results.length} drugs`,
      data: results
    }, { status: 200 });

  } catch (error) {
    console.error('Update categories API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update categories',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}