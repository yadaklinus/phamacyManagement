import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

// POST - Create a new balance payment
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { customerId, saleId, amount, paymentMethod, notes, warehousesId } = body;

        // Validate required fields
        if (!customerId || !amount || !paymentMethod) {
            return NextResponse.json(
                { error: "Customer ID, amount, and payment method are required" },
                { status: 400 }
            );
        }

        // Check if customer exists
        const customer = await prisma.customer.findUnique({
            where: { id: customerId, isDeleted: false }
        });

        if (!customer) {
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404 }
            );
        }

        // If saleId is provided, check if sale exists and has outstanding balance
        let sale = null;
        if (saleId) {
            sale = await prisma.sale.findUnique({
                where: { invoiceNo: saleId, isDeleted: false }
            });

            if (!sale) {
                return NextResponse.json(
                    { error: "Sale not found" },
                    { status: 404 }
                );
            }

            if (sale.balance <= 0) {
                return NextResponse.json(
                    { error: "Sale has no outstanding balance" },
                    { status: 400 }
                );
            }

            if (amount > sale.balance) {
                return NextResponse.json(
                    { error: "Payment amount cannot exceed outstanding balance" },
                    { status: 400 }
                );
            }
        }

        // Generate unique receipt number
        const timestamp = Date.now();
        const receiptNo = `BP-${timestamp}`;

        // Create balance payment record
        const balancePayment = await prisma.balancePayment.create({
            data: {
                customerId,
                saleId: saleId || null,
                amount: parseFloat(amount),
                paymentMethod,
                receiptNo,
                notes: notes || null,
                warehousesId: warehousesId || null
            },
            include: {
                customer: true,
                sale: true
            }
        });

        // Update sale balance if saleId is provided
        if (saleId && sale) {
            const newBalance = sale.balance - parseFloat(amount);
            const newPaidAmount = sale.paidAmount + parseFloat(amount);

            await prisma.sale.update({
                where: { invoiceNo: saleId },
                data: {
                    balance: newBalance,
                    paidAmount: newPaidAmount
                }
            });
        }

        return NextResponse.json({
            success: true,
            balancePayment,
            message: "Balance payment processed successfully"
        }, { status: 201 });

    } catch (error) {
        console.error("Error processing balance payment:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// GET - Fetch balance payments for a customer
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const customerId = searchParams.get('customerId');

        if (!customerId) {
            return NextResponse.json(
                { error: "Customer ID is required" },
                { status: 400 }
            );
        }

        const balancePayments = await prisma.balancePayment.findMany({
            where: {
                customerId,
                isDeleted: false
            },
            include: {
                customer: true,
                sale: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({
            success: true,
            balancePayments
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching balance payments:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}