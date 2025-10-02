"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import fetchWareHouseData from "@/hooks/fetch-invidual-data"
import { Loading } from "@/components/loading"
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
  TrendingUp,
  DollarSign,
  Package,
  AlertCircle,
  RefreshCcw,
  Printer,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { usePrintPurchase } from "@/hooks/use-print-purchase"



export default function ViewPurchasesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
   const [endPoint, setEndPoint] = useState("")
    const {data:session} = useSession()
  const router = useRouter()

  const warehouseId = getWareHouseId()
  const { data: purchases, loading, error,refetch } = fetchWareHouseData("/api/purchase/list", { warehouseId })
  const { printPurchaseReceipt } = usePrintPurchase()
  useEffect(()=>{
    setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
  },[session,warehouseId])

  if (loading) return <Loading />
  if (error) return <div>Error loading purchases</div>
  if (!purchases) return <div>No purchases found</div>



  const handleDelete = async (referenceNo: string) => {
    if (!confirm("Are you sure you want to delete this purchase? This will remove the products from stock.")) {
      return
    }

    try {
      const response = await fetch("/api/purchase/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ referenceNo }),
      })

      if (response.ok) {
        alert("Purchase deleted successfully and products removed from stock!")
        refetch()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert("Error deleting purchase")
      console.error(error)
    }
  }

  const filteredPurchases = purchases?.filter((purchase: any) => {
    const matchesSearch =
      purchase.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (purchase.Supplier?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    
      console.log(purchase)
      const matchesStatus = statusFilter === "all" || purchase.status === statusFilter
    // Note: status and paymentStatus filtering would need to be added to the backend
    // For now, we'll just filter by search term
    return matchesSearch && matchesStatus
  }) || []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "received":
        return (
          <Badge variant="default" className="bg-green-600">
            Received
          </Badge>
        )
      case "ordered":
        return (
          <Badge variant="secondary" className="bg-blue-600">
            Ordered
          </Badge>
        )
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge variant="default" className="bg-green-600">
            Paid
          </Badge>
        )
      case "partial":
        return (
          <Badge variant="secondary" className="bg-yellow-600">
            Partial
          </Badge>
        )
      case "pending":
        return <Badge variant="destructive">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setPaymentFilter("all")
    setDateFilter("all")
  }



  const handlePrint = (purchase: any) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Purchase Order - ${purchase.referenceNo}</title>
              <style>
                @page { 
                  size: A4; 
                  margin: 0; 
                }
                html, body {
                  margin: 0;
                  padding: 0;
                  width: 210mm;
                  height: 297mm;
                  font-family: Arial, sans-serif;
                  font-size: 10px;
                  line-height: 1.4;
                  color: white; /* Assuming fontColor is still a valid variable */
                  background: white;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .purchase-container {
                  width: 100%;
                  height: 100%;
                  padding: 10mm;
                  box-sizing: border-box;
                  display: flex;
                  flex-direction: column;
                }
                .header {
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  padding-bottom: 10px;
                  border-bottom: 2px solid #000;
                  flex-shrink: 0;
                }
                .purchase-title {
                  font-size: 24px;
                  font-weight: bold;
                }
                .purchase-meta {
                  border: 1px solid #000;
                  padding: 5px;
                  min-width: 200px;
                }
                .purchase-meta table {
                  width: 100%;
                  border-collapse: collapse;
                }
                .purchase-meta td {
                  padding: 2px 4px;
                  font-size: 10px;
                }
                .supplier-info {
                  padding: 10px 0;
                  flex-shrink: 0;
                }
                .items-table-container {
                  flex-grow: 1;
                  overflow: hidden;
                  position: relative;
                }
                .items-table {
                  width: 100%;
                  border-collapse: collapse;
                  table-layout: fixed;
                }
                .items-table th, .items-table td {
                  border: 1px solid #000;
                  padding: 4px;
                  text-align: left;
                  word-wrap: break-word;
                }
                .items-table th {
                  font-weight: bold;
                  background-color: #f2f2f2;
                }
                .items-table .col-no { width: 8%; }
                .items-table .col-qty { width: 12%; }
                .items-table .col-large { width: 40%; }
                .items-table .col-medium { width: 20%; }
                .items-table .align-right { text-align: right; }
                .footer {
                  padding-top: 10px;
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-end;
                  flex-shrink: 0;
                }
                .footer-note {
                  font-size: 10px;
                }
                .totals {
                  width: 250px;
                  border: 1px solid #000;
                  padding: 5px;
                }
                .totals table {
                  width: 100%;
                }
                .totals td {
                  padding: 3px 5px;
                  font-size: 12px;
                }
                .totals .grand-total td {
                  font-weight: bold;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="purchase-container">
                <div class="header">
                  <div class="purchase-title">
                    PURCHASE ORDER
                  </div>
                  <div class="purchase-meta">
                    <table>
                      <tr><td><strong>Reference #</strong></td><td>${purchase.referenceNo}</td></tr>
                      <tr><td><strong>Date</strong></td><td>${new Date(purchase.createdAt).toLocaleDateString()}</td></tr>
                      <tr><td><strong>Warehouse</strong></td><td>Current Warehouse</td></tr>
                      <tr><td><strong>Items</strong></td><td>${(purchase.purchaseItem || []).length}</td></tr>
                    </table>
                  </div>
        _      </div>
      
                <div class="supplier-info">
                  <strong>Supplier: ${purchase.Supplier?.name || 'N/A'}</strong>
                </div>
                
                <div class="items-table-container">
                  <table class="items-table">
                    <thead>
                      <tr>
                        <th class="col-no">#</th>
                        <th class="col-large">PRODUCT</th>
                        <th class="col-qty">QTY</th>
                        <th class="col-medium align-right">COST</th>
                        <th class="col-medium align-right">DISCOUNT</th>
                        <th class="col-medium align-right">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${(purchase.purchaseItem || []).map((item:any, index:any) => `
                        <tr>
                          <td>${index + 1}</td>
                          <td>${item.productName}</td>
                          <td>${item.quantity}</td>
                          <td class="align-right">${formatCurrency(item.cost)}</td>
                          <td class="align-right">${formatCurrency(item.discount)}</td>
                          <td class="align-right">${formatCurrency(item.total)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
      
                <div class="footer">
                  <div class="footer-note">
                    Generated on ${new Date().toLocaleString()}
                  </div>
                  <div class="totals">
                    <table>
                      <tr><td>Sub Total:</td><td class="align-right">${formatCurrency(purchase.subTotal)}</td></tr>
                      <tr><td>Tax (${purchase.taxRate}%):</td><td class="align-right">${formatCurrency((purchase.subTotal * purchase.taxRate) / 100)}</td></tr>
                      <tr class="grand-total"><td>Grand Total:</td><td class="align-right">${formatCurrency(purchase.grandTotal)}</td></tr>
                      <tr><td>Paid Amount:</td><td class="align-right">${formatCurrency(purchase.paidAmount)}</td></tr>
                      ${purchase.balance > 0 ? `<tr><td><strong>Balance Due:</strong></td><td class="align-right"><strong>${formatCurrency(purchase.balance)}</strong></td></tr>` : ''}
                      ${purchase.balance < 0 ? `<tr><td>Change:</td><td class="align-right">${formatCurrency(Math.abs(purchase.balance))}</td></tr>` : ''}
                    </table>
                  </div>
                </div>
                
                ${purchase.notes ? `
                <div style="margin-top: 20px;">
                  <h3>Notes:</h3>
                  <p>${purchase.notes}</p>
                </div>
                ` : ''}
              </div>
            </body>
          </html>
          `)

    printWindow.document.close()
    printWindow.print()
  }

  const handlePrintReceipt = (purchase: any) => {
    // Prepare data for the receipt printer
    const receiptData = {
      referenceNo: purchase.referenceNo,
      invoiceNo: purchase.referenceNo, // Use reference as invoice number
      date: new Date(purchase.createdAt).toLocaleDateString(),
      time: new Date(purchase.createdAt).toLocaleTimeString(),
      supplier: purchase.Supplier?.name || 'N/A',
      warehouse: 'Current Warehouse', // You might want to get actual warehouse name
      items: (purchase.purchaseItem || []).map((item: any) => ({
        name: item.productName,
        productBarcode: item.productBarcode || '',
        quantity: item.quantity,
        cost: item.cost,
        discount: item.discount,
        total: item.total,
        unit: item.unit || ''
      })),
      subtotal: purchase.subTotal,
      taxRate: purchase.taxRate || 0,
      taxAmount: (purchase.subTotal * (purchase.taxRate || 0)) / 100,
      shipping: 0, // Add if you have shipping data
      total: purchase.grandTotal,
      paidAmount: purchase.paidAmount,
      balance: purchase.balance,
      status: purchase.status || 'received',
      notes: purchase.notes || ''
    }

    printPurchaseReceipt(receiptData,"A4")
  }

  // Calculate statistics
  const totalPurchases = purchases?.length || 0
  const totalValue = purchases?.reduce((sum: number, purchase: any) => sum + purchase.grandTotal, 0) || 0
  const totalPaid = purchases?.reduce((sum: number, purchase: any) => sum + purchase.paidAmount, 0) || 0
  const pendingPayments = totalValue - totalPaid
  const receivedPurchases = purchases?.filter((p: any) => p.status === "received").length || 0

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
                  <BreadcrumbLink href={`${endPoint}/purchases/list`}>Purchases</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>View Purchases</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              <h1 className="text-2xl font-semibold text-blue-600">Purchases</h1>
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
                <a href={`${endPoint}/purchases/add`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Purchase
                </a>
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPurchases}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  {receivedPurchases} received
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  All purchase orders
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  Payments completed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(pendingPayments)}</div>
                <p className="text-xs text-muted-foreground">
                  <AlertCircle className="inline h-3 w-3 mr-1" />
                  Outstanding balance
                </p>
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
                  <Label htmlFor="search">Search Purchases</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by invoice, reference, supplier, or warehouse..."
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
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="ordered">Ordered</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment">Payment</Label>
                  <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payments</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
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

          {/* Purchases Table */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders</CardTitle>
              <CardDescription>
                Showing {filteredPurchases.length} of {purchases?.length || 0} purchases
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPurchases.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="mx-auto h-12 w-12 mb-4" />
                  <p>
                    No purchases found.{" "}
                    {(purchases?.length || 0) === 0 ? "Create your first purchase order!" : "Try adjusting your filters."}
                  </p>
                  {(purchases?.length || 0) === 0 && (
                    <Button asChild className="mt-4">
                      <a href={`${endPoint}/purchases/add`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Purchase
                      </a>
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchases.map((purchase: any) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-mono text-xs">{purchase.referenceNo}</TableCell>
                        <TableCell className="font-medium">{purchase.referenceNo}</TableCell>
                        <TableCell>{new Date(purchase.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{purchase.Supplier?.name || "N/A"}</TableCell>
                        <TableCell>Current Warehouse</TableCell>
                        <TableCell>{purchase.purchaseItem?.length || 0}</TableCell>
                        <TableCell>{formatCurrency(purchase.grandTotal)}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(purchase.paidAmount)}</TableCell>
                        <TableCell className="text-orange-600">
                          {formatCurrency(purchase.balance)}
                        </TableCell>
                        <TableCell><Badge variant="outline">Ordered</Badge></TableCell>
                        <TableCell><Badge variant="outline">
                          {purchase.paidAmount >= purchase.grandTotal ? "Paid" : purchase.paidAmount > 0 ? "Partial" : "Pending"}
                        </Badge></TableCell>
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
                              
                        
                              
                            <DropdownMenuItem onClick={() => handlePrintReceipt(purchase)}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print Receipt
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(purchase.referenceNo)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Purchase
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
        </div>
     </>
  )
}