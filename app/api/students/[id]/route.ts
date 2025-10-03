import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/prisma/generated/database"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      )
    }

    const student = await prisma.student.findUnique({
      where: { 
        id,
        isDeleted: false 
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      student
    })

  } catch (error) {
    console.error("Error fetching student:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      )
    }

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id, isDeleted: false }
    })

    if (!existingStudent) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      )
    }

    // Check for duplicate matric number (excluding current student)
    if (body.matricNumber && body.matricNumber !== existingStudent.matricNumber) {
      const duplicateStudent = await prisma.student.findUnique({
        where: { 
          matricNumber: body.matricNumber,
          isDeleted: false
        }
      })

      if (duplicateStudent && duplicateStudent.id !== id) {
        return NextResponse.json(
          { error: "A student with this matric number already exists" },
          { status: 409 }
        )
      }
    }

    // Update the student
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        ...body,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      student: updatedStudent
    })

  } catch (error) {
    console.error("Error updating student:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params


    if (!id) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      )
    }

    // Soft delete the student
    const deletedStudent = await prisma.student.update({
      where: { id },
      data: {
        isDeleted: true,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: "Student deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting student:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}