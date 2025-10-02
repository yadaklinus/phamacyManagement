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
import { Textarea } from "@/components/ui/textarea"
import {
  ShoppingCart,
  Plus,
  Trash2,
  Calculator,
  Printer,
  Check,
  ChevronsUpDown,
  CheckCircle,
  X,
  CreditCard,
  Banknote,
  Smartphone,
} from "lucide-react"
import { usePrintReceipt } from "@/hooks/use-print-receipt"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn, formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import { Loading } from "@/components/loading"
import fetchWareHouseData from "@/hooks/fetch-invidual-data"
import axios from "axios"
import { SystemStatus } from "@/components/system-status"
import { useSession } from "next-auth/react"

// Sample data with updated pricing structure matching Prisma schema


interface SaleItem {
  id: string
  productId: string
  productName: string
  productBarcode: string
  cost: number
  wholeSalePrice: number
  retailPrice: number
  selectedPrice: number
  priceType: "wholesale" | "retail"
  quantity: number
  discount: number
  total: number
  unit: string
  taxRate: number
  limit:number
}

interface PaymentMethod {
  id: string
  method: "cash" | "card" | "bank_transfer" | "check" | "mobile_money"
  amount: number
  reference?: string
  notes?: string
}

interface CompletedSale {
  saleId: string
  invoiceNo: string
  date: string
  time: string
  customer: {
    id: string
    name: string
    email: string
    phone: string
    type: string
  }
  items: Array<{
    productId: string
    productName: string
    productCode: string
    costPrice: number
    salePrice: number
    priceType: "wholesale" | "retail"
    quantity: number
    discount: number
    total: number
    profit: number
  }>
  subtotal: number
  totalDiscount: number
  taxRate: number
  taxAmount: number
  grandTotal: number
  paymentMethods: PaymentMethod[]
  totalPaid: number
  balance: number
  notes: string
  cashier: string
  warehouseId:string
}

export default function AddSalePage() {
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [selectedProductId, setSelectedProductId] = useState("")
  const [quantity, setQuantity] = useState<any>("")
  const [discount, setDiscount] = useState(0)
  const [priceType, setPriceType] = useState<"wholesale" | "retail">("retail")
  const [taxRate, setTaxRate] = useState(0)
  const [notes, setNotes] = useState("")
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [endPoint, setEndPoint] = useState("")

  
  // Multiple payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<
    "cash" | "card" | "bank_transfer" | "check" | "mobile_money"
  >("cash")
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<any>("")
  const [currentPaymentReference, setCurrentPaymentReference] = useState("")
  const [currentPaymentNotes, setCurrentPaymentNotes] = useState("")
  const {data:session} = useSession() 

  const router = useRouter()
  const { printReceipt } = usePrintReceipt()
  const warehouseId = getWareHouseId()

        
        const {data:products,loading,error} = fetchWareHouseData("/api/product/list",{warehouseId})
        const {data:customers,loading:loadingCustomers,error:errorCustomers} = fetchWareHouseData("/api/customer/list",{warehouseId})

        useEffect(()=>{
          setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
        },[session,warehouseId])


         if(!products && !customers) return (
          <Loading/>
         )

         
         console.log(customers)
  const selectedProduct = products?.find((p:any) => p.id === selectedProductId)
  const selectedCustomerData = customers?.find((c:any) => c.id === selectedCustomer)

  // Auto-set price type based on customer type
  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomer(customerId)
    const customer = customers?.find((c:any) => c.id === customerId)
    if (customer) {
      setPriceType(customer.type as "wholesale" | "retail")
    }
  }

  const getCurrentPrice = (product: (typeof products)[0], type: "wholesale" | "retail") => {
    return type === "wholesale" ? product.wholeSalePrice : product.retailPrice
  }

  const addProductToSale = () => {
    if (!selectedProduct) return

    const selectedPrice = getCurrentPrice(selectedProduct, priceType)

    // Check if product already exists in sale with same price type
    const existingItemIndex = saleItems?.findIndex(
      (item) => item.productId === selectedProduct.id && item.priceType === priceType,
    )

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...saleItems]
      const existingItem = updatedItems[existingItemIndex]
      existingItem.quantity += quantity
      existingItem.discount += discount
      existingItem.total = existingItem.selectedPrice * existingItem.quantity - existingItem.discount
      setSaleItems(updatedItems)
    } else {
      // Add new item
      const itemTotal = selectedPrice * quantity - discount
      const newItem: SaleItem = {
        id: `ITEM-${Date.now()}`,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productBarcode: selectedProduct.barcode,
        cost: selectedProduct.cost,
        wholeSalePrice: selectedProduct.wholeSalePrice,
        retailPrice: selectedProduct.retailPrice,
        selectedPrice,
        priceType,
        quantity,
        discount,
        total: itemTotal,
        unit: selectedProduct.unit,
        taxRate: selectedProduct.taxRate,
        limit:selectedProduct.quantity
      }
      setSaleItems([...saleItems, newItem])
    }

    // Reset form
    setSelectedProductId("")
    setQuantity("")
    setDiscount(0)
  }

  const removeItem = (itemId: string) => {
    setSaleItems(saleItems?.filter((item) => item.id !== itemId))
  }

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    setSaleItems(
      saleItems?.map((item) => {
        if (item.id === itemId) {
          const newTotal = item.selectedPrice * newQuantity - item.discount
          return { ...item, quantity: newQuantity, total: newTotal }
        }
        return item
      }),
    )
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: "text-red-600", text: "Out of Stock" }
    if (stock <= 5) return { color: "text-yellow-600", text: "Low Stock" }
    return { color: "text-green-600", text: "In Stock" }
  }

  // Payment methods functions
  const addPaymentMethod = () => {
    const amount = Number.parseFloat(currentPaymentAmount)
    if (!amount || amount <= 0) {
      alert("Please enter a valid payment amount")
      return
    }

    const totalPaid = paymentMethods?.reduce((sum, pm) => sum + pm.amount, 0)
    const remaining = grandTotal - totalPaid

    if (amount > remaining) {
      alert(`Payment amount cannot exceed remaining balance of $${remaining.toFixed(2)}`)
      return
    }

    const newPayment: PaymentMethod = {
      id: `PAY-${Date.now()}`,
      method: currentPaymentMethod,
      amount,
      reference: currentPaymentReference || undefined,
      notes: currentPaymentNotes || undefined,
    }

    setPaymentMethods([...paymentMethods, newPayment])

    // Reset payment form
    setCurrentPaymentAmount("")
    setCurrentPaymentReference("")
    setCurrentPaymentNotes("")
  }

  const removePaymentMethod = (paymentId: string) => {
    setPaymentMethods(paymentMethods.filter((pm) => pm.id !== paymentId))
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <Banknote className="h-4 w-4" />
      case "card":
        return <CreditCard className="h-4 w-4" />
      case "bank_transfer":
        return <Smartphone className="h-4 w-4" />
      case "mobile_money":
        return <Smartphone className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return "Cash"
      case "card":
        return "Card"
      case "bank_transfer":
        return "Bank Transfer"
      case "check":
        return "Check"
      case "mobile_money":
        return "Mobile Money"
      default:
        return method
    }
  }

  const subtotal = saleItems?.reduce((sum, item) => sum + item.total, 0)
  const totalDiscount = saleItems?.reduce((sum, item) => sum + item.discount, 0)
  const taxAmount = (subtotal * taxRate) / 100
  const grandTotal = subtotal + taxAmount
  const totalPaid = paymentMethods.reduce((sum, pm) => sum + pm.amount, 0)
  const balance = grandTotal - totalPaid

  // Form submission handler

  console.log(saleItems)
  const handleFormSubmit = async () => {
    if (saleItems?.length === 0 || !selectedCustomer) {
      alert("Please complete all required fields")
      return
    }

    if (paymentMethods.length === 0) {
      alert("Please add at least one payment method")
      return
    }

    setIsSubmitting(true)

    try {
      const currentDate = new Date()
      const invoiceNo = `INV-${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`
      const saleId = `SALE-${Date.now()}`

      // Prepare sale data with multiple payment methods
      const saleData: CompletedSale = {
        saleId,
        invoiceNo,
        date: currentDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        time: currentDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
        customer: {
          id: selectedCustomerData?.id || "",
          name: selectedCustomerData?.name || "Walk-in Customer",
          email: selectedCustomerData?.email || "",
          phone: selectedCustomerData?.phone || "",
          type: selectedCustomerData?.type || "retail",
        },
        items: saleItems?.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productCode: item.productBarcode,
          costPrice: item.cost,
          salePrice: item.selectedPrice,
          priceType: item.priceType,
          quantity: item.quantity,
          discount: item.discount,
          total: item.total,
          profit: item.total - item.cost * item.quantity,
        })),
        subtotal,
        totalDiscount,
        taxRate,
        taxAmount,
        grandTotal,
        paymentMethods: [...paymentMethods],
        totalPaid,
        balance,
        notes,
        cashier: "Admin User",
        warehouseId
      }

      // Simulate API call to save sale
      console.log("Saving sale data:", saleData)

      // Simulate API delay
      await axios.post("/api/sale",saleData)

      // Update product stock (in real app, this would be handled by the API)
      saleItems?.forEach((item) => {
        const product = products?.find((p:any) => p.id === item.productId)
        if (product) {
          product.quantity -= item.quantity
        }
      })

      // Set completed sale data and show success dialog
      setCompletedSale(saleData)
      setShowSuccessDialog(true)

      // Reset form
      setSaleItems([])
      setSelectedCustomer("")
      setPaymentMethods([])
      setNotes("")
      setTaxRate(10)
    } catch (error) {
      console.error("Error saving sale:", error)
      alert("Error completing sale. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrintReceipt = (paperWidth: "57mm" | "80mm" | "A4") => {
    if (!completedSale) return

    const receiptData = {
      invoiceNo: completedSale.invoiceNo,
      date: completedSale.date,
      time: completedSale.time,
      customer: completedSale.customer.name,
      cashier: completedSale.cashier,
      items: completedSale.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.salePrice,
        total: item.total,
      })),
      subtotal: completedSale.subtotal,
      discount: completedSale.totalDiscount,
      tax: completedSale.taxAmount,
      total: completedSale.grandTotal,
      paymentMethods: completedSale.paymentMethods,
      totalPaid: completedSale.totalPaid,
      balance: completedSale.balance,
    }

    printReceipt(receiptData, paperWidth)
  }

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false)
    setCompletedSale(null)
  }

  const handleNewSale = () => {
    handleCloseSuccessDialog()
  }

  const handleViewSales = () => {
    handleCloseSuccessDialog()
    router.push(`${endPoint}/sales/list`)
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
                  <BreadcrumbLink href={`${endPoint}/sales/list`}>Sales</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Add Sale</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <SystemStatus/>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold text-blue-600">New Sale</h1>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Sale Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedCustomer} onValueChange={handleCustomerChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map((customer:any) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center gap-2">
                            {customer.name}
                            <Badge variant={customer.type === "wholesale" ? "default" : "secondary"}>
                              {customer.type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCustomerData && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Default pricing: <span className="font-medium capitalize">{selectedCustomerData.type}</span>
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Product Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Add Product</CardTitle>
                  <CardDescription>Select a product to add to the sale</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Product Combobox */}
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between bg-transparent"
                        >
                          {selectedProductId
                            ? products?.find((product:any) => product.id === selectedProductId)?.name
                            : "Select product..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search products?..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No product found.</CommandEmpty>
                            <CommandGroup>
                              {products?.map((product:any) => {
                                const stockStatus = getStockStatus(product.quantity)
                                return (
                                  <CommandItem
                                    key={product.id}
                                    value={`${product.name} ${product.barcode} ${product.unit}`} // include searchable fields here
                                    onSelect={(currentValue) => {
                                      const selected = products.find((p:any) =>
                                        `${p.name} ${p.barcode} ${p.unit}` === currentValue
                                      )?.id
                                      setSelectedProductId(selected || "")
                                      setOpen(false)
                                    }}
                                    className="flex flex-col items-start gap-1 p-3"
                                  >
                                    {/* Render actual searchable text here so the filter works */}
                                    <div className="sr-only">{`${product.name} ${product.barcode} ${product.unit}`}</div>

                                    <div className="flex items-center justify-between w-full">
                                      <span className="font-medium">{product.name}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                          W: {formatCurrency(product.wholeSalePrice)}
                                        </span>
                                        <span className="font-semibold">R: {formatCurrency(product.retailPrice)}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                                      <span>
                                        {product.barcode} • {product.unit}
                                      </span>
                                      <span className={stockStatus.color}>{product.quantity} in stock</span>
                                    </div>
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        selectedProductId === product.id ? "opacity-100" : "opacity-0",
                                      )}
                                    />
                                  </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Price Type Selection */}
                  {selectedProduct && (
                    <div className="space-y-2">
                      <Label>Price Type</Label>
                      <Select value={priceType} onValueChange={(value: "wholesale" | "retail") => setPriceType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wholesale">
                            Wholesale - {formatCurrency(selectedProduct.wholeSalePrice.toFixed(2))}
                          </SelectItem>
                          <SelectItem value="retail">Retail - {formatCurrency(selectedProduct.retailPrice.toFixed(2))}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Quantity and Discount */}
                  {selectedProduct && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          
                          // max={selectedProduct.quantity}
                          value={quantity}
                          onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discount">Discount </Label>
                        <Input
                          id="discount"
                          type="number"
                          min="0"
                          value={discount}
                          onChange={(e) => setDiscount(Number.parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={addProductToSale}
                          className="w-full"
                          // disabled={selectedProduct.quantity === 0 || quantity > selectedProduct.quantity}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Product Details */}
                  {selectedProduct && (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Cost: </span> {formatCurrency(selectedProduct.cost)}
                        </div>
                        <div>
                          <span className="font-medium">Stock: </span> {selectedProduct.quantity} {selectedProduct.unit}
                        </div>
                        <div>
                          <span className="font-medium">Selected Price: </span> 
                          {formatCurrency(getCurrentPrice(selectedProduct, priceType))}
                        </div>
                        <div>
                          <span className="font-medium">Total: </span> 
                          {formatCurrency((getCurrentPrice(selectedProduct, priceType) * quantity - discount).toFixed(2))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sale Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Items ({saleItems?.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {saleItems?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="mx-auto h-12 w-12 mb-4" />
                      <p>No items added yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Price Type</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {saleItems?.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.productName}</div>
                                <div className="text-sm text-muted-foreground">{item.productBarcode}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.priceType === "wholesale" ? "default" : "secondary"}>
                                {item.priceType}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(item.selectedPrice.toFixed(2))}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  // max={item.limit}
                                 
                                  onChange={(e) => updateItemQuantity(item.id, Number.parseInt(e.target.value) || 1)}
                                  className="w-16"
                                />
                                <span className="text-xs text-muted-foreground">{item.unit}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(item.total)}</TableCell>
                            <TableCell>
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

            {/* Right Column - Summary & Payment */}
            <div className="space-y-6">
              {/* Sale Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(subtotal.toFixed(2))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({taxRate}%):</span>
                      <span>{formatCurrency(taxAmount.toFixed(2))}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span>{formatCurrency(grandTotal.toFixed(2))}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Paid:</span>
                      <span>{formatCurrency(totalPaid.toFixed(2))}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Balance:</span>
                      <span className={balance > 0 ? "text-red-600" : "text-green-600"}>
                        {formatCurrency(Math.abs(balance).toFixed(2))}
                      </span>
                    </div>
                  </div>

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
                </CardContent>
              </Card>

              {/* Multiple Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Add multiple payment methods for this sale</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Payment Form */}
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Select
                        value={currentPaymentMethod}
                        onValueChange={(value: any) => setCurrentPaymentMethod(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={currentPaymentAmount}
                          onChange={(e) => setCurrentPaymentAmount(e.target.value)}
                        />
                        <Button onClick={()=>setCurrentPaymentAmount(grandTotal)}>All</Button>&nbsp;
                        <Button onClick={()=>setCurrentPaymentAmount(grandTotal/2)}>Half</Button>
                      </div>
                      <div className="space-y-2">
                        <Label>Reference</Label>
                        <Input
                          placeholder="Optional"
                          value={currentPaymentReference}
                          onChange={(e) => setCurrentPaymentReference(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Input
                        placeholder="Optional notes"
                        value={currentPaymentNotes}
                        onChange={(e) => setCurrentPaymentNotes(e.target.value)}
                      />
                    </div>

                    <Button onClick={addPaymentMethod} className="w-full" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Payment
                    </Button>
                  </div>

                  {/* Payment Methods List */}
                  {paymentMethods.length > 0 && (
                    <div className="space-y-2">
                      <Label>Added Payments</Label>
                      <div className="space-y-2">
                        {paymentMethods.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                              {getPaymentMethodIcon(payment.method)}
                              <div>
                                <div className="font-medium">
                                  {getPaymentMethodLabel(payment.method)} - {formatCurrency(payment.amount)}
                                </div>
                                {payment.reference && (
                                  <div className="text-sm text-muted-foreground">Ref: {payment.reference}</div>
                                )}
                                {payment.notes && <div className="text-sm text-muted-foreground">{payment.notes}</div>}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePaymentMethod(payment.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Remaining Balance Alert */}
                  {balance > 0 && paymentMethods.length > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Remaining Balance:</strong> ${balance.toFixed(2)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Additional notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">

            <Button
              onClick={handleFormSubmit}
              disabled={saleItems?.length === 0 || !selectedCustomer || paymentMethods.length === 0 || isSubmitting}
              className="min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Complete Sale
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Sale Completed Successfully!
              </DialogTitle>
              <DialogDescription>
                {completedSale && (
                  <>
                    Invoice #{completedSale.invoiceNo} has been created for {completedSale.customer.name}.
                    <br />
                    Total: ${completedSale.grandTotal.toFixed(2)}
                    <br />
                    Paid: ${completedSale.totalPaid.toFixed(2)} via {completedSale.paymentMethods.length} method(s)
                    {completedSale.balance > 0 && (
                      <>
                        <br />
                        Balance: ${completedSale.balance.toFixed(2)}
                      </>
                    )}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-4">
              <div className="text-sm text-muted-foreground">Would you like to print a receipt?</div>

              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="flex-1">
                      <Printer className="mr-2 h-4 w-4" />
                      Print Receipt
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handlePrintReceipt("57mm")}>Print 57mm (2¼")</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePrintReceipt("80mm")}>Print 80mm (3⅛")</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePrintReceipt("A4")}>Print A4 (Full Page)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex gap-2 mt-2">
                <Button variant="outline" onClick={handleNewSale} className="flex-1 bg-transparent">
                  New Sale
                </Button>
                <Button variant="outline" onClick={handleViewSales} className="flex-1 bg-transparent">
                  View Sales
                </Button>
              </div>

              <Button variant="ghost" onClick={handleCloseSuccessDialog} className="mt-2">
                <X className="mr-2 h-4 w-4" />
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
     </>
  )
}