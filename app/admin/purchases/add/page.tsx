"use client"

import { useEffect, useState,useMemo } from "react"
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn, formatCurrency } from "@/lib/utils"
import { Truck, Plus, Trash2, Calculator, Check, Printer, ChevronsUpDown, ShoppingCart } from "lucide-react"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import fetchWareHouseData from "@/hooks/fetch-invidual-data"
import { Loading } from "@/components/loading"
import { useSession } from "next-auth/react"
import { usePrintPurchase } from "@/hooks/use-print-purchase"

// Sample data


const warehouses = [
  { id: "WH-001", name: "Main Warehouse", code: "MAIN", address: "100 Storage St, Warehouse District" },
  { id: "WH-002", name: "Branch Warehouse", code: "BRANCH", address: "200 Branch Ave, Secondary Location" },
  { id: "WH-003", name: "Storage Facility", code: "STORAGE", address: "300 Storage Rd, Remote Area" },
]



interface PurchaseItem {
  id: string
  productId: string
  productName: string
  productBarcode: string
  cost: number
  wholeSalePrice: number
  retailPrice: number
  customRetailPrice?: number
  customWholesalePrice?: number
  customCost?: number
  selectedPrice: number
  priceType: "wholesale" | "retail"
  quantity: number
  discount: number
  total: number
  unit: string
  taxRate: number
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

  const [selectedProductId, setSelectedProductId] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [discount, setDiscount] = useState(0)
  const [taxRate, setTaxRate] = useState(0)
  const [shipping, setShipping] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [status, setStatus] = useState<"ordered" | "received" | "pending">("ordered")
  const [notes, setNotes] = useState("")
  const [priceType, setPriceType] = useState<"wholesale" | "retail">("retail")
  const [customRetailPrice, setCustomRetailPrice] = useState<number | undefined>(undefined)
  const [customWholesalePrice, setCustomWholesalePrice] = useState<number | undefined>(undefined)
  const [customCost, setCustomCost] = useState<number | undefined>(undefined)
  const [enableCustomPrices, setEnableCustomPrices] = useState(false)
  const [updateProductPricesPermanently, setUpdateProductPricesPermanently] = useState(false)
  const [endPoint, setEndPoint] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
    const {data:session} = useSession()
    
  const [referenceNo, setReferenceNo] = useState(
    `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
  )
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdPurchase, setCreatedPurchase] = useState<PurchaseData | null>(null)
  const [open, setOpen] = useState(false)

   const warehouseId = getWareHouseId()
  const { printPurchaseReceipt } = usePrintPurchase()
          
          const {data:products,loading,error} = fetchWareHouseData("/api/product/list",{warehouseId})
          const {data:suppliers,loading:loadingsuppliers,error:errorsuppliers} = fetchWareHouseData("/api/supplier/list",{warehouseId})

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
            },[session,warehouseId])
  
           if(!products && !suppliers) return (
            <Loading/>
           )

  const selectedProduct = products?.find((p:any) => p.id === selectedProductId)

 

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: "text-red-600", text: "Out of Stock", bgColor: "bg-red-50" }
    if (stock <= 5) return { color: "text-yellow-600", text: "Low Stock", bgColor: "bg-yellow-50" }
    return { color: "text-green-600", text: "In Stock", bgColor: "bg-green-50" }
  }

  const addProductToPurchase = () => {
    if (!selectedProduct) return

    const existingItemIndex = purchaseItems?.findIndex(
      (item) => item.productId === selectedProduct.id && item.priceType === priceType,
    )

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...purchaseItems]
      const existingItem = updatedItems[existingItemIndex]
      existingItem.quantity += quantity
      existingItem.discount += discount
      const unitCost = existingItem.customCost !== undefined ? existingItem.customCost : existingItem.cost
      existingItem.total = unitCost * existingItem.quantity - existingItem.discount
      setPurchaseItems(updatedItems)
    }else{
      const effectiveRetailPrice = enableCustomPrices && customRetailPrice !== undefined ? customRetailPrice : selectedProduct.retailPrice
      const effectiveWholesalePrice = enableCustomPrices && customWholesalePrice !== undefined ? customWholesalePrice : selectedProduct.wholeSalePrice
      
      const selectedPrice = priceType === "wholesale" ? effectiveWholesalePrice : effectiveRetailPrice
  
      const unitCost = enableCustomPrices && customCost !== undefined ? customCost : selectedProduct.cost
      const itemTotal = unitCost * quantity - discount
      const newItem: PurchaseItem = {
        id: `ITEM-${Date.now()}`,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          productBarcode: selectedProduct.barcode,
          cost: selectedProduct.cost,
          wholeSalePrice: selectedProduct.wholeSalePrice,
          retailPrice: selectedProduct.retailPrice,
          customRetailPrice: enableCustomPrices ? customRetailPrice : undefined,
          customWholesalePrice: enableCustomPrices ? customWholesalePrice : undefined,
          customCost: enableCustomPrices ? customCost : undefined,
          selectedPrice,
          priceType,
          quantity,
          discount,
          total: itemTotal,
          unit: selectedProduct.unit,
          taxRate: selectedProduct.taxRate,
      }
  
      setPurchaseItems([...purchaseItems, newItem])
    }

    // Use custom prices if enabled, otherwise use product defaults
   
    setSelectedProductId("")
    setQuantity(1)
    setDiscount(0)
    setEnableCustomPrices(false)
    setCustomRetailPrice(undefined)
    setCustomWholesalePrice(undefined)
    setCustomCost(undefined)
    setUpdateProductPricesPermanently(false)
    setOpen(false)
  }

  const removeItem = (itemId: string) => {
    setPurchaseItems(purchaseItems.filter((item) => item.id !== itemId))
  }

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    setPurchaseItems(
      purchaseItems.map((item) => {
        if (item.id === itemId) {
          const newTotal = (item.customCost ? item.customCost : item.cost) * newQuantity - item.discount
          console.log(item.customCost)
          return { ...item, quantity: newQuantity, total: newTotal }
        }
        return item
      }),
    )
  }

  const getCurrentPrice = (product: (typeof products)[0], type: "wholesale" | "retail") => {
    if (enableCustomPrices) {
      if (type === "wholesale" && customWholesalePrice !== undefined) {
        return customWholesalePrice
      }
      if (type === "retail" && customRetailPrice !== undefined) {
        return customRetailPrice
      }
    }
    return type === "wholesale" ? product.wholeSalePrice : product.retailPrice
  }

 

  const subtotal = purchaseItems.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = (subtotal * taxRate) / 100
  const grandTotal = subtotal + taxAmount + shipping

  const getPaymentStatus = () => {
    if (paidAmount === 0) return "pending"
    if (paidAmount >= grandTotal) return "paid"
    return "partial"
  }

  const handleSubmit = async () => {
    if (purchaseItems.length === 0 || !selectedSupplier) return

    const supplier = suppliers?.find((s:any) => s.id === selectedSupplier)

    const purchaseData = {
      items: purchaseItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productBarcode: item.productBarcode,
        cost: item.cost,
        selectedPrice: item.selectedPrice,
        priceType: item.priceType,
        quantity: item.quantity,
        discount: item.discount,
        total: item.total,
        customRetailPrice: item.customRetailPrice,
        customWholesalePrice: item.customWholesalePrice
      })),
      referenceNo,
      subtotal,
      taxRate,
      taxAmount,
      shipping,
      grandTotal,
      paidAmount,
      balance: grandTotal - paidAmount,
      notes,
      warehouseId,
      supplierId: selectedSupplier,
      status
    }

    // Check if any items have custom prices
    const hasCustomPrices = purchaseItems.some(item => 
      item.customRetailPrice !== undefined || item.customWholesalePrice !== undefined
    )

    try {
      // First, update product prices permanently if requested
      const itemsWithPermanentUpdates = purchaseItems.filter(item => 
        (item.customRetailPrice !== undefined || item.customWholesalePrice !== undefined) 
      )

      for (const item of itemsWithPermanentUpdates) {
        if (item.customRetailPrice !== undefined || item.customWholesalePrice !== undefined) {
          const updatePayload: any = {
            productId: item.productId,
            warehouseId: warehouseId
          }
          
          if (item.customRetailPrice !== undefined) {
            updatePayload.retailPrice = item.customRetailPrice
          }
          if (item.customCost !== undefined) {
            updatePayload.costPrice = item.customCost
          }
          if (item.customWholesalePrice !== undefined) {
            updatePayload.wholesalePrice = item.customWholesalePrice
          }

          console.log(updatePayload)

          await fetch('/api/product/update-prices', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatePayload),
          })
        }
      }

      // Use the appropriate endpoint based on whether custom prices are used
      const endpoint = '/api/purchase'
      
      console.log(purchaseData)
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      })

      if (response.ok) {
        const result = await response.json()
        
        const completedPurchase: PurchaseData = {
          id: result.purchase.id,
          invoiceNumber: result.purchase.referenceNo,
          referenceNo,
          date: new Date().toISOString().split("T")[0],
          supplierId: selectedSupplier,
          supplierName: supplier?.name || "",
          warehouseId: warehouseId,
          warehouseName: "",
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

        setCreatedPurchase(completedPurchase)
        setShowSuccessDialog(true)

        // Reset form
        setPurchaseItems([])
        setSelectedSupplier("")
        setPaidAmount(0)
        setNotes("")
        setReferenceNo(`PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`)
      } else {
        console.error('Failed to create purchase order')
        alert('Failed to create purchase order. Please try again.')
      }
    } catch (error) {
      console.error('Error creating purchase order:', error)
      alert('Error creating purchase order. Please try again.')
    }
  }

  const handlePrintReceipt = () => {
    if (!createdPurchase) return

    const supplier = suppliers?.find((s:any) => s.id === createdPurchase.supplierId)
    
    // Prepare receipt data for the new hook
    const receiptData = {
      referenceNo: createdPurchase.referenceNo,
      invoiceNo: createdPurchase.invoiceNumber,
      date: new Date(createdPurchase.date).toLocaleDateString(),
      time: new Date(createdPurchase.createdAt).toLocaleTimeString(),
      supplier: supplier?.name || 'Unknown Supplier',
      warehouse: createdPurchase.warehouseName || 'Current Warehouse',
      items: createdPurchase.items.map(item => ({
        name: item.productName,
        productBarcode: item.productBarcode,
        quantity: item.quantity,
        cost: item.cost,
        discount: item.discount,
        total: item.total,
        unit: item.unit
      })),
      subtotal: createdPurchase.subtotal,
      taxRate: createdPurchase.taxRate,
      taxAmount: createdPurchase.taxAmount,
      shipping: createdPurchase.shipping,
      total: createdPurchase.grandTotal,
      paidAmount: createdPurchase.paidAmount,
      balance: createdPurchase.grandTotal - createdPurchase.paidAmount,
      status: createdPurchase.status,
      notes: createdPurchase.notes
    }

    printPurchaseReceipt(receiptData,"A4")
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
                  <BreadcrumbLink href={`${endPoint}/purchases/list`}>Purchases</BreadcrumbLink>
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
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supplier">Supplier *</Label>
                      <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers?.map((supplier:any) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
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
                  {/* Product Selection with Search */}
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
                            ? products.find((product:any) => product.id === selectedProductId)?.name
                            : "Select product..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search products..." value={searchQuery} onValueChange={handleSearchChange} className="h-9" />
                          <CommandList>
                            {filteredProducts.length === 0 ? (
                              <CommandEmpty>
                                 {searchQuery.length === 0 
                                  ? "Start typing to search products..." 
                                  : "No products found"}
                              </CommandEmpty>
                            ):(
                              <CommandGroup>
                              {filteredProducts?.map((product:any) => {
                                const stockStatus = getStockStatus(product.stock)
                                return (
                                 <CommandItem
                                                                     key={product.id}
                                                                     value={`${product.name} ${product.barcode} ${product.unit}`} // include searchable fields here
                                                                     onSelect={(currentValue) => {
                                                                       const selected = products?.find((p:any) =>
                                                                         `${p.name} ${p.barcode} ${p.unit}` === currentValue
                                                                       )?.id
                                                                       setSelectedProductId(selected || "")
                                                                       setOpen(false)
                                                                     }}
                                                                     className={cn(
                                                                      "group flex flex-col items-start gap-1 p-3 cursor-pointer transition-colors",
                                                                      "hover:bg-blue-600 hover:text-white",
                                                                      "data-[selected=true]:bg-blue-600 data-[selected=true]:text-white",
                                                                      "focus:bg-blue-600 focus:text-white",
                                                                      "aria-selected:bg-blue-600 aria-selected:text-white",
                                                                     
                                                                    )}
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
                            )}
                            
                           
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
                            Wholesale - {formatCurrency(getCurrentPrice(selectedProduct, "wholesale").toFixed(2))}
                          </SelectItem>
                          <SelectItem value="retail">Retail - {formatCurrency(getCurrentPrice(selectedProduct, "retail").toFixed(2))}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Custom Price Controls */}
                  {selectedProduct && (
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="enable-custom-prices"
                          checked={enableCustomPrices}
                                                  onChange={(e) => {
                          setEnableCustomPrices(e.target.checked)
                          if (!e.target.checked) {
                            setCustomRetailPrice(undefined)
                            setCustomWholesalePrice(undefined)
                            setCustomCost(undefined)
                            setUpdateProductPricesPermanently(false)
                          } else {
                            setCustomRetailPrice(selectedProduct.retailPrice)
                            setCustomCost(selectedProduct.cost)
                            setCustomWholesalePrice(selectedProduct.wholeSalePrice)
                          }
                        }}
                          className="rounded"
                        />
                        <Label htmlFor="enable-custom-prices" className="text-sm font-medium">
                          Update Retail price and WholeSale Price
                        </Label>
                      </div>
                      
                      {enableCustomPrices && (
                        <div className="space-y-4 text-black-300">
                          <div className="grid grid-cols-2 gap-4">
                            
                            <div className="space-y-2">
                              <Label htmlFor="custom-retail">Custom Retail Price</Label>
                              <Input
                                id="custom-retail"
                                type="number"
                                step="0.01"
                                min="0"
                                value={customRetailPrice || ""}
                                onChange={(e) => setCustomRetailPrice(parseFloat(e.target.value) || undefined)}
                                placeholder="Enter retail price"
                              />
                              <p className="text-xs text-gray-500">
                                Original: {formatCurrency(selectedProduct.retailPrice)}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="custom-wholesale">Custom Wholesale Price</Label>
                              <Input
                                id="custom-wholesale"
                                type="number"
                                step="0.01"
                                min="0"
                                value={customWholesalePrice || ""}
                                onChange={(e) => setCustomWholesalePrice(parseFloat(e.target.value) || undefined)}
                                placeholder="Enter wholesale price"
                              />
                              <p className="text-xs text-gray-500">
                                Original: {formatCurrency(selectedProduct.wholeSalePrice)}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="custom-wholesale">Custom Cost</Label>
                              <Input
                                id="custom-wholesale"
                                type="number"
                                step="0.01"
                                min="0"
                                value={customCost|| ""}
                                onChange={(e) => setCustomCost(parseFloat(e.target.value) || undefined)}
                                placeholder="Enter wholesale price"
                              />
                              <p className="text-xs text-gray-500">
                                Original: {formatCurrency(selectedProduct.cost)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="update-permanently"
                              checked={updateProductPricesPermanently}
                              onChange={(e) => setUpdateProductPricesPermanently(e.target.checked)}
                              className="rounded"
                            />
                            <Label htmlFor="update-permanently" className="text-sm">
                              Update product prices permanently (affects future sales and purchases)
                            </Label>
                          </div>
                        </div>
                      )}
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
                          min="1"
                          
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
                          onClick={addProductToPurchase}
                          className="w-full"
                          
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

              {/* Purchase Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Items ({purchaseItems?.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {purchaseItems?.length === 0 ? (
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
                        {purchaseItems?.map((item:any) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.productName}</div>
                                <div className="text-sm text-muted-foreground">{item.productBarcode}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant={item.priceType === "wholesale" ? "default" : "secondary"}>
                                  {item.priceType}
                                </Badge>
                                {(item.customRetailPrice !== undefined || item.customWholesalePrice !== undefined) && (
                                  <Badge variant="outline" className="text-xs">
                                    Custom
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{formatCurrency(item.selectedPrice)}</span>
                                {item.priceType === "retail" && item.customRetailPrice !== undefined && (
                                  <span className="text-xs text-muted-foreground">
                                    Original: {formatCurrency(item.retailPrice)}
                                  </span>
                                )}
                                {item.priceType === "wholesale" && item.customWholesalePrice !== undefined && (
                                  <span className="text-xs text-muted-foreground">
                                    Original: {formatCurrency(item.wholeSalePrice)}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                 
                                  value={item.quantity}
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
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Tax ({taxRate}%):</span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Shipping:</span>
                      <span>{formatCurrency(shipping)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Grand Total:</span>
                      <span>{formatCurrency(grandTotal)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Paid Amount:</span>
                      <span>{formatCurrency(paidAmount)}</span>
                    </div>
                    <div className="flex justify-between text-orange-600">
                      <span>Balance:</span>
                      <span>{formatCurrency(grandTotal - paidAmount)}</span>
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
                       
                        max={grandTotal}
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(Number.parseFloat(e.target.value) || 0)}
                      />
                      <Button onClick={()=>setPaidAmount(grandTotal)}>All</Button>&nbsp;
                      <Button onClick={()=>setPaidAmount(grandTotal/2)}>Half</Button>
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
              disabled={purchaseItems.length === 0 || !selectedSupplier}
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
                Print Receipt
              </Button>
            </div>
          </DialogContent>
        </Dialog>
     </>
  )
}