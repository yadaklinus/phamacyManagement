import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

export async function PUT(req: NextRequest) {
    const {
        quotationNo,
        items,
        subtotal,
        totalDiscount,
        taxRate,
        taxAmount,
        grandTotal,
        notes,
        validUntil,
        warehouseId,
        customer,
        status
    } = await req.json()

    try {
        if (!quotationNo) {
            return NextResponse.json("Quotation number is required", { status: 400 })
        }

        // Check if quotation exists
        const existingQuotation = await prisma.quotation.findUnique({
            where: { quotationNo, isDeleted: false }
        })

        if (!existingQuotation) {
            return NextResponse.json("Quotation not found", { status: 404 })
        }

        if (existingQuotation.status === "converted") {
            return NextResponse.json("Cannot edit converted quotation", { status: 400 })
        }

        // Validate items
        for (let j = 0; j < items.length; j++) {
            if (items[j].quantity < 0) {
                return NextResponse.json("Invalid quantity", { status: 500 })
            }
        }

        // Update quotation in transaction
        await prisma.$transaction(async (prisma) => {
            // Update quotation
            await prisma.quotation.update({
                where: { quotationNo },
                data: {
                    subTotal: subtotal,
                    taxRate,
                    notes,
                    grandTotal,
                    validUntil: validUntil ? new Date(validUntil) : null,
                    selectedCustomerId: customer.id,
                    status: status || existingQuotation.status
                }
            })

            // Delete existing quotation items (soft delete)
            await prisma.quotationItem.updateMany({
                where: { quotationId: quotationNo },
                data: { isDeleted: true }
            })

            // Create new quotation items
            const quotationItems = items.map((item: any) => ({
                quotationId: quotationNo,
                productId: item.productId,
                productName: item.productName,
                cost: item.cost,
                selectedPrice: item.selectedPrice,
                priceType: item.priceType,
                quantity: item.quantity,
                discount: item.discount,
                total: item.total,
                warehousesId: warehouseId
            }))

            await prisma.quotationItem.createMany({
                data: quotationItems
            })
        })

        return NextResponse.json({
            message: "Quotation updated successfully"
        })

    } catch (error) {
        console.error("Error updating quotation:", error)
        return NextResponse.json("Error updating quotation", { status: 500 })
    }
}