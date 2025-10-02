"use client"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Textarea } from "@/components/ui/textarea"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import axios from "axios"
import { error } from "console"
import { Scan, Plus } from "lucide-react"
import { useSession } from "next-auth/react"
import React, { useEffect, useState } from "react"
import toast from "react-hot-toast"

export default function AddProductPage() {

  const [productName,setProductName] = useState("")
  const [productCode,setProductCode] = useState("")
  const [productDescription,setProductDescription] = useState("")
  const [costPrice,setCostPrice] = useState("")
  const [wholeSalePrice,setWholeSalePrice] = useState("")
  const [retailPrice,setRetailPrice] = useState("")
  const [productUnit,setProductUnit] = useState("")
  const [productTaxRate,setProductTaxRate] = useState("0")
  const [productQuantity,setProductQuantity] = useState("")
  const [endPoint, setEndPoint] = useState("")
  const {data:session} = useSession()
  const warehouseId = getWareHouseId()

  useEffect(()=>{
      setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
    },[session,warehouseId])

  async function handleFormSubmit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    await axios.post("/api/product",{productName,productCode,productDescription,productQuantity,productTaxRate,productUnit,wholeSalePrice,retailPrice,costPrice,warehouseId}).then((data)=>{
      console.log(data)
      if(data.status == 201){
        toast.success("Product Created")
        setProductName("")
        setProductCode("")
        setProductDescription("")
        setCostPrice("")
        setWholeSalePrice("")
        setRetailPrice("")
        setProductUnit("")
        setProductTaxRate("")
        setProductQuantity("")
      }
    }).catch((error)=>{
      console.log(error)
      if(error.response.status === 403){
        toast.error("Product Exist")
      }
      if(error.response.status === 401){
        toast.error("Where House doesnot exist")
      }
    })
    // console.table({productName,productCode,productDescription,productQuantity,productTaxRate,productUnit,wholeSalePrice,retailPrice,costPrice,warehouseId})
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
                  <BreadcrumbPage>Add Product</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <form onSubmit={handleFormSubmit}>
          <div className="flex items-center gap-2 mb-4">
            <Plus className="h-5 w-5 text-blue-600" />
            <h1 className="text-2xl font-semibold text-blue-600">Add Product</h1>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Please fill in the information below. The field labels marked with * are required input fields.
          </p>

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
                    <Input value={productName} onChange={(e)=>setProductName(e.target.value)} id="product-name" placeholder="Enter product name" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product-code">Product Code *</Label>
                    <div className="flex gap-2">
                      <Input id="product-code" value={productCode} onChange={(e)=>setProductCode(e.target.value)} placeholder="Enter product code" className="flex-1" />
                      <Button onClick={()=>{
                        const rand = (Math.random()*59)*(Math.random())
                        setProductCode(`${rand.toString().split(".")[1]}`)
                      }} variant="outline" size="icon">
                        <Scan className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You can scan your barcode and select the correct symbology below
                    </p>
                  </div>

                 

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea value={productDescription} onChange={(e)=>setProductDescription(e.target.value)} id="description" placeholder="Enter product description" rows={3} />
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
                      <Input value={costPrice} onChange={(e)=>setCostPrice(e.target.value)} id="cost-price" type="number" placeholder="0.00" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="selling-price">WholeSale Selling Price *</Label>
                      <Input value={wholeSalePrice} onChange={(e)=>setWholeSalePrice(e.target.value)}  id="selling-price" type="number" placeholder="0.00" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="selling-price">Retail Selling Price *</Label>
                      <Input  value={retailPrice} onChange={(e)=>setRetailPrice(e.target.value)}  id="selling-price" type="number" placeholder="0.00" />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                      <Input  value={productTaxRate} onChange={(e)=>setProductTaxRate(e.target.value)}  id="tax-rate" type="number" placeholder="0" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Select value={productUnit} onValueChange={(e)=>setProductUnit(e)}>
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
                    <Input  value={productQuantity} onChange={(e)=>setProductQuantity(e.target.value)}  id="quantity" type="number" placeholder="0" />
                  </div>
                </CardContent>
              </Card>

            
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-8">
            <Button type="reset" variant="outline">Cancel</Button>
            <Button disabled={
              !productName || 
              !productCode || 
              
              !productQuantity || 
              !productTaxRate || 
              !productUnit || 
              !wholeSalePrice || 
              !retailPrice
            } type="submit">Save Product</Button>
          </div>
          </form>
        </div>
     </>
  )
}
