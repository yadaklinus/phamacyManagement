import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

export async function POST(req: NextRequest) {
  try {
    const { drugIds, warehouseId, force = false } = await req.json();
    
    if (!Array.isArray(drugIds) || drugIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Drug IDs array is required and cannot be empty'
      }, { status: 400 });
    }

    if (!warehouseId) {
      return NextResponse.json({
        success: false,
        error: 'Warehouse ID is required'
      }, { status: 400 });
    }

    // Verify all drugs exist and belong to the warehouse
    const existingDrugs = await prisma.product.findMany({
      where: {
        id: { in: drugIds },
        warehousesId: warehouseId,
        isDeleted: false
      }
    });

    if (existingDrugs.length !== drugIds.length) {
      const foundIds = existingDrugs.map(drug => drug.id);
      const missingIds = drugIds.filter(id => !foundIds.includes(id));
      
      return NextResponse.json({
        success: false,
        error: 'Some drugs not found or already deleted',
        details: { missingIds }
      }, { status: 404 });
    }

    // Check for active prescriptions unless force delete
    if (!force) {
      const activePrescriptions = await prisma.prescriptionItem.findMany({
        where: {
          productId: { in: drugIds },
          isDeleted: false,
          prescription: {
            status: {
              in: ['pending', 'approved']
            }
          }
        },
        include: {
          product: {
            select: { id: true, name: true }
          },
          prescription: {
            select: { prescriptionNo: true, status: true }
          }
        }
      });

      if (activePrescriptions.length > 0) {
        const conflictingDrugs = activePrescriptions.map(item => ({
          drugId: item.product.id,
          drugName: item.product.name,
          prescriptionNo: item.prescription.prescriptionNo,
          status: item.prescription.status
        }));

        return NextResponse.json({
          success: false,
          error: 'Cannot delete drugs with active prescriptions',
          details: { conflictingDrugs },
          canForceDelete: true
        }, { status: 409 });
      }
    }

    // Perform bulk soft delete
    const deleteResult = await prisma.product.updateMany({
      where: {
        id: { in: drugIds },
        warehousesId: warehouseId
      },
      data: {
        isDeleted: true,
        updatedAt: new Date(),
        sync: false
      }
    });

    // If force delete and there were active prescriptions, also soft delete them
    if (force) {
      await prisma.prescriptionItem.updateMany({
        where: {
          productId: { in: drugIds },
          isDeleted: false
        },
        data: {
          isDeleted: true,
          updatedAt: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleteResult.count} drugs`,
      data: {
        deletedCount: deleteResult.count,
        deletedIds: drugIds,
        forceDelete: force
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Bulk delete API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete drugs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}