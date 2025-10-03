"use client"

import { useState, useEffect, useMemo } from "react"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  AlertTriangle, 
  Search, 
  ArrowLeft,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Download,
  Mail,
  DollarSign,
  Calendar,
  Package,
  FileText
} from "lucide-react"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import fetchWareHouseData from "@/hooks/fetch-invidual-data"
import { Loading } from "@/components/loading"
import { formatCurrency } from "@/lib/utils"
import { useSession } from "next-auth/react"
import Link from "next/link"
import * as XLSX from 'xlsx'
import { toast } from "sonner"
import axios from "axios"

interface ExpiredDrug {
  id: string
  code: string
  name: string
  category: string
  quantity: number
  price: number
  cost: number
  expiryDate: string
  batchNumber: string
  manufacturer: string
  supplier?: string
  daysExpired: number
  isDisposed: boolean
  disposalDate?: string
  disposalMethod?: string
  disposalReason?: string
}

const disposalMethods = [
  "Incineration",
  "Return to Supplier", 
  "Pharmaceutical Waste Disposal",
  "Donation (if applicable)",
  "Other"
]

const disposalReasons = [
  "Expired",
  "Damaged",
  "Recalled",
  "Quality Issues",
  "Other"
]

export default function ExpiredDrugsPage() {
  const { data: session } = useSession()
  const warehouseId = getWareHouseId()
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("days_expired")
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([])
  const [isDisposalDialogOpen, setIsDisposalDialogOpen] = useState(false)
  const [disposalData, setDisposalData] = useState({
    method: '',
    reason: '',
    notes: ''
  })

  const { data: drugsData, loading, error, refetch } = fetchWareHouseData("/api/drugs/expired", { warehouseId })

  const endpoint = `/warehouse/${warehouseId}/${session?.user?.role}`

  // Process expired drugs data
  const processedDrugs = useMemo(() => {
    if (!drugsData) return []
    
    return drugsData.map((drug: any) => {
      const today = new Date()
      const expiryDate = new Date(drug.expiryDate)
      const daysExpired = Math.ceil((today.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        ...drug,
        daysExpired: Math.max(0, daysExpired)
      }
    })
  }, [drugsData])

  // Filter and sort drugs
  const filteredDrugs = useMemo(() => {
    if (!processedDrugs) return []
    
    let filtered = processedDrugs.filter((drug: ExpiredDrug) => {
      const matchesSearch = 
        drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        drug.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        drug.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = categoryFilter === "all" || drug.category === categoryFilter
      
      let matchesStatus = true
      if (statusFilter === "disposed") {
        matchesStatus = drug.isDisposed
      } else if (statusFilter === "pending") {
        matchesStatus = !drug.isDisposed
      }

      return matchesSearch && matchesCategory && matchesStatus
    })

    // Sort
    filtered.sort((a: ExpiredDrug, b: ExpiredDrug) => {
      switch (sortBy) {
        case "days_expired":
          return b.daysExpired - a.daysExpired
        case "quantity":
          return b.quantity - a.quantity
        case "value":
          return (b.quantity * b.price) - (a.quantity * a.price)
        case "name":
          return a.name.localeCompare(b.name)
        case "category":
          return a.category.localeCompare(b.category)
        case "expiry_date":
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        default:
          return b.daysExpired - a.daysExpired
      }
    })

    return filtered
  }, [processedDrugs, searchQuery, categoryFilter, statusFilter, sortBy])

  // Handle bulk selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDrugs(filteredDrugs.filter(drug => !drug.isDisposed).map(drug => drug.id))
    } else {
      setSelectedDrugs([])
    }
  }

  const handleSelectDrug = (drugId: string, checked: boolean) => {
    if (checked) {
      setSelectedDrugs(prev => [...prev, drugId])
    } else {
      setSelectedDrugs(prev => prev.filter(id => id !== drugId))
    }
  }

  // Handle disposal
  const handleBulkDisposal = async () => {
    if (selectedDrugs.length === 0) {
      toast.error("Please select drugs to dispose")
      return
    }

    if (!disposalData.method || !disposalData.reason) {
      toast.error("Please fill in disposal method and reason")
      return
    }

    try {
      const response = await axios.post('/api/drugs/dispose', {
        drugIds: selectedDrugs,
        disposalMethod: disposalData.method,
        disposalReason: disposalData.reason,
        notes: disposalData.notes,
        warehouseId,
        disposedBy: session?.user?.id
      })

      if (response.data.success) {
        toast.success(`${selectedDrugs.length} drugs marked as disposed`)
        setSelectedDrugs([])
        setIsDisposalDialogOpen(false)
        setDisposalData({ method: '', reason: '', notes: '' })
        refetch()
      } else {
        toast.error(response.data.message || 'Failed to dispose drugs')
      }
    } catch (error: any) {
      console.error('Error disposing drugs:', error)
      toast.error(error.response?.data?.message || 'Failed to dispose drugs')
    }
  }

  // Export expired drugs report
  const exportExpiredReport = () => {
    const reportData = filteredDrugs.map((drug: ExpiredDrug) => ({
      Code: drug.code,
      Name: drug.name,
      Category: drug.category,
      Manufacturer: drug.manufacturer,
      'Batch Number': drug.batchNumber,
      'Current Stock': drug.quantity,
      'Unit Price': formatCurrency(drug.price),
      'Total Value': formatCurrency(drug.quantity * drug.price),
      'Expiry Date': drug.expiryDate,
      'Days Expired': drug.daysExpired,
      'Status': drug.isDisposed ? 'DISPOSED' : 'PENDING DISPOSAL',
      'Disposal Date': drug.disposalDate || 'N/A',
      'Disposal Method': drug.disposalMethod || 'N/A',
      'Disposal Reason': drug.disposalReason || 'N/A',
      'Supplier': drug.supplier || 'Not specified'
    }))

    const worksheet = XLSX.utils.json_to_sheet(reportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expired Drugs Report")
    XLSX.writeFile(workbook, `expired_drugs_report_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success("Expired drugs report exported successfully!")
  }

  // Get unique categories
  const categories = useMemo(() => {
    if (!processedDrugs) return []
    return [...new Set(processedDrugs.map((drug: ExpiredDrug) => drug.category))]
  }, [processedDrugs])

  // Statistics
  const stats = useMemo(() => {
    if (!processedDrugs) return { total: 0, disposed: 0, pending: 0, totalValue: 0, lossValue: 0 }
    
    const total = processedDrugs.length
    const disposed = processedDrugs.filter(drug => drug.isDisposed).length
    const pending = processedDrugs.filter(drug => !drug.isDisposed).length
    const totalValue = processedDrugs.reduce((sum, drug) => sum + (drug.quantity * drug.price), 0)
    const lossValue = processedDrugs.filter(drug => !drug.isDisposed).reduce((sum, drug) => sum + (drug.quantity * drug.price), 0)

    return { total, disposed, pending, totalValue, lossValue }
  }, [processedDrugs])

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
                <BreadcrumbPage>Expired Drugs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h1 className="text-2xl font-semibold text-red-600">Expired Drugs Management</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportExpiredReport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Email Report
            </Button>
            {selectedDrugs.length > 0 && (
              <Dialog open={isDisposalDialogOpen} onOpenChange={setIsDisposalDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Dispose Selected ({selectedDrugs.length})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Dispose Expired Drugs</DialogTitle>
                    <DialogDescription>
                      Record the disposal of {selectedDrugs.length} selected expired drugs.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Disposal Method *</Label>
                      <Select value={disposalData.method} onValueChange={(value) => 
                        setDisposalData(prev => ({ ...prev, method: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Select disposal method" />
                        </SelectTrigger>
                        <SelectContent>
                          {disposalMethods.map((method) => (
                            <SelectItem key={method} value={method}>{method}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Disposal Reason *</Label>
                      <Select value={disposalData.reason} onValueChange={(value) => 
                        setDisposalData(prev => ({ ...prev, reason: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Select disposal reason" />
                        </SelectTrigger>
                        <SelectContent>
                          {disposalReasons.map((reason) => (
                            <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Input
                        value={disposalData.notes}
                        onChange={(e) => setDisposalData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes about disposal"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDisposalDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleBulkDisposal}>
                      Dispose Drugs
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Button variant="outline" asChild>
              <Link href={`${endpoint}/drugs`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Inventory
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expired</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Expired items</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disposed</CardTitle>
              <Trash2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.disposed}</div>
              <p className="text-xs text-muted-foreground">Already disposed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Disposal</CardTitle>
              <Package className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting disposal</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalValue)}</div>
              <p className="text-xs text-muted-foreground">All expired items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loss Value</CardTitle>
              <DollarSign className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.lossValue)}</div>
              <p className="text-xs text-muted-foreground">Pending disposal</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Expired Drugs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search drugs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending Disposal</SelectItem>
                    <SelectItem value="disposed">Disposed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days_expired">Days Expired</SelectItem>
                    <SelectItem value="quantity">Stock Quantity</SelectItem>
                    <SelectItem value="value">Total Value</SelectItem>
                    <SelectItem value="name">Drug Name</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="expiry_date">Expiry Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expired Drugs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Expired Drugs</span>
              {filteredDrugs.filter(drug => !drug.isDisposed).length > 0 && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedDrugs.length === filteredDrugs.filter(drug => !drug.isDisposed).length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label className="text-sm">Select All</Label>
                </div>
              )}
            </CardTitle>
            <CardDescription>
              Showing {filteredDrugs.length} expired drugs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Select</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Drug</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Days Expired</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrugs.map((drug: ExpiredDrug) => (
                  <TableRow key={drug.id} className="bg-red-50">
                    <TableCell>
                      {!drug.isDisposed && (
                        <Checkbox
                          checked={selectedDrugs.includes(drug.id)}
                          onCheckedChange={(checked) => handleSelectDrug(drug.id, checked as boolean)}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={drug.isDisposed ? "default" : "destructive"}>
                        {drug.isDisposed ? "🗑️ Disposed" : "🔴 Expired"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{drug.name}</div>
                        <div className="text-sm text-muted-foreground">{drug.code}</div>
                      </div>
                    </TableCell>
                    <TableCell>{drug.category}</TableCell>
                    <TableCell>{drug.batchNumber}</TableCell>
                    <TableCell>
                      <span className="font-medium text-red-600">{drug.quantity}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-red-600">
                        {formatCurrency(drug.quantity * drug.price)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-red-600 font-medium">
                        {new Date(drug.expiryDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        {drug.daysExpired} days
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`${endpoint}/drugs/${drug.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {drug.isDisposed && (
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              Disposal Record
                            </DropdownMenuItem>
                          )}
                          {!drug.isDisposed && (
                            <>
                              <DropdownMenuItem asChild>
                                <Link href={`${endpoint}/drugs/${drug.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Drug
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedDrugs([drug.id])
                                  setIsDisposalDialogOpen(true)
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Mark as Disposed
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}