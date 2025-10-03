import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const warehouseId = searchParams.get('warehouseId');
  
  if (!warehouseId) {
    return NextResponse.json({ success: false, message: 'Warehouse ID is required' }, { status: 400 });
  }

  try {
    const categories = await prisma.drugCategory.findMany({
      where: {
        warehouseId,
        isDeleted: false
      },
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
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transform the data to include drug count
    const categoriesWithCount = categories.map(category => ({
      ...category,
      drugCount: category._count.drugs
    }));

    return NextResponse.json({ success: true, categories: categoriesWithCount }, { status: 200 });
  } catch (error) {
    console.error('Error fetching drug categories:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch categories' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, description, color, warehouseId, createdBy } = await req.json();

    if (!name || !warehouseId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Name and warehouse ID are required' 
      }, { status: 400 });
    }

    // Check if category name already exists in this warehouse
    const existingCategory = await prisma.drugCategory.findFirst({
      where: {
        name,
        warehouseId,
        isDeleted: false
      }
    });

    if (existingCategory) {
      return NextResponse.json({ 
        success: false, 
        message: 'Category name already exists in this warehouse' 
      }, { status: 409 });
    }

    const category = await prisma.drugCategory.create({
      data: {
        name,
        description: description || '',
        color: color || '#3B82F6',
        warehouseId,
        createdBy: createdBy || 'system',
        isActive: true
      }
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    console.error('Error creating drug category:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to create category: ' + error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}