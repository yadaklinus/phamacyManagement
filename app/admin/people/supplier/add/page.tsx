"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Truck, Save, ArrowLeft, Check, Building2, User, Building, Heart } from "lucide-react"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import axios from "axios"

interface Warehouse {
  warehouseCode: string
  name: string
  location: string
}

interface SupplierFormData {
  name: string
  type: "INDIVIDUAL" | "COMPANY" | "GOVERNMENT" | "NON_PROFIT"
  companyName: string
  email: string
  address: string
  phone: string
  
}

// Sample warehouses data
const warehousesData: Warehouse[] = [
  {
    warehouseCode: "WH-001",
    name: "Main Warehouse",
    location: "Downtown District",
  },
  {
    warehouseCode: "WH-002",
    name: "Secondary Warehouse",
    location: "Industrial Zone",
  },
  {
    warehouseCode: "WH-003",
    name: "Distribution Center",
    location: "Logistics Park",
  },
]

export default function AddSupplierPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [formData, setFormData] = useState<SupplierFormData>({
    name: "",
    type: "COMPANY",
    companyName: "",
    email: "",
    address: "",
    phone: "",
    
  })

  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdSupplierId, setCreatedSupplierId] = useState("")
  const warehouseId = getWareHouseId()
  

  const handleInputChange = (field: keyof SupplierFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "COMPANY":
        return <Building2 className="w-4 h-4" />
      case "INDIVIDUAL":
        return <User className="w-4 h-4" />
      case "GOVERNMENT":
        return <Building className="w-4 h-4" />
      case "NON_PROFIT":
        return <Heart className="w-4 h-4" />
      default:
        return <Building2 className="w-4 h-4" />
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      

      const newSupplier = {
        ...formData,
        warehousesId:warehouseId
      }

      // In real app, this would be: await fetch('/api/suppliers', { method: 'POST', body: JSON.stringify(newSupplier) })
      console.log("Created supplier:", newSupplier)
      await axios.post("/api/supplier",newSupplier).then((data)=>{
        console.log(data.data)
      })

      
      setShowSuccessDialog(true)
    } catch (error) {
      console.error("Error creating supplier:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNewSupplier = () => {
    setFormData({
      name: "",
      type: "COMPANY",
      companyName: "",
      email: "",
      address: "",
      phone: "",
     
    })
    setShowSuccessDialog(false)
    setCreatedSupplierId("")
  }

  const isFormValid = formData.name && (formData.type !== "COMPANY" || formData.companyName)

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
                  <BreadcrumbLink href="/people">People</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/people/suppliers">Suppliers</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Add Supplier</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-600" />
              <h1 className="text-2xl font-semibold text-orange-600">Add New Supplier</h1>
            </div>
            <Button variant="outline" asChild>
              <a href="/people/suppliers">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Suppliers
              </a>
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Enter the supplier's basic details and type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Supplier Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter supplier name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Supplier Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "INDIVIDUAL" | "COMPANY" | "GOVERNMENT" | "NON_PROFIT") =>
                        handleInputChange("type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COMPANY">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Company
                          </div>
                        </SelectItem>
                        <SelectItem value="INDIVIDUAL">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Individual
                          </div>
                        </SelectItem>
                        <SelectItem value="GOVERNMENT">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            Government
                          </div>
                        </SelectItem>
                        <SelectItem value="NON_PROFIT">
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4" />
                            Non-Profit
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(formData.type === "COMPANY" ||
                    formData.type === "GOVERNMENT" ||
                    formData.type === "NON_PROFIT") && (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="companyName">
                        {formData.type === "COMPANY"
                          ? "Company Name"
                          : formData.type === "GOVERNMENT"
                            ? "Organization Name"
                            : "Organization Name"}{" "}
                        *
                      </Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange("companyName", e.target.value)}
                        placeholder={`Enter ${formData.type.toLowerCase()} name`}
                        required
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Enter contact details for the supplier</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="supplier@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Enter complete address"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" asChild>
                <a href="/people/suppliers">Cancel</a>
              </Button>
              <Button type="submit" disabled={isSubmitting || !isFormValid}>
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Supplier
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Supplier Created Successfully!
              </DialogTitle>
              <DialogDescription>
                The supplier has been added to your system with ID: {createdSupplierId}
                
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleNewSupplier}>
                Add Another Supplier
              </Button>
              <Button asChild>
                <a href="/people/suppliers">View All Suppliers</a>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
     </>
  )
}
