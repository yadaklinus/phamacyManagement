import { NextResponse } from "next/server"

import onlinePrisma from "@/lib/onlinePrisma"

export async function GET(){
    try {
        const users = await onlinePrisma.users_online.findMany({where:{isDeleted:false}})
        return NextResponse.json(users,{status:200})
    } catch (error) {
        return NextResponse.json(error,{status:500})
    }finally{
        await onlinePrisma.$disconnect()
    }
}