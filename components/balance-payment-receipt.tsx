"use client"

import { forwardRef } from "react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface BalancePaymentReceiptProps {
  payment: {
    id: string
    receiptNo: string
    amount: number
    paymentMethod: string
    notes?: string
    createdAt: string
    customer: {
      name: string
      phone: string
      email?: string
    }
    sale?: {
      invoiceNo: string
    }
  }
  companyInfo?: {
    name: string
    address: string
    phone: string
    email: string
  }
}

export const BalancePaymentReceipt = forwardRef<HTMLDivElement, BalancePaymentReceiptProps>(
  ({ payment, companyInfo }, ref) => {
    const defaultCompanyInfo = {
      name: "Your Company Name",
      address: "Company Address",
      phone: "Company Phone",
      email: "company@email.com"
    }

    const company = companyInfo || defaultCompanyInfo

    return (
      <div ref={ref} className="max-w-md mx-auto bg-white p-6 text-sm">
        {/* Company Header */}
        <div className="text-center border-b pb-4 mb-4">
          <h1 className="text-xl font-bold">{company.name}</h1>
          <p className="text-gray-600">{company.address}</p>
          <p className="text-gray-600">Tel: {company.phone}</p>
          <p className="text-gray-600">Email: {company.email}</p>
        </div>

        {/* Receipt Title */}
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold">BALANCE PAYMENT RECEIPT</h2>
          <p className="text-gray-600">Receipt No: {payment.receiptNo}</p>
        </div>

        {/* Receipt Details */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="font-medium">Date:</span>
            <span>{formatDate(payment.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Time:</span>
            <span>{new Date(payment.createdAt).toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Customer Information */}
        <div className="border-t border-b py-3 mb-4">
          <h3 className="font-bold mb-2">Customer Information</h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="font-medium">Name:</span>
              <span>{payment.customer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Phone:</span>
              <span>{payment.customer.phone}</span>
            </div>
            {payment.customer.email && (
              <div className="flex justify-between">
                <span className="font-medium">Email:</span>
                <span>{payment.customer.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Information */}
        <div className="space-y-2 mb-4">
          <h3 className="font-bold">Payment Details</h3>
          {payment.sale && (
            <div className="flex justify-between">
              <span className="font-medium">Invoice No:</span>
              <span>{payment.sale.invoiceNo}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="font-medium">Payment Method:</span>
            <span className="capitalize">{payment.paymentMethod.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Amount Paid:</span>
            <span>{formatCurrency(payment.amount)}</span>
          </div>
        </div>

        {/* Notes */}
        {payment.notes && (
          <div className="mb-4">
            <h3 className="font-bold mb-2">Notes</h3>
            <p className="text-gray-700">{payment.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t pt-4 text-center text-gray-600">
          <p className="mb-2">Thank you for your payment!</p>
          <p className="text-xs">
            This is a computer generated receipt and does not require signature.
          </p>
          <p className="text-xs mt-2">
            For any queries, please contact us at {company.phone}
          </p>
        </div>

        {/* Print styles */}
        <style jsx>{`
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .max-w-md {
              max-width: none;
              width: 100%;
            }
          }
        `}</style>
      </div>
    )
  }
)

BalancePaymentReceipt.displayName = "BalancePaymentReceipt"