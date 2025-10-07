import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

export async function POST(req: NextRequest) {
    const { warehouseId: warehousesId, search = "", page = 1, limit = 50 } = await req.json();
    
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

        const whereCondition = {
            warehousesId,
            isDeleted: false,
            ...searchConditions
        };

        // Get products with pagination
        const [products, totalCount] = await Promise.all([
            prisma.product.findMany({
                where: whereCondition,
                orderBy: [
                    { name: 'asc' }
                ],
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    barcode: true,
                    cost: true,
                    wholeSalePrice: true,
                    retailPrice: true,
                    quantity: true,
                    unit: true,
                    taxRate: true,
                    description: true
                }
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
                hasPrev: page > 1
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Product search error:', error);
        return NextResponse.json({ error: 'Failed to search products' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}