import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";


export async function POST(req: NextRequest) {
    const settings = await req.json()
    const { warehousesId, ...settingsData } = settings

    try {
        const update = await prisma.receiptSettings.upsert({
            where: { warehousesId,isDeleted:false },
            update: {
                ...settingsData,
                updatedAt: new Date()
            },
            create: {
                ...settingsData,
                warehousesId,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        })

        return NextResponse.json(update, { status: 200 })
    } catch (error) {
        console.error("Error saving receipt settings:", error)
        return NextResponse.json({ error: "Failed to save receipt settings" }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const warehousesId = searchParams.get('warehousesId')

    if (!warehousesId) {
        return NextResponse.json({ error: "warehousesId is required" }, { status: 400 })
    }

    try {
        const settings = await prisma.receiptSettings.findUnique({
            where: { warehousesId,isDeleted:false }
        })

        return NextResponse.json(settings, { status: 200 })
    } catch (error) {
        console.error("Error fetching receipt settings:", error)
        return NextResponse.json({ error: "Failed to fetch receipt settings" }, { status: 500 })
    }
}