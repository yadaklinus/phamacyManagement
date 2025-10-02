"use client"

import type * as React from "react"
import { useState } from "react"
import {
  BarChart3,
  Bell,
  ChevronRight,
  Home,
  Package,
  Plus,
  Settings,
  ShoppingCart,
  FileText,
  Truck,
  ArrowLeftRight,
  Users,
  User,
  Building2,
  UserCheck,
  Eye,
  Warehouse,
  type LucideIcon,
} from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import fetchData from "@/hooks/fetch-data"
import { useConnectionCheck } from "@/hooks/useConnectionCheck"

// Navigation data for inventory management system
const navigationData = {
  main: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
  ],
  inventory: [
    {
      title: "Products",
      icon: Package,
      items: [
        {
          title: "Add Product",
          url: "/products/add",
          icon: Plus,
        },
        {
          title: "View Products",
          url: "/products/list",
          icon: Eye,
        },
      ],
    },
    {
      title: "Warehouses",
      icon: Warehouse,
      items: [
        {
          title: "Add Warehouse",
          url: "/warehouses/add",
          icon: Plus,
        },
        {
          title: "View Warehouses",
          url: "/warehouses/list",
          icon: Eye,
        },
      ],
    },
  ],
  transactions: [
    {
      title: "Sales",
      icon: ShoppingCart,
      items: [
        {
          title: "Add Sale",
          url: "/sales/add",
          icon: Plus,
        },
        {
          title: "View Sales",
          url: "/sales/list",
          icon: Eye,
        },
      ],
    },
    {
      title: "Quotations",
      icon: FileText,
      items: [
        {
          title: "Add Quotation",
          url: "/quotations/add",
          icon: Plus,
        },
        {
          title: "View Quotations",
          url: "/quotations/list",
          icon: Eye,
        },
      ],
    },
    {
      title: "Purchases",
      icon: Truck,
      items: [
        {
          title: "Add Purchase",
          url: "/purchases/add",
          icon: Plus,
        },
        {
          title: "View Purchases",
          url: "/purchases/list",
          icon: Eye,
        },
      ],
    },
    {
      title: "Transfers",
      icon: ArrowLeftRight,
      items: [
        {
          title: "Add Transfer",
          url: "/transfers/add",
          icon: Plus,
        },
        {
          title: "View Transfers",
          url: "/transfers/list",
          icon: Eye,
        },
      ],
    },
  ],
  people: [
    {
      title: "People",
      icon: Users,
      items: [
        {
          title: "Users",
          url: "/people/users",
          icon: User,
        },
        {
          title: "Customers",
          url: "/people/customers",
          icon: UserCheck,
        },
        {
          title: "Suppliers",
          url: "/people/suppliers",
          icon: Building2,
        },
      ],
    },
  ],
  system: [
    {
      title: "Notifications",
      url: "/notifications",
      icon: Bell,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: BarChart3,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ],
}

function NavSection({
  title,
  items,
}: {
  title: string
  items: Array<{
    title: string
    url?: string
    icon: LucideIcon
    items?: Array<{
      title: string
      url: string
      icon?: LucideIcon
    }>
  }>
}) {

  
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          if (item.items) {
            return (
              <Collapsible key={item.title} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      <item.icon />
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.url}>
                              {subItem.icon && <subItem.icon className="w-4 h-4" />}
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          }

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  
  const {data,loading,error} = fetchData("/api/settings")

  if(loading) return ""

  // const isOnline = useConnectionCheck()
 
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Package className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{data?.companyName}</span>
                  <span className="truncate text-xs">Management System</span>
                  {/* {isOnline ? "online" : "ofline"} */}
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavSection title="Overview" items={navigationData.main} />
        <NavSection title="Inventory" items={navigationData.inventory} />
        <NavSection title="Transactions" items={navigationData.transactions} />
        <NavSection title="People" items={navigationData.people} />
        <NavSection title="System" items={navigationData.system} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
