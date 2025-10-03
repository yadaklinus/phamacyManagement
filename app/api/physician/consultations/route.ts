import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/prisma/generated/database"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

// GET - Fetch consultations for physician
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const physicianId = session.user.id

    const whereClause: any = {
      physicianId,
      isDeleted: false
    }

    if (status) {
      whereClause.status = status
    }

    const [consultations, total] = await Promise.all([
      prisma.consultation.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
              matricNumber: true,
              age: true,
              gender: true,
              bloodGroup: true,
              genotype: true
            }
          },
          vitalSigns: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          },
          prescriptions: {
            select: {
              id: true,
              prescriptionNo: true,
              status: true,
              totalCost: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.consultation.count({
        where: whereClause
      })
    ])

    const formattedConsultations = consultations.map((consultation:any) => ({
      id: consultation.id,
      consultationNo: consultation.consultationNo,
      patient: {
        id: consultation.student.id,
        name: `${consultation.student.firstName} ${consultation.student.lastName}`,
        matricNumber: consultation.student.matricNumber,
        age: consultation.student.age,
        gender: consultation.student.gender,
        bloodGroup: consultation.student.bloodGroup,
        genotype: consultation.student.genotype
      },
      chiefComplaint: consultation.chiefComplaint,
      diagnosis: consultation.diagnosis,
      status: consultation.status,
      priority: consultation.priority,
      createdAt: consultation.createdAt,
      completedAt: consultation.completedAt,
      followUpDate: consultation.followUpDate,
      latestVitals: consultation.vitalSigns[0] || null,
      prescriptions: consultation.prescriptions
    }))

    return NextResponse.json({
      consultations: formattedConsultations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("Consultations API Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch consultations" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Create new consultation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const physicianId = session.user.id
    const body = await request.json()

    const {
      patientId,
      chiefComplaint,
      historyOfPresenting,
      symptoms,
      physicalExamination,
      diagnosis,
      differentialDiagnosis,
      treatmentPlan,
      notes,
      followUpDate,
      priority = "normal",
      status = "in_progress",
      vitalSigns
    } = body

    // Validate required fields
    if (!patientId || !chiefComplaint || !diagnosis) {
      return NextResponse.json(
        { error: "Missing required fields: patientId, chiefComplaint, diagnosis" },
        { status: 400 }
      )
    }

    // Generate consultation number
    const consultationCount = await prisma.consultation.count()
    const consultationNo = `CONS-${new Date().getFullYear()}-${String(consultationCount + 1).padStart(3, '0')}`

    // Create consultation
    const consultation = await prisma.consultation.create({
      data: {
        consultationNo,
        studentId: patientId,
        physicianId,
        chiefComplaint,
        historyOfPresenting,
        symptoms: JSON.stringify(symptoms || []),
        physicalExamination,
        diagnosis,
        differentialDiagnosis,
        treatmentPlan,
        notes,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        priority,
        status,
        completedAt: status === "completed" ? new Date() : null
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            matricNumber: true
          }
        }
      }
    })

    // Create vital signs if provided
    if (vitalSigns && Object.keys(vitalSigns).length > 0) {
      await prisma.vitalSigns.create({
        data: {
          studentId: patientId,
          consultationId: consultation.id,
          temperature: vitalSigns.temperature,
          bloodPressure: vitalSigns.bloodPressure,
          pulse: vitalSigns.pulse,
          respiratoryRate: vitalSigns.respiratoryRate,
          weight: vitalSigns.weight,
          height: vitalSigns.height,
          oxygenSaturation: vitalSigns.oxygenSaturation,
          recordedBy: physicianId
        }
      })
    }

    // Update queue status if patient was in queue
    await prisma.queue.updateMany({
      where: {
        studentId: patientId,
        status: "waiting"
      },
      data: {
        status: "in_consultation",
        calledTime: new Date()
      }
    })

    return NextResponse.json({
      consultation: {
        id: consultation.id,
        consultationNo: consultation.consultationNo,
        patient: {
          name: `${consultation.student.firstName} ${consultation.student.lastName}`,
          matricNumber: consultation.student.matricNumber
        },
        diagnosis: consultation.diagnosis,
        status: consultation.status,
        createdAt: consultation.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Create Consultation API Error:", error)
    return NextResponse.json(
      { error: "Failed to create consultation" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}