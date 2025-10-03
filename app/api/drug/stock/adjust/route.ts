import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

interface StockAdjustment {
  drugId: string;
  adjustmentType: 'increase' | 'decrease' | 'set';
  quantity: number;
  reason: string;
  notes?: string;
  userId: string;
  batchNumber?: string;
  expiryDate?: string;
}

export async function POST(req: NextRequest) {
  try {
    const adjustmentData: StockAdjustment = await req.json();
    
    const {
      drugId,
      adjustmentType,
      quantity,
      reason,
      notes,
      userId,
      batchNumber,
      expiryDate
    } = adjustmentData;

    // Validate required fields
    if (!drugId || !adjustmentType || quantity === undefined || !reason || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: drugId, adjustmentType, quantity, reason, userId'
      }, { status: 400 });
    }

    if (quantity < 0) {
      return NextResponse.json({
        success: false,
        error: 'Quantity cannot be negative'
      }, { status: 400 });
    }

    // Get current drug data
    const drug = await prisma.product.findUnique({
      where: { id: drugId }
    });

    if (!drug || drug.isDeleted) {
      return NextResponse.json({
        success: false,
        error: 'Drug not found'
      }, { status: 404 });
    }

    // Calculate new quantity based on adjustment type
    let newQuantity: number;
    let actualAdjustment: number;

    switch (adjustmentType) {
      case 'increase':
        newQuantity = drug.quantity + quantity;
        actualAdjustment = quantity;
        break;
      case 'decrease':
        newQuantity = Math.max(0, drug.quantity - quantity);
        actualAdjustment = -(drug.quantity - newQuantity);
        break;
      case 'set':
        newQuantity = quantity;
        actualAdjustment = quantity - drug.quantity;
        break;
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid adjustment type'
        }, { status: 400 });
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update drug quantity
      const updatedDrug = await tx.product.update({
        where: { id: drugId },
        data: {
          quantity: newQuantity,
          ...(batchNumber && { batchNumber }),
          ...(expiryDate && { expiryDate: new Date(expiryDate) }),
          updatedAt: new Date(),
          sync: false
        }
      });

      // Create stock tracking record
      // Note: We'll need to create a StockTracking model in the schema
      // For now, we'll use a simple approach with the existing structure
      
      return {
        updatedDrug,
        adjustment: {
          drugId,
          previousQuantity: drug.quantity,
          newQuantity,
          adjustmentAmount: actualAdjustment,
          adjustmentType,
          reason,
          notes,
          userId,
          batchNumber,
          expiryDate,
          timestamp: new Date()
        }
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Stock adjusted successfully',
      data: result
    }, { status: 200 });

  } catch (error) {
    console.error('Stock adjustment API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to adjust stock',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}