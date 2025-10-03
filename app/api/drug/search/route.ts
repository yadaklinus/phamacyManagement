import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

interface SearchFilters {
  warehouseId: string;
  query: string;
  searchFields?: string[];
  category?: string;
  stockStatus?: string;
  expiryStatus?: string;
  limit?: number;
  includeInactive?: boolean;
}

// Helper functions
function getStockStatus(quantity: number, reorderLevel: number) {
  if (quantity === 0) return 'out_of_stock';
  if (quantity <= reorderLevel) return 'low_stock';
  if (quantity <= reorderLevel * 1.1) return 'near_reorder';
  return 'in_stock';
}

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
    const searchParams: SearchFilters = await req.json();
    const {
      warehouseId: warehousesId,
      query,
      searchFields = ['name', 'barcode', 'genericName', 'brandName', 'manufacturer'],
      category,
      stockStatus,
      expiryStatus,
      limit = 50,
      includeInactive = false
    } = searchParams;

    if (!warehousesId) {
      return NextResponse.json({
        success: false,
        error: 'Warehouse ID is required'
      }, { status: 400 });
    }

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      }, { status: 400 });
    }

    const searchTerm = query.trim().toLowerCase();

    // Build where clause
    const whereClause: any = {
      warehousesId,
      isDeleted: includeInactive ? undefined : false
    };

    // Build search conditions based on specified fields
    const searchConditions = [];
    
    if (searchFields.includes('name')) {
      searchConditions.push({ name: { contains: searchTerm, mode: 'insensitive' } });
    }
    if (searchFields.includes('barcode')) {
      searchConditions.push({ barcode: { contains: searchTerm, mode: 'insensitive' } });
    }
    if (searchFields.includes('genericName')) {
      searchConditions.push({ genericName: { contains: searchTerm, mode: 'insensitive' } });
    }
    if (searchFields.includes('brandName')) {
      searchConditions.push({ brandName: { contains: searchTerm, mode: 'insensitive' } });
    }
    if (searchFields.includes('manufacturer')) {
      searchConditions.push({ manufacturer: { contains: searchTerm, mode: 'insensitive' } });
    }
    if (searchFields.includes('batchNumber')) {
      searchConditions.push({ batchNumber: { contains: searchTerm, mode: 'insensitive' } });
    }
    if (searchFields.includes('category')) {
      searchConditions.push({ category: { contains: searchTerm, mode: 'insensitive' } });
    }

    if (searchConditions.length > 0) {
      whereClause.OR = searchConditions;
    }

    // Add additional filters
    if (category && category !== 'all') {
      whereClause.category = category;
    }

    // Search in database
    const drugs = await prisma.product.findMany({
      where: whereClause,
      take: limit,
      orderBy: [
        // Prioritize exact matches
        { name: 'asc' },
        { barcode: 'asc' }
      ],
      include: {
        prescriptionItems: {
          select: {
            quantityPrescribed: true,
            quantityDispensed: true
          },
          take: 5 // Just for recent activity indicator
        }
      }
    });

    // Filter by stock status if specified
    let filteredDrugs = drugs;
    if (stockStatus && stockStatus !== 'all') {
      filteredDrugs = drugs.filter(drug => {
        const status = getStockStatus(drug.quantity, drug.reorderLevel || 0);
        return status === stockStatus;
      });
    }

    // Filter by expiry status if specified
    if (expiryStatus && expiryStatus !== 'all') {
      filteredDrugs = filteredDrugs.filter(drug => {
        const status = getExpiryStatus(drug.expiryDate);
        return status === expiryStatus;
      });
    }

    // Enhance results with calculated fields and search relevance
    const enhancedResults = filteredDrugs.map(drug => {
      const stockStatus = getStockStatus(drug.quantity, drug.reorderLevel || 0);
      const expiryStatus = getExpiryStatus(drug.expiryDate);
      
      // Calculate days until expiry
      let daysUntilExpiry = null;
      if (drug.expiryDate) {
        const today = new Date();
        const diffTime = drug.expiryDate.getTime() - today.getTime();
        daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Calculate search relevance score
      let relevanceScore = 0;
      const lowerQuery = searchTerm.toLowerCase();
      
      // Exact matches get highest score
      if (drug.name.toLowerCase() === lowerQuery) relevanceScore += 100;
      else if (drug.name.toLowerCase().startsWith(lowerQuery)) relevanceScore += 80;
      else if (drug.name.toLowerCase().includes(lowerQuery)) relevanceScore += 60;
      
      if (drug.barcode.toLowerCase() === lowerQuery) relevanceScore += 90;
      else if (drug.barcode.toLowerCase().includes(lowerQuery)) relevanceScore += 70;
      
      if (drug.genericName && drug.genericName.toLowerCase().includes(lowerQuery)) relevanceScore += 50;
      if (drug.brandName && drug.brandName.toLowerCase().includes(lowerQuery)) relevanceScore += 40;
      if (drug.manufacturer && drug.manufacturer.toLowerCase().includes(lowerQuery)) relevanceScore += 30;

      // Calculate activity metrics
      const totalPrescribed = drug.prescriptionItems.reduce((sum, item) => sum + item.quantityPrescribed, 0);
      const totalDispensed = drug.prescriptionItems.reduce((sum, item) => sum + item.quantityDispensed, 0);
      const hasRecentActivity = drug.prescriptionItems.length > 0;

      return {
        id: drug.id,
        name: drug.name,
        barcode: drug.barcode,
        genericName: drug.genericName,
        brandName: drug.brandName,
        category: drug.category,
        manufacturer: drug.manufacturer,
        batchNumber: drug.batchNumber,
        
        // Stock information
        quantity: drug.quantity,
        reorderLevel: drug.reorderLevel,
        stockStatus,
        
        // Pricing
        retailPrice: drug.retailPrice,
        wholeSalePrice: drug.wholeSalePrice,
        cost: drug.cost,
        
        // Expiry information
        expiryDate: drug.expiryDate,
        daysUntilExpiry,
        expiryStatus,
        
        // Drug details
        dosageForm: drug.dosageForm,
        strength: drug.strength,
        unit: drug.unit,
        requiresPrescription: drug.requiresPrescription,
        
        // Activity indicators
        hasRecentActivity,
        totalPrescribed,
        totalDispensed,
        
        // Search metadata
        relevanceScore,
        matchedFields: searchFields.filter(field => {
          const fieldValue = (drug as any)[field];
          return fieldValue && fieldValue.toLowerCase().includes(lowerQuery);
        }),
        
        // System fields
        isDeleted: drug.isDeleted,
        createdAt: drug.createdAt,
        updatedAt: drug.updatedAt
      };
    });

    // Sort by relevance score (highest first)
    enhancedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Generate search suggestions based on partial matches
    const suggestions = [];
    if (enhancedResults.length < 5 && searchTerm.length >= 3) {
      // Get category suggestions
      const categoryMatches = await prisma.product.findMany({
        where: {
          warehousesId,
          isDeleted: false,
          category: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        select: {
          category: true
        },
        distinct: ['category'],
        take: 3
      });
      
      categoryMatches.forEach(match => {
        if (match.category) {
          suggestions.push({
            type: 'category',
            value: match.category,
            label: `Category: ${match.category}`
          });
        }
      });

      // Get manufacturer suggestions
      const manufacturerMatches = await prisma.product.findMany({
        where: {
          warehousesId,
          isDeleted: false,
          manufacturer: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        select: {
          manufacturer: true
        },
        distinct: ['manufacturer'],
        take: 3
      });
      
      manufacturerMatches.forEach(match => {
        if (match.manufacturer) {
          suggestions.push({
            type: 'manufacturer',
            value: match.manufacturer,
            label: `Manufacturer: ${match.manufacturer}`
          });
        }
      });
    }

    // Calculate search statistics
    const searchStats = {
      totalResults: enhancedResults.length,
      hasMoreResults: drugs.length === limit,
      searchFields: searchFields,
      appliedFilters: {
        category: category !== 'all' ? category : null,
        stockStatus: stockStatus !== 'all' ? stockStatus : null,
        expiryStatus: expiryStatus !== 'all' ? expiryStatus : null
      },
      executionTime: Date.now() // This would be calculated properly in a real implementation
    };

    return NextResponse.json({
      success: true,
      data: {
        results: enhancedResults,
        suggestions,
        stats: searchStats,
        query: {
          original: query,
          processed: searchTerm,
          fields: searchFields
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Drug search API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to search drugs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// GET method for simple search with query parameters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const warehousesId = searchParams.get('warehouseId');
    const query = searchParams.get('q') || searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (!warehousesId || !query) {
      return NextResponse.json({
        success: false,
        error: 'Warehouse ID and query are required'
      }, { status: 400 });
    }

    if (query.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Query must be at least 2 characters long'
      }, { status: 400 });
    }

    // Simple search in name and barcode
    const drugs = await prisma.product.findMany({
      where: {
        warehousesId,
        isDeleted: false,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { barcode: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        barcode: true,
        category: true,
        quantity: true,
        retailPrice: true,
        reorderLevel: true
      },
      take: limit,
      orderBy: {
        name: 'asc'
      }
    });

    const results = drugs.map(drug => ({
      ...drug,
      stockStatus: getStockStatus(drug.quantity, drug.reorderLevel || 0)
    }));

    return NextResponse.json({
      success: true,
      data: results
    }, { status: 200 });

  } catch (error) {
    console.error('Simple drug search API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to search drugs'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}