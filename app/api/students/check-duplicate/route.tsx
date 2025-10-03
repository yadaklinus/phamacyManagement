import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/prisma/generated/database"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const matricNumber = searchParams.get('matricNumber')

    if (!matricNumber) {
      return NextResponse.json(
        { error: "Matric number is required" },
        { status: 400 }
      )
    }

    const existingStudent = await prisma.student.findUnique({
      where: { 
        matricNumber,
        isDeleted: false 
      },
      select: { id: true, matricNumber: true }
    })

    return NextResponse.json({
      exists: !!existingStudent,
      student: existingStudent
    })

  } catch (error) {
    console.error("Error checking duplicate matric number:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}