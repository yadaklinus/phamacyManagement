import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/prisma/generated/database"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { patientId } = params

    // Get patient details
    const patient = await prisma.student.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        matricNumber: true,
        firstName: true,
        lastName: true,
        allergies: true,
        chronicConditions: true
      }
    })

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      )
    }

    // Get medical history
    const [consultations, prescriptions, vitalSigns] = await Promise.all([
      // Previous consultations
      prisma.consultation.findMany({
        where: {
          studentId: patientId,
          isDeleted: false
        },
        include: {
          physician: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }),

      // Recent prescriptions
      prisma.prescription.findMany({
        where: {
          studentId: patientId,
          isDeleted: false
        },
        include: {
          prescriptionItems: {
            select: {
              drugName: true,
              dosage: true,
              frequency: true,
              duration: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      }),

      // Latest vital signs
      prisma.vitalSigns.findMany({
        where: {
          studentId: patientId,
          isDeleted: false
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      })
    ])

    // Parse allergies and chronic conditions
    const allergies = patient.allergies ? 
      (typeof patient.allergies === 'string' ? 
        patient.allergies.split(',').map(a => a.trim()) : 
        JSON.parse(patient.allergies)
      ) : []

    const chronicConditions = patient.chronicConditions ? 
      (typeof patient.chronicConditions === 'string' ? 
        patient.chronicConditions.split(',').map(c => c.trim()) : 
        JSON.parse(patient.chronicConditions)
      ) : []

    // Get current medications from active prescriptions
    const activePrescriptions = await prisma.prescription.findMany({
      where: {
        studentId: patientId,
        status: 'dispensed',
        validUntil: {
          gte: new Date()
        },
        isDeleted: false
      },
      include: {
        prescriptionItems: {
          where: {
            isDispensed: true
          },
          select: {
            drugName: true,
            dosage: true,
            frequency: true
          }
        }
      }
    })

    const currentMedications = activePrescriptions.flatMap(prescription =>
      prescription.prescriptionItems.map(item =>
        `${item.drugName} ${item.dosage} - ${item.frequency}`
      )
    )

    const medicalHistory = {
      patient: {
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`,
        matricNumber: patient.matricNumber
      },
      consultations: consultations.map(consultation => ({
        id: consultation.id,
        consultationNo: consultation.consultationNo,
        date: consultation.createdAt,
        diagnosis: consultation.diagnosis,
        chiefComplaint: consultation.chiefComplaint,
        physician: consultation.physician ? 
          `Dr. ${consultation.physician.firstName} ${consultation.physician.lastName}` : 
          'Unknown',
        status: consultation.status
      })),
      prescriptions: prescriptions.map(prescription => ({
        id: prescription.id,
        prescriptionNo: prescription.prescriptionNo,
        date: prescription.createdAt,
        diagnosis: prescription.diagnosis,
        medications: prescription.prescriptionItems.map(item => ({
          name: item.drugName,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration
        })),
        status: prescription.status
      })),
      vitalSigns: vitalSigns.map(vital => ({
        id: vital.id,
        date: vital.createdAt,
        temperature: vital.temperature,
        bloodPressure: vital.bloodPressure,
        pulse: vital.pulse,
        respiratoryRate: vital.respiratoryRate,
        weight: vital.weight,
        height: vital.height,
        oxygenSaturation: vital.oxygenSaturation
      })),
      allergies,
      chronicConditions,
      currentMedications
    }

    return NextResponse.json(medicalHistory)

  } catch (error) {
    console.error("Patient History API Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch patient history" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}