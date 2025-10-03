"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Clock,
  Users,
  UserCheck,
  Phone,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Search,
  Plus,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface QueueItem {
  id: string
  queueNumber: number
  patient: {
    id: string
    name: string
    matricNumber: string
    age: number
    gender: string
    phone?: string
    department: string
    level: string
  }
  priority: 'emergency' | 'urgent' | 'normal'
  status: string
  complaint: string
  checkInTime: string
  calledTime?: string
  completedTime?: string
  waitTime: string
}

interface QueueStats {
  waiting: number
  called: number
  in_consultation: number
  completed: number
  total: number
}

export default function QueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('waiting')
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const fetchQueue = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      else setLoading(true)

      // Mock API call - replace with actual API
      const mockQueue: QueueItem[] = [
        {
          id: "1",
          queueNumber: 1,
          patient: {
            id: "1",
            name: "John Doe",
            matricNumber: "CSC/2020/001",
            age: 22,
            gender: "Male",
            phone: "08012345678",
            department: "Computer Science",
            level: "400"
          },
          priority: "emergency",
          status: "waiting",
          complaint: "Severe chest pain",
          checkInTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          waitTime: "5 mins"
        },
        {
          id: "2",
          queueNumber: 2,
          patient: {
            id: "2",
            name: "Jane Smith",
            matricNumber: "ENG/2021/045",
            age: 21,
            gender: "Female",
            phone: "08087654321",
            department: "Electrical Engineering",
            level: "300"
          },
          priority: "urgent",
          status: "waiting",
          complaint: "High fever",
          checkInTime: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          waitTime: "12 mins"
        },
        {
          id: "3",
          queueNumber: 3,
          patient: {
            id: "3",
            name: "Mike Wilson",
            matricNumber: "MED/2019/078",
            age: 23,
            gender: "Male",
            department: "Medicine",
            level: "500"
          },
          priority: "normal",
          status: "waiting",
          complaint: "Routine checkup",
          checkInTime: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          waitTime: "25 mins"
        }
      ]

      const mockStats: QueueStats = {
        waiting: 3,
        called: 0,
        in_consultation: 1,
        completed: 8,
        total: 12
      }

      setQueue(mockQueue.filter(item => 
        selectedStatus === 'all' || item.status === selectedStatus
      ))
      setStats(mockStats)

    } catch (error) {
      console.error("Failed to fetch queue:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [selectedStatus])

  const handleCallNext = async () => {
    try {
      setRefreshing(true)
      // Mock API call to call next patient
      setTimeout(() => {
        router.push('/users/physician/queue/next')
      }, 1000)
    } catch (error) {
      console.error("Failed to call next patient:", error)
      setRefreshing(false)
    }
  }

  const handleStartConsultation = (patientId: string) => {
    router.push(`/users/physician/consultations/new?patientId=${patientId}`)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'destructive'
      case 'urgent': return 'secondary'
      case 'normal': return 'default'
      default: return 'outline'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800'
      case 'called': return 'bg-blue-100 text-blue-800'
      case 'in_consultation': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredQueue = queue.filter(item =>
    item.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.patient.matricNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.complaint.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading queue...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Patient Queue</h1>
        <p className="text-muted-foreground">
          Manage patient queue and consultations
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Waiting</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.waiting}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Called</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.called}</p>
                </div>
                <UserCheck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Consultation</p>
                  <p className="text-2xl font-bold text-green-600">{stats.in_consultation}</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
                </div>
                <UserCheck className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Today</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <Button onClick={handleCallNext} disabled={refreshing}>
            <UserCheck className="h-4 w-4 mr-2" />
            {refreshing ? "Calling..." : "Call Next Patient"}
          </Button>
          <Button variant="outline" onClick={() => fetchQueue(true)} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {[
          { value: 'waiting', label: 'Waiting' },
          { value: 'called', label: 'Called' },
          { value: 'in_consultation', label: 'In Consultation' },
          { value: 'completed', label: 'Completed' },
          { value: 'all', label: 'All' }
        ].map((status) => (
          <Button
            key={status.value}
            variant={selectedStatus === status.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus(status.value)}
          >
            {status.label}
          </Button>
        ))}
      </div>

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Queue List</CardTitle>
          <CardDescription>
            Current patient queue - {filteredQueue.length} patient(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredQueue.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Complaint</TableHead>
                  <TableHead>Wait Time</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQueue.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.queueNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.patient.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.patient.matricNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.patient.department} • {item.patient.level} Level
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(item.priority) as any}>
                        {item.priority.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{item.complaint}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{item.waitTime}</span>
                    </TableCell>
                    <TableCell>
                      {item.patient.phone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="h-3 w-3 mr-1" />
                          {item.patient.phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {item.status === 'waiting' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartConsultation(item.patient.id)}
                          >
                            Start Consultation
                          </Button>
                        )}
                        {item.status === 'called' && (
                          <Button
                            size="sm"
                            onClick={() => handleStartConsultation(item.patient.id)}
                          >
                            Begin Consultation
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No patients found matching your search' : 'No patients in queue'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}