import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      warehouseId,
      reportType, // 'products', 'sales', 'purchases', 'customers', 'suppliers'
      format = 'excel', // 'csv', 'json', 'excel'
      dateRange,
      filters = {}
    } = body;

    let data: any[] = [];
    let headers: string[] = [];
    let filename = '';

    switch (reportType) {
      case 'products':
        data = await generateProductsReport(warehouseId, filters);
        headers = ['Name', 'Barcode', 'Quantity', 'Unit', 'Cost', 'Wholesale Price', 'Retail Price', 'Stock Status', 'Inventory Value', 'Last Updated'];
        filename = `products-report-${new Date().toISOString().split('T')[0]}`;
        break;

      case 'sales':
        data = await generateSalesReport(warehouseId, dateRange, filters);
        headers = ['Invoice No', 'Date', 'Customer', 'Items Count', 'Subtotal', 'Tax Rate', 'Grand Total', 'Paid Amount', 'Balance', 'Status'];
        filename = `sales-report-${new Date().toISOString().split('T')[0]}`;
        break;

      case 'purchases':
        data = await generatePurchasesReport(warehouseId, dateRange, filters);
        headers = ['Reference No', 'Date', 'Supplier', 'Items Count', 'Subtotal', 'Tax Rate', 'Grand Total', 'Paid Amount', 'Balance', 'Status'];
        filename = `purchases-report-${new Date().toISOString().split('T')[0]}`;
        break;

      case 'customers':
        data = await generateCustomersReport(warehouseId, filters);
        headers = ['Name', 'Type', 'Company', 'Email', 'Phone', 'Address', 'Total Orders', 'Total Spent', 'Last Order Date'];
        filename = `customers-report-${new Date().toISOString().split('T')[0]}`;
        break;

      case 'suppliers':
        data = await generateSuppliersReport(warehouseId, filters);
        headers = ['Name', 'Type', 'Company', 'Email', 'Phone', 'Address', 'Total Orders', 'Total Amount', 'Last Order Date'];
        filename = `suppliers-report-${new Date().toISOString().split('T')[0]}`;
        break;

      case 'inventory-summary':
        data = await generateInventorySummaryReport(warehouseId);
        headers = ['Category', 'Total Products', 'Total Quantity', 'Total Value', 'Low Stock Items', 'Out of Stock Items'];
        filename = `inventory-summary-${new Date().toISOString().split('T')[0]}`;
        break;

      default:
        return NextResponse.json({
          success: false,
          error: "Invalid report type"
        }, { status: 400 });
    }

    if (format === 'csv') {
      const csv = generateCSV(data, headers);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`
        }
      });
    } else if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: data,
        headers: headers,
        meta: {
          reportType,
          warehouseId,
          generatedAt: new Date().toISOString(),
          totalRecords: data.length
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Report generated successfully",
      data: data.slice(0, 10), // Preview
      totalRecords: data.length,
      downloadUrl: `/api/reports/download?type=${reportType}&format=${format}&warehouseId=${warehouseId}`
    });

  } catch (error) {
    console.error("Report export error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to generate report"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

async function generateProductsReport(warehouseId: string, filters: any) {
  const whereConditions: any = {
    isDeleted: false,
    warehousesId: warehouseId
  };

  if (filters.stockStatus) {
    switch (filters.stockStatus) {
      case 'low':
        whereConditions.quantity = { lte: 10, gt: 0 };
        break;
      case 'out':
        whereConditions.quantity = 0;
        break;
      case 'good':
        whereConditions.quantity = { gt: 10 };
        break;
    }
  }

  const products = await prisma.product.findMany({
    where: whereConditions,
    orderBy: { name: 'asc' }
  });

  return products.map(product => ({
    name: product.name,
    barcode: product.barcode,
    quantity: product.quantity,
    unit: product.unit,
    cost: product.cost,
    wholesalePrice: product.wholeSalePrice,
    retailPrice: product.retailPrice,
    stockStatus: getStockStatusText(product.quantity),
    inventoryValue: product.cost * product.quantity,
    lastUpdated: product.updatedAt.toISOString().split('T')[0]
  }));
}

async function generateSalesReport(warehouseId: string, dateRange: any, filters: any) {
  const whereConditions: any = {
    isDeleted: false,
    warehousesId: warehouseId
  };

  if (dateRange?.start && dateRange?.end) {
    whereConditions.createdAt = {
      gte: new Date(dateRange.start),
      lte: new Date(dateRange.end)
    };
  }

  const sales = await prisma.sale.findMany({
    where: whereConditions,
    include: {
      selectedCustomer: true,
      saleItems: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return sales.map(sale => ({
    invoiceNo: sale.invoiceNo,
    date: sale.createdAt.toISOString().split('T')[0],
    customer: sale.selectedCustomer?.name || 'Walk-in Customer',
    itemsCount: sale.saleItems?.length || 0,
    subtotal: sale.subTotal,
    taxRate: sale.taxRate,
    grandTotal: sale.grandTotal,
    paidAmount: sale.paidAmount,
    balance: sale.balance,
    status: getSaleStatus(sale.balance, sale.grandTotal)
  }));
}

async function generatePurchasesReport(warehouseId: string, dateRange: any, filters: any) {
  const whereConditions: any = {
    isDeleted: false,
    warehousesId: warehouseId
  };

  if (dateRange?.start && dateRange?.end) {
    whereConditions.createdAt = {
      gte: new Date(dateRange.start),
      lte: new Date(dateRange.end)
    };
  }

  const purchases = await prisma.purchase.findMany({
    where: whereConditions,
    include: {
      Supplier: true,
      purchaseItem: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return purchases.map(purchase => ({
    referenceNo: purchase.referenceNo,
    date: purchase.createdAt.toISOString().split('T')[0],
    supplier: purchase.Supplier?.name || 'Unknown Supplier',
    itemsCount: purchase.purchaseItem?.length || 0,
    subtotal: purchase.subTotal,
    taxRate: purchase.taxRate,
    grandTotal: purchase.grandTotal,
    paidAmount: purchase.paidAmount,
    balance: purchase.balance,
    status: getPurchaseStatus(purchase.balance, purchase.grandTotal)
  }));
}

async function generateCustomersReport(warehouseId: string, filters: any) {
  const customers = await prisma.customer.findMany({
    where: {
      isDeleted: false,
      warehousesId: warehouseId
    },
    include: {
      Sale: {
        where: { isDeleted: false }
      }
    },
    orderBy: { name: 'asc' }
  });

  return customers.map(customer => {
    const totalOrders = customer.Sale.length;
    const totalSpent = customer.Sale.reduce((sum, sale) => sum + sale.grandTotal, 0);
    const lastOrderDate = customer.Sale.length > 0 
      ? Math.max(...customer.Sale.map(sale => new Date(sale.createdAt).getTime()))
      : null;

    return {
      name: customer.name,
      type: customer.type,
      company: customer.companyName || '',
      email: customer.email || '',
      phone: customer.phone,
      address: customer.address || '',
      totalOrders,
      totalSpent,
      lastOrderDate: lastOrderDate ? new Date(lastOrderDate).toISOString().split('T')[0] : 'Never'
    };
  });
}

async function generateSuppliersReport(warehouseId: string, filters: any) {
  const suppliers = await prisma.supplier.findMany({
    where: {
      isDeleted: false,
      warehousesId: warehouseId
    },
    include: {
      purchase: {
        where: { isDeleted: false }
      }
    },
    orderBy: { name: 'asc' }
  });

  return suppliers.map(supplier => {
    const totalOrders = supplier.purchase.length;
    const totalAmount = supplier.purchase.reduce((sum, purchase) => sum + purchase.grandTotal, 0);
    const lastOrderDate = supplier.purchase.length > 0 
      ? Math.max(...supplier.purchase.map(purchase => new Date(purchase.createdAt).getTime()))
      : null;

    return {
      name: supplier.name,
      type: supplier.type,
      company: supplier.companyName || '',
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      totalOrders,
      totalAmount,
      lastOrderDate: lastOrderDate ? new Date(lastOrderDate).toISOString().split('T')[0] : 'Never'
    };
  });
}

async function generateInventorySummaryReport(warehouseId: string) {
  const products = await prisma.product.findMany({
    where: {
      isDeleted: false,
      warehousesId: warehouseId
    }
  });

  // Group by unit (category)
  const summary = products.reduce((acc: any, product) => {
    const unit = product.unit;
    if (!acc[unit]) {
      acc[unit] = {
        category: unit,
        totalProducts: 0,
        totalQuantity: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0
      };
    }

    acc[unit].totalProducts += 1;
    acc[unit].totalQuantity += product.quantity;
    acc[unit].totalValue += product.cost * product.quantity;
    
    if (product.quantity === 0) {
      acc[unit].outOfStockItems += 1;
    } else if (product.quantity <= 10) {
      acc[unit].lowStockItems += 1;
    }

    return acc;
  }, {});

  return Object.values(summary);
}

function generateCSV(data: any[], headers: string[]): string {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => {
    return headers.map(header => {
      const key = header.toLowerCase().replace(/\s+/g, '');
      const value = row[key] || '';
      // Escape quotes and wrap in quotes if contains comma
      return typeof value === 'string' && value.includes(',') 
        ? `"${value.replace(/"/g, '""')}"` 
        : value;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

function getStockStatusText(quantity: number): string {
  if (quantity === 0) return 'Out of Stock';
  if (quantity <= 10) return 'Low Stock';
  return 'In Stock';
}

function getSaleStatus(balance: number, grandTotal: number): string {
  if (balance === 0) return 'Completed';
  if (balance === grandTotal) return 'Not Paid';
  return 'Partial Payment';
}

function getPurchaseStatus(balance: number, grandTotal: number): string {
  if (balance === 0) return 'Paid';
  if (balance === grandTotal) return 'Unpaid';
  return 'Partial Payment';
}