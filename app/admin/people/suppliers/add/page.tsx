"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

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
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Truck, Save, ArrowLeft, Check } from "lucide-react"
import toast from "react-hot-toast"
import { useSession } from "next-auth/react"
import { getWareHouseId } from "@/hooks/get-werehouseId"

export default function AddSupplierPage() {
  const params = useParams()
  const router = useRouter()
  const [endPoint, setEndPoint] = useState("")
  const warehouseId = getWareHouseId()
  
    const {data:session} = useSession()

  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    address: "",
    type: "COMPANY",
  })

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

    try {
      const response = await fetch('/api/supplier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          warehousesId: warehouseId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create supplier')
      }

      const result = await response.json()
      setShowSuccessDialog(true)
      toast.success("Supplier created successfully!")
    } catch (error) {
      console.error('Error creating supplier:', error)
      toast.error("Failed to create supplier. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNewSupplier = () => {
    setFormData({
      name: "",
      companyName: "",
      email: "",
      phone: "",
      address: "",
      type: "COMPANY",
    })
    setShowSuccessDialog(false)
  }

  const handleViewSuppliers = () => {
    router.push(`${endPoint}/people/suppliers`)
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
                  <BreadcrumbLink href={`${endPoint}/dashboard`}>Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`${endPoint}/people/suppliers`}>Suppliers</BreadcrumbLink>
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
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Suppliers
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Supplier Information</CardTitle>
                <CardDescription>Enter the supplier's contact and business details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Contact Person Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter contact person name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange("companyName", e.target.value)}
                      placeholder="Enter company name (optional)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="supplier@example.com"
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
                  <div className="space-y-2">
                    <Label htmlFor="type">Supplier Type *</Label>
                    <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COMPANY">Company</SelectItem>
                        <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                        <SelectItem value="GOVERNMENT">Government</SelectItem>
                        <SelectItem value="NON_PROFIT">Non-Profit</SelectItem>
                        <SelectItem value="retal">Retail</SelectItem>
                        <SelectItem value="wholesale">Wholesale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Enter full business address"
                    rows={3}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
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
              <DialogDescription>The supplier has been added to your system and is ready to use.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleNewSupplier}>
                Add Another Supplier
              </Button>
              <Button onClick={handleViewSuppliers}>
                View All Suppliers
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
  )
}