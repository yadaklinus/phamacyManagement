import { NextRequest, NextResponse } from "next/server";

import onlinePrisma from "@/lib/onlinePrisma";

export async function GET(){
   try {
    const warehouses = await onlinePrisma.warehouses_online.findMany({where:{isDeleted:false}})

    return NextResponse.json(warehouses,{status:200})
   } catch (error) {
    return NextResponse.json(error,{status:500})
   }finally{
    await onlinePrisma.$disconnect()
   }
}

export async function POST(req:NextRequest){
    const data = await req.json()
    const {code,name,phone,email,description,address} = data.formData
    try {
     const warehouses = await onlinePrisma.warehouses_online.create({
        data:{
            name,
            warehouseCode:code,
            phoneNumber:phone,
            email,
            description,
            address
        }
     })

     await onlinePrisma.receiptSettings_online.create({
        data:{
            warehouses_onlineId:warehouses.warehouseCode,
            phone:"",
            email:"",
            state:"",
            country:"",
            city:"",
            companyName:"Change",
            businessName:warehouses.warehouseCode,
            website:`${warehouses.warehouseCode}.com`,
            address:"",
        }
     })

     return NextResponse.json(warehouses,{status:201})
    } catch (error) {
     return NextResponse.json(error,{status:500})
    }finally{
     await onlinePrisma.$disconnect()
    }
}

export async function PUT(req:NextRequest){
    const data = await req.json()

    //console.log(data)

    // return

    const {warehouseCode,name,phoneNumber,email,description,address} = data
    try {
     const warehouses = await onlinePrisma.warehouses_online.update({
        where:{
            warehouseCode,isDeleted:false
        },
        data:{
            name,
            warehouseCode,
            phoneNumber,
            email,
            description,
            address
        }
     })
     //console.log(warehouses)
     return NextResponse.json(warehouses,{status:201})
    } catch (error) {
     return NextResponse.json(error,{status:500})
    }finally{
     await onlinePrisma.$disconnect()
    }
}