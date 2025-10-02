"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, DollarSign, TrendingUp, ShoppingCart, Package, User, Calendar, X, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { exportDailySalesToExcel, DailySalesData } from '@/lib/excel-export'

interface DailySalesModalProps {
  isOpen: boolean
  onClose: () => void
  date: string | null
  warehouseId: string
  warehouseName: string
  apiEndpoint: string
}

export function DailySalesModal({ 
  isOpen, 
  onClose, 
  date, 
  warehouseId, 
  warehouseName,
  apiEndpoint 
}: DailySalesModalProps) {
  const [dailyData, setDailyData] = useState<DailySalesData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDailyData = async () => {
    if (!date || !warehouseId) return

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${apiEndpoint}?warehouseId=${warehouseId}&date=${date}`)
      const data = await response.json()
      
      if (response.ok) {
        setDailyData(data)
      } else {
        setError(data.error || 'Failed to fetch daily data')
      }
    } catch (error) {
      console.error('Error fetching daily data:', error)
      setError('Failed to fetch daily data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && date) {
      fetchDailyData()
    }
  }, [isOpen, date, warehouseId, apiEndpoint])

  const handleExport = () => {
    if (dailyData) {
      exportDailySalesToExcel(dailyData, warehouseName)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <DialogTitle>
                Daily Sales Report - {date ? formatDate(date) : ''}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={loading || !dailyData}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading daily sales data...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
          </div>
        )}

        {dailyData && !loading && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    Total Sales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(dailyData.totalSales)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    Total Profit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(dailyData.totalProfit)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {dailyData.totalSales > 0 
                      ? `${((dailyData.totalProfit / dailyData.totalSales) * 100).toFixed(1)}% margin`
                      : '0% margin'
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-purple-600" />
                    Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {dailyData.transactionCount}
                  </div>
                  <div className="text-sm text-gray-500">
                    Avg: {dailyData.transactionCount > 0 
                      ? formatCurrency(dailyData.totalSales / dailyData.transactionCount)
                      : formatCurrency(0)
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Package className="h-4 w-4 text-orange-600" />
                    Products Sold
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {dailyData.productBreakdown?.length || 0}
                  </div>
                  <div className="text-sm text-gray-500">
                    Unique items
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Product Breakdown */}
            {dailyData.productBreakdown && dailyData.productBreakdown.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Product Breakdown
                  </CardTitle>
                  <CardDescription>
                    Sales performance by product for this day
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Total Sales</TableHead>
                        <TableHead className="text-right">Total Profit</TableHead>
                        <TableHead className="text-right">Profit Margin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyData.productBreakdown.map((product: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{product.productName}</TableCell>
                          <TableCell className="text-right">{product.quantity}</TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(product.totalSales)}
                          </TableCell>
                          <TableCell className="text-right text-blue-600">
                            {formatCurrency(product.totalProfit)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={product.totalSales > 0 && (product.totalProfit / product.totalSales) > 0.2 ? "default" : "secondary"}>
                              {product.totalSales > 0 
                                ? `${((product.totalProfit / product.totalSales) * 100).toFixed(1)}%`
                                : '0%'
                              }
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Sales Transactions */}
            {dailyData.sales && dailyData.sales.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Sales Transactions
                  </CardTitle>
                  <CardDescription>
                    All sales transactions for this day
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice No</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Grand Total</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Payment Method</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyData.sales.map((sale: any) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">{sale.invoiceNo}</TableCell>
                          <TableCell>{formatTime(sale.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500" />
                              {sale.selectedCustomer?.name || 'Walk-in Customer'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            {formatCurrency(sale.grandTotal)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={sale.balance > 0 ? "destructive" : "default"}>
                              {formatCurrency(sale.balance)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {sale.paymentMethod?.map((pm: any) => pm.method).join(', ') || 'Cash'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {dailyData.transactionCount === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Found</h3>
                  <p className="text-gray-500">
                    There were no sales transactions recorded for {formatDate(date || '')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}