"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Truck, Plus, Trash2, Calculator, Check, Printer } from "lucide-react"

// Sample data
const suppliers = [
  {
    id: "SUP-001",
    name: "Tech Distributors Inc",
    email: "sales@techdist.com",
    phone: "+1234567892",
    address: "123 Tech Street, Silicon Valley",
  },
  {
    id: "SUP-002",
    name: "Electronics Supply Co",
    email: "orders@elecsupply.com",
    phone: "+1234567893",
    address: "456 Electronics Ave, Tech City",
  },
  {
    id: "SUP-003",
    name: "Mobile Solutions Ltd",
    email: "info@mobilesol.com",
    phone: "+1234567894",
    address: "789 Mobile Blvd, Phone Town",
  },
  {
    id: "SUP-004",
    name: "Computer World",
    email: "sales@compworld.com",
    phone: "+1234567895",
    address: "321 Computer St, Hardware City",
  },
  {
    id: "SUP-005",
    name: "Audio Plus",
    email: "contact@audioplus.com",
    phone: "+1234567896",
    address: "654 Audio Lane, Sound City",
  },
]

const warehouses = [
  { id: "WH-001", name: "Main Warehouse", code: "MAIN", address: "100 Storage St, Warehouse District" },
  { id: "WH-002", name: "Branch Warehouse", code: "BRANCH", address: "200 Branch Ave, Secondary Location" },
  { id: "WH-003", name: "Storage Facility", code: "STORAGE", address: "300 Storage Rd, Remote Area" },
]

const products = [
  {
    id: "PRD-001",
    name: "iPhone 15 Pro",
    code: "IPH15PRO",
    costPrice: 750.0,
    wholesalePrice: 850.0,
    retailPrice: 999.0,
    stock: 25,
  },
  {
    id: "PRD-002",
    name: "Samsung Galaxy S24",
    code: "SGS24",
    costPrice: 650.0,
    wholesalePrice: 750.0,
    retailPrice: 899.0,
    stock: 15,
  },
  {
    id: "PRD-003",
    name: "MacBook Air M3",
    code: "MBAM3",
    costPrice: 1000.0,
    wholesalePrice: 1150.0,
    retailPrice: 1299.0,
    stock: 8,
  },
  {
    id: "PRD-004",
    name: "iPad Pro 12.9",
    code: "IPADPRO129",
    costPrice: 850.0,
    wholesalePrice: 950.0,
    retailPrice: 1099.0,
    stock: 3,
  },
  {
    id: "PRD-005",
    name: "AirPods Pro",
    code: "AIRPODSPRO",
    costPrice: 180.0,
    wholesalePrice: 220.0,
    retailPrice: 249.0,
    stock: 0,
  },
  {
    id: "PRD-006",
    name: "Dell XPS 13",
    code: "DELLXPS13",
    costPrice: 900.0,
    wholesalePrice: 1000.0,
    retailPrice: 1199.0,
    stock: 12,
  },
  {
    id: "PRD-007",
    name: "Sony WH-1000XM5",
    code: "SONYWH1000",
    costPrice: 280.0,
    wholesalePrice: 320.0,
    retailPrice: 399.0,
    stock: 18,
  },
]

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

export default function AddPurchasePage() {
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [selectedWarehouse, setSelectedWarehouse] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [discount, setDiscount] = useState(0)
  const [taxRate, setTaxRate] = useState(10)
  const [shipping, setShipping] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [status, setStatus] = useState<"ordered" | "received" | "pending">("ordered")
  const [notes, setNotes] = useState("")
  const [referenceNo, setReferenceNo] = useState(
    `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
  )
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdPurchase, setCreatedPurchase] = useState<PurchaseData | null>(null)

  const generateInvoiceNumber = () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    return `INV-${timestamp}-${random}`
  }

  const addProductToPurchase = () => {
    if (!selectedProduct) return

    const product = products.find((p) => p.id === selectedProduct)
    if (!product) return

    const itemTotal = product.costPrice * quantity - discount
    const newItem: PurchaseItem = {
      id: `ITEM-${Date.now()}`,
      invoiceNumber: generateInvoiceNumber(),
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      costPrice: product.costPrice,
      quantity,
      discount,
      total: itemTotal,
    }

    setPurchaseItems([...purchaseItems, newItem])
    setSelectedProduct("")
    setQuantity(1)
    setDiscount(0)
  }

  const removeItem = (itemId: string) => {
    setPurchaseItems(purchaseItems.filter((item) => item.id !== itemId))
  }

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    setPurchaseItems(
      purchaseItems.map((item) => {
        if (item.id === itemId) {
          const newTotal = item.costPrice * newQuantity - item.discount
          return { ...item, quantity: newQuantity, total: newTotal }
        }
        return item
      }),
    )
  }

  const updateItemDiscount = (itemId: string, newDiscount: number) => {
    setPurchaseItems(
      purchaseItems.map((item) => {
        if (item.id === itemId) {
          const newTotal = item.costPrice * item.quantity - newDiscount
          return { ...item, discount: newDiscount, total: newTotal }
        }
        return item
      }),
    )
  }

  const subtotal = purchaseItems.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = (subtotal * taxRate) / 100
  const grandTotal = subtotal + taxAmount + shipping

  const getPaymentStatus = () => {
    if (paidAmount === 0) return "pending"
    if (paidAmount >= grandTotal) return "paid"
    return "partial"
  }

  const handleSubmit = () => {
    if (purchaseItems.length === 0 || !selectedSupplier || !selectedWarehouse) return

    const supplier = suppliers.find((s) => s.id === selectedSupplier)
    const warehouse = warehouses.find((w) => w.id === selectedWarehouse)

    const purchaseData: PurchaseData = {
      id: `PUR-${Date.now()}`,
      invoiceNumber: generateInvoiceNumber(),
      referenceNo,
      date: new Date().toISOString().split("T")[0],
      supplierId: selectedSupplier,
      supplierName: supplier?.name || "",
      warehouseId: selectedWarehouse,
      warehouseName: warehouse?.name || "",
      items: purchaseItems,
      subtotal,
      taxRate,
      taxAmount,
      shipping,
      grandTotal,
      paidAmount,
      status,
      paymentStatus: getPaymentStatus(),
      notes,
      createdAt: new Date().toISOString(),
    }

    // Save to localStorage (replace with API call)
    //console.log(purchaseData)
    

    setCreatedPurchase(purchaseData)
    setShowSuccessDialog(true)

    // Reset form
    setPurchaseItems([])
    setSelectedSupplier("")
    setSelectedWarehouse("")
    setPaidAmount(0)
    setNotes("")
    setReferenceNo(`PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`)
  }

  const handlePrintReceipt = () => {
    if (!createdPurchase) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const supplier = suppliers.find((s) => s.id === createdPurchase.supplierId)
    const warehouse = warehouses.find((w) => w.id === createdPurchase.warehouseId)

    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Order - ${createdPurchase.invoiceNumber}</title>
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
            <h2>Invoice: ${createdPurchase.invoiceNumber}</h2>
            <p>Reference: ${createdPurchase.referenceNo}</p>
            <p>Date: ${new Date(createdPurchase.date).toLocaleDateString()}</p>
          </div>
          
          <div class="details">
            <h3>Supplier Information:</h3>
            <p><strong>${supplier?.name}</strong></p>
            <p>${supplier?.email}</p>
            <p>${supplier?.phone}</p>
            <p>${supplier?.address}</p>
            
            <h3>Warehouse:</h3>
            <p><strong>${warehouse?.name}</strong></p>
            <p>${warehouse?.address}</p>
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
              ${createdPurchase.items
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
              <span>$${createdPurchase.subtotal.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Tax (${createdPurchase.taxRate}%):</span>
              <span>$${createdPurchase.taxAmount.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Shipping:</span>
              <span>$${createdPurchase.shipping.toFixed(2)}</span>
            </div>
            <div class="total-row grand-total">
              <span>Grand Total:</span>
              <span>$${createdPurchase.grandTotal.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Paid Amount:</span>
              <span>$${createdPurchase.paidAmount.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Balance:</span>
              <span>$${(createdPurchase.grandTotal - createdPurchase.paidAmount).toFixed(2)}</span>
            </div>
          </div>

          ${
            createdPurchase.notes
              ? `
            <div style="margin-top: 30px;">
              <h3>Notes:</h3>
              <p>${createdPurchase.notes}</p>
            </div>
          `
              : ""
          }

          <div style="margin-top: 50px; text-align: center; color: #666;">
            <p>Status: ${createdPurchase.status.toUpperCase()} | Payment: ${createdPurchase.paymentStatus.toUpperCase()}</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.print()
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
                  <BreadcrumbPage>Add Purchase</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="h-5 w-5 text-blue-600" />
            <h1 className="text-2xl font-semibold text-blue-600">Add New Purchase</h1>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Purchase Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Purchase Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="reference">Reference Number *</Label>
                      <Input
                        id="reference"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        placeholder="PO-2024-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supplier">Supplier *</Label>
                      <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="warehouse">Warehouse *</Label>
                      <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchase-date">Purchase Date *</Label>
                    <Input id="purchase-date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                  </div>
                </CardContent>
              </Card>

              {/* Add Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Add Products</CardTitle>
                  <CardDescription>Each product will get a unique invoice number</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-5">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="product">Product</Label>
                      <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - ${product.costPrice} (Stock: {product.stock})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discount">Discount ($)</Label>
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        value={discount}
                        onChange={(e) => setDiscount(Number.parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={addProductToPurchase} className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Purchase Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Items</CardTitle>
                  <CardDescription>{purchaseItems.length} item(s) added to this purchase</CardDescription>
                </CardHeader>
                <CardContent>
                  {purchaseItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Truck className="mx-auto h-12 w-12 mb-4" />
                      <p>No items added yet. Select products above to add them to the purchase.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Discount</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-xs">{item.invoiceNumber}</TableCell>
                            <TableCell className="font-medium">{item.productName}</TableCell>
                            <TableCell>{item.productCode}</TableCell>
                            <TableCell>${item.costPrice.toFixed(2)}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.id, Number.parseInt(e.target.value) || 1)}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                value={item.discount}
                                onChange={(e) => updateItemDiscount(item.id, Number.parseFloat(e.target.value) || 0)}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>${item.total.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Summary & Details */}
            <div className="space-y-6">
              {/* Purchase Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Purchase Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Tax ({taxRate}%):</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Shipping:</span>
                      <span>${shipping.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Grand Total:</span>
                      <span>${grandTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Paid Amount:</span>
                      <span>${paidAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-orange-600">
                      <span>Balance:</span>
                      <span>${(grandTotal - paidAmount).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                      <Input
                        id="tax-rate"
                        type="number"
                        min="0"
                        max="100"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number.parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipping">Shipping Cost</Label>
                      <Input
                        id="shipping"
                        type="number"
                        min="0"
                        value={shipping}
                        onChange={(e) => setShipping(Number.parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paid-amount">Paid Amount</Label>
                      <Input
                        id="paid-amount"
                        type="number"
                        min="0"
                        max={grandTotal}
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(Number.parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Purchase Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={status}
                      onValueChange={(value: "ordered" | "received" | "pending") => setStatus(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ordered">Ordered</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <div className="p-2 bg-muted rounded-md">
                      <span className="font-medium">{getPaymentStatus().toUpperCase()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Enter any additional notes or comments..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-8">
            <Button variant="outline">Save as Draft</Button>
            <Button
              onClick={handleSubmit}
              disabled={purchaseItems.length === 0 || !selectedSupplier || !selectedWarehouse}
            >
              <Check className="mr-2 h-4 w-4" />
              Create Purchase Order
            </Button>
          </div>
        </div>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Purchase Order Created Successfully!
              </DialogTitle>
              <DialogDescription>
                Your purchase order has been created with invoice number:{" "}
                <strong>{createdPurchase?.invoiceNumber}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowSuccessDialog(false)}>
                Close
              </Button>
              <Button onClick={handlePrintReceipt}>
                <Printer className="mr-2 h-4 w-4" />
                Print Purchase Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
  )
}
