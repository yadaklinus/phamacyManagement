"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

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
  Loader2,
  Activity,
} from "lucide-react"
import toast from "react-hot-toast"
import fetchWareHouseData from "@/hooks/fetch-invidual-data"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Supplier {
  id: string
  name: string
  companyName?: string
  email: string
  phone: string
  address: string
  type: string
  warehousesId: string
}

export default function SuppliersPage() {
  const params = useParams()
  const router = useRouter()
  const [endPoint, setEndPoint] = useState("")
  const warehouseId = params.id as string

  const {data:session} = useSession()
        
        useEffect(()=>{
          setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
        },[session,warehouseId])

 
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [deleteSupplierId, setDeleteSupplierId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const {data:suppliers,loading,error,refetch} = fetchWareHouseData("/api/supplier/list",{warehouseId})

  if(!suppliers) return ""

  // Fetch suppliers from API
 

  const filteredSuppliers = suppliers?.filter((supplier:any) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.companyName && supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      supplier.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || supplier.type === typeFilter

    return matchesSearch && matchesType
  })

  const getTypeBadge = (type: string) => {
    const typeColors: { [key: string]: string } = {
      COMPANY: "bg-blue-600",
      INDIVIDUAL: "bg-green-600", 
      GOVERNMENT: "bg-purple-600",
      NON_PROFIT: "bg-orange-600",
      retal: "bg-pink-600",
      wholesale: "bg-indigo-600"
    }
    
    return (
      <Badge variant="default" className={typeColors[type] || "bg-gray-600"}>
        {type.replace('_', ' ')}
      </Badge>
    )
  }

  const handleAddSupplier = () => {
    router.push(`${endPoint}/people/suppliers/add`)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setTypeFilter("all")
  }

  const handleDeleteSupplier = async (supplierId: string) => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/supplier/${supplierId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete supplier')
      }

      toast.success('Supplier deleted successfully!')
      refetch()
      setDeleteSupplierId(null)
    } catch (error: any) {
      console.error('Error deleting supplier:', error)
      toast.error(error.message || 'Failed to delete supplier')
    } finally {
      setDeleting(false)
    }
  }

  const totalSuppliers = suppliers?.length
  const uniqueTypes = [...new Set(suppliers?.map((s:any) => s.type))]

  if (loading) {
    return (
      <>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href={`${endPoint}/dashboard`}>Dashboard</BreadcrumbLink>
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
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading suppliers...</span>
            </div>
          </div>
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
                  <BreadcrumbLink href={`${endPoint}/dashboard`}>Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                
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
              <Button onClick={handleAddSupplier}>
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSuppliers}</div>
                <p className="text-xs text-muted-foreground">Registered suppliers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Supplier Types</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{uniqueTypes.length}</div>
                <p className="text-xs text-muted-foreground">Different supplier types</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Companies</CardTitle>
                <div className="text-xs text-blue-600 font-medium">Corp</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {suppliers.filter((s:any) => s.type === 'COMPANY').length}
                </div>
                <p className="text-xs text-muted-foreground">Company suppliers</p>
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
                  <Label htmlFor="type">Supplier Type</Label>
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
                      <SelectItem value="retal">Retail</SelectItem>
                      <SelectItem value="wholesale">Wholesale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={clearFilters}>
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
              {filteredSuppliers.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No suppliers found</h3>
                  <p className="text-muted-foreground mb-4">
                    {suppliers.length === 0 
                      ? "Get started by adding your first supplier." 
                      : "Try adjusting your search or filter criteria."}
                  </p>
                  {suppliers.length === 0 && (
                    <Button onClick={handleAddSupplier}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Supplier
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.map((supplier:any) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.companyName || "-"}</TableCell>
                        <TableCell>{supplier.email}</TableCell>
                        <TableCell>{supplier.phone}</TableCell>
                        <TableCell>{getTypeBadge(supplier.type)}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={supplier.address}>
                          {supplier.address}
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
                                <Link href={`${endPoint}/people/suppliers/activities/${supplier.id}`}>
                                  <Activity className="mr-2 h-4 w-4" />
                                  View Activities
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`${endPoint}/people/suppliers/edit/${supplier.id}`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Supplier
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => setDeleteSupplierId(supplier.id)}
                              >
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
              )}
            </CardContent>
          </Card>

          {/* Delete Confirmation Dialog */}
          <Dialog open={!!deleteSupplierId} onOpenChange={() => setDeleteSupplierId(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete the supplier
                  and remove their data from our servers. Note: Suppliers with existing purchases cannot be deleted.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" disabled={deleting} onClick={() => setDeleteSupplierId(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => deleteSupplierId && handleDeleteSupplier(deleteSupplierId)}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </>
  )
}