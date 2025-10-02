"use client"

import React, { useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Warehouse, MapPin, Users, Package, Building } from "lucide-react"
import fetchData from "@/hooks/fetch-data"
import axios from "axios"
import toast from "react-hot-toast"
import { Loading } from "@/components/loading"

// Sample users for assignment
const availableUsers = [
  { id: "USR-001", name: "John Manager", role: "manager", email: "john@inventorypro.com" },
  { id: "USR-002", name: "Jane Staff", role: "staff", email: "jane@inventorypro.com" },
  { id: "USR-003", name: "Mike Clerk", role: "staff", email: "mike@inventorypro.com" },
  { id: "USR-004", name: "Sarah Admin", role: "admin", email: "sarah@inventorypro.com" },
  { id: "USR-005", name: "Tom Worker", role: "staff", email: "tom@inventorypro.com" },
]

export default function AddWarehousePage() {
  const initial = {
    code: "",
    name: "",
    address: "",
    phone: "",
    email: "",
    description: "",
    status: "active",
    isDefault: false,
  }
  const [formData, setFormData] = useState(initial)

  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId))
    }
  }

  const {data,loading,error} = fetchData("/api/warehouse")

  if (loading) return <Loading/>
if (error) return <h1 className="text-red-500">Error loading warehouses.</h1>
if (!data) return <h1>No data available.</h1>

  const generateWarehouseCode = () => {
    const codes = ["wh"]
    const Num = data.length + 1
    setFormData((prev) => ({
      ...prev,
      code: `${codes}${String(Num).padStart(3, "0")}`,
    }))
  }

  async function handleFormSubmit(e:React.ChangeEvent<HTMLFormElement>){
    e.preventDefault()
    const res = await axios.post("/api/warehouse",{formData})
    console.log(res.data)
    if(res.status === 201){
      toast.success("Created new WareHouse")
      setFormData(initial)
    }
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
                  <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/warehouses/list">Warehouses</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Add Warehouse</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <form onSubmit={handleFormSubmit}>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 mb-4">
            <Warehouse className="h-5 w-5 text-blue-600" />
            <h1 className="text-2xl font-semibold text-blue-600">Add New Warehouse</h1>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Warehouse Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>Enter the warehouse basic details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="code">Warehouse Code *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="code"
                          placeholder="WH-001"
                          value={formData.code}
                          onChange={(e) => handleInputChange("code", e.target.value)}
                          className="flex-1"
                          disabled
                        />
                        <Button type="button" variant="outline" onClick={generateWarehouseCode}>
                          Generate
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Unique identifier for the warehouse</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Warehouse Name *</Label>
                      <Input
                        id="name"
                        placeholder="Main Warehouse"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="warehouse@company.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter warehouse description..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location Details
                  </CardTitle>
                  <CardDescription>Enter the warehouse address and location</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      placeholder="123 Warehouse District"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                    />
                  </div>

                  
                </CardContent>
              </Card>

              {/* <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Assignment
                  </CardTitle>
                  <CardDescription>Assign users to this warehouse</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {availableUsers.map((user) => (
                      <div key={user.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={user.id}
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={user.id} className="font-medium cursor-pointer">
                              {user.name}
                            </Label>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">{user.role}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Selected users will have access to manage inventory in this warehouse
                  </p>
                </CardContent>
              </Card> */}
            </div>

            {/* Right Column - Settings & Summary */}
            <div className="space-y-6">
              {/* <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Warehouse Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="manager">Warehouse Manager</Label>
                    <Select value={formData.manager} onValueChange={(value) => handleInputChange("manager", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers
                          .filter((user) => user.role === "manager" || user.role === "admin")
                          .map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.role})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capacity">Storage Capacity (sq ft)</Label>
                    <Input
                      id="capacity"
                      type="number"
                      placeholder="10000"
                      value={formData.capacity}
                      onChange={(e) => handleInputChange("capacity", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isDefault"
                      checked={formData.isDefault}
                      onCheckedChange={(checked) => handleInputChange("isDefault", checked)}
                    />
                    <Label htmlFor="isDefault">Set as Default Warehouse</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Default warehouse will be pre-selected in transactions
                  </p>
                </CardContent>
              </Card> */}

              <Card>
                <CardHeader>
                  <CardTitle>Warehouse Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Code:</span>
                    <span className="font-mono">{formData.code || "..."}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Name:</span>
                    <span>{formData.name || "..."}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Status:</span>
                    <span className="capitalize">{formData.status}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Default:</span>
                    <span>{formData.isDefault ? "Yes" : "No"}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-8">
            <Button variant="outline">Cancel</Button>
            <Button
              type="submit"
              disabled={
                !formData.code || !formData.name || !formData.address  
              }
            >
              Create Warehouse
            </Button>
          </div>
        </div>
        </form>
      </>
  )
}
