"use client"

import { useState, useEffect } from "react"
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
import { Edit, Save, ArrowLeft } from "lucide-react"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import { Loading } from "@/components/loading"
import { useSession } from "next-auth/react"
import Link from "next/link"
import axios from "axios"
import { toast } from "sonner"

interface DrugFormData {
  code: string
  name: string
  category: string
  manufacturer: string
  description: string
  activeIngredient: string
  strength: string
  dosageForm: string
  quantity: number
  reorderLevel: number
  price: number
  cost: number
  expiryDate: string
  batchNumber: string
  unit: string
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

export default function EditDrugPage() {
  const params = useParams()
  const router = useRouter()
  const drugId = params.drugId as string
  const { data: session } = useSession()
  const warehouseId = getWareHouseId()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState<DrugFormData>({
    code: '',
    name: '',
    category: '',
    manufacturer: '',
    description: '',
    activeIngredient: '',
    strength: '',
    dosageForm: '',
    quantity: 0,
    reorderLevel: 0,
    price: 0,
    cost: 0,
    expiryDate: '',
    batchNumber: '',
    unit: 'Pieces',
    storageConditions: '',
    prescriptionRequired: false
  })

  const endpoint = `/warehouse/${warehouseId}/${session?.user?.role}`

  useEffect(() => {
    loadDrugData()
  }, [drugId, warehouseId])

  const loadDrugData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/drugs/${drugId}?warehouseId=${warehouseId}`)
      
      if (response.data.success) {
        const drug = response.data.drug
        setFormData({
          code: drug.code || '',
          name: drug.name || '',
          category: drug.category || '',
          manufacturer: drug.manufacturer || '',
          description: drug.description || '',
          activeIngredient: drug.activeIngredient || '',
          strength: drug.strength || '',
          dosageForm: drug.dosageForm || '',
          quantity: drug.quantity || 0,
          reorderLevel: drug.reorderLevel || 0,
          price: drug.price || 0,
          cost: drug.cost || 0,
          expiryDate: drug.expiryDate ? new Date(drug.expiryDate).toISOString().split('T')[0] : '',
          batchNumber: drug.batchNumber || '',
          unit: drug.unit || 'Pieces',
          storageConditions: drug.storageConditions || '',
          prescriptionRequired: drug.prescriptionRequired || false
        })
      } else {
        toast.error('Failed to load drug data')
        router.push(`${endpoint}/drugs`)
      }
    } catch (error) {
      console.error('Error loading drug data:', error)
      toast.error('Failed to load drug data')
      router.push(`${endpoint}/drugs`)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof DrugFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await axios.put(`/api/drugs/${drugId}`, {
        ...formData,
        warehouseId
      })
      
      if (response.data.success) {
        toast.success('Drug updated successfully!')
        router.push(`${endpoint}/drugs/${drugId}`)
      } else {
        toast.error(response.data.message || 'Failed to update drug')
      }
    } catch (error: any) {
      console.error('Error updating drug:', error)
      toast.error(error.response?.data?.message || 'Failed to update drug')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />

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
                <BreadcrumbLink href={`${endpoint}/drugs/${drugId}`}>{formData.name}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Edit</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-600" />
            <h1 className="text-2xl font-semibold text-blue-600">Edit Drug</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href={`${endpoint}/drugs/${drugId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Drug Details
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update the basic details of the drug</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Drug Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="Drug code"
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
              <CardDescription>Update stock levels and pricing details</CardDescription>
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
              <CardDescription>Update batch and expiry details</CardDescription>
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
              <Link href={`${endpoint}/drugs/${drugId}`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>Updating...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Drug
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}