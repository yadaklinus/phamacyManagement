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
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Truck, 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Receipt, 
  ShoppingBag,
  Activity,
  Eye,
  CreditCard,
  AlertCircle,
  TrendingUp,
  Package
} from "lucide-react"
import { useSession } from "next-auth/react"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import { Loading } from "@/components/loading"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SupplierActivity {
  id: string
  referenceNo: string
  date: string
  type: string
  description: string
  amount: number
  paidAmount: number
  balance: number
  items: Array<{
    productName: string
    quantity: number
    price: number
    total: number
    customRetailPrice?: number
    customWholesalePrice?: number
  }>
}

interface SupplierData {
  id: string
  name: string
  type: string
  email: string
  phone: string
  address: string
  companyName?: string
}

interface ActivityData {
  supplier: SupplierData
  activities: SupplierActivity[]
  summary: {
    totalPurchases: number
    totalAmount: number
    totalPaid: number
    totalBalance: number
  }
}

export default function SupplierActivitiesPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const warehouseId = getWareHouseId()
  const supplierId = params.supplierId as string

  const [data, setData] = useState<ActivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedActivity, setSelectedActivity] = useState<SupplierActivity | null>(null)
  const [endPoint, setEndPoint] = useState("")

  useEffect(() => {
    setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
  }, [session, warehouseId])

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`/api/supplier/${supplierId}/activities`)
        if (!response.ok) {
          throw new Error('Failed to fetch supplier activities')
        }
        const activityData = await response.json()
        setData(activityData)
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setLoading(false)
      }
    }

    if (supplierId) {
      fetchActivities()
    }
  }, [supplierId])

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return <Badge className="bg-blue-600">Purchase</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-red-600"
    if (balance < 0) return "text-green-600"
    return "text-gray-600"
  }

  if (loading) {
    return <Loading />
  }

  if (!data) {
    return (
     <>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-red-600">Error</h2>
                <p className="text-gray-600 mt-2">Failed to load supplier activities</p>
                <Button
                  onClick={() => router.back()}
                  className="mt-4"
                  variant="outline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>
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
                  <BreadcrumbLink href={`${endPoint}/people/suppliers`}>Suppliers</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Activities</BreadcrumbPage>
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
              <Activity className="h-5 w-5 text-orange-600" />
              <h1 className="text-2xl font-semibold text-orange-600">Supplier Activities</h1>
            </div>
          </div>

          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Supplier Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Person</label>
                  <p className="font-medium">{data.supplier.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <Badge variant="outline">{data.supplier.type}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-sm">{data.supplier.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm">{data.supplier.email}</p>
                </div>
                {data.supplier.companyName && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Company</label>
                    <p className="text-sm">{data.supplier.companyName}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-sm">{data.supplier.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.totalPurchases}</div>
                <p className="text-xs text-muted-foreground">Total transactions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.summary.totalAmount)}</div>
                <p className="text-xs text-muted-foreground">Total purchase value</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.summary.totalPaid)}
                </div>
                <p className="text-xs text-muted-foreground">Amount paid</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getBalanceColor(data.summary.totalBalance)}`}>
                  {formatCurrency(data.summary.totalBalance)}
                </div>
                <p className="text-xs text-muted-foreground">Amount due</p>
              </CardContent>
            </Card>
          </div>

          {/* Activities Table */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
              <CardDescription>
                Showing {data.activities.length} transaction(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.activities.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No activities found</h3>
                  <p className="text-muted-foreground">
                    No purchases have been made from this supplier yet.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference No.</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.activities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(activity.date)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {activity.referenceNo}
                        </TableCell>
                        <TableCell>
                          {getActivityBadge(activity.type)}
                        </TableCell>
                        <TableCell>{activity.description}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(activity.amount)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(activity.paidAmount)}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${getBalanceColor(activity.balance)}`}>
                          {formatCurrency(activity.balance)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedActivity(activity)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>Purchase Details - {activity.referenceNo}</DialogTitle>
                                  <DialogDescription>
                                    View detailed information about this purchase
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedActivity && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium text-gray-500">Date</label>
                                        <p>{formatDate(selectedActivity.date)}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-500">Reference No.</label>
                                        <p>{selectedActivity.referenceNo}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-500">Total Amount</label>
                                        <p className="font-medium">{formatCurrency(selectedActivity.amount)}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-500">Balance</label>
                                        <p className={getBalanceColor(selectedActivity.balance)}>
                                          {formatCurrency(selectedActivity.balance)}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <label className="text-sm font-medium text-gray-500 mb-2 block">Items</label>
                                      <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Product</TableHead>
                                              <TableHead>Qty</TableHead>
                                              <TableHead>Cost Price</TableHead>
                                              <TableHead>Total</TableHead>
                                              <TableHead>Retail Price</TableHead>
                                              <TableHead>Wholesale Price</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {selectedActivity.items.map((item, index) => (
                                              <TableRow key={index}>
                                                <TableCell>{item.productName}</TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell>{formatCurrency(item.price)}</TableCell>
                                                <TableCell>{formatCurrency(item.total)}</TableCell>
                                                <TableCell>
                                                  {item.customRetailPrice ? formatCurrency(item.customRetailPrice) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                  {item.customWholesalePrice ? formatCurrency(item.customWholesalePrice) : '-'}
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`${endPoint}/purchases/${activity.referenceNo}`}>
                                <Receipt className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
     </>
  )
}