import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

interface AnalyticsFilters {
  warehouseId: string;
  startDate?: string;
  endDate?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export async function POST(req: NextRequest) {
  try {
    const filters: AnalyticsFilters = await req.json();
    const {
      warehouseId: warehousesId,
      startDate,
      endDate,
      period = 'monthly'
    } = filters;

    if (!warehousesId) {
      return NextResponse.json({
        success: false,
        error: 'Warehouse ID is required'
      }, { status: 400 });
    }

    // Set default date range if not provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    // Get all drugs
    const drugs = await prisma.product.findMany({
      where: {
        warehousesId,
        isDeleted: false
      },
      include: {
        prescriptionItems: {
          where: {
            isDeleted: false,
            createdAt: {
              gte: start,
              lte: end
            }
          },
          include: {
            prescription: {
              select: {
                createdAt: true,
                status: true
              }
            }
          }
        },
        purchaseItem: {
          where: {
            isDeleted: false,
            createdAt: {
              gte: start,
              lte: end
            }
          },
          include: {
            Purchase: {
              select: {
                createdAt: true
              }
            }
          }
        }
      }
    });

    // Calculate top performing drugs
    const drugPerformance = drugs.map(drug => {
      const totalPrescribed = drug.prescriptionItems.reduce((sum, item) => sum + item.quantityPrescribed, 0);
      const totalDispensed = drug.prescriptionItems.reduce((sum, item) => sum + item.quantityDispensed, 0);
      const totalPurchased = drug.purchaseItem.reduce((sum, item) => sum + item.quantity, 0);
      const revenue = drug.prescriptionItems.reduce((sum, item) => sum + (item.quantityDispensed * item.unitPrice), 0);
      
      return {
        drugId: drug.id,
        name: drug.name,
        category: drug.category,
        totalPrescribed,
        totalDispensed,
        totalPurchased,
        revenue,
        currentStock: drug.quantity,
        turnoverRate: totalPurchased > 0 ? totalDispensed / totalPurchased : 0
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Calculate category performance
    const categoryPerformance = new Map();
    drugs.forEach(drug => {
      const category = drug.category || 'Uncategorized';
      if (!categoryPerformance.has(category)) {
        categoryPerformance.set(category, {
          category,
          drugCount: 0,
          totalPrescribed: 0,
          totalDispensed: 0,
          totalRevenue: 0,
          totalStock: 0,
          totalValue: 0
        });
      }
      
      const catData = categoryPerformance.get(category);
      catData.drugCount++;
      catData.totalPrescribed += drug.prescriptionItems.reduce((sum, item) => sum + item.quantityPrescribed, 0);
      catData.totalDispensed += drug.prescriptionItems.reduce((sum, item) => sum + item.quantityDispensed, 0);
      catData.totalRevenue += drug.prescriptionItems.reduce((sum, item) => sum + (item.quantityDispensed * item.unitPrice), 0);
      catData.totalStock += drug.quantity;
      catData.totalValue += drug.retailPrice * drug.quantity;
    });

    // Calculate time-based trends
    const timeBasedData = new Map();
    
    // Process prescriptions by time period
    drugs.forEach(drug => {
      drug.prescriptionItems.forEach(item => {
        const date = new Date(item.prescription.createdAt);
        let periodKey;
        
        switch (period) {
          case 'daily':
            periodKey = date.toISOString().split('T')[0];
            break;
          case 'weekly':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            periodKey = weekStart.toISOString().split('T')[0];
            break;
          case 'monthly':
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'yearly':
            periodKey = String(date.getFullYear());
            break;
          default:
            periodKey = date.toISOString().split('T')[0];
        }
        
        if (!timeBasedData.has(periodKey)) {
          timeBasedData.set(periodKey, {
            period: periodKey,
            prescriptions: 0,
            dispensed: 0,
            revenue: 0,
            uniqueDrugs: new Set()
          });
        }
        
        const periodData = timeBasedData.get(periodKey);
        periodData.prescriptions += item.quantityPrescribed;
        periodData.dispensed += item.quantityDispensed;
        periodData.revenue += item.quantityDispensed * item.unitPrice;
        periodData.uniqueDrugs.add(drug.id);
      });
    });

    // Convert sets to counts and sort by period
    const timeBasedAnalytics = Array.from(timeBasedData.values())
      .map(data => ({
        ...data,
        uniqueDrugs: data.uniqueDrugs.size
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Calculate stock alerts and predictions
    const stockAlerts = {
      outOfStock: drugs.filter(d => d.quantity === 0).length,
      lowStock: drugs.filter(d => d.quantity > 0 && d.quantity <= (d.reorderLevel || 0)).length,
      expiringSoon: drugs.filter(d => {
        if (!d.expiryDate) return false;
        const daysUntilExpiry = Math.ceil((d.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
      }).length,
      expired: drugs.filter(d => {
        if (!d.expiryDate) return false;
        return d.expiryDate < new Date();
      }).length
    };

    // Calculate financial metrics
    const financialMetrics = {
      totalInventoryValue: drugs.reduce((sum, drug) => sum + (drug.retailPrice * drug.quantity), 0),
      totalCostValue: drugs.reduce((sum, drug) => sum + (drug.cost * drug.quantity), 0),
      totalRevenue: drugPerformance.reduce((sum, drug) => sum + drug.revenue, 0),
      averageMargin: drugs.length > 0 
        ? drugs.reduce((sum, drug) => sum + ((drug.retailPrice - drug.cost) / drug.retailPrice * 100), 0) / drugs.length 
        : 0
    };

    const analyticsData = {
      metadata: {
        generatedAt: new Date(),
        period: { start, end, type: period },
        warehouseId: warehousesId
      },
      summary: {
        totalDrugs: drugs.length,
        totalPrescriptions: drugPerformance.reduce((sum, drug) => sum + drug.totalPrescribed, 0),
        totalDispensed: drugPerformance.reduce((sum, drug) => sum + drug.totalDispensed, 0),
        totalRevenue: financialMetrics.totalRevenue
      },
      topPerformingDrugs: drugPerformance.slice(0, 10),
      categoryPerformance: Array.from(categoryPerformance.values()).sort((a, b) => b.totalRevenue - a.totalRevenue),
      timeBasedAnalytics,
      stockAlerts,
      financialMetrics,
      trends: {
        revenueGrowth: timeBasedAnalytics.length > 1 
          ? ((timeBasedAnalytics[timeBasedAnalytics.length - 1].revenue - timeBasedAnalytics[0].revenue) / timeBasedAnalytics[0].revenue * 100)
          : 0,
        prescriptionGrowth: timeBasedAnalytics.length > 1
          ? ((timeBasedAnalytics[timeBasedAnalytics.length - 1].prescriptions - timeBasedAnalytics[0].prescriptions) / timeBasedAnalytics[0].prescriptions * 100)
          : 0
      }
    };

    return NextResponse.json({
      success: true,
      data: analyticsData
    }, { status: 200 });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}