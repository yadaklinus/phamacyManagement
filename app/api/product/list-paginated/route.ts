import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

export async function POST(req: NextRequest) {
    const { 
        warehouseId: warehousesId, 
        page = 1, 
        limit = 50, 
        search = "", 
        categoryFilter = "all", 
        statusFilter = "all" 
    } = await req.json();
    
    try {
        const skip = (page - 1) * limit;
        
        // Build search conditions
        const searchConditions = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ]
        } : {};

        // Build status conditions
        let statusConditions = {};
        if (statusFilter !== "all") {
            if (statusFilter === "out_of_stock") {
                statusConditions = { quantity: 0 };
            } else if (statusFilter === "low_stock") {
                statusConditions = { quantity: { gt: 0, lte: 5 } };
            } else if (statusFilter === "active") {
                statusConditions = { quantity: { gt: 5 } };
            }
        }

        const whereCondition = {
            warehousesId,
            isDeleted: false,
            ...searchConditions,
            ...statusConditions
        };

        // Get products with pagination
        const [products, totalCount] = await Promise.all([
            prisma.product.findMany({
                where: whereCondition,
                orderBy: [
                    { name: 'asc' }
                ],
                skip,
                take: limit
            }),
            prisma.product.count({
                where: whereCondition
            })
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json({
            products,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                hasNext: page < totalPages,
                hasPrev: page > 1,
                limit
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Product list error:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}