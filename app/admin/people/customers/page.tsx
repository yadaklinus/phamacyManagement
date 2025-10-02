"use client"

import { useEffect, useState } from "react"
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
import { UserCheck, Search, Filter, Plus, MoreHorizontal, Edit, Trash2, Eye, Download, Upload, Activity } from "lucide-react"
import { useSession } from "next-auth/react"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import fetchWareHouseData from "@/hooks/fetch-invidual-data"
import { Loading } from "@/components/loading"
import Link from "next/link"
import toast from "react-hot-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"


export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  
  const warehouseId = getWareHouseId()
    
     
  
   
  
    const {data:customersData,loading,error,refetch} = fetchWareHouseData("/api/customer/list",{warehouseId})
    const [endPoint, setEndPoint] = useState("")
    const {data:session} = useSession()
    
    useEffect(()=>{
      setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
    },[session,warehouseId])
  
    if (loading) return <Loading/>
    if (error) return <h1 className="text-red-500">Error loading warehouses.</h1>
    if (!customersData) return <h1>No data available.</h1>

    console.log(customersData)

  const filteredCustomers = customersData.filter((customer:any) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleDeleteCustomer = async (customerId: string) => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/customer/${customerId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete customer')
      }

      toast.success('Customer deleted successfully!')
      refetch()
      setDeleteCustomerId(null)
    } catch (error: any) {
      console.error('Error deleting customer:', error)
      toast.error(error.message || 'Failed to delete customer')
    } finally {
      setDeleting(false)
    }
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
                  <BreadcrumbLink href={`${endPoint}/dashboard`}>Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Customers</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              <h1 className="text-2xl font-semibold text-blue-600">Customers</h1>
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
                <Link href={`${endPoint}/people/customers/add`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Customer
                </Link>
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="search">Search Customers</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name, company, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                {/* <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button> */}
              </div>
            </CardContent>
          </Card>

          {/* Customers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Customers List</CardTitle>
              <CardDescription>
                Showing {filteredCustomers.length} of {customersData.length} customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                   
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer:any) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.companyName}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      
                     
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
                              <Link href={`${endPoint}/people/customers/activities/${customer.id}`}>
                                <Activity className="mr-2 h-4 w-4" />
                                View Activities
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`${endPoint}/people/customers/edit/${customer.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Customer
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => setDeleteCustomerId(customer.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Customer
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

          {/* Delete Confirmation Dialog */}
          <Dialog open={!!deleteCustomerId} onOpenChange={() => setDeleteCustomerId(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete the customer
                  and remove their data from our servers. Note: Customers with existing sales cannot be deleted.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" disabled={deleting} onClick={() => setDeleteCustomerId(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => deleteCustomerId && handleDeleteCustomer(deleteCustomerId)}
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