import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

export async function POST(req: NextRequest) {
  try {
    const { warehouseId } = await req.json();
    
    if (!warehouseId) {
      return NextResponse.json({ success: false, message: 'Warehouse ID is required' }, { status: 400 });
    }

    const today = new Date();

    // Get drugs that have already expired
    const expiredDrugs = await prisma.drug.findMany({
      where: {
        warehouseId,
        isDeleted: false,
        expiryDate: {
          lt: today
        }
      },
      orderBy: {
        expiryDate: 'desc' // Most recently expired first
      }
    });

    // Add calculated fields
    const drugsWithDisposalInfo = expiredDrugs.map(drug => {
      const expiryDate = new Date(drug.expiryDate);
      const daysExpired = Math.ceil((today.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...drug,
        daysExpired,
        totalValue: drug.quantity * drug.price,
        totalCost: drug.quantity * drug.cost,
        isDisposed: drug.isDisposed || false,
        disposalDate: drug.disposalDate || null,
        disposalMethod: drug.disposalMethod || null,
        disposalReason: drug.disposalReason || null
      };
    });

    return NextResponse.json(drugsWithDisposalInfo, { status: 200 });
  } catch (error) {
    console.error('Error fetching expired drugs:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch expired drugs' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}