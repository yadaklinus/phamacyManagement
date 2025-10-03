"use client"

import type * as React from "react"
import { useState } from "react"
import {
  BarChart3,
  Bell,
  ChevronRight,
  Home,
  Stethoscope,
  Plus,
  Settings,
  Calendar,
  FileText,
  Users,
  User,
  ClipboardList,
  UserCheck,
  Eye,
  Search,
  Clock,
  Pill,
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
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

// Navigation data for physician management system
const navigationData = {
  main: [
    {
      title: "Dashboard",
      url: "/users/physician/dashboard",
      icon: Home,
    },
  ],
  consultations: [
    {
      title: "Consultations",
      icon: Stethoscope,
      items: [
        {
          title: "New Consultation",
          url: "/users/physician/consultations/new",
          icon: Plus,
        },
        {
          title: "Active Consultations",
          url: "/users/physician/consultations/active",
          icon: ClipboardList,
        },
        {
          title: "Consultation History",
          url: "/users/physician/consultations/history",
          icon: FileText,
        },
      ],
    },
    {
      title: "Queue Management",
      icon: Clock,
      items: [
        {
          title: "Current Queue",
          url: "/users/physician/queue",
          icon: Users,
        },
        {
          title: "Call Next Patient",
          url: "/users/physician/queue/next",
          icon: UserCheck,
        },
      ],
    },
  ],
  patients: [
    {
      title: "Patients",
      icon: User,
      items: [
        {
          title: "Search Patients",
          url: "/users/physician/patients/search",
          icon: Search,
        },
        {
          title: "Patient Records",
          url: "/users/physician/patients/records",
          icon: FileText,
        },
      ],
    },
  ],
  prescriptions: [
    {
      title: "Prescriptions",
      icon: Pill,
      items: [
        {
          title: "Active Prescriptions",
          url: "/users/physician/prescriptions/active",
          icon: ClipboardList,
        },
        {
          title: "Prescription History",
          url: "/users/physician/prescriptions/history",
          icon: FileText,
        },
      ],
    },
  ],
  schedule: [
    {
      title: "My Schedule",
      url: "/users/physician/schedule",
      icon: Calendar,
    },
    {
      title: "Appointments",
      url: "/users/physician/appointments",
      icon: Calendar,
    },
  ],
  system: [
    {
      title: "Notifications",
      url: "/users/physician/notifications",
      icon: Bell,
    },
    {
      title: "Reports",
      url: "/users/physician/reports",
      icon: BarChart3,
    },
    {
      title: "Settings",
      url: "/users/physician/settings",
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

export function PhysicianAppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  
  const {data,loading,error} = fetchData("/api/settings")

  if(loading) return ""

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/users/physician/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Stethoscope className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{data?.companyName || "Clinic"}</span>
                  <span className="truncate text-xs">Physician Portal</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavSection title="Overview" items={navigationData.main} />
        <NavSection title="Consultations" items={navigationData.consultations} />
        <NavSection title="Patients" items={navigationData.patients} />
        <NavSection title="Prescriptions" items={navigationData.prescriptions} />
        <NavSection title="Schedule" items={navigationData.schedule} />
        <NavSection title="System" items={navigationData.system} />
        <Button onClick={()=>signOut()} className="bg-red-500 m-2">Logout</Button>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
