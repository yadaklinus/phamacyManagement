import * as XLSX from 'xlsx'

export interface DailySalesData {
  date: string
  totalSales: number
  totalProfit: number
  transactionCount: number
  sales?: any[]
  productBreakdown?: any[]
}

export function exportDailySalesToExcel(data: DailySalesData, warehouseName: string) {
  const workbook = XLSX.utils.book_new()

  // Summary sheet
  const summaryData = [
    ['Daily Sales Report'],
    ['Warehouse:', warehouseName],
    ['Date:', data.date],
    [''],
    ['Summary'],
    ['Total Sales:', data.totalSales],
    ['Total Profit:', data.totalProfit],
    ['Total Transactions:', data.transactionCount],
    ['Profit Margin:', data.totalSales > 0 ? ((data.totalProfit / data.totalSales) * 100).toFixed(2) + '%' : '0%']
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

  // Sales transactions sheet
  if (data.sales && data.sales.length > 0) {
    const salesHeaders = ['Invoice No', 'Customer', 'Time', 'Subtotal', 'Tax', 'Grand Total', 'Paid Amount', 'Balance', 'Payment Method']
    const salesData = data.sales.map(sale => [
      sale.invoiceNo,
      sale.selectedCustomer?.name || 'Walk-in Customer',
      new Date(sale.createdAt).toLocaleTimeString(),
      sale.subTotal,
      sale.taxRate,
      sale.grandTotal,
      sale.paidAmount,
      sale.balance,
      sale.paymentMethod?.map((pm: any) => pm.method).join(', ') || 'Cash'
    ])

    const salesSheet = XLSX.utils.aoa_to_sheet([salesHeaders, ...salesData])
    XLSX.utils.book_append_sheet(workbook, salesSheet, 'Transactions')
  }

  // Product breakdown sheet
  if (data.productBreakdown && data.productBreakdown.length > 0) {
    const productHeaders = ['Product Name', 'Quantity Sold', 'Total Sales', 'Total Profit', 'Profit Margin']
    const productData = data.productBreakdown.map(product => [
      product.productName,
      product.quantity,
      product.totalSales,
      product.totalProfit,
      product.totalSales > 0 ? ((product.totalProfit / product.totalSales) * 100).toFixed(2) + '%' : '0%'
    ])

    const productSheet = XLSX.utils.aoa_to_sheet([productHeaders, ...productData])
    XLSX.utils.book_append_sheet(workbook, productSheet, 'Product Breakdown')
  }

  // Generate and download the file
  const fileName = `Daily_Sales_${warehouseName}_${data.date}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

export function exportMonthlySalesToExcel(monthlyData: any, warehouseName: string, month: string) {
  const workbook = XLSX.utils.book_new()

  // Monthly summary
  const summaryData = [
    ['Monthly Sales Report'],
    ['Warehouse:', warehouseName],
    ['Month:', month],
    [''],
    ['Monthly Totals'],
    ['Total Sales:', monthlyData.monthlyTotal.totalSales],
    ['Total Profit:', monthlyData.monthlyTotal.totalProfit],
    ['Total Transactions:', monthlyData.monthlyTotal.totalTransactions],
    ['Average Daily Sales:', (monthlyData.monthlyTotal.totalSales / monthlyData.dailyStats.length).toFixed(2)],
    ['Average Daily Profit:', (monthlyData.monthlyTotal.totalProfit / monthlyData.dailyStats.length).toFixed(2)]
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Monthly Summary')

  // Daily breakdown
  const dailyHeaders = ['Date', 'Total Sales', 'Total Profit', 'Transaction Count', 'Profit Margin']
  const dailyData = monthlyData.dailyStats.map((day: any) => [
    day.date,
    day.totalSales,
    day.totalProfit,
    day.transactionCount,
    day.totalSales > 0 ? ((day.totalProfit / day.totalSales) * 100).toFixed(2) + '%' : '0%'
  ])

  const dailySheet = XLSX.utils.aoa_to_sheet([dailyHeaders, ...dailyData])
  XLSX.utils.book_append_sheet(workbook, dailySheet, 'Daily Breakdown')

  // Generate and download the file
  const fileName = `Monthly_Sales_${warehouseName}_${month}.xlsx`
  XLSX.writeFile(workbook, fileName)
}