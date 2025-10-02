"use client"

import { useState, useEffect } from "react"
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
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import {
  Quote,
  Edit,
  Printer,
  ShoppingCart,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Download,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import { Loading } from "@/components/loading"
import { formatCurrency } from "@/lib/utils"
import { useSession } from "next-auth/react"
import axios from "axios"

interface QuotationDetails {
  id: string
  quotationNo: string
  selectedCustomer: {
    id: string
    name: string
    email: string
    phone: string
    address: string
    type: string
  }
  quotationItems: Array<{
    id: string
    productName: string
    cost: number
    selectedPrice: number
    priceType: string
    quantity: number
    discount: number
    total: number
    product?: {
      barcode: string
      unit: string
    }
  }>
  subTotal: number
  taxRate: number
  grandTotal: number
  status: string
  validUntil: string | null
  notes: string
  convertedToSaleId: string | null
  createdAt: string
  updatedAt: string
  warehouses: {
    name: string
    address: string
    phone: string
    email: string
  }
}

export default function ViewQuotationPage() {
  const [quotation, setQuotation] = useState<QuotationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [endPoint, setEndPoint] = useState("")
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)

  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const warehouseId = getWareHouseId()
  const quotationNo = params.quotation as string

  useEffect(() => {
    setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
  }, [session, warehouseId])

  const fetchQuotation = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/quotation?quotationNo=${quotationNo}&warehouseId=${warehouseId}`)
      setQuotation(response.data)
    } catch (error) {
      console.error("Error fetching quotation:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (quotationNo && warehouseId) {
      fetchQuotation()
    }
  }, [quotationNo, warehouseId])

  const handleConvertToSale = async () => {
    if (!quotation) return

    try {
      const response = await axios.post("/api/quotation/convert", {
        quotationNo: quotation.quotationNo,
        paymentMethods: [],
        amountPaid: quotation.grandTotal,
        balance: 0
      })

      if (response.status === 201) {
        alert(`Quotation converted to sale successfully! Invoice: ${response.data.invoiceNo}`)
        setConvertDialogOpen(false)
        router.push(`${endPoint}/sales/${response.data.invoiceNo}`)
      }
    } catch (error) {
      console.error("Error converting quotation:", error)
      alert("Error converting quotation to sale")
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary" as const, color: "bg-yellow-100 text-yellow-800" },
      accepted: { label: "Accepted", variant: "default" as const, color: "bg-green-100 text-green-800" },
      rejected: { label: "Rejected", variant: "destructive" as const, color: "bg-red-100 text-red-800" },
      converted: { label: "Converted", variant: "outline" as const, color: "bg-blue-100 text-blue-800" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false
    return new Date(validUntil) < new Date()
  }

  const calculateTaxAmount = () => {
    if (!quotation) return 0
    return (quotation.subTotal * quotation.taxRate) / 100
  }

  if (loading) return <Loading />

  if (!quotation) {
    return (
      <div className="p-6 text-center">
        <Quote className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Quotation not found</h3>
        <p className="text-muted-foreground mb-4">The quotation you're looking for doesn't exist.</p>
        <Link href={`${endPoint}/quotations/list`}>
          <Button>Back to Quotations</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 print:hidden">
        <SidebarTrigger />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`${endPoint}/dashboard`}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`${endPoint}/quotations/list`}>Quotations</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{quotation.quotationNo}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Quotation {quotation.quotationNo}</h1>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge(quotation.status)}
            {isExpired(quotation.validUntil) && (
              <Badge variant="destructive">Expired</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
         
          {quotation.status !== "converted" && (
            <>
              <Link href={`${endPoint}/quotations/${quotation.quotationNo}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button onClick={() => setConvertDialogOpen(true)}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Convert to Sale
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Quotation Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="font-semibold">{quotation.selectedCustomer.name}</div>
              <div className="text-sm text-muted-foreground">{quotation.selectedCustomer.type}</div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4" />
              {quotation.selectedCustomer.phone}
            </div>
            {quotation.selectedCustomer.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4" />
                {quotation.selectedCustomer.email}
              </div>
            )}
            {quotation.selectedCustomer.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                {quotation.selectedCustomer.address}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Quote className="h-5 w-5" />
              Quotation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Quotation No:</span>
              <span className="text-sm">{quotation.quotationNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Date Created:</span>
              <span className="text-sm">{new Date(quotation.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Valid Until:</span>
              <span className="text-sm">
                {quotation.validUntil 
                  ? new Date(quotation.validUntil).toLocaleDateString()
                  : "No expiry"
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Status:</span>
              {getStatusBadge(quotation.status)}
            </div>
            {quotation.convertedToSaleId && (
              <div className="flex justify-between">
                <span className="text-sm font-medium">Converted to Sale:</span>
                <Link href={`${endPoint}/sales/${quotation.convertedToSaleId}`}>
                  <Button variant="link" className="h-auto p-0 text-sm">
                    {quotation.convertedToSaleId}
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Company Header for Print */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold">{quotation.warehouses.name}</h1>
        <p className="text-sm">{quotation.warehouses.address}</p>
        <p className="text-sm">Phone: {quotation.warehouses.phone} | Email: {quotation.warehouses.email}</p>
        <h2 className="text-xl font-semibold mt-4">QUOTATION</h2>
        <p className="text-sm">Quotation No: {quotation.quotationNo}</p>
      </div>

      {/* Quotation Items */}
      <Card>
        <CardHeader>
          <CardTitle>Quotation Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Price Type</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotation.quotationItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.productName}</div>
                      {item.product?.barcode && (
                        <div className="text-sm text-muted-foreground">
                          Code: {item.product.barcode}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {item.priceType}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(item.selectedPrice)}</TableCell>
                  <TableCell>
                    {item.quantity} {item.product?.unit || 'pcs'}
                  </TableCell>
                  <TableCell>{formatCurrency(item.discount)}</TableCell>
                  <TableCell>{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quotation Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {quotation.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{quotation.notes}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(quotation.subTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({quotation.taxRate}%):</span>
              <span>{formatCurrency(calculateTaxAmount())}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Grand Total:</span>
              <span>{formatCurrency(quotation.grandTotal)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Convert to Sale Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Sale</DialogTitle>
            <DialogDescription>
              Are you sure you want to convert this quotation to a sale? This will create a new sales invoice and update product quantities.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span>Total Amount:</span>
                <span className="font-semibold">{formatCurrency(quotation.grandTotal)}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The full amount will be marked as paid. You can adjust payment details after conversion.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConvertToSale}>
                Convert to Sale
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}