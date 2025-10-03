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
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ drugs: [] })
    }

    const searchTerm = query.trim().toLowerCase()

    const whereClause: any = {
      AND: [
        { isDeleted: false },
        { quantity: { gt: 0 } }, // Only show drugs in stock
        {
          OR: [
            {
              name: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            },
            {
              genericName: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            },
            {
              brandName: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            },
            {
              category: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            }
          ]
        }
      ]
    }

    if (category) {
      whereClause.AND.push({
        category: {
          equals: category,
          mode: 'insensitive'
        }
      })
    }

    const drugs = await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        genericName: true,
        brandName: true,
        category: true,
        manufacturer: true,
        strength: true,
        dosageForm: true,
        retailPrice: true,
        quantity: true,
        reorderLevel: true,
        requiresPrescription: true,
        description: true,
        expiryDate: true,
        batchNumber: true
      },
      take: limit,
      orderBy: [
        { name: 'asc' }
      ]
    })

    const formattedDrugs = drugs.map(drug => ({
      id: drug.id,
      name: drug.name,
      genericName: drug.genericName,
      brandName: drug.brandName,
      category: drug.category,
      manufacturer: drug.manufacturer,
      strength: drug.strength,
      dosageForm: drug.dosageForm,
      unitPrice: drug.retailPrice,
      availableStock: drug.quantity,
      reorderLevel: drug.reorderLevel,
      requiresPrescription: drug.requiresPrescription,
      description: drug.description,
      expiryDate: drug.expiryDate,
      batchNumber: drug.batchNumber,
      isLowStock: drug.quantity <= (drug.reorderLevel || 0),
      isExpiringSoon: drug.expiryDate ? 
        new Date(drug.expiryDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000 : // 30 days
        false
    }))

    return NextResponse.json({ drugs: formattedDrugs })

  } catch (error) {
    console.error("Drug Search API Error:", error)
    return NextResponse.json(
      { error: "Failed to search drugs" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// GET drug categories for filtering
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const categories = await prisma.product.findMany({
      where: {
        isDeleted: false,
        quantity: { gt: 0 }
      },
      select: {
        category: true
      },
      distinct: ['category']
    })

    const uniqueCategories = categories
      .map(item => item.category)
      .filter(category => category && category.trim() !== '')
      .sort()

    return NextResponse.json({ categories: uniqueCategories })

  } catch (error) {
    console.error("Drug Categories API Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch drug categories" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}