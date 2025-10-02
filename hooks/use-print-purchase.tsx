"use client"

import { formatCurrency } from "@/lib/utils"
import { useCallback, useEffect, useState } from "react"
import { getWareHouseId } from "./get-werehouseId"
import axios from "axios"

// Define interfaces for purchase receipts
interface PurchaseItem {
  id?: string | number;
  name: string
  productBarcode: string
  quantity: number
  cost: number
  discount: number
  total: number
  unit?: string
}

interface PurchaseReceiptData {
  referenceNo: string
  invoiceNo?: string
  date: string
  time: string
  supplier: string
  warehouse: string
  items: PurchaseItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  shipping: number
  total: number
  paidAmount: number
  balance: number
  status: string
  notes?: string
}

interface ReceiptSettings {
  companyName: string
  businessName: string
  address: string
  city: string
  state: string
  country: string
  phone: string
  email: string
  website: string
  receiptTitle?: string
  headerMessage?: string
  footerMessage?: string
  showLogo?: boolean
  logoUrl?: string
  showQrCode?: boolean
  qrCodeContent?: string
  customQrContent?: string
  showSupplierInfo?: boolean
  showWarehouseInfo?: boolean
  showBalance?: boolean
  showTimestamp?: boolean
  showItemNumbers?: boolean
  paperSize?: "57mm" | "80mm" | "A4"
  fontSize?: "small" | "normal" | "large"
  lineSpacing?: "compact" | "normal" | "wide"
  fontFamily?: "monospace" | "sans-serif" | "serif"
  autoPrint?: boolean
  language?: string
  currencySymbol?: string
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
}

// --- Default Settings ---
const DEFAULT_SETTINGS: ReceiptSettings = {
  // --- Business Information (Replace with your own) ---
  companyName: "Your Company Name",
  businessName: "Your Business Slogan or Tagline",
  address: "123 Main Street",
  city: "Anytown",
  state: "Anystate",
  country: "Your Country",
  phone: "+123-456-7890",
  email: "contact@yourcompany.com",
  website: "www.yourcompany.com",

  // --- Receipt Content ---
  receiptTitle: "PURCHASE ORDER",
  headerMessage: "Purchase Order Receipt",
  footerMessage: "Thank you for your business!",

  // --- Bank Details (Optional) ---
  bankName: "Your Bank Name",
  accountName: "Your Account Name",
  accountNumber: "1234567890",

  // --- Display & Feature Toggles ---
  showLogo: true,
  logoUrl: "", // Example: "https://example.com/logo.png"
  showQrCode: false,
  qrCodeContent: "website", // Can be 'website', 'invoiceNo', or 'custom'
  customQrContent: "",    // Used if qrCodeContent is 'custom'
  showSupplierInfo: true,
  showWarehouseInfo: true,
  showBalance: true,
  showTimestamp: true,
  showItemNumbers: true,

  // --- Printing & Style Settings ---
  paperSize: "A4",          // "57mm", "80mm", or "A4"
  fontSize: "normal",       // "small", "normal", or "large"
  lineSpacing: "normal",    // "compact", "normal", or "wide"
  fontFamily: "sans-serif", // "monospace", "sans-serif", or "serif"
  autoPrint: false,

  // --- Localization ---
  language: "en",
  // Dynamically sets the currency symbol based on the system's locale.
  // Replace with a static string like "₦" or "$" if needed.
  currencySymbol: `${formatCurrency(0)[0]}`,
};

// --- Style Maps for Readability ---
const FONT_SIZES = {
  "57mm": { small: "9px", normal: "10px", large: "11px" },
  "80mm": { small: "10px", normal: "12px", large: "14px" },
  A4: { small: "12px", normal: "14px", large: "16px" }, // A4 sizes are for reference, not used in thermal
}

const LINE_HEIGHTS = {
  "57mm": { small: "11px", normal: "12px", large: "13px" },
  "80mm": { small: "12px", normal: "14px", large: "16px" },
  A4: { small: "14px", normal: "18px", large: "22px" }, // A4 sizes are for reference, not used in thermal
}

// --- HELPER FUNCTIONS (Defined before the hook for proper scope) ---

// Helper function to calculate styles for thermal receipts
function getReceiptStyles(paperSize: "57mm" | "80mm", settings: ReceiptSettings) {
  const width = paperSize;
  const fontSize = FONT_SIZES[paperSize][settings.fontSize || "normal"];
  const lineHeight = LINE_HEIGHTS[paperSize][settings.fontSize || "normal"];
  
  let spacingMultiplier = 1.0;
  if (settings.lineSpacing === "compact") spacingMultiplier = 0.8;
  if (settings.lineSpacing === "wide") spacingMultiplier = 1.2;
  const adjustedLineHeight = `${parseFloat(lineHeight) * spacingMultiplier}px`;

  const fontFamily = 
    settings.fontFamily === "sans-serif" ? "Arial, sans-serif" :
    settings.fontFamily === "serif" ? "Times, serif" :
    "'Courier New', monospace";
  
  return { width, fontSize, adjustedLineHeight, fontFamily, paperSize };
}

// --- A4 PURCHASE ORDER HTML ---
function generateA4PurchaseOrder(data: PurchaseReceiptData, settings: ReceiptSettings) {
    const fontColor = "#000";

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Purchase Order - ${data.referenceNo}</title>
        <style>
          @page { 
            size: A4; 
            margin: 0; 
          }
          html, body {
            margin: 0;
            padding: 0;
            width: 210mm;
            height: 297mm;
            font-family: Arial, sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: ${fontColor};
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .purchase-container {
            width: 100%;
            height: 100%;
            padding: 10mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 10px;
            border-bottom: 2px solid #000;
            flex-shrink: 0;
          }
          .company-info {
            display: flex;
            align-items: center;
          }
          .company-info img {
            width: 70px;
            height: 70px;
            margin-right: 10px;
          }
          .company-details .company-name {
            font-size: 16px;
            font-weight: bold;
            margin: 0;
          }
          .company-details .business-name, .company-details .address {
            font-size: 10px;
            margin: 2px 0;
          }
          .purchase-meta {
            border: 1px solid #000;
            padding: 5px;
            min-width: 200px;
          }
          .purchase-meta table {
            width: 100%;
            border-collapse: collapse;
          }
          .purchase-meta td {
            padding: 2px 4px;
            font-size: 10px;
          }
          .supplier-info {
            padding: 10px 0;
            flex-shrink: 0;
          }
          .items-table-container {
            flex-grow: 1;
            overflow: hidden;
            position: relative;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          .items-table th, .items-table td {
            border: 1px solid #000;
            padding: 4px;
            text-align: left;
            word-wrap: break-word;
          }
          .items-table th {
            font-weight: bold;
            background-color: #f2f2f2;
          }
          .items-table .col-small { width: 5%; }
          .items-table .col-medium { width: 15%; }
          .items-table .col-large { width: 35%; }
          .items-table .align-right { text-align: right; }
          .footer {
            padding-top: 10px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            flex-shrink: 0;
          }
          .bank-details {
            font-size: 10px;
          }
          .totals {
            width: 250px;
            border: 1px solid #000;
            padding: 5px;
          }
          .totals table {
            width: 100%;
          }
          .totals td {
            padding: 3px 5px;
            font-size: 12px;
          }
          .totals .grand-total td {
            font-weight: bold;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="purchase-container">
          <div class="header">
            <div class="company-info">
              ${settings.showLogo && settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" />` : ''}
              <div class="company-details">
                <h1 class="company-name">${settings.companyName}</h1>
                <p class="business-name">${settings.businessName}</p>
                <p class="address">${settings.address}</p>
              </div>
            </div>
            <div class="purchase-meta">
              <table>
                <tr><td><strong>PURCHASE ORDER</strong></td><td>${data.referenceNo}</td></tr>
                <tr><td><strong>Date</strong></td><td>${data.date} ${data.time}</td></tr>
                <tr><td><strong>Warehouse</strong></td><td>${data.warehouse}</td></tr>
                <tr><td><strong>Items</strong></td><td>${data.items.length}</td></tr>
              </table>
            </div>
          </div>

          ${settings.showSupplierInfo ? `
          <div class="supplier-info">
            <strong>Supplier: ${data.supplier}</strong>
          </div>
          ` : ''}
          
          <div class="items-table-container">
            <table class="items-table">
              <thead>
                <tr>
                  <th class="col-small">#</th>
                  <th class="col-large">PRODUCT</th>
                  <th class="col-medium">BARCODE</th>
                  <th class="col-small">QTY</th>
                  <th class="col-medium align-right">COST</th>
                  <th class="col-medium align-right">DISCOUNT</th>
                  <th class="col-medium align-right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${data.items.map((item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.productBarcode}</td>
                    <td>${item.quantity}${item.unit ? ' ' + item.unit : ''}</td>
                    <td class="align-right">${formatCurrency(item.cost)}</td>
                    <td class="align-right">${formatCurrency(item.discount)}</td>
                    <td class="align-right">${formatCurrency(item.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <div class="bank-details">
              Powered by CodeGit
            </div>
            <div class="totals">
              <table>
                <tr><td>Sub Total:</td><td class="align-right">${formatCurrency(data.subtotal)}</td></tr>
                <tr><td>Tax (${data.taxRate}%):</td><td class="align-right">${formatCurrency(data.taxAmount)}</td></tr>
                <tr><td>Shipping:</td><td class="align-right">${formatCurrency(data.shipping)}</td></tr>
                <tr class="grand-total"><td>Grand Total:</td><td class="align-right">${formatCurrency(data.total)}</td></tr>
                <tr><td>Paid Amount:</td><td class="align-right">${formatCurrency(data.paidAmount)}</td></tr>
                ${data.balance > 0 ? `<tr><td><strong>Balance Due:</strong></td><td class="align-right"><strong>${formatCurrency(data.balance)}</strong></td></tr>` : ''}
                ${data.balance < 0 ? `<tr><td>Change:</td><td class="align-right">${formatCurrency(Math.abs(data.balance))}</td></tr>` : ''}
              </table>
            </div>
          </div>
          
          ${data.notes ? `
          <div style="margin-top: 20px;">
            <h3>Notes:</h3>
            <p>${data.notes}</p>
          </div>
          ` : ''}
        </div>
      </body>
    </html>
    `;
}

// --- THERMAL PURCHASE ORDER HTML (for 57mm and 80mm) ---
function generateThermalPurchaseOrder(data: PurchaseReceiptData, settings: ReceiptSettings, paperSize: "57mm" | "80mm") {
    const styles = getReceiptStyles(paperSize, settings);
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Purchase Order - ${data.referenceNo}</title>
        <style>
          @page { size: ${styles.width} auto; margin: 0; }
          body { 
            font-family: ${styles.fontFamily}; 
            font-size: ${styles.fontSize}; 
            line-height: ${styles.adjustedLineHeight};
            width: ${styles.width}; 
            margin: auto; 
            padding: 8px; 
            box-sizing: border-box; 
          }
          .header, .totals, .supplier-section, .footer { text-align: center; border-top: 1px dashed #666; padding-top: 8px; margin-top: 8px; }
          .header { border-top: none; padding-top: 0; margin-top: 0; }
          .company-name { font-weight: bold; font-size: 1.4em; }
          .total-line { display: flex; justify-content: space-between; margin: 2px 0; }
          .grand-total { font-weight: bold; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
          .item-header { font-weight: bold; }
          .item-details { display: flex; justify-content: space-between; }
          .footer { font-size: 0.8em; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          ${settings.showLogo && settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" style="max-height: 40px; margin-bottom: 8px;" />` : ""}
          <div class="company-name">${settings.companyName}</div>
          ${settings.businessName ? `<div>${settings.businessName}</div>` : ""}
          <div style="font-size: 0.8em; margin-top: 4px;">
            <div>${settings.address}, ${settings.city}, ${settings.state}</div>
            ${settings.phone ? `<div>Phone: ${settings.phone}</div>` : ""}
          </div>
        </div>
        <div class="receipt-title" style="text-align: center; font-weight: bold; margin: 8px 0; border-bottom: 1px dashed #666; padding-bottom: 8px;">
          ${settings.receiptTitle || "PURCHASE ORDER"}
        </div>
        <div class="purchase-info" style="margin-bottom: 8px;">
          <div><strong>Reference:</strong> ${data.referenceNo}</div>
          <div><strong>Date:</strong> ${data.date} ${data.time}</div>
          ${settings.showSupplierInfo ? `<div><strong>Supplier:</strong> ${data.supplier}</div>` : ""}
          ${settings.showWarehouseInfo ? `<div><strong>Warehouse:</strong> ${data.warehouse}</div>` : ""}
        </div>
        <div class="items">
          <div style="border-top: 1px dashed #666; border-bottom: 1px dashed #666; padding: 4px 0; margin-bottom: 8px; font-weight: bold;">ITEMS</div>
          ${data.items.map((item, index) => `
            <div class="item" style="margin-bottom: 4px;">
              <div class="item-header">${settings.showItemNumbers ? `${index + 1}. ` : ""}${item.name}</div>
              <div style="font-size: 0.8em; color: #666;">Barcode: ${item.productBarcode}</div>
              <div class="item-details">
                <span>${item.quantity}${item.unit ? ' ' + item.unit : ''} x ${formatCurrency(item.cost)}</span>
                <span>${formatCurrency(item.total)}</span>
              </div>
              ${item.discount > 0 ? `<div style="font-size: 0.8em; color: #666;">Discount: ${formatCurrency(item.discount)}</div>` : ''}
            </div>
          `).join("")}
        </div>
        <div class="totals">
          <div class="total-line"><span>Subtotal:</span><span>${formatCurrency(data.subtotal)}</span></div>
          <div class="total-line"><span>Tax (${data.taxRate}%):</span><span>${formatCurrency(data.taxAmount)}</span></div>
          <div class="total-line"><span>Shipping:</span><span>${formatCurrency(data.shipping)}</span></div>
          <div class="total-line grand-total"><span>TOTAL:</span><span>${formatCurrency(data.total)}</span></div>
        </div>
        <div class="supplier-section">
          <div style="font-weight: bold; margin-bottom: 4px;">PAYMENT</div>
          <div class="total-line">
            <span>Paid Amount:</span>
            <span>${formatCurrency(data.paidAmount)}</span>
          </div>
          ${settings.showBalance && data.balance !== 0 ? `
            <div class="total-line"><span>Balance:</span><span>${formatCurrency(Math.abs(data.balance))}</span></div>
          ` : ""}
        </div>
        <div class="footer">
          ${settings.footerMessage ? `<div style="font-weight: bold; margin-top: 4px;">${settings.footerMessage}</div>` : ""}
          ${settings.showTimestamp ? `<div style="margin-top: 8px;">Generated: ${new Date().toLocaleString()}</div>` : ""}
          ${data.notes ? `
          <div style="margin-top: 8px; border-top: 1px dashed #666; padding-top: 8px;">
            <div style="font-weight: bold;">Notes:</div>
            <div style="font-size: 0.8em;">${data.notes}</div>
          </div>
          ` : ''}
        </div>
      </body>
    </html>
    `;
}

// --- Main Hook Definition ---
export function usePrintPurchase() {
  const warehousesId = getWareHouseId()
  const [settings, setSettings] = useState<ReceiptSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- Fetches settings once on mount ---
  useEffect(() => {
    if (!warehousesId) {
      setIsLoading(false)
      return
    }

    const fetchSettings = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await axios.get(`/api/receipt?warehousesId=${warehousesId}`)
        if (response.data) {
          setSettings(prevSettings => ({ ...prevSettings, ...response.data }))
        }
      } catch (err) {
        console.error("Error fetching receipt settings:", err)
        setError("Could not load receipt settings. Using defaults.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [warehousesId])

  const printPurchaseReceipt = useCallback(
    async (data: PurchaseReceiptData, paperWidth:"A4") => {
      if (isLoading) {
        alert("Receipt settings are still loading. Please wait a moment.")
        return
      }
      if (error) {
        alert(error)
      }

      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        alert("Could not open print window. Please disable your pop-up blocker.")
        return
      }

      try {
        const effectivePaperWidth = paperWidth || settings.paperSize || "80mm"
        
        // --- HTML Generation ---
        const html = (effectivePaperWidth === 'A4') 
            ? generateA4PurchaseOrder(data, settings)
            : generateThermalPurchaseOrder(data, settings, effectivePaperWidth);

        printWindow.document.write(html)
        printWindow.document.close()

        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print()
            if (settings.autoPrint) {
              setTimeout(() => printWindow.close(), 500)
            }
          }, 250)
        }
      } catch (e) {
        console.error("Error generating or printing purchase receipt:", e)
        alert("An unexpected error occurred while printing.")
        printWindow.close()
      }
    },
    [settings, isLoading, error]
  )

  return { printPurchaseReceipt, isLoading, error }
}