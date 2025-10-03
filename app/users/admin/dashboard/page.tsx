"use client"

import { useState, useEffect } from "react"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import {
  Users,
  Stethoscope,
  FileText,
  Package,
  Activity,
  TrendingUp,
  AlertTriangle,
  Clock,
  UserPlus,
  PlusCircle,
  ClipboardList,
  Settings,
  BarChart3,
  Loader2,
  Calendar,
  AlertCircle,
} from "lucide-react"
import { SystemStatus } from "@/components/system-status"
import Link from "next/link"

interface DashboardData {
  metrics: {
    totalStudents: number
    activePhysicians: number
    pendingPrescriptions: number
    lowStockCount: number
    todayConsultations: number
    todayDispensals: number
    expiringDrugsCount: number
    queueCount: number
  }
  alerts: {
    lowStock: Array<{
      id: string
      name: string
      quantity: number
      reorderLevel: number
      unit: string
      severity: string
    }>
    expiringDrugs: Array<{
      id: string
      name: string
      expiryDate: string
      quantity: number
      batchNumber: string
      daysUntilExpiry: number
      severity: string
    }>
  }
  charts: {
    dailyConsultations: Array<{ date: string; count: number }>
    topPrescribedDrugs: Array<{ name: string; count: number; dispensed: number }>
    diseaseDistribution: Array<{ name: string; value: number; color: string }>
    departmentVisits: Array<{ department: string; visits: number }>
  }
  recentActivities: Array<{
    id: string
    type: string
    title: string
    description: string
    timestamp: string
    status: string
  }>
  recentStudents: Array<{
    id: string
    matricNumber: string
    firstName: string
    lastName: string
    department: string
    createdAt: string
  }>
  recentConsultations: Array<{
    id: string
    consultationNo: string
    student: string
    studentMatric: string
    department: string
    physician: string
    specialization: string
    diagnosis: string
    status: string
    priority: string
    createdAt: string
  }>
}

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
    // Refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/admin/dashboard")
      if (!response.ok) throw new Error("Failed to fetch dashboard data")
      const data = await response.json()
      setDashboardData(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Admin Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <SystemStatus />
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading dashboard data...</span>
          </div>
        </div>
      </>
    )
  }

  if (error || !dashboardData) {
    return (
      <>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Admin Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <SystemStatus />
        </header>
        <div className="flex flex-1 items-center justify-center">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error || "Failed to load dashboard data"}</p>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  const { metrics, alerts, charts, recentActivities, recentStudents, recentConsultations } = dashboardData

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Admin Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <SystemStatus />
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">System Overview</h1>
            <p className="text-muted-foreground">
              Welcome to the admin dashboard. Monitor and manage the entire health center system.
            </p>
          </div>
          <Button onClick={fetchDashboardData} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Registered and active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Physicians</CardTitle>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activePhysicians}</div>
              <p className="text-xs text-muted-foreground">Currently available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Prescriptions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.pendingPrescriptions}</div>
              <p className="text-xs text-muted-foreground">Awaiting fulfillment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Drugs</CardTitle>
              <Package className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{metrics.lowStockCount}</div>
              <p className="text-xs text-muted-foreground">Below reorder level</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Activity */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Consultations</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{metrics.todayConsultations}</div>
              <p className="text-xs text-muted-foreground">Consultations completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drugs Dispensed Today</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.todayDispensals}</div>
              <p className="text-xs text-muted-foreground">Prescriptions fulfilled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Queue</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{metrics.queueCount}</div>
              <p className="text-xs text-muted-foreground">Patients waiting</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.expiringDrugsCount}</div>
              <p className="text-xs text-muted-foreground">Within 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* System Alerts */}
        {(alerts.lowStock.length > 0 || alerts.expiringDrugs.length > 0) && (
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              System Alerts
            </h2>
            
            {alerts.lowStock.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{alerts.lowStock.length} drugs</strong> are below reorder level
                  <div className="mt-2 space-y-1">
                    {alerts.lowStock.slice(0, 3).map((item) => (
                      <div key={item.id} className="text-sm">
                        • {item.name}: {item.quantity} {item.unit} (Reorder at: {item.reorderLevel})
                      </div>
                    ))}
                    {alerts.lowStock.length > 3 && (
                      <div className="text-sm">...and {alerts.lowStock.length - 3} more</div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {alerts.expiringDrugs.length > 0 && (
              <Alert className="border-yellow-600">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription>
                  <strong>{alerts.expiringDrugs.length} drugs</strong> expiring within 30 days
                  <div className="mt-2 space-y-1">
                    {alerts.expiringDrugs.slice(0, 3).map((item) => (
                      <div key={item.id} className="text-sm">
                        • {item.name} (Batch: {item.batchNumber}) - {item.daysUntilExpiry} days left
                      </div>
                    ))}
                    {alerts.expiringDrugs.length > 3 && (
                      <div className="text-sm">...and {alerts.expiringDrugs.length - 3} more</div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Daily Consultations */}
          {charts.dailyConsultations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Daily Consultations (Last 7 Days)
                </CardTitle>
                <CardDescription>Patient consultation trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={charts.dailyConsultations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Disease Distribution */}
          {charts.diseaseDistribution.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Disease Distribution
                </CardTitle>
                <CardDescription>Top 10 diagnosed conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={charts.diseaseDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {charts.diseaseDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {charts.diseaseDistribution.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name.substring(0, 20)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* More Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Prescribed Drugs */}
          {charts.topPrescribedDrugs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Top 10 Prescribed Drugs
                </CardTitle>
                <CardDescription>Most frequently prescribed medications</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={charts.topPrescribedDrugs} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Department Visits */}
          {charts.departmentVisits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Department-wise Visits
                </CardTitle>
                <CardDescription>Consultations by student department</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={charts.departmentVisits}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="visits" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Activities & Students */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activities
              </CardTitle>
              <CardDescription>Latest system activities</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="mt-1">
                        {activity.type === "consultation" && (
                          <Stethoscope className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{activity.title}</div>
                        <div className="text-xs text-muted-foreground">{activity.description}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs capitalize">
                            {activity.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No recent activities</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Students */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recently Registered Students
              </CardTitle>
              <CardDescription>Latest student registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {recentStudents.length > 0 ? (
                <div className="space-y-4">
                  {recentStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">{student.matricNumber}</div>
                        <div className="text-xs text-muted-foreground">{student.department}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No recent students</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Consultations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Recent Consultations
            </CardTitle>
            <CardDescription>Latest patient consultations and diagnoses</CardDescription>
          </CardHeader>
          <CardContent>
            {recentConsultations.length > 0 ? (
              <div className="space-y-4">
                {recentConsultations.map((consultation) => (
                  <div key={consultation.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{consultation.consultationNo}</span>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {consultation.status}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            consultation.priority === "emergency" 
                              ? "border-red-600 text-red-600" 
                              : consultation.priority === "urgent" 
                              ? "border-orange-600 text-orange-600" 
                              : "border-gray-600 text-gray-600"
                          }`}
                        >
                          {consultation.priority}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Student: </span>
                          <span className="font-medium">{consultation.student}</span>
                          <div className="text-xs text-muted-foreground">
                            {consultation.studentMatric} • {consultation.department}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Physician: </span>
                          <span className="font-medium">{consultation.physician}</span>
                          <div className="text-xs text-muted-foreground">
                            {consultation.specialization}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Diagnosis: </span>
                        <span>{consultation.diagnosis}</span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground ml-4">
                      {new Date(consultation.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No recent consultations</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Link href="/admin/students/add">
                <Button className="h-20 flex-col gap-2 bg-transparent w-full" variant="outline">
                  <UserPlus className="h-6 w-6" />
                  <span>Add Student</span>
                </Button>
              </Link>
              <Link href="/admin/products/add">
                <Button className="h-20 flex-col gap-2 bg-transparent w-full" variant="outline">
                  <PlusCircle className="h-6 w-6" />
                  <span>Add Drug</span>
                </Button>
              </Link>
              <Link href="/admin/queue">
                <Button className="h-20 flex-col gap-2 bg-transparent w-full" variant="outline">
                  <Clock className="h-6 w-6" />
                  <span>View Queue</span>
                  {metrics.queueCount > 0 && (
                    <Badge className="absolute top-2 right-2" variant="destructive">
                      {metrics.queueCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/admin/reports">
                <Button className="h-20 flex-col gap-2 bg-transparent w-full" variant="outline">
                  <BarChart3 className="h-6 w-6" />
                  <span>Generate Report</span>
                </Button>
              </Link>
              <Link href="/admin/physicians">
                <Button className="h-20 flex-col gap-2 bg-transparent w-full" variant="outline">
                  <Stethoscope className="h-6 w-6" />
                  <span>Physicians</span>
                </Button>
              </Link>
              <Link href="/admin/prescriptions">
                <Button className="h-20 flex-col gap-2 bg-transparent w-full" variant="outline">
                  <FileText className="h-6 w-6" />
                  <span>Prescriptions</span>
                  {metrics.pendingPrescriptions > 0 && (
                    <Badge className="absolute top-2 right-2" variant="destructive">
                      {metrics.pendingPrescriptions}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/admin/inventory">
                <Button className="h-20 flex-col gap-2 bg-transparent w-full" variant="outline">
                  <Package className="h-6 w-6" />
                  <span>Inventory</span>
                  {metrics.lowStockCount > 0 && (
                    <Badge className="absolute top-2 right-2 bg-yellow-600">
                      {metrics.lowStockCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button className="h-20 flex-col gap-2 bg-transparent w-full" variant="outline">
                  <Settings className="h-6 w-6" />
                  <span>System Settings</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}