import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

interface DrugFilters {
  warehouseId: string;
  search?: string;
  category?: string;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'near_reorder';
  expiryStatus?: 'valid' | 'expiring_soon' | 'expired';
  sortBy?: 'name' | 'quantity' | 'expiry' | 'price';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Helper function to calculate stock status
function getStockStatus(quantity: number, reorderLevel: number) {
  if (quantity === 0) return 'out_of_stock';
  if (quantity <= reorderLevel) return 'low_stock';
  if (quantity <= reorderLevel * 1.1) return 'near_reorder';
  return 'in_stock';
}

// Helper function to calculate expiry status
function getExpiryStatus(expiryDate: Date | null) {
  if (!expiryDate) return 'no_expiry';
  
  const today = new Date();
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'expiring_soon';
  return 'valid';
}

export async function POST(req: NextRequest) {
  try {
    const filters: DrugFilters = await req.json();
    const {
      warehouseId: warehousesId,
      search,
      category,
      stockStatus,
      expiryStatus,
      sortBy = 'name',
      sortOrder = 'asc',
      limit = 100,
      offset = 0
    } = filters;

    // Build where clause
    const whereClause: any = {
      warehousesId,
      isDeleted: false
    };

    // Add search filter
    if (search && search.trim().length >= 2) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { genericName: { contains: search, mode: 'insensitive' } },
        { brandName: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
        { batchNumber: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Add category filter
    if (category && category !== 'all') {
      whereClause.category = category;
    }

    // Build order by clause
    const orderByClause: any = {};
    switch (sortBy) {
      case 'name':
        orderByClause.name = sortOrder;
        break;
      case 'quantity':
        orderByClause.quantity = sortOrder;
        break;
      case 'expiry':
        orderByClause.expiryDate = sortOrder;
        break;
      case 'price':
        orderByClause.retailPrice = sortOrder;
        break;
      default:
        orderByClause.name = sortOrder;
    }

    // Get products from database
    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: orderByClause,
      take: limit,
      skip: offset,
      include: {
        prescriptionItems: {
          select: {
            id: true,
            quantityPrescribed: true,
            quantityDispensed: true
          }
        }
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.product.count({
      where: whereClause
    });

    // Filter by stock status if specified
    let filteredProducts = products;
    if (stockStatus && stockStatus !== 'all') {
      filteredProducts = products.filter(product => {
        const status = getStockStatus(product.quantity, product.reorderLevel || 0);
        return status === stockStatus;
      });
    }

    // Filter by expiry status if specified
    if (expiryStatus && expiryStatus !== 'all') {
      filteredProducts = filteredProducts.filter(product => {
        const status = getExpiryStatus(product.expiryDate);
        return status === expiryStatus;
      });
    }

    // Add calculated fields to each product
    const enhancedProducts = filteredProducts.map(product => {
      const stockStatus = getStockStatus(product.quantity, product.reorderLevel || 0);
      const expiryStatus = getExpiryStatus(product.expiryDate);
      
      // Calculate days until expiry
      let daysUntilExpiry = null;
      if (product.expiryDate) {
        const today = new Date();
        const diffTime = product.expiryDate.getTime() - today.getTime();
        daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Calculate total prescribed vs dispensed
      const totalPrescribed = product.prescriptionItems.reduce((sum, item) => sum + item.quantityPrescribed, 0);
      const totalDispensed = product.prescriptionItems.reduce((sum, item) => sum + item.quantityDispensed, 0);

      return {
        ...product,
        stockStatus,
        expiryStatus,
        daysUntilExpiry,
        totalPrescribed,
        totalDispensed,
        prescriptionItems: undefined // Remove detailed prescription items from response
      };
    });

    // Calculate summary statistics
    const stats = {
      totalDrugs: totalCount,
      filteredCount: enhancedProducts.length,
      lowStockCount: products.filter(p => getStockStatus(p.quantity, p.reorderLevel || 0) === 'low_stock').length,
      outOfStockCount: products.filter(p => p.quantity === 0).length,
      expiringSoonCount: products.filter(p => p.expiryDate && getExpiryStatus(p.expiryDate) === 'expiring_soon').length,
      expiredCount: products.filter(p => p.expiryDate && getExpiryStatus(p.expiryDate) === 'expired').length,
      totalValue: products.reduce((sum, p) => sum + (p.retailPrice * p.quantity), 0),
      totalCostValue: products.reduce((sum, p) => sum + (p.cost * p.quantity), 0)
    };

    return NextResponse.json({
      success: true,
      data: enhancedProducts,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: (offset + limit) < totalCount
      },
      stats
    }, { status: 200 });

  } catch (error) {
    console.error('Drug list API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch drug list',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// GET method for simple drug list (without filters)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const warehousesId = searchParams.get('warehouseId');
    
    if (!warehousesId) {
      return NextResponse.json({
        success: false,
        error: 'Warehouse ID is required'
      }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: {
        warehousesId,
        isDeleted: false
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: products
    }, { status: 200 });

  } catch (error) {
    console.error('Drug list GET API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch drug list'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}