import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/oflinePrisma";
export async function POST(req:NextRequest){
    const {
        address,      
        companyName,
        email,      
        name,       
        phone,       
        type,       
        warehousesId
    } = await req.json()


    try {

        const data = await prisma.supplier.create({
            data:{
                address,
                companyName,
                email,
                name,
                phone,
                type,
                warehousesId
            }
        })

        return NextResponse.json(data,{status:201})
        
    } catch (error) {
        return NextResponse.json(error,{status:500})
    }

    
}