import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/oflinePrisma";
export async function POST(req:NextRequest) {
  const {invoiceNo} = await req.json()

  try {
    // Find the sale by invoice number
    const sale = await prisma.sale.findUnique({
      where: { invoiceNo,isDeleted:false },
      include: {
        selectedCustomer: true,
        saleItems: {
          include: {
            product: true,
          },
        },
        paymentMethod: true,
        warehouses: true,
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Sale not found" },
        { status: 404 }
      );
    }

    // Format the response data
    const dateObj = new Date(sale.createdAt);
    const formattedDate = dateObj.toISOString().split("T")[0];
    const formattedTime = dateObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const formattedSale = {
      id: sale.id,
      invoiceNo: sale.invoiceNo,
      date: formattedDate,
      time: formattedTime,
      customer: sale.selectedCustomer
        ? {
            id: sale.selectedCustomer.id,
            name: sale.selectedCustomer.name,
            type: sale.selectedCustomer.type,
            email: sale.selectedCustomer.email,
            phoneNumber: sale.selectedCustomer.phone,
            address: sale.selectedCustomer.address,
          }
        : {
            id: "WALK-IN",
            name: "Walk-in Customer",
            type: "retail",
            email: "",
            phoneNumber: "",
            address: "",
          },
      items: sale.saleItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        cost: item.cost,
        selectedPrice: item.selectedPrice,
        priceType: item.priceType,
        discount: item.discount,
        total: item.total,
        product: item.product
          ? {
              barcode: item.product.barcode,
              name: item.product.name,
              unit: item.product.unit,
            }
          : null,
      })),
      paymentMethods: sale.paymentMethod.map((method) => ({
        id: method.id,
        method: method.method,
        amount: method.amount,

      })),
      subtotal: sale.subTotal,
      taxRate: sale.taxRate,
      grandTotal: sale.grandTotal,
      amountPaid: sale.amountPaid ?? 0,
      paidAmount: sale.paidAmount,
      balance: sale.balance,
      notes: sale.notes,
      status:
        sale.balance === 0
          ? "completed"
          : sale.amountPaid && sale.amountPaid > 0
          ? "partial"
          : "pending",
      warehouse: sale.warehouses
        ? {
            id: sale.warehouses.id,
            code: sale.warehouses.warehouseCode,
            name: sale.warehouses.name,
            address: sale.warehouses.address,
          }
        : null,
      createdAt: sale.createdAt,
    };

    return NextResponse.json(formattedSale);
  } catch (error) {
    console.error("Error fetching sale details:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}