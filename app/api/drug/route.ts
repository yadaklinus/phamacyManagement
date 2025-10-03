import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

// Create a new drug
export async function POST(req: NextRequest) {
  try {
    const drugData = await req.json();
    
    // Validate required fields
    const requiredFields = ['name', 'barcode', 'retailPrice', 'cost', 'quantity', 'warehousesId'];
    for (const field of requiredFields) {
      if (!drugData[field] && drugData[field] !== 0) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`
        }, { status: 400 });
      }
    }

    // Check if barcode already exists
    const existingDrug = await prisma.product.findFirst({
      where: {
        barcode: drugData.barcode,
        warehousesId: drugData.warehousesId,
        isDeleted: false
      }
    });

    if (existingDrug) {
      return NextResponse.json({
        success: false,
        error: 'A drug with this barcode already exists'
      }, { status: 409 });
    }

    // Create the drug
    const newDrug = await prisma.product.create({
      data: {
        name: drugData.name,
        barcode: drugData.barcode,
        genericName: drugData.genericName || null,
        brandName: drugData.brandName || null,
        category: drugData.category || null,
        manufacturer: drugData.manufacturer || null,
        batchNumber: drugData.batchNumber || null,
        expiryDate: drugData.expiryDate ? new Date(drugData.expiryDate) : null,
        wholeSalePrice: parseFloat(drugData.wholeSalePrice) || 0,
        retailPrice: parseFloat(drugData.retailPrice),
        cost: parseFloat(drugData.cost),
        quantity: parseInt(drugData.quantity),
        reorderLevel: drugData.reorderLevel ? parseInt(drugData.reorderLevel) : null,
        maxStockLevel: drugData.maxStockLevel ? parseInt(drugData.maxStockLevel) : null,
        taxRate: parseInt(drugData.taxRate) || 0,
        unit: drugData.unit || 'piece',
        description: drugData.description || '',
        dosageForm: drugData.dosageForm || null,
        strength: drugData.strength || null,
        requiresPrescription: drugData.requiresPrescription !== false, // Default to true
        controlledSubstance: drugData.controlledSubstance || false,
        storageConditions: drugData.storageConditions || null,
        warehousesId: drugData.warehousesId,
        sync: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Drug created successfully',
      data: newDrug
    }, { status: 201 });

  } catch (error) {
    console.error('Create drug API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create drug',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Update an existing drug
export async function PUT(req: NextRequest) {
  try {
    const { drugId, ...updateData } = await req.json();
    
    if (!drugId) {
      return NextResponse.json({
        success: false,
        error: 'Drug ID is required'
      }, { status: 400 });
    }

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

    // If barcode is being updated, check for conflicts
    if (updateData.barcode && updateData.barcode !== existingDrug.barcode) {
      const barcodeConflict = await prisma.product.findFirst({
        where: {
          barcode: updateData.barcode,
          warehousesId: existingDrug.warehousesId,
          isDeleted: false,
          id: { not: drugId }
        }
      });

      if (barcodeConflict) {
        return NextResponse.json({
          success: false,
          error: 'A drug with this barcode already exists'
        }, { status: 409 });
      }
    }

    // Prepare update data
    const dataToUpdate: any = {
      ...updateData,
      updatedAt: new Date(),
      sync: false
    };

    // Handle date fields
    if (updateData.expiryDate) {
      dataToUpdate.expiryDate = new Date(updateData.expiryDate);
    }

    // Handle numeric fields
    if (updateData.retailPrice) dataToUpdate.retailPrice = parseFloat(updateData.retailPrice);
    if (updateData.wholeSalePrice) dataToUpdate.wholeSalePrice = parseFloat(updateData.wholeSalePrice);
    if (updateData.cost) dataToUpdate.cost = parseFloat(updateData.cost);
    if (updateData.quantity !== undefined) dataToUpdate.quantity = parseInt(updateData.quantity);
    if (updateData.reorderLevel) dataToUpdate.reorderLevel = parseInt(updateData.reorderLevel);
    if (updateData.maxStockLevel) dataToUpdate.maxStockLevel = parseInt(updateData.maxStockLevel);
    if (updateData.taxRate) dataToUpdate.taxRate = parseInt(updateData.taxRate);

    // Remove drugId from update data
    delete dataToUpdate.drugId;

    const updatedDrug = await prisma.product.update({
      where: { id: drugId },
      data: dataToUpdate
    });

    return NextResponse.json({
      success: true,
      message: 'Drug updated successfully',
      data: updatedDrug
    }, { status: 200 });

  } catch (error) {
    console.error('Update drug API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update drug',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}