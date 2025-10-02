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
import { Button } from "@heroui/button"
import { signOut } from "next-auth/react"


// Navigation data for inventory management system

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

export function SupAdminAppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  
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
                  <span className="truncate font-semibold">{}</span>
                  <span className="truncate text-xs">Super Admin Management System</span>
                  {/* {isOnline ? "online" : "ofline"} */}
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavSection title="Overview" items={[
                {
                  title: "Dashboard",
                  url: "/sup-admin/dashboard",
                  icon: Home,
                },
              ]} />
        <NavSection title="Inventory" items={[
              {
                title: "Warehouses",
                icon: Warehouse,
                items: [
                  {
                    title: "Add Warehouse",
                    url: "/sup-admin/warehouses/add",
                    icon: Plus,
                  },
                  {
                    title: "View Warehouses",
                    url: "/sup-admin/warehouses/list",
                    icon: Eye,
                  },
                ],
              },
              ]} />
        <NavSection title="People" items={[
              {
                title: "People",
                icon: Users,
                items: [
                  {
                    title: "Users",
                    url: "/sup-admin/people/users",
                    icon: User,
                  },
                  // {
                  //   title: "Customers",
                  //   url: "/sup-admin/people/customers",
                  //   icon: UserCheck,
                  // },
                  // {
                  //   title: "Suppliers",
                  //   url: "/sup-admin/people/suppliers",
                  //   icon: Building2,
                  // },
                ],
              },
            ]} />
        {/* <NavSection title="System" items={ [
              // {
              //   title: "Notifications",
              //   url: "/notifications",
              //   icon: Bell,
              // },
              // {
              //   title: "Reports",
              //   url: "/reports",
              //   icon: BarChart3,
              // },
              // {
              //   title: "Settings",
              //   url: "/sup-admin//settings",
              //   icon: Settings,
              // },
            ]} /> */}
        <Button onClick={()=>signOut()} className="bg-red-500 m-2">Logout</Button>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
