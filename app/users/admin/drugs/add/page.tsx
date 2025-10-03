"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Package, Save, ArrowLeft } from "lucide-react"

import { useSession } from "next-auth/react"
import Link from "next/link"
import axios from "axios"
import { toast } from "react-hot-toast"

interface DrugFormData {
  code: string
  name: string
  category: string
  manufacturer: string
  description: string
  quantity: number
  reorderLevel: number
  price: number
  cost: number
  expiryDate: string
  batchNumber: string
  unit: string
  dosageForm: string
  strength: string
  activeIngredient: string
  storageConditions: string
  prescriptionRequired: boolean
}

const drugCategories = [
  "Painkillers",
  "Antibiotics", 
  "Antimalarial",
  "Vitamins",
  "Diabetes",
  "Hypertension",
  "Respiratory",
  "Gastrointestinal",
  "Dermatological",
  "Cardiovascular",
  "Neurological",
  "Hormonal",
  "Antiseptic",
  "Emergency",
  "Other"
]

const dosageForms = [
  "Tablet",
  "Capsule", 
  "Syrup",
  "Injection",
  "Cream",
  "Ointment",
  "Drops",
  "Inhaler",
  "Patch",
  "Suppository"
]

const units = [
  "Pieces",
  "Bottles",
  "Boxes",
  "Vials",
  "Tubes",
  "Sachets",
  "Strips"
]

export default function AddDrugPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState<DrugFormData>({
    code: '',
    name: '',
    category: '',
    manufacturer: '',
    description: '',
    quantity: 0,
    reorderLevel: 0,
    price: 0,
    cost: 0,
    expiryDate: '',
    batchNumber: '',
    unit: 'Pieces',
    dosageForm: '',
    strength: '',
    activeIngredient: '',
    storageConditions: '',
    prescriptionRequired: false
  })

  const handleInputChange = (field: keyof DrugFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const generateDrugCode = () => {
    const prefix = formData.category ? formData.category.substring(0, 3).toUpperCase() : 'DRG'
    const timestamp = Date.now().toString().slice(-6)
    return `${prefix}${timestamp}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Generate code if not provided
      const drugCode = formData.code || generateDrugCode()
      
      const drugData = {
        ...formData,
        code: drugCode,
        
        createdBy: session?.user?.id
      }

      const response = await axios.post('/api/drugs/create', drugData)
      
      if (response.data.success) {
        toast.success('Drug added successfully!')
        router.push(`/warehouse/${session?.user?.role}/drugs`)
      } else {
        toast.error(response.data.message || 'Failed to add drug')
      }
    } catch (error: any) {
      console.error('Error adding drug:', error)
      toast.error(error.response?.data?.message || 'Failed to add drug')
    } finally {
      setLoading(false)
    }
  }

  const endpoint = `/warehouse/${session?.user?.role}`

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
                <BreadcrumbLink href={`${endpoint}/drugs`}>Drug Inventory</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Add Drug</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            <h1 className="text-2xl font-semibold text-blue-600">Add New Drug</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href={`${endpoint}/drugs`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Inventory
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the basic details of the drug</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Drug Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="Auto-generated if empty"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Drug Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter drug name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {drugCategories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer *</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                  placeholder="Enter manufacturer name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="activeIngredient">Active Ingredient</Label>
                <Input
                  id="activeIngredient"
                  value={formData.activeIngredient}
                  onChange={(e) => handleInputChange('activeIngredient', e.target.value)}
                  placeholder="Enter active ingredient"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="strength">Strength/Dosage</Label>
                <Input
                  id="strength"
                  value={formData.strength}
                  onChange={(e) => handleInputChange('strength', e.target.value)}
                  placeholder="e.g., 500mg, 10ml"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dosageForm">Dosage Form</Label>
                <Select value={formData.dosageForm} onValueChange={(value) => handleInputChange('dosageForm', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dosage form" />
                  </SelectTrigger>
                  <SelectContent>
                    {dosageForms.map((form) => (
                      <SelectItem key={form} value={form}>{form}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter drug description"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Stock & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Stock & Pricing Information</CardTitle>
              <CardDescription>Set stock levels and pricing details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">Current Stock *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                  placeholder="Enter current stock"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reorderLevel">Reorder Level *</Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  value={formData.reorderLevel}
                  onChange={(e) => handleInputChange('reorderLevel', parseInt(e.target.value) || 0)}
                  placeholder="Enter reorder level"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Cost Price *</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
                  placeholder="Enter cost price"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Selling Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  placeholder="Enter selling price"
                  min="0"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Batch & Expiry */}
          <Card>
            <CardHeader>
              <CardTitle>Batch & Expiry Information</CardTitle>
              <CardDescription>Enter batch and expiry details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="batchNumber">Batch Number *</Label>
                <Input
                  id="batchNumber"
                  value={formData.batchNumber}
                  onChange={(e) => handleInputChange('batchNumber', e.target.value)}
                  placeholder="Enter batch number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="storageConditions">Storage Conditions</Label>
                <Textarea
                  id="storageConditions"
                  value={formData.storageConditions}
                  onChange={(e) => handleInputChange('storageConditions', e.target.value)}
                  placeholder="e.g., Store in cool, dry place. Keep away from direct sunlight."
                  rows={2}
                />
              </div>

              <div className="md:col-span-2 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="prescriptionRequired"
                  checked={formData.prescriptionRequired}
                  onChange={(e) => handleInputChange('prescriptionRequired', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="prescriptionRequired">Prescription Required</Label>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href={`${endpoint}/drugs`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>Loading...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Add Drug
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}