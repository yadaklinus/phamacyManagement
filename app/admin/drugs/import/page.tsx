"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import * as XLSX from 'xlsx'
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
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  Download, 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Trash2
} from "lucide-react"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import { useSession } from "next-auth/react"
import Link from "next/link"
import axios from "axios"
import { toast } from "sonner"

interface ImportRow {
  id: string
  code: string
  name: string
  category: string
  manufacturer: string
  quantity: number
  reorderLevel: number
  price: number
  cost: number
  expiryDate: string
  batchNumber: string
  status: 'valid' | 'invalid' | 'duplicate'
  errors: string[]
}

const sampleData = [
  {
    code: 'PAI001',
    name: 'Paracetamol 500mg',
    category: 'Painkillers',
    manufacturer: 'GSK',
    activeIngredient: 'Paracetamol',
    strength: '500mg',
    dosageForm: 'Tablet',
    quantity: 250,
    reorderLevel: 100,
    cost: 3.50,
    price: 5.00,
    expiryDate: '2026-12-31',
    batchNumber: 'PAR2024001',
    unit: 'Pieces',
    storageConditions: 'Store in cool, dry place',
    prescriptionRequired: false
  },
  {
    code: 'ANT001',
    name: 'Amoxicillin 250mg',
    category: 'Antibiotics',
    manufacturer: 'Pfizer',
    activeIngredient: 'Amoxicillin',
    strength: '250mg',
    dosageForm: 'Capsule',
    quantity: 100,
    reorderLevel: 50,
    cost: 12.00,
    price: 15.00,
    expiryDate: '2025-06-30',
    batchNumber: 'AMX2024001',
    unit: 'Pieces',
    storageConditions: 'Store below 25°C',
    prescriptionRequired: true
  }
]

export default function ImportDrugsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const warehouseId = getWareHouseId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [importData, setImportData] = useState<ImportRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState<{
    total: number
    success: number
    failed: number
    duplicates: number
  } | null>(null)

  const downloadSampleFile = () => {
    const worksheet = XLSX.utils.json_to_sheet(sampleData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Drug Import Template")
    XLSX.writeFile(workbook, "drug_import_template.xlsx")
    toast.success("Sample file downloaded successfully!")
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        const processedData: ImportRow[] = jsonData.map((row: any, index) => {
          const errors: string[] = []
          
          // Validate required fields
          if (!row.name) errors.push('Name is required')
          if (!row.category) errors.push('Category is required')
          if (!row.manufacturer) errors.push('Manufacturer is required')
          if (!row.quantity || row.quantity < 0) errors.push('Valid quantity is required')
          if (!row.reorderLevel || row.reorderLevel < 0) errors.push('Valid reorder level is required')
          if (!row.price || row.price <= 0) errors.push('Valid price is required')
          if (!row.cost || row.cost <= 0) errors.push('Valid cost is required')
          if (!row.expiryDate) errors.push('Expiry date is required')
          if (!row.batchNumber) errors.push('Batch number is required')

          // Validate expiry date
          if (row.expiryDate && new Date(row.expiryDate) < new Date()) {
            errors.push('Expiry date cannot be in the past')
          }

          return {
            id: `import-${index}`,
            code: row.code || `AUTO-${Date.now()}-${index}`,
            name: row.name || '',
            category: row.category || '',
            manufacturer: row.manufacturer || '',
            quantity: parseInt(row.quantity) || 0,
            reorderLevel: parseInt(row.reorderLevel) || 0,
            price: parseFloat(row.price) || 0,
            cost: parseFloat(row.cost) || 0,
            expiryDate: row.expiryDate || '',
            batchNumber: row.batchNumber || '',
            status: errors.length > 0 ? 'invalid' : 'valid',
            errors
          }
        })

        setImportData(processedData)
        toast.success(`Loaded ${processedData.length} rows for import`)
      } catch (error) {
        console.error('Error reading file:', error)
        toast.error('Error reading file. Please check the format.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const removeRow = (id: string) => {
    setImportData(prev => prev.filter(row => row.id !== id))
  }

  const processImport = async () => {
    const validRows = importData.filter(row => row.status === 'valid')
    
    if (validRows.length === 0) {
      toast.error('No valid rows to import')
      return
    }

    setIsProcessing(true)
    setImportProgress(0)

    try {
      let successCount = 0
      let failedCount = 0
      let duplicateCount = 0

      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i]
        
        try {
          const drugData = {
            code: row.code,
            name: row.name,
            category: row.category,
            manufacturer: row.manufacturer,
            quantity: row.quantity,
            reorderLevel: row.reorderLevel,
            price: row.price,
            cost: row.cost,
            expiryDate: row.expiryDate,
            batchNumber: row.batchNumber,
            warehouseId,
            createdBy: session?.user?.id
          }

          const response = await axios.post('/api/drugs/create', drugData)
          
          if (response.data.success) {
            successCount++
          } else if (response.data.message?.includes('duplicate')) {
            duplicateCount++
          } else {
            failedCount++
          }
        } catch (error: any) {
          if (error.response?.data?.message?.includes('duplicate')) {
            duplicateCount++
          } else {
            failedCount++
          }
        }

        setImportProgress(((i + 1) / validRows.length) * 100)
      }

      setImportResults({
        total: validRows.length,
        success: successCount,
        failed: failedCount,
        duplicates: duplicateCount
      })

      toast.success(`Import completed! ${successCount} drugs imported successfully.`)
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Import failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const endpoint = `/warehouse/${warehouseId}/${session?.user?.role}`

  const validRows = importData.filter(row => row.status === 'valid').length
  const invalidRows = importData.filter(row => row.status === 'invalid').length

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
                <BreadcrumbPage>Import Drugs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            <h1 className="text-2xl font-semibold text-blue-600">Import Drugs from CSV/Excel</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href={`${endpoint}/drugs`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Inventory
            </Link>
          </Button>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Import Instructions</CardTitle>
            <CardDescription>Follow these steps to import drugs from a CSV or Excel file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">Step 1: Download Template</h4>
                <p className="text-sm text-muted-foreground">
                  Download our sample template to see the required format and columns.
                </p>
                <Button onClick={downloadSampleFile} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Step 2: Upload Your File</h4>
                <p className="text-sm text-muted-foreground">
                  Upload your CSV or Excel file with drug data in the correct format.
                </p>
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  variant="outline" 
                  size="sm"
                  disabled={isProcessing}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Required Columns:</h4>
              <div className="grid gap-2 md:grid-cols-3 text-sm">
                <div>• name (required)</div>
                <div>• category (required)</div>
                <div>• manufacturer (required)</div>
                <div>• quantity (required)</div>
                <div>• reorderLevel (required)</div>
                <div>• price (required)</div>
                <div>• cost (required)</div>
                <div>• expiryDate (required)</div>
                <div>• batchNumber (required)</div>
                <div>• code (optional)</div>
                <div>• activeIngredient (optional)</div>
                <div>• strength (optional)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Import Progress */}
        {isProcessing && (
          <Card>
            <CardHeader>
              <CardTitle>Import Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={importProgress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Processing... {Math.round(importProgress)}% complete
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Results */}
        {importResults && (
          <Card>
            <CardHeader>
              <CardTitle>Import Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{importResults.total}</div>
                  <div className="text-sm text-muted-foreground">Total Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{importResults.duplicates}</div>
                  <div className="text-sm text-muted-foreground">Duplicates</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Data */}
        {importData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Import Preview</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {validRows} Valid
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-red-600" />
                    {invalidRows} Invalid
                  </span>
                </div>
              </CardTitle>
              <CardDescription>
                Review the data before importing. Fix any errors shown in red.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Showing {importData.length} rows
                  </div>
                  <Button 
                    onClick={processImport}
                    disabled={validRows === 0 || isProcessing}
                  >
                    Import {validRows} Valid Drugs
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Manufacturer</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importData.map((row) => (
                        <TableRow key={row.id} className={row.status === 'invalid' ? 'bg-red-50' : ''}>
                          <TableCell>
                            {row.status === 'valid' ? (
                              <Badge variant="default">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Valid
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="mr-1 h-3 w-3" />
                                Invalid
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{row.code}</TableCell>
                          <TableCell>
                            {row.name}
                            {row.errors.length > 0 && (
                              <div className="text-xs text-red-600 mt-1">
                                {row.errors.join(', ')}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{row.category}</TableCell>
                          <TableCell>{row.manufacturer}</TableCell>
                          <TableCell>{row.quantity}</TableCell>
                          <TableCell>₦{row.price}</TableCell>
                          <TableCell>{row.expiryDate}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRow(row.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}