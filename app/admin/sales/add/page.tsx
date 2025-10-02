"use client"

import { useEffect, useRef, useState } from "react"
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
import { Wallet } from "lucide-react"
import { useMemo } from "react"
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
  priceType: "wholesale" | "retail" | "cost"
  quantity: number
  discount: number
  total: number
  unit: string
  taxRate: number
  limit:number
}

interface PaymentMethod {
  id: string
  method: "cash" | "card" | "bank_transfer" | "check" | "mobile_money" | "balance"
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
    priceType: "wholesale" | "retail" | "cost"
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
  const [priceType, setPriceType] = useState<"wholesale" | "retail" | "cost">("retail")
  const [taxRate, setTaxRate] = useState(0)
  const [notes, setNotes] = useState("")
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [endPoint, setEndPoint] = useState("")
  const [customerBalance, setCustomerBalance] = useState(0)
const [useBalancePayment, setUseBalancePayment] = useState(false)
const [balancePaymentAmount, setBalancePaymentAmount] = useState("")
const [searchQuery, setSearchQuery] = useState("")
const [isSearching, setIsSearching] = useState(false)
  
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

  const quantityInputRef = useRef<HTMLInputElement>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const productSearchRef = useRef<HTMLButtonElement>(null)
  const paymentAmountRef = useRef<HTMLInputElement>(null)
  const finalizeSaleButtonRef = useRef<HTMLButtonElement>(null)
  const allButtonRef = useRef<HTMLButtonElement>(null)
  const addPaymentButtonRef = useRef<HTMLButtonElement>(null)
  const printButtonRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "n") {
        event.preventDefault()
        router.push(`/warehouse/${warehouseId}/admin/sales/add`)
      }
      if (event.ctrlKey && event.key === "s") {
        event.preventDefault()
        setQuantity("")
        productSearchRef.current?.click()
      }
      if (event.ctrlKey && event.key === "p") {
        event.preventDefault()
        printButtonRef.current?.click()
      }
      if (event.ctrlKey && event.key === "f") {
        event.preventDefault()
        finalizeSaleButtonRef.current?.click()
      }
      if (event.ctrlKey && event.key === "d") {
        event.preventDefault()
        allButtonRef.current?.click()
        addPaymentButtonRef.current?.click()
      }
      if (event.ctrlKey && event.key === "c") {
        event.preventDefault()
        if (customers && customers.length > 0) {
          const currentIndex = customers.findIndex((c: any) => c.id === selectedCustomer)
          const nextIndex = (currentIndex + 1) % customers.length
          handleCustomerChange(customers[nextIndex].id)
        }
      }
      if (event.ctrlKey && event.key === "q") {
        event.preventDefault()
        setQuantity("")
        quantityInputRef.current?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [router, warehouseId])
        
        const {data:products,loading,error} = fetchWareHouseData("/api/product/list",{warehouseId})
        const {data:customers,loading:loadingCustomers,error:errorCustomers} = fetchWareHouseData("/api/customer/list",{warehouseId})

        const filteredProducts = useMemo(() => {
          if (!products) return []
          
          const query = searchQuery.toLowerCase().trim()
          if (query.length === 0) {
            // Show only first 50 products when no search query
            return products.slice(0, 50)
          }
          
          if (query.length < 2) {
            // Don't search until at least 2 characters
            return []
          }
          
          // Filter products based on search query
          const filtered = products.filter((product: any) => {
            return (
              product.name.toLowerCase().includes(query) ||
              product.barcode.toLowerCase().includes(query) ||
              product.unit.toLowerCase().includes(query)
            )
          })
          
          // Limit results to 100 for performance
          return filtered.slice(0, 100)
        }, [products, searchQuery])

        const handleSearchChange = (value: string) => {
          setSearchQuery(value)
          setIsSearching(true)
          
          // Clear searching state after a delay
          setTimeout(() => {
            setIsSearching(false)
          }, 300)
        }

       

        useEffect(()=>{
          setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
          if (customers && customers.length > 0) {
            const guestCustomer = customers.find(
              (c: any) => c.name?.toLowerCase().trim() === "guest"
            );
            if (guestCustomer) {
              setSelectedCustomer(guestCustomer.id);
            }
          }
        },[session,warehouseId,customers])


         if(!products && !customers) return (
          <Loading/>
         )

         
         console.log(customers)
      const selectedProduct = products?.find((p:any) => p.id === selectedProductId)
      const selectedCustomerData = customers?.find((c:any) => c.id === selectedCustomer)

  const fetchCustomerBalance = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customer/balance/${customerId}`)
      if (response.ok) {
        const balanceData = await response.json()
        setCustomerBalance(balanceData.balance || 0)
      } else {
        setCustomerBalance(0)
      }
    } catch (error) {
      console.error('Error fetching customer balance:', error)
      setCustomerBalance(0)
    }
  }


  // Auto-set price type based on customer type
  const handleCustomerChange = (customerId: string) => {
  setSelectedCustomer(customerId)
  const customer = customers?.find((c:any) => c.id === customerId)
  if (customer) {
    setPriceType(customer.type as "wholesale" | "retail" | "cost")
    fetchCustomerBalance(customerId) // Add this line
  }
  // Reset balance payment when customer changes
  setUseBalancePayment(false)
  setBalancePaymentAmount("")
}



  const getCurrentPrice = (product: (typeof products)[0], type: "wholesale" | "retail" | "cost") => {
    if(type === "wholesale"){
      return product.wholeSalePrice
    }else if(type === "retail"){
      return product.retailPrice
    }else{
      return product.cost
    }
    return type === "wholesale" ? product.wholeSalePrice : product.retailPrice
  }

  const addProductToSale = (isBarcode = false) => {
    if (!selectedProduct) return

    const currentQuantity = isBarcode ? 1 : quantity

    const selectedPrice = getCurrentPrice(selectedProduct, priceType)

    // Check if product already exists in sale with same price type
    const existingItemIndex = saleItems?.findIndex(
      (item) => item.productId === selectedProduct.id && item.priceType === priceType,
    )

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...saleItems]
      const existingItem = updatedItems[existingItemIndex]
      existingItem.quantity += currentQuantity
      existingItem.discount += discount
      existingItem.total = existingItem.selectedPrice * existingItem.quantity - existingItem.discount
      setSaleItems(updatedItems)
    } else {
      // Add new item
      const itemTotal = selectedPrice * currentQuantity - discount
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
        quantity: currentQuantity,
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

    setQuantity("")
        productSearchRef.current?.click()
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
      case "balance":
        return <Wallet className="h-4 w-4" />
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
      case "balance":
        return "Account Balance"
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
  
      // Check if there are balance payments
      const balancePayments = paymentMethods.filter(pm => pm.method === "balance")
      const totalBalanceUsed = balancePayments.reduce((sum, pm) => sum + pm.amount, 0)
      
      // Calculate remaining amount after balance payment
      const remainingAmount = grandTotal - totalBalanceUsed
      const otherPayments = paymentMethods.filter(pm => pm.method !== "balance")
      const otherPaymentsTotal = otherPayments.reduce((sum, pm) => sum + pm.amount, 0)
      
      // Calculate final balance (debt)
      const finalBalance = remainingAmount - otherPaymentsTotal
  
      // Prepare sale data
      const saleData = {
        items: saleItems?.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          costPrice: item.cost,
          salePrice: item.selectedPrice,
          priceType: item.priceType,
          quantity: item.quantity,
          discount: item.discount,
          total: item.total,
        })),
        invoiceNo,
        subtotal,
        totalDiscount,
        taxRate,
        taxAmount,
        grandTotal,
        paymentMethods: otherPayments, // Only non-balance payments go to the sale API
        amountPaid: otherPaymentsTotal + totalBalanceUsed,
        balance: finalBalance,
        notes,
        cashier: "Admin User",
        warehouseId,
        customer: {
          id: selectedCustomerData?.id || "",
          name: selectedCustomerData?.name || "Walk-in Customer",
        }
      }
  
      // First, create the sale
      const saleResponse = await axios.post("/api/sale", saleData)
  
      if (!saleResponse.data || saleResponse.status !== 200) {
        throw new Error("Failed to create sale")
      }
  
      // If there were balance payments, deduct from customer balance
      if (totalBalanceUsed > 0) {
        try {
          await fetch(`/api/customer/balance/${selectedCustomer}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount: totalBalanceUsed,
              description: `Purchase payment - Invoice ${invoiceNo}`,
              saleId: invoiceNo,
              warehouseId,
            }),
          })
        } catch (balanceError) {
          console.error("Error deducting balance:", balanceError)
          // Continue even if balance deduction fails - sale is already created
          alert("Sale completed but there was an issue updating the customer balance. Please check manually.")
        }
      }
  
      // Create completed sale data for display
      const completedSaleData: CompletedSale = {
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
        paymentMethods: [...paymentMethods], // Include all payment methods for receipt
        totalPaid: totalPaid,
        balance: finalBalance,
        notes,
        cashier: "Admin User",
        warehouseId
      }
  
      // Update local customer balance for UI
      if (totalBalanceUsed > 0) {
        setCustomerBalance(prev => prev - totalBalanceUsed)
      }
  
      // Set completed sale data and show success dialog
      setCompletedSale(completedSaleData)
      setShowSuccessDialog(true)
  
      // Reset form
      setSaleItems([])
      setSelectedCustomer("")
      setPaymentMethods([])
      setNotes("")
      setTaxRate(10)
      setCustomerBalance(0)
      setUseBalancePayment(false)
      setBalancePaymentAmount("")
      
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

  const addBalancePayment = async () => {
    if (!selectedCustomer || !useBalancePayment) return
  
    const balanceAmount = Math.min(
      parseFloat(balancePaymentAmount) || customerBalance,
      customerBalance,
      grandTotal - totalPaid
    )
  
    if (balanceAmount <= 0) {
      alert("Invalid balance payment amount")
      return
    }
  
    // Add balance as a payment method
    const balancePayment: PaymentMethod = {
      id: `BAL-${Date.now()}`,
      method: "balance" as any, // We'll need to extend the type
      amount: balanceAmount,
      reference: "Account Balance",
      notes: `Paid from account balance`,
    }
  
    setPaymentMethods([...paymentMethods, balancePayment])
    setUseBalancePayment(false)
    setBalancePaymentAmount("")
  }

  const handleViewSales = () => {
    handleCloseSuccessDialog()
    router.push(`${endPoint}/sales/list`)
  }
  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId)
    const product = products.find((p: any) => p.id === productId)
    if (product) {
      // Barcode scanner logic
      const isBarcodeScan = quantity === "" || quantity === 1
      if (isBarcodeScan) {
        setQuantity(1)
        addProductToSale(true)
      } else {
        quantityInputRef.current?.focus()
      }
    }
    setOpen(false)
    setSearchQuery("") // Clear search when product is selected
    setTimeout(() => quantityInputRef.current?.focus(), 0)
  }
  const updateItemDiscount = (itemId: string, newDiscount: number) => {
    setSaleItems(
      saleItems?.map((item) => {
        if (item.id === itemId) {
          const newTotal = item.selectedPrice * item.quantity - newDiscount
          return { ...item, discount: newDiscount, total: Math.max(0, newTotal) }
        }
        return item
      }),
    )
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
    {/* Optimized Product Combobox */}
    <div className="space-y-2">
      <Label>Product</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={productSearchRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between bg-transparent",
              selectedProductId && "bg-blue-50 border-blue-200 text-blue-900"
            )}
          >
            {selectedProductId ? (
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {products?.find((product: any) => product.id === selectedProductId)?.name}
                </span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Selected
                </Badge>
              </div>
            ) : (
              "Search products... (Type to search)"
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Type product name, barcode, or unit..." 
              className="h-9"
              value={searchQuery}
              onValueChange={handleSearchChange}
            />
            <CommandList className="max-h-[300px] overflow-auto">
              {filteredProducts.length === 0 ? (
                <CommandEmpty>
                  {searchQuery.length === 0 
                    ? "Start typing to search products..." 
                    : "No products found"}
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {searchQuery.length === 0 && (
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50">
                      Showing first 50 products - type to search all products
                    </div>
                  )}
                  {filteredProducts.map((product: any) => {
                    const stockStatus = getStockStatus(product.quantity)
                    const isSelected = selectedProductId === product.id
                    
                    return (
                      <CommandItem
                        key={product.id}
                        value={`${product.name} ${product.barcode} ${product.unit}`}
                        onSelect={() => handleProductSelect(product.id)}
                        className={cn(
                          "group flex flex-col items-start gap-1 p-3 cursor-pointer transition-colors",
                          "hover:bg-blue-600 hover:text-white",
                          "data-[selected=true]:bg-blue-600 data-[selected=true]:text-white",
                          "focus:bg-blue-600 focus:text-white",
                          "aria-selected:bg-blue-600 aria-selected:text-white",
                          isSelected && "bg-blue-50 border-l-4 border-blue-500"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-medium transition-colors",
                              isSelected && "text-blue-900"
                            )}>
                              {product.name}
                            </span>
                            {isSelected && (
                              <Badge variant="default" className="bg-blue-600">
                                Selected
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm transition-colors group-hover:text-blue-100">
                              W: {formatCurrency(product.wholeSalePrice)}
                            </span>
                            <span className="font-semibold transition-colors group-hover:text-white">
                              R: {formatCurrency(product.retailPrice)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between w-full text-sm transition-colors group-hover:text-blue-100">
                          <span>
                            {product.barcode} • {product.unit}
                          </span>
                          <span className={cn(
                            stockStatus.color,
                            "transition-colors group-hover:text-blue-100"
                          )}>
                            {product.quantity} in stock
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="absolute right-2 top-2 h-4 w-4 text-blue-600 transition-colors group-hover:text-white" />
                        )}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Quick stats when dropdown is closed */}
      {!open && products && (
        <div className="text-xs text-muted-foreground">
          {products.length} total products available
        </div>
      )}
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
                                ref={quantityInputRef}
                                max={selectedProduct.quantity}
                                value={quantity}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    addButtonRef.current?.click()
                                  }
                                }}
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
                                ref={addButtonRef}
                                onClick={() => addProductToSale()}
                                className="w-full"
                                disabled={selectedProduct.quantity === 0 || quantity > selectedProduct.quantity}
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
    {/* Rest of your form fields remain the same... */}
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
                        <TableHead>Discount</TableHead>
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
                                max={item.limit}
                                onChange={(e) => updateItemQuantity(item.id, Number.parseInt(e.target.value) || 1)}
                                className="w-16"
                              />
                              <span className="text-xs text-muted-foreground">{item.unit}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max={item.selectedPrice * item.quantity}
                              value={item.discount}
                              onChange={(e) => updateItemDiscount(item.id, Number.parseFloat(e.target.value) || 0)}
                              className="w-20"
                              placeholder="0.00"
                            />
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
                  {selectedCustomer && customerBalance > 0 && (
                        <div className="p-4 border rounded-lg border-green-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Wallet className="h-5 w-5 text-green-600" />
                              <span className="font-medium text-green-700">Account Balance Available</span>
                            </div>
                            <span className="font-bold text-green-700">
                              {formatCurrency(customerBalance)}
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="useBalance"
                                checked={useBalancePayment}
                                onChange={(e) => setUseBalancePayment(e.target.checked)}
                                className="rounded border-gray-300"
                              />
                              <Label htmlFor="useBalance">Pay with account balance</Label>
                            </div>
                            
                            {useBalancePayment && (
                              <div className="space-y-2">
                                <Label htmlFor="balanceAmount">Amount to use from balance</Label>
                                <div className="flex gap-2">
                                  <Input
                                    id="balanceAmount"
                                    type="number"
                                    placeholder="0.00"
                                    max={Math.min(customerBalance, grandTotal - totalPaid)}
                                    value={balancePaymentAmount}
                                    onChange={(e) => setBalancePaymentAmount(e.target.value)}
                                  />
                                  <Button
                                    onClick={() => setBalancePaymentAmount(
                                      Math.min(customerBalance, grandTotal - totalPaid).toString()
                                    )}
                                    variant="outline"
                                    size="sm"
                                  >
                                    Max
                                  </Button>
                                </div>
                                <Button
                                  onClick={addBalancePayment}
                                  size="sm"
                                  className="w-full bg-green-600 hover:bg-green-700"
                                >
                                  <Wallet className="mr-2 h-4 w-4" />
                                  Add Balance Payment
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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
            ref={paymentAmountRef}
            type="number"
            placeholder="0.00"
            value={currentPaymentAmount}
            onChange={(e) => setCurrentPaymentAmount(e.target.value)}
          />
          <Button ref={allButtonRef} onClick={()=>setCurrentPaymentAmount(grandTotal)}>All</Button>&nbsp;
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

      <Button ref={addPaymentButtonRef} onClick={addPaymentMethod} className="w-full" size="sm">
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
                            {payment.method === "balance" ? (
                              <Wallet className="h-4 w-4 text-green-600" />
                            ) : (
                              getPaymentMethodIcon(payment.method)
                            )}
                            <div>
                              <div className="font-medium">
                                {payment.method === "balance" 
                                  ? "Account Balance" 
                                  : getPaymentMethodLabel(payment.method)
                                } - {formatCurrency(payment.amount)}
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
              ref={finalizeSaleButtonRef}
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
                    Invoice {completedSale.invoiceNo} has been created for {completedSale.customer.name}.
                    <br />
                    Total: {formatCurrency(completedSale.grandTotal)}
                    <br />
                    Paid: {formatCurrency(completedSale.totalPaid)} via {completedSale.paymentMethods.length} method(s)
                    {completedSale.balance > 0 && (
                      <>
                        <br />
                        Balance: ${completedSale.balance}
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
                    <Button ref={printButtonRef} className="flex-1">
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
