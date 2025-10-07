import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";
import { markProductAsUnsynced } from "@/lib/sync-helpers";

export async function GET(req:NextRequest){
    const warehouseId = await req.json()
    
    try {
        const products = await prisma.product.findMany({where:{isDeleted:false}})

        return NextResponse.json(products,{status:200})
    } catch (error) {
        return NextResponse.json(error,{status:500})
        
    }finally{
        await prisma.$disconnect()
    }
}

export async function POST(req:NextRequest){
    const {productName:name,productCode:barcode,productDescription:description,productQuantity:quantity,productTaxRate:taxRate,productUnit:unit,wholeSalePrice,retailPrice,costPrice:cost,warehouseId} = await req.json()
    try{
        
        const warehouse = await prisma.warehouses.findUnique({where:{warehouseCode:warehouseId,isDeleted:false}})
        
        if(!warehouse) return NextResponse.json("werehous does not exisi",{status:401})
            
        const checkProduct = await prisma.product.findMany({where:{barcode,warehousesId:warehouseId,isDeleted:false}})
       
        
        if(checkProduct.length > 0) return NextResponse.json("werehous Product Exist",{status:403})

        const product = await prisma.product.create({
            data:{
                name,
                barcode,
                wholeSalePrice:parseFloat(wholeSalePrice),
                retailPrice:parseFloat(retailPrice),
                cost:parseFloat(cost),
                taxRate:parseInt(taxRate),
                unit,
                quantity:parseInt(quantity),
                description:"product",
                warehousesId:warehouseId,
                sync: false, // New products should be marked as unsynced
                syncedAt: null
            }
        })

        //console.log(`New product created: ${product.id} - marked as unsynced`);
        
        return NextResponse.json(product,{status:201})
    }catch(error){
        
        return NextResponse.json(error,{status:500})
    }finally{
        await prisma.$disconnect()
    }
}

// Enable the PUT method for product updates
export async function PUT(req:NextRequest){
    const {productId, productName:name, productCode:barcode, productDescription:description, productQuantity:quantity, productTaxRate:taxRate, productUnit:unit, wholeSalePrice, retailPrice, costPrice:cost} = await req.json()
    
    try{  
        // Check if product exists
        const existingProduct = await prisma.product.findUnique({
            where: { id: productId, isDeleted: false }
        });
        
        if (!existingProduct) {
            return NextResponse.json("Product does not exist", {status: 404});
        }

        // Update the product
        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                name,
                barcode,
                wholeSalePrice: parseFloat(wholeSalePrice),
                retailPrice: parseFloat(retailPrice),
                cost: parseFloat(cost),
                taxRate: parseInt(taxRate),
                unit,
                quantity: parseInt(quantity),
                description,
                sync: false, // Mark as unsynced since it was updated
                syncedAt: null,
                updatedAt: new Date()
            }
        });

        //console.log(`Product updated: ${productId} - marked as unsynced`);
        
        return NextResponse.json(updatedProduct, {status: 200});
    } catch(error) {
        console.error("Product update error:", error);
        return NextResponse.json(error, {status: 500});
    } finally {
        await prisma.$disconnect();
    }
}

export async function DELETE(req:NextRequest){
    const {productId} = await req.json()
    try {
        const product = await prisma.product.findUnique({
            where:{
                id:productId
            }
        })

        if(!product) return NextResponse.json("product dose not exist",{status:402})

        const deleteProduct = await prisma.product.update({
            where:{
                id:productId
            },
            data:{
                isDeleted:true,
                sync: false, // Mark as unsynced to sync the deletion
                syncedAt: null,
                updatedAt: new Date()
            }
        })

       // console.log(`Product deleted: ${productId} - marked as unsynced for deletion sync`);

        return NextResponse.json(deleteProduct,{status:200})
    } catch (error) {
        return NextResponse.json(error,{status:500})
        
    }finally{
        await prisma.$disconnect()
    }
}