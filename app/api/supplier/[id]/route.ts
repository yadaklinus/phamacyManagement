import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/oflinePrisma";

// GET - Fetch single supplier
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params
        const supplier = await prisma.supplier.findUnique({
            where: {
                id: id,isDeleted:false
            }
        })

        if (!supplier) {
            return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
        }

        return NextResponse.json(supplier, { status: 200 })
    } catch (error) {
        console.error("Error fetching supplier:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}

// PUT - Update supplier
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params
        const {
            name,
            type,
            companyName,
            email,
            address,
            phone,
            warehousesId
        } = await req.json()

        const updatedSupplier = await prisma.supplier.update({
            where: {
                id: id,isDeleted:false
            },
            data: {
                name,
                type,
                companyName,
                email,
                address,
                phone,
                warehousesId,
                sync:false
            }
        })

        return NextResponse.json(updatedSupplier, { status: 200 })
    } catch (error) {
        console.error("Error updating supplier:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}

// DELETE - Delete supplier
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params
        // Check if supplier has any purchases
        const supplierPurchases = await prisma.purchase.findMany({
            where: {
                supplierId: id,isDeleted:false
            }
        })

        if (supplierPurchases.length > 0) {
            return NextResponse.json(
                { error: "Cannot delete supplier with existing purchase records" }, 
                { status: 400 }
            )
        }

        await prisma.supplier.update({
            where: {
                id: id
            },
            data:{isDeleted:true,sync:false}
        })

        return NextResponse.json({ message: "Supplier deleted successfully" }, { status: 200 })
    } catch (error) {
        console.error("Error deleting supplier:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}