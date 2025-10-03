"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
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
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Package, 
  ArrowLeft,
  Edit,
  Activity,
  Calendar,
  DollarSign,
  AlertTriangle,
  Truck,
  FileText,
  BarChart3,
  Settings
} from "lucide-react"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import { Loading } from "@/components/loading"
import { formatCurrency } from "@/lib/utils"
import { useSession } from "next-auth/react"
import Link from "next/link"
import axios from "axios"

interface DrugDetail {
  id: string
  code: string
  name: string
  category: string
  manufacturer: string
  description: string
  activeIngredient: string
  strength: string
  dosageForm: string
  quantity: number
  reorderLevel: number
  price: number
  cost: number
  expiryDate: string
  batchNumber: string
  unit: string
  storageConditions: string
  prescriptionRequired: boolean
  supplier?: string
  createdAt: string
  updatedAt: string
  lastStockUpdate?: string
  averageUsage?: number
  totalSold?: number
  totalPurchased?: number
}

interface StockMovement {
  id: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  reason: string
  reference?: string
  createdAt: string
  createdBy: string
  balanceAfter: number
}

export default function DrugDetailPage() {
  const params = useParams()
  const drugId = params.drugId as string
  const { data: session } = useSession()
  const warehouseId = getWareHouseId()
  const [drugData, setDrugData] = useState<DrugDetail | null>(null)
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)

  const endpoint = `/warehouse/${warehouseId}/${session?.user?.role}`

  useEffect(() => {
    loadDrugData()
  }, [drugId, warehouseId])

  const loadDrugData = async () => {
    try {
      setLoading(true)
      const [drugResponse, movementsResponse] = await Promise.all([
        axios.get(`/api/drugs/${drugId}?warehouseId=${warehouseId}`),
        axios.get(`/api/drugs/${drugId}/movements?warehouseId=${warehouseId}`)
      ])

      if (drugResponse.data.success) {
        setDrugData(drugResponse.data.drug)
      }

      if (movementsResponse.data.success) {
        setStockMovements(movementsResponse.data.movements || [])
      }
    } catch (error) {
      console.error('Error loading drug data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get stock status
  const getStockStatus = () => {
    if (!drugData) return { status: 'unknown', color: 'bg-gray-500', icon: '❓', text: 'Unknown' }
    
    const today = new Date()
    const expiryDate = new Date(drugData.expiryDate)
    const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (expiryDate < today) {
      return { status: 'expired', color: 'bg-red-500', icon: '🔴', text: 'Expired' }
    }
    
    if (daysToExpiry <= 30) {
      return { status: 'expiring_soon', color: 'bg-orange-500', icon: '🟠', text: 'Expiring Soon' }
    }

    if (drugData.quantity === 0) {
      return { status: 'out_of_stock', color: 'bg-black', icon: '⚫', text: 'Out of Stock' }
    }
    
    if (drugData.quantity <= drugData.reorderLevel) {
      return { status: 'low_stock', color: 'bg-red-500', icon: '🔴', text: 'Low Stock' }
    }
    
    if (drugData.quantity <= drugData.reorderLevel * 1.1) {
      return { status: 'low_stock', color: 'bg-yellow-500', icon: '⚠️', text: 'Near Reorder Level' }
    }

    return { status: 'in_stock', color: 'bg-green-500', icon: '✅', text: 'In Stock' }
  }

  if (loading) return <Loading />

  if (!drugData) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Drug not found</h2>
          <p className="text-muted-foreground">The requested drug could not be found.</p>
          <Button asChild className="mt-4">
            <Link href={`${endpoint}/drugs`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Inventory
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const stockStatus = getStockStatus()
  const stockPercentage = Math.round((drugData.quantity / drugData.reorderLevel) * 100)
  const daysToExpiry = Math.ceil((new Date(drugData.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

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
                <BreadcrumbLink href={`${endpoint}/drugs`}>Drug Inventory</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{drugData.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-semibold text-blue-600">{drugData.name}</h1>
              <p className="text-muted-foreground">{drugData.code} • {drugData.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`${endpoint}/drugs/${drugId}/history`}>
                <FileText className="mr-2 h-4 w-4" />
                Usage History
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`${endpoint}/drugs/${drugId}/adjust-stock`}>
                <Activity className="mr-2 h-4 w-4" />
                Adjust Stock
              </Link>
            </Button>
            <Button asChild>
              <Link href={`${endpoint}/drugs/${drugId}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Drug
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`${endpoint}/drugs`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Inventory
              </Link>
            </Button>
          </div>
        </div>

        {/* Status Alert */}
        {(stockStatus.status === 'expired' || stockStatus.status === 'expiring_soon' || stockStatus.status === 'low_stock' || stockStatus.status === 'out_of_stock') && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-800">
                  {stockStatus.status === 'expired' ? 'This drug has expired and should not be dispensed.' :
                   stockStatus.status === 'expiring_soon' ? `This drug expires in ${daysToExpiry} days.` :
                   stockStatus.status === 'out_of_stock' ? 'This drug is out of stock.' :
                   'This drug is running low and needs restocking.'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Stock</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-lg">{stockStatus.icon}</span>
                <div className="text-2xl font-bold">{drugData.quantity}</div>
              </div>
              <p className="text-xs text-muted-foreground">
                {stockStatus.text} • {stockPercentage}% of reorder level
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(drugData.quantity * drugData.price)}</div>
              <p className="text-xs text-muted-foreground">
                At selling price • Cost: {formatCurrency(drugData.quantity * drugData.cost)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Days to Expiry</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${daysToExpiry < 0 ? 'text-red-600' : daysToExpiry <= 30 ? 'text-orange-600' : 'text-green-600'}`}>
                {daysToExpiry < 0 ? 'Expired' : `${daysToExpiry} days`}
              </div>
              <p className="text-xs text-muted-foreground">
                Expires: {new Date(drugData.expiryDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(((drugData.price - drugData.cost) / drugData.cost) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Profit: {formatCurrency(drugData.price - drugData.cost)} per unit
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Drug Information */}
          <Card>
            <CardHeader>
              <CardTitle>Drug Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Drug Code:</span>
                  <span className="text-sm">{drugData.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Category:</span>
                  <Badge variant="outline">{drugData.category}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Manufacturer:</span>
                  <span className="text-sm">{drugData.manufacturer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Active Ingredient:</span>
                  <span className="text-sm">{drugData.activeIngredient || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Strength:</span>
                  <span className="text-sm">{drugData.strength || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Dosage Form:</span>
                  <span className="text-sm">{drugData.dosageForm || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Unit:</span>
                  <span className="text-sm">{drugData.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Prescription Required:</span>
                  <Badge variant={drugData.prescriptionRequired ? "destructive" : "default"}>
                    {drugData.prescriptionRequired ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
              
              {drugData.description && (
                <div className="pt-3 border-t">
                  <span className="text-sm font-medium">Description:</span>
                  <p className="text-sm text-muted-foreground mt-1">{drugData.description}</p>
                </div>
              )}

              {drugData.storageConditions && (
                <div className="pt-3 border-t">
                  <span className="text-sm font-medium">Storage Conditions:</span>
                  <p className="text-sm text-muted-foreground mt-1">{drugData.storageConditions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stock & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Stock & Pricing Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Current Stock:</span>
                  <span className="text-sm font-bold">{drugData.quantity} {drugData.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Reorder Level:</span>
                  <span className="text-sm">{drugData.reorderLevel} {drugData.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Stock Percentage:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${stockStatus.color}`}
                        style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm">{stockPercentage}%</span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Cost Price:</span>
                  <span className="text-sm">{formatCurrency(drugData.cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Selling Price:</span>
                  <span className="text-sm font-bold">{formatCurrency(drugData.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Profit per Unit:</span>
                  <span className="text-sm text-green-600 font-medium">
                    {formatCurrency(drugData.price - drugData.cost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Total Stock Value:</span>
                  <span className="text-sm font-bold">
                    {formatCurrency(drugData.quantity * drugData.price)}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="grid gap-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Batch Number:</span>
                  <span className="text-sm">{drugData.batchNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Expiry Date:</span>
                  <span className={`text-sm ${daysToExpiry < 0 ? 'text-red-600 font-medium' : daysToExpiry <= 30 ? 'text-orange-600' : ''}`}>
                    {new Date(drugData.expiryDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Supplier:</span>
                  <span className="text-sm">{drugData.supplier || 'Not specified'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Stock Movements */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Stock Movements</CardTitle>
            <CardDescription>
              Latest stock transactions for this drug
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stockMovements.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Balance After</TableHead>
                    <TableHead>By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockMovements.slice(0, 10).map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        {new Date(movement.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={movement.type === 'in' ? 'default' : 
                                  movement.type === 'out' ? 'secondary' : 'outline'}
                        >
                          {movement.type === 'in' ? 'Stock In' : 
                           movement.type === 'out' ? 'Stock Out' : 'Adjustment'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={movement.type === 'in' ? 'text-green-600' : 'text-red-600'}>
                          {movement.type === 'in' ? '+' : '-'}{Math.abs(movement.quantity)}
                        </span>
                      </TableCell>
                      <TableCell>{movement.reason}</TableCell>
                      <TableCell>{movement.reference || '-'}</TableCell>
                      <TableCell>{movement.balanceAfter}</TableCell>
                      <TableCell>{movement.createdBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No stock movements recorded yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Record Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Created:</span>
                <span className="text-sm">{new Date(drugData.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Last Updated:</span>
                <span className="text-sm">{new Date(drugData.updatedAt).toLocaleString()}</span>
              </div>
              {drugData.lastStockUpdate && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Last Stock Update:</span>
                  <span className="text-sm">{new Date(drugData.lastStockUpdate).toLocaleString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}