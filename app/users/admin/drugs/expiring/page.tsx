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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Calendar, 
  Search, 
  ArrowLeft,
  MoreHorizontal,
  Edit,
  Eye,
  Activity,
  AlertTriangle,
  Clock,
  Download,
  Mail,
  Trash2,
  DollarSign
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
  daysUntilExpiry: number
  expiryStatus: 'expired' | 'expiring_soon' | 'expiring_later' | 'good'
}

export default function ExpiringDrugsPage() {
  const { data: session } = useSession()
  const warehouseId = getWareHouseId()
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("expiry_date")
  const [activeTab, setActiveTab] = useState("30")

  const { data: drugsData, loading, error, refetch } = fetchWareHouseData("/api/drugs/expiring", { warehouseId })

  const endpoint = `/warehouse/${warehouseId}/${session?.user?.role}`

  // Calculate days until expiry and categorize
  const processedDrugs = useMemo(() => {
    if (!drugsData) return []
    
    return drugsData.map((drug: any) => {
      const today = new Date()
      const expiryDate = new Date(drug.expiryDate)
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      let expiryStatus: 'expired' | 'expiring_soon' | 'expiring_later' | 'good'
      if (daysUntilExpiry < 0) {
        expiryStatus = 'expired'
      } else if (daysUntilExpiry <= 30) {
        expiryStatus = 'expiring_soon'
      } else if (daysUntilExpiry <= 90) {
        expiryStatus = 'expiring_later'
      } else {
        expiryStatus = 'good'
      }

      return {
        ...drug,
        daysUntilExpiry,
        expiryStatus
      }
    })
  }, [drugsData])

  // Filter drugs based on active tab and filters
  const filteredDrugs = useMemo(() => {
    if (!processedDrugs) return []
    
    let filtered = processedDrugs.filter((drug: Drug) => {
      const matchesSearch = 
        drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        drug.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        drug.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = categoryFilter === "all" || drug.category === categoryFilter

      // Filter by tab (days until expiry)
      let matchesTab = true
      if (activeTab === "expired") {
        matchesTab = drug.expiryStatus === 'expired'
      } else if (activeTab === "30") {
        matchesTab = drug.daysUntilExpiry >= 0 && drug.daysUntilExpiry <= 30
      } else if (activeTab === "60") {
        matchesTab = drug.daysUntilExpiry > 30 && drug.daysUntilExpiry <= 60
      } else if (activeTab === "90") {
        matchesTab = drug.daysUntilExpiry > 60 && drug.daysUntilExpiry <= 90
      }

      return matchesSearch && matchesCategory && matchesTab
    })

    // Sort
    filtered.sort((a: Drug, b: Drug) => {
      switch (sortBy) {
        case "expiry_date":
          return a.daysUntilExpiry - b.daysUntilExpiry
        case "quantity":
          return b.quantity - a.quantity
        case "value":
          return (b.quantity * b.price) - (a.quantity * a.price)
        case "name":
          return a.name.localeCompare(b.name)
        case "category":
          return a.category.localeCompare(b.category)
        default:
          return a.daysUntilExpiry - b.daysUntilExpiry
      }
    })

    return filtered
  }, [processedDrugs, searchQuery, categoryFilter, activeTab, sortBy])

  // Get expiry status badge
  const getExpiryBadge = (drug: Drug) => {
    if (drug.expiryStatus === 'expired') {
      return <Badge variant="destructive">🔴 Expired</Badge>
    } else if (drug.daysUntilExpiry <= 7) {
      return <Badge variant="destructive">🔴 {drug.daysUntilExpiry} days</Badge>
    } else if (drug.daysUntilExpiry <= 30) {
      return <Badge variant="secondary">🟠 {drug.daysUntilExpiry} days</Badge>
    } else if (drug.daysUntilExpiry <= 60) {
      return <Badge variant="outline">🟡 {drug.daysUntilExpiry} days</Badge>
    } else {
      return <Badge variant="outline">🟢 {drug.daysUntilExpiry} days</Badge>
    }
  }

  // Export expiry report
  const exportExpiryReport = () => {
    const reportData = filteredDrugs.map((drug: Drug) => ({
      Code: drug.code,
      Name: drug.name,
      Category: drug.category,
      Manufacturer: drug.manufacturer,
      'Batch Number': drug.batchNumber,
      'Current Stock': drug.quantity,
      'Unit Price': formatCurrency(drug.price),
      'Total Value': formatCurrency(drug.quantity * drug.price),
      'Expiry Date': drug.expiryDate,
      'Days Until Expiry': drug.daysUntilExpiry,
      'Status': drug.expiryStatus === 'expired' ? 'EXPIRED' : 
               drug.daysUntilExpiry <= 7 ? 'CRITICAL' :
               drug.daysUntilExpiry <= 30 ? 'EXPIRING SOON' : 'EXPIRING LATER',
      'Supplier': drug.supplier || 'Not specified'
    }))

    const worksheet = XLSX.utils.json_to_sheet(reportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expiry Report")
    XLSX.writeFile(workbook, `expiry_report_${activeTab}days_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success("Expiry report exported successfully!")
  }

  // Get unique categories
  const categories = useMemo(() => {
    if (!processedDrugs) return []
    return [...new Set(processedDrugs.map((drug: Drug) => drug.category))]
  }, [processedDrugs])

  // Statistics for each tab
  const getTabStats = (days: string) => {
    if (!processedDrugs) return { count: 0, value: 0 }
    
    let filtered: Drug[] = []
    if (days === "expired") {
      filtered = processedDrugs.filter(drug => drug.expiryStatus === 'expired')
    } else if (days === "30") {
      filtered = processedDrugs.filter(drug => drug.daysUntilExpiry >= 0 && drug.daysUntilExpiry <= 30)
    } else if (days === "60") {
      filtered = processedDrugs.filter(drug => drug.daysUntilExpiry > 30 && drug.daysUntilExpiry <= 60)
    } else if (days === "90") {
      filtered = processedDrugs.filter(drug => drug.daysUntilExpiry > 60 && drug.daysUntilExpiry <= 90)
    }

    const count = filtered.length
    const value = filtered.reduce((sum, drug) => sum + (drug.quantity * drug.price), 0)
    
    return { count, value }
  }

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
                <BreadcrumbPage>Expiry Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            <h1 className="text-2xl font-semibold text-orange-600">Drug Expiry Management</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportExpiryReport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Email Alert
            </Button>
            <Button variant="outline" asChild>
              <Link href={`${endpoint}/drugs`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Inventory
              </Link>
            </Button>
          </div>
        </div>

        {/* Expiry Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="expired" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Expired ({getTabStats("expired").count})
            </TabsTrigger>
            <TabsTrigger value="30" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              30 Days ({getTabStats("30").count})
            </TabsTrigger>
            <TabsTrigger value="60" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              60 Days ({getTabStats("60").count})
            </TabsTrigger>
            <TabsTrigger value="90" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              90 Days ({getTabStats("90").count})
            </TabsTrigger>
          </TabsList>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-4 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Items Count</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTabStats(activeTab).count}</div>
                <p className="text-xs text-muted-foreground">
                  {activeTab === "expired" ? "Already expired" : 
                   activeTab === "30" ? "Expiring in 30 days" :
                   activeTab === "60" ? "Expiring in 60 days" : "Expiring in 90 days"}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(getTabStats(activeTab).value)}</div>
                <p className="text-xs text-muted-foreground">Inventory value at risk</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {[...new Set(filteredDrugs.map(drug => drug.category))].length}
                </div>
                <p className="text-xs text-muted-foreground">Affected categories</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Days Left</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredDrugs.length > 0 
                    ? Math.round(filteredDrugs.reduce((sum, drug) => sum + drug.daysUntilExpiry, 0) / filteredDrugs.length)
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">Average expiry time</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Expiring Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
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
                  <Label>Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expiry_date">Expiry Date</SelectItem>
                      <SelectItem value="quantity">Stock Quantity</SelectItem>
                      <SelectItem value="value">Total Value</SelectItem>
                      <SelectItem value="name">Drug Name</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tab Content */}
          <TabsContent value={activeTab} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === "expired" ? "Expired Drugs" : 
                   activeTab === "30" ? "Expiring in 30 Days" :
                   activeTab === "60" ? "Expiring in 60 Days" : "Expiring in 90 Days"}
                </CardTitle>
                <CardDescription>
                  Showing {filteredDrugs.length} items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Drug</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDrugs.map((drug: Drug) => (
                      <TableRow 
                        key={drug.id} 
                        className={drug.expiryStatus === 'expired' ? 'bg-red-50' : 
                                  drug.daysUntilExpiry <= 7 ? 'bg-orange-50' : ''}
                      >
                        <TableCell>
                          {getExpiryBadge(drug)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{drug.name}</div>
                            <div className="text-sm text-muted-foreground">{drug.code}</div>
                          </div>
                        </TableCell>
                        <TableCell>{drug.category}</TableCell>
                        <TableCell>{drug.batchNumber}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${drug.quantity === 0 ? 'text-red-600' : ''}`}>
                            {drug.quantity}
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(drug.price)}</TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {formatCurrency(drug.quantity * drug.price)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className={`${drug.expiryStatus === 'expired' ? 'text-red-600 font-medium' : ''}`}>
                            {new Date(drug.expiryDate).toLocaleDateString()}
                          </div>
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
                              {drug.expiryStatus === 'expired' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Mark as Disposed
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}