"use client"

import { useState } from "react"
import Link from "next/link"
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
  Warehouse,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Users,
  Package,
} from "lucide-react"
import fetchData from "@/hooks/fetch-data"
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
import { Loading } from "@/components/loading"






export default function WarehousesListPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const {data:warehousesData,loading,error} = fetchData("/api/warehouse")

  if (loading) return <Loading/>
if (error) return <h1 className="text-red-500">Error loading warehouses.</h1>
if (!warehousesData) return <h1>No data available.</h1>

    
  
  

const filteredWarehouses = warehousesData?.filter((warehouse: any) => {
  const matchesSearch =
    warehouse?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse?.warehouseCode?.toLowerCase().includes(searchTerm.toLowerCase())

  const matchesStatus = statusFilter === "all" || warehouse.status === statusFilter

  return matchesSearch && matchesStatus
}) || []


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
                  <BreadcrumbLink href="/warehouses/list">Warehouses</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>View Warehouses</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-blue-600" />
              <h1 className="text-2xl font-semibold text-blue-600">Warehouses</h1>
            </div>
            <Button asChild>
              <a href="/warehouses/add">
                <Plus className="mr-2 h-4 w-4" />
                Add Warehouse
              </a>
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Warehouses</CardTitle>
                <Warehouse className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{warehousesData?.length}</div>
                <p className="text-xs text-muted-foreground">
                  {warehousesData?.length} active
                </p>
              </CardContent>
            </Card>
           
            {/* <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Stock</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {warehousesData.reduce((sum:any, w:any) => sum + w.currentStock, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">sq ft used</p>
              </CardContent>
            </Card> */}
            {/* <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{warehousesData.reduce((sum:any, w:any) => sum + w.assignedUsers, 0)}</div>
                <p className="text-xs text-muted-foreground">total users</p>
              </CardContent>
            </Card> */}
          </div>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="search">Search Warehouses</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name, code, manager, or address..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Warehouses Table */}
          <Card>
            <CardHeader>
              <CardTitle>Warehouses List</CardTitle>
              <CardDescription>
                Showing {filteredWarehouses.length} of {warehousesData.length} warehouses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Code</TableHead>
                    
                    <TableHead>Location</TableHead>
                   
                    {/* <TableHead>Status</TableHead> */}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWarehouses.map((warehouse:any) => (
                    <TableRow key={warehouse.id}>
                      <TableCell>
                      
                        {warehouse.name}
                      </TableCell>
                     <TableCell className="font-mono">{warehouse.warehouseCode}</TableCell>
                     <TableCell className="font-mono">{warehouse.address.split(",")[0]}</TableCell>
                       {/* 
                      <TableCell>
                        <div className="text-sm">
                          <div>{warehouse.phone}</div>
                          <div className="text-muted-foreground">{warehouse.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div
                            className={`font-medium ${getCapacityColor(warehouse.currentStock, warehouse.capacity)}`}
                          >
                            {getCapacityPercentage(warehouse.currentStock, warehouse.capacity)}% used
                          </div>
                          <div className="text-muted-foreground">
                            {warehouse.currentStock.toLocaleString()} / {warehouse.capacity.toLocaleString()} sq ft
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{warehouse.totalProducts.toLocaleString()}</TableCell>
                      */}
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
                              <Link href={`/sup-admin/warehouses/${warehouse?.warehouseCode}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link  href={`/sup-admin/warehouses/${warehouse?.warehouseCode}/edit`} >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Warehouse
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="mr-2 h-4 w-4" />
                              Manage Users
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              <Dialog>
      <DialogTrigger asChild>
      <Button variant="outline">Share</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
         <DialogTitle>Main</DialogTitle>
          <DialogDescription>
            Are You sure you want to delete it all users associated to the warehouse and the data will be deleted
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <Input
              id="link"
              defaultValue="https://ui.shadcn.com/docs/installation"
              readOnly
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
