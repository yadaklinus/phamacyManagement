import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

export async function POST(req: NextRequest) {
    const {
        items,
        quotationNo,
        subtotal,
        totalDiscount,
        taxRate,
        taxAmount,
        grandTotal,
        notes,
        validUntil,
        warehouseId,
        customer
    } = await req.json()

    try {
        const warehouse = await prisma.warehouses.findUnique({
            where: { warehouseCode: warehouseId, isDeleted: false }
        })

        if (!warehouse) return NextResponse.json("Warehouse does not exist", { status: 401 })

        // Create quotation
        const quotation = await prisma.quotation.create({
            data: {
                quotationNo,
                subTotal: subtotal,
                taxRate,
                notes,
                grandTotal,
                validUntil: validUntil ? new Date(validUntil) : null,
                warehousesId: warehouseId,
                selectedCustomerId: customer.id,
                status: "pending"
            }
        })

        // Validate items
        for (let j = 0; j < items.length; j++) {
            if (items[j].quantity < 0) {
                return NextResponse.json("Invalid quantity", { status: 500 })
            }
        }

        // Create quotation items
        const quotationItems = items.map((item: any) => ({
            quotationId: quotation.quotationNo,
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

        return NextResponse.json({ 
            message: "Quotation created successfully", 
            quotation: quotation 
        }, { status: 201 })

    } catch (error) {
        console.error("Error creating quotation:", error)
        return NextResponse.json("Error creating quotation", { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const warehouseId = searchParams.get('warehouseId')
    const quotationNo = searchParams.get('quotationNo')

    try {
        if (quotationNo) {
            // Get specific quotation
            const quotation = await prisma.quotation.findUnique({
                where: { quotationNo, isDeleted: false },
                include: {
                    quotationItems: {
                        where: { isDeleted: false },
                        include: { product: true }
                    },
                    selectedCustomer: true,
                    warehouses: true
                }
            })

            if (!quotation) {
                return NextResponse.json("Quotation not found", { status: 404 })
            }

            return NextResponse.json(quotation)
        } else if (warehouseId) {
            // Get all quotations for warehouse
            const quotations = await prisma.quotation.findMany({
                where: { warehousesId: warehouseId, isDeleted: false },
                include: {
                    selectedCustomer: true,
                    quotationItems: {
                        where: { isDeleted: false }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })

            return NextResponse.json(quotations)
        } else {
            return NextResponse.json("Missing required parameters", { status: 400 })
        }
    } catch (error) {
        console.error("Error fetching quotations:", error)
        return NextResponse.json("Error fetching quotations", { status: 500 })
    }
}