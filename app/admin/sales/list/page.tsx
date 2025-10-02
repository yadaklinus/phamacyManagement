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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Plus, Search, Edit, Eye, Printer, Calendar, DollarSign, User, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { usePrintReceipt } from "@/hooks/use-print-receipt"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import fetchWareHouseData from "@/hooks/fetch-invidual-data"
import { Loading } from "@/components/loading"
import { useSession } from "next-auth/react"
import { formatCurrency } from "@/lib/utils"


export default function SalesListPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [endpoint,setEndPoint] = useState("")
  const {data:session} = useSession()
  const { printReceipt } = usePrintReceipt()

  const router = useRouter()
  const warehouseId = getWareHouseId()
  const {data:salesData,loading,error} = fetchWareHouseData("/api/sale/list",{warehouseId})
  useEffect(()=>{
    setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
  },[session,warehouseId])
  
  if(!salesData) return <Loading/>
  
  
  

  const filteredSales = salesData.filter((sale:any) => {
    const matchesSearch =
      sale.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || sale.status === statusFilter

    const matchesDate = dateFilter === "all" || sale.createdAt === dateFilter

    

    return matchesSearch && matchesStatus && matchesDate
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
      case "partial":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Partial Payment</Badge>
      case "pending":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleEdit = (saleId: string) => {
    router.push(`${endpoint}/sales/${saleId}/edit`)
  }

  const handleView = (saleId: string) => {
    router.push(`${endpoint}/sales/${saleId}`)
  }

  const handlePrintReceipt = (id:string,paperWidth: "57mm" | "80mm" | "A4") => {

    const completedSale = salesData.find((x:any)=>x.id == id)
        if (!completedSale) return
    
        const receiptData = {
          invoiceNo: completedSale.invoiceNo,
          date: completedSale.date,
          time: completedSale.time,
          customer: completedSale.customer.name,
          cashier: completedSale.cashier,
          items: completedSale.items.map((item:any) => ({
            name: item.productName,
            quantity: item.quantity,
            price: parseInt(item.price),
            total: item.total,
          })),
          subtotal: completedSale.subtotal,
          discount: 0,
          tax: parseInt(completedSale.tax),
          total: parseInt(completedSale.total),
          paid: completedSale.total - completedSale.balance,
          balance: completedSale.balance,
          paymentMethods: completedSale.paymentMethod,
        }
    
        printReceipt(receiptData, paperWidth)
      }

  const handleDelete = async (invoiceNo: string) => {
    if (!confirm("Are you sure you want to delete this sale? This will return the products back to stock.")) {
      return
    }

    try {
      const response = await fetch("/api/sale/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoiceNo }),
      })

      if (response.ok) {
        alert("Sale deleted successfully and products returned to stock!")
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert("Error deleting sale")
      console.error(error)
    }
  }



  const totalSales = filteredSales.reduce((sum:any, sale:any) => sum + sale.total, 0)
  
  const completedSales = filteredSales.filter((sale:any) => sale.status === "completed").length
  const pendingPayments = filteredSales
    .filter((sale:any) => sale.status === "partial" || sale.status === "pending")
    .reduce((sum:any, sale:any) => sum + sale.balance, 0)

  console.log(salesData)

  let totalProfit = 0
  salesData.forEach((sale:any) => {
    sale.items.forEach((item:any) => {
      totalProfit += item.profit * item.quantity;
    });
  });


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
                  <BreadcrumbPage>Sales</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
              <h1 className="text-3xl font-bold text-blue-600">Sales</h1>
            </div>
            
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Sales</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedSales}</div>
                <p className="text-xs text-muted-foreground">Successfully completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(pendingPayments)}</div>
                <p className="text-xs text-muted-foreground">Outstanding balance</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by invoice or customer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="partial">Partial Payment</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="2024-01-15">Today</SelectItem>
                    <SelectItem value="2024-01-14">Yesterday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sales Table */}
          <Card>
            <CardHeader>
              <CardTitle>Sales List ({filteredSales.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales?.map((sale:any) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.invoiceNo}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sale.date}</div>
                          <div className="text-sm text-muted-foreground">{sale.time}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{sale.customer.name}</div>
                            <Badge variant="outline" className="text-xs">
                              {sale.customer.type}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {sale.items.length} item{sale.items.length > 1 ? "s" : ""}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(sale.total)}</TableCell>
                      <TableCell className="text-green-600">{formatCurrency((sale.total - sale.balance))}</TableCell>
                      <TableCell className={sale.balance > 0 ? "text-red-600" : "text-green-600"}>
                        {formatCurrency(sale.balance)}
                      </TableCell>
                      <TableCell>{getStatusBadge(sale.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleView(sale.invoiceNo)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {/* <Button variant="ghost" size="sm" onClick={() => handleEdit(sale.invoiceNo)}>
                            <Edit className="h-4 w-4" />
                          </Button> */}
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(sale.invoiceNo)} className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <div className="flex gap-2">
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="flex-1">
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print Receipt
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                                        <DropdownMenuItem onClick={() => handlePrintReceipt(sale.id,"57mm")}>Print 57mm (2¼")</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePrintReceipt(sale.id,"80mm")}>Print 80mm (3⅛")</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePrintReceipt(sale.id,"A4")}>Print A4 (Full Page)</DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredSales.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="mx-auto h-12 w-12 mb-4" />
                  <p>No sales found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
     </>
  )
}