import { PrismaClient } from "@/prisma/generated/online";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get all warehouses with their sales data
    const warehouses = await prisma.warehouses_online.findMany({
      where: { isDeleted: false },
      include: {
        sale: {
          where: { isDeleted: false },
          include: {
            saleItems: true
          }
        },
        products: {
          where: { isDeleted: false }
        },
        users: {
          where: { isDeleted: false }
        },
        customer: {
          where: { isDeleted: false }
        }
      }
    });

    // Calculate analytics for each warehouse
    const warehouseAnalytics = warehouses.map(warehouse => {
      const totalSales = warehouse.sale.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
      const totalOrders = warehouse.sale.length;
      const totalProducts = warehouse.products.length;
      const totalUsers = warehouse.users.length;
      const totalCustomers = warehouse.customer.length;

      // Low stock products (quantity <= 10)
      const lowStockProducts = warehouse.products.filter(product => product.quantity <= 10).length;

      // Get monthly sales for last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const recentSales = warehouse.sale.filter(sale => 
        new Date(sale.createdAt) >= sixMonthsAgo
      );

      // Group sales by month
      const monthlySales = recentSales.reduce((acc: any, sale) => {
        const month = new Date(sale.createdAt).toLocaleString('default', { month: 'short' });
        if (!acc[month]) {
          acc[month] = { month, sales: 0, revenue: 0, orders: 0 };
        }
        acc[month].sales += sale.grandTotal || 0;
        acc[month].revenue += sale.grandTotal || 0;
        acc[month].orders += 1;
        return acc;
      }, {});

      const monthlyData = Object.values(monthlySales);

      return {
        id: warehouse.id,
        warehouseCode: warehouse.warehouseCode,
        name: warehouse.name,
        address: warehouse.address,
        phoneNumber: warehouse.phoneNumber,
        email: warehouse.email,
        description: warehouse.description,
        analytics: {
          totalSales,
          totalOrders,
          totalProducts,
          totalUsers,
          totalCustomers,
          lowStockProducts,
          avgOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
          monthlyData: monthlyData.slice(-6) // Last 6 months
        }
      };
    });

    // Sort warehouses by total sales (highest first)
    warehouseAnalytics.sort((a, b) => b.analytics.totalSales - a.analytics.totalSales);

    // Calculate overall statistics
    const totalRevenue = warehouseAnalytics.reduce((sum, w) => sum + w.analytics.totalSales, 0);
    const totalOrders = warehouseAnalytics.reduce((sum, w) => sum + w.analytics.totalOrders, 0);
    const totalProducts = warehouseAnalytics.reduce((sum, w) => sum + w.analytics.totalProducts, 0);

    return NextResponse.json({
      warehouses: warehouseAnalytics,
      summary: {
        totalWarehouses: warehouses.length,
        totalRevenue,
        totalOrders,
        totalProducts,
        topPerformer: warehouseAnalytics[0] || null
      }
    });
  } catch (error) {
    console.error('Error fetching warehouse analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse analytics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { warehouseId } = await req.json();

    // Get detailed analytics for a specific warehouse
    const warehouse = await prisma.warehouses_online.findUnique({
      where: { 
        warehouseCode: warehouseId,
        isDeleted: false 
      },
      include: {
        sale: {
          where: { isDeleted: false },
          include: {
            saleItems: {
              include: {
                Product_online: true
              }
            },
            Customer_online: true
          },
          orderBy: { createdAt: 'desc' }
        },
        products: {
          where: { isDeleted: false }
        },
        users: {
          where: { isDeleted: false }
        },
        customer: {
          where: { isDeleted: false }
        }
      }
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    // Calculate detailed analytics
    const totalSales = warehouse.sale.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
    const totalOrders = warehouse.sale.length;
    const totalProducts = warehouse.products.length;
    const totalUsers = warehouse.users.length;
    const totalCustomers = warehouse.customer.length;

    // Monthly sales data for last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlySalesData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthSales = warehouse.sale.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= monthStart && saleDate <= monthEnd;
      });

      const monthRevenue = monthSales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
      const monthOrders = monthSales.length;

      monthlySalesData.push({
        month: date.toLocaleString('default', { month: 'short' }),
        revenue: monthRevenue,
        orders: monthOrders,
        avgOrder: monthOrders > 0 ? monthRevenue / monthOrders : 0
      });
    }

    // Top selling products
    const productSales: any = {};
    warehouse.sale.forEach(sale => {
      sale.saleItems.forEach(item => {
        if (!productSales[item.id]) {
          productSales[item.id] = {
            productId: item.product_onlineId,
            productName: item.productName,
            totalQuantity: 0,
            totalRevenue: 0,
            timesOrdered: 0
          };
        }
        productSales[item.id].totalQuantity += item.quantity;
        productSales[item.id].totalRevenue += item.total;
        productSales[item.id].timesOrdered += 1;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Low stock alerts
    const lowStockProducts = warehouse.products
      .filter(product => product.quantity <= 10)
      .sort((a, b) => a.quantity - b.quantity);

    // Customer analytics
    const customerPurchases: any = {};
    warehouse.sale.forEach(sale => {
      if (sale.customer_onlineId) {
        if (!customerPurchases[sale.customer_onlineId]) {
          customerPurchases[sale.customer_onlineId] = {
            customerId: sale.customer_onlineId,
            customerName: sale.Customer_online?.name || 'Unknown',
            totalSpent: 0,
            totalOrders: 0,
            lastPurchase: sale.createdAt
          };
        }
        customerPurchases[sale.customer_onlineId].totalSpent += sale.grandTotal || 0;
        customerPurchases[sale.customer_onlineId].totalOrders += 1;
        if (new Date(sale.createdAt) > new Date(customerPurchases[sale.customer_onlineId].lastPurchase)) {
          customerPurchases[sale.customer_onlineId].lastPurchase = sale.createdAt;
        }
      }
    });

    const topCustomers = Object.values(customerPurchases)
      .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return NextResponse.json({
      warehouse: {
        ...warehouse,
        analytics: {
          totalSales,
          totalOrders,
          totalProducts,
          totalUsers,
          totalCustomers,
          avgOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
          lowStockCount: lowStockProducts.length
        }
      },
      monthlySalesData,
      topProducts,
      lowStockProducts,
      topCustomers,
      recentSales: warehouse.sale.slice(0, 20)
    });
  } catch (error) {
    console.error('Error fetching warehouse detailed analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse analytics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}