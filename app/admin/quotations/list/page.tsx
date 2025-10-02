"use client"

import { useState, useEffect } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Quote,
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  ShoppingCart,
  Printer,
  RefreshCw,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import { Loading } from "@/components/loading"
import { formatCurrency } from "@/lib/utils"
import { useSession } from "next-auth/react"
import axios from "axios"
import { usePrintReceipt } from "@/hooks/use-print-quote"


interface Quotation {
  id: string
  quotationNo: string
  selectedCustomer: {
    id: string
    name: string
    email: string
    phone: string
  }
  grandTotal: number
  status: string
  validUntil: string | null
  createdAt: string
  quotationItems: Array<{
    id: string
    productName: string
    quantity: number
    selectedPrice: number
    total: number
  }>
}

export default function QuotationsListPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [endPoint, setEndPoint] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [quotationToDelete, setQuotationToDelete] = useState<string | null>(null)
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [quotationToConvert, setQuotationToConvert] = useState<Quotation | null>(null)
  const { data: session } = useSession()
  const router = useRouter()
  const warehouseId = getWareHouseId()
  const { printReceipt } = usePrintReceipt()

  useEffect(() => {
    setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
  }, [session, warehouseId])

  const fetchQuotations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        warehouseId,
        page: "1",
        limit: "1000", // Load all quotations for client-side filtering
      })

      const response = await axios.get(`/api/quotation/list?${params}`)
      console.log(response.data.quotations)
      setQuotations(response.data.quotations)
    } catch (error) {
      console.error("Error fetching quotations:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (warehouseId) {
      fetchQuotations()
    }
  }, [warehouseId])

  const filteredQuotations = quotations.filter((quotation: Quotation) => {
    const matchesSearch =
      quotation.quotationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.selectedCustomer?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || quotation.status === statusFilter

    const quotationDate = new Date(quotation.createdAt)
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    let matchesDate = true
    if (dateFilter === "today") {
      matchesDate = quotationDate.toDateString() === today.toDateString()
    } else if (dateFilter === "yesterday") {
      matchesDate = quotationDate.toDateString() === yesterday.toDateString()
    } else if (dateFilter === "this-week") {
      matchesDate = quotationDate >= weekStart
    } else if (dateFilter === "this-month") {
      matchesDate = quotationDate >= monthStart
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  const handlePrintReceipt = (id:string,paperWidth: "57mm" | "80mm" | "A4") => {

    const completedQuotation = quotations.find((x:any)=>x.id == id)
        if (!completedQuotation) return

        const dateObj = new Date(completedQuotation.createdAt);
      const formattedDate = dateObj.toISOString().split("T")[0];
      const formattedTime = dateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    
        const receiptData = {
          invoiceNo: completedQuotation.quotationNo,
          date: formattedDate,
          time: formattedTime,
          customer: completedQuotation.selectedCustomer.name,
         
          items: completedQuotation.quotationItems.map((item:any) => ({
            name: item.productName,
            quantity: item.quantity,
            price: parseInt(item.selectedPrice),
            total: item.total,
          })),
          discount: 0,
          
          total:completedQuotation.grandTotal,
        }
    
        printReceipt(receiptData, paperWidth)
      }

  const handleDelete = async (quotationNo: string) => {
    try {
      await axios.delete(`/api/quotation/delete?quotationNo=${quotationNo}`)
      fetchQuotations()
      setDeleteDialogOpen(false)
      setQuotationToDelete(null)
    } catch (error) {
      console.error("Error deleting quotation:", error)
      alert("Error deleting quotation")
    }
  }

  const handleConvertToSale = async (quotation: Quotation) => {
    try {
      const response = await axios.post("/api/quotation/convert", {
        quotationNo: quotation.quotationNo,
        paymentMethods: [],
        amountPaid: quotation.grandTotal,
        balance: 0
      })

      if (response.status === 201) {
        alert(`Quotation converted to sale successfully! Invoice: ${response.data.invoiceNo}`)
        fetchQuotations()
        setConvertDialogOpen(false)
        setQuotationToConvert(null)
        router.push(`${endPoint}/sales/${response.data.invoiceNo}`)
      }
    } catch (error) {
      console.error("Error converting quotation:", error)
      alert("Error converting quotation to sale")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary" as const },
      accepted: { label: "Accepted", variant: "default" as const },
      rejected: { label: "Rejected", variant: "destructive" as const },
      converted: { label: "Converted", variant: "outline" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false
    return new Date(validUntil) < new Date()
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
                <BreadcrumbLink href={`${endPoint}/dashboard`}>Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Quotations</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Quote className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold text-blue-600">Quotations</h1>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotations</CardTitle>
            <Quote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(filteredQuotations.reduce((sum, quotation) => sum + quotation.grandTotal, 0))}</div>
            <p className="text-xs text-muted-foreground">{filteredQuotations.length} quotations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted Quotations</CardTitle>
            <Quote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredQuotations.filter(q => q.status === "accepted").length}</div>
            <p className="text-xs text-muted-foreground">Approved by customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted to Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredQuotations.filter(q => q.status === "converted").length}</div>
            <p className="text-xs text-muted-foreground">Successfully converted</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Quote className="h-5 w-5" />
                Quotations ({filteredQuotations.length})
              </CardTitle>
              <CardDescription>
                Manage your sales quotations
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchQuotations} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Link href={`${endPoint}/quotations/add`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Quotation
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by quotation no or customer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <Quote className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>{quotations.length === 0 ? "No quotations found" : "No quotations match your search criteria"}</p>
                        {quotations.length === 0 && (
                          <Link href={`${endPoint}/quotations/add`}>
                            <Button className="mt-2" size="sm">
                              Create your first quotation
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell className="font-medium">
                        {quotation.quotationNo}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{quotation.selectedCustomer?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {quotation.selectedCustomer?.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {quotation.quotationItems?.length || 0} items
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(quotation.grandTotal)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(quotation.status)}
                          {isExpired(quotation.validUntil) && (
                            <Badge variant="destructive" className="text-xs">
                              Expired
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {quotation.validUntil
                          ? new Date(quotation.validUntil).toLocaleDateString()
                          : "No expiry"
                        }
                      </TableCell>
                      <TableCell>
                        {new Date(quotation.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`${endPoint}/quotations/${quotation.quotationNo}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            {quotation.status !== "converted" && (
                              <>
                                <DropdownMenuItem asChild>
                                  <Link href={`${endPoint}/quotations/${quotation.quotationNo}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setQuotationToConvert(quotation)
                                    setConvertDialogOpen(true)
                                  }}
                                >
                                  <ShoppingCart className="h-4 w-4 mr-2" />
                                  Convert to Sale
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => handlePrintReceipt(quotation.id,"A4")}
                            >
                              <Printer className="h-4 w-4 mr-2" />
                              Print
                            </DropdownMenuItem>
                            {quotation.status !== "converted" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setQuotationToDelete(quotation.quotationNo)
                                  setDeleteDialogOpen(true)
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>


        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quotation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this quotation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => quotationToDelete && handleDelete(quotationToDelete)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert to Sale Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Sale</DialogTitle>
            <DialogDescription>
              Are you sure you want to convert this quotation to a sale? This will create a new sales invoice.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => quotationToConvert && handleConvertToSale(quotationToConvert)}
            >
              Convert to Sale
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </>
  )
}