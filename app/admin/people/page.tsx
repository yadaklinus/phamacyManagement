"use client"

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
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, User, UserCheck, Building2, Plus } from "lucide-react"

export default function PeoplePage() {
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
                  <BreadcrumbPage>People</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-blue-600" />
            <h1 className="text-2xl font-semibold text-blue-600">People Management</h1>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">12</div>
                    <p className="text-xs text-muted-foreground">+2 from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">573</div>
                    <p className="text-xs text-muted-foreground">+201 from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">45</div>
                    <p className="text-xs text-muted-foreground">+5 from last month</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      System Users
                    </CardTitle>
                    <CardDescription>Manage system users and their access</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Add and manage users who can access the inventory system. Assign roles and permissions.
                    </p>
                    <div className="flex gap-2">
                      <Button asChild size="sm">
                        <a href="/people/users">View Users</a>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <a href="/people/users/add">
                          <Plus className="mr-2 h-4 w-4" />
                          Add User
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Customers
                    </CardTitle>
                    <CardDescription>Manage your customer database</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Add and manage customers who purchase from your business. Track their purchase history.
                    </p>
                    <div className="flex gap-2">
                      <Button asChild size="sm">
                        <a href="/people/customers">View Customers</a>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <a href="/people/customers/add">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Customer
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Suppliers
                    </CardTitle>
                    <CardDescription>Manage your supplier network</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Add and manage suppliers who provide products to your business. Track purchase orders.
                    </p>
                    <div className="flex gap-2">
                      <Button asChild size="sm">
                        <a href="/people/suppliers">View Suppliers</a>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <a href="/people/suppliers/add">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Supplier
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">System Users</h2>
                <Button asChild>
                  <a href="/people/users/add">
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                  </a>
                </Button>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">
                    <a href="/people/users" className="text-blue-600 hover:underline">
                      Click here to view and manage system users
                    </a>
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Customers Tab */}
            <TabsContent value="customers">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Customers</h2>
                <Button asChild>
                  <a href="/people/customers/add">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Customer
                  </a>
                </Button>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">
                    <a href="/people/customers" className="text-blue-600 hover:underline">
                      Click here to view and manage customers
                    </a>
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Suppliers Tab */}
            <TabsContent value="suppliers">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Suppliers</h2>
                <Button asChild>
                  <a href="/people/suppliers/add">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Supplier
                  </a>
                </Button>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">
                    <a href="/people/suppliers" className="text-blue-600 hover:underline">
                      Click here to view and manage suppliers
                    </a>
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </>
  )
}
