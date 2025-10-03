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

    const drug = await prisma.drug.findUnique({
      where: {
        id: drugId,
        warehouseId,
        isDeleted: false
      }
    });

    if (!drug) {
      return NextResponse.json({ 
        success: false, 
        message: 'Drug not found' 
      }, { status: 404 });
    }

    // Get additional analytics data
    const [salesData, purchaseData] = await Promise.all([
      // Get total sold from sales records (if you have a sales table)
      prisma.saleItem.aggregate({
        where: {
          productId: drugId, // Assuming drugs are stored as products in sales
          sale: {
            warehouseId
          }
        },
        _sum: {
          quantity: true
        }
      }).catch(() => ({ _sum: { quantity: 0 } })),
      
      // Get total purchased from purchase records (if you have a purchase table)
      prisma.purchaseItem.aggregate({
        where: {
          productId: drugId, // Assuming drugs are stored as products in purchases
          purchase: {
            warehouseId
          }
        },
        _sum: {
          quantity: true
        }
      }).catch(() => ({ _sum: { quantity: 0 } }))
    ]);

    const drugWithAnalytics = {
      ...drug,
      totalSold: salesData._sum.quantity || 0,
      totalPurchased: purchaseData._sum.quantity || 0,
      averageUsage: 10, // This could be calculated from historical data
    };

    return NextResponse.json({ success: true, drug: drugWithAnalytics }, { status: 200 });
  } catch (error) {
    console.error('Error fetching drug:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch drug: ' + error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(req: NextRequest, { params }: { params: { drugId: string } }) {
  try {
    const { drugId } = params;
    const data = await req.json();
    const {
      code,
      name,
      category,
      manufacturer,
      description,
      activeIngredient,
      strength,
      dosageForm,
      quantity,
      reorderLevel,
      price,
      cost,
      expiryDate,
      batchNumber,
      unit,
      storageConditions,
      prescriptionRequired,
      warehouseId
    } = data;

    // Check if drug exists
    const existingDrug = await prisma.drug.findUnique({
      where: { id: drugId, isDeleted: false }
    });

    if (!existingDrug) {
      return NextResponse.json({ 
        success: false, 
        message: 'Drug does not exist' 
      }, { status: 404 });
    }

    // Check if new code conflicts with another drug (if code is being changed)
    if (code !== existingDrug.code) {
      const codeConflict = await prisma.drug.findFirst({
        where: {
          code,
          warehouseId,
          isDeleted: false,
          id: { not: drugId }
        }
      });

      if (codeConflict) {
        return NextResponse.json({ 
          success: false, 
          message: 'Drug code already exists' 
        }, { status: 409 });
      }
    }

    const updatedDrug = await prisma.drug.update({
      where: { id: drugId },
      data: {
        code,
        name,
        category,
        manufacturer,
        description: description || '',
        activeIngredient: activeIngredient || '',
        strength: strength || '',
        dosageForm: dosageForm || '',
        quantity: parseInt(quantity) || 0,
        reorderLevel: parseInt(reorderLevel) || 0,
        price: parseFloat(price) || 0,
        cost: parseFloat(cost) || 0,
        expiryDate: new Date(expiryDate),
        batchNumber: batchNumber || '',
        unit: unit || 'Pieces',
        storageConditions: storageConditions || '',
        prescriptionRequired: prescriptionRequired || false,
        sync: false,
        syncedAt: null,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, drug: updatedDrug }, { status: 200 });
  } catch (error) {
    console.error('Error updating drug:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update drug: ' + error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { drugId: string } }) {
  try {
    const { drugId } = params;

    const drug = await prisma.drug.findUnique({
      where: { id: drugId }
    });

    if (!drug) {
      return NextResponse.json({ 
        success: false, 
        message: 'Drug does not exist' 
      }, { status: 404 });
    }

    const deletedDrug = await prisma.drug.update({
      where: { id: drugId },
      data: {
        isDeleted: true,
        sync: false,
        syncedAt: null,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, drug: deletedDrug }, { status: 200 });
  } catch (error) {
    console.error('Error deleting drug:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to delete drug: ' + error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}