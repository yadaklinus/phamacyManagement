
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";
import { markRelatedRecordsAsUnsynced } from "@/lib/sync-helpers";

export async function GET(req: NextRequest) {
    try {
        const purchases = await prisma.purchase.findMany({
            where: { isDeleted: false },
            include: {
                purchaseItem: true,
                Supplier: true
            }
        });
        
        return NextResponse.json(purchases, { status: 200 });
    } catch (error) {
        console.error("Purchase fetch error:", error);
        return NextResponse.json(error, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function POST(req: NextRequest) {
    const {
        items,
        referenceNo,
        subtotal,
        taxRate,
        taxAmount,
        shipping,
        grandTotal,
        paidAmount,
        balance,
        notes,
        warehouseId,
        supplierId,
        status
    } = await req.json()

    try {
        const warehouse = await prisma.warehouses.findUnique({
            where: { warehouseCode: warehouseId, isDeleted: false }
        })
            
        if (!warehouse) {
            return NextResponse.json("Warehouse does not exist", { status: 401 })
        }

        // Create the purchase with sync: false
        const purchase = await prisma.purchase.create({
            data: {
                referenceNo,
                subTotal: subtotal,
                taxRate,
                notes,
                amountPaid: paidAmount,
                grandTotal,
                paidAmount,
                balance,
                warehousesId: warehouseId,
                supplierId,
                sync: false, // New purchases should be marked as unsynced
                syncedAt: null
            }
        })

        const purchaseItemIds: string[] = [];
        const productIds: string[] = [];

        // Create purchase items and update product quantities
        for (let i = 0; i < items.length; i++) {
            const purchaseItem = await prisma.purchaseItem.create({
                data: {
                    purchaseId: purchase.referenceNo,
                    productName: items[i].productName,
                    productId: items[i].productId,
                    cost: items[i].cost,
                    selectedPrice: items[i].selectedPrice,
                    priceType: items[i].priceType,
                    quantity: items[i].quantity,
                    discount: items[i].discount,
                    total: items[i].total,
                    warehousesId: warehouseId,
                    profit: 0, // For purchases, profit is 0
                    sync: false, // New purchase items should be marked as unsynced
                    syncedAt: null
                }
            })

            purchaseItemIds.push(purchaseItem.id);
            productIds.push(items[i].productId);

           // console.log(`Processing product: ${items[i].productId} for purchase`);

            // Update product quantity (increase stock for purchases) and mark as unsynced
            await prisma.product.update({
                where: { id: items[i].productId, isDeleted: false },
                data: {
                    quantity: {
                        increment: items[i].quantity
                    },
                    sync: false, // Product quantity changed, needs sync
                    syncedAt: null,
                    updatedAt: new Date()
                }
            })
        }

        // Use the sync helper to mark all related records as unsynced
        await markRelatedRecordsAsUnsynced({
            type: 'purchase',
            entityId: purchase.referenceNo,
            relatedIds: {
                productIds,
                supplierId,
                purchaseItemIds
            }
        });

        //console.log(`Purchase created: ${purchase.referenceNo} with ${items.length} items - all related records marked as unsynced`);

        return NextResponse.json({ 
            message: "Purchase order created successfully",
            purchase: purchase,
            unsyncedRecords: {
                purchase: 1,
                purchaseItems: purchaseItemIds.length,
                products: productIds.length,
                supplier: supplierId ? 1 : 0
            }
        })
    } catch (error) {
        console.error("Purchase creation error:", error)
        return NextResponse.json(error, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}

export async function DELETE(req: NextRequest) {
    const { purchaseId } = await req.json();

    try {
        const findPurchase = await prisma.purchase.findFirst({
            where: { referenceNo: purchaseId, isDeleted: false },
            include: {
                purchaseItem: true
            }
        });

        if (!findPurchase) {
            return NextResponse.json("Purchase not found", { status: 404 });
        }

        // Get related IDs for sync tracking
        const purchaseItemIds = findPurchase.purchaseItem.map(item => item.id);
        const productIds = findPurchase.purchaseItem.map(item => item.productId).filter(Boolean) as string[];

        // Restore product quantities before marking purchase as deleted
        for (const purchaseItem of findPurchase.purchaseItem) {
            if (purchaseItem.productId) {
                await prisma.product.update({
                    where: { id: purchaseItem.productId },
                    data: {
                        quantity: {
                            decrement: purchaseItem.quantity // Remove the quantity that was added
                        },
                        sync: false, // Product quantity changed, needs sync
                        syncedAt: null,
                        updatedAt: new Date()
                    }
                });
            }
        }

        // Mark purchase as deleted and unsynced
        await prisma.purchase.update({
            where: { referenceNo: purchaseId },
            data: {
                isDeleted: true,
                sync: false, // Deletion needs to be synced
                syncedAt: null,
                updatedAt: new Date()
            }
        });

        // Mark related purchase items as deleted and unsynced
        await prisma.purchaseItem.updateMany({
            where: { purchaseId: purchaseId },
            data: {
                isDeleted: true,
                sync: false,
                syncedAt: null,
                updatedAt: new Date()
            }
        });

        //console.log(`Purchase deleted: ${purchaseId} - all related records marked as unsynced for deletion sync`);

        return NextResponse.json({
            message: "Purchase deleted successfully",
            purchaseId,
            restoredProducts: productIds.length,
            deletedPurchaseItems: purchaseItemIds.length
        }, { status: 200 });

    } catch (error) {
        console.error("Purchase deletion error:", error);
        return NextResponse.json(error, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}