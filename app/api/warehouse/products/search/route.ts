import { NextRequest, NextResponse } from "next/server";
import onlinePrisma from "@/lib/onlinePrisma";

export async function POST(req: NextRequest) {
  try {
    const { warehouseId, searchTerm, limit = 20 } = await req.json();

    if (!warehouseId) {
      return NextResponse.json(
        { error: "Warehouse ID is required" },
        { status: 400 }
      );
    }

    // Find warehouse by code or id - Corrected model name
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

    // Build search query
    const whereClause: any = {
      // Corrected relation field name
      warehouses_onlineId: warehouse.warehouseCode,
      isDeleted: false
    };

    if (searchTerm && searchTerm.trim()) {
      whereClause.OR = [
        {
          name: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          barcode: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Get the total count of products matching the criteria
    const total = await onlinePrisma.product_online.count({
        where: whereClause,
    });

    // Fetch the paginated/limited list of products - Corrected model name
    const products = await onlinePrisma.product_online.findMany({
      where: whereClause,
      take: parseInt(limit as string, 10),
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      products,
      total, // Return the actual total count
      warehouse: {
        id: warehouse.id,
        warehouseCode: warehouse.warehouseCode,
        name: warehouse.name
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    // Disconnecting the Prisma client is generally not recommended in serverless environments
    // as it can affect performance by closing and reopening connections for each request.
    // await onlinePrisma.$disconnect();
  }
}
