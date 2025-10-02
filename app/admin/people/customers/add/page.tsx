"use client"

import type React from "react"

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
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserPlus, Save, ArrowLeft, Check } from "lucide-react"
import axios from "axios"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import { useSession } from "next-auth/react"

interface Customer {
  name: string
  company: string
  email: string
  phone: string
  address: string
  userType:string
  warehouseId:string
}

export default function AddCustomerPage() {
  const [endPoint, setEndPoint] = useState("")
  const {data:session} = useSession()
    
  const warehouseId = getWareHouseId()
  const init = {
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    userType:"",
    warehouseId
  }
  const [formData, setFormData] = useState(init)

  useEffect(()=>{
      setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
    },[session,warehouseId])

  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newCustomer: Customer = {
      ...formData,
    }

    
    await axios.post("/api/customer",newCustomer)
   console.log(newCustomer)
    setIsSubmitting(false)
    setShowSuccessDialog(true)
    setFormData(init)
  }

  const handleNewCustomer = () => {
    setFormData({
      name: "",
      company: "",
      email: "",
      phone: "",
      address: "",
      userType:"",
      warehouseId
    })
    setShowSuccessDialog(false)
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
                  <BreadcrumbLink href={`${endPoint}/people/customers`}>Customers</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Add Customer</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              <h1 className="text-2xl font-semibold text-blue-600">Add New Customer</h1>
            </div>
            <Button variant="outline" asChild>
              <a href={`${endPoint}/people/customers`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Customers
              </a>
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Enter the customer's basic contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter customer's full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange("company", e.target.value)}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="customer@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle>Address Information</CardTitle>
                <CardDescription>Enter the customer's billing address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="123 Main Street"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">User Type</Label>
                  <Select value={formData.userType} onValueChange={(value) => handleInputChange("userType", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="wholesale">Wholesale</SelectItem>
                      <SelectItem value="cost">Cost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Business Information */}
            {/* Submit Button */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" asChild>
                <a href="/people/customers">Cancel</a>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Customer
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
                Customer Created Successfully!
              </DialogTitle>
              <DialogDescription>The customer has been added to your system and is ready to use.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleNewCustomer}>
                Add Another Customer
              </Button>
              <Button asChild>
                <a href="/people/customers">View All Customers</a>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
  )
}
