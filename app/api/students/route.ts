import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/prisma/generated/database"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      firstName,
      lastName,
      otherNames,
      matricNumber,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      stateOfOrigin,
      nationality,
      profilePhoto,
      faculty,
      department,
      level,
      bloodGroup,
      genotype,
      allergies,
      chronicConditions,
      emergencyContact,
      emergencyPhone,
      emergencyRelationship
    } = body

    // Validate required fields
    if (!firstName || !lastName || !matricNumber || !phone || !dateOfBirth || !gender || !faculty || !department || !level || !emergencyContact || !emergencyPhone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check for duplicate matric number
    const existingStudent = await prisma.student.findUnique({
      where: { matricNumber }
    })

    if (existingStudent) {
      return NextResponse.json(
        { error: "A student with this matric number already exists" },
        { status: 409 }
      )
    }

    // Create the student
    const student = await prisma.student.create({
      data: {
        firstName,
        lastName,
        otherNames: otherNames || null,
        matricNumber,
        email: email || null,
        phone,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        address: address || null,
        stateOfOrigin: stateOfOrigin || null,
        nationality: nationality || "Nigerian",
        profilePhoto: profilePhoto || null,
        faculty,
        department,
        level,
        bloodGroup: bloodGroup || null,
        genotype: genotype || null,
        allergies: allergies || null,
        chronicConditions: chronicConditions || null,
        emergencyContact,
        emergencyPhone,
        emergencyRelationship: emergencyRelationship || null,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        matricNumber: student.matricNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        faculty: student.faculty,
        department: student.department,
        level: student.level
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const faculty = searchParams.get('faculty') || ''
    const level = searchParams.get('level') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      isDeleted: false
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { matricNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (faculty) {
      where.faculty = faculty
    }

    if (level) {
      where.level = level
    }

    // Get students with pagination
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        select: {
          id: true,
          matricNumber: true,
          firstName: true,
          lastName: true,
          otherNames: true,
          email: true,
          phone: true,
          faculty: true,
          department: true,
          level: true,
          profilePhoto: true,
          isActive: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.student.count({ where })
    ])

    return NextResponse.json({
      students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}