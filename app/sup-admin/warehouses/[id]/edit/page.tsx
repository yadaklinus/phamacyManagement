"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
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
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Warehouse,
  Save,
  ArrowLeft,
  CheckCircle,
  MapPin,
  Phone,
  Mail,
  User,
  Package,
  AlertTriangle,
} from "lucide-react"
import fetchWareHouseData from "@/hooks/fetch-invidual-data"
import axios from "axios"

// Sample warehouse data (in real app, this would come from API)


export default function EditWarehousePage() {
  const params = useParams()
  const router = useRouter()
  const path = usePathname()

  
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const wareHouseId = path?.split("/")[3]
    
    // Fetch warehouse data using the ID from params
    const { data: warehouseData, loading, error } = fetchWareHouseData(`/api/warehouse/list`,{id:wareHouseId})

    
  
    // Loading state

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    warehouseCode: "",
    address: "",
    phoneNumber: "",
    email: "",
    description: "",
  })

  useEffect(() => {
    const fetchWarehouseData = async () => {
      try {
        const data = warehouseData
        if (data) {
          setFormData({
            name: data?.name,
            warehouseCode: data?.warehouseCode,
            address:data?.address,
            phoneNumber: data?.phoneNumber,
            email: data?.email,
            description: data?.description,
          })
        }
      } catch (error) {
        console.error("Error fetching warehouse data:", error)
      }
    }

    fetchWarehouseData()
  }, [wareHouseId,warehouseData])

  


  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Warehouse name is required"
    }

    if (!formData.warehouseCode.trim()) {
      newErrors.code = "Warehouse code is required"
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required"
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phone = "Phone number is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }


    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
    }
  }

  const hasChanges = () => {
    if (!warehouseData) return false

    return (
      formData.name !== warehouseData.name ||
      formData.warehouseCode !== warehouseData.warehouseCode ||
      formData.address !== warehouseData.address ||
      formData.phoneNumber !== warehouseData.phoneNumber ||
      formData.email !== warehouseData.email ||
      formData.description !== warehouseData.description
    )
  }

  const handleSaveChanges = async () => {
    if (!validateForm()) {
      return
    }

    if (!hasChanges()) {
      alert("No changes to save")
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call to update warehouse
      const updatedWarehouse = {
        ...warehouseData,
        ...formData,
        updatedAt: new Date().toISOString(),
      }

      await axios.put("/api/warehouse",updatedWarehouse)

      console.log("Updating warehouse:", updatedWarehouse)

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setShowSuccessDialog(true)
    } catch (error) {
      console.error("Error updating warehouse:", error)
      alert("Error updating warehouse. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false)
    router.push(`/sup-admin/warehouses/${wareHouseId}`)
  }

  if (loading) {
    return (
      <>
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
       </>
    )
  }

  if (!warehouseData) {
    return (
      <>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Warehouse Not Found</h2>
              <p className="text-muted-foreground mb-4">The requested warehouse could not be found.</p>
              <Button onClick={() => router.push("/sup-admin/warehouses/list")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Warehouses
              </Button>
            </div>
          </div>
        </>
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
                  <BreadcrumbLink href="/sup-admin/dashboard">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/sup-admin/warehouses/list">Warehouses</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/sup-admin/warehouses/${wareHouseId}`}>{warehouseData?.name}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Edit</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Warehouse className="h-6 w-6 text-blue-600" />
              <h1 className="text-3xl font-bold text-blue-600">Edit Warehouse</h1>
              <Badge variant="outline">{warehouseData.warehouseCode}</Badge>
            </div>
            <Button variant="outline" onClick={() => router.push(`/sup-admin/warehouses/${wareHouseId}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Details
            </Button>
          </div>

          {/* Changes Warning */}
          {hasChanges() && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Unsaved Changes</p>
                    <p className="text-sm">You have unsaved changes. Make sure to save before leaving this page.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Basic Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Update warehouse basic details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Warehouse Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className={errors.name ? "border-red-500" : ""}
                      />
                      {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>
                    
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className={errors.phone ? "border-red-500" : ""}
                      />
                      {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={3}
                      placeholder="Brief description of the warehouse..."
                    />
                  </div>

                  
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Address Information
                  </CardTitle>
                  <CardDescription>Update warehouse location details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className={errors.address ? "border-red-500" : ""}
                    />
                    {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                  </div>

                 
                  
                </CardContent>
              </Card>

              {/* Contact Information */}
            
            </div>

            {/* Right Column - Summary & Actions */}
            <div className="space-y-6">
              {/* Current Status */}
             

              {/* Contact Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.phoneNumber || "Not provided"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.email || "Not provided"}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div>{formData.address || "Address not provided"}</div>
                      
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => router.push(`/sup-admin/warehouses/${wareHouseId}`)}>
              Cancel
            </Button>
            <Button onClick={handleSaveChanges} disabled={!hasChanges() || isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
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
                Warehouse Updated Successfully!
              </DialogTitle>
              <DialogDescription>The warehouse "{formData.name}" has been updated successfully.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-4">
              <Button onClick={handleCloseSuccessDialog} className="w-full">
                View Warehouse Details
              </Button>
              <Button variant="outline" onClick={() => router.push("/sup-admin/warehouses/list")} className="w-full">
                Back to Warehouses List
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
  )
}