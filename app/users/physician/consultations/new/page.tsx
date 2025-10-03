"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  User,
  Heart,
  Thermometer,
  Activity,
  Weight,
  Calendar as CalendarIcon,
  Save,
  FileText,
  X,
  Plus,
  AlertCircle,
  Clock,
  Stethoscope,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Patient {
  id: string
  matricNumber: string
  firstName: string
  lastName: string
  otherNames?: string
  age: number
  gender: string
  bloodGroup?: string
  genotype?: string
  allergies?: string
  chronicConditions?: string
  phone?: string
  department: string
  level: string
  faculty: string
}

interface VitalSigns {
  temperature?: number
  bloodPressure?: string
  pulse?: number
  respiratoryRate?: number
  weight?: number
  height?: number
  oxygenSaturation?: number
}

interface MedicalHistory {
  consultations: Array<{
    date: string
    diagnosis: string
    physician: string
  }>
  allergies: string[]
  chronicConditions: string[]
  currentMedications: string[]
}

const commonSymptoms = [
  "Fever", "Headache", "Body Aches", "Cough", "Vomiting", 
  "Diarrhea", "Dizziness", "Rash", "Sore Throat", "Fatigue",
  "Nausea", "Chest Pain", "Shortness of Breath", "Abdominal Pain"
]

export default function NewConsultationPage() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory | null>(null)
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({})
  
  // Consultation form data
  const [chiefComplaint, setChiefComplaint] = useState("")
  const [historyOfPresenting, setHistoryOfPresenting] = useState("")
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [customSymptom, setCustomSymptom] = useState("")
  const [physicalExamination, setPhysicalExamination] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [differentialDiagnosis, setDifferentialDiagnosis] = useState("")
  const [treatmentPlan, setTreatmentPlan] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [followUpDate, setFollowUpDate] = useState<Date>()
  const [priority, setPriority] = useState<"normal" | "urgent" | "emergency">("normal")
  const [status, setStatus] = useState<"in_progress" | "completed">("in_progress")
  const [isSaving, setIsSaving] = useState(false)

  const router = useRouter()

  // Mock patient search
  const searchPatients = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    
    // Mock search results
    const mockPatients: Patient[] = [
      {
        id: "1",
        matricNumber: "CSC/2020/001",
        firstName: "John",
        lastName: "Doe",
        age: 22,
        gender: "Male",
        bloodGroup: "O+",
        genotype: "AA",
        allergies: "Penicillin",
        chronicConditions: "Asthma",
        phone: "08012345678",
        department: "Computer Science",
        level: "400",
        faculty: "Science"
      },
      {
        id: "2",
        matricNumber: "ENG/2021/045",
        firstName: "Jane",
        lastName: "Smith",
        age: 21,
        gender: "Female",
        bloodGroup: "A+",
        genotype: "AS",
        department: "Electrical Engineering",
        level: "300",
        faculty: "Engineering"
      }
    ]

    // Simulate API delay
    setTimeout(() => {
      const filtered = mockPatients.filter(patient => 
        patient.matricNumber.toLowerCase().includes(query.toLowerCase()) ||
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(query.toLowerCase())
      )
      setSearchResults(filtered)
      setIsSearching(false)
    }, 500)
  }

  const loadMedicalHistory = async (patientId: string) => {
    // Mock medical history
    const mockHistory: MedicalHistory = {
      consultations: [
        {
          date: "Sep 20, 2024",
          diagnosis: "Malaria",
          physician: "Dr. Smith"
        },
        {
          date: "Aug 15, 2024",
          diagnosis: "Headache",
          physician: "Dr. Johnson"
        }
      ],
      allergies: ["Penicillin"],
      chronicConditions: ["Asthma"],
      currentMedications: ["Salbutamol Inhaler"]
    }
    setMedicalHistory(mockHistory)
  }

  const loadLatestVitals = async (patientId: string) => {
    // Mock vital signs
    const mockVitals: VitalSigns = {
      temperature: 38.5,
      bloodPressure: "120/80",
      pulse: 85,
      weight: 68,
      oxygenSaturation: 98
    }
    setVitalSigns(mockVitals)
  }

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient)
    setSearchResults([])
    setSearchQuery("")
    loadMedicalHistory(patient.id)
    loadLatestVitals(patient.id)
  }

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    )
  }

  const addCustomSymptom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms(prev => [...prev, customSymptom.trim()])
      setCustomSymptom("")
    }
  }

  const handleSaveDraft = async () => {
    setIsSaving(true)
    // Mock save draft
    setTimeout(() => {
      setIsSaving(false)
      alert("Draft saved successfully!")
    }, 1000)
  }

  const handleCompleteConsultation = async () => {
    if (!selectedPatient || !chiefComplaint.trim() || !diagnosis.trim()) {
      alert("Please fill in required fields: Patient, Chief Complaint, and Diagnosis")
      return
    }

    setIsSaving(true)
    
    const consultationData = {
      patientId: selectedPatient.id,
      chiefComplaint,
      historyOfPresenting,
      symptoms: selectedSymptoms,
      physicalExamination,
      diagnosis,
      differentialDiagnosis,
      treatmentPlan,
      additionalNotes,
      followUpDate,
      priority,
      status: "completed",
      vitalSigns
    }

    // Mock API call
    setTimeout(() => {
      setIsSaving(false)
      alert("Consultation completed successfully!")
      router.push(`/users/physician/consultations/CONS-2025-001/prescribe`)
    }, 1500)
  }

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchPatients(searchQuery)
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchQuery])

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">New Consultation</h1>
        <p className="text-muted-foreground">
          Conduct patient consultation and create medical records
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Patient Search & Selection */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Patient Selection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    placeholder="Search by matric number or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    {searchResults.map((patient) => (
                      <div
                        key={patient.id}
                        className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{patient.firstName} {patient.lastName}</p>
                            <p className="text-sm text-muted-foreground">{patient.matricNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {patient.department} • {patient.level} Level
                            </p>
                          </div>
                          <Badge variant="outline">{patient.gender}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Patient Info */}
                {selectedPatient && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {selectedPatient.firstName} {selectedPatient.lastName}
                          </h3>
                          <p className="text-muted-foreground">{selectedPatient.matricNumber}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPatient(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <p className="text-sm font-medium">Basic Info</p>
                          <p className="text-sm text-muted-foreground">
                            Age: {selectedPatient.age} | Gender: {selectedPatient.gender}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Blood: {selectedPatient.bloodGroup || "N/A"} | Geno: {selectedPatient.genotype || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Academic</p>
                          <p className="text-sm text-muted-foreground">{selectedPatient.department}</p>
                          <p className="text-sm text-muted-foreground">{selectedPatient.level} Level</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Latest Vitals</p>
                          <p className="text-sm text-muted-foreground">
                            Temp: {vitalSigns.temperature}°C
                          </p>
                          <p className="text-sm text-muted-foreground">
                            BP: {vitalSigns.bloodPressure} | Pulse: {vitalSigns.pulse} bpm
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Weight: {vitalSigns.weight}kg
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Consultation Form */}
          {selectedPatient && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Stethoscope className="h-5 w-5 mr-2" />
                  Consultation Form
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Chief Complaint */}
                <div>
                  <Label htmlFor="chief-complaint" className="text-sm font-medium">
                    Chief Complaint* <span className="text-muted-foreground">(Main Problem)</span>
                  </Label>
                  <Textarea
                    id="chief-complaint"
                    placeholder="e.g., Severe headache and fever for 3 days"
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    className="mt-2"
                  />
                </div>

                {/* History of Presenting Complaint */}
                <div>
                  <Label htmlFor="history" className="text-sm font-medium">
                    History of Presenting Complaint <span className="text-muted-foreground">(Detailed Story)</span>
                  </Label>
                  <Textarea
                    id="history"
                    placeholder="Patient reports headache started 3 days ago, progressively worsening..."
                    value={historyOfPresenting}
                    onChange={(e) => setHistoryOfPresenting(e.target.value)}
                    className="mt-2 min-h-[100px]"
                  />
                </div>

                {/* Symptoms */}
                <div>
                  <Label className="text-sm font-medium">Symptoms (Check all that apply)</Label>
                  <div className="mt-2 grid gap-3 md:grid-cols-4">
                    {commonSymptoms.map((symptom) => (
                      <div key={symptom} className="flex items-center space-x-2">
                        <Checkbox
                          id={symptom}
                          checked={selectedSymptoms.includes(symptom)}
                          onCheckedChange={() => handleSymptomToggle(symptom)}
                        />
                        <Label htmlFor={symptom} className="text-sm">
                          {symptom}
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  {/* Custom Symptom */}
                  <div className="mt-3 flex items-center space-x-2">
                    <Input
                      placeholder="Add custom symptom"
                      value={customSymptom}
                      onChange={(e) => setCustomSymptom(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomSymptom()}
                    />
                    <Button onClick={addCustomSymptom} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Physical Examination */}
                <div>
                  <Label htmlFor="examination" className="text-sm font-medium">
                    Physical Examination Findings
                  </Label>
                  <Textarea
                    id="examination"
                    placeholder="Patient appears ill and febrile. Pallor present. Chest clear..."
                    value={physicalExamination}
                    onChange={(e) => setPhysicalExamination(e.target.value)}
                    className="mt-2 min-h-[100px]"
                  />
                </div>

                {/* Diagnosis */}
                <div>
                  <Label htmlFor="diagnosis" className="text-sm font-medium">
                    Diagnosis*
                  </Label>
                  <Input
                    id="diagnosis"
                    placeholder="e.g., Malaria"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="mt-2"
                  />
                </div>

                {/* Differential Diagnosis */}
                <div>
                  <Label htmlFor="differential" className="text-sm font-medium">
                    Differential Diagnosis <span className="text-muted-foreground">(Other Possibilities)</span>
                  </Label>
                  <Input
                    id="differential"
                    placeholder="e.g., Typhoid fever, Viral infection"
                    value={differentialDiagnosis}
                    onChange={(e) => setDifferentialDiagnosis(e.target.value)}
                    className="mt-2"
                  />
                </div>

                {/* Treatment Plan */}
                <div>
                  <Label htmlFor="treatment" className="text-sm font-medium">
                    Treatment Plan
                  </Label>
                  <Textarea
                    id="treatment"
                    placeholder="- Antimalarial therapy&#10;- Antipyretic for fever&#10;- Adequate hydration&#10;- Rest"
                    value={treatmentPlan}
                    onChange={(e) => setTreatmentPlan(e.target.value)}
                    className="mt-2 min-h-[100px]"
                  />
                </div>

                {/* Additional Notes */}
                <div>
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Additional Notes
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Patient advised to return if symptoms worsen"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    className="mt-2"
                  />
                </div>

                {/* Follow-up Date */}
                <div>
                  <Label className="text-sm font-medium">Follow-up Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full mt-2 justify-start text-left font-normal",
                          !followUpDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {followUpDate ? format(followUpDate, "PPP") : "Select Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={followUpDate}
                        onSelect={setFollowUpDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Priority and Status */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium">Priority Level</Label>
                    <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button
                    onClick={handleCompleteConsultation}
                    disabled={isSaving || !chiefComplaint.trim() || !diagnosis.trim()}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {isSaving ? "Processing..." : "Complete & Create Prescription"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Medical History Sidebar */}
        {selectedPatient && medicalHistory && (
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Medical History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Previous Consultations */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Previous Consultations:</h4>
                  <div className="space-y-2">
                    {medicalHistory.consultations.map((consultation, index) => (
                      <div key={index} className="text-sm p-2 bg-muted rounded">
                        <p className="font-medium">{consultation.diagnosis}</p>
                        <p className="text-muted-foreground text-xs">
                          {consultation.date}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Allergies */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Allergies:</h4>
                  <div className="space-y-1">
                    {medicalHistory.allergies.map((allergy, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Chronic Conditions */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Chronic Conditions:</h4>
                  <div className="space-y-1">
                    {medicalHistory.chronicConditions.map((condition, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Current Medications */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Current Medications:</h4>
                  <div className="space-y-1">
                    {medicalHistory.currentMedications.map((medication, index) => (
                      <p key={index} className="text-sm text-muted-foreground">
                        • {medication}
                      </p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}