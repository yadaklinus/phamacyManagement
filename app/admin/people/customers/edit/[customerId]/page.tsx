"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { UserCheck, Save, ArrowLeft, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import { Loading } from "@/components/loading"
import toast from "react-hot-toast"

interface CustomerData {
  id: string
  name: string
  type: string
  companyName?: string
  email?: string
  address?: string
  phone: string
}

export default function EditCustomerPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const warehouseId = getWareHouseId()
  const customerId = params.customerId as string

  const [formData, setFormData] = useState<CustomerData>({
    id: '',
    name: '',
    type: '',
    companyName: '',
    email: '',
    address: '',
    phone: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [endPoint, setEndPoint] = useState("")

  useEffect(() => {
    setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
  }, [session, warehouseId])

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await fetch(`/api/customer/${customerId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch customer')
        }
        const customer = await response.json()
        setFormData(customer)
      } catch (error) {
        console.error('Error fetching customer:', error)
        toast.error('Failed to load customer data')
        router.back()
      } finally {
        setLoading(false)
      }
    }

    if (customerId) {
      fetchCustomer()
    }
  }, [customerId, router])

  const handleInputChange = (field: keyof CustomerData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/customer/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          warehouseId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update customer')
      }

      toast.success('Customer updated successfully!')
      router.push(`${endPoint}/people/customers`)
    } catch (error) {
      console.error('Error updating customer:', error)
      toast.error('Failed to update customer')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Loading />
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
                  <BreadcrumbPage>Edit Customer</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => router.back()}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <UserCheck className="h-5 w-5 text-blue-600" />
              <h1 className="text-2xl font-semibold text-blue-600">Edit Customer</h1>
            </div>
          </div>

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>
                Update the customer details below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter customer name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Customer Type</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => handleInputChange('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                        <SelectItem value="COMPANY">Company</SelectItem>
                        <SelectItem value="GOVERNMENT">Government</SelectItem>
                        <SelectItem value="NON_PROFIT">Non-Profit</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="wholesale">Wholesale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(formData.type === 'COMPANY' || formData.type === 'GOVERNMENT' || formData.type === 'NON_PROFIT') && (
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName || ''}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      placeholder="Enter company name"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter customer address"
                    rows={3}
                  />
                </div>

                <div className="flex gap-4">
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update Customer
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.back()}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
     </>
  )
}