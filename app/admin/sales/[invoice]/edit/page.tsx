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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/loading"
import {
  ArrowLeft,
  Edit,
  Printer,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  User,
  Building2,
  Receipt,
  DollarSign,
  CreditCard,
  Package,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { usePrintReceipt } from "@/hooks/use-print-receipt"
import { useSession } from "next-auth/react"
import { getWareHouseId } from "@/hooks/get-werehouseId"

interface SaleItem {
  id: string
  productId: string | null
  productName: string
  quantity: number
  cost: number
  selectedPrice: number
  priceType: string
  discount: number
  total: number
  product?: {
    barcode: string
    name: string
    unit: string
  } | null
}

interface PaymentMethod {
  id: string
  method: string
  amount: number
}

interface Customer {
  id: string
  name: string
  type: string
  email?: string
  phoneNumber?: string
  address?: string
}

interface Warehouse {
  id: string
  code: string
  name: string
  address: string
}

interface SaleData {
  id: string
  invoiceNo: string
  date: string
  time: string
  customer: Customer
  items: SaleItem[]
  paymentMethods: PaymentMethod[]
  subtotal: number
  taxRate: number
  grandTotal: number
  amountPaid: number
  paidAmount: number
  balance: number
  notes?: string
  status: "completed" | "partial" | "pending"
  warehouse: Warehouse | null
  createdAt: string
}

export default function SaleInvoiceViewPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { printReceipt } = usePrintReceipt()
  const warehouseId = getWareHouseId()
  
  const [saleData, setSaleData] = useState<SaleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const invoiceNo = params.invoice as string

  useEffect(() => {
    const fetchSaleData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/sale/${invoiceNo}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Sale not found")
          } else {
            setError("Failed to fetch sale data")
          }
          return
        }
        
        const data = await response.json()
        setSaleData(data)
      } catch (err) {
        console.error("Error fetching sale data:", err)
        setError("Failed to fetch sale data")
      } finally {
        setLoading(false)
      }
    }

    if (invoiceNo) {
      fetchSaleData()
    }
  }, [invoiceNo])

  const handlePrint = () => {
    if (saleData) {
      printReceipt({
        invoiceNo: saleData.invoiceNo,
        date: saleData.date,
        time: saleData.time,
        customer: saleData.customer.name,
        cashier: "Admin User",
        items: saleData.items.map(item => ({
          name: item.productName,
          quantity: item.quantity,
          price: item.selectedPrice,
          total: item.total,
        })),
        subtotal: saleData.subtotal,
        discount: 0,
        tax: saleData.taxRate,
        total: saleData.grandTotal,
        totalPaid: saleData.amountPaid,
        balance: saleData.balance,
      })
    }
  }

  const handleEdit = () => {
    router.push(`/warehouse/${warehouseId}/admin/sales/${invoiceNo}/edit`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "partial":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case "cash":
        return <DollarSign className="h-4 w-4" />
      case "card":
        return <CreditCard className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  if (loading) {
    return <Loading />
  }

  if (error || !saleData) {
    return (
      <>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/warehouse/${warehouseId}/admin/sales/list`}>
                    Sales
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Error</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <h2 className="text-2xl font-bold text-red-600">Error</h2>
                <p className="text-gray-600 mt-2">{error}</p>
                <Button
                  onClick={() => router.back()}
                  className="mt-4"
                  variant="outline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
    )
  }

  return (
 <>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/warehouse/${warehouseId}/admin/sales/list`}>
                  Sales
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Invoice {saleData.invoiceNo}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => router.back()}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <h1 className="text-2xl font-bold">Invoice {saleData.invoiceNo}</h1>
              <Badge className={getStatusColor(saleData.status)}>
                {saleData.status.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button onClick={handleEdit} size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Invoice Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Invoice Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Invoice Number</label>
                    <p className="font-medium">{saleData.invoiceNo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <Badge className={getStatusColor(saleData.status)} variant="outline">
                      {saleData.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Date
                    </label>
                    <p className="font-medium">{saleData.date}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Time
                    </label>
                    <p className="font-medium">{saleData.time}</p>
                  </div>
                </div>
                {saleData.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="text-sm bg-gray-50 p-2 rounded">{saleData.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="font-medium">{saleData.customer.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <Badge variant="outline">{saleData.customer.type}</Badge>
                </div>
                {saleData.customer.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      Email
                    </label>
                    <p className="text-sm">{saleData.customer.email}</p>
                  </div>
                )}
                {saleData.customer.phoneNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      Phone
                    </label>
                    <p className="text-sm">{saleData.customer.phoneNumber}</p>
                  </div>
                )}
                {saleData.customer.address && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Address
                    </label>
                    <p className="text-sm">{saleData.customer.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Warehouse Information */}
            {saleData.warehouse && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Warehouse Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="font-medium">{saleData.warehouse.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Code</label>
                      <p className="font-medium">{saleData.warehouse.code}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="text-sm">{saleData.warehouse.address}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Items ({saleData.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saleData.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          {item.product && (
                            <p className="text-sm text-gray-500">
                              Barcode: {item.product.barcode}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        N/A
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity} {item.product?.unit || "pcs"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p>{formatCurrency(item.selectedPrice)}</p>
                          <Badge variant="outline" className="text-xs">
                            {item.priceType}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.discount)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Payment and Summary */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Payment Methods */}
            {saleData.paymentMethods.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Methods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {saleData.paymentMethods.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(payment.method)}
                          <div>
                            <p className="font-medium capitalize">{payment.method}</p>
                          </div>
                        </div>
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(saleData.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({saleData.taxRate}%):</span>
                    <span>{formatCurrency((saleData.subtotal * saleData.taxRate) / 100)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium text-lg">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(saleData.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span className="text-green-600">
                      {formatCurrency(saleData.amountPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Balance:</span>
                    <span
                      className={
                        saleData.balance > 0 ? "text-red-600" : "text-green-600"
                      }
                    >
                      {formatCurrency(saleData.balance)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </>
  )
}