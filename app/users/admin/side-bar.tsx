"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  BarChart3,
  Bell,
  ChevronRight,
  Home,
  Pill,
  Plus,
  Settings,
  ShoppingCart,
  FileText,
  ArrowLeftRight,
  Users,
  Eye,
  Activity,
  AlertTriangle,
  ClipboardCheck,
  TrendingUp,
  Calendar,
  Stethoscope,
  GraduationCap,
  Shield,
  Calculator,
  LucideIcon,
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
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import fetchData from "@/hooks/fetch-data"
import { CalculatorCard } from "@/components/shad-cal"

interface NavItem {
  title: string
  url?: string
  icon: LucideIcon
  badge?: string
  items?: Array<{
    title: string
    url: string
    icon?: LucideIcon
    badge?: string
  }>
}

function NavSection({
  title,
  items,
}: {
  title: string
  items: NavItem[]
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
                      {item.badge && (
                        <span className="ml-auto mr-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                          {item.badge}
                        </span>
                      )}
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
                              {subItem.badge && (
                                <span className="ml-auto px-2 py-0.5 text-xs bg-yellow-500 text-white rounded-full">
                                  {subItem.badge}
                                </span>
                              )}
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
                  {item.badge && (
                    <span className="ml-auto px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export function AdminMedicalSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [open, setOpen] = useState(false)
  const { data: session } = useSession()
  const { data, loading } = fetchData("/api/settings")

  if (loading) return null

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/users/admin/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Shield className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{data?.companyName || "Medical Facility"}</span>
                  <span className="truncate text-xs">Drug Tracking System</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarMenu>
          <SidebarMenuItem>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <SidebarMenuButton
                  tooltip="Calculator"
                  className="hover:bg-blue-50 transition"
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  <span>Quick Calculator</span>
                </SidebarMenuButton>
              </PopoverTrigger>
              <PopoverContent
                side="right"
                align="start"
                className="p-0 shadow-xl border rounded-2xl w-80"
              >
                <CalculatorCard />
              </PopoverContent>
            </Popover>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Overview Section */}
        <NavSection
          title="Overview"
          items={[
            {
              title: "Dashboard",
              url: "/users/admin/dashboard",
              icon: Home,
              badge: "LIVE",
            },
            {
              title: "Alerts & Warnings",
              url: "/users/admin/alerts",
              icon: Bell,
            },
          ]}
        />

        {/* Drug Management Section */}
        <NavSection
          title="Drug Management"
          items={[
            {
              title: "Drugs Inventory",
              icon: Pill,
              items: [
                {
                  title: "All Drugs",
                  url: "/users/admin/drugs",
                  icon: Eye,
                },
                {
                  title: "Add New Drug",
                  url: "/users/admin/drugs/add",
                  icon: Plus,
                },
                {
                  title: "Low Stock",
                  url: "/users/admin/drugs?filter=low-stock",
                  icon: AlertTriangle,
                },
              ],
            },
            {
              title: "Purchases",
              icon: ShoppingCart,
              items: [
                {
                  title: "Purchase History",
                  url: "/users/admin/purchases",
                  icon: FileText,
                },
                {
                  title: "Record Purchase",
                  url: "/users/admin/purchases/add",
                  icon: Plus,
                },
              ],
            },
          ]}
        />

        {/* Drug Movements - Critical Tracking Section */}
        <NavSection
          title="⭐ Drug Movements"
          items={[
            {
              title: "Movement Tracking",
              icon: Activity,
              items: [
                {
                  title: "All Movements",
                  url: "/users/admin/movements",
                  icon: FileText,
                },
                {
                  title: "By Physician",
                  url: "/users/admin/movements/by-physician",
                  icon: Stethoscope,
                },
                {
                  title: "By Student",
                  url: "/users/admin/movements/by-student",
                  icon: GraduationCap,
                },
                {
                  title: "By Drug",
                  url: "/users/admin/movements/by-drug",
                  icon: Pill,
                },
                {
                  title: "Suspicious Activity",
                  url: "/users/admin/movements/suspicious",
                  icon: AlertTriangle,
                },
              ],
            },
          ]}
        />

        {/* Reconciliation - Theft Detection */}
        <NavSection
          title="⭐ Reconciliation"
          items={[
            {
              title: "Stock Audits",
              icon: ClipboardCheck,
              items: [
                {
                  title: "Audit Dashboard",
                  url: "/users/admin/reconciliation",
                  icon: BarChart3,
                },
                {
                  title: "New Audit",
                  url: "/users/admin/reconciliation/new-audit",
                  icon: Plus,
                },
                {
                  title: "Discrepancies",
                  url: "/users/admin/reconciliation/discrepancies",
                  icon: AlertTriangle,
                },
              ],
            },
          ]}
        />

        {/* People Management */}
        <NavSection
          title="People"
          items={[
            {
              title: "Physicians",
              icon: Stethoscope,
              items: [
                {
                  title: "All Physicians",
                  url: "/users/admin/physicians",
                  icon: Users,
                },
                {
                  title: "Activity Reports",
                  url: "/users/admin/physicians?view=activity",
                  icon: Activity,
                },
              ],
            },
            {
              title: "Students",
              icon: GraduationCap,
              items: [
                {
                  title: "All Students",
                  url: "/users/admin/students",
                  icon: Users,
                },
                {
                  title: "Treatment History",
                  url: "/users/admin/students?view=history",
                  icon: FileText,
                },
              ],
            },
          ]}
        />

        {/* Reports & Analytics */}
        <NavSection
          title="Reports & Analytics"
          items={[
            {
              title: "Reports",
              icon: BarChart3,
              items: [
                {
                  title: "Report Center",
                  url: "/users/admin/reports",
                  icon: FileText,
                },
                {
                  title: "Daily Summary",
                  url: "/users/admin/reports/daily",
                  icon: Calendar,
                },
                {
                  title: "Monthly Report",
                  url: "/users/admin/reports/monthly",
                  icon: TrendingUp,
                },
                {
                  title: "Drug Usage Stats",
                  url: "/users/admin/reports/drug-usage",
                  icon: Pill,
                },
                {
                  title: "Theft Analysis",
                  url: "/users/admin/reports/theft-analysis",
                  icon: Shield,
                },
              ],
            },
          ]}
        />

        {/* System */}
        <NavSection
          title="System"
          items={[
            {
              title: "Settings",
              url: "/users/admin/settings",
              icon: Settings,
            },
          ]}
        />

        {/* Logout Button */}
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
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}