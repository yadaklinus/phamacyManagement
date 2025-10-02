"use client"

import React, { useEffect, useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import { UserPlus, Eye, EyeOff } from "lucide-react"
import fetchData from "@/hooks/fetch-data"
import axios from "axios"
import toast from "react-hot-toast"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import { useSession } from "next-auth/react"
import { useOnlineStatus } from "@/hooks/check-online"

// Sample warehouses data

export default function AddUserPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [endPoint, setEndPoint] = useState("")
  const {data:session} = useSession()

  const {online} = useOnlineStatus()

  const warehouseId = getWareHouseId()
  const initField = {
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "",
    warehouse:warehouseId,
  }
  const [formData, setFormData] = useState(initField)
  useEffect(()=>{
      setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
    },[session,warehouseId])
 
  
    if (!warehouseId) return <h1>Loading...</h1>
  
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData((prev) => ({
      ...prev,
      password: password,
      confirmPassword: password,
    }))
  }

  async function handleFormSubmit(e:React.ChangeEvent<HTMLFormElement>){
    e.preventDefault()
    
    await axios.post("/api/users",{formData}).then((res)=>{
      if(res.status == 201){
        toast.success("User Created")
        setFormData(initField)
      }
    }).catch((error)=>{
      if(error.response){
        if(error.response.status == 401){
          toast.error("Username Exists")
        }
        if(error.response.status == 500){
          toast.error("Error")
        }
        if(error.response.status == 200){
          toast.success("User Created")
          setFormData(initField)
        }
      }
    })
    
   

    // 

  }

  if(!online){
    return(
      <>
        <div className="flex flex-1 items-center justify-center">
                  <Card className="w-96">
                    <CardHeader>
                      <CardTitle className="text-red-600">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{'Create User When Online'}</p>
                    </CardContent>
                  </Card>
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
                  <BreadcrumbLink href={`${endPoint}/dashboard`}>Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`${endPoint}/people/users`}>Users</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Add User</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <form onSubmit={handleFormSubmit}>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-5 w-5 text-blue-600" />
            <h1 className="text-2xl font-semibold text-blue-600">Add New User</h1>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - User Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Enter the user's personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Set up the user's login credentials</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      placeholder="Enter username"
                      value={formData.username}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Username must be unique and contain only letters, numbers, and underscores
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password"
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={generatePassword}>
                      Generate Password
                    </Button>
                    <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Role & Permissions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Role & Permissions</CardTitle>
                  <CardDescription>Assign user role and warehouse access</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">User Role *</Label>
                    <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="purchase">Purchase</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>
                        <strong>Administrator:</strong> Full system access
                      </p>
                      <p>
                        <strong>Manager:</strong> Manage inventory and reports
                      </p>
                      <p>
                        <strong>Staff:</strong> Basic operations only
                      </p>
                    </div>
                  </div>

                 

                  
                 
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  
                  <div className="flex justify-between text-sm">
                    <span>Username:</span>
                    <span>{formData.username || "..."}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Email:</span>
                    <span>{formData.email || "..."}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Role:</span>
                    <span className="capitalize">{formData.role || "..."}</span>
                  </div>
                  
                 
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-8">
            <Button variant="outline">Cancel</Button>
            <Button
              disabled={
               
                !formData.username ||
                !formData.email ||
                !formData.password ||
                !formData.confirmPassword ||
                !formData.role ||
                !formData.warehouse ||
                formData.password !== formData.confirmPassword
              }
              type="submit"
            >
              Create User
            </Button>
          </div>
        </div>
        </form>
      </>
  )
}
