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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  UserCheck, 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Receipt, 
  ShoppingCart,
  Activity,
  Eye,
  CreditCard,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Printer
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
import { BalancePaymentDialog } from "@/components/balance-payment-dialog"
import { BalanceDepositDialog } from "@/components/balance-deposit-dialog"
import { Wallet, Plus as PlusIcon } from "lucide-react"

interface CustomerActivity {
  id: string
  invoiceNo: string
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
  }>
  paymentMethods: Array<{
    method: string
    amount: number
  }>
}

interface BalancePayment {
  id: string
  receiptNo: string
  amount: number
  paymentMethod: string
  notes?: string
  createdAt: string
  sale?: {
    invoiceNo: string
  }
}

interface CustomerData {
  id: string
  name: string
  type: string
  email?: string
  phone: string
  address?: string
  companyName?: string
}

interface ActivityData {
  customer: CustomerData
  activities: CustomerActivity[]
  summary: {
    totalSales: number
    totalAmount: number
    totalPaid: number
    totalBalance: number
    customerAccount:number
  }
}

export default function CustomerActivitiesPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const warehouseId = getWareHouseId()
  const customerId = params.customerId as string

  const [data, setData] = useState<ActivityData | null>(null)
  const [balancePayments, setBalancePayments] = useState<BalancePayment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<CustomerActivity | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedPaymentActivity, setSelectedPaymentActivity] = useState<CustomerActivity | null>(null)
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<BalancePayment | null>(null)
  const [customerAccountBalanceDialogOpen,setCustomerAccountBalanceDialogOpen] = useState(false)
  const [customerBalance, setCustomerBalance] = useState(0)
const [balanceTransactions, setBalanceTransactions] = useState([])
const [balanceDepositDialogOpen, setBalanceDepositDialogOpen] = useState(false)
  const [endPoint, setEndPoint] = useState("")

  useEffect(() => {
    setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
  }, [session, warehouseId])

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/customer/${customerId}/activities`)
      if (!response.ok) {
        throw new Error('Failed to fetch customer activities')
      }
      const activityData = await response.json()
      setData(activityData)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBalancePayments = async () => {
    setLoadingPayments(true)
    try {
      const response = await fetch(`/api/balance-payment?customerId=${customerId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch balance payments')
      }
      const paymentData = await response.json()
      setBalancePayments(paymentData.balancePayments || [])
    } catch (error) {
      console.error('Error fetching balance payments:', error)
    } finally {
      setLoadingPayments(false)
    }
  }

  const fetchCustomerBalance = async () => {
    try {
      const response = await fetch(`/api/customer/balance/${customerId}`)
      if (response.ok) {
        const balanceData = await response.json()
        setCustomerBalance(balanceData.balance)
        setBalanceTransactions(balanceData.recentTransactions || [])
      }
    } catch (error) {
      console.error('Error fetching customer balance:', error)
    }
  }

  useEffect(() => {
    if (customerId) {
      fetchActivities()
      fetchBalancePayments()
      fetchCustomerBalance() 
    }
  }, [customerId])

  const handleBalanceDepositSuccess = () => {
    fetchCustomerBalance()
    fetchBalancePayments()
    fetchActivities() // Refresh activities as balance changes might affect them
  }

  const handlePaymentSuccess = () => {
    fetchActivities()
    fetchBalancePayments()
    fetchCustomerBalance()
  }

 

  const openPaymentDialog = (activity: CustomerActivity) => {
    setSelectedPaymentActivity(activity)
    setPaymentDialogOpen(true)
  }

  const handlePrintReceipt = (payment: BalancePayment) => {
    // Create a receipt with full customer data
    const receiptData = {
      ...payment,
      customer: data?.customer || {
        name: "Unknown Customer",
        phone: "N/A",
        email:""
      }
    }

    // Create a temporary element for printing
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Balance Payment Receipt</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                font-family: Arial, sans-serif;
                max-width: 400px;
                margin: 0 auto;
              }
              .text-center { text-align: center; }
              .border-b { border-bottom: 1px solid #ddd; padding-bottom: 1rem; margin-bottom: 1rem; }
              .flex { display: flex; justify-content: space-between; }
              .font-bold { font-weight: bold; }
              .text-lg { font-size: 1.125rem; }
              .text-xl { font-size: 1.25rem; }
              .mb-2 { margin-bottom: 0.5rem; }
              .mb-4 { margin-bottom: 1rem; }
              .space-y-1 > * + * { margin-top: 0.25rem; }
              .space-y-2 > * + * { margin-top: 0.5rem; }
              .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
              .border-t { border-top: 1px solid #ddd; padding-top: 1rem; }
              .text-xs { font-size: 0.75rem; }
              .text-gray-600 { color: #666; }
              .text-gray-700 { color: #555; }
              @media print { 
                body { margin: 0; padding: 0; } 
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="text-center border-b">
              <h1 class="text-xl font-bold">Your Company Name</h1>
              <p class="text-gray-600">Company Address</p>
              <p class="text-gray-600">Tel: Company Phone</p>
              <p class="text-gray-600">Email: company@email.com</p>
            </div>
            
            <div class="text-center mb-4">
              <h2 class="text-lg font-bold">BALANCE PAYMENT RECEIPT</h2>
              <p class="text-gray-600">Receipt No: ${payment.receiptNo}</p>
            </div>
            
            <div class="space-y-2 mb-4">
              <div class="flex">
                <span class="font-bold">Date:</span>
                <span>${new Date(payment.createdAt).toLocaleDateString()}</span>
              </div>
              <div class="flex">
                <span class="font-bold">Time:</span>
                <span>${new Date(payment.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>
            
            <div class="border-t border-b py-3 mb-4">
              <h3 class="font-bold mb-2">Customer Information</h3>
              <div class="space-y-1">
                <div class="flex">
                  <span class="font-bold">Name:</span>
                  <span>${receiptData.customer.name}</span>
                </div>
                <div class="flex">
                  <span class="font-bold">Phone:</span>
                  <span>${receiptData.customer.phone}</span>
                </div>
                ${receiptData.customer?.email ? `
                <div class="flex">
                  <span class="font-bold">Email:</span>
                  <span>${receiptData.customer?.email}</span>
                </div>
                ` : ''}
              </div>
            </div>
            
            <div class="space-y-2 mb-4">
              <h3 class="font-bold">Payment Details</h3>
              ${payment.sale ? `
              <div class="flex">
                <span class="font-bold">Invoice No:</span>
                <span>${payment.sale.invoiceNo}</span>
              </div>
              ` : ''}
              <div class="flex">
                <span class="font-bold">Payment Method:</span>
                <span style="text-transform: capitalize;">${payment.paymentMethod.replace('_', ' ')}</span>
              </div>
              <div class="flex text-lg font-bold">
                <span>Amount Paid:</span>
                <span>${formatCurrency(payment.amount)}</span>
              </div>
            </div>
            
            ${payment.notes ? `
            <div class="mb-4">
              <h3 class="font-bold mb-2">Notes</h3>
              <p class="text-gray-700">${payment.notes}</p>
            </div>
            ` : ''}
            
            <div class="border-t text-center text-gray-600">
              <p class="mb-2">Thank you for your payment!</p>
              <p class="text-xs">
                This is a computer generated receipt and does not require signature.
              </p>
              <p class="text-xs mb-2">
                For any queries, please contact us at Company Phone
              </p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
      printWindow.close()
    }
  }

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'SALE':
        return <Badge className="bg-green-600">Sale</Badge>
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
                <p className="text-gray-600 mt-2">Failed to load customer activities</p>
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
                  <BreadcrumbLink href={`${endPoint}/people/customers`}>Customers</BreadcrumbLink>
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => router.back()}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Activity className="h-5 w-5 text-blue-600" />
              <h1 className="text-xl sm:text-2xl font-semibold text-blue-600">Customer Activities</h1>
            </div>
            {/* <Button
              onClick={() => {
                fetchActivities()
                fetchBalancePayments()
              }}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button> */}
          </div>

          {/* Customer Information */}
          <Card>
  <CardHeader>
    <div className="flex justify-between items-start">
      <div>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Customer Information
        </CardTitle>
      </div>
      <Button
        onClick={() => setBalanceDepositDialogOpen(true)}
        size="sm"
        className="bg-green-600 hover:bg-green-700"
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Add Balance
      </Button>
    </div>
  </CardHeader>
  <CardContent>
    {/* Account Balance Section */}
    <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-green-600" />
          <span className="font-medium text-gray-700">Account Balance</span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-700">
            {formatCurrency(customerBalance)}
          </div>
          <div className="text-xs text-gray-500">Available Credit</div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label className="text-sm font-medium text-gray-500">Name</label>
        <p className="font-medium">{data.customer.name}</p>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-500">Type</label>
        <Badge variant="outline">{data.customer.type}</Badge>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-500">Phone</label>
        <p className="text-sm">{data.customer.phone}</p>
      </div>
      {data.customer.email && (
        <div>
          <label className="text-sm font-medium text-gray-500">Email</label>
          <p className="text-sm">{data.customer.email}</p>
        </div>
      )}
      {data.customer.companyName && (
        <div>
          <label className="text-sm font-medium text-gray-500">Company</label>
          <p className="text-sm">{data.customer.companyName}</p>
        </div>
      )}
      {data.customer.address && (
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="text-sm font-medium text-gray-500">Address</label>
          <p className="text-sm">{data.customer.address}</p>
        </div>
      )}
    </div>
  </CardContent>
</Card>

          {/* Summary Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{data.summary.totalSales}</div>
                <p className="text-xs text-muted-foreground">Total transactions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{formatCurrency(data.summary.totalAmount)}</div>
                <p className="text-xs text-muted-foreground">Total sales value</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {formatCurrency(data.summary.totalPaid)}
                </div>
                <p className="text-xs text-muted-foreground">Amount received</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-xl sm:text-2xl font-bold ${getBalanceColor(data.summary.totalBalance)}`}>
                  {formatCurrency(data.summary.totalBalance)}
                </div>
                <p className="text-xs text-muted-foreground">Amount due</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-xl sm:text-2xl font-bold ${getBalanceColor(data.summary.totalBalance)}`}>
                  {formatCurrency(data.summary.customerAccount)}
                </div>
                <p className="text-xs text-muted-foreground">Amount due</p>
              </CardContent>
            </Card>
          </div>

          <Button onClick={()=>{
            setCustomerAccountBalanceDialogOpen(true)
          }}>Add Balance</Button>

          {/* Tabs for Activities and Balance Payments */}
          <Tabs defaultValue="activities" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
            <TabsTrigger value="activities">Transaction History</TabsTrigger>
            <TabsTrigger value="balance-payments">Balance Paid</TabsTrigger>
            <TabsTrigger value="balance-transactions">Balance Transactions</TabsTrigger>
          </TabsList>

            {/* Transaction History Tab */}
            <TabsContent value="activities">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>
                    Showing {data.activities.length} transaction(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.activities.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No activities found</h3>
                      <p className="text-muted-foreground">
                        This customer hasn't made any purchases yet.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Invoice No.</TableHead>
                            <TableHead className="hidden sm:table-cell">Type</TableHead>
                            <TableHead className="hidden md:table-cell">Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right hidden sm:table-cell">Paid</TableHead>
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
                                  <span className="text-sm">{formatDate(activity.date)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {activity.invoiceNo}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                {getActivityBadge(activity.type)}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">{activity.description}</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(activity.amount)}
                              </TableCell>
                              <TableCell className="text-right text-green-600 hidden sm:table-cell">
                                {formatCurrency(activity.paidAmount)}
                              </TableCell>
                              <TableCell className={`text-right font-medium ${getBalanceColor(activity.balance)}`}>
                                {formatCurrency(activity.balance)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-1 justify-end">
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
                                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                      <DialogHeader>
                                        <DialogTitle>Transaction Details - {activity.invoiceNo}</DialogTitle>
                                        <DialogDescription>
                                          View detailed information about this transaction
                                        </DialogDescription>
                                      </DialogHeader>
                                      {selectedActivity && (
                                        <div className="space-y-4">
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                              <label className="text-sm font-medium text-gray-500">Date</label>
                                              <p>{formatDate(selectedActivity.date)}</p>
                                            </div>
                                            <div>
                                              <label className="text-sm font-medium text-gray-500">Invoice No.</label>
                                              <p>{selectedActivity.invoiceNo}</p>
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
                                              <div className="overflow-x-auto">
                                                <Table>
                                                  <TableHeader>
                                                    <TableRow>
                                                      <TableHead>Product</TableHead>
                                                      <TableHead>Qty</TableHead>
                                                      <TableHead>Price</TableHead>
                                                      <TableHead>Total</TableHead>
                                                    </TableRow>
                                                  </TableHeader>
                                                  <TableBody>
                                                    {selectedActivity.items.map((item, index) => (
                                                      <TableRow key={index}>
                                                        <TableCell>{item.productName}</TableCell>
                                                        <TableCell>{item.quantity}</TableCell>
                                                        <TableCell>{formatCurrency(item.price)}</TableCell>
                                                        <TableCell>{formatCurrency(item.total)}</TableCell>
                                                      </TableRow>
                                                    ))}
                                                  </TableBody>
                                                </Table>
                                              </div>
                                            </div>
                                          </div>

                                          {selectedActivity.paymentMethods.length > 0 && (
                                            <div>
                                              <label className="text-sm font-medium text-gray-500 mb-2 block">Payment Methods</label>
                                              <div className="space-y-2">
                                                {selectedActivity.paymentMethods.map((payment, index) => (
                                                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                    <span className="capitalize">{payment.method}</span>
                                                    <span className="font-medium">{formatCurrency(payment.amount)}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </DialogContent>
                                  </Dialog>
                                  
                                  {activity.balance > 0 && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => openPaymentDialog(activity)}
                                    >
                                      <CreditCard className="h-4 w-4" />
                                    </Button>
                                  )}
                                  
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`${endPoint}/sales/${activity.invoiceNo}`}>
                                      <Receipt className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Balance Payments Tab */}
            <TabsContent value="balance-payments">
              <Card>
                <CardHeader>
                  <CardTitle>Balance Payments</CardTitle>
                  <CardDescription>
                    Showing {balancePayments.length} balance payment(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingPayments ? (
                    <div className="text-center py-8">
                      <Loading />
                    </div>
                  ) : balancePayments.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No balance payments found</h3>
                      <p className="text-muted-foreground">
                        No balance payments have been made for this customer yet.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Receipt No.</TableHead>
                            <TableHead className="hidden sm:table-cell">Invoice No.</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="hidden md:table-cell">Payment Method</TableHead>
                            <TableHead className="hidden lg:table-cell">Notes</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {balancePayments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{formatDate(payment.createdAt)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {payment.receiptNo}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                {payment.sale?.invoiceNo || "General Payment"}
                              </TableCell>
                              <TableCell className="text-right font-medium text-green-600">
                                {formatCurrency(payment.amount)}
                              </TableCell>
                              <TableCell className="hidden md:table-cell capitalize">
                                {payment.paymentMethod.replace('_', ' ')}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {payment.notes || "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePrintReceipt(payment)}
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="balance-transactions">
    <Card>
      <CardHeader>
        <CardTitle>Balance Transactions</CardTitle>
        <CardDescription>
          Showing {balanceTransactions.length} balance transaction(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {balanceTransactions.length === 0 ? (
          <div className="text-center py-8">
            <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No balance transactions found</h3>
            <p className="text-muted-foreground">
              No balance deposits or payments have been made for this customer yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance After</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balanceTransactions.map((transaction: any) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(transaction.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={transaction.type === "CREDIT" ? "default" : "destructive"}
                        className={transaction.type === "CREDIT" ? "bg-green-600" : ""}
                      >
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {transaction.paymentMethod?.replace('_', ' ')}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      transaction.type === "CREDIT" ? "text-green-600" : "text-red-600"
                    }`}>
                      {transaction.type === "CREDIT" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(transaction.balanceAfter)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {transaction.reference || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  </TabsContent>
          </Tabs>
        </div>

        {/* Balance Payment Dialog */}
        <BalancePaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          customerId={customerId}
          saleId={selectedPaymentActivity?.invoiceNo}
          invoiceNo={selectedPaymentActivity?.invoiceNo}
          outstandingBalance={selectedPaymentActivity?.balance}
          customerName={data.customer.name}
          warehousesId={warehouseId}
          onPaymentSuccess={handlePaymentSuccess}
        />

<BalanceDepositDialog
  open={balanceDepositDialogOpen}
  onOpenChange={setBalanceDepositDialogOpen}
  customerId={customerId}
  customerName={data?.customer?.name || ""}
  currentBalance={customerBalance}
  warehouseId={warehouseId}
  onDepositSuccess={handleBalanceDepositSuccess}
/>
      
     </>
  )
}