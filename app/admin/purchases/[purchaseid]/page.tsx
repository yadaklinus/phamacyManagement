"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Truck, 
  ArrowLeft, 
  Printer, 
  Edit, 
  Package,
  DollarSign,
  Calendar,
  User,
  Building
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { getWareHouseId } from "@/hooks/get-werehouseId"

interface PurchaseItem {
  id: string
  productName: string
  productId: string
  cost: number
  selectedPrice: number
  priceType: string
  quantity: number
  discount: number
  total: number
}

interface Purchase {
  id: string
  referenceNo: string
  subTotal: number
  taxRate: number
  grandTotal: number
  paidAmount: number
  balance: number
  notes: string
  createdAt: string
  Supplier: {
    id: string
    name: string
    email: string
    phone: string
    address: string
  }
  purchaseItem: PurchaseItem[]
}

export default function ViewPurchasePage() {
  const params = useParams()
  const router = useRouter()
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(true)
  const warehouseId = getWareHouseId()

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        const response = await fetch('/api/purchase/list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ warehouseId }),
        })

        if (response.ok) {
          const purchases = await response.json()
          const foundPurchase = purchases.find((p: Purchase) => p.id === params.purchaseId)
          setPurchase(foundPurchase || null)
        }
      } catch (error) {
        console.error('Error fetching purchase:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.purchaseId) {
      fetchPurchase()
    }
  }, [params.purchaseId, warehouseId])

  const handlePrint = () => {
    if (!purchase) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Order - ${purchase.referenceNo}</title>
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
            <h2>Reference: ${purchase.referenceNo}</h2>
            <p>Date: ${new Date(purchase.createdAt).toLocaleDateString()}</p>
          </div>
          
          <div class="details">
            <h3>Supplier Information:</h3>
            <p><strong>${purchase.Supplier.name}</strong></p>
            <p>${purchase.Supplier.email}</p>
            <p>${purchase.Supplier.phone}</p>
            <p>${purchase.Supplier.address}</p>
          </div>

          <table class="items">
            <thead>
              <tr>
                <th>Product</th>
                <th>Cost Price</th>
                <th>Quantity</th>
                <th>Discount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${purchase.purchaseItem
                .map(
                  (item) => `
                <tr>
                  <td>${item.productName}</td>
                  <td>$${item.cost.toFixed(2)}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.discount.toFixed(2)}</td>
                  <td>$${item.total.toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>$${purchase.subTotal.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Tax (${purchase.taxRate}%):</span>
              <span>$${((purchase.subTotal * purchase.taxRate) / 100).toFixed(2)}</span>
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
              <span>$${purchase.balance.toFixed(2)}</span>
            </div>
          </div>

          ${
            purchase.notes
              ? `
            <div style="margin-top: 30px;">
              <h3>Notes:</h3>
              <p>${purchase.notes}</p>
            </div>
          `
              : ""
          }

          <div style="margin-top: 50px; text-align: center; color: #666;">
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.print()
  }

  if (loading) {
    return (
     <>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p>Loading purchase details...</p>
            </div>
          </div>
       </>
    )
  }

  if (!purchase) {
    return (
     <>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p>Purchase not found</p>
              <Button onClick={() => router.back()} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </div>
        </>
    )
  }

  const getPaymentStatus = () => {
    if (purchase.paidAmount >= purchase.grandTotal) return "paid"
    if (purchase.paidAmount > 0) return "partial"
    return "pending"
  }

  const getPaymentBadge = () => {
    const status = getPaymentStatus()
    switch (status) {
      case "paid":
        return <Badge className="bg-green-600">Paid</Badge>
      case "partial":
        return <Badge className="bg-yellow-600">Partial</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
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
                  <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/purchases/list">Purchases</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>View Purchase</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex-1 space-y-4 p-4 pt-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-semibold">Purchase Order</h1>
                <p className="text-muted-foreground">Reference: {purchase.referenceNo}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Overview Cards */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(purchase.grandTotal)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(purchase.paidAmount)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(purchase.balance)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getPaymentBadge()}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Purchase Details */}
            <Card>
              <CardHeader>
                <CardTitle>Purchase Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Date:</span>
                  <span className="text-sm">{new Date(purchase.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Items:</span>
                  <span className="text-sm">{purchase.purchaseItem.length} items</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Tax Rate:</span>
                  <span className="text-sm">{purchase.taxRate}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Supplier Details */}
            <Card>
              <CardHeader>
                <CardTitle>Supplier Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Name:</span>
                  <span className="text-sm">{purchase.Supplier.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm">{purchase.Supplier.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Phone:</span>
                  <span className="text-sm">{purchase.Supplier.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Address:</span>
                  <span className="text-sm">{purchase.Supplier.address}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Items */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Items</CardTitle>
              <CardDescription>
                Items included in this purchase order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead>Price Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.purchaseItem.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.productName}</div>
                      </TableCell>
                      <TableCell>{formatCurrency(item.cost)}</TableCell>
                      <TableCell>
                        <Badge variant={item.priceType === "wholesale" ? "default" : "secondary"}>
                          {item.priceType}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.discount)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Purchase Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(purchase.subTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({purchase.taxRate}%):</span>
                  <span>{formatCurrency((purchase.subTotal * purchase.taxRate) / 100)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-medium">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(purchase.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Paid Amount:</span>
                  <span>{formatCurrency(purchase.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>Balance:</span>
                  <span>{formatCurrency(purchase.balance)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {purchase.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{purchase.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </>
  )
}