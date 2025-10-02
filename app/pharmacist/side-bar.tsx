"use client"

import type * as React from "react"
import { useState,useEffect } from "react"
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
  Receipt,
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
import { NavbarItem } from "@heroui/navbar"
import { Button } from "@heroui/button"
import { signOut, useSession } from "next-auth/react"
import { getWareHouseId } from "@/hooks/get-werehouseId"
import { SystemStatus } from "@/components/system-status"


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

export function WarehouseAppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  
  const {data,loading,error} = fetchData("/api/settings")
  const warehouseId = getWareHouseId()
  const {data:session} = useSession()
  const [endpoint,setEndPoint] = useState("")


  useEffect(()=>{
    setEndPoint(`/warehouse/${warehouseId}/${session?.user?.role}`)
  },[session,warehouseId])

  

  
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
                  <span className="truncate text-xs">Sales Management System</span>
                  {/* {isOnline ? "online" : "ofline"} */}
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SystemStatus/>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavSection title="Overview" items={[
                {
                  title: "Dashboard",
                  url: `${endpoint}/dashboard`,
                  icon: Home,
                },
              ]} />
        <NavSection title="Inventory" items={[
    {
      title: "Sales",
      icon: ShoppingCart,
      items: [
        {
          title: "Add Sale",
          url: `${endpoint}/sales/add`,
          icon: Plus,
        },
        {
          title: "View Sales",
          url: `${endpoint}/sales/list`,
          icon: Eye,
        },
      ],
    },
   
  ]} />
       

        

        <SidebarMenu>
          <SidebarMenuItem>
          <SidebarMenuButton
              tooltip="Logout"
              onClick={() => signOut()}
              className="bg-red-500 text-white hover:bg-red-600 transition"
            >
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <Button onClick={()=>signOut()} style={{display:"none"}} className="bg-red-500">Logout</Button>

      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
