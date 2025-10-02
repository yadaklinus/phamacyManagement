"use client"

import { useState, useEffect } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
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
  Truck,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Building2,
  FolderSyncIcon as Sync,
  Clock,
} from "lucide-react"
import fetchWareHouseData from "@/hooks/fetch-invidual-data"
import { getWareHouseId } from "@/hooks/get-werehouseId"

// Types based on Prisma schema
interface Supplier {
  id: string
  name: string
  type: "INDIVIDUAL" | "COMPANY" | "GOVERNMENT" | "NON_PROFIT"
  companyName?: string
  email?: string
  address?: string
  phone?: string
  warehousesId: string
  sync: boolean
  syncedAt?: string
  createdAt: string
  updatedAt: string
  // Relations
  warehouse?: {
    warehouseCode: string
    name: string
  }
  _count?: {
    purchase: number
  }
}


export default function SuppliersPage() {
  
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [syncFilter, setSyncFilter] = useState("all")
  const [warehouseFilter, setWarehouseFilter] = useState("all")

  const warehousesId = getWareHouseId()

  const {data:suppliers,loading,error} = fetchWareHouseData("/api/supplier/list",{warehousesId})

  console.log(suppliers)
  

  if(!suppliers) return ""
 


  const filteredSuppliers = suppliers.filter((supplier:any) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.type.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === "all" || supplier.type === typeFilter
    const matchesSync =
      syncFilter === "all" ||
      (syncFilter === "synced" && supplier.sync) ||
      (syncFilter === "not-synced" && !supplier.sync)
    const matchesWarehouse = warehouseFilter === "all" || supplier.warehousesId === warehouseFilter

    return matchesSearch && matchesType && matchesSync && matchesWarehouse
  })

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "COMPANY":
        return (
          <Badge variant="default" className="bg-blue-600">
            Company
          </Badge>
        )
      case "INDIVIDUAL":
        return <Badge variant="secondary">Individual</Badge>
      case "GOVERNMENT":
        return (
          <Badge variant="outline" className="border-green-600 text-green-600">
            Government
          </Badge>
        )
      case "NON_PROFIT":
        return (
          <Badge variant="outline" className="border-purple-600 text-purple-600">
            Non-Profit
          </Badge>
        )
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const getSyncBadge = (sync: boolean, syncedAt?: string) => {
    if (sync && syncedAt) {
      return (
        <div className="flex items-center gap-1">
          <Badge variant="default" className="bg-green-600">
            <Sync className="w-3 h-3 mr-1" />
            Synced
          </Badge>
          <span className="text-xs text-muted-foreground">{new Date(syncedAt).toLocaleDateString()}</span>
        </div>
      )
    }
    return (
      <Badge variant="destructive">
        <Clock className="w-3 h-3 mr-1" />
        Not Synced
      </Badge>
    )
  }

  const totalSuppliers = suppliers.length
  const syncedSuppliers = suppliers.filter((s:any) => s.sync).length
  const totalPurchases = suppliers.reduce((sum:any, s:any) => sum + (s._count?.purchase || 0), 0)

  if (loading) {
    return (
     <>
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
       </>
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
                  <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/people">People</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Suppliers</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-600" />
              <h1 className="text-2xl font-semibold text-orange-600">Suppliers</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button asChild>
                <a href="/people/suppliers/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Supplier
                </a>
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSuppliers}</div>
                <p className="text-xs text-muted-foreground">Active suppliers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Synced Suppliers</CardTitle>
                <Sync className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{syncedSuppliers}</div>
                <p className="text-xs text-muted-foreground">
                  {totalSuppliers > 0 ? ((syncedSuppliers / totalSuppliers) * 100).toFixed(1) : 0}% synced
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPurchases}</div>
                <p className="text-xs text-muted-foreground">Purchase orders</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{new Set(suppliers.map((s:any) => s.warehousesId)).size}</div>
                <p className="text-xs text-muted-foreground">Connected warehouses</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="search">Search Suppliers</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name, company, email, or type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="COMPANY">Company</SelectItem>
                      <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                      <SelectItem value="GOVERNMENT">Government</SelectItem>
                      <SelectItem value="NON_PROFIT">Non-Profit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sync">Sync Status</Label>
                  <Select value={syncFilter} onValueChange={setSyncFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="synced">Synced</SelectItem>
                      <SelectItem value="not-synced">Not Synced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouse">Warehouse</Label>
                  <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Warehouses</SelectItem>
                      <SelectItem value="WH-001">Main Warehouse</SelectItem>
                      <SelectItem value="WH-002">Secondary Warehouse</SelectItem>
                      <SelectItem value="WH-003">Distribution Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("")
                    setTypeFilter("all")
                    setSyncFilter("all")
                    setWarehouseFilter("all")
                  }}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Suppliers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Suppliers List</CardTitle>
              <CardDescription>
                Showing {filteredSuppliers.length} of {suppliers.length} suppliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Purchases</TableHead>
                    <TableHead>Sync Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier:any) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          {supplier.companyName && (
                            <div className="text-sm text-muted-foreground">{supplier.companyName}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(supplier.type)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {supplier.email && <div className="text-sm">{supplier.email}</div>}
                          {supplier.phone && <div className="text-sm text-muted-foreground">{supplier.phone}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{supplier.warehouse?.name}</div>
                          <div className="text-sm text-muted-foreground">{supplier.warehouse?.warehouseCode}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{supplier._count?.purchase || 0}</Badge>
                      </TableCell>
                      <TableCell>{getSyncBadge(supplier.sync, supplier.syncedAt)}</TableCell>
                      <TableCell>{new Date(supplier.updatedAt).toLocaleDateString()}</TableCell>
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
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Supplier
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Sync className="mr-2 h-4 w-4" />
                              Sync Now
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Supplier
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
     </>
  )
}
