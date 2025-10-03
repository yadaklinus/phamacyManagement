import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

// Get a single drug by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const drugId = params.id;

    const drug = await prisma.product.findUnique({
      where: { id: drugId },
      include: {
        prescriptionItems: {
          include: {
            prescription: {
              include: {
                student: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    matricNumber: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10 // Last 10 prescriptions
        },
        purchaseItem: {
          include: {
            Purchase: {
              include: {
                Supplier: {
                  select: {
                    id: true,
                    name: true,
                    companyName: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10 // Last 10 purchases
        }
      }
    });

    if (!drug || drug.isDeleted) {
      return NextResponse.json({
        success: false,
        error: 'Drug not found'
      }, { status: 404 });
    }

    // Calculate additional metrics
    const totalPrescribed = drug.prescriptionItems.reduce((sum, item) => sum + item.quantityPrescribed, 0);
    const totalDispensed = drug.prescriptionItems.reduce((sum, item) => sum + item.quantityDispensed, 0);
    const totalPurchased = drug.purchaseItem.reduce((sum, item) => sum + item.quantity, 0);

    // Calculate stock status
    const stockStatus = drug.quantity === 0 ? 'out_of_stock' :
                       drug.quantity <= (drug.reorderLevel || 0) ? 'low_stock' :
                       drug.quantity <= (drug.reorderLevel || 0) * 1.1 ? 'near_reorder' : 'in_stock';

    // Calculate expiry status
    let expiryStatus = 'no_expiry';
    let daysUntilExpiry = null;
    if (drug.expiryDate) {
      const today = new Date();
      const diffTime = drug.expiryDate.getTime() - today.getTime();
      daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) expiryStatus = 'expired';
      else if (daysUntilExpiry <= 30) expiryStatus = 'expiring_soon';
      else expiryStatus = 'valid';
    }

    const enhancedDrug = {
      ...drug,
      stockStatus,
      expiryStatus,
      daysUntilExpiry,
      metrics: {
        totalPrescribed,
        totalDispensed,
        totalPurchased,
        currentValue: drug.retailPrice * drug.quantity,
        costValue: drug.cost * drug.quantity
      }
    };

    return NextResponse.json({
      success: true,
      data: enhancedDrug
    }, { status: 200 });

  } catch (error) {
    console.error('Get drug API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch drug details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Delete a drug (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const drugId = params.id;

    // Check if drug exists
    const existingDrug = await prisma.product.findUnique({
      where: { id: drugId }
    });

    if (!existingDrug || existingDrug.isDeleted) {
      return NextResponse.json({
        success: false,
        error: 'Drug not found'
      }, { status: 404 });
    }

    // Check if drug is referenced in any active prescriptions
    const activePrescriptions = await prisma.prescriptionItem.findMany({
      where: {
        productId: drugId,
        isDeleted: false,
        prescription: {
          status: {
            in: ['pending', 'approved']
          }
        }
      }
    });

    if (activePrescriptions.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete drug with active prescriptions. Please complete or cancel related prescriptions first.'
      }, { status: 409 });
    }

    // Soft delete the drug
    await prisma.product.update({
      where: { id: drugId },
      data: {
        isDeleted: true,
        updatedAt: new Date(),
        sync: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Drug deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Delete drug API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete drug',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}