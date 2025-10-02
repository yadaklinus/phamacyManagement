'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Warehouse, 
  Users, 
  Package, 
  BarChart3, 
  Eye, 
  Plus,
  Settings,
  UserPlus
} from "lucide-react"

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button asChild className="w-full justify-start bg-transparent" variant="outline">
          <a href="/sup-admin/warehouses">
            <Warehouse className="mr-2 h-4 w-4" />
            Manage Warehouses
          </a>
        </Button>
        <Button asChild className="w-full justify-start bg-transparent" variant="outline">
          <a href="/sup-admin/people">
            <Users className="mr-2 h-4 w-4" />
            Manage Users
          </a>
        </Button>
        <Button asChild className="w-full justify-start bg-transparent" variant="outline">
          <a href="/sup-admin/dashboard/users">
            <UserPlus className="mr-2 h-4 w-4" />
            View All Users
          </a>
        </Button>
        {/* <Button asChild className="w-full justify-start bg-transparent" variant="outline">
          <a href="/warehouse">
            <Package className="mr-2 h-4 w-4" />
            View Products
          </a>
        </Button>
        <Button asChild className="w-full justify-start bg-transparent" variant="outline">
          <a href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            System Settings
          </a>
        </Button>
        <Button asChild className="w-full justify-start bg-transparent" variant="outline">
          <a href="/reports">
            <BarChart3 className="mr-2 h-4 w-4" />
            View Reports
          </a>
        </Button> */}
      </CardContent>
    </Card>
  )
}