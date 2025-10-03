// app/api/students/list/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@/prisma/generated/database'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      where: {
        isDeleted: false,
      },
      orderBy: [
        { isActive: 'desc' }, // Active students first
        { lastName: 'asc' },
        { firstName: 'asc' }
      ],
      select: {
        id: true,
        matricNumber: true,
        firstName: true,
        lastName: true,
        otherNames: true,
        email: true,
        phone: true,
        department: true,
        level: true,
        faculty: true,
        dateOfBirth: true,
        gender: true,
        bloodGroup: true,
        genotype: true,
        profilePhoto: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Include counts for related records
        _count: {
          select: {
            consultations: true,
            prescriptions: true,
            appointments: true,
          }
        }
      },
    })

    return NextResponse.json({
      success: true,
      students,
      total: students.length
    })
  } catch (error: any) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students', details: error.message },
      { status: 500 }
    )
  }
}