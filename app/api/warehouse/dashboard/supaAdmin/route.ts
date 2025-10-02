import { PrismaClient } from "@/prisma/generated/online";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function POST(req:NextRequest) {
  try {
    const { warehouseId } = await req.json()

    //console.log(warehouseId)

    // Get warehouse info first
    const warehouse = await prisma.warehouses_online.findUnique({
      where: { warehouseCode: warehouseId,isDeleted:false }
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    // Fetch warehouse-specific statistics
    const [
      totalUsers,
      totalProducts,
      totalSales,
      totalCustomers,
      totalSuppliers,
      recentSales,
      lowStockProducts,
      topProducts,
      salesByMonth
    ] = [
      // Total users in this warehouse
      await prisma.users_online.count({
        where: { warehouses_onlineId: warehouseId,isDeleted:false }
      }),
      
      // Total products in this warehouse
      await prisma.product_online.count({
        where: { warehouses_onlineId: warehouseId,isDeleted:false }
      }),
      
      // Total sales for this warehouse
      await prisma.sale_online.count({
        where: { warehouses_onlineId: warehouseId,isDeleted:false }
      }),
      
      // Total customers for this warehouse
      await prisma.customer_online.count({
        where: { warehouses_onlineId: warehouseId,isDeleted:false }
      }),
      
      // Total suppliers for this warehouse
      await prisma.supplier_online.count({
        where: { warehouses_onlineId: warehouseId,isDeleted:false }
      }),
      
      // Recent sales for this warehouse
      await prisma.sale_online.findMany({
        where: { warehouses_onlineId: warehouseId,isDeleted:false },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          Customer_online: true,
          paymentMethod: true,
          saleItems: {
            include: {
              Product_online: true
            }
          }
        }
      }),
      
      // Low stock products (quantity <= 5)
      await prisma.product_online.findMany({
        where: { 
          warehouses_onlineId: warehouseId,
          isDeleted:false,
          quantity: { lte: 5 }
        },
        take: 10,
        orderBy: { quantity: 'asc' }
      }),
      
      // Top selling products by quantity
      await prisma.saleItem_online.groupBy({
        by: ['product_onlineId', 'productName'],
        where: { warehouses_onlineId: warehouseId,isDeleted:false },
        _sum: {
          quantity: true,
          total: true
        },
        orderBy: {
          _sum: {
            total: 'desc'
          }
        },
        take: 5
      }),
      
      // Sales by month for the last 6 months
      await prisma.$queryRaw`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
          COUNT(*)::int as sales,
          SUM("grandTotal")::float as revenue
        FROM "Sale_online" 
        WHERE "warehouses_onlineId" = ${warehouseId} AND "isDeleted" = ${false}
          AND "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt")
      `
    // await prisma.$queryRawUnsafe(`
    //     SELECT 
    //       strftime('%Y-%m', "createdAt") AS month,
    //       COUNT(*) AS sales,
    //       SUM("grandTotal") AS revenue
    //     FROM "Sale"
    //     WHERE "warehouses_onlineId" = ?
    //       AND "createdAt" >= datetime('now', '-6 months')
    //     GROUP BY strftime('%Y-%m', "createdAt")
    //     ORDER BY strftime('%Y-%m', "createdAt")
    //   `, warehouseId)


    ];

    // Calculate total revenue for this warehouse
    const totalRevenue = await prisma.sale_online.aggregate({
      where: { warehouses_onlineId: warehouseId,isDeleted:false },
      _sum: {
        grandTotal: true
      }
    });

    // Get user roles distribution for this warehouse
    const userRoles = await prisma.users_online.groupBy({
      by: ['role'],
      where: { warehouses_onlineId: warehouseId,isDeleted:false },
      _count: {
        role: true
      }
    });

    // Get customer types distribution for this warehouse
    const customerTypes = await prisma.customer_online.groupBy({
      by: ['type'],
      where: { warehouses_onlineId: warehouseId,isDeleted:false },
      _count: {
        type: true
      }
    });

    // Calculate average sale value
    const avgSaleValue = totalSales > 0 ? (totalRevenue._sum.grandTotal || 0) / totalSales : 0;

    return NextResponse.json({
      warehouse: {
        id: warehouse.id,
        name: warehouse.name,
        code: warehouse.warehouseCode,
        address: warehouse.address,
        email: warehouse.email,
        phone: warehouse.phoneNumber
      },
      metrics: {
        totalUsers,
        totalProducts,
        totalSales,
        totalCustomers,
        totalSuppliers,
        totalRevenue: totalRevenue._sum.grandTotal || 0,
        avgSaleValue
      },
      recentSales: recentSales.map((sale: any) => ({
        id: sale.id,
        invoiceNo: sale.invoiceNo,
        customerName: sale.selectedCustomer?.name || 'Walk-in Customer',
        grandTotal: sale.grandTotal,
        createdAt: sale.createdAt,
        paymentMethod: sale.paymentMethod?.[0]?.method || 'cash',
        itemsCount: sale.saleItems.length
      })),
      lowStockProducts: lowStockProducts.map((product: any) => ({
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        quantity: product.quantity,
        unit: product.unit
      })),
      topProducts: topProducts.map((product: any) => ({
        productId: product.productId,
        name: product.productName,
        sales: product._sum.quantity,
        revenue: product._sum.total
      })),
      salesByMonth: salesByMonth || [],
      userRoles: userRoles.map((role: any) => ({
        name: role.role,
        value: role._count.role,
        color: role.role === 'admin' ? '#10b981' : role.role === 'sales' ? '#3b82f6' : '#f59e0b'
      })),
      customerTypes: customerTypes.map((type: any) => ({
        name: type.type,
        value: type._count.type,
        color: type.type === 'retal' ? '#3b82f6' : '#10b981'
      }))
    });
  } catch (error) {
    console.error('Failed to fetch warehouse dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse dashboard statistics' },
      { status: 500 }
    );
  }
}