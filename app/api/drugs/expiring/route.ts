import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

export async function POST(req: NextRequest) {
  try {
    const { warehouseId, days = 90 } = await req.json();
    
    if (!warehouseId) {
      return NextResponse.json({ success: false, message: 'Warehouse ID is required' }, { status: 400 });
    }

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + parseInt(days));

    // Get drugs that are expired or expiring within the specified days
    const expiringDrugs = await prisma.drug.findMany({
      where: {
        warehouseId,
        isDeleted: false,
        expiryDate: {
          lte: futureDate
        }
      },
      orderBy: {
        expiryDate: 'asc' // Earliest expiry first
      }
    });

    // Add calculated fields
    const drugsWithExpiryAnalysis = expiringDrugs.map(drug => {
      const expiryDate = new Date(drug.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let expiryStatus = 'good';
      if (daysUntilExpiry < 0) {
        expiryStatus = 'expired';
      } else if (daysUntilExpiry <= 30) {
        expiryStatus = 'expiring_soon';
      } else if (daysUntilExpiry <= 90) {
        expiryStatus = 'expiring_later';
      }

      return {
        ...drug,
        daysUntilExpiry,
        expiryStatus,
        totalValue: drug.quantity * drug.price,
        isExpired: daysUntilExpiry < 0
      };
    });

    return NextResponse.json(drugsWithExpiryAnalysis, { status: 200 });
  } catch (error) {
    console.error('Error fetching expiring drugs:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch expiring drugs' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}