import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

// GET /api/drugs/[id] - get a drug with batches, alerts and movement summary
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const drug = await prisma.drug.findUnique({
      where: { id },
      include: {
        batches: { orderBy: { expiryDate: "asc" } },
        alerts: { orderBy: { createdAt: "desc" }, take: 20 },
        drugMovements: { orderBy: { performedAt: "desc" }, take: 100 },
        drugRecords: { orderBy: { administeredAt: "desc" }, take: 50, include: { student: true, physician: true, consultation: true } },
      },
    });
    if (!drug) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(drug);
  } catch (error) {
    console.error("GET /api/drugs/[id] error", error);
    return NextResponse.json({ error: "Failed to fetch drug" }, { status: 500 });
  }
}

// PUT /api/drugs/[id] - update drug basic fields
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const data = await req.json();
    const allowed = [
      "name","genericName","brandName","category","manufacturer","unit","description","dosageForm","strength","requiresPrescription","storageConditions","reorderLevel","currentUnitPrice","averageCost","isActive","maxStockLevel"
    ];
    const updateData: Record<string, any> = {};
    for (const key of allowed) if (key in data) updateData[key] = data[key];
    const updated = await prisma.drug.update({ where: { id }, data: updateData });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/drugs/[id] error", error);
    return NextResponse.json({ error: error?.message || "Failed to update drug" }, { status: 500 });
  }
}

// DELETE /api/drugs/[id] - soft deactivate
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const updated = await prisma.drug.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("DELETE /api/drugs/[id] error", error);
    return NextResponse.json({ error: "Failed to delete drug" }, { status: 500 });
  }
}

