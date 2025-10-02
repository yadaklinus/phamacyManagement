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
  TrendingUp,
  DollarSign,
  Package,
  AlertCircle,
} from "lucide-react"

interface PurchaseItem {
  id: string
  invoiceNumber: string
  productId: string
  productName: string
  productCode: string
  costPrice: number
  quantity: number
  discount: number
  total: number
}

interface PurchaseData {
  id: string
  invoiceNumber: string
  referenceNo: string
  date: string
  supplierId: string
  supplierName: string
  warehouseId: string
  warehouseName: string
  items: PurchaseItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  shipping: number
  grandTotal: number
  paidAmount: number
  status: "ordered" | "received" | "pending"
  paymentStatus: "paid" | "partial" | "pending"
  notes: string
  createdAt: string
}

export default function ViewPurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  useEffect(() => {
    // Load purchases from localStorage (replace with API call)
    const savedPurchases = JSON.parse(localStorage.getItem("purchases") || "[]")
    setPurchases(savedPurchases)
  }, [])

  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      purchase.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.warehouseName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || purchase.status === statusFilter
    const matchesPayment = paymentFilter === "all" || purchase.paymentStatus === paymentFilter

    let matchesDate = true
    if (dateFilter !== "all") {
      const purchaseDate = new Date(purchase.date)
      const today = new Date()
      const daysDiff = Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))

      switch (dateFilter) {
        case "today":
          matchesDate = daysDiff === 0
          break
        case "week":
          matchesDate = daysDiff <= 7
          break
        case "month":
          matchesDate = daysDiff <= 30
          break
      }
    }

    return matchesSearch && matchesStatus && matchesPayment && matchesDate
  })

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

  const handleDelete = (purchaseId: string) => {
    const updatedPurchases = purchases.filter((p) => p.id !== purchaseId)
    setPurchases(updatedPurchases)
    localStorage.setItem("purchases", JSON.stringify(updatedPurchases))
  }

  const handlePrint = (purchase: PurchaseData) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Order - ${purchase.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .details { margin-bottom: 20px; }
            .items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items th { background-color: #f2f2f2; }
            .totals { margin-left: auto; width: 300px; }
            .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .grand-total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PURCHASE ORDER</h1>
            <h2>Invoice: ${purchase.invoiceNumber}</h2>
            <p>Reference: ${purchase.referenceNo}</p>
            <p>Date: ${new Date(purchase.date).toLocaleDateString()}</p>
          </div>
          
          <div class="details">
            <h3>Supplier: ${purchase.supplierName}</h3>
            <h3>Warehouse: ${purchase.warehouseName}</h3>
          </div>

          <table class="items">
            <thead>
              <tr>
                <th>Item Invoice</th>
                <th>Product</th>
                <th>Code</th>
                <th>Cost Price</th>
                <th>Quantity</th>
                <th>Discount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${purchase.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.invoiceNumber}</td>
                  <td>${item.productName}</td>
                  <td>${item.productCode}</td>
                  <td>$${item.costPrice.toFixed(2)}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.discount.toFixed(2)}</td>
                  <td>$${item.total.toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>$${purchase.subtotal.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Tax (${purchase.taxRate}%):</span>
              <span>$${purchase.taxAmount.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Shipping:</span>
              <span>$${purchase.shipping.toFixed(2)}</span>
            </div>
            <div class="total-row grand-total">
              <span>Grand Total:</span>
              <span>$${purchase.grandTotal.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Paid Amount:</span>
              <span>$${purchase.paidAmount.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Balance:</span>
              <span>$${(purchase.grandTotal - purchase.paidAmount).toFixed(2)}</span>
            </div>
          </div>

          <div style="margin-top: 50px; text-align: center; color: #666;">
            <p>Status: ${purchase.status.toUpperCase()} | Payment: ${purchase.paymentStatus.toUpperCase()}</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.print()
  }

  // Calculate statistics
  const totalPurchases = purchases.length
  const totalValue = purchases.reduce((sum, purchase) => sum + purchase.grandTotal, 0)
  const totalPaid = purchases.reduce((sum, purchase) => sum + purchase.paidAmount, 0)
  const pendingPayments = totalValue - totalPaid
  const receivedPurchases = purchases.filter((p) => p.status === "received").length

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
                  <BreadcrumbLink href="/purchases/list">Purchases</BreadcrumbLink>
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
                <a href="/purchases/add">
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
                <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
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
                <div className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</div>
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
                <div className="text-2xl font-bold text-orange-600">${pendingPayments.toFixed(2)}</div>
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
                Showing {filteredPurchases.length} of {purchases.length} purchases
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPurchases.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="mx-auto h-12 w-12 mb-4" />
                  <p>
                    No purchases found.{" "}
                    {purchases.length === 0 ? "Create your first purchase order!" : "Try adjusting your filters."}
                  </p>
                  {purchases.length === 0 && (
                    <Button asChild className="mt-4">
                      <a href="/purchases/add">
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
                    {filteredPurchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-mono text-xs">{purchase.invoiceNumber}</TableCell>
                        <TableCell className="font-medium">{purchase.referenceNo}</TableCell>
                        <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                        <TableCell>{purchase.supplierName}</TableCell>
                        <TableCell>{purchase.warehouseName}</TableCell>
                        <TableCell>{purchase.items.length}</TableCell>
                        <TableCell>${purchase.grandTotal.toFixed(2)}</TableCell>
                        <TableCell className="text-green-600">${purchase.paidAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-orange-600">
                          ${(purchase.grandTotal - purchase.paidAmount).toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                        <TableCell>{getPaymentBadge(purchase.paymentStatus)}</TableCell>
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
                              <DropdownMenuItem onClick={() => handlePrint(purchase)}>
                                <Download className="mr-2 h-4 w-4" />
                                Print Order
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Purchase
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(purchase.id)}>
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
