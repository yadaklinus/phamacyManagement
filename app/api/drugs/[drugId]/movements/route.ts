import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

export async function GET(req: NextRequest, { params }: { params: { drugId: string } }) {
  try {
    const { drugId } = params;
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouseId');

    if (!warehouseId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Warehouse ID is required' 
      }, { status: 400 });
    }

    // Get stock movements for this drug
    const movements = await prisma.drugStockMovement.findMany({
      where: {
        drugId,
        warehouseId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to last 50 movements
    });

    return NextResponse.json({ success: true, movements }, { status: 200 });
  } catch (error) {
    console.error('Error fetching drug movements:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch movements: ' + error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest, { params }: { params: { drugId: string } }) {
  try {
    const { drugId } = params;
    const { 
      type, 
      quantity, 
      reason, 
      reference, 
      warehouseId, 
      createdBy 
    } = await req.json();

    if (!type || !quantity || !reason || !warehouseId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Type, quantity, reason, and warehouse ID are required' 
      }, { status: 400 });
    }

    // Get current drug stock
    const drug = await prisma.drug.findUnique({
      where: { id: drugId, warehouseId, isDeleted: false }
    });

    if (!drug) {
      return NextResponse.json({ 
        success: false, 
        message: 'Drug not found' 
      }, { status: 404 });
    }

    let newQuantity = drug.quantity;
    const movementQuantity = parseInt(quantity);

    // Calculate new quantity based on movement type
    if (type === 'in') {
      newQuantity += movementQuantity;
    } else if (type === 'out') {
      newQuantity -= movementQuantity;
      if (newQuantity < 0) {
        return NextResponse.json({ 
          success: false, 
          message: 'Insufficient stock for this operation' 
        }, { status: 400 });
      }
    } else if (type === 'adjustment') {
      newQuantity = movementQuantity; // Direct adjustment to specific quantity
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update drug quantity
      const updatedDrug = await tx.drug.update({
        where: { id: drugId },
        data: {
          quantity: newQuantity,
          lastStockUpdate: new Date(),
          sync: false,
          syncedAt: null,
          updatedAt: new Date()
        }
      });

      // Create stock movement record
      const movement = await tx.drugStockMovement.create({
        data: {
          drugId,
          type,
          quantity: type === 'adjustment' ? movementQuantity - drug.quantity : movementQuantity,
          reason,
          reference: reference || null,
          balanceAfter: newQuantity,
          warehouseId,
          createdBy: createdBy || 'system'
        }
      });

      return { drug: updatedDrug, movement };
    });

    return NextResponse.json({ 
      success: true, 
      drug: result.drug, 
      movement: result.movement 
    }, { status: 200 });
  } catch (error) {
    console.error('Error creating stock movement:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to create stock movement: ' + error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}