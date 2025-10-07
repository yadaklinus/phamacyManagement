"use client"

import * as React from "react"
import { useState } from "react"
import {
  Bell,
  ChevronRight,
  Home,
  Stethoscope,
  FileText,
  Users,
  ClipboardList,
  Eye,
  Calendar,
  Activity,
  Pill,
  GraduationCap,
  ArrowLeftRight,
  Calculator,
  LucideIcon,
  Clock,
  UserCheck,
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
                        <span className="ml-auto mr-2 px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
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
                                <span className="ml-auto px-2 py-0.5 text-xs bg-green-500 text-white rounded-full">
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
                    <span className="ml-auto px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
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

export function PhysicianMedicalSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
              <a href="/users/physician/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Stethoscope className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{data?.companyName || "Medical Clinic"}</span>
                  <span className="truncate text-xs">Physician Portal</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Quick Actions */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="bg-blue-500 text-white hover:bg-blue-600 transition"
            >
              <a href="/users/physician/clinic/consult">
                <UserCheck className="mr-2 h-4 w-4" />
                <span>Start Consultation</span>
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
              url: "/users/physician/dashboard",
              icon: Home,
            },
          ]}
        />

        {/* Clinic Operations */}
        <NavSection
          title="⭐ Clinic Operations"
          items={[
            {
              title: "Today's Clinic",
              url: "/users/physician/clinic",
              icon: Clock,
              badge: "ACTIVE",
            },
            {
              title: "Consultation",
              url: "/users/physician/clinic/consult",
              icon: Stethoscope,
            },
          ]}
        />

        {/* My Activity */}
        <NavSection
          title="My Activity"
          items={[
            {
              title: "Drug Administration",
              icon: Pill,
              items: [
                {
                  title: "Today's Records",
                  url: "/users/physician/my-history?filter=today",
                  icon: Calendar,
                },
                {
                  title: "All History",
                  url: "/users/physician/my-history",
                  icon: FileText,
                },
                {
                  title: "Drug Usage Stats",
                  url: "/users/physician/my-history?view=stats",
                  icon: Activity,
                },
              ],
            },
          ]}
        />

        {/* Patient Management */}
        <NavSection
          title="Patients"
          items={[
            {
              title: "Students",
              icon: GraduationCap,
              items: [
                {
                  title: "Today's Patients",
                  url: "/users/physician/clinic?filter=today",
                  icon: Clock,
                },
                {
                  title: "All Patients",
                  url: "/users/physician/clinic?view=all",
                  icon: Users,
                },
                {
                  title: "Patient Records",
                  url: "/users/physician/clinic?view=records",
                  icon: FileText,
                },
              ],
            },
          ]}
        />

        {/* Reports */}
        <NavSection
          title="Reports"
          items={[
            {
              title: "My Reports",
              icon: ClipboardList,
              items: [
                {
                  title: "Daily Summary",
                  url: "/users/physician/my-history?report=daily",
                  icon: Calendar,
                },
                {
                  title: "Monthly Summary",
                  url: "/users/physician/my-history?report=monthly",
                  icon: FileText,
                },
                {
                  title: "Performance",
                  url: "/users/physician/my-history?report=performance",
                  icon: Activity,
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
              title: "Notifications",
              url: "/users/physician/notifications",
              icon: Bell,
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