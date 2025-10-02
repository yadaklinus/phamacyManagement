import { NextRequest, NextResponse } from "next/server";
import onlinePrisma from "@/lib/onlinePrisma";

export async function POST(
  req: NextRequest,
) {
  try {
   
   const {warehouseId, productId} = await req.json()

    //console.log(warehouseId)

    if (!warehouseId) {
      return NextResponse.json(
        { error: "Warehouse ID is required" },
        { status: 400 }
      )
    }

    // FIX: Corrected model name from 'warehouses_online' to 'Warehouses_online'
    const warehouse = await onlinePrisma.warehouses_online.findFirst({
      where: {
        OR: [
          { warehouseCode: warehouseId, isDeleted: false },
          { id: warehouseId, isDeleted: false }
        ]
      }
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: "Warehouse not found" },
        { status: 404 }
      );
    }

    // FIX: Corrected model name from 'product_online' to 'Product_online'
    const product = await onlinePrisma.product_online.findFirst({
      where: {
        id: productId as string,
        warehouses_onlineId: warehouse.warehouseCode,
        isDeleted: false
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // FIX: Corrected model name from 'saleItem_online' to 'SaleItem_online'
    const salesHistory = await onlinePrisma.saleItem_online.findMany({
      where: {
        product_onlineId: productId,
        Sale_online: {
          warehouses_onlineId: warehouse.warehouseCode,
          isDeleted: false
        }
      },
      include: {
        Sale_online: {
          include: {
            Customer_online: true
          }
        }
      },
      orderBy: {
        Sale_online: {
          createdAt: 'desc'
        }
      },
      take: 50
    });

    // FIX: Corrected model name from 'purchaseItem_online' to 'PurchaseItem_online'
    // FIX: Corrected field name from 'productId' to 'product_onlineId'
    const purchaseHistory = await onlinePrisma.purchaseItem_online.findMany({
      where: {
        product_onlineId: productId, // Corrected field
        Purchase_online: {
          warehouses_onlineId: warehouse.warehouseCode,
          isDeleted: false
        }
      },
      include: {
        Purchase_online: {
          include: {
            Supplier_online: true
          }
        }
      },
      orderBy: {
        Purchase_online: {
          createdAt: 'desc'
        }
      },
      take: 50
    });

    // --- LOGIC FIX: Corrected Statistics Calculation ---
    const totalSold = salesHistory.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalPurchased = purchaseHistory.reduce((sum, item) => sum + (item.quantity || 0), 0);
    // Revenue should be the sum of the 'total' field, not quantity * price
    const totalRevenue = salesHistory.reduce((sum, item) => sum + (item.total || 0), 0);
    const totalCost = purchaseHistory.reduce((sum, item) => sum + (item.total || 0), 0);
    const profit = totalRevenue - totalCost;

    // --- LOGIC FIX: Corrected Monthly Sales Data Aggregation ---
    const monthlyDataMap = new Map<string, { quantity: number; revenue: number }>();

    // Initialize map for the last 12 months to show months with zero sales
    for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        // Format as 'YYYY-MM'
        const monthKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        monthlyDataMap.set(monthKey, { quantity: 0, revenue: 0 });
    }

    salesHistory.forEach(item => {
        if (item.Sale_online?.createdAt) {
            const saleDate = item.Sale_online.createdAt;
            const monthKey = `${saleDate.getFullYear()}-${(saleDate.getMonth() + 1).toString().padStart(2, '0')}`;
            if (monthlyDataMap.has(monthKey)) {
                const current = monthlyDataMap.get(monthKey)!;
                current.quantity += item.quantity || 0;
                current.revenue += item.total || 0;
                monthlyDataMap.set(monthKey, current);
            }
        }
    });
    
    const monthlyData = Array.from(monthlyDataMap.entries()).map(([month, data]) => ({
      month,
      ...data
    }));

    const response = {
      product,
      statistics: {
        totalSold,
        totalPurchased,
        totalRevenue,
        totalCost,
        profit,
        currentStock: product.quantity,
        stockValue: product.quantity * product.cost
      },
      // Use the full history arrays and let the frontend slice if needed
      salesHistory,
      purchaseHistory,
      monthlyData,
      warehouse: {
        id: warehouse.id,
        warehouseCode: warehouse.warehouseCode,
        name: warehouse.name
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error("Error fetching product details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    // Manually disconnecting is not recommended in serverless environments
    // await onlinePrisma.$disconnect();
  }
}