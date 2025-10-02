import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/oflinePrisma";

export async function POST(req: NextRequest) {
  const { warehouseId } = await req.json();

  try {
    const warehouse = await prisma.warehouses.findUnique({
    
      where: { warehouseCode: warehouseId,isDeleted:false },
      
    });

    if (!warehouse)
      return NextResponse.json("Warehouse does not exist", {
        status: 401,
      });

    
    const sales = await prisma.sale.findMany({
      where: { warehousesId: warehouseId,isDeleted:false },
      orderBy:{
        createdAt:"desc"
      },
      include: {
        selectedCustomer: true,
      },
    });

   
    const saleItems = await prisma.saleItem.findMany({
      where: { warehousesId: warehouseId,isDeleted:false },
    });

    const paymentMethod = await prisma.paymentMethod.findMany({
      where: { warehousesId: warehouseId,isDeleted:false },
    });

   
    const data = sales.map((sale:any) => {
      const dateObj = new Date(sale.createdAt);
      const formattedDate = dateObj.toISOString().split("T")[0];
      const formattedTime = dateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const items = saleItems
        .filter((item:any) => item.saleId === sale.invoiceNo)
        .map((item:any) => ({
          id: item.id,
          productName: item.productName,
          quantity: item.quantity,
          price: item.selectedPrice,
          total: item.total,
          profit: item.profit,
          priceType: item.priceType,
        }));

      const payment = paymentMethod
      .filter((method:any) => method.saleId === sale.invoiceNo)
      .map((method:any) => ({
        id: method.id,
        method: method.method,
        amount: method.amount,
      }));

      return {
        id: sale.id,
        invoiceNo: sale.invoiceNo,
        date: formattedDate,
        time: formattedTime,
        customer: sale.selectedCustomer
          ? {
              id: sale.selectedCustomer.id,
              name: sale.selectedCustomer.name,
              type: sale.selectedCustomer.type,
            }
          : {
              id: "WALK-IN",
              name: "Walk-in Customer",
              type: "retail",
            },
        items,
        subtotal: sale.subTotal,
        tax: sale.taxRate,
        total: sale.grandTotal,
        amountPaid: sale.amountPaid ?? 0,
        balance: sale.balance,
        paymentMethod:payment,
        status:
          sale.balance === 0
            ? "completed"
            : sale.amountPaid && sale.amountPaid > 0
            ? "partial"
            : "pending",
        cashier: "Admin User", 
      };
    });

   

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching sales data:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
