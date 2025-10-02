import { NextResponse } from "next/server";

import onlinePrisma from "@/lib/onlinePrisma";

export async function GET() {
  try {
    // Fetch dashboard statistics from the database
    const [
      totalUsers,
      totalWarehouses,
      totalProducts,
      totalSales,
      totalCustomers,
      recentSales
    ] = await Promise.all([
      onlinePrisma.users_online.count({where:{isDeleted:false}}),
      onlinePrisma.warehouses_online.count({where:{isDeleted:false}}),
      onlinePrisma.product_online.count({where:{isDeleted:false}}),
      onlinePrisma.sale_online.count({where:{isDeleted:false}}),
      onlinePrisma.customer_online.count({where:{isDeleted:false}}),
      onlinePrisma.sale_online.findMany({
        where:{isDeleted:false},
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          Customer_online:true,
          saleItems: {
            include: {
              Product_online: true
            }
          }
        }
      })
    ])

    // Calculate total sales amount
    const totalSalesAmount = await onlinePrisma.sale_online.aggregate({
      where:{isDeleted:false},
      _sum: {
        grandTotal: true
      }
    })

    // Calculate total revenue and profit
    const totalRevenue = totalSalesAmount._sum.grandTotal || 0

    return NextResponse.json({
      totalUsers,
      totalWarehouses,
      totalProducts,
      totalSales,
      totalCustomers,
      totalRevenue,
      recentSales: recentSales.map((sale:any) => ({
        id: sale.invoiceNo,
        customer: sale.Customer_online,
        amount: sale.grandTotal,
        date: sale.createdAt.toISOString(),
        items: sale.saleItems.length,
        products: sale.saleItems.map((item:any) => item.productName).join(', ')
      }))
    })
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}