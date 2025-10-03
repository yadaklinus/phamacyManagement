"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  UserPlus, 
  Save, 
  ArrowLeft, 
  ArrowRight,
  Check, 
  Upload,
  Camera,
  RefreshCw,
  User,
  GraduationCap,
  Heart,
  Phone
} from "lucide-react"
import axios from "axios"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"

interface StudentFormData {
  // Step 1: Personal Information
  firstName: string
  lastName: string
  otherNames: string
  matricNumber: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  address: string
  stateOfOrigin: string
  nationality: string
  profilePhoto?: File | null

  // Step 2: Academic Information
  faculty: string
  department: string
  level: string

  // Step 3: Medical Information
  bloodGroup: string
  genotype: string
  allergies: string[]
  chronicConditions: string[]

  // Step 4: Emergency Contact
  emergencyContact: string
  emergencyPhone: string
  emergencyRelationship: string
}

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo", 
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", 
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", 
  "Yobe", "Zamfara"
]

const FACULTIES = [
  "Faculty of Engineering",
  "Faculty of Science", 
  "Faculty of Arts",
  "Faculty of Social Sciences",
  "Faculty of Medicine",
  "Faculty of Law",
  "Faculty of Education",
  "Faculty of Agriculture",
  "Faculty of Management Sciences"
]

const DEPARTMENTS = {
  "Faculty of Engineering": ["Computer Science", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Chemical Engineering"],
  "Faculty of Science": ["Mathematics", "Physics", "Chemistry", "Biology", "Biochemistry", "Microbiology"],
  "Faculty of Arts": ["English", "History", "Philosophy", "Linguistics", "Theatre Arts"],
  "Faculty of Social Sciences": ["Economics", "Political Science", "Sociology", "Psychology", "Mass Communication"],
  "Faculty of Medicine": ["Medicine & Surgery", "Nursing", "Pharmacy", "Medical Laboratory Science"],
  "Faculty of Law": ["Law"],
  "Faculty of Education": ["Education & Mathematics", "Education & English", "Education & Biology"],
  "Faculty of Agriculture": ["Crop Science", "Animal Science", "Agricultural Economics", "Soil Science"],
  "Faculty of Management Sciences": ["Accounting", "Business Administration", "Banking & Finance", "Marketing"]
}

export default function AddStudentPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [autoGenerateMatric, setAutoGenerateMatric] = useState(true)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const initialFormData: StudentFormData = {
    firstName: "",
    lastName: "",
    otherNames: "",
    matricNumber: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    stateOfOrigin: "",
    nationality: "Nigerian",
    profilePhoto: null,
    faculty: "",
    department: "",
    level: "",
    bloodGroup: "",
    genotype: "",
    allergies: [],
    chronicConditions: [],
    emergencyContact: "",
    emergencyPhone: "",
    emergencyRelationship: ""
  }

  const [formData, setFormData] = useState<StudentFormData>(initialFormData)

  const handleInputChange = (field: keyof StudentFormData, value: string | string[] | File) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, profilePhoto: file }))
      const reader = new FileReader()
      reader.onload = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const generateMatricNumber = () => {
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const deptCode = formData.department.substring(0, 3).toUpperCase()
    return `${deptCode}/${year}/${random}`
  }

  useEffect(() => {
    if (autoGenerateMatric && formData.department) {
      setFormData(prev => ({ ...prev, matricNumber: generateMatricNumber() }))
    }
  }, [formData.department, autoGenerateMatric])

  const addAllergy = (allergy: string) => {
    if (allergy.trim() && !formData.allergies.includes(allergy.trim())) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, allergy.trim()]
      }))
    }
  }

  const removeAllergy = (index: number) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }))
  }

  const addChronicCondition = (condition: string) => {
    if (condition.trim() && !formData.chronicConditions.includes(condition.trim())) {
      setFormData(prev => ({
        ...prev,
        chronicConditions: [...prev.chronicConditions, condition.trim()]
      }))
    }
  }

  const removeChronicCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      chronicConditions: prev.chronicConditions.filter((_, i) => i !== index)
    }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.matricNumber && 
                 formData.phone && formData.dateOfBirth && formData.gender)
      case 2:
        return !!(formData.faculty && formData.department && formData.level)
      case 3:
        return true // Medical info is optional
      case 4:
        return !!(formData.emergencyContact && formData.emergencyPhone)
      default:
        return false
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    } else {
      toast.error("Please fill in all required fields")
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      // Check for duplicate matric number
      const duplicateCheck = await axios.get(`/api/students/check-duplicate?matricNumber=${formData.matricNumber}`)
      
      if (duplicateCheck.data.exists) {
        toast.error("A student with this matric number already exists")
        setIsSubmitting(false)
        return
      }

      // Upload photo if exists
      let photoUrl = null
      if (formData.profilePhoto) {
        const photoFormData = new FormData()
        photoFormData.append('photo', formData.profilePhoto)
        const photoResponse = await axios.post('/api/upload/student-photo', photoFormData)
        photoUrl = photoResponse.data.url
      }

      // Create student record
      const studentData = {
        ...formData,
        profilePhoto: photoUrl,
        allergies: JSON.stringify(formData.allergies),
        chronicConditions: JSON.stringify(formData.chronicConditions),
        dateOfBirth: new Date(formData.dateOfBirth).toISOString()
      }

      await axios.post('/api/students', studentData)
      
      toast.success("Student registered successfully!")
      setShowSuccessDialog(true)
      setFormData(initialFormData)
      setPhotoPreview(null)
      setCurrentStep(1)
    } catch (error) {
      console.error('Error creating student:', error)
      toast.error("Failed to register student. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1: return <User className="h-4 w-4" />
      case 2: return <GraduationCap className="h-4 w-4" />
      case 3: return <Heart className="h-4 w-4" />
      case 4: return <Phone className="h-4 w-4" />
      default: return null
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Photo Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Profile Photo
                </CardTitle>
                <CardDescription>Upload a profile photo (optional)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="mb-2"
                    />
                    <p className="text-sm text-gray-500">JPG, PNG or GIF (max. 5MB)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Enter the student's basic information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otherNames">Other Names</Label>
                    <Input
                      id="otherNames"
                      value={formData.otherNames}
                      onChange={(e) => handleInputChange("otherNames", e.target.value)}
                      placeholder="Enter other names"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="student@university.edu"
                    />
                  </div>
                </div>

                {/* Matric Number */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="matricNumber">Matric Number *</Label>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="autoGenerate"
                        checked={autoGenerateMatric}
                        onCheckedChange={setAutoGenerateMatric}
                      />
                      <Label htmlFor="autoGenerate" className="text-sm">Auto-generate</Label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="matricNumber"
                      value={formData.matricNumber}
                      onChange={(e) => handleInputChange("matricNumber", e.target.value)}
                      placeholder="CSC/2024/001"
                      disabled={autoGenerateMatric}
                      required
                    />
                    {autoGenerateMatric && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setFormData(prev => ({ ...prev, matricNumber: generateMatricNumber() }))}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="+234 801 234 5678"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stateOfOrigin">State of Origin</Label>
                    <Select value={formData.stateOfOrigin} onValueChange={(value) => handleInputChange("stateOfOrigin", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {NIGERIAN_STATES.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Enter full address"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => handleInputChange("nationality", e.target.value)}
                    placeholder="Nigerian"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Academic Information
              </CardTitle>
              <CardDescription>Enter the student's academic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="faculty">Faculty *</Label>
                <Select 
                  value={formData.faculty} 
                  onValueChange={(value) => {
                    handleInputChange("faculty", value)
                    handleInputChange("department", "") // Reset department when faculty changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {FACULTIES.map(faculty => (
                      <SelectItem key={faculty} value={faculty}>{faculty}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select 
                  value={formData.department} 
                  onValueChange={(value) => handleInputChange("department", value)}
                  disabled={!formData.faculty}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.faculty && DEPARTMENTS[formData.faculty as keyof typeof DEPARTMENTS]?.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Level *</Label>
                <Select value={formData.level} onValueChange={(value) => handleInputChange("level", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 Level</SelectItem>
                    <SelectItem value="200">200 Level</SelectItem>
                    <SelectItem value="300">300 Level</SelectItem>
                    <SelectItem value="400">400 Level</SelectItem>
                    <SelectItem value="500">500 Level</SelectItem>
                    <SelectItem value="600">600 Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Medical Information
              </CardTitle>
              <CardDescription>Enter the student's medical details (optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <Select value={formData.bloodGroup} onValueChange={(value) => handleInputChange("bloodGroup", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genotype">Genotype</Label>
                  <Select value={formData.genotype} onValueChange={(value) => handleInputChange("genotype", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select genotype" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AA">AA</SelectItem>
                      <SelectItem value="AS">AS</SelectItem>
                      <SelectItem value="SS">SS</SelectItem>
                      <SelectItem value="AC">AC</SelectItem>
                      <SelectItem value="SC">SC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Allergies */}
              <div className="space-y-2">
                <Label>Allergies</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter allergy and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addAllergy(e.currentTarget.value)
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.allergies.map((allergy, index) => (
                    <span
                      key={index}
                      className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      {allergy}
                      <button
                        type="button"
                        onClick={() => removeAllergy(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Chronic Conditions */}
              <div className="space-y-2">
                <Label>Chronic Conditions</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter condition and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addChronicCondition(e.currentTarget.value)
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.chronicConditions.map((condition, index) => (
                    <span
                      key={index}
                      className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      {condition}
                      <button
                        type="button"
                        onClick={() => removeChronicCondition(index)}
                        className="text-orange-600 hover:text-orange-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Emergency Contact
              </CardTitle>
              <CardDescription>Enter emergency contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact Name *</Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                  placeholder="Enter emergency contact name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Emergency Contact Phone *</Label>
                <Input
                  id="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={(e) => handleInputChange("emergencyPhone", e.target.value)}
                  placeholder="+234 801 234 5678"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyRelationship">Relationship</Label>
                <Select value={formData.emergencyRelationship} onValueChange={(value) => handleInputChange("emergencyRelationship", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Parent">Parent</SelectItem>
                    <SelectItem value="Guardian">Guardian</SelectItem>
                    <SelectItem value="Sibling">Sibling</SelectItem>
                    <SelectItem value="Spouse">Spouse</SelectItem>
                    <SelectItem value="Friend">Friend</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
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
                <BreadcrumbPage>Register New Student</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            <h1 className="text-2xl font-semibold text-blue-600">Register New Student</h1>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Progress Indicator */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step < currentStep ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      getStepIcon(step)
                    )}
                  </div>
                  {step < 4 && (
                    <div className={`w-16 h-1 mx-2 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <Progress value={(currentStep / 4) * 100} className="w-full" />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>Personal Info</span>
              <span>Academic Info</span>
              <span>Medical Info</span>
              <span>Emergency Contact</span>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <div className="space-y-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentStep < 4 ? (
            <Button type="button" onClick={nextStep}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                  Registering...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Register Student
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Student Registered Successfully!
            </DialogTitle>
            <DialogDescription>
              The student has been added to the system with matric number: {formData.matricNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => {
              setShowSuccessDialog(false)
              setFormData(initialFormData)
              setPhotoPreview(null)
              setCurrentStep(1)
            }}>
              Register Another Student
            </Button>
            <Button onClick={() => router.push('/admin/students')}>
              View All Students
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}