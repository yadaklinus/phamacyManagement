"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  ArrowLeft, 
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Heart,
  AlertTriangle,
  User,
  Users
} from "lucide-react"
import axios from "axios"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"

interface Student {
  id: string
  matricNumber: string
  firstName: string
  lastName: string
  otherNames?: string
  email?: string
  phone?: string
  dateOfBirth: string
  gender: string
  address?: string
  stateOfOrigin?: string
  nationality?: string
  profilePhoto?: string
  faculty: string
  department: string
  level: string
  bloodGroup?: string
  genotype?: string
  allergies?: string
  chronicConditions?: string
  emergencyContact: string
  emergencyPhone: string
  emergencyRelationship?: string
  isActive: boolean
  createdAt: string
}

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchStudent(params.id as string)
    }
  }, [params.id])

  const fetchStudent = async (id: string) => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/students/${id}`)
      setStudent(response.data.student)
    } catch (error) {
      console.error('Error fetching student:', error)
      toast.error("Failed to load student details")
      router.push('/admin/students')
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getFullName = (student: Student) => {
    return `${student.firstName} ${student.otherNames ? student.otherNames + ' ' : ''}${student.lastName}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const parseJsonArray = (jsonString?: string): string[] => {
    if (!jsonString) return []
    try {
      return JSON.parse(jsonString)
    } catch {
      return jsonString.split(',').map(item => item.trim())
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Student not found</h2>
          <p className="text-gray-500 mb-4">The student you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/admin/students')}>
            Back to Students
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/dashboard">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/students">Students</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{getFullName(student)}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h1 className="text-2xl font-semibold text-blue-600">Student Details</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={() => router.push(`/admin/students/${student.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Student
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24 mb-4">
                  <AvatarImage src={student.profilePhoto} />
                  <AvatarFallback className="text-lg">
                    {getInitials(student.firstName, student.lastName)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold mb-1">{getFullName(student)}</h2>
                <p className="text-gray-500 mb-2">{student.matricNumber}</p>
                <Badge variant={student.isActive ? "default" : "secondary"} className="mb-4">
                  {student.isActive ? "Active" : "Inactive"}
                </Badge>
                
                <div className="w-full space-y-3">
                  {student.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{student.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{student.phone}</span>
                  </div>
                  {student.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{student.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Born {formatDate(student.dateOfBirth)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">First Name</label>
                    <p className="text-sm">{student.firstName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Name</label>
                    <p className="text-sm">{student.lastName}</p>
                  </div>
                  {student.otherNames && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Other Names</label>
                      <p className="text-sm">{student.otherNames}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gender</label>
                    <p className="text-sm">{student.gender}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="text-sm">{formatDate(student.dateOfBirth)}</p>
                  </div>
                  {student.stateOfOrigin && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">State of Origin</label>
                      <p className="text-sm">{student.stateOfOrigin}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nationality</label>
                    <p className="text-sm">{student.nationality}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Academic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Faculty</label>
                    <p className="text-sm">{student.faculty}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Department</label>
                    <p className="text-sm">{student.department}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Level</label>
                    <Badge variant="outline">{student.level} Level</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Matric Number</label>
                    <p className="text-sm font-mono">{student.matricNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Medical Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {student.bloodGroup && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Blood Group</label>
                      <p className="text-sm">{student.bloodGroup}</p>
                    </div>
                  )}
                  {student.genotype && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Genotype</label>
                      <p className="text-sm">{student.genotype}</p>
                    </div>
                  )}
                </div>

                {parseJsonArray(student.allergies).length > 0 && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Allergies</label>
                    <div className="flex flex-wrap gap-2">
                      {parseJsonArray(student.allergies).map((allergy, index) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {parseJsonArray(student.chronicConditions).length > 0 && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Chronic Conditions</label>
                    <div className="flex flex-wrap gap-2">
                      {parseJsonArray(student.chronicConditions).map((condition, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Contact Name</label>
                    <p className="text-sm">{student.emergencyContact}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone Number</label>
                    <p className="text-sm">{student.emergencyPhone}</p>
                  </div>
                  {student.emergencyRelationship && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Relationship</label>
                      <p className="text-sm">{student.emergencyRelationship}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}