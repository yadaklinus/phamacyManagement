"use client"

import { useEffect, useState } from "react"
import { useParams, usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
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
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ArrowLeft, 
  ShoppingCart, 
  Truck, 
  Download,
  Calendar
} from "lucide-react"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import { Loading } from "@/components/loading"
import { formatCurrency } from "@/lib/utils"
import axios from "axios"

interface StockMovement {
  id: string
  type: 'SALE' | 'PURCHASE'
  date: Date
  quantity: number
  reference: string
  customer?: string
  supplier?: string
  unitPrice: number
  total: number
  notes: string
  balanceAfter: number
}

interface Product {
  id: string
  name: string
  barcode: string
  currentStock: number
  unit: string
  warehouse: string
}

interface StockTrackingData {
  product: Product
  movements: StockMovement[]
  summary: {
    totalSales: number
    totalPurchases: number
    totalMovements: number
  }
}

export default function StockTrackingPage() {
  const path = usePathname()
  const [data, setData] = useState<StockTrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [endpoint, setEndPoint] = useState("")
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  
  const warehouseId = path?.split("/")[3]
  const productId = params.productId as string

  useEffect(() => {
    setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
  }, [session, warehouseId])

  useEffect(() => {
    if (productId && warehouseId) {
      fetchStockData()
    }
  }, [productId, warehouseId])

  const fetchStockData = async () => {
    try {
      // const response = await fetch(`/api/product/stock-tracking-online?productId=${productId}&warehouseId=${warehouseId}`)
      const response = await axios.post(`/api/warehouse/products/stock-tracking-online`,{productId,warehouseId})
      if (response.status !== 200) {
        const result = response.data
        setData(result)
        console.log(result)
      } else {
        console.error("Failed to fetch stock data")
      }
    } catch (error) {
      console.error("Error fetching stock data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getMovementIcon = (type: string) => {
    return type === 'SALE' ? (
      <ShoppingCart className="h-4 w-4 text-red-600" />
    ) : (
      <Truck className="h-4 w-4 text-green-600" />
    )
  }

  const getMovementBadge = (type: string) => {
    return type === 'SALE' ? (
      <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
        Sale
      </Badge>
    ) : (
      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
        Purchase
      </Badge>
    )
  }

  const exportData = () => {
    if (!data) return

    const csvContent = [
      ['Date', 'Type', 'Reference', 'Customer/Supplier', 'Quantity', 'Unit Price', 'Total', 'Balance After'],
      ...data.movements.map(movement => [
        new Date(movement.date).toLocaleDateString(),
        movement.type,
        movement.reference,
        movement.customer || movement.supplier || '',
        movement.quantity.toString(),
        formatCurrency(movement.unitPrice),
        formatCurrency(movement.total),
        movement.balanceAfter.toString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.product.name}_stock_tracking.csv`
    a.click()
  }

  if (loading) return <Loading />

  if (!data) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="text-center py-8">
          <Package className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Product not found or no stock data available</p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
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
                <BreadcrumbLink href={`${endpoint}/dashboard`}>Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`${endpoint}/products/list`}>Products</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Stock Tracking</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Activity className="h-5 w-5 text-blue-600" />
            <div>
              <h1 className="text-2xl font-semibold text-blue-600">Stock Tracking</h1>
              <p className="text-sm text-muted-foreground">{data.product.name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={exportData}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Product Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Product Name</p>
                <p className="text-lg font-semibold">{data.product.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Barcode</p>
                <p className="text-lg font-mono">{data.product.barcode}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Stock</p>
                <p className="text-lg font-semibold text-green-600">
                  {data.product.currentStock} {data.product.unit}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Warehouse</p>
                <p className="text-lg">{data.product.warehouse}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">-{data.summary.totalSales}</div>
              <p className="text-xs text-muted-foreground">Items sold</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+{data.summary.totalPurchases}</div>
              <p className="text-xs text-muted-foreground">Items received</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Movements</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.totalMovements}</div>
              <p className="text-xs text-muted-foreground">Stock transactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Movements Table */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Movements</CardTitle>
            <CardDescription>
              Complete history of stock changes for this product
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.movements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="mx-auto h-12 w-12 mb-4" />
                <p>No stock movements found for this product</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Customer/Supplier</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Balance After</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {new Date(movement.date).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(movement.date).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getMovementIcon(movement.type)}
                          {getMovementBadge(movement.type)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{movement.reference}</TableCell>
                      <TableCell>{movement.customer || movement.supplier || 'N/A'}</TableCell>
                      <TableCell>
                        <span className={movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </span>
                      </TableCell>
                      <TableCell>{formatCurrency(movement.unitPrice)}</TableCell>
                      <TableCell>{formatCurrency(movement.total)}</TableCell>
                      <TableCell>
                        <span className="font-semibold">{movement.balanceAfter}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {movement.notes}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}