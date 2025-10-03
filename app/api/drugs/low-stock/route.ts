import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

export async function POST(req: NextRequest) {
  try {
    const { warehouseId } = await req.json();
    
    if (!warehouseId) {
      return NextResponse.json({ success: false, message: 'Warehouse ID is required' }, { status: 400 });
    }

    // Get drugs that are low stock (quantity <= reorderLevel) or out of stock
    const lowStockDrugs = await prisma.drug.findMany({
      where: {
        warehouseId,
        isDeleted: false,
        OR: [
          { quantity: { lte: prisma.drug.fields.reorderLevel } },
          { quantity: 0 }
        ]
      },
      orderBy: [
        { quantity: 'asc' }, // Out of stock first, then lowest quantities
        { name: 'asc' }
      ]
    });

    // Add calculated fields for better analysis
    const drugsWithAnalysis = lowStockDrugs.map(drug => {
      const stockPercentage = drug.reorderLevel > 0 ? (drug.quantity / drug.reorderLevel) * 100 : 0;
      
      // Calculate suggested order quantity
      const safetyStock = Math.ceil(drug.reorderLevel * 0.2); // 20% safety stock
      const averageUsage = 10; // Default average usage per month (could be calculated from history)
      const leadTimeDays = 7; // Assume 7 days lead time
      const leadTimeStock = Math.ceil((averageUsage / 30) * leadTimeDays);
      
      const suggestedOrderQuantity = Math.max(
        drug.reorderLevel * 2, // At least double the reorder level
        leadTimeStock + safetyStock,
        50 // Minimum order quantity
      );

      return {
        ...drug,
        stockPercentage: Math.round(stockPercentage),
        suggestedOrderQuantity,
        estimatedCost: suggestedOrderQuantity * drug.cost,
        averageUsage,
        daysUntilStockOut: drug.quantity > 0 ? Math.floor(drug.quantity / (averageUsage / 30)) : 0
      };
    });

    return NextResponse.json(drugsWithAnalysis, { status: 200 });
  } catch (error) {
    console.error('Error fetching low stock drugs:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch low stock drugs' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}