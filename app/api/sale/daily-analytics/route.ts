import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/prisma/generated/offline"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get('warehouseId')
    const month = searchParams.get('month') // Format: YYYY-MM
    const date = searchParams.get('date') // Format: YYYY-MM-DD for specific day

    if (!warehouseId) {
      return NextResponse.json({ error: 'Warehouse ID is required' }, { status: 400 })
    }

    // If specific date is requested, return detailed data for that day
    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const dailyData = await prisma.sale.findMany({
        where: {
          warehousesId: warehouseId,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          },
          isDeleted: false
        },
        include: {
          saleItems: {
            where: {
              isDeleted: false
            }
          },
          selectedCustomer: true,
          paymentMethod: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      const totalSales = dailyData.reduce((sum, sale) => sum + sale.grandTotal, 0)
      const totalProfit = dailyData.reduce((sum, sale) => {
        return sum + sale.saleItems.reduce((itemSum, item) => itemSum + (item.profit * item.quantity), 0)
      }, 0)

      const productBreakdown = dailyData.reduce((acc, sale) => {
        sale.saleItems.forEach(item => {
          if (acc[item.productName]) {
            acc[item.productName].quantity += item.quantity
            acc[item.productName].totalSales += item.total
            acc[item.productName].totalProfit += (item.profit * item.quantity)
          } else {
            acc[item.productName] = {
              productName: item.productName,
              quantity: item.quantity,
              totalSales: item.total,
              totalProfit: (item.profit * item.quantity)
            }
          }
        })
        return acc
      }, {} as Record<string, any>)

      return NextResponse.json({
        date,
        totalSales,
        totalProfit,
        transactionCount: dailyData.length,
        sales: dailyData,
        productBreakdown: Object.values(productBreakdown)
      })
    }

    // Get monthly data if month is specified, otherwise current month
    const targetDate = month ? new Date(month + '-01') : new Date()
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999)

    // Get all sales for the month
    const salesData = await prisma.saleItem.findMany({
      where: {
        warehousesId: warehouseId,
        sale: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          },
          isDeleted: false
        },
        isDeleted: false
      },
      include: {
        sale: true
      }
    })

    // Group by day
    const dailyStats = salesData.reduce((acc, item) => {
      const date = item.sale?.createdAt.toISOString().split('T')[0]
      if (!date) return acc

      if (!acc[date]) {
        acc[date] = {
          date,
          totalSales: 0,
          totalProfit: 0,
          transactionCount: new Set()
        }
      }

      acc[date].totalSales += item.total
      acc[date].totalProfit += (item.profit * item.quantity)
      if (item.sale?.invoiceNo) {
        acc[date].transactionCount.add(item.sale.invoiceNo)
      }

      return acc
    }, {} as Record<string, any>)

    // Convert to array and format
    const formattedData = Object.values(dailyStats).map((day: any) => ({
      ...day,
      transactionCount: day.transactionCount.size
    }))

    return NextResponse.json({
      month: targetDate.toISOString().slice(0, 7),
      dailyStats: formattedData,
      monthlyTotal: {
        totalSales: formattedData.reduce((sum: number, day: any) => sum + day.totalSales, 0),
        totalProfit: formattedData.reduce((sum: number, day: any) => sum + day.totalProfit, 0),
        totalTransactions: formattedData.reduce((sum: number, day: any) => sum + day.transactionCount, 0)
      }
    })

  } catch (error) {
    console.error('Error fetching daily analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}