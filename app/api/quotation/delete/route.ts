import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const quotationNo = searchParams.get('quotationNo')

    try {
        if (!quotationNo) {
            return NextResponse.json("Quotation number is required", { status: 400 })
        }

        // Check if quotation exists
        const quotation = await prisma.quotation.findUnique({
            where: { quotationNo, isDeleted: false }
        })

        if (!quotation) {
            return NextResponse.json("Quotation not found", { status: 404 })
        }

        if (quotation.status === "converted") {
            return NextResponse.json("Cannot delete converted quotation", { status: 400 })
        }

        // Soft delete quotation and its items
        await prisma.$transaction([
            prisma.quotation.update({
                where: { quotationNo },
                data: { isDeleted: true }
            }),
            prisma.quotationItem.updateMany({
                where: { quotationId: quotationNo },
                data: { isDeleted: true }
            })
        ])

        return NextResponse.json({
            message: "Quotation deleted successfully"
        })

    } catch (error) {
        console.error("Error deleting quotation:", error)
        return NextResponse.json("Error deleting quotation", { status: 500 })
    }
}