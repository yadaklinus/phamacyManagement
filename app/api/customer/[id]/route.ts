import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/oflinePrisma";

// GET - Fetch single customer
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params
        const customer = await prisma.customer.findUnique({
            where: {
                id: id,isDeleted:false
            }
        })

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 })
        }

        return NextResponse.json(customer, { status: 200 })
    } catch (error) {
        console.error("Error fetching customer:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}

// PUT - Update customer
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
            warehouseId
        } = await req.json()

        const updatedCustomer = await prisma.customer.update({
            where: {
                id: id
            },
            data: {
                name,
                type,
                companyName,
                email,
                address,
                phone,
                warehousesId: warehouseId
            }
        })

        return NextResponse.json(updatedCustomer, { status: 200 })
    } catch (error) {
        console.error("Error updating customer:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}

// DELETE - Delete customer
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params
        // Check if customer has any sales
        const customerSales = await prisma.sale.findMany({
            where: {
                selectedCustomerId: id
            }
        })

        if (customerSales.length > 0) {
            return NextResponse.json(
                { error: "Cannot delete customer with existing sales records" }, 
                { status: 400 }
            )
        }

        await prisma.customer.delete({
            where: {
                id: id
            }
        })

        return NextResponse.json({ message: "Customer deleted successfully" }, { status: 200 })
    } catch (error) {
        console.error("Error deleting customer:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}