"use client"


import * as XLSX from 'xlsx';

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Warehouse,
  MapPin,
  Users,
  Package,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Truck,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  Eye,
  BarChart3,
  PieChartIcon,
  Activity,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  Crown,
  Calendar,
  Target,
  Star,
  Search,
  Download,
  FileText
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts"
import fetchData from "@/hooks/fetch-data"
import { formatCurrency } from "@/lib/utils"
import fetchWareHouseData from "@/hooks/fetch-invidual-data"
import Link from "next/link"
import { SalesCalendar } from '@/components/sales-calendar';
import { DailySalesModal } from '@/components/daily-sales-modal';

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function WarehouseDetailsPage() {
  const router = useRouter()
  const path = usePathname()
  const [selectedPeriod, setSelectedPeriod] = useState("12months")
  const [detailedAnalytics, setDetailedAnalytics] = useState<any>(null)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  // const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [showDailyModal, setShowDailyModal] = useState(false)
  const wareHouseId = path?.split("/")[3]
  
  // Fetch warehouse data using the ID from params
  const { data: warehouseData, loading, error } = fetchWareHouseData(`/api/warehouse/list`,{id:wareHouseId})

  // Fetch detailed analytics
  useEffect(() => {
    const fetchDetailedAnalytics = async () => {
      if (!wareHouseId) return
      
      setIsLoadingAnalytics(true)
      try {
        const response = await fetch('/api/warehouse/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ warehouseId: wareHouseId })
        })
        
        if (response.ok) {
          const data = await response.json()
          setDetailedAnalytics(data)
        }
      } catch (error) {
        console.error('Error fetching detailed analytics:', error)
      } finally {
        setIsLoadingAnalytics(false)
      }
    }

    fetchDetailedAnalytics()
  }, [wareHouseId])

  const handleDateClick = (date: string) => {
      setSelectedDate(date)
      setShowDailyModal(true)
    }
  
    const handleCloseModal = () => {
      setShowDailyModal(false)
      setSelectedDate(null)
    }

  // useEffect(() => {
  //   if (!searchTerm.trim()) {
  //     setFilteredProducts([])
  //   }
  // }, [searchTerm])

  // Search products
  // const searchProducts = async () => {
  //   if (!wareHouseId || !searchTerm.trim()) {
  //     setFilteredProducts([])
  //     return
  //   }

  //   try {
  //     setIsSearching(true)
  //     const response = await fetch('/api/warehouse/products/search', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         warehouseId: wareHouseId,
  //         searchTerm: searchTerm.trim(),
  //         limit: 50
  //       })
  //     })

  //     if (response.ok) {
  //       const data = await response.json()
  //       setFilteredProducts(data.products)
  //     }
  //   } catch (error) {
  //     console.error('Error searching products:', error)
  //   } finally {
  //     setIsSearching(false)
  //   }
  // }

  // Export report
  const exportReport = async (reportType: string) => {
    if (!wareHouseId) return

    try {
      const response = await fetch('/api/warehouse/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          warehouseId: wareHouseId,
          reportType,
          month: selectedMonth,
          year: selectedYear
        })
      })

      if (response.ok) {
        // const data = await response.json()
        
        // //Create and download CSV file
        // const blob = new Blob([data.csvData], { type: 'text/csv' })
        // const url = window.URL.createObjectURL(blob)
        // const a = document.createElement('a')
        // a.href = url
        // a.download = data.filename
        // document.body.appendChild(a)
        // a.click()
        // window.URL.revokeObjectURL(url)
        // document.body.removeChild(a)
        
        const data = await response.json();

// Step 1: Parse CSV string into 2D array
const rows = data.csvData
  .trim()
  .split("\n")
  .map((row:any) => row.split(",").map((cell:any) => cell.replace(/^"|"$/g, "")));

// Step 2: Convert array of arrays to worksheet
const worksheet = XLSX.utils.aoa_to_sheet(rows);

// Step 3: Create workbook and append sheet
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

// Step 4: Trigger Excel download
XLSX.writeFile(workbook, data.filename.replace(".csv", ".xlsx"));
       console.log("sharp")
      }
    } catch (error) {
      console.error('Error exporting report:', error)
    }
  }

  // Generate monthly report
  const generateMonthlyReport = async () => {
    if (!wareHouseId) return

    try {
      const response = await fetch('/api/warehouse/reports/monthly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          warehouseId: wareHouseId,
          month: selectedMonth,
          year: selectedYear,
          reportType: 'all'
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Handle the report data as needed
        //console.log('Monthly report generated:', data)
      }
    } catch (error) {
      console.error('Error generating monthly report:', error)
    }
  }

  const filteredProducts = warehouseData?.products?.filter((product:any) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.toLowerCase().includes(searchTerm.toLowerCase()) 


    return matchesSearch
  })

  const productSum = warehouseData?.products?.reduce((sum:any, sale:any) => sum + sale.cost, 0)
  const productRetailSum = warehouseData?.products?.reduce((sum:any, sale:any) => sum + sale.retailPrice, 0)
  const productWholesaleSum = warehouseData?.products?.reduce((sum:any, sale:any) => sum + sale.wholeSalePrice, 0)

  // Loading state
  if (loading) {
    return (
      <>
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="text-center">
              <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-muted-foreground">Loading warehouse details...</p>
            </div>
          </div>
       </>
    )
  }

  // Error state
  if (error || !warehouseData) {
    return (
      <>
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="text-center max-w-md">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
              <h2 className="text-2xl font-semibold mb-2">Warehouse Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The warehouse you're looking for doesn't exist or has been removed.
              </p>
              <Button 
                onClick={() => router.push('/sup-admin/warehouses/list')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Warehouses
              </Button>
            </div>
          </div>
       </>
    )
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge variant="default" className="bg-red-600">
            Admin
          </Badge>
        )
      case "manager":
        return (
          <Badge variant="default" className="bg-blue-600">
            Manager
          </Badge>
        )
      case "staff":
        return <Badge variant="secondary">Staff</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getStockStatus = (quantity: number) => {
    if (quantity <= 5) return { status: 'Critical', color: 'text-red-600', bg: 'bg-red-100' }
    if (quantity <= 10) return { status: 'Low', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { status: 'Good', color: 'text-green-600', bg: 'bg-green-100' }
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
                  <BreadcrumbLink href="/sup-admin/dashboard">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/sup-admin/warehouses/list">Warehouses</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{warehouseData.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Warehouse Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg">
                <Warehouse className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-blue-600">{warehouseData.name}</h1>
                <p className="text-muted-foreground font-mono">{warehouseData.warehouseCode}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{warehouseData.address}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{warehouseData.stats?.assignedUsers || 0} Users</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => router.push('/sup-admin/warehouses/list')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to List
              </Button>
              <Button asChild className="gap-2">
                <Link href={`/sup-admin/warehouses/${wareHouseId}/edit`}>
                  <Edit className="h-4 w-4" />
                  Edit Warehouse
                </Link>
              </Button>
            </div>
          </div>

          {/* Warehouse Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{warehouseData.stats?.totalProducts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Active inventory items
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(warehouseData.stats?.totalSales)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total sales amount
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{warehouseData.stats?.totalOrders || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Completed transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{warehouseData.stats?.assignedUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Active warehouse staff
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Product Vlaue </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(productSum) || 0}</div>
               
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Product Retail Vlaue </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(productRetailSum) || 0}</div>
               
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Product WholeSale Vlaue </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(productWholesaleSum) || 0}</div>
               
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Alert */}
          {detailedAnalytics?.lowStockProducts && detailedAnalytics.lowStockProducts.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Low Stock Alert</p>
                    <p className="text-sm">
                      {detailedAnalytics.lowStockProducts.length} products are running low on stock
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warehouse Details */}
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Information</CardTitle>
              <CardDescription>
                Basic details and contact information for this warehouse
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Warehouse Name</Label>
                <p className="text-sm text-muted-foreground">{warehouseData.name}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Warehouse Code</Label>
                <p className="text-sm text-muted-foreground">{warehouseData.warehouseCode}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm text-muted-foreground">{warehouseData.email}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Phone Number</Label>
                <p className="text-sm text-muted-foreground">{warehouseData.phoneNumber}</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium">Address</Label>
                <p className="text-sm text-muted-foreground">{warehouseData.address}</p>
              </div>
              {warehouseData.description && (
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground">{warehouseData.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="analytics" className="space-y-4">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              
            </TabsList>

            <TabsContent value="analytics" className="space-y-4">
              {isLoadingAnalytics ? (
                <div className="flex items-center justify-center py-8">
                  <Activity className="h-6 w-6 animate-spin mr-2" />
                  Loading analytics...
                </div>
              ) : detailedAnalytics ? (
                <>
                  {/* Monthly Sales Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Monthly Sales Performance
                      </CardTitle>
                      <CardDescription>
                        Revenue and order trends over the last 12 months
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={detailedAnalytics.monthlySalesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'revenue' ? formatCurrency(value as number) : value,
                              name === 'revenue' ? 'Revenue' : 'Orders'
                            ]}
                          />
                          <Bar dataKey="revenue" fill="#3b82f6" name="revenue" />
                          <Bar dataKey="orders" fill="#10b981" name="orders" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Top Products and Top Customers */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Star className="h-5 w-5" />
                          Top Selling Products
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {detailedAnalytics.topProducts.slice(0, 5).map((product: any, index: number) => (
                            <div key={`product.productId ${Math.random()}`} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{product.productName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {product.totalQuantity} units sold
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{formatCurrency(product.totalRevenue)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Crown className="h-5 w-5" />
                          Top Customers
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {detailedAnalytics.topCustomers.slice(0, 5).map((customer: any, index: number) => (
                            <div key={customer.customerId} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-medium">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{customer.customerName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {customer.totalOrders} orders
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{formatCurrency(customer.totalSpent)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No analytics data available</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              {/* Search Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Search Products</CardTitle>
                  <CardDescription>
                    Search for products by name, barcode, or description
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      
                      className="flex-1"
                    />
                    {/* <Button onClick={searchProducts} disabled={isSearching}>
                      {isSearching ? (
                        <Activity className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button> */}
                  </div>
                </CardContent>
              </Card>

              {/* Stock Overview Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Total Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{warehouseData.products?.length || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Low Stock Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {warehouseData.products?.filter((p: any) => p.quantity <= 10).length || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Out of Stock</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {warehouseData.products?.filter((p: any) => p.quantity === 0).length || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Product Inventory</CardTitle>
                  <CardDescription>
                    All products currently stored in this warehouse
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(filteredProducts.length > 0 ? filteredProducts : warehouseData.products) && 
                   (filteredProducts.length > 0 ? filteredProducts : warehouseData.products).length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Barcode</TableHead>
                          <TableHead>Stock Status</TableHead>
                          <TableHead>Stock Level</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead>Wholesale Price</TableHead>
                          <TableHead>Retail Price</TableHead>
                          {/* <TableHead>Action</TableHead> */}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(filteredProducts.length > 0 ? filteredProducts : warehouseData.products).map((product: any) => {
                          const stockStatus = getStockStatus(product.quantity)
                          return (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell className="font-mono">{product.barcode}</TableCell>
                              <TableCell>
                                <Badge className={`${stockStatus.bg} ${stockStatus.color}`}>
                                  {stockStatus.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className={product.quantity <= 10 ? "text-red-500 font-medium" : "text-green-500"}>
                                    {product.quantity}
                                  </span>
                                  <Progress 
                                    value={Math.min((product.quantity / 50) * 100, 100)} 
                                    className="w-16 h-2"
                                  />
                                </div>
                              </TableCell>
                              <TableCell>{product.unit}</TableCell>
                              <TableCell>{formatCurrency(product.cost)}</TableCell>
                              <TableCell>{formatCurrency(product.wholeSalePrice)}</TableCell>
                              <TableCell>{formatCurrency(product.retailPrice)}</TableCell>
                              {/* <TableCell>
                                <div className="flex gap-2">
                                  <Link href={`/sup-admin/warehouses/${wareHouseId}/${product.id}`}>
                                    <Button variant="outline" size="sm" className="gap-1">
                                      <Eye className="h-3 w-3" />
                                      View Details
                                    </Button>
                                  </Link>
                                  <Link href={`/sup-admin/warehouses/wh002/${product.id}/stock-tracking?product=${product.id}`}>
                                    <Button variant="outline" size="sm" className="gap-1">
                                      <Activity className="h-3 w-3" />
                                      Stock Tracking
                                    </Button>
                                  </Link>
                                </div>
                              </TableCell> */}
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No Products Found</h3>
                      <p className="text-muted-foreground">
                        This warehouse doesn't have any products yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Sales</CardTitle>
                  <CardDescription>
                    Latest sales transactions from this warehouse
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {warehouseData.sale && warehouseData.sale.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sale ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {warehouseData.sale.slice(0, 20).map((sale: any) => (
                          <TableRow key={sale.id}>
                            <TableCell className="font-medium">{sale.invoiceNo}</TableCell>
                            <TableCell>
                              {new Date(sale.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{sale.selectedCustomer?.name || 'Walk-in Customer'}</TableCell>
                            <TableCell>{sale.saleItems?.length || 0}</TableCell>
                            <TableCell>{formatCurrency(sale.grandTotal)}</TableCell>
                            <TableCell>{formatCurrency(sale.balance)}</TableCell>
                            <TableCell>
                              {sale.balance == 0 &&
                              <Badge variant="default" className="bg-green-600">
                              Completed
                            </Badge>
                            }
                            {sale.balance === sale.grandTotal && 
                            <Badge variant="default" className="bg-red-600">
                            Not Paid
                          </Badge>
                          }
                          {(sale.balance > 0 && sale.balance < sale.grandTotal) &&
                           <Badge variant="default" className="bg-yellow-600">
                           Pending
                         </Badge>
                         }
                             
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No Sales Found</h3>
                      <p className="text-muted-foreground">
                        This warehouse doesn't have any sales records yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Analytics</CardTitle>
                  <CardDescription>
                    Customer insights and purchasing patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {detailedAnalytics?.topCustomers && detailedAnalytics.topCustomers.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer Name</TableHead>
                          <TableHead className="text-right">Total Spent</TableHead>
                          <TableHead className="text-right">Orders</TableHead>
                          <TableHead className="text-right">Avg Order</TableHead>
                          <TableHead>Last Purchase</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailedAnalytics.topCustomers.map((customer: any, index: number) => (
                          <TableRow key={customer.customerId}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {index < 3 && (
                                  <Crown className="h-4 w-4 text-yellow-500" />
                                )}
                                <span className="font-medium">{customer.customerName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(customer.totalSpent)}
                            </TableCell>
                            <TableCell className="text-right">{customer.totalOrders}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(customer.totalSpent / customer.totalOrders)}
                            </TableCell>
                            <TableCell>
                              {new Date(customer.lastPurchase).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No Customer Data</h3>
                      <p className="text-muted-foreground">
                        Customer analytics will appear here once sales are recorded.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Assigned Users</h2>
                  <p className="text-sm text-muted-foreground">
                    Users who have access to this warehouse
                  </p>
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  {warehouseData.users && warehouseData.users.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {warehouseData.users.map((user: any) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src="" alt={user.userName} />
                                  <AvatarFallback>
                                    {user.userName
                                      .split(" ")
                                      .map((n: string) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{user.userName}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.phoneNumber}</TableCell>
                            <TableCell>
                              {user.lastLogin 
                                ? new Date(user.lastLogin).toLocaleDateString()
                                : 'Never'
                              }
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Profile
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Permissions
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove from Warehouse
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No Users Assigned</h3>
                      <p className="text-muted-foreground">
                        This warehouse doesn't have any assigned users yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              {/* Report Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Configuration</CardTitle>
                  <CardDescription>
                    Configure the period for your reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="month">Month</Label>
                      <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                            <SelectItem key={month} value={month.toString()}>
                              {new Date(2024, month - 1).toLocaleDateString('en-US', { month: 'long' })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Revenue</span>
                      <span className="font-medium">{formatCurrency(warehouseData.stats?.totalSales || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Orders</span>
                      <span className="font-medium">{warehouseData.stats?.totalOrders || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Order Value</span>
                      <span className="font-medium">
                        {formatCurrency((warehouseData.stats?.totalSales || 0) / (warehouseData.stats?.totalOrders || 1))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Products in Stock</span>
                      <span className="font-medium">{warehouseData.stats?.totalProducts || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Staff Members</span>
                      <span className="font-medium">{warehouseData.stats?.assignedUsers || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Export Reports</CardTitle>
                    <CardDescription>
                      Generate and download various reports
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => exportReport('monthly')}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Export Monthly Report
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => exportReport('inventory')}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Export Inventory Report
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => exportReport('sales')}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Export Sales Report
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={generateMonthlyReport}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Generate Monthly Analytics
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="calendar" className="space-y-4">
                          <div className="space-y-4">
                            <div>
                              <h2 className="text-lg font-semibold">Daily Sales Calendar</h2>
                              <p className="text-sm text-muted-foreground">
                                Click on any date to view detailed sales information and export data
                              </p>
                            </div>
                            
                            <SalesCalendar
                              warehouseId={wareHouseId}
                              onDateClick={handleDateClick}
                              apiEndpoint="/api/sale/daily-analytics-online"
                              className="w-full"
                            />
                          </div>
                        </TabsContent>
          </Tabs>
        </div>

        {/* Daily Sales Modal */}
                <DailySalesModal
                  isOpen={showDailyModal}
                  onClose={handleCloseModal}
                  date={selectedDate}
                  warehouseId={wareHouseId}
                  warehouseName={warehouseData?.name || "Warehouse"}
                  apiEndpoint="/api/sale/daily-analytics-online"
                />
     </>
  )
}