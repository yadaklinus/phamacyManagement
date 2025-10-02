"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  LineChart,
  Line,
} from "recharts"
import {
  Truck,
  DollarSign,
  AlertTriangle,
  Loader2,
  Package,
  Calendar,
  Building2,
  TrendingDown,
} from "lucide-react"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import { useSession } from "next-auth/react"
import { formatCurrency } from "@/lib/utils"
import fetchWareHouseData from "@/hooks/fetch-invidual-data"

interface PurchaseDashboardData {
  metrics: {
    totalPurchases: number
    totalPurchaseValue: number
    avgPurchaseValue: number
    totalSuppliers: number
    pendingOrders: number
    todayPurchases: number
    monthlyGrowth: number
  }
  recentPurchases: Array<{
    id: string
    orderNo: string
    supplierName: string
    grandTotal: number
    createdAt: string
    status: string
    itemsCount: number
  }>
  topSuppliers: Array<{
    supplierId: string
    name: string
    purchases: number
    totalValue: number
  }>
  purchasesByMonth: Array<{
    month: string
    purchases: number
    value: number
  }>
  purchasesByStatus: Array<{
    status: string
    count: number
    color: string
  }>
  dailyPurchases: Array<{
    date: string
    purchases: number
    value: number
  }>
  lowStockAlerts: Array<{
    productId: string
    name: string
    currentStock: number
    minStock: number
  }>
}

export default function PurchaseDashboard() {
  const [data, setData] = useState<PurchaseDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const warehouseId = getWareHouseId()
  const { data: session } = useSession()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Mock data for demonstration since the API might not exist yet
        const mockData: PurchaseDashboardData = {
          metrics: {
            totalPurchases: 856,
            totalPurchaseValue: 98750.25,
            avgPurchaseValue: 115.38,
            totalSuppliers: 45,
            pendingOrders: 12,
            todayPurchases: 8,
            monthlyGrowth: -3.2
          },
          recentPurchases: [
            {
              id: "1",
              orderNo: "PO-001",
              supplierName: "ABC Supplies Co.",
              grandTotal: 1250.00,
              createdAt: new Date().toISOString(),
              status: "Completed",
              itemsCount: 5
            },
            {
              id: "2", 
              orderNo: "PO-002",
              supplierName: "XYZ Materials Ltd.",
              grandTotal: 890.50,
              createdAt: new Date().toISOString(),
              status: "Pending",
              itemsCount: 3
            }
          ],
          topSuppliers: [
            { supplierId: "1", name: "ABC Supplies Co.", purchases: 25, totalValue: 15000 },
            { supplierId: "2", name: "XYZ Materials Ltd.", purchases: 18, totalValue: 12500 },
            { supplierId: "3", name: "Global Parts Inc.", purchases: 15, totalValue: 9800 }
          ],
          purchasesByMonth: [
            { month: "Jan", purchases: 95, value: 18000 },
            { month: "Feb", purchases: 88, value: 16500 },
            { month: "Mar", purchases: 102, value: 19800 },
            { month: "Apr", purchases: 112, value: 21200 }
          ],
          purchasesByStatus: [
            { status: "Completed", count: 65, color: "#00C49F" },
            { status: "Pending", count: 25, color: "#FFBB28" },
            { status: "Cancelled", count: 10, color: "#FF8042" }
          ],
          dailyPurchases: [
            { date: "Mon", purchases: 8, value: 1800 },
            { date: "Tue", purchases: 12, value: 2400 },
            { date: "Wed", purchases: 6, value: 1200 },
            { date: "Thu", purchases: 15, value: 3000 },
            { date: "Fri", purchases: 18, value: 3600 },
            { date: "Sat", purchases: 4, value: 800 },
            { date: "Sun", purchases: 2, value: 400 }
          ],
          lowStockAlerts: [
            { productId: "1", name: "Product X", currentStock: 5, minStock: 20 },
            { productId: "2", name: "Product Y", currentStock: 8, minStock: 25 },
            { productId: "3", name: "Product Z", currentStock: 12, minStock: 30 }
          ]
        }
        
        setData(mockData)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setData({
          metrics: {
            totalPurchases: 856,
            totalPurchaseValue: 98750.25,
            avgPurchaseValue: 115.38,
            totalSuppliers: 45,
            pendingOrders: 12,
            todayPurchases: 8,
            monthlyGrowth: -3.2
          },
          recentPurchases: [],
          topSuppliers: [],
          purchasesByMonth: [],
          purchasesByStatus: [],
          dailyPurchases: [],
          lowStockAlerts: []
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [warehouseId, session])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertTriangle className="h-8 w-8 text-yellow-500" />
        <span className="ml-2">Failed to load dashboard data</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Purchase Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your purchase operations and supplier management
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.totalPurchases.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              {Math.abs(data.metrics.monthlyGrowth)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchase Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.metrics.totalPurchaseValue)}</div>
            <p className="text-xs text-muted-foreground">
              Average: {formatCurrency(data.metrics.avgPurchaseValue)} per order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              {data.metrics.pendingOrders} pending orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.todayPurchases}</div>
            <p className="text-xs text-muted-foreground">
              Purchase orders today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {data.lowStockAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>Products that need to be restocked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.lowStockAlerts.map((item) => (
                <div key={item.productId} className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Current: {item.currentStock} | Minimum: {item.minStock}
                    </p>
                  </div>
                  <Badge variant="destructive">Low Stock</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Purchase Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Purchase Trend</CardTitle>
            <CardDescription>Monthly purchase orders and value</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.purchasesByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="purchases" 
                  stackId="2" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Purchase Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Distribution by order status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.purchasesByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.purchasesByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Purchases and Top Suppliers */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Weekly Purchases */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Purchases</CardTitle>
            <CardDescription>Daily purchase activity this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.dailyPurchases}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="purchases" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Suppliers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Suppliers</CardTitle>
            <CardDescription>Suppliers by purchase volume</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topSuppliers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="purchases" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Purchases */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Purchase Orders</CardTitle>
          <CardDescription>Latest purchase transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentPurchases.length > 0 ? (
            <div className="space-y-4">
              {data.recentPurchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between border-b pb-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{purchase.orderNo}</p>
                    <p className="text-sm text-muted-foreground">{purchase.supplierName}</p>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={purchase.status === "Completed" ? "default" : purchase.status === "Pending" ? "secondary" : "destructive"}
                      >
                        {purchase.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {purchase.itemsCount} item{purchase.itemsCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(purchase.grandTotal)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(purchase.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Truck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No recent purchases found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}