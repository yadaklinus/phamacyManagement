import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/prisma/generated/database"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

// GET - Fetch prescriptions for physician
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

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
              matricNumber: true
            }
          },
          consultation: {
            select: {
              consultationNo: true,
              diagnosis: true
            }
          },
          prescriptionItems: {
            include: {
              product: {
                select: {
                  name: true,
                  quantity: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.prescription.count({
        where: whereClause
      })
    ])

    const formattedPrescriptions = prescriptions.map(prescription => ({
      id: prescription.id,
      prescriptionNo: prescription.prescriptionNo,
      patient: {
        name: `${prescription.student.firstName} ${prescription.student.lastName}`,
        matricNumber: prescription.student.matricNumber
      },
      consultation: {
        consultationNo: prescription.consultation.consultationNo,
        diagnosis: prescription.consultation.diagnosis
      },
      status: prescription.status,
      priority: prescription.priority,
      totalCost: prescription.totalCost,
      itemCount: prescription.prescriptionItems.length,
      isPaid: prescription.isPaid,
      isDispensed: prescription.isDispensed,
      createdAt: prescription.createdAt,
      validUntil: prescription.validUntil,
      items: prescription.prescriptionItems.map(item => ({
        drugName: item.drugName,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        quantityPrescribed: item.quantityPrescribed,
        quantityDispensed: item.quantityDispensed,
        isDispensed: item.isDispensed,
        availableStock: item.product?.quantity || 0
      }))
    }))

    return NextResponse.json({
      prescriptions: formattedPrescriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("Prescriptions API Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch prescriptions" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Create new prescription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const physicianId = session.user.id
    const body = await request.json()

    const {
      consultationId,
      prescriptionItems,
      instructions,
      priority = "normal",
      validUntil
    } = body

    // Validate required fields
    if (!consultationId || !prescriptionItems || prescriptionItems.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: consultationId, prescriptionItems" },
        { status: 400 }
      )
    }

    // Get consultation details
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        student: true
      }
    })

    if (!consultation) {
      return NextResponse.json(
        { error: "Consultation not found" },
        { status: 404 }
      )
    }

    // Generate prescription number
    const prescriptionCount = await prisma.prescription.count()
    const prescriptionNo = `RX-${new Date().getFullYear()}-${String(prescriptionCount + 1).padStart(4, '0')}`

    // Calculate total cost
    const totalCost = prescriptionItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0)

    // Create prescription
    const prescription = await prisma.prescription.create({
      data: {
        prescriptionNo,
        studentId: consultation.studentId,
        physicianId,
        consultationId,
        diagnosis: consultation.diagnosis,
        instructions,
        priority,
        totalCost,
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days default
      }
    })

    // Create prescription items
    const createdItems = await Promise.all(
      prescriptionItems.map(async (item: any) => {
        return prisma.prescriptionItem.create({
          data: {
            prescriptionId: prescription.prescriptionNo,
            productId: item.drugId,
            drugName: item.drugName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            route: item.route,
            instructions: item.instructions,
            quantityPrescribed: item.quantityPrescribed,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          }
        })
      })
    )

    // Update consultation status if needed
    if (consultation.status !== "completed") {
      await prisma.consultation.update({
        where: { id: consultationId },
        data: {
          status: "completed",
          completedAt: new Date()
        }
      })
    }

    // Update queue status
    await prisma.queue.updateMany({
      where: {
        studentId: consultation.studentId,
        status: "in_consultation"
      },
      data: {
        status: "completed",
        completedTime: new Date()
      }
    })

    return NextResponse.json({
      prescription: {
        id: prescription.id,
        prescriptionNo: prescription.prescriptionNo,
        patient: {
          name: `${consultation.student.firstName} ${consultation.student.lastName}`,
          matricNumber: consultation.student.matricNumber
        },
        totalCost: prescription.totalCost,
        itemCount: createdItems.length,
        status: prescription.status,
        createdAt: prescription.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Create Prescription API Error:", error)
    return NextResponse.json(
      { error: "Failed to create prescription" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}