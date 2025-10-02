"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Receipt,
  Save,
  Eye,
  Upload,
  Download,
  Building2,
  Phone,
  Mail,
  Printer,
  CheckCircle,
  ImageIcon,
  X,
  Settings,
  Palette,
  FileText,
  Monitor,
} from "lucide-react"
import axios from "axios"
import { getWareHouseId } from "@/hooks/get-werehouseId"


// Default receipt settings
const defaultReceiptSettings = {
  // Company Information
  companyName: "INVENTORY PRO",
  businessName: "Management System",
  address: "123 Business Street",
  city: "Business City",
  state: "BC",
  country: "United States",
  phone: "01010101010",
  email: "info@inventorypro.com",
  website: "www.inventorypro.com",
 
  // Receipt Settings
  receiptTitle: "SALES INVOICE",
  headerMessage: "",
  footerMessage: "THANK YOU FOR YOUR BUSINESS!",
  showLogo: true,
  logoUrl: "",
  showQrCode: true,
  qrCodeContent: "website", // website, contact, custom
  customQrContent: "",

  // Display Options
  showCustomerInfo: true,
  showCashierInfo: true,
  showItemCodes: true,
  showItemDescriptions: true,
  showTaxBreakdown: true,
  showPaymentMethods: true,
  showBalance: true,

  // Format Settings
  paperSize: "80mm", // 57mm, 80mm, A4
  fontSize: "normal", // small, normal, large
  printDensity: "normal", // light, normal, dark
  lineSpacing: "normal", // compact, normal, wide

  // Branding
  primaryColor: "#000000",
  accentColor: "#666666",
  fontFamily: "monospace", // monospace, sans-serif, serif

  // Additional Settings
  printCopyCount: 1,
  autoPrint: false,
  showTimestamp: true,
  use24HourFormat: false,
  showItemNumbers: true,
  showRunningTotal: false,

  // Multi-language
  language: "en",
  currency: "USD",
  currencySymbol: "$",
  currencyPosition: "before", // before, after
}

export default function ReceiptSettingsPage() {
  const [settings, setSettings] = useState(defaultReceiptSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingSettings, setIsFetchingSettings] = useState(true)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const warehousesId = getWareHouseId()

  // Fetch existing settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      if (!warehousesId) return
      
      try {
        setIsFetchingSettings(true)
        const response = await axios.get(`/api/receipt?warehousesId=${warehousesId}`)
        
        if (response.data) {
          // Merge fetched settings with defaults to ensure all fields are present
          setSettings(prev => ({
            ...prev,
            ...response.data
          }))
        }
      } catch (error) {
        console.error("Error fetching receipt settings:", error)
        // Use default settings if fetch fails
      } finally {
        setIsFetchingSettings(false)
      }
    }

    fetchSettings()
  }, [warehousesId])

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await axios.post("/api/receipt", { ...settings, warehousesId })
      setHasChanges(false)
      setShowSuccessDialog(true)
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Error saving settings. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // In real app, this would upload to a server
      const reader = new FileReader()
      reader.onload = (e) => {
        updateSetting("logoUrl", e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "receipt-settings.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string)
          setSettings({ ...defaultReceiptSettings, ...importedSettings })
          setHasChanges(true)
        } catch (error) {
          alert("Invalid settings file. Please check the file format.")
        }
      }
      reader.readAsText(file)
    }
  }

  // Sample receipt data for preview
  const sampleReceiptData = {
    invoiceNo: "INV-000123",
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString([], { 
      hour12: !settings.use24HourFormat 
    }),
    customer: "John Doe",
    cashier: "Admin User",
    items: [
      { name: "iPhone 15 Pro", quantity: 1, price: 999.0, total: 999.0 },
      { name: "AirPods Pro", quantity: 2, price: 249.0, total: 498.0 },
    ],
    subtotal: 1497.0,
    discount: 0,
    tax: 149.7,
    total: 1646.7,
    paid: 1646.7,
    balance: 0,
    paymentMethod: "CASH",
  }

  if (isFetchingSettings) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p>Loading receipt settings...</p>
        </div>
      </div>
    )
  }

  return (
    <>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Receipt Settings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-6 w-6 text-blue-600" />
              <h1 className="text-3xl font-bold text-blue-600">Receipt Settings</h1>
              {hasChanges && <Badge variant="secondary">Unsaved Changes</Badge>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPreview(true)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button variant="outline" onClick={handleExportSettings}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <input type="file" accept=".json" onChange={handleImportSettings} className="hidden" ref={fileInputRef} />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </div>
          </div>

          <Tabs defaultValue="company" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="company">Company Info</TabsTrigger>
              <TabsTrigger value="receipt">Receipt Layout</TabsTrigger>
              <TabsTrigger value="display">Display Options</TabsTrigger>
              <TabsTrigger value="format">Format & Style</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* Company Information Tab */}
            <TabsContent value="company" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Information
                  </CardTitle>
                  <CardDescription>This information will appear on all receipts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        value={settings.companyName}
                        onChange={(e) => updateSetting("companyName", e.target.value)}
                        placeholder="Your Company Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        value={settings.businessName}
                        onChange={(e) => updateSetting("businessName", e.target.value)}
                        placeholder="Business Description"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={settings.address}
                      onChange={(e) => updateSetting("address", e.target.value)}
                      placeholder="Street Address"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={settings.city}
                        onChange={(e) => updateSetting("city", e.target.value)}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={settings.state}
                        onChange={(e) => updateSetting("state", e.target.value)}
                        placeholder="State"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={settings.country}
                        onChange={(e) => updateSetting("country", e.target.value)}
                        placeholder="Country"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        value={settings.phone}
                        onChange={(e) => updateSetting("phone", e.target.value)}
                        placeholder="Phone Number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={settings.email}
                        onChange={(e) => updateSetting("email", e.target.value)}
                        placeholder="Email Address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={settings.website}
                        onChange={(e) => updateSetting("website", e.target.value)}
                        placeholder="www.example.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Receipt Layout Tab */}
            <TabsContent value="receipt" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Receipt Layout & Content
                  </CardTitle>
                  <CardDescription>Configure what appears on your receipts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="receiptTitle">Receipt Title</Label>
                    <Input
                      id="receiptTitle"
                      value={settings.receiptTitle}
                      onChange={(e) => updateSetting("receiptTitle", e.target.value)}
                      placeholder="SALES INVOICE"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="headerMessage">Header Message</Label>
                    <Textarea
                      id="headerMessage"
                      value={settings.headerMessage}
                      onChange={(e) => updateSetting("headerMessage", e.target.value)}
                      placeholder="Optional message at the top of receipt"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="footerMessage">Footer Message</Label>
                    <Textarea
                      id="footerMessage"
                      value={settings.footerMessage}
                      onChange={(e) => updateSetting("footerMessage", e.target.value)}
                      placeholder="Thank you message"
                      rows={2}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="showLogo">Show Logo</Label>
                        <Switch
                          id="showLogo"
                          checked={settings.showLogo}
                          onCheckedChange={(checked) => updateSetting("showLogo", checked)}
                        />
                      </div>

                      {settings.showLogo && (
                        <div className="space-y-2">
                          <Label htmlFor="logoUpload">Logo Image</Label>
                          <div className="flex gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="flex-1"
                            />
                            {settings.logoUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateSetting("logoUrl", "")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {settings.logoUrl && (
                            <div className="mt-2">
                              <img
                                src={settings.logoUrl}
                                alt="Logo preview"
                                className="h-16 w-auto border rounded"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="showQrCode">Show QR Code</Label>
                        <Switch
                          id="showQrCode"
                          checked={settings.showQrCode}
                          onCheckedChange={(checked) => updateSetting("showQrCode", checked)}
                        />
                      </div>

                      {settings.showQrCode && (
                        <div className="space-y-2">
                          <Label htmlFor="qrCodeContent">QR Code Content</Label>
                          <Select
                            value={settings.qrCodeContent}
                            onValueChange={(value) => updateSetting("qrCodeContent", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="website">Website URL</SelectItem>
                              <SelectItem value="contact">Contact Info</SelectItem>
                              <SelectItem value="custom">Custom Text</SelectItem>
                            </SelectContent>
                          </Select>

                          {settings.qrCodeContent === "custom" && (
                            <div className="space-y-2">
                              <Label htmlFor="customQrContent">Custom QR Content</Label>
                              <Input
                                id="customQrContent"
                                value={settings.customQrContent}
                                onChange={(e) => updateSetting("customQrContent", e.target.value)}
                                placeholder="Enter custom text for QR code"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Display Options Tab */}
            <TabsContent value="display" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Display Options
                  </CardTitle>
                  <CardDescription>Choose what information to show on receipts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="showCustomerInfo">Customer Information</Label>
                        <Switch
                          id="showCustomerInfo"
                          checked={settings.showCustomerInfo}
                          onCheckedChange={(checked) => updateSetting("showCustomerInfo", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="showCashierInfo">Cashier Information</Label>
                        <Switch
                          id="showCashierInfo"
                          checked={settings.showCashierInfo}
                          onCheckedChange={(checked) => updateSetting("showCashierInfo", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="showItemCodes">Item Codes</Label>
                        <Switch
                          id="showItemCodes"
                          checked={settings.showItemCodes}
                          onCheckedChange={(checked) => updateSetting("showItemCodes", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="showItemDescriptions">Item Descriptions</Label>
                        <Switch
                          id="showItemDescriptions"
                          checked={settings.showItemDescriptions}
                          onCheckedChange={(checked) => updateSetting("showItemDescriptions", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="showItemNumbers">Item Numbers</Label>
                        <Switch
                          id="showItemNumbers"
                          checked={settings.showItemNumbers}
                          onCheckedChange={(checked) => updateSetting("showItemNumbers", checked)}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="showTaxBreakdown">Tax Breakdown</Label>
                        <Switch
                          id="showTaxBreakdown"
                          checked={settings.showTaxBreakdown}
                          onCheckedChange={(checked) => updateSetting("showTaxBreakdown", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="showPaymentMethods">Payment Methods</Label>
                        <Switch
                          id="showPaymentMethods"
                          checked={settings.showPaymentMethods}
                          onCheckedChange={(checked) => updateSetting("showPaymentMethods", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="showBalance">Balance</Label>
                        <Switch
                          id="showBalance"
                          checked={settings.showBalance}
                          onCheckedChange={(checked) => updateSetting("showBalance", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="showTimestamp">Timestamp</Label>
                        <Switch
                          id="showTimestamp"
                          checked={settings.showTimestamp}
                          onCheckedChange={(checked) => updateSetting("showTimestamp", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="showRunningTotal">Running Total</Label>
                        <Switch
                          id="showRunningTotal"
                          checked={settings.showRunningTotal}
                          onCheckedChange={(checked) => updateSetting("showRunningTotal", checked)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Format & Style Tab */}
            <TabsContent value="format" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Format & Style
                  </CardTitle>
                  <CardDescription>Customize the appearance of your receipts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="paperSize">Paper Size</Label>
                        <Select
                          value={settings.paperSize}
                          onValueChange={(value) => updateSetting("paperSize", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="57mm">57mm (Small)</SelectItem>
                            <SelectItem value="80mm">80mm (Standard)</SelectItem>
                            <SelectItem value="A4">A4 (Full Page)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fontSize">Font Size</Label>
                        <Select
                          value={settings.fontSize}
                          onValueChange={(value) => updateSetting("fontSize", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fontFamily">Font Family</Label>
                        <Select
                          value={settings.fontFamily}
                          onValueChange={(value) => updateSetting("fontFamily", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monospace">Monospace</SelectItem>
                            <SelectItem value="sans-serif">Sans Serif</SelectItem>
                            <SelectItem value="serif">Serif</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="printDensity">Print Density</Label>
                        <Select
                          value={settings.printDensity}
                          onValueChange={(value) => updateSetting("printDensity", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lineSpacing">Line Spacing</Label>
                        <Select
                          value={settings.lineSpacing}
                          onValueChange={(value) => updateSetting("lineSpacing", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compact">Compact</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="wide">Wide</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <Input
                          id="primaryColor"
                          type="color"
                          value={settings.primaryColor}
                          onChange={(e) => updateSetting("primaryColor", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Advanced Settings
                  </CardTitle>
                  <CardDescription>Advanced printing and localization options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="printCopyCount">Print Copies</Label>
                        <Input
                          id="printCopyCount"
                          type="number"
                          min="1"
                          max="10"
                          value={settings.printCopyCount}
                          onChange={(e) => updateSetting("printCopyCount", parseInt(e.target.value) || 1)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="autoPrint">Auto Print</Label>
                        <Switch
                          id="autoPrint"
                          checked={settings.autoPrint}
                          onCheckedChange={(checked) => updateSetting("autoPrint", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="use24HourFormat">24 Hour Format</Label>
                        <Switch
                          id="use24HourFormat"
                          checked={settings.use24HourFormat}
                          onCheckedChange={(checked) => updateSetting("use24HourFormat", checked)}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                          value={settings.currency}
                          onValueChange={(value) => updateSetting("currency", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                            <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currencySymbol">Currency Symbol</Label>
                        <Input
                          id="currencySymbol"
                          value={settings.currencySymbol}
                          onChange={(e) => updateSetting("currencySymbol", e.target.value)}
                          placeholder="$"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currencyPosition">Currency Position</Label>
                        <Select
                          value={settings.currencyPosition}
                          onValueChange={(value) => updateSetting("currencyPosition", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="before">Before Amount ($100)</SelectItem>
                            <SelectItem value="after">After Amount (100$)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              variant="outline"
              onClick={() => {
                setSettings(defaultReceiptSettings)
                setHasChanges(true)
              }}
            >
              Reset to Default
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || isLoading} className="min-w-[120px]">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Settings Saved Successfully!
              </DialogTitle>
              <DialogDescription>
                Your receipt settings have been updated. All new receipts will use these settings.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowPreview(true)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview Receipt
              </Button>
              <Button onClick={() => setShowSuccessDialog(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Receipt Preview
              </DialogTitle>
              <DialogDescription>Preview of how your receipt will look with current settings</DialogDescription>
            </DialogHeader>

            {/* Receipt Preview */}
            <div 
              className="bg-white p-4 border rounded-lg text-sm max-h-96 overflow-y-auto"
              style={{
                fontFamily: settings.fontFamily === 'monospace' ? 'monospace' : settings.fontFamily === 'serif' ? 'serif' : 'sans-serif',
                fontSize: settings.fontSize === 'small' ? '10px' : settings.fontSize === 'large' ? '14px' : '12px',
                color: settings.primaryColor
              }}
            >
              {/* Header */}
              <div className="text-center mb-4">
                {settings.showLogo && settings.logoUrl && (
                  <div className="mb-2">
                    <img src={settings.logoUrl} alt="Logo" className="h-8 mx-auto" />
                  </div>
                )}
                <div className="font-bold text-lg">{settings.companyName}</div>
                {settings.businessName && <div className="text-xs">{settings.businessName}</div>}
                <div className="text-xs mt-2">
                  <div>{settings.address}</div>
                  <div>{settings.city}, {settings.state} {settings.country}</div>
                  {settings.phone && <div>Tel: {settings.phone}</div>}
                  {settings.email && <div>Email: {settings.email}</div>}
                  {settings.website && <div>Web: {settings.website}</div>}
                </div>
              </div>

              {settings.headerMessage && (
                <div className="text-center text-xs mb-4 border-t border-b border-dashed py-2">
                  {settings.headerMessage}
                </div>
              )}

              {/* Receipt Title */}
              <div className="text-center font-bold border-b border-dashed pb-2 mb-4">{settings.receiptTitle}</div>

              {/* Sale Details */}
              <div className="text-xs space-y-1 mb-4">
                <div className="flex justify-between">
                  <span>INVOICE NO:</span>
                  <span>{sampleReceiptData.invoiceNo}</span>
                </div>
                {settings.showCustomerInfo && (
                  <div className="flex justify-between">
                    <span>CUSTOMER:</span>
                    <span>{sampleReceiptData.customer}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{sampleReceiptData.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>TIME:</span>
                  <span>{sampleReceiptData.time}</span>
                </div>
                {settings.showCashierInfo && (
                  <div className="flex justify-between">
                    <span>CASHIER:</span>
                    <span>{sampleReceiptData.cashier}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="border-t border-dashed pt-2 mb-2">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span>ITEM</span>
                  <span>QTY</span>
                  <span>AMOUNT</span>
                </div>
                {sampleReceiptData.items.map((item, index) => (
                  <div key={index} className="text-xs mb-1">
                    <div className="flex justify-between">
                      <span className="truncate flex-1 mr-2">{item.name}</span>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <span className="w-16 text-right">
                        {settings.currencyPosition === 'before' ? settings.currencySymbol : ''}{item.total.toFixed(2)}{settings.currencyPosition === 'after' ? settings.currencySymbol : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-dashed pt-2 mb-4 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>TOTAL:</span>
                  <span>
                    {settings.currencyPosition === 'before' ? settings.currencySymbol : ''}{sampleReceiptData.subtotal.toFixed(2)}{settings.currencyPosition === 'after' ? settings.currencySymbol : ''}
                  </span>
                </div>
                {settings.showTaxBreakdown && (
                  <div className="flex justify-between">
                    <span>TAX:</span>
                    <span>
                      {settings.currencyPosition === 'before' ? settings.currencySymbol : ''}{sampleReceiptData.tax.toFixed(2)}{settings.currencyPosition === 'after' ? settings.currencySymbol : ''}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>PAYABLE:</span>
                  <span>
                    {settings.currencyPosition === 'before' ? settings.currencySymbol : ''}{sampleReceiptData.total.toFixed(2)}{settings.currencyPosition === 'after' ? settings.currencySymbol : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>PAID:</span>
                  <span>
                    {settings.currencyPosition === 'before' ? settings.currencySymbol : ''}{sampleReceiptData.paid.toFixed(2)}{settings.currencyPosition === 'after' ? settings.currencySymbol : ''}
                  </span>
                </div>
                {settings.showBalance && (
                  <div className="flex justify-between">
                    <span>BALANCE:</span>
                    <span>
                      {settings.currencyPosition === 'before' ? settings.currencySymbol : ''}{sampleReceiptData.balance.toFixed(2)}{settings.currencyPosition === 'after' ? settings.currencySymbol : ''}
                    </span>
                  </div>
                )}
                {settings.showPaymentMethods && (
                  <div className="flex justify-between">
                    <span>PAID VIA:</span>
                    <span>{sampleReceiptData.paymentMethod}</span>
                  </div>
                )}
              </div>

              {/* QR Code */}
              {/* {settings.showQrCode && (
                <QrCodeBox
                qrContent="https://example.com"
                settings={{
                  primaryColor:defaultReceiptSettings.primaryColor,
                  accentColor: defaultReceiptSettings.accentColor
                }}
              />
              )} */}

              {/* Footer */}
              <div className="text-center text-xs border-t border-dashed pt-2">
                <div>Copyright © 2024 {settings.companyName}</div>
                {settings.footerMessage && <div className="font-bold mt-2">{settings.footerMessage}</div>}
                {settings.showTimestamp && <div className="mt-2 text-gray-500">{new Date().toLocaleString()}</div>}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close Preview
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
  )
}