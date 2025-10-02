import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/oflinePrisma";

// GET - Fetch customer activities (sales)
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: customerId } = await context.params

        // Fetch customer details
        const customer = await prisma.customer.findUnique({
            where: { id: customerId,isDeleted:false }
        })

       
        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 })
        }

        // Fetch customer sales with items
        const sales = await prisma.sale.findMany({
            where: {
                selectedCustomerId: customerId,isDeleted:false
            },
            include: {
                saleItems: {
                    include: {
                        product: true
                    }
                },
                paymentMethod: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Calculate totals
        const totalSales = sales.length
        const totalAmount = sales.reduce((sum, sale) => sum + sale.grandTotal, 0)
        const totalBalance = sales.reduce((sum, sale) => sum + sale.balance, 0)
        const totalPaid = sales.reduce((sum, sale) => sum + sale.paidAmount, 0)

        // Format activities for display
        const activities = sales.map(sale => ({
            id: sale.id,
            invoiceNo: sale.invoiceNo,
            date: sale.createdAt,
            type: 'SALE',
            description: `Sale - ${sale.saleItems.length} item(s)`,
            amount: sale.grandTotal,
            paidAmount: sale.paidAmount,
            balance: sale.balance,
            items: sale.saleItems.map(item => ({
                productName: item.productName,
                quantity: item.quantity,
                price: item.selectedPrice,
                total: item.total
            })),
            paymentMethods: sale.paymentMethod.map(pm => ({
                method: pm.method,
                amount: pm.amount
            }))
        }))

        return NextResponse.json({
            customer,
            activities,
            summary: {
                totalSales,
                totalAmount,
                totalPaid,
                totalBalance,
               
            }
        }, { status: 200 })

    } catch (error) {
        console.error("Error fetching customer activities:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}