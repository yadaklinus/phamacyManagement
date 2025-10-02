import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const warehouseId = searchParams.get('warehouseId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    try {
        if (!warehouseId) {
            return NextResponse.json("Warehouse ID is required", { status: 400 })
        }

        const skip = (page - 1) * limit

        // Build where clause
        const whereClause: any = {
            warehousesId: warehouseId,
            isDeleted: false
        }

        if (search) {
            whereClause.OR = [
                { quotationNo: { contains: search } },
                { selectedCustomer: { name: { contains: search } } },
                { notes: { contains: search } }
            ]
        }

        if (status) {
            whereClause.status = status
        }

        // Get quotations with pagination
        const [quotations, totalCount] = await Promise.all([
            prisma.quotation.findMany({
                where:{
                    isDeleted:false,
                    warehousesId: warehouseId,
                },
                include: {
                    selectedCustomer: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true
                        }
                    },
                    quotationItems: {
                        where: { isDeleted: false },
                        select: {
                            id: true,
                            productName: true,
                            quantity: true,
                            selectedPrice: true,
                            total: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.quotation.count({
                where:{
                    isDeleted:false,
                    warehousesId: warehouseId,
                },
            })
        ])

        const totalPages = Math.ceil(totalCount / limit)

        return NextResponse.json({
            quotations,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        })

    } catch (error) {
        console.error("Error fetching quotations list:", error)
        return NextResponse.json("Error fetching quotations", { status: 500 })
    }
}
