import { NextRequest, NextResponse } from "next/server";
import onlinePrisma from "@/lib/onlinePrisma";

export async function POST(req: NextRequest) {
  try {
    const { warehouseId, reportType, month, year, format = 'csv' } = await req.json();

    if (!warehouseId || !reportType) {
      return NextResponse.json(
        { error: "Warehouse ID and report type are required" },
        { status: 400 }
      );
    }

    // Find warehouse by code or id, ensuring it's not deleted.
    // The model name is corrected to `Warehouses_online` to match the schema.
    let warehouse = await onlinePrisma.warehouses_online.findFirst({
      where: {
        OR: [
          { warehouseCode: warehouseId, isDeleted: false },
          { id: warehouseId, isDeleted: false }
        ]
      }
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: "Warehouse not found" },
        { status: 404 }
      );
    }

    let csvData = '';
    let filename = '';

    if (reportType === 'inventory') {
      // Corrected model name from `products_online` to `Product_online`.
      // Corrected relation field from `warehousesId` to `warehouses_onlineId`.
      const products = await onlinePrisma.product_online.findMany({
        where: {
          warehouses_onlineId: warehouse.warehouseCode,
          isDeleted: false
        },
        orderBy: {
          name: 'asc'
        }
      });

      // CSV headers
      csvData = 'Product Name,Barcode,Quantity,Unit,Cost,Wholesale Price,Retail Price,Stock Value,Status\n';
      
      // CSV rows
      products.forEach(product => {
        const status = product.quantity === 0 ? 'Out of Stock' : product.quantity <= 10 ? 'Low Stock' : 'In Stock';
        const stockValue = product.quantity * product.cost;
        
        csvData += `"${product.name}","${product.barcode}",${product.quantity},"${product.unit}",${product.cost},${product.wholeSalePrice},${product.retailPrice},${stockValue},"${status}"\n`;
      });

      filename = `${warehouse.warehouseCode}_inventory_${new Date().toISOString().split('T')[0]}.csv`;
    }

    else if (reportType === 'sales') {
      if (!month || !year) {
        return NextResponse.json(
          { error: "Month and year are required for sales reports" },
          { status: 400 }
        );
      }

      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

      // Corrected model name from `sale_online` to `Sale_online`.
      // Corrected relation field from `warehousesId` to `warehouses_onlineId`.
      // Corrected included relation names from `product` to `Product_online` and `selectedCustomer` to `Customer_online`.
      const sales = await onlinePrisma.sale_online.findMany({
        where: {
          warehouses_onlineId: warehouse.warehouseCode,
          isDeleted: false,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          saleItems: {
            include: {
              Product_online: true // Corrected relation name
            }
          },
          Customer_online: true // Corrected relation name
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // CSV headers
      csvData = 'Invoice No,Date,Customer,Items,Total Amount,Balance,Status\n';
      
      // CSV rows
      sales.forEach((sale:any) => {
        const status = sale.balance === 0 ? 'Paid' : sale.balance === sale.grandTotal ? 'Unpaid' : 'Partial';
        const date = new Date(sale.createdAt).toLocaleDateString();
        // Corrected property access from `selectedCustomer` to `Customer_online`.
        const customer = sale.Customer_online?.name || 'Walk-in Customer';
        
        csvData += `"${sale.invoiceNo}","${date}","${customer}",${sale.saleItems.length},${sale.grandTotal},${sale.balance},"${status}"\n`;
      });

      filename = `${warehouse.warehouseCode}_sales_${year}_${month.toString().padStart(2, '0')}.csv`;
    }

    else if (reportType === 'monthly') {
      if (!month || !year) {
        return NextResponse.json(
          { error: "Month and year are required for monthly reports" },
          { status: 400 }
        );
      }

      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

      // Get inventory data - Corrected model and field names
      const products = await onlinePrisma.product_online.findMany({
        where: {
          warehouses_onlineId: warehouse.warehouseCode,
          isDeleted: false
        },
        orderBy: {
          name: 'asc'
        }
      });

      // Get sales data - Corrected model, field, and include names
      const sales = await onlinePrisma.sale_online.findMany({
        where: {
          warehouses_onlineId: warehouse.warehouseCode,
          isDeleted: false,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          saleItems: {
            include: {
              Product_online: true // Corrected relation name
            }
          },
          Customer_online: true // Corrected relation name
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Create comprehensive monthly report
      csvData = 'MONTHLY REPORT\n';
      csvData += `Warehouse: ${warehouse.name} (${warehouse.warehouseCode})\n`;
      csvData += `Period: ${new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}\n`;
      csvData += `Generated: ${new Date().toLocaleDateString()}\n\n`;

      // Summary section
      const totalRevenue = sales.reduce((sum:any, s:any) => sum + (s.grandTotal || 0), 0);
      const totalStockValue = products.reduce((sum:any, p:any) => sum + (p.quantity * p.cost), 0);
      
      csvData += 'SUMMARY\n';
      csvData += `Total Products,${products.length}\n`;
      csvData += `Total Sales,${sales.length}\n`;
      csvData += `Total Revenue,${totalRevenue}\n`;
      csvData += `Total Stock Value,${totalStockValue}\n`;
      csvData += `Low Stock Items,${products.filter(p => p.quantity <= 10).length}\n`;
      csvData += `Out of Stock Items,${products.filter(p => p.quantity === 0).length}\n\n`;

      // Inventory section
      csvData += 'INVENTORY\n';
      csvData += 'Product Name,Barcode,Quantity,Unit,Cost,Wholesale Price,Retail Price,Stock Value,Status\n';
      
      products.forEach(product => {
        const status = product.quantity === 0 ? 'Out of Stock' : product.quantity <= 10 ? 'Low Stock' : 'In Stock';
        const stockValue = product.quantity * product.cost;
        
        csvData += `"${product.name}","${product.barcode}",${product.quantity},"${product.unit}",${product.cost},${product.wholeSalePrice},${product.retailPrice},${stockValue},"${status}"\n`;
      });

      csvData += '\nSALES\n';
      csvData += 'Invoice No,Date,Customer,Items,Total Amount,Balance,Status\n';
      
      sales.forEach(sale => {
        const status = sale.balance === 0 ? 'Paid' : sale.balance === sale.grandTotal ? 'Unpaid' : 'Partial';
        const date = new Date(sale.createdAt).toLocaleDateString();
        // Corrected property access
        const customer = sale.Customer_online?.name || 'Walk-in Customer';
        
        csvData += `"${sale.invoiceNo}","${date}","${customer}",${sale.saleItems.length},${sale.grandTotal},${sale.balance},"${status}"\n`;
      });

      filename = `${warehouse.warehouseCode}_monthly_report_${year}_${month.toString().padStart(2, '0')}.csv`;
    }

    else {
      return NextResponse.json(
        { error: "Invalid report type. Supported types: inventory, sales, monthly" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      csvData,
      filename,
      warehouse: {
        id: warehouse.id,
        warehouseCode: warehouse.warehouseCode,
        name: warehouse.name
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error exporting report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    // Disconnecting the Prisma client is generally not recommended in serverless environments
    // as it can affect performance by closing and reopening connections for each request.
    // await onlinePrisma.$disconnect();
  }
}
