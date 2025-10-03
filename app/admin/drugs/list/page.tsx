"use client"

import * as XLSX from 'xlsx';
import { useEffect, useState, useMemo } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Upload, 
  Trash, 
  Activity, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Printer,
  Settings
} from "lucide-react"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import fetchWareHouseData from "@/hooks/fetch-invidual-data"
import { Loading } from "@/components/loading"
import { formatCurrency } from "@/lib/utils"
import { useSession } from "next-auth/react"
import Link from "next/link"
import axios from "axios";



export default function DrugInventoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [expiryFilter, setExpiryFilter] = useState("all")
  const [endpoint, setEndPoint] = useState("")
  const [openModalId, setOpenModalId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")
  const { data: session } = useSession()

  const warehouseId = getWareHouseId()
  const { data: productsData, loading, error, refetch } = fetchWareHouseData("/api/product/list", { warehouseId })

  // Helper functions for drug status
  const getDaysUntilExpiry = (expiryDate: string) => {
    if (!expiryDate) return null
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getStockStatus = (quantity: number, reorderLevel: number) => {
    if (quantity === 0) return 'out_of_stock'
    if (quantity <= reorderLevel) return 'low_stock'
    if (quantity <= reorderLevel * 1.1) return 'near_reorder'
    return 'in_stock'
  }

  const getExpiryStatus = (expiryDate: string) => {
    const daysUntilExpiry = getDaysUntilExpiry(expiryDate)
    if (daysUntilExpiry === null) return 'no_expiry'
    if (daysUntilExpiry < 0) return 'expired'
    if (daysUntilExpiry <= 30) return 'expiring_soon'
    return 'valid'
  }

  // Get unique categories from products
  const categories = useMemo(() => {
    if (!productsData) return []
    const uniqueCategories = [...new Set(productsData.map((product: any) => product.category).filter(Boolean))]
    return uniqueCategories
  }, [productsData])

  const filteredProducts = useMemo(() => {
    if (!productsData) return []
    
    let filtered = [...productsData]

    // Search filter
    const query = searchQuery.toLowerCase().trim()
    if (query.length >= 2) {
      filtered = filtered.filter((product: any) => {
        return (
          product.name.toLowerCase().includes(query) ||
          product.barcode.toLowerCase().includes(query) ||
          product.genericName?.toLowerCase().includes(query) ||
          product.brandName?.toLowerCase().includes(query) ||
          product.manufacturer?.toLowerCase().includes(query) ||
          product.batchNumber?.toLowerCase().includes(query)
        )
      })
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((product: any) => product.category === categoryFilter)
    }

    // Stock status filter
    if (stockFilter !== "all") {
      filtered = filtered.filter((product: any) => {
        const stockStatus = getStockStatus(product.quantity, product.reorderLevel || 0)
        return stockStatus === stockFilter
      })
    }

    // Expiry filter
    if (expiryFilter !== "all") {
      filtered = filtered.filter((product: any) => {
        const expiryStatus = getExpiryStatus(product.expiryDate)
        return expiryStatus === expiryFilter
      })
    }

    // Sorting
    filtered.sort((a: any, b: any) => {
      let aValue, bValue
      
      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "quantity":
          aValue = a.quantity
          bValue = b.quantity
          break
        case "expiry":
          aValue = a.expiryDate ? new Date(a.expiryDate).getTime() : 0
          bValue = b.expiryDate ? new Date(b.expiryDate).getTime() : 0
          break
        case "price":
          aValue = a.retailPrice
          bValue = b.retailPrice
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // Limit results for performance
    return query.length === 0 ? filtered.slice(0, 50) : filtered.slice(0, 100)
  }, [productsData, searchQuery, categoryFilter, stockFilter, expiryFilter, sortBy, sortOrder])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setIsSearching(true)
    
    // Clear searching state after a delay
    setTimeout(() => {
      setIsSearching(false)
    }, 300)
  }

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDrugs(filteredProducts.map((product: any) => product.id))
    } else {
      setSelectedDrugs([])
    }
  }

  const handleSelectDrug = (drugId: string, checked: boolean) => {
    if (checked) {
      setSelectedDrugs([...selectedDrugs, drugId])
    } else {
      setSelectedDrugs(selectedDrugs.filter(id => id !== drugId))
    }
  }

  // Clear filters
  const clearFilters = () => {
    setCategoryFilter("all")
    setStockFilter("all")
    setExpiryFilter("all")
    setSearchQuery("")
  }
  
  useEffect(()=>{
    setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
  },[session,warehouseId])


  if(!productsData) return (
    <Loading/>
  )

  const handleOpen = (id:any) => {
    setOpenModalId(id);
    

  };

  const handleClose = () => {
    setOpenModalId(null);
  };


  const handleDelete = async (productId: string) => {
     console.log(productId)
  
     await axios.post("/api/product/delete",{productId})
     
  
     setOpenModalId(null);
     refetch()
    }
  
  

  // useEffect(()=>{
  //   async function main(){
  //     await axios.post("/api/product/list",{warehouseId}).then((data)=>{
  //       console.log(data.data)
  //     })
  //   }
  //   main()
  // },[warehouseId])

 

 
  // Status badge functions
  const getStockStatusBadge = (quantity: number, reorderLevel: number) => {
    const status = getStockStatus(quantity, reorderLevel)
    
    switch (status) {
      case 'in_stock':
        return (
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
              In Stock
            </Badge>
          </div>
        )
      case 'near_reorder':
        return (
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
              Near Reorder
            </Badge>
          </div>
        )
      case 'low_stock':
        return (
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <Badge variant="destructive" className="bg-orange-100 text-orange-800 border-orange-200">
              Low Stock
            </Badge>
          </div>
        )
      case 'out_of_stock':
        return (
          <div className="flex items-center gap-1">
            <XCircle className="h-4 w-4 text-red-600" />
            <Badge variant="destructive">
              Out of Stock
            </Badge>
          </div>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getExpiryStatusBadge = (expiryDate: string) => {
    if (!expiryDate) return <Badge variant="outline">No Expiry</Badge>
    
    const status = getExpiryStatus(expiryDate)
    const daysUntilExpiry = getDaysUntilExpiry(expiryDate)
    
    switch (status) {
      case 'expired':
        return (
          <div className="flex items-center gap-1">
            <XCircle className="h-4 w-4 text-red-600" />
            <Badge variant="destructive">
              Expired
            </Badge>
          </div>
        )
      case 'expiring_soon':
        return (
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-orange-600" />
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
              Expires in {daysUntilExpiry} days
            </Badge>
          </div>
        )
      case 'valid':
        return (
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
              Valid
            </Badge>
          </div>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getQuantityDisplay = (quantity: number, reorderLevel: number) => {
    const status = getStockStatus(quantity, reorderLevel)
    let colorClass = "text-green-600"
    let icon = "✅"
    
    switch (status) {
      case 'out_of_stock':
        colorClass = "text-red-600"
        icon = "🔴"
        break
      case 'low_stock':
        colorClass = "text-orange-600"
        icon = "⚠️"
        break
      case 'near_reorder':
        colorClass = "text-yellow-600"
        icon = "⚠️"
        break
      default:
        colorClass = "text-green-600"
        icon = "✅"
    }
    
    return (
      <span className={`font-medium ${colorClass}`}>
        {quantity} {icon}
      </span>
    )
  }
  function exportData() {
    // 1. Format the data for drug inventory
    const formattedData = filteredProducts.map((product: any) => ({
      "Drug Code": product.barcode,
      "Drug Name": product.name,
      "Generic Name": product.genericName || "",
      "Brand Name": product.brandName || "",
      "Category": product.category || "",
      "Manufacturer": product.manufacturer || "",
      "Batch Number": product.batchNumber || "",
      "Quantity": product.quantity,
      "Reorder Level": product.reorderLevel || 0,
      "Unit Price": product.retailPrice,
      "Wholesale Price": product.wholeSalePrice,
      "Cost": product.cost,
      "Expiry Date": product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : "",
      "Days Until Expiry": product.expiryDate ? getDaysUntilExpiry(product.expiryDate) : "",
      "Stock Status": getStockStatus(product.quantity, product.reorderLevel || 0),
      "Expiry Status": product.expiryDate ? getExpiryStatus(product.expiryDate) : "no_expiry",
      "Dosage Form": product.dosageForm || "",
      "Strength": product.strength || "",
      "Requires Prescription": product.requiresPrescription ? "Yes" : "No",
      "Storage Conditions": product.storageConditions || "",
      "Unit": product.unit,
      "Tax Rate": product.taxRate,
      "Description": product.description,
      "Created At": new Date(product.createdAt).toLocaleDateString(),
      "Updated At": new Date(product.updatedAt).toLocaleDateString()
    }));

    // 2. Convert JSON to worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Drug Inventory");

    // 3. Trigger file download
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `drug_inventory_${timestamp}.xlsx`);
  }


  const totalCost = productsData.reduce((sum:any, products:any) => sum + (products.cost * products.quantity), 0)
  const totalRetail = productsData.reduce((sum:any, products:any) => sum + (products.retailPrice * products.quantity), 0)
  const totalWholesale = productsData.reduce((sum:any, products:any) => sum + (products.wholeSalePrice * products.quantity), 0)

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
                  <BreadcrumbLink href={`${endpoint}/drugs/list`}>Drugs</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Drug Inventory</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-semibold text-blue-600">Drug Inventory</h1>
                <p className="text-sm text-muted-foreground">Manage all drugs in the pharmacy</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedDrugs.length > 0 && (
                <div className="flex items-center gap-2 mr-4">
                  <span className="text-sm text-muted-foreground">
                    {selectedDrugs.length} selected
                  </span>
                  <Button variant="outline" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected
                  </Button>
                </div>
              )}
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
              <Button onClick={exportData} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Inventory
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" />
                Print Report
              </Button>
              <Button asChild>
                <Link href={`${endpoint}/drugs/add`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Drug
                </Link>
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Manage Categories
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Drugs</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{productsData.length}</div>
                <p className="text-xs text-muted-foreground">
                  {filteredProducts.length} filtered
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {productsData.filter((p: any) => getStockStatus(p.quantity, p.reorderLevel || 0) === 'low_stock').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Drugs below reorder level
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {productsData.filter((p: any) => p.expiryDate && getExpiryStatus(p.expiryDate) === 'expiring_soon').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Expiring within 30 days
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalRetail)}</div>
                <p className="text-xs text-muted-foreground">
                  At retail prices
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search & Filter Drugs</CardTitle>
              <CardDescription>
                Use filters to find specific drugs by category, stock level, or expiry status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-6">
                {/* Search */}
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="search">Search Drugs</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name, code, manufacturer..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stock Status Filter */}
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Status</Label>
                  <Select value={stockFilter} onValueChange={setStockFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Stock" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stock</SelectItem>
                      <SelectItem value="in_stock">In Stock</SelectItem>
                      <SelectItem value="low_stock">Low Stock</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Expiry Filter */}
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Status</Label>
                  <Select value={expiryFilter} onValueChange={setExpiryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Expiry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Expiry</SelectItem>
                      <SelectItem value="valid">Valid</SelectItem>
                      <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
                    <Filter className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                </div>
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                <Label className="text-sm font-medium">Sort by:</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="quantity">Quantity</SelectItem>
                    <SelectItem value="expiry">Expiry Date</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Drug Inventory Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Drug Inventory List</CardTitle>
                  <CardDescription>
                    Showing {filteredProducts.length} of {productsData.length} drugs
                    {searchQuery && ` • Filtered by "${searchQuery}"`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedDrugs.length} selected
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedDrugs.length === filteredProducts.length && filteredProducts.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Reorder Level</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Package className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              {searchQuery ? "No drugs found matching your search" : "No drugs available"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product: any) => (
                        <TableRow key={product.id} className="hover:bg-muted/50">
                          <TableCell>
                            <Checkbox
                              checked={selectedDrugs.includes(product.id)}
                              onCheckedChange={(checked) => handleSelectDrug(product.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {product.barcode}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{product.name}</div>
                              {product.genericName && (
                                <div className="text-xs text-muted-foreground">
                                  Generic: {product.genericName}
                                </div>
                              )}
                              {product.brandName && (
                                <div className="text-xs text-muted-foreground">
                                  Brand: {product.brandName}
                                </div>
                              )}
                              {product.strength && (
                                <div className="text-xs text-blue-600">
                                  {product.strength}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {product.category || "Uncategorized"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getQuantityDisplay(product.quantity, product.reorderLevel || 0)}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {product.reorderLevel || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {formatCurrency(product.retailPrice)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Wholesale: {formatCurrency(product.wholeSalePrice)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {product.expiryDate ? (
                              <div className="space-y-1">
                                <div className="text-sm">
                                  {new Date(product.expiryDate).toLocaleDateString()}
                                </div>
                                {getExpiryStatusBadge(product.expiryDate)}
                              </div>
                            ) : (
                              <Badge variant="outline">No Expiry</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStockStatusBadge(product.quantity, product.reorderLevel || 0)}
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
                                  <Link href={`${endpoint}/drugs/${product.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`${endpoint}/drugs/edit/${product.id}`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Drug
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`${endpoint}/drugs/${product.id}/stock-tracking`}>
                                    <Activity className="mr-2 h-4 w-4" />
                                    Stock Tracking
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Drug
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
    </>
  )
}