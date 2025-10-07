import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

export async function PATCH(req: NextRequest) {
    try {
        const {
            productId,
            retailPrice,
            wholesalePrice,
            warehouseId,
            costPrice,
            productQuantity
        } = await req.json()

        //console.log("Update request:", { productId, retailPrice, wholesalePrice, costPrice, productQuantity })

        // Validate required fields
        if (!productId || !warehouseId) {
            return NextResponse.json(
                { error: "Product ID and Warehouse ID are required" }, 
                { status: 400 }
            )
        }

        // Validate that at least one field is provided for update
        if (retailPrice === undefined && wholesalePrice === undefined && costPrice === undefined && productQuantity === undefined) {
            return NextResponse.json(
                { error: "At least one field (price or quantity) must be provided for update" }, 
                { status: 400 }
            )
        }

        // Verify warehouse exists
        const warehouse = await prisma.warehouses.findUnique({
            where: { warehouseCode: warehouseId, isDeleted: false }
        })
            
        if (!warehouse) {
            return NextResponse.json(
                { error: "Warehouse does not exist" }, 
                { status: 404 }
            )
        }

        // Find the product
        const existingProduct = await prisma.product.findFirst({
            where: {
                isDeleted: false,
                OR: [
                    { id: productId },
                    { barcode: productId }
                ],
                warehousesId: warehouseId
            }
        })

        if (!existingProduct) {
            return NextResponse.json(
                { error: "Product not found in this warehouse" }, 
                { status: 404 }
            )
        }

        // Prepare update data - only include fields that are provided
        const updateData: any = {
            sync: false,
            syncedAt: null,
            updatedAt: new Date()
        }

        if (retailPrice !== undefined && retailPrice !== "") {
            updateData.retailPrice = parseFloat(retailPrice)
        }
        if (wholesalePrice !== undefined && wholesalePrice !== "") {
            updateData.wholeSalePrice = parseFloat(wholesalePrice)
        }
        if (costPrice !== undefined && costPrice !== "") {
            updateData.cost = parseFloat(costPrice)
        }
        if (productQuantity !== undefined && productQuantity !== "") {
            updateData.quantity = parseInt(productQuantity)
        }

        // Update the product
        const updatedProduct = await prisma.product.update({
            where: { id: existingProduct.id },
            data: updateData
        })

        //console.log(`Product updated: ${existingProduct.id} - marked as unsynced`)

        return NextResponse.json({
            success: true,
            message: "Product updated successfully",
            product: {
                id: updatedProduct.id,
                name: updatedProduct.name,
                barcode: updatedProduct.barcode,
                retailPrice: updatedProduct.retailPrice,
                wholesalePrice: updatedProduct.wholeSalePrice,
                cost: updatedProduct.cost,
                quantity: updatedProduct.quantity,
                updatedFields: Object.keys(updateData).filter(key => !['sync', 'syncedAt', 'updatedAt'].includes(key))
            }
        }, { status: 200 })

    } catch (error) {
        console.error("Error updating product:", error)
        return NextResponse.json(
            { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" }, 
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect()
    }
}

// New endpoint for bulk updates
export async function POST(req: NextRequest) {
    try {
        const { products, warehouseId } = await req.json()

        if (!products || !Array.isArray(products) || products.length === 0) {
            return NextResponse.json(
                { error: "Products array is required" }, 
                { status: 400 }
            )
        }

        if (!warehouseId) {
            return NextResponse.json(
                { error: "Warehouse ID is required" }, 
                { status: 400 }
            )
        }

        // Verify warehouse exists
        const warehouse = await prisma.warehouses.findUnique({
            where: { warehouseCode: warehouseId, isDeleted: false }
        })
            
        if (!warehouse) {
            return NextResponse.json(
                { error: "Warehouse does not exist" }, 
                { status: 404 }
            )
        }

        const results = []
        const errors = []

        for (const productUpdate of products) {
            try {
                const { productId, retailPrice, wholesalePrice, costPrice, productQuantity } = productUpdate

                if (!productId) {
                    errors.push({ productId, error: "Product ID is required" })
                    continue
                }

                // Find the product
                const existingProduct = await prisma.product.findFirst({
                    where: {
                        isDeleted: false,
                        OR: [
                            { id: productId },
                            { barcode: productId }
                        ],
                        warehousesId: warehouseId
                    }
                })

                if (!existingProduct) {
                    errors.push({ productId, error: "Product not found in this warehouse" })
                    continue
                }

                // Prepare update data
                const updateData: any = {
                    sync: false,
                    syncedAt: null,
                    updatedAt: new Date()
                }

                if (retailPrice !== undefined && retailPrice !== "") {
                    updateData.retailPrice = parseFloat(retailPrice)
                }
                if (wholesalePrice !== undefined && wholesalePrice !== "") {
                    updateData.wholeSalePrice = parseFloat(wholesalePrice)
                }
                if (costPrice !== undefined && costPrice !== "") {
                    updateData.cost = parseFloat(costPrice)
                }
                if (productQuantity !== undefined && productQuantity !== "") {
                    updateData.quantity = parseInt(productQuantity)
                }

                // Skip if no fields to update
                const fieldsToUpdate = Object.keys(updateData).filter(key => !['sync', 'syncedAt', 'updatedAt'].includes(key))
                if (fieldsToUpdate.length === 0) {
                    continue
                }

                // Update the product
                const updatedProduct = await prisma.product.update({
                    where: { id: existingProduct.id },
                    data: updateData
                })

                results.push({
                    productId: existingProduct.id,
                    name: existingProduct.name,
                    barcode: existingProduct.barcode,
                    updatedFields: fieldsToUpdate,
                    success: true
                })

            } catch (error) {
                console.error(`Error updating product ${productUpdate.productId}:`, error)
                errors.push({ 
                    productId: productUpdate.productId, 
                    error: error instanceof Error ? error.message : "Update failed" 
                })
            }
        }

        return NextResponse.json({
            success: true,
            message: `Bulk update completed. ${results.length} products updated, ${errors.length} errors.`,
            results,
            errors,
            summary: {
                totalProcessed: products.length,
                successful: results.length,
                failed: errors.length
            }
        }, { status: 200 })

    } catch (error) {
        console.error("Error in bulk update:", error)
        return NextResponse.json(
            { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" }, 
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect()
    }
}