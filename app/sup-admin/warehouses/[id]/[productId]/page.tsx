"use client"

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
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Package,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Truck,
  ArrowLeft,
  AlertTriangle,
  Calendar,
  BarChart3,
  Activity,
  Eye,
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
  Bar
} from "recharts"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import axios from "axios"

export default function ProductDetailsPage() {
  const router = useRouter()
  const path = usePathname()
  const [productData, setProductData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const pathSegments = path?.split("/")
  const warehouseId = pathSegments?.[3]
  const productId = pathSegments?.[4]

  useEffect(() => {
    const fetchProductData = async () => {
      if (!warehouseId || !productId) return

      try {
        setLoading(true)
        // const response = await fetch(`/api/warehouse/products/id?warehouseId=${warehouseId}?productId=${productId}`)
        const response = await axios.post("/api/warehouse/products/id",{warehouseId,productId})
        
        
        if (response.status !== 200) {
          throw new Error('Failed to fetch product data')
        }

        
        setProductData(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchProductData()
  }, [warehouseId, productId])

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800', bg: 'bg-red-100', textColor: 'text-red-800' }
    if (quantity <= 10) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', bg: 'bg-yellow-100', textColor: 'text-yellow-800' }
    return { status: 'In Stock', color: 'bg-green-100 text-green-800', bg: 'bg-green-100', textColor: 'text-green-800' }
  }

  if (loading) {
    return (
      <>
          <div className="flex items-center justify-center h-screen">
            <Activity className="h-6 w-6 animate-spin mr-2" />
            Loading product details...
          </div>
       </>
    )
  }

  if (error || !productData) {
    return (
     <>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-medium mb-2">Error Loading Product</h3>
              <p className="text-muted-foreground mb-4">{error || 'Product not found'}</p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </div>
       </>
    )
  }

  const { product, statistics, salesHistory, purchaseHistory, monthlyData, warehouse } = productData
  const stockStatus = getStockStatus(product.quantity)

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
                  <BreadcrumbLink href={`/sup-admin/warehouses/${warehouseId}`}>
                    {warehouse.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{product.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Product Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-blue-600">{product.name}</h1>
                <p className="text-muted-foreground font-mono">{product.barcode}</p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge className={stockStatus.color}>
                    {stockStatus.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {product.quantity} {product.unit} in stock
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </div>

          {/* Product Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Stock</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{product.quantity}</div>
                <p className="text-xs text-muted-foreground">
                  {product.unit} available
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sold</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalSold}</div>
                <p className="text-xs text-muted-foreground">
                  {product.unit} sold
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(statistics.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From sales
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(statistics.profit)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Revenue - Cost
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>
                Detailed product specifications and pricing
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Product Name</Label>
                <p className="text-sm text-muted-foreground">{product.name}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Barcode</Label>
                <p className="text-sm text-muted-foreground font-mono">{product.barcode}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Cost Price</Label>
                <p className="text-sm text-muted-foreground">{formatCurrency(product.cost)}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Wholesale Price</Label>
                <p className="text-sm text-muted-foreground">{formatCurrency(product.wholeSalePrice)}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Retail Price</Label>
                <p className="text-sm text-muted-foreground">{formatCurrency(product.retailPrice)}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Unit</Label>
                <p className="text-sm text-muted-foreground">{product.unit}</p>
              </div>
              {product.description && (
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="analytics" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="sales">Sales History</TabsTrigger>
              <TabsTrigger value="purchases">Purchase History</TabsTrigger>
              <TabsTrigger value="stock">Stock Tracking</TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="space-y-4">
              {/* Monthly Sales Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Monthly Sales Performance
                  </CardTitle>
                  <CardDescription>
                    Product sales over the last 12 months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {monthlyData && monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          formatter={(value: any, name: string) => [
                            name === 'quantity' ? `${value} ${product.unit}` : formatCurrency(value),
                            name === 'quantity' ? 'Quantity Sold' : 'Revenue'
                          ]}
                        />
                        <Bar dataKey="quantity" fill="#0088FE" name="quantity" />
                        <Bar dataKey="revenue" fill="#00C49F" name="revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No Sales Data</h3>
                      <p className="text-muted-foreground">
                        No sales data available for this product.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Purchased</span>
                      <span className="font-medium">{statistics.totalPurchased} {product.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Sold</span>
                      <span className="font-medium">{statistics.totalSold} {product.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stock Value</span>
                      <span className="font-medium">{formatCurrency(statistics.stockValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profit Margin</span>
                      <span className="font-medium">
                        {statistics.totalRevenue > 0 
                          ? `${((statistics.profit / statistics.totalRevenue) * 100).toFixed(1)}%`
                          : '0%'
                        }
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Stock Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current Stock</span>
                        <span>{product.quantity} {product.unit}</span>
                      </div>
                      <Progress 
                        value={Math.min((product.quantity / 100) * 100, 100)} 
                        className="h-2"
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {product.quantity === 0 && (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          Out of stock
                        </div>
                      )}
                      {product.quantity > 0 && product.quantity <= 10 && (
                        <div className="flex items-center gap-2 text-yellow-600">
                          <AlertTriangle className="h-4 w-4" />
                          Low stock alert
                        </div>
                      )}
                      {product.quantity > 10 && (
                        <div className="flex items-center gap-2 text-green-600">
                          <Package className="h-4 w-4" />
                          Stock level is good
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="sales" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Sales</CardTitle>
                  <CardDescription>
                    Latest sales transactions for this product
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {salesHistory && salesHistory.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesHistory.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              {new Date(item.sale.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium">{item.sale.invoiceNo}</TableCell>
                            <TableCell>{item.sale.selectedCustomer?.name || 'Walk-in Customer'}</TableCell>
                            <TableCell>{item.quantity} {product.unit}</TableCell>
                            <TableCell>{formatCurrency(item.price)}</TableCell>
                            <TableCell>{formatCurrency(item.quantity * item.price)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No Sales History</h3>
                      <p className="text-muted-foreground">
                        This product hasn't been sold yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="purchases" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Purchase History</CardTitle>
                  <CardDescription>
                    Recent purchase transactions for this product
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {purchaseHistory && purchaseHistory.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Purchase ID</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseHistory.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              {new Date(item.purchase.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium">{item.purchase.purchaseNo}</TableCell>
                            <TableCell>{item.purchase.selectedSupplier?.name || 'Unknown Supplier'}</TableCell>
                            <TableCell>{item.quantity} {product.unit}</TableCell>
                            <TableCell>{formatCurrency(item.cost)}</TableCell>
                            <TableCell>{formatCurrency(item.quantity * item.cost)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No Purchase History</h3>
                      <p className="text-muted-foreground">
                        No purchase records found for this product.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stock" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Stock Tracking</CardTitle>
                  <CardDescription>
                    Monitor stock levels and movements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{statistics.totalPurchased}</div>
                        <div className="text-sm text-muted-foreground">Total Purchased</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{statistics.totalSold}</div>
                        <div className="text-sm text-muted-foreground">Total Sold</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{product.quantity}</div>
                        <div className="text-sm text-muted-foreground">Current Stock</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Stock Level</span>
                        <span>{product.quantity} / {Math.max(statistics.totalPurchased, 100)} {product.unit}</span>
                      </div>
                      <Progress 
                        value={Math.min((product.quantity / Math.max(statistics.totalPurchased, 100)) * 100, 100)} 
                        className="h-2"
                      />
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p>Stock Value: {formatCurrency(statistics.stockValue)}</p>
                      <p>Average Cost: {formatCurrency(product.cost)} per {product.unit}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
     </>
  )
}