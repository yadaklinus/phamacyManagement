"use client"

import { useEffect, useState,useMemo } from "react"
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
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  Quote,
  Plus,
  Trash2,
  Calculator,
  Printer,
  Check,
  ChevronsUpDown,
  CheckCircle,
  X,
  Calendar,
} from "lucide-react"
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

interface QuotationItem {
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
  limit: number
}

interface CompletedQuotation {
  quotationId: string
  quotationNo: string
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
    selectedPrice: number
    priceType: "wholesale" | "retail"
    quantity: number
    discount: number
    total: number
  }>
  subtotal: number
  totalDiscount: number
  taxRate: number
  taxAmount: number
  grandTotal: number
  validUntil: string | null
  notes: string
  warehouseId: string
}

export default function AddQuotationPage() {
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [selectedProductId, setSelectedProductId] = useState("")
 
  const [quantity, setQuantity] = useState<any>("")
  const [discount, setDiscount] = useState(0)
  const [priceType, setPriceType] = useState<"wholesale" | "retail">("retail")
  const [taxRate, setTaxRate] = useState(0)
  const [notes, setNotes] = useState("")
  const [validUntil, setValidUntil] = useState<Date | null>(null)
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedQuotation, setCompletedQuotation] = useState<CompletedQuotation | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [endPoint, setEndPoint] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  const warehouseId = getWareHouseId()

  const { data: products, loading, error } = fetchWareHouseData("/api/product/list", { warehouseId })
  const { data: customers, loading: loadingCustomers, error: errorCustomers } = fetchWareHouseData("/api/customer/list", { warehouseId })

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

  useEffect(() => {
    setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
  }, [session, warehouseId])

  const addItem = () => {
    if (!selectedProductId || !quantity || quantity <= 0) return

    const product = products?.find((p: any) => p.id === selectedProductId)
    if (!product) return

    const selectedPrice = priceType === "wholesale" ? product.wholeSalePrice : product.retailPrice
    const itemTotal = (selectedPrice * quantity) - discount

    const existingItemIndex = quotationItems?.findIndex(item=>item.productId == selectedProductId)
    if (existingItemIndex >= 0) {
        // Update existing item
        const updatedItems = [...quotationItems]
        const existingItem = updatedItems[existingItemIndex]
        existingItem.quantity += Number(quantity)
        existingItem.discount += discount
        existingItem.total = existingItem.selectedPrice * existingItem.quantity - existingItem.discount
        setQuotationItems(updatedItems)
      }else{
        const newItem: QuotationItem = {
            id: Date.now().toString(),
            productId: product.id,
            productName: product.name,
            productBarcode: product.barcode,
            cost: product.cost,
            wholeSalePrice: product.wholeSalePrice,
            retailPrice: product.retailPrice,
            selectedPrice,
            priceType,
            quantity: parseInt(quantity),
            discount,
            total: itemTotal,
            unit: product.unit,
            taxRate: product.taxRate,
            limit: product.quantity
          }
          setQuotationItems([...quotationItems, newItem])
      }
    setSelectedProductId("")
    setQuantity("")
    setDiscount(0)
  }

  const removeItem = (id: string) => {
    setQuotationItems(quotationItems.filter(item => item.id !== id))
  }

  const updateItemQuantity = (id: string, newQuantity: number) => {
    setQuotationItems(quotationItems.map(item =>
      item.id === id
        ? { ...item, quantity: newQuantity, total: (item.selectedPrice * newQuantity) - item.discount }
        : item
    ))
  }

  const updateItemDiscount = (id: string, newDiscount: number) => {
    setQuotationItems(quotationItems.map(item =>
      item.id === id
        ? { ...item, discount: newDiscount, total: (item.selectedPrice * item.quantity) - newDiscount }
        : item
    ))
  }

  const calculateSubtotal = () => {
    return quotationItems.reduce((sum, item) => sum + item.total, 0)
  }

  const calculateTotalDiscount = () => {
    return quotationItems.reduce((sum, item) => sum + item.discount, 0)
  }

  const calculateTaxAmount = () => {
    return (calculateSubtotal() * taxRate) / 100
  }

  const calculateGrandTotal = () => {
    return calculateSubtotal() + calculateTaxAmount()
  }

  const generateQuotationNumber = () => {
    return `QUO-${Date.now()}`
  }

  const handleSubmit = async () => {
    if (quotationItems.length === 0 || !selectedCustomer) {
      alert("Please add items and select a customer")
      return
    }



    setIsSubmitting(true)

    

    try {
      const customer = customers?.find((c: any) => c.id === selectedCustomer)
      const quotationNo = generateQuotationNumber()

      const quotationData = {
        quotationNo,
        items: quotationItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          cost: item.cost,
          selectedPrice: item.selectedPrice,
          priceType: item.priceType,
          quantity: item.quantity,
          discount: item.discount,
          total: item.total
        })),
        subtotal: calculateSubtotal(),
        totalDiscount: calculateTotalDiscount(),
        taxRate,
        taxAmount: calculateTaxAmount(),
        grandTotal: calculateGrandTotal(),
        validUntil: validUntil?.toISOString(),
        notes,
        warehouseId,
        customer
      }

      const response = await axios.post("/api/quotation", quotationData)

      if (response.status === 201) {
        const completedQuotationData: CompletedQuotation = {
          quotationId: response.data.quotation.id,
          quotationNo,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          customer,
          items: quotationItems.map(item => ({
            productId: item.productId,
            productName: item.productName,
            productCode: item.productBarcode,
            costPrice: item.cost,
            selectedPrice: item.selectedPrice,
            priceType: item.priceType,
            quantity: item.quantity,
            discount: item.discount,
            total: item.total
          })),
          subtotal: calculateSubtotal(),
          totalDiscount: calculateTotalDiscount(),
          taxRate,
          taxAmount: calculateTaxAmount(),
          grandTotal: calculateGrandTotal(),
          validUntil: validUntil?.toISOString() || null,
          notes,
          warehouseId
        }

        setCompletedQuotation(completedQuotationData)
        setShowSuccessDialog(true)
        
        // Reset form
        setQuotationItems([])
        setSelectedCustomer("")
        setNotes("")
        setValidUntil(null)
        setTaxRate(0)
      }
    } catch (error) {
      console.error("Error creating quotation:", error)
      alert("Error creating quotation")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || loadingCustomers) return <Loading />

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
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
              <BreadcrumbPage>Add Quotation</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Quote className="h-5 w-5" />
                Add Products to Quotation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Product</Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                      >
                        {selectedProductId
                          ? products?.find((product: any) => product.id === selectedProductId)?.name
                          : "Select product..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput   className="overflow-hidden text-ellipsis" value={searchQuery} onValueChange={handleSearchChange} placeholder="Search product..." />
                        <CommandList>
                        {filteredProducts.length === 0 ? (
                         <CommandEmpty>
                                           {searchQuery.length === 0 
                                             ? "Start typing to search products..." 
                                             : "No products found"}
                                         </CommandEmpty>
                        ):(
                          <CommandGroup>
                          {filteredProducts?.map((product: any) => (
                           <CommandItem
                           key={product.id}
                           className={cn(
                            "group flex flex-col items-start gap-1 p-3 cursor-pointer transition-colors",
                            "hover:bg-blue-600 hover:text-white",
                            "data-[selected=true]:bg-blue-600 data-[selected=true]:text-white",
                            "focus:bg-blue-600 focus:text-white",
                            "aria-selected:bg-blue-600 aria-selected:text-white",
                           
                          )}
                           value={`${product.name} ${product.barcode}`}
                           // 2. Update onSelect to use the 'product' object directly
                           onSelect={() => {
                             // This function now uses the 'product' from the .map() scope,
                             // which is more direct and reliable.
                             const newSelectedId = selectedProductId === product.id ? "" : product.id
                             setSelectedProductId(newSelectedId)
                             setOpen(false)
                           }}
                         >
                              <Check
                                  className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedProductId === product.id ? "opacity-100" : "opacity-0"
                                  )}
                              />
                              <div>
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-xs text-muted-foreground">Code: {product.barcode}</div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        )}
                         
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                            
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="Enter quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceType">Price Type</Label>
                  <Select value={priceType} onValueChange={(value: "wholesale" | "retail") => setPriceType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="wholesale">Wholesale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Discount</Label>
                  <Input
                    id="discount"
                    type="number"
                    placeholder="Enter discount"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                  />
                </div>
              </div>

              <Button onClick={addItem} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quotation Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotationItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.priceType} - {item.unit}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(item.selectedPrice)}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item.id, Number(e.target.value))}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.discount}
                          onChange={(e) => updateItemDiscount(item.id, Number(e.target.value))}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>{formatCurrency(item.total)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Select Customer</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quotation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  type="date"
                  value={validUntil ? validUntil.toISOString().split('T')[0] : ''}
                  onChange={(e) => setValidUntil(e.target.value ? new Date(e.target.value) : null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  placeholder="Enter tax rate"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Quotation Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Discount:</span>
                <span>-{formatCurrency(calculateTotalDiscount())}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({taxRate}%):</span>
                <span>{formatCurrency(calculateTaxAmount())}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Grand Total:</span>
                <span>{formatCurrency(calculateGrandTotal())}</span>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || quotationItems.length === 0 || !selectedCustomer}
            className="w-full"
          >
            {isSubmitting ? "Creating..." : "Create Quotation"}
          </Button>
        </div>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Quotation Created Successfully!
            </DialogTitle>
            <DialogDescription>
              Your quotation has been created and is ready for review.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => router.push(`${endPoint}/quotations/list`)}
              className="flex-1"
            >
              View Quotations
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSuccessDialog(false)}
              className="flex-1"
            >
              Create Another
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}