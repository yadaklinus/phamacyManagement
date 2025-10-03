"use client"

import { useState, useEffect, useMemo } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  TrendingDown, 
  Search, 
  ArrowLeft,
  MoreHorizontal,
  Edit,
  Eye,
  Activity,
  AlertTriangle,
  Package,
  ShoppingCart,
  Download,
  Mail
} from "lucide-react"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import fetchWareHouseData from "@/hooks/fetch-invidual-data"
import { Loading } from "@/components/loading"
import { formatCurrency } from "@/lib/utils"
import { useSession } from "next-auth/react"
import Link from "next/link"
import * as XLSX from 'xlsx'
import { toast } from "sonner"

interface Drug {
  id: string
  code: string
  name: string
  category: string
  quantity: number
  reorderLevel: number
  price: number
  cost: number
  expiryDate: string
  batchNumber: string
  manufacturer: string
  supplier?: string
  lastOrderDate?: string
  averageUsage?: number
  daysUntilStockOut?: number
}

export default function LowStockPage() {
  const { data: session } = useSession()
  const warehouseId = getWareHouseId()
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [urgencyFilter, setUrgencyFilter] = useState("all")
  const [sortBy, setSortBy] = useState("urgency")

  const { data: drugsData, loading, error, refetch } = fetchWareHouseData("/api/drugs/low-stock", { warehouseId })

  const endpoint = `/warehouse/${warehouseId}/${session?.user?.role}`

  // Filter and sort drugs
  const filteredDrugs = useMemo(() => {
    if (!drugsData) return []
    
    let filtered = drugsData.filter((drug: Drug) => {
      const matchesSearch = 
        drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        drug.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        drug.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = categoryFilter === "all" || drug.category === categoryFilter

      let matchesUrgency = true
      if (urgencyFilter === "critical") {
        matchesUrgency = drug.quantity === 0
      } else if (urgencyFilter === "very_low") {
        matchesUrgency = drug.quantity > 0 && drug.quantity <= drug.reorderLevel * 0.5
      } else if (urgencyFilter === "low") {
        matchesUrgency = drug.quantity > drug.reorderLevel * 0.5 && drug.quantity <= drug.reorderLevel
      }

      return matchesSearch && matchesCategory && matchesUrgency
    })

    // Sort
    filtered.sort((a: Drug, b: Drug) => {
      switch (sortBy) {
        case "urgency":
          // Sort by urgency: out of stock first, then by percentage of reorder level
          const aUrgency = a.quantity === 0 ? 0 : a.quantity / a.reorderLevel
          const bUrgency = b.quantity === 0 ? 0 : b.quantity / b.reorderLevel
          return aUrgency - bUrgency
        case "quantity":
          return a.quantity - b.quantity
        case "name":
          return a.name.localeCompare(b.name)
        case "category":
          return a.category.localeCompare(b.category)
        default:
          return 0
      }
    })

    return filtered
  }, [drugsData, searchQuery, categoryFilter, urgencyFilter, sortBy])

  // Get urgency level
  const getUrgencyLevel = (drug: Drug) => {
    if (drug.quantity === 0) {
      return { level: 'critical', color: 'bg-red-500', text: 'Out of Stock', icon: '🔴' }
    }
    
    const percentage = (drug.quantity / drug.reorderLevel) * 100
    
    if (percentage <= 25) {
      return { level: 'very_high', color: 'bg-red-500', text: 'Critical', icon: '🔴' }
    } else if (percentage <= 50) {
      return { level: 'high', color: 'bg-orange-500', text: 'Very Low', icon: '🟠' }
    } else if (percentage <= 75) {
      return { level: 'medium', color: 'bg-yellow-500', text: 'Low', icon: '🟡' }
    } else {
      return { level: 'low', color: 'bg-blue-500', text: 'Near Reorder', icon: '🔵' }
    }
  }

  // Calculate suggested order quantity
  const getSuggestedOrderQuantity = (drug: Drug) => {
    const safetyStock = Math.ceil(drug.reorderLevel * 0.2) // 20% safety stock
    const averageUsage = drug.averageUsage || 10 // Default if not available
    const leadTimeDays = 7 // Assume 7 days lead time
    const leadTimeStock = Math.ceil((averageUsage / 30) * leadTimeDays)
    
    return Math.max(
      drug.reorderLevel * 2, // At least double the reorder level
      leadTimeStock + safetyStock,
      50 // Minimum order quantity
    )
  }

  // Export low stock report
  const exportLowStockReport = () => {
    const reportData = filteredDrugs.map((drug: Drug) => {
      const urgency = getUrgencyLevel(drug)
      const suggestedOrder = getSuggestedOrderQuantity(drug)
      
      return {
        Code: drug.code,
        Name: drug.name,
        Category: drug.category,
        Manufacturer: drug.manufacturer,
        'Current Stock': drug.quantity,
        'Reorder Level': drug.reorderLevel,
        'Stock Percentage': `${Math.round((drug.quantity / drug.reorderLevel) * 100)}%`,
        'Urgency Level': urgency.text,
        'Suggested Order Qty': suggestedOrder,
        'Estimated Cost': formatCurrency(suggestedOrder * drug.cost),
        'Unit Price': formatCurrency(drug.price),
        'Expiry Date': drug.expiryDate,
        'Batch Number': drug.batchNumber,
        'Supplier': drug.supplier || 'Not specified'
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(reportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Low Stock Report")
    XLSX.writeFile(workbook, `low_stock_report_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success("Low stock report exported successfully!")
  }

  // Get unique categories
  const categories = useMemo(() => {
    if (!drugsData) return []
    return [...new Set(drugsData.map((drug: Drug) => drug.category))]
  }, [drugsData])

  // Statistics
  const stats = useMemo(() => {
    if (!drugsData) return { total: 0, critical: 0, veryLow: 0, low: 0, estimatedCost: 0 }
    
    const total = drugsData.length
    const critical = drugsData.filter((drug: Drug) => drug.quantity === 0).length
    const veryLow = drugsData.filter((drug: Drug) => 
      drug.quantity > 0 && drug.quantity <= drug.reorderLevel * 0.5
    ).length
    const low = drugsData.filter((drug: Drug) => 
      drug.quantity > drug.reorderLevel * 0.5 && drug.quantity <= drug.reorderLevel
    ).length

    const estimatedCost = drugsData.reduce((sum: number, drug: Drug) => {
      const suggestedOrder = getSuggestedOrderQuantity(drug)
      return sum + (suggestedOrder * drug.cost)
    }, 0)

    return { total, critical, veryLow, low, estimatedCost }
  }, [drugsData])

  if (loading) return <Loading />

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
                <BreadcrumbPage>Low Stock Alert</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <h1 className="text-2xl font-semibold text-red-600">Low Stock Alert</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportLowStockReport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Email Report
            </Button>
            <Button variant="outline" asChild>
              <Link href={`${endpoint}/drugs`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Inventory
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Items need attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <Package className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
              <p className="text-xs text-muted-foreground">Out of stock</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Very Low</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.veryLow}</div>
              <p className="text-xs text-muted-foreground">≤50% of reorder level</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.low}</div>
              <p className="text-xs text-muted-foreground">Below reorder level</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.estimatedCost)}</div>
              <p className="text-xs text-muted-foreground">To restock all items</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search drugs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Urgency Level</Label>
                <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="critical">Critical (Out of Stock)</SelectItem>
                    <SelectItem value="very_low">Very Low (≤50%)</SelectItem>
                    <SelectItem value="low">Low (≤100%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgency">Urgency Level</SelectItem>
                    <SelectItem value="quantity">Current Stock</SelectItem>
                    <SelectItem value="name">Drug Name</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Table */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
            <CardDescription>
              Showing {filteredDrugs.length} items that need restocking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Drug</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Reorder Level</TableHead>
                  <TableHead>Stock %</TableHead>
                  <TableHead>Suggested Order</TableHead>
                  <TableHead>Est. Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrugs.map((drug: Drug) => {
                  const urgency = getUrgencyLevel(drug)
                  const suggestedOrder = getSuggestedOrderQuantity(drug)
                  const stockPercentage = Math.round((drug.quantity / drug.reorderLevel) * 100)
                  
                  return (
                    <TableRow key={drug.id} className={urgency.level === 'critical' ? 'bg-red-50' : ''}>
                      <TableCell>
                        <Badge 
                          variant={urgency.level === 'critical' ? 'destructive' : 
                                  urgency.level === 'very_high' ? 'destructive' : 
                                  urgency.level === 'high' ? 'secondary' : 'outline'}
                          className="flex items-center gap-1"
                        >
                          <span>{urgency.icon}</span>
                          {urgency.text}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{drug.name}</div>
                          <div className="text-sm text-muted-foreground">{drug.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>{drug.category}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${urgency.level === 'critical' ? 'text-red-600' : ''}`}>
                          {drug.quantity}
                        </span>
                      </TableCell>
                      <TableCell>{drug.reorderLevel}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${urgency.color}`}
                              style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm">{stockPercentage}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-blue-600">{suggestedOrder}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatCurrency(suggestedOrder * drug.cost)}</span>
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
                            <DropdownMenuItem asChild>
                              <Link href={`${endpoint}/drugs/${drug.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`${endpoint}/drugs/${drug.id}/adjust-stock`}>
                                <Activity className="mr-2 h-4 w-4" />
                                Adjust Stock
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`${endpoint}/drugs/${drug.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Drug
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Create Purchase Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}