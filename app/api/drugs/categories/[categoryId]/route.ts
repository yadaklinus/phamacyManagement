import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

export async function PUT(req: NextRequest, { params }: { params: { categoryId: string } }) {
  try {
    const { categoryId } = params;
    const { name, description, color, warehouseId } = await req.json();

    if (!name || !warehouseId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Name and warehouse ID are required' 
      }, { status: 400 });
    }

    // Check if category exists
    const existingCategory = await prisma.drugCategory.findUnique({
      where: { id: categoryId, isDeleted: false }
    });

    if (!existingCategory) {
      return NextResponse.json({ 
        success: false, 
        message: 'Category does not exist' 
      }, { status: 404 });
    }

    // Check if new name conflicts with another category (if name is being changed)
    if (name !== existingCategory.name) {
      const nameConflict = await prisma.drugCategory.findFirst({
        where: {
          name,
          warehouseId,
          isDeleted: false,
          id: { not: categoryId }
        }
      });

      if (nameConflict) {
        return NextResponse.json({ 
          success: false, 
          message: 'Category name already exists' 
        }, { status: 409 });
      }
    }

    const updatedCategory = await prisma.drugCategory.update({
      where: { id: categoryId },
      data: {
        name,
        description: description || '',
        color: color || '#3B82F6',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, category: updatedCategory }, { status: 200 });
  } catch (error) {
    console.error('Error updating drug category:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update category: ' + error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { categoryId: string } }) {
  try {
    const { categoryId } = params;
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouseId');

    if (!warehouseId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Warehouse ID is required' 
      }, { status: 400 });
    }

    // Check if category exists
    const category = await prisma.drugCategory.findUnique({
      where: { id: categoryId, isDeleted: false },
      include: {
        _count: {
          select: {
            drugs: {
              where: {
                isDeleted: false
              }
            }
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json({ 
        success: false, 
        message: 'Category does not exist' 
      }, { status: 404 });
    }

    // Check if category has drugs
    if (category._count.drugs > 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Cannot delete category that contains drugs. Please move or delete the drugs first.' 
      }, { status: 400 });
    }

    const deletedCategory = await prisma.drugCategory.update({
      where: { id: categoryId },
      data: {
        isDeleted: true,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, category: deletedCategory }, { status: 200 });
  } catch (error) {
    console.error('Error deleting drug category:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to delete category: ' + error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}