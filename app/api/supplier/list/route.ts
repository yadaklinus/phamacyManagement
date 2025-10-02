import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/oflinePrisma";

export async function POST(req: NextRequest) {
    const { warehouseId } = await req.json()

    try {
        const suppliers = await prisma.supplier.findMany({
            where: {
                warehousesId: warehouseId,isDeleted:false
            },
            orderBy: {
                name: 'asc'
            }
        })

        return NextResponse.json(suppliers)
    } catch (error) {
        console.log(error)
        return NextResponse.json(error, { status: 500 })
    }
}