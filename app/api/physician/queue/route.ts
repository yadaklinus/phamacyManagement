import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/prisma/generated/database"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

// GET - Get current queue
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'waiting'

    const queue = await prisma.queue.findMany({
      where: {
        status,
        isDeleted: false
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            matricNumber: true,
            age: true,
            gender: true,
            phone: true,
            department: true,
            level: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' }, // emergency first, then urgent, then normal
        { queueNumber: 'asc' }
      ]
    })

    const formattedQueue = queue.map(item => {
      const waitTime = calculateWaitTime(item.checkInTime)
      
      return {
        id: item.id,
        queueNumber: item.queueNumber,
        patient: {
          id: item.studentId,
          name: `${item.student.firstName} ${item.student.lastName}`,
          matricNumber: item.student.matricNumber,
          age: calculateAge(item.student.age),
          gender: item.student.gender,
          phone: item.student.phone,
          department: item.student.department,
          level: item.student.level
        },
        priority: item.priority,
        status: item.status,
        complaint: item.notes || "General consultation",
        checkInTime: item.checkInTime,
        calledTime: item.calledTime,
        completedTime: item.completedTime,
        waitTime
      }
    })

    // Get queue statistics
    const stats = await prisma.queue.groupBy({
      by: ['status'],
      where: {
        isDeleted: false,
        checkInTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today
        }
      },
      _count: {
        id: true
      }
    })

    const queueStats = {
      waiting: stats.find(s => s.status === 'waiting')?._count.id || 0,
      called: stats.find(s => s.status === 'called')?._count.id || 0,
      in_consultation: stats.find(s => s.status === 'in_consultation')?._count.id || 0,
      completed: stats.find(s => s.status === 'completed')?._count.id || 0,
      total: stats.reduce((sum, s) => sum + s._count.id, 0)
    }

    return NextResponse.json({
      queue: formattedQueue,
      stats: queueStats
    })

  } catch (error) {
    console.error("Queue API Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch queue" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Add patient to queue
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { studentId, priority = "normal", notes } = body

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      )
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        matricNumber: true
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      )
    }

    // Check if student is already in queue today
    const existingQueue = await prisma.queue.findFirst({
      where: {
        studentId,
        status: {
          in: ['waiting', 'called', 'in_consultation']
        },
        checkInTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        },
        isDeleted: false
      }
    })

    if (existingQueue) {
      return NextResponse.json(
        { error: "Student is already in queue" },
        { status: 400 }
      )
    }

    // Get next queue number
    const lastQueue = await prisma.queue.findFirst({
      where: {
        checkInTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      },
      orderBy: {
        queueNumber: 'desc'
      }
    })

    const queueNumber = (lastQueue?.queueNumber || 0) + 1

    // Add to queue
    const queueItem = await prisma.queue.create({
      data: {
        queueNumber,
        studentId,
        priority,
        notes,
        status: 'waiting'
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

    return NextResponse.json({
      queue: {
        id: queueItem.id,
        queueNumber: queueItem.queueNumber,
        patient: {
          name: `${queueItem.student.firstName} ${queueItem.student.lastName}`,
          matricNumber: queueItem.student.matricNumber
        },
        priority: queueItem.priority,
        status: queueItem.status,
        checkInTime: queueItem.checkInTime
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Add to Queue API Error:", error)
    return NextResponse.json(
      { error: "Failed to add patient to queue" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

function calculateWaitTime(checkInTime: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - checkInTime.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  
  if (diffMins < 60) {
    return `${diffMins} mins`
  } else {
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours}h ${mins}m`
  }
}

function calculateAge(birthDate: any): number {
  if (!birthDate) return 0
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}