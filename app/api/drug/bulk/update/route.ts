import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

interface BulkUpdateOperation {
  drugIds: string[];
  updates: {
    category?: string;
    reorderLevel?: number;
    maxStockLevel?: number;
    taxRate?: number;
    requiresPrescription?: boolean;
    controlledSubstance?: boolean;
    storageConditions?: string;
    manufacturer?: string;
    // Price updates
    retailPriceAdjustment?: {
      type: 'percentage' | 'fixed';
      value: number;
    };
    wholeSalePriceAdjustment?: {
      type: 'percentage' | 'fixed';
      value: number;
    };
    costAdjustment?: {
      type: 'percentage' | 'fixed';
      value: number;
    };
  };
  warehouseId: string;
}

export async function POST(req: NextRequest) {
  try {
    const bulkUpdate: BulkUpdateOperation = await req.json();
    const { drugIds, updates, warehouseId } = bulkUpdate;
    
    if (!Array.isArray(drugIds) || drugIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Drug IDs array is required and cannot be empty'
      }, { status: 400 });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Updates object is required and cannot be empty'
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
        error: 'Some drugs not found',
        details: { missingIds }
      }, { status: 404 });
    }

    // Prepare update operations
    const updateOperations = [];

    for (const drug of existingDrugs) {
      const updateData: any = {
        updatedAt: new Date(),
        sync: false
      };

      // Simple field updates
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.reorderLevel !== undefined) updateData.reorderLevel = updates.reorderLevel;
      if (updates.maxStockLevel !== undefined) updateData.maxStockLevel = updates.maxStockLevel;
      if (updates.taxRate !== undefined) updateData.taxRate = updates.taxRate;
      if (updates.requiresPrescription !== undefined) updateData.requiresPrescription = updates.requiresPrescription;
      if (updates.controlledSubstance !== undefined) updateData.controlledSubstance = updates.controlledSubstance;
      if (updates.storageConditions !== undefined) updateData.storageConditions = updates.storageConditions;
      if (updates.manufacturer !== undefined) updateData.manufacturer = updates.manufacturer;

      // Price adjustments
      if (updates.retailPriceAdjustment) {
        const { type, value } = updates.retailPriceAdjustment;
        if (type === 'percentage') {
          updateData.retailPrice = drug.retailPrice * (1 + value / 100);
        } else if (type === 'fixed') {
          updateData.retailPrice = Math.max(0, drug.retailPrice + value);
        }
      }

      if (updates.wholeSalePriceAdjustment) {
        const { type, value } = updates.wholeSalePriceAdjustment;
        if (type === 'percentage') {
          updateData.wholeSalePrice = drug.wholeSalePrice * (1 + value / 100);
        } else if (type === 'fixed') {
          updateData.wholeSalePrice = Math.max(0, drug.wholeSalePrice + value);
        }
      }

      if (updates.costAdjustment) {
        const { type, value } = updates.costAdjustment;
        if (type === 'percentage') {
          updateData.cost = drug.cost * (1 + value / 100);
        } else if (type === 'fixed') {
          updateData.cost = Math.max(0, drug.cost + value);
        }
      }

      updateOperations.push(
        prisma.product.update({
          where: { id: drug.id },
          data: updateData
        })
      );
    }

    // Execute all updates in a transaction
    const results = await prisma.$transaction(updateOperations);

    // Calculate summary of changes
    const summary = {
      updatedCount: results.length,
      updatedFields: Object.keys(updates),
      priceAdjustments: {
        retail: !!updates.retailPriceAdjustment,
        wholesale: !!updates.wholeSalePriceAdjustment,
        cost: !!updates.costAdjustment
      }
    };

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${results.length} drugs`,
      data: {
        summary,
        updatedDrugs: results.map(drug => ({
          id: drug.id,
          name: drug.name,
          barcode: drug.barcode
        }))
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Bulk update API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update drugs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}