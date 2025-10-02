"use client"

import { useEffect, useState } from "react"
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
  Check,
  ChevronsUpDown,
  Save,
  X,
} from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn, formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useRouter, useParams } from "next/navigation"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import { Loading } from "@/components/loading"
import fetchWareHouseData from "@/hooks/fetch-invidual-data"
import axios from "axios"
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

export default function EditQuotationPage() {
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [selectedProductId, setSelectedProductId] = useState("")
  const [quantity, setQuantity] = useState<any>("")
  const [discount, setDiscount] = useState(0)
  const [priceType, setPriceType] = useState<"wholesale" | "retail">("retail")
  const [taxRate, setTaxRate] = useState(0)
  const [notes, setNotes] = useState("")
  const [validUntil, setValidUntil] = useState<Date | null>(null)
  const [status, setStatus] = useState("pending")
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [endPoint, setEndPoint] = useState("")

  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const warehouseId = getWareHouseId()
  const quotationNo = params.quotation as string

  const { data: products, loading: productsLoading } = fetchWareHouseData("/api/product/list", { warehouseId })
  const { data: customers, loading: customersLoading } = fetchWareHouseData("/api/customer/list", { warehouseId })

  useEffect(() => {
    setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
  }, [session, warehouseId])

  const fetchQuotation = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/quotation?quotationNo=${quotationNo}&warehouseId=${warehouseId}`)
      const quotation = response.data

      // Set form data
      setSelectedCustomer(quotation.selectedCustomerId)
      setTaxRate(quotation.taxRate)
      setNotes(quotation.notes || "")
      setStatus(quotation.status)
      setValidUntil(quotation.validUntil ? new Date(quotation.validUntil) : null)

      // Set quotation items
      const items = quotation.quotationItems.map((item: any, index: number) => ({
        id: `${item.id}-${index}`,
        productId: item.productId,
        productName: item.productName,
        productBarcode: item.product?.barcode || "",
        cost: item.cost,
        wholeSalePrice: item.product?.wholeSalePrice || item.selectedPrice,
        retailPrice: item.product?.retailPrice || item.selectedPrice,
        selectedPrice: item.selectedPrice,
        priceType: item.priceType as "wholesale" | "retail",
        quantity: item.quantity,
        discount: item.discount,
        total: item.total,
        unit: item.product?.unit || "pcs",
        taxRate: item.product?.taxRate || 0,
        limit: item.product?.quantity || 0
      }))
      setQuotationItems(items)

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

  const handleSubmit = async () => {
    if (quotationItems.length === 0 || !selectedCustomer) {
      alert("Please add items and select a customer")
      return
    }

    setIsSubmitting(true)

    try {
      const customer = customers?.find((c: any) => c.id === selectedCustomer)

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
        status,
        warehouseId,
        customer
      }

      const response = await axios.put("/api/quotation/edit", quotationData)

      if (response.status === 200) {
        alert("Quotation updated successfully!")
        router.push(`${endPoint}/quotations/${quotationNo}`)
      }
    } catch (error) {
      console.error("Error updating quotation:", error)
      alert("Error updating quotation")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || productsLoading || customersLoading) return <Loading />

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
              <BreadcrumbLink href={`${endPoint}/quotations/${quotationNo}`}>{quotationNo}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Quotation {quotationNo}</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || quotationItems.length === 0 || !selectedCustomer}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
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
                        <CommandInput placeholder="Search product..." />
                        <CommandList>
                          <CommandEmpty>No product found.</CommandEmpty>
                          <CommandGroup>
                            {products?.map((product: any) => (
                             <CommandItem
                             key={product.id}
                             // 1. Combine name and barcode for the searchable value
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
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
        </div>
      </div>
    </div>
  )
}