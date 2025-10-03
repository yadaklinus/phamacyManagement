import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/prisma/generated/database"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

// POST - Call next patient in queue
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the next patient in queue (highest priority first, then by queue number)
    const nextPatient = await prisma.queue.findFirst({
      where: {
        status: 'waiting',
        isDeleted: false
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricNumber: true,
            age: true,
            gender: true,
            bloodGroup: true,
            genotype: true,
            allergies: true,
            chronicConditions: true,
            phone: true,
            department: true,
            level: true,
            faculty: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' }, // emergency first
        { queueNumber: 'asc' }
      ]
    })

    if (!nextPatient) {
      return NextResponse.json(
        { error: "No patients waiting in queue" },
        { status: 404 }
      )
    }

    // Update queue status to 'called'
    const updatedQueue = await prisma.queue.update({
      where: { id: nextPatient.id },
      data: {
        status: 'called',
        calledTime: new Date()
      }
    })

    // Get patient's medical history for quick reference
    const [recentConsultations, latestVitals, activePrescriptions] = await Promise.all([
      // Recent consultations
      prisma.consultation.findMany({
        where: {
          studentId: nextPatient.studentId,
          isDeleted: false
        },
        select: {
          consultationNo: true,
          diagnosis: true,
          createdAt: true,
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
        take: 3
      }),

      // Latest vital signs
      prisma.vitalSigns.findFirst({
        where: {
          studentId: nextPatient.studentId,
          isDeleted: false
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),

      // Active prescriptions
      prisma.prescription.findMany({
        where: {
          studentId: nextPatient.studentId,
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
        },
        take: 2
      })
    ])

    // Parse allergies and chronic conditions
    const allergies = nextPatient.student.allergies ? 
      (typeof nextPatient.student.allergies === 'string' ? 
        nextPatient.student.allergies.split(',').map(a => a.trim()) : 
        JSON.parse(nextPatient.student.allergies)
      ) : []

    const chronicConditions = nextPatient.student.chronicConditions ? 
      (typeof nextPatient.student.chronicConditions === 'string' ? 
        nextPatient.student.chronicConditions.split(',').map(c => c.trim()) : 
        JSON.parse(nextPatient.student.chronicConditions)
      ) : []

    // Calculate age
    const birthDate = new Date(nextPatient.student.age)
    const age = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25))

    const patientData = {
      queue: {
        id: updatedQueue.id,
        queueNumber: updatedQueue.queueNumber,
        priority: updatedQueue.priority,
        complaint: updatedQueue.notes || "General consultation",
        checkInTime: updatedQueue.checkInTime,
        calledTime: updatedQueue.calledTime
      },
      patient: {
        id: nextPatient.student.id,
        matricNumber: nextPatient.student.matricNumber,
        firstName: nextPatient.student.firstName,
        lastName: nextPatient.student.lastName,
        age: age || 0,
        gender: nextPatient.student.gender,
        bloodGroup: nextPatient.student.bloodGroup,
        genotype: nextPatient.student.genotype,
        phone: nextPatient.student.phone,
        department: nextPatient.student.department,
        level: nextPatient.student.level,
        faculty: nextPatient.student.faculty
      },
      medicalHistory: {
        recentConsultations: recentConsultations.map(consultation => ({
          consultationNo: consultation.consultationNo,
          diagnosis: consultation.diagnosis,
          date: consultation.createdAt,
          physician: consultation.physician ? 
            `Dr. ${consultation.physician.firstName} ${consultation.physician.lastName}` : 
            'Unknown'
        })),
        latestVitals: latestVitals ? {
          temperature: latestVitals.temperature,
          bloodPressure: latestVitals.bloodPressure,
          pulse: latestVitals.pulse,
          weight: latestVitals.weight,
          height: latestVitals.height,
          oxygenSaturation: latestVitals.oxygenSaturation,
          recordedAt: latestVitals.createdAt
        } : null,
        allergies,
        chronicConditions,
        currentMedications: activePrescriptions.flatMap(prescription =>
          prescription.prescriptionItems.map(item =>
            `${item.drugName} ${item.dosage} - ${item.frequency}`
          )
        )
      }
    }

    return NextResponse.json(patientData)

  } catch (error) {
    console.error("Call Next Patient API Error:", error)
    return NextResponse.json(
      { error: "Failed to call next patient" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// GET - Get currently called patient
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const calledPatient = await prisma.queue.findFirst({
      where: {
        status: 'called',
        isDeleted: false
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricNumber: true,
            age: true,
            gender: true
          }
        }
      },
      orderBy: {
        calledTime: 'desc'
      }
    })

    if (!calledPatient) {
      return NextResponse.json({ patient: null })
    }

    const patientData = {
      queue: {
        id: calledPatient.id,
        queueNumber: calledPatient.queueNumber,
        priority: calledPatient.priority,
        complaint: calledPatient.notes || "General consultation"
      },
      patient: {
        id: calledPatient.student.id,
        name: `${calledPatient.student.firstName} ${calledPatient.student.lastName}`,
        matricNumber: calledPatient.student.matricNumber,
        age: calledPatient.student.age,
        gender: calledPatient.student.gender
      }
    }

    return NextResponse.json(patientData)

  } catch (error) {
    console.error("Get Called Patient API Error:", error)
    return NextResponse.json(
      { error: "Failed to get called patient" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}