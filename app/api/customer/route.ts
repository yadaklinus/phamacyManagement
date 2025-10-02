import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";
import { markCustomerAsUnsynced } from "@/lib/sync-helpers";

export async function GET(req: NextRequest) {
    try {
        const customers = await prisma.customer.findMany({
            where: { isDeleted: false }
        });
        
       
        return NextResponse.json(customers, { status: 200 });
    } catch (error) {
        console.error("Customer fetch error:", error);
        return NextResponse.json(error, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function POST(req:NextRequest){
    const {
        address,
        company,
        email,
        name,
        phone,
        userType,
        wholesale,
        warehouseId
    } = await req.json()

    try {
        const newCustomer = await prisma.customer.create({
            data:{
                name,
                type:userType,
                companyName:company,
                email,
                address,
                warehousesId:warehouseId,
                phone:phone,
                sync: false, // New customers should be marked as unsynced
                syncedAt: null
            }
        })

        
        //console.log(`New customer created: ${newCustomer.id} - marked as unsynced`);
        
        return NextResponse.json({
            message: "Customer created successfully",
            customer: newCustomer
        }, {status:201})
    } catch (error) {
        console.error("Customer creation error:", error);
        return NextResponse.json(error, {status:500})
    } finally {
        await prisma.$disconnect()
    }
}

export async function PUT(req: NextRequest) {
    const {
        customerId,
        address,
        company,
        email,
        name,
        phone,
        userType
    } = await req.json();

    try {
        // Check if customer exists
        const existingCustomer = await prisma.customer.findUnique({
            where: { id: customerId, isDeleted: false }
        });

        if (!existingCustomer) {
            return NextResponse.json("Customer does not exist", { status: 404 });
        }

        // Update the customer
        const updatedCustomer = await prisma.customer.update({
            where: { id: customerId },
            data: {
                name,
                type: userType,
                companyName: company,
                email,
                address,
                phone,
                sync: false, // Mark as unsynced since it was updated
                syncedAt: null,
                updatedAt: new Date()
            }
        });

        //console.log(`Customer updated: ${customerId} - marked as unsynced`);

        return NextResponse.json({
            message: "Customer updated successfully",
            customer: updatedCustomer
        }, { status: 200 });
    } catch (error) {
        console.error("Customer update error:", error);
        return NextResponse.json(error, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function DELETE(req: NextRequest) {
    const { customerId } = await req.json();

    try {
        const customer = await prisma.customer.findUnique({
            where: { id: customerId }
        });

        if (!customer) {
            return NextResponse.json("Customer does not exist", { status: 404 });
        }

        const deletedCustomer = await prisma.customer.update({
            where: { id: customerId },
            data: {
                isDeleted: true,
                sync: false, // Mark as unsynced to sync the deletion
                syncedAt: null,
                updatedAt: new Date()
            }
        });

        //console.log(`Customer deleted: ${customerId} - marked as unsynced for deletion sync`);

        return NextResponse.json({
            message: "Customer deleted successfully",
            customer: deletedCustomer
        }, { status: 200 });
    } catch (error) {
        console.error("Customer deletion error:", error);
        return NextResponse.json(error, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}