"use client"

import type React from "react"

import { useEffect, useState } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Settings,
  Building2,
  Upload,
  Palette,
  DollarSign,
} from "lucide-react"
import fetchData from "@/hooks/fetch-data"

export default function SettingsPage() {
  const [logo, setLogo] = useState<string | null>(null)
  

  const [companyName,setCompanyName] = useState("")
  const [companyEmail,setCompanyEmail] = useState("")
  const [phoneNumber,setPhoneNumber] = useState("")
  const [websiteUrl,setWebsiteUrl] = useState("")
  const [address,setAddress] = useState("")
  const [logoUrl,setLogoUrl] = useState("")
  const [defaultCurrency,setDefaultCurrency] = useState("")
  const [taxRate,setTaxRate] = useState("")
  const [mode,setMode] = useState("")
  const [itemsPerPage,setItemsPerPage] = useState("")

  
  const {data,loading,error} = fetchData("/api/settings")

  useEffect(() => {
    if (data) {
      setCompanyName(data.cpmpanyName ?? "");
      setCompanyEmail(data.companyEmail ?? "");
      setPhoneNumber(data.phoneNumber ?? "");
      setWebsiteUrl(data.websiteURL ?? "");
      setAddress(data.address ?? "");
      setLogoUrl(data.loguUrl ?? "");
      setDefaultCurrency(data.defaultCurrency ?? "");
      setTaxRate(String(data.taxRate ?? ""));
      setMode(data.mode ?? "");
      setItemsPerPage(String(data.itermsPerPage ?? ""));
    }
  }, [data]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading settings</div>;
 


  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogo(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleComponyInfo(e:React.ChangeEvent<HTMLFormElement>){
    e.preventDefault()
   
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
                  <BreadcrumbPage>Settings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-blue-600" />
            <h1 className="text-2xl font-semibold text-blue-600">Application Settings</h1>
          </div>
          <form onSubmit={handleComponyInfo}>
          <Tabs defaultValue="company" className="w-full sm:grid">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="company">Company</TabsTrigger>
              {/* <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="import-export">Import/Export</TabsTrigger> */}
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              {/* <TabsTrigger value="security">Security</TabsTrigger> */}
            </TabsList>

            {/* Company Information Tab */}
            
            <TabsContent value="company" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Information
                  </CardTitle>
                  <CardDescription>Configure your company details and branding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Company Name *</Label>
                      <Input value={companyName} onChange={(e)=>setCompanyName(e.target.value)} id="company-name" placeholder="Enter company name" defaultValue="Inventory Pro" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-email">Company Email *</Label>
                      <Input value={companyEmail} onChange={(e)=>setCompanyEmail(e.target.value)} id="company-email" type="email" placeholder="company@example.com" />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)} id="phone" placeholder="+1 (555) 123-4567" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)} id="website" placeholder="https://www.company.com" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea value={address}
                      onChange={(e) => setAddress(e.target.value)} id="address" placeholder="Enter company address" rows={3} />
                  </div>

                  <div className="space-y-4">
                    <Label>Company Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                        {logo ? (
                          <img
                            src={logo || "/placeholder.svg"}
                            alt="Company Logo"
                            className="w-full h-full object-contain rounded-lg"
                          />
                        ) : (
                          <Upload className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Input type="file" accept="image/*" onChange={handleLogoUpload} className="w-64" />
                        <p className="text-xs text-muted-foreground">Recommended size: 200x200px. Max file size: 2MB</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Business Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Default Currency</Label>
                      <Select defaultValue={"ngn"}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ngn">NGN (₦)</SelectItem>
                          <SelectItem value="usd">USD ($)</SelectItem>
                          <SelectItem value="eur">EUR (€)</SelectItem>
                          <SelectItem value="gbp">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
                      <Input value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)} id="tax-rate" type="number" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fiscal-year">Fiscal Year Start</Label>
                      <Select defaultValue="january">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="january">January</SelectItem>
                          <SelectItem value="april">April</SelectItem>
                          <SelectItem value="july">July</SelectItem>
                          <SelectItem value="october">October</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Appearance Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">Enable dark theme</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Compact Mode</Label>
                        <p className="text-sm text-muted-foreground">Use compact layout for tables</p>
                      </div>
                      <Switch />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="items-per-page">Items Per Page</Label>
                    <Select defaultValue={`${itemsPerPage}`}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
          </form>
          {/* Save Button */}
          <div className="flex justify-end gap-4 mt-8">
            <Button variant="outline">Reset to Defaults</Button>
            <Button>Save Settings</Button>
          </div>
        </div>
     </>
  )
}
