"use client"

import { useEffect, useState,useMemo } from "react"
import { useSession } from "next-auth/react"
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
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  DollarSign, 
  Package, 
  Save, 
  RefreshCw, 
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import { Loading } from "@/components/loading"
import { formatCurrency } from "@/lib/utils"
import axios from "axios"
import toast from "react-hot-toast"

interface Product {
  id: string
  name: string
  barcode: string
  cost: number
  wholeSalePrice: number
  retailPrice: number
  quantity: number
  unit: string
  taxRate: number
  newCost?: string
  newWholesalePrice?: string
  newRetailPrice?: string
  newQuantity?: string
  hasChanges?: boolean
  saving?: boolean
  saved?: boolean
}

export default function SimpleUpdatePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [endpoint, setEndPoint] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  
  const { data: session } = useSession()
  const warehouseId = getWareHouseId()

  useEffect(() => {
    setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
    fetchProducts()
  }, [session, warehouseId])

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
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(query) ||
        product.barcode.toLowerCase().includes(query)
      )
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

  // useEffect(() => {
  //   const filtered = products.filter((product) =>
  //     product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     product.barcode.toLowerCase().includes(searchTerm.toLowerCase())
  //   )
    
  // }, [products, searchTerm])

  const fetchProducts = async () => {
    if (!warehouseId) return
    
    setLoading(true)
    try {
      const response = await axios.post("/api/product/list", { warehouseId })
      const productsData = response.data.map((product: any) => ({
        ...product,
        newCost: "",
        newWholesalePrice: "",
        newRetailPrice: "",
        newQuantity: "",
        hasChanges: false,
        saving: false,
        saved: false
      }))
      setProducts(productsData)
    } catch (error) {
      console.error("Error fetching products:", error)
      toast.error("Failed to fetch products")
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (productId: string, field: string, value: string) => {
    setProducts(prev => prev.map(product => {
      if (product.id === productId) {
        const updated = { ...product, [field]: value, saved: false }
        
        // Check if product has any changes
        const hasChanges = 
          updated.newCost !== "" ||
          updated.newWholesalePrice !== "" ||
          updated.newRetailPrice !== "" ||
          updated.newQuantity !== ""
        
        return { ...updated, hasChanges }
      }
      return product
    }))
  }

  const handleSaveProduct = async (product: any) => {
    const hasChanges = 
      product.newCost !== "" ||
      product.newWholesalePrice !== "" ||
      product.newRetailPrice !== "" ||
      product.newQuantity !== ""

    if (!hasChanges) {
      toast.error("No changes to save for this product")
      return
    }

    // Update the saving state for this specific product
    setProducts(prev => prev.map(p => 
      p.id === product.id ? { ...p, saving: true } : p
    ))

    try {
      const updateData: any = {}
      
      if (product.newCost !== "") {
        updateData.costPrice = parseFloat(product?.newCost)
      }
      if (product.newWholesalePrice !== "") {
        updateData.wholesalePrice = parseFloat(product?.newWholesalePrice)
      }
      if (product.newRetailPrice !== "") {
        updateData.retailPrice = parseFloat(product?.newRetailPrice)
      }
      if (product.newQuantity !== "") {
        updateData.productQuantity = parseInt(product?.newQuantity)
      }

      await axios.patch("/api/product/update-prices", {
        productId: product.id,
        warehouseId,
        ...updateData
      })

      // Update the product with new values and clear the input fields
      setProducts(prev => prev.map(p => {
        if (p.id === product.id) {
          const updatedProduct = { ...p }
          
          // Update the actual values with the new ones
          if (product.newCost !== "") {
            updatedProduct.cost = parseFloat(product.newCost)
          }
          if (product.newWholesalePrice !== "") {
            updatedProduct.wholeSalePrice = parseFloat(product.newWholesalePrice)
          }
          if (product.newRetailPrice !== "") {
            updatedProduct.retailPrice = parseFloat(product.newRetailPrice)
          }
          if (product.newQuantity !== "") {
            updatedProduct.quantity = parseInt(product.newQuantity)
          }
          
          // Clear the input fields and reset states
          return {
            ...updatedProduct,
            newCost: "",
            newWholesalePrice: "",
            newRetailPrice: "",
            newQuantity: "",
            hasChanges: false,
            saving: false,
            saved: true
          }
        }
        return p
      }))

      toast.success(`Updated ${product.name}`)
      
      // Clear the saved state after 3 seconds
      setTimeout(() => {
        setProducts(prev => prev.map(p => 
          p.id === product.id ? { ...p, saved: false } : p
        ))
      }, 3000)

    } catch (error) {
      console.error(`Error updating product ${product.id}:`, error)
      toast.error(`Failed to update ${product.name}`)
      
      // Reset saving state on error
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, saving: false } : p
      ))
    }
  }

  const getStockColor = (stock: number) => {
    if (stock === 0) return "text-red-600"
    if (stock <= 5) return "text-yellow-600"
    return "text-green-600"
  }

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge variant="destructive">Out of Stock</Badge>
    if (stock <= 5) return <Badge variant="secondary">Low Stock</Badge>
    return <Badge variant="default">In Stock</Badge>
  }

  if (loading) return <Loading />

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={`${endpoint}/dashboard`}>Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`${endpoint}/products/list`}>Products</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Update Prices & Stock</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <h1 className="text-2xl font-semibold text-blue-600">Update Prices & Stock</h1>
          </div>
          <Button variant="outline" onClick={fetchProducts} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Search for products and update their prices and quantities. Simply enter new values and click save for each product.
        </p>

        {/* Search Bar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Products</CardTitle>
            <CardDescription>
              Search for products by name or barcode to update their information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product name or barcode..."
                value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Products ({filteredProducts.length})</span>
            </CardTitle>
            <CardDescription>
              Update prices and quantities for individual products. Changes are saved immediately when you click the save button.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="mx-auto h-12 w-12 mb-4" />
                <p>No products found matching your search</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Info</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Current Cost</TableHead>
                      <TableHead>Current Wholesale</TableHead>
                      <TableHead>Current Retail</TableHead>
                      <TableHead>New Cost</TableHead>
                      <TableHead>New Wholesale</TableHead>
                      <TableHead>New Retail</TableHead>
                      <TableHead>New Quantity</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id} >
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {product.barcode}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className={getStockColor(product.quantity)}>
                              {product.quantity} {product.unit}
                            </span>
                            {getStockBadge(product.quantity)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{formatCurrency(product.cost)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{formatCurrency(product.wholeSalePrice)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{formatCurrency(product.retailPrice)}</span>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="New cost"
                            value={product.newCost}
                            onChange={(e) => handleFieldChange(product.id, "newCost", e.target.value)}
                            // className={product.newCost ? "border-blue-500 bg-blue-50" : ""}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="New wholesale"
                            value={product.newWholesalePrice}
                            onChange={(e) => handleFieldChange(product.id, "newWholesalePrice", e.target.value)}
                            // className={product.newWholesalePrice ? "border-blue-500 bg-blue-50" : ""}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="New retail"
                            value={product.newRetailPrice}
                            onChange={(e) => handleFieldChange(product.id, "newRetailPrice", e.target.value)}
                            // className={product.newRetailPrice ? "border-blue-500 bg-blue-50" : ""}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="New quantity"
                            value={product.newQuantity}
                            onChange={(e) => handleFieldChange(product.id, "newQuantity", e.target.value)}
                            // className={product.newQuantity ? "border-blue-500 bg-blue-50" : ""}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleSaveProduct(product)}
                            disabled={!product.hasChanges || product.saving}
                            className={product.saved ? "bg-green-600 hover:bg-green-700" : ""}
                          >
                            {product.saving ? (
                              <>
                                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                                Saving...
                              </>
                            ) : product.saved ? (
                              <>
                                <CheckCircle className="mr-2 h-3 w-3" />
                                Saved
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-3 w-3" />
                                Save
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}