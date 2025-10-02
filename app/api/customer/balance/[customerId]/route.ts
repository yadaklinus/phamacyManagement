// app/api/customer/[customerId]/balance/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

// Get customer balance
export async function GET(
  req: NextRequest,
  context:{params:Promise<{customerId:string}>}
) {
  const { customerId } = await context.params;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId, isDeleted: false },
      select: {
        id: true,
        name: true,
        accountBalance: true,
        phone: true,
        email: true,
      }
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Get balance transactions for this customer
    const balanceTransactions = await prisma.balanceTransaction.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 20, // Get last 20 transactions
    });

    return NextResponse.json({
      customer,
      balance: customer.accountBalance || 0,
      recentTransactions: balanceTransactions,
    });
  } catch (error) {
    console.error("Error fetching customer balance:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Add money to customer balance
export async function POST(
  req: NextRequest,
  context:{params:Promise<{customerId:string}>}
) {
  const { customerId } = await context.params;
  const { amount, description, paymentMethod, reference, warehouseId } = await req.json();

  try {
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId, isDeleted: false },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Generate transaction reference
    const transactionRef = `BAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update customer balance
      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: {
          accountBalance: {
            increment: amount
          }
        }
      });

      // Create balance transaction record
      const balanceTransaction = await tx.balanceTransaction.create({
        data: {
          customerId,
          amount,
          type: "CREDIT",
          description: description || "Balance deposit",
          paymentMethod: paymentMethod || "cash",
          reference: reference || transactionRef,
          warehouseId,
          balanceAfter: updatedCustomer.accountBalance,
        }
      });

      return { updatedCustomer, balanceTransaction };
    });

    return NextResponse.json({
      message: "Balance added successfully",
      newBalance: result.updatedCustomer.accountBalance,
      transaction: result.balanceTransaction,
    });
  } catch (error) {
    console.error("Error adding balance:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Deduct money from customer balance (for internal use)
export async function PUT(
  req: NextRequest,
 context:{params:Promise<{customerId:string}>}
) {
  const { customerId } = await context.params;
  const { amount, description, saleId, warehouseId } = await req.json();

  try {
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Verify customer exists and has sufficient balance
    const customer = await prisma.customer.findUnique({
      where: { id: customerId, isDeleted: false },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const currentBalance = customer.accountBalance || 0;
    
    // We allow partial payments, so don't check if balance is sufficient
    const deductAmount = Math.min(amount, currentBalance);
    const remainingDebt = amount - deductAmount;

    // Generate transaction reference
    const transactionRef = saleId ? `SALE-${saleId}` : `BAL-${Date.now()}`;

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update customer balance
      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: {
          accountBalance: {
            decrement: deductAmount
          }
        }
      });

      // Create balance transaction record
      const balanceTransaction = await tx.balanceTransaction.create({
        data: {
          customerId,
          amount: deductAmount,
          type: "DEBIT",
          description: description || "Purchase payment",
          reference: transactionRef,
          warehouseId,
          balanceAfter: updatedCustomer.accountBalance,
          saleId,
        }
      });

      return { updatedCustomer, balanceTransaction, deductAmount, remainingDebt };
    });

    return NextResponse.json({
      message: "Balance deducted successfully",
      newBalance: result.updatedCustomer.accountBalance,
      deductedAmount: result.deductAmount,
      remainingDebt: result.remainingDebt,
      transaction: result.balanceTransaction,
    });
  } catch (error) {
    console.error("Error deducting balance:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}