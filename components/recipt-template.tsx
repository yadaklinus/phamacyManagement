"use client"

import { forwardRef } from "react"

interface ReceiptItem {
  name: string
  quantity: number
  price: number
  total: number
}

interface ReceiptData {
  invoiceNo: string
  date: string
  time: string
  customer: string
  cashier: string
  items: ReceiptItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  paid: number
  balance: number
  paymentMethod: string
}

interface ReceiptTemplateProps {
  data: ReceiptData
}

export const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptTemplateProps>(({ data }, ref) => {
  return (
    <div ref={ref} className="receipt-container bg-white p-6 max-w-sm mx-auto font-mono text-sm">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="mb-2">
          <div className="text-lg font-bold">INVENTORY PRO</div>
          <div className="text-xs">Management System</div>
        </div>
        <div className="text-xs space-y-1">
          <div>Address: 123 Business Street</div>
          <div>Tel: 01010101010</div>
          <div>Email: info@inventorypro.com</div>
        </div>
      </div>

      {/* Invoice Title */}
      <div className="text-center mb-4">
        <div className="text-base font-bold border-b border-dashed border-gray-400 pb-2">SALES INVOICE</div>
      </div>

      {/* Invoice Details */}
      <div className="mb-4 space-y-1 text-xs">
        <div className="flex justify-between">
          <span>SALES POINT:</span>
          <span>Store One</span>
        </div>
        <div className="flex justify-between">
          <span>CASHIER:</span>
          <span>{data.cashier}</span>
        </div>
        <div className="flex justify-between">
          <span>INVOICE NO:</span>
          <span>{data.invoiceNo}</span>
        </div>
        <div className="flex justify-between">
          <span>CUSTOMER:</span>
          <span>{data.customer}</span>
        </div>
        <div className="flex justify-between">
          <span>DATE:</span>
          <span>{data.date}</span>
        </div>
        <div className="flex justify-between">
          <span>TIME:</span>
          <span>{data.time}</span>
        </div>
      </div>

      {/* Items Header */}
      <div className="border-t border-dashed border-gray-400 pt-2 mb-2">
        <div className="flex justify-between text-xs font-bold">
          <span>ITEM</span>
          <span>QTY</span>
          <span>AMOUNT</span>
        </div>
      </div>

      {/* Items List */}
      <div className="mb-4 space-y-1">
        {data.items.map((item, index) => (
          <div key={index} className="text-xs">
            <div className="flex justify-between">
              <span className="truncate flex-1 mr-2">{item.name}</span>
              <span className="w-8 text-center">{item.quantity}</span>
              <span className="w-16 text-right">₦{item.total.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-dashed border-gray-400 pt-2 mb-4 space-y-1 text-xs">
        <div className="flex justify-between">
          <span>TOTAL:</span>
          <span>₦{data.subtotal.toFixed(2)}</span>
        </div>
        {data.discount > 0 && (
          <div className="flex justify-between">
            <span>DISCOUNT:</span>
            <span>₦{data.discount.toFixed(2)}</span>
          </div>
        )}
        {data.tax > 0 && (
          <div className="flex justify-between">
            <span>TAX:</span>
            <span>₦{data.tax.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold">
          <span>PAYABLE:</span>
          <span>₦{data.total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>PAID:</span>
          <span>₦{data.paid.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>BALANCE:</span>
          <span>₦{data.balance.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>PAID VIA:</span>
          <span>{data.paymentMethod.toUpperCase()}</span>
        </div>
      </div>

      {/* QR Code Placeholder */}
      <div className="text-center mb-4">
        <div className="inline-block border-2 border-gray-400 p-4">
          <div className="w-16 h-16 bg-gray-200 flex items-center justify-center text-xs">QR CODE</div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs border-t border-dashed border-gray-400 pt-2">
        <div>Copyright © 2024 INVENTORY PRO</div>
        <div>Management System</div>
      </div>

      {/* Thank You Message */}
      <div className="text-center text-xs mt-4 font-bold">THANK YOU FOR YOUR BUSINESS!</div>
    </div>
  )
})

ReceiptTemplate.displayName = "ReceiptTemplate"
