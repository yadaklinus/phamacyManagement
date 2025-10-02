import { NextRequest, NextResponse } from "next/server";

import onlinePrisma from "@/lib/onlinePrisma";

export async function POST(req: NextRequest) {
    try {
        
        const {productId,warehouseId} = await req.json()

        if (!productId) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
        }

        // Get product details
        const product = await onlinePrisma.product_online.findUnique({
            where: { id: productId,isDeleted:false },
            include: {
                Warehouses_online: true
            }
        })

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 })
        }

        // Get all sales for this product
        const saleItems = await onlinePrisma.saleItem_online.findMany({
            where: { 
                product_onlineId:productId,
                isDeleted:false,
                ...(warehouseId && { warehousesId: warehouseId })
            },
            include: {
                Sale_online: {
                    include: {
                        Customer_online: true
                    }
                }
            },
            orderBy: {
                Sale_online: {
                    createdAt: 'desc'
                }
            }
        })

        // Get all purchases for this product
        const purchaseItems = await onlinePrisma.purchaseItem_online.findMany({
            where: { 
                productId,
                isDeleted:false,
                ...(warehouseId && { warehousesId: warehouseId })
            },
            include: {
                Purchase_online: {
                    include: {
                        Supplier_online: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Combine and format stock movements
        const stockMovements = []

        // Add sales (stock decrements)
        for (const saleItem of saleItems) {
            stockMovements.push({
                id: saleItem.id,
                type: 'SALE',
                date: saleItem.Sale_online?.createdAt || new Date(),
                quantity: -saleItem.quantity, // Negative for sales
                reference: saleItem.Sale_online?.invoiceNo || 'N/A',
                customer: saleItem.Sale_online?.Customer_online?.name || 'N/A',
                supplier: null,
                unitPrice: saleItem.selectedPrice,
                total: saleItem.total,
                notes: `Sale to ${saleItem.Sale_online?.Customer_online?.name || 'Customer'}`
            })
        }

        // Add purchases (stock increments)
        for (const purchaseItem of purchaseItems) {
            stockMovements.push({
                id: purchaseItem.id,
                type: 'PURCHASE',
                date: purchaseItem.Purchase_online?.createdAt || new Date(),
                quantity: purchaseItem.quantity, // Positive for purchases
                reference: purchaseItem.Purchase_online?.referenceNo || 'N/A',
                customer: null,
                supplier: purchaseItem.Purchase_online?.Supplier_online?.name || 'N/A',
                unitPrice: purchaseItem.cost,
                total: purchaseItem.total,
                notes: `Purchase from ${purchaseItem.Purchase_online?.Supplier_online?.name || 'Supplier'}`
            })
        }

        // Sort by date (newest first)
        stockMovements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        // Calculate running stock balance
        let runningBalance = product.quantity
        const movementsWithBalance = stockMovements.map((movement, i) => {
            const movementWithBalance = { ...movement, balanceAfter: runningBalance }
            runningBalance -= movement.quantity
            return movementWithBalance
        })

        return NextResponse.json({
            product: {
                id: product.id,
                name: product.name,
                barcode: product.barcode,
                currentStock: product.quantity,
                unit: product.unit,
                warehouse: product.Warehouses_online?.name || 'N/A'
            },
            movements: movementsWithBalance,
            summary: {
                totalSales: saleItems.reduce((sum, item) => sum + item.quantity, 0),
                totalPurchases: purchaseItems.reduce((sum, item) => sum + item.quantity, 0),
                totalMovements: stockMovements.length
            }
        },{status:200})

    } catch (error) {
        console.error("Error fetching stock tracking data:", error)
        return NextResponse.json({ error: "Failed to fetch stock tracking data" }, { status: 500 })
    }
}