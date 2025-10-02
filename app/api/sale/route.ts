import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/oflinePrisma";

export async function POST(req:NextRequest){
    const {
        items,
        invoiceNo,
        subtotal,
        totalDiscount,
        taxRate,
        taxAmount,
        grandTotal,
        paymentMethods,
        amountPaid,
        balance,
        notes,
        cashier,
        warehouseId,
        customer
    } = await req.json()

   try {
    const warehouse = await prisma.warehouses.findUnique({where:{warehouseCode:warehouseId,isDeleted:false}})
            
    if(!warehouse) return NextResponse.json("werehous does not exisi",{status:401})

    const sale = await prisma.sale.create({
        data:{
            invoiceNo,
            subTotal:subtotal,
            taxRate,
            notes,
            amountPaid,
            grandTotal,
            paidAmount:grandTotal - balance,
            balance,
            warehousesId:warehouseId,
            selectedCustomerId:customer.id
        }
    })

    for(let j = 0; j < items.length; j++){
        if(items[j].quantity < 0){
            return NextResponse.json("Ivalid",{status:500})
        }
        
    }

    
    for (let i = 0; i < items.length; i++) {
        const savedSales = await prisma.saleItem.create({
            data:{
                saleId:sale.invoiceNo,
                productName:items[i].productName,
                productId:items[i].productId,
                cost:items[i].costPrice,
                selectedPrice:items[i].salePrice,
                priceType:items[i].priceType ,
                quantity:items[i].quantity,
                discount:items[i].discount,
                total:items[i].total,
                warehousesId:warehouseId,
                profit:items[i].salePrice - items[i].costPrice,
            }
        })
        //console.log(items[i].productId)
        await prisma.product.update({
            where:{id:items[i].productId,isDeleted:false},
            data:{quantity:{
                decrement:items[i].quantity,
                
            },
            sync:false
        }
        })
    }

    for (let j = 0; j < paymentMethods.length; j++) {
        await prisma.paymentMethod.create({
            data:{
                method:paymentMethods[j].method,
                amount:paymentMethods[j].amount,
                // notes:paymentMethods[j].notes,
                warehousesId:warehouseId,
                saleId:sale.invoiceNo
            }
        })
         
    }

    
    
    
    
    return NextResponse.json("data")
   } catch (error) {
    console.log(error)
    NextResponse.json(error,{status:500})
   }
}


export async function DELETE(req:NextRequest){
    const {saleId} = await req.json()
    try {
        const findSale = await prisma.sale.findMany({
            where:{invoiceNo:saleId,isDeleted:false}
        })
        if(!findSale){
            return NextResponse.json("Error",{status:500})
        }

        await prisma.sale.update({
            where:{invoiceNo:saleId},
            data:{isDeleted:true,sync:false}
        })
        return NextResponse.json("Done",{status:200})

    } catch (error) {
        return NextResponse.json(error,{status:500})
        
    }
}