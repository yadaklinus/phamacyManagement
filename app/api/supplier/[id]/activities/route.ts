import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/oflinePrisma";

// GET - Fetch supplier activities (purchases)
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: supplierId } = await context.params

        // Fetch supplier details
        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId,isDeleted:false }
        })

        if (!supplier) {
            return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
        }

        // Fetch supplier purchases with items
        const purchases = await prisma.purchase.findMany({
            where: {
                supplierId: supplierId,isDeleted:false
            },
            include: {
                purchaseItem: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Calculate totals
        const totalPurchases = purchases.length
        const totalAmount = purchases.reduce((sum, purchase) => sum + purchase.grandTotal, 0)
        const totalBalance = purchases.reduce((sum, purchase) => sum + purchase.balance, 0)
        const totalPaid = purchases.reduce((sum, purchase) => sum + purchase.paidAmount, 0)

        // Format activities for display
        const activities = purchases.map(purchase => ({
            id: purchase.id,
            referenceNo: purchase.referenceNo,
            date: purchase.createdAt,
            type: 'PURCHASE',
            description: `Purchase - ${purchase.purchaseItem.length} item(s)`,
            amount: purchase.grandTotal,
            paidAmount: purchase.paidAmount,
            balance: purchase.balance,
            items: purchase.purchaseItem.map(item => ({
                productName: item.productName,
                quantity: item.quantity,
                price: item.selectedPrice,
                total: item.total,
                customRetailPrice: item.customRetailPrice,
                customWholesalePrice: item.customWholesalePrice
            }))
        }))

        return NextResponse.json({
            supplier,
            activities,
            summary: {
                totalPurchases,
                totalAmount,
                totalPaid,
                totalBalance
            }
        }, { status: 200 })

    } catch (error) {
        console.error("Error fetching supplier activities:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}