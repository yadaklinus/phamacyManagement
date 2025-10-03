import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/prisma/generated/database"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ patients: [] })
    }

    const searchTerm = query.trim().toLowerCase()

    const patients = await prisma.student.findMany({
      where: {
        AND: [
          { isDeleted: false },
          { isActive: true },
          {
            OR: [
              {
                matricNumber: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                firstName: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                lastName: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                otherNames: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        matricNumber: true,
        firstName: true,
        lastName: true,
        otherNames: true,
        dateOfBirth: true,
        gender: true,
        bloodGroup: true,
        genotype: true,
        allergies: true,
        chronicConditions: true,
        phone: true,
        department: true,
        level: true,
        faculty: true,
        emergencyContact: true,
        emergencyPhone: true
      },
      take: limit,
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    })

    const formattedPatients = patients.map(patient => {
      const birthDate = new Date(patient.dateOfBirth)
      const age = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25))

      return {
        id: patient.id,
        matricNumber: patient.matricNumber,
        firstName: patient.firstName,
        lastName: patient.lastName,
        otherNames: patient.otherNames,
        age,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        genotype: patient.genotype,
        allergies: patient.allergies,
        chronicConditions: patient.chronicConditions,
        phone: patient.phone,
        department: patient.department,
        level: patient.level,
        faculty: patient.faculty,
        emergencyContact: patient.emergencyContact,
        emergencyPhone: patient.emergencyPhone
      }
    })

    return NextResponse.json({ patients: formattedPatients })

  } catch (error) {
    console.error("Patient Search API Error:", error)
    return NextResponse.json(
      { error: "Failed to search patients" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}