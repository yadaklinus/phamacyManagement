import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

export async function POST(req: NextRequest) {
  try {
    const { 
      drugIds, 
      disposalMethod, 
      disposalReason, 
      notes, 
      warehouseId, 
      disposedBy 
    } = await req.json();

    if (!drugIds || !Array.isArray(drugIds) || drugIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Drug IDs array is required' 
      }, { status: 400 });
    }

    if (!disposalMethod || !disposalReason) {
      return NextResponse.json({ 
        success: false, 
        message: 'Disposal method and reason are required' 
      }, { status: 400 });
    }

    const disposalDate = new Date();

    // Update all selected drugs as disposed
    const updatedDrugs = await prisma.drug.updateMany({
      where: {
        id: { in: drugIds },
        warehouseId,
        isDeleted: false
      },
      data: {
        isDisposed: true,
        disposalDate,
        disposalMethod,
        disposalReason,
        disposalNotes: notes || '',
        disposedBy: disposedBy || 'system',
        sync: false,
        syncedAt: null,
        updatedAt: disposalDate
      }
    });

    // Create disposal records for tracking
    const disposalRecords = drugIds.map(drugId => ({
      drugId,
      disposalMethod,
      disposalReason,
      notes: notes || '',
      disposedBy: disposedBy || 'system',
      warehouseId,
      disposalDate
    }));

    await prisma.drugDisposal.createMany({
      data: disposalRecords
    });

    return NextResponse.json({ 
      success: true, 
      message: `${updatedDrugs.count} drugs marked as disposed`,
      disposedCount: updatedDrugs.count
    }, { status: 200 });
  } catch (error) {
    console.error('Error disposing drugs:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to dispose drugs: ' + error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}