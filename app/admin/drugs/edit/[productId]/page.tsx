"use client"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Textarea } from "@/components/ui/textarea"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import axios from "axios"
import { Scan, Edit, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import React, { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { Loading } from "@/components/loading"
import { useSession } from "next-auth/react"

interface Product {
  id: string
  name: string
  barcode: string
  wholeSalePrice: number
  retailPrice: number
  cost: number
  quantity: number
  taxRate: number
  unit: string
  description: string
  warehousesId: string
}

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string
  const warehouseId = getWareHouseId()
  const [endPoint, setEndPoint] = useState("")
  const {data:session} = useSession()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  
  const [productName, setProductName] = useState("")
  const [productDescription, setProductDescription] = useState("")
  const [costPrice, setCostPrice] = useState("")
  const [wholeSalePrice, setWholeSalePrice] = useState("")
  const [retailPrice, setRetailPrice] = useState("")
  const [productUnit, setProductUnit] = useState("")
  const [productTaxRate, setProductTaxRate] = useState("0")
  const [productQuantity, setProductQuantity] = useState("")

  // Load product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.post(`/api/product/id`,{id:productId})
        const productData = response.data
        
        setProduct(productData)
        setProductName(productData.name)
        setProductDescription(productData.description)
        setCostPrice(productData.cost.toString())
        setWholeSalePrice(productData.wholeSalePrice.toString())
        setRetailPrice(productData.retailPrice.toString())
        setProductUnit(productData.unit)
        setProductTaxRate(productData.taxRate.toString())
        setProductQuantity(productData.quantity.toString())
    setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)

      } catch (error) {
        console.error("Error fetching product:", error)
        toast.error("Failed to load product data")
        router.push(`${endPoint}/products/list`)
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId, warehouseId, router])

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await axios.put(`/api/product/id`, {
        productName,
        productDescription,
        productQuantity,
        productTaxRate,
        productUnit,
        wholeSalePrice,
        retailPrice,
        costPrice,
        id:productId
      })

      if (response.status === 200) {
        toast.success("Product updated successfully")
        router.push(`${endPoint}/products/list`)
      }
    } catch (error) {
      console.error("Error updating product:", error)
      toast.error("Failed to update product")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Loading />
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <h2 className="text-xl font-semibold">Product not found</h2>
        <Link href={`${endPoint}/products/list`}>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </Link>
      </div>
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
                <BreadcrumbLink href={`${endPoint}/products/list`}>Products</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Edit Product</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-600" />
            <h1 className="text-2xl font-semibold text-blue-600">Edit Product</h1>
          </div>
          <Link href={`/warehouse/${warehouseId}/admin/products/list`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Update the product information below. The field labels marked with * are required input fields.
        </p>

        <form onSubmit={handleFormSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="product-name">Product Name *</Label>
                    <Input 
                      value={productName} 
                      onChange={(e) => setProductName(e.target.value)} 
                      id="product-name" 
                      placeholder="Enter product name" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product-code">Product Code (Barcode)</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="product-code" 
                        value={product.barcode} 
                        disabled 
                        className="flex-1 bg-muted" 
                      />
                      <Button variant="outline" size="icon" disabled>
                        <Scan className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Product code cannot be changed after creation
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      value={productDescription} 
                      onChange={(e) => setProductDescription(e.target.value)} 
                      id="description" 
                      placeholder="Enter product description" 
                      rows={3} 
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pricing Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cost-price">Cost Price</Label>
                      <Input 
                        value={costPrice} 
                        onChange={(e) => setCostPrice(e.target.value)} 
                        id="cost-price" 
                        type="number" 
                        step="0.01"
                        placeholder="0.00" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="wholesale-price">Wholesale Selling Price *</Label>
                      <Input 
                        value={wholeSalePrice} 
                        onChange={(e) => setWholeSalePrice(e.target.value)} 
                        id="wholesale-price" 
                        type="number" 
                        step="0.01"
                        placeholder="0.00" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="retail-price">Retail Selling Price *</Label>
                      <Input 
                        value={retailPrice} 
                        onChange={(e) => setRetailPrice(e.target.value)} 
                        id="retail-price" 
                        type="number" 
                        step="0.01"
                        placeholder="0.00" 
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                      <Input 
                        value={productTaxRate} 
                        onChange={(e) => setProductTaxRate(e.target.value)} 
                        id="tax-rate" 
                        type="number" 
                        step="0.01"
                        placeholder="0" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Select value={productUnit} onValueChange={(e) => setProductUnit(e)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="piece">Piece</SelectItem>
                          <SelectItem value="kg">Kilogram</SelectItem>
                          <SelectItem value="liter">Liter</SelectItem>
                          <SelectItem value="meter">Meter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Additional Options */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Warehouse Quantity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input 
                      value={productQuantity} 
                      onChange={(e) => setProductQuantity(e.target.value)} 
                      id="quantity" 
                      type="number" 
                      placeholder="0" 
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Product ID:</span>
                    <span className="font-mono text-xs">{product.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Barcode:</span>
                    <span className="font-mono">{product.barcode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Warehouse ID:</span>
                    <span className="font-mono text-xs">{product.warehousesId}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-8">
            <Link href={`${endPoint}/products/list`}>
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button 
              disabled={
                saving ||
                !productName || 
                !productDescription || 
                !productQuantity || 
                !productTaxRate || 
                !productUnit || 
                !wholeSalePrice || 
                !retailPrice
              } 
              type="submit"
            >
              {saving ? "Saving..." : "Update Product"}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}