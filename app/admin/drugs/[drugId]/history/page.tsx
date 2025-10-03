"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
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
import { 
  FileText, 
  ArrowLeft,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  Package,
  DollarSign
} from "lucide-react"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import { Loading } from "@/components/loading"
import { formatCurrency } from "@/lib/utils"
import { useSession } from "next-auth/react"
import Link from "next/link"
import axios from "axios"
import * as XLSX from 'xlsx'
import { toast } from "sonner"

interface Drug {
  id: string
  code: string
  name: string
  category: string
  unit: string
}

interface StockMovement {
  id: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  reason: string
  reference?: string
  notes?: string
  balanceAfter: number
  createdAt: string
  createdBy: string
}

interface UsageStats {
  totalIn: number
  totalOut: number
  totalAdjustments: number
  averageMonthlyUsage: number
  peakUsageMonth: string
  currentTrend: 'increasing' | 'decreasing' | 'stable'
}

export default function DrugHistoryPage() {
  const params = useParams()
  const drugId = params.drugId as string
  const { data: session } = useSession()
  const warehouseId = getWareHouseId()
  
  const [drugData, setDrugData] = useState<Drug | null>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const endpoint = `/warehouse/${warehouseId}/${session?.user?.role}`

  useEffect(() => {
    loadData()
  }, [drugId, warehouseId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [drugResponse, movementsResponse] = await Promise.all([
        axios.get(`/api/drugs/${drugId}?warehouseId=${warehouseId}`),
        axios.get(`/api/drugs/${drugId}/movements?warehouseId=${warehouseId}`)
      ])

      if (drugResponse.data.success) {
        setDrugData(drugResponse.data.drug)
      }

      if (movementsResponse.data.success) {
        const movementData = movementsResponse.data.movements || []
        setMovements(movementData)
        calculateUsageStats(movementData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load drug history')
    } finally {
      setLoading(false)
    }
  }

  const calculateUsageStats = (movementData: StockMovement[]) => {
    const totalIn = movementData
      .filter(m => m.type === 'in')
      .reduce((sum, m) => sum + m.quantity, 0)

    const totalOut = movementData
      .filter(m => m.type === 'out')
      .reduce((sum, m) => sum + Math.abs(m.quantity), 0)

    const totalAdjustments = movementData
      .filter(m => m.type === 'adjustment').length

    // Calculate monthly usage (simplified)
    const monthsOfData = Math.max(1, Math.ceil(movementData.length / 10)) // Rough estimate
    const averageMonthlyUsage = totalOut / monthsOfData

    // Determine trend (simplified)
    const recentMovements = movementData.slice(0, 10)
    const olderMovements = movementData.slice(10, 20)
    const recentOut = recentMovements.filter(m => m.type === 'out').length
    const olderOut = olderMovements.filter(m => m.type === 'out').length
    
    let currentTrend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    if (recentOut > olderOut * 1.2) currentTrend = 'increasing'
    else if (recentOut < olderOut * 0.8) currentTrend = 'decreasing'

    setUsageStats({
      totalIn,
      totalOut,
      totalAdjustments,
      averageMonthlyUsage,
      peakUsageMonth: 'Current', // Simplified
      currentTrend
    })
  }

  // Filter movements
  const filteredMovements = movements.filter(movement => {
    const matchesType = typeFilter === "all" || movement.type === typeFilter
    const matchesSearch = 
      movement.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.createdBy.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesDate = true
    if (dateFilter !== "all") {
      const movementDate = new Date(movement.createdAt)
      const now = new Date()
      
      switch (dateFilter) {
        case "7days":
          matchesDate = movementDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "30days":
          matchesDate = movementDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case "90days":
          matchesDate = movementDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
      }
    }

    return matchesType && matchesSearch && matchesDate
  })

  // Export history
  const exportHistory = () => {
    if (!drugData) return

    const exportData = filteredMovements.map(movement => ({
      Date: new Date(movement.createdAt).toLocaleString(),
      Type: movement.type === 'in' ? 'Stock In' : 
            movement.type === 'out' ? 'Stock Out' : 'Adjustment',
      Quantity: movement.quantity,
      Reason: movement.reason,
      Reference: movement.reference || '',
      'Balance After': movement.balanceAfter,
      'Created By': movement.createdBy,
      Notes: movement.notes || ''
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Drug History")
    XLSX.writeFile(workbook, `${drugData.code}_${drugData.name}_history_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success("Drug history exported successfully!")
  }

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'in':
        return <Badge variant="default" className="bg-green-500">Stock In</Badge>
      case 'out':
        return <Badge variant="secondary" className="bg-red-500 text-white">Stock Out</Badge>
      case 'adjustment':
        return <Badge variant="outline">Adjustment</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-500" />
      default:
        return <Activity className="h-4 w-4 text-blue-500" />
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
                <BreadcrumbPage>Usage History</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <h1 className="text-2xl font-semibold text-blue-600">Usage History</h1>
              <p className="text-muted-foreground">{drugData.name} ({drugData.code})</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportHistory}>
              <Download className="mr-2 h-4 w-4" />
              Export History
            </Button>
            <Button variant="outline" asChild>
              <Link href={`${endpoint}/drugs/${drugId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Drug Details
              </Link>
            </Button>
          </div>
        </div>

        {/* Usage Statistics */}
        {usageStats && (
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Stock In</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{usageStats.totalIn}</div>
                <p className="text-xs text-muted-foreground">Total received</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Stock Out</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{usageStats.totalOut}</div>
                <p className="text-xs text-muted-foreground">Total dispensed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Adjustments</CardTitle>
                <Activity className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{usageStats.totalAdjustments}</div>
                <p className="text-xs text-muted-foreground">Stock adjustments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
                <Calendar className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(usageStats.averageMonthlyUsage)}
                </div>
                <p className="text-xs text-muted-foreground">Average per month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usage Trend</CardTitle>
                {getTrendIcon(usageStats.currentTrend)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {usageStats.currentTrend}
                </div>
                <p className="text-xs text-muted-foreground">Current trend</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <Input
                  placeholder="Search by reason, reference, or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Movement Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="in">Stock In</SelectItem>
                    <SelectItem value="out">Stock Out</SelectItem>
                    <SelectItem value="adjustment">Adjustments</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Total Movements</Label>
                <div className="text-2xl font-bold text-blue-600">
                  {filteredMovements.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Movement History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Movement History</CardTitle>
            <CardDescription>
              Detailed history of all stock movements for this drug
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredMovements.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Balance After</TableHead>
                    <TableHead>Created By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {new Date(movement.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(movement.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getMovementBadge(movement.type)}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          movement.type === 'in' ? 'text-green-600' : 
                          movement.type === 'out' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {movement.type === 'in' ? '+' : 
                           movement.type === 'out' ? '-' : ''}
                          {Math.abs(movement.quantity)} {drugData.unit}
                        </span>
                      </TableCell>
                      <TableCell>{movement.reason}</TableCell>
                      <TableCell>{movement.reference || '-'}</TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {movement.balanceAfter} {drugData.unit}
                        </span>
                      </TableCell>
                      <TableCell>{movement.createdBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No movement history found for the selected filters.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}