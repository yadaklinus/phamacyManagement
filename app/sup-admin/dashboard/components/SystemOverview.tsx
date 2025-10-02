'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Activity, Database, Server, Wifi } from "lucide-react"

export function SystemOverview() {
  // Mock system status - you can replace with real monitoring data
  const systemStatus = {
    database: { status: 'healthy', uptime: '99.9%' },
    server: { status: 'healthy', load: 23 },
    network: { status: 'healthy', latency: '12ms' },
    storage: { used: 67, total: 100 }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge className="bg-green-500">Healthy</Badge>
      case 'warning': return <Badge variant="secondary">Warning</Badge>
      case 'error': return <Badge variant="destructive">Error</Badge>
      default: return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Overview</CardTitle>
        <CardDescription>Current system health and performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-blue-500" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database</span>
                {getStatusBadge(systemStatus.database.status)}
              </div>
              <p className="text-xs text-muted-foreground">
                Uptime: {systemStatus.database.uptime}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Server className="h-4 w-4 text-green-500" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Server</span>
                {getStatusBadge(systemStatus.server.status)}
              </div>
              <p className="text-xs text-muted-foreground">
                Load: {systemStatus.server.load}%
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Wifi className="h-4 w-4 text-purple-500" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Network</span>
                {getStatusBadge(systemStatus.network.status)}
              </div>
              <p className="text-xs text-muted-foreground">
                Latency: {systemStatus.network.latency}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-orange-500" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Storage</span>
                <span className="text-xs">{systemStatus.storage.used}%</span>
              </div>
              <Progress value={systemStatus.storage.used} className="h-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}