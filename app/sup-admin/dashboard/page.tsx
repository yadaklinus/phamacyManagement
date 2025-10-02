'use client'

import { useEffect, useState } from 'react'
import { AppSidebar } from "@/components/app-sidebar"
import { SalesVsPurchasesChart } from "@/components/sales-vs-purchases-chart"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Package, ShoppingCart, Users, DollarSign, Warehouse, TrendingUp, Eye, MapPin } from "lucide-react"
import { DashboardCard } from "./components/DashboardCard"
import { RecentSalesTable } from "./components/RecentSalesTable"
import { UserTable } from "./components/UserTable"
import { QuickActions } from './components/QuickActions'
import { SystemOverview } from './components/SystemOverview'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface DashboardStats {
  totalUsers: number
  totalWarehouses: number
  totalProducts: number
  totalSales: number
  totalCustomers: number
  totalRevenue: number
  recentSales: Array<{
    id: string
    customer: any
    amount: number
    date: string
    items: number
    products: string
  }>
}

interface WarehouseAnalytics {
  id: string
  warehouseCode: string
  name: string
  address: string
  phoneNumber: string
  email: string
  analytics: {
    totalSales: number
    totalOrders: number
    totalProducts: number
    totalUsers: number
    totalCustomers: number
    lowStockProducts: number
    avgOrderValue: number
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [warehouseAnalytics, setWarehouseAnalytics] = useState<{
    warehouses: WarehouseAnalytics[]
    summary: {
      totalWarehouses: number
      totalRevenue: number
      totalOrders: number
      totalProducts: number
      topPerformer: WarehouseAnalytics | null
    }
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, analyticsResponse] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/warehouse/analytics')
        ])

        if (!statsResponse.ok || !analyticsResponse.ok) {
          throw new Error('Failed to fetch dashboard data')
        }

        const [statsData, analyticsData] = await Promise.all([
          statsResponse.json(),
          analyticsResponse.json()
        ])

        setStats(statsData)
        setWarehouseAnalytics(analyticsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Dashboard error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <>   
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Super Admin Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <DashboardCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              description="registered users"
              icon={Users}
            />
            <DashboardCard
              title="Total Warehouses"
              value={stats?.totalWarehouses || 0}
              description="active warehouses"
              icon={Warehouse}
            />
            <DashboardCard
              title="Total Products"
              value={stats?.totalProducts || 0}
              description="in inventory"
              icon={Package}
            />
            <DashboardCard
              title="Total Sales"
              value={stats?.totalSales || 0}
              description="completed transactions"
              icon={ShoppingCart}
            />
            <DashboardCard
              title="Total Customers"
              value={stats?.totalCustomers || 0}
              description="registered customers"
              icon={Users}
            />
            <DashboardCard
              title="Total Revenue"
              value={`${(formatCurrency(stats?.totalRevenue || 0)).toLocaleString()}`}
              description="all-time revenue"
              icon={DollarSign}
            />
            
          </div>

          {/* Warehouse Analytics Section */}
          {warehouseAnalytics && (
            <>
              {/* Top Performer Card */}
              {warehouseAnalytics.summary.topPerformer && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Top Performing Warehouse
                    </CardTitle>
                    <CardDescription>
                      Warehouse with highest sales revenue
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                          <Warehouse className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-green-600">
                            {warehouseAnalytics.summary.topPerformer.name}
                          </h3>
                          <p className="text-sm text-muted-foreground font-mono">
                            {warehouseAnalytics.summary.topPerformer.warehouseCode}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{warehouseAnalytics.summary.topPerformer.address.split(',')[0]}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(warehouseAnalytics.summary.topPerformer.analytics.totalSales)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {warehouseAnalytics.summary.topPerformer.analytics.totalOrders} orders
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Avg: {formatCurrency(warehouseAnalytics.summary.topPerformer.analytics.avgOrderValue)}
                        </p>
                      </div>
                      <Button asChild size="sm">
                        <Link href={`/sup-admin/warehouses/${warehouseAnalytics.summary.topPerformer.warehouseCode}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Warehouse Performance Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Warehouse Performance</CardTitle>
                  <CardDescription>
                    Sales performance and analytics for all warehouses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Total Sales</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Products</TableHead>
                        <TableHead className="text-right">Users</TableHead>
                        <TableHead className="text-right">Avg Order</TableHead>
                        <TableHead className="text-right">Stock Alerts</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {warehouseAnalytics.warehouses.map((warehouse, index) => (
                        <TableRow key={warehouse.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{warehouse.name}</div>
                              <div className="text-sm text-muted-foreground font-mono">
                                {warehouse.warehouseCode}
                              </div>
                              {index === 0 && (
                                <Badge variant="default" className="bg-green-600 text-xs mt-1">
                                  Top Performer
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {warehouse.address.split(',')[0]}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(warehouse.analytics.totalSales)}
                          </TableCell>
                          <TableCell className="text-right">
                            {warehouse.analytics.totalOrders}
                          </TableCell>
                          <TableCell className="text-right">
                            {warehouse.analytics.totalProducts}
                          </TableCell>
                          <TableCell className="text-right">
                            {warehouse.analytics.totalUsers}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(warehouse.analytics.avgOrderValue)}
                          </TableCell>
                          <TableCell className="text-right">
                            {warehouse.analytics.lowStockProducts > 0 ? (
                              <Badge variant="destructive">
                                {warehouse.analytics.lowStockProducts}
                              </Badge>
                            ) : (
                              <span className="text-green-600">Good</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/sup-admin/warehouses/${warehouse.warehouseCode}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {/* Main Content Grid */}
          <div className="grid gap-4 lg:grid-cols-7">
            {/* Recent Sales Table */}
            <RecentSalesTable sales={stats?.recentSales || []} />

            {/* Right Column */}
            <div className="col-span-3 space-y-4">
              {/* Sales vs Purchases Chart */}
              {/* <Card>
                <CardHeader>
                  <CardTitle>Sales vs Purchases</CardTitle>
                  <CardDescription>Comparison of total sales and purchases</CardDescription>
                </CardHeader>
                              <CardContent>
                <SalesVsPurchasesChart />
              </CardContent>
            </Card> */}

            {/* Quick Actions */}
            <QuickActions />

            {/* System Overview */}
            <SystemOverview />
            </div>
          </div>

          {/* User Management Section */}
          {/* <div className="grid gap-4">
            <UserTable className="w-full" />
          </div> */}
        </div>
     </>
  )
}