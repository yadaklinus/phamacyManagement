'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"

interface RecentSale {
  id: string
  customer: any
  amount: number
  date: string
  items: number
  products: string
}

interface RecentSalesTableProps {
  sales: RecentSale[]
}

export function RecentSalesTable({ sales }: RecentSalesTableProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
        <CardDescription>Latest sales transactions in your system</CardDescription>
      </CardHeader>
      <CardContent>
        {sales.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.id}</TableCell>
                  <TableCell>{sale.customer.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={sale.products}>
                    {sale.products || 'No products'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{sale.items}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(sale.date)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(sale.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No sales data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}