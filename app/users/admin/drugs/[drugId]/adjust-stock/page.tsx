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
import { Badge } from "@/components/ui/badge"
import { 
  Activity, 
  ArrowLeft,
  Save,
  Plus,
  Minus,
  RotateCcw,
  Package,
  AlertTriangle
} from "lucide-react"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import { Loading } from "@/components/loading"
import { formatCurrency } from "@/lib/utils"
import { useSession } from "next-auth/react"
import Link from "next/link"
import axios from "axios"
import { toast } from "sonner"

interface Drug {
  id: string
  code: string
  name: string
  category: string
  quantity: number
  reorderLevel: number
  price: number
  cost: number
  unit: string
}

const adjustmentTypes = [
  { value: 'in', label: 'Stock In', icon: Plus, color: 'text-green-600' },
  { value: 'out', label: 'Stock Out', icon: Minus, color: 'text-red-600' },
  { value: 'adjustment', label: 'Direct Adjustment', icon: RotateCcw, color: 'text-blue-600' }
]

const adjustmentReasons = {
  in: [
    'New Purchase',
    'Return from Customer',
    'Transfer from Another Location',
    'Correction - Count Error',
    'Donation Received',
    'Other'
  ],
  out: [
    'Sale',
    'Expired - Disposed',
    'Damaged - Disposed',
    'Transfer to Another Location',
    'Correction - Count Error',
    'Theft/Loss',
    'Other'
  ],
  adjustment: [
    'Physical Count Correction',
    'System Error Correction',
    'Audit Adjustment',
    'Reconciliation',
    'Other'
  ]
}

export default function AdjustStockPage() {
  const params = useParams()
  const router = useRouter()
  const drugId = params.drugId as string
  const { data: session } = useSession()
  const warehouseId = getWareHouseId()
  
  const [drugData, setDrugData] = useState<Drug | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [adjustmentData, setAdjustmentData] = useState({
    type: '',
    quantity: '',
    reason: '',
    reference: '',
    notes: ''
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
        setDrugData(response.data.drug)
      } else {
        toast.error('Failed to load drug data')
      }
    } catch (error) {
      console.error('Error loading drug data:', error)
      toast.error('Failed to load drug data')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setAdjustmentData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear reason when type changes
    if (field === 'type') {
      setAdjustmentData(prev => ({
        ...prev,
        reason: ''
      }))
    }
  }

  const calculateNewQuantity = () => {
    if (!drugData || !adjustmentData.quantity) return drugData?.quantity || 0

    const quantity = parseInt(adjustmentData.quantity)
    
    switch (adjustmentData.type) {
      case 'in':
        return drugData.quantity + quantity
      case 'out':
        return Math.max(0, drugData.quantity - quantity)
      case 'adjustment':
        return quantity
      default:
        return drugData.quantity
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!adjustmentData.type || !adjustmentData.quantity || !adjustmentData.reason) {
      toast.error('Please fill in all required fields')
      return
    }

    const quantity = parseInt(adjustmentData.quantity)
    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }

    // Check for insufficient stock on stock out
    if (adjustmentData.type === 'out' && quantity > (drugData?.quantity || 0)) {
      toast.error('Insufficient stock for this operation')
      return
    }

    setSubmitting(true)

    try {
      const response = await axios.post(`/api/drugs/${drugId}/movements`, {
        type: adjustmentData.type,
        quantity: quantity,
        reason: adjustmentData.reason,
        reference: adjustmentData.reference || null,
        notes: adjustmentData.notes || null,
        warehouseId,
        createdBy: session?.user?.id
      })

      if (response.data.success) {
        toast.success('Stock adjustment completed successfully')
        router.push(`${endpoint}/drugs/${drugId}`)
      } else {
        toast.error(response.data.message || 'Failed to adjust stock')
      }
    } catch (error: any) {
      console.error('Error adjusting stock:', error)
      toast.error(error.response?.data?.message || 'Failed to adjust stock')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />

  if (!drugData) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Drug not found</h2>
          <p className="text-muted-foreground">The requested drug could not be found.</p>
          <Button asChild className="mt-4">
            <Link href={`${endpoint}/drugs`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Inventory
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const newQuantity = calculateNewQuantity()
  const selectedType = adjustmentTypes.find(type => type.value === adjustmentData.type)

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
                <BreadcrumbLink href={`${endpoint}/drugs/${drugId}`}>{drugData.name}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Adjust Stock</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <h1 className="text-2xl font-semibold text-blue-600">Adjust Stock</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href={`${endpoint}/drugs/${drugId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Drug Details
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Drug Information */}
          <Card>
            <CardHeader>
              <CardTitle>Drug Information</CardTitle>
              <CardDescription>Current stock details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Drug Name:</span>
                  <span className="text-sm font-bold">{drugData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Drug Code:</span>
                  <span className="text-sm">{drugData.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Category:</span>
                  <Badge variant="outline">{drugData.category}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Current Stock:</span>
                  <span className="text-sm font-bold text-blue-600">
                    {drugData.quantity} {drugData.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Reorder Level:</span>
                  <span className="text-sm">{drugData.reorderLevel} {drugData.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Unit Price:</span>
                  <span className="text-sm">{formatCurrency(drugData.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Current Value:</span>
                  <span className="text-sm font-bold">
                    {formatCurrency(drugData.quantity * drugData.price)}
                  </span>
                </div>
              </div>

              {/* Stock Status Warning */}
              {drugData.quantity <= drugData.reorderLevel && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    This drug is at or below reorder level
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stock Adjustment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Adjustment</CardTitle>
              <CardDescription>Make changes to the current stock level</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Adjustment Type *</Label>
                  <Select value={adjustmentData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select adjustment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {adjustmentTypes.map((type) => {
                        const Icon = type.icon
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${type.color}`} />
                              {type.label}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    {adjustmentData.type === 'adjustment' ? 'New Quantity' : 'Quantity'} *
                  </Label>
                  <Input
                    type="number"
                    value={adjustmentData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    placeholder={adjustmentData.type === 'adjustment' ? 'Enter new total quantity' : 'Enter quantity to adjust'}
                    min="1"
                    required
                  />
                  {adjustmentData.type === 'out' && adjustmentData.quantity && 
                   parseInt(adjustmentData.quantity) > drugData.quantity && (
                    <p className="text-sm text-red-600">
                      Insufficient stock. Available: {drugData.quantity} {drugData.unit}
                    </p>
                  )}
                </div>

                {adjustmentData.type && (
                  <div className="space-y-2">
                    <Label>Reason *</Label>
                    <Select value={adjustmentData.reason} onValueChange={(value) => handleInputChange('reason', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {adjustmentReasons[adjustmentData.type as keyof typeof adjustmentReasons]?.map((reason) => (
                          <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Reference Number</Label>
                  <Input
                    value={adjustmentData.reference}
                    onChange={(e) => handleInputChange('reference', e.target.value)}
                    placeholder="e.g., Invoice #, Transfer #, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={adjustmentData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Additional notes about this adjustment"
                    rows={3}
                  />
                </div>

                {/* Preview */}
                {adjustmentData.type && adjustmentData.quantity && (
                  <Card className="bg-gray-50">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Adjustment Preview</h4>
                        <div className="grid gap-2 text-sm">
                          <div className="flex justify-between">
                            <span>Current Stock:</span>
                            <span>{drugData.quantity} {drugData.unit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Adjustment:</span>
                            <span className={selectedType?.color}>
                              {adjustmentData.type === 'in' && '+'}
                              {adjustmentData.type === 'out' && '-'}
                              {adjustmentData.type === 'adjustment' && '→ '}
                              {adjustmentData.quantity} {drugData.unit}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-medium">
                            <span>New Stock:</span>
                            <span className={newQuantity <= drugData.reorderLevel ? 'text-red-600' : 'text-green-600'}>
                              {newQuantity} {drugData.unit}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>New Value:</span>
                            <span>{formatCurrency(newQuantity * drugData.price)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" asChild className="flex-1">
                    <Link href={`${endpoint}/drugs/${drugId}`}>Cancel</Link>
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting || !adjustmentData.type || !adjustmentData.quantity || !adjustmentData.reason}
                    className="flex-1"
                  >
                    {submitting ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Apply Adjustment
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}