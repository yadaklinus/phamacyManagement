import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

// GET /api/drugs - list drugs with pagination, search and filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20", 10), 100);
    const q = (searchParams.get("q") || "").trim();
    const category = (searchParams.get("category") || "").trim();
    const status = (searchParams.get("status") || "").trim(); // in_stock, low_stock, out_of_stock, expiring_soon, expired

    const where: any = { isActive: true };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { genericName: { contains: q, mode: "insensitive" } },
        { brandName: { contains: q, mode: "insensitive" } },
        { drugCode: { contains: q, mode: "insensitive" } },
        { manufacturer: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
      ];
    }
    if (category) where.category = { equals: category, mode: "insensitive" };

    // Status filters derived from stock and expiry
    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (status === "out_of_stock") where.currentStock = 0;
    if (status === "low_stock") where.AND = [
      ...(where.AND || []),
      { currentStock: { gt: 0 } },
      { currentStock: { lte: prisma.drug.fields.reorderLevel as any } },
    ];
    if (status === "in_stock") where.currentStock = { gt: prisma.drug.fields.reorderLevel as any };

    // Expiry is tracked on batches; include drugs with any batch expiring soon/expired
    if (status === "expiring_soon") {
      where.batches = { some: { expiryDate: { gt: now, lte: soon } } };
    }
    if (status === "expired") {
      where.batches = { some: { expiryDate: { lte: now } } };
    }

    const skip = (page - 1) * pageSize;

    const [total, items] = await Promise.all([
      prisma.drug.count({ where }),
      prisma.drug.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: pageSize,
        include: {
          batches: {
            orderBy: { expiryDate: "asc" },
            take: 1,
          },
          alerts: {
            where: { isResolved: false },
            take: 3,
          },
        },
      }),
    ]);

    const data = items.map((d: any) => {
      const nextBatch = d.batches?.[0];
      const expiryDate = nextBatch?.expiryDate ?? null;
      let derivedStatus: string = "in_stock";
      if (expiryDate && expiryDate <= now) derivedStatus = "expired";
      else if (expiryDate && expiryDate <= soon) derivedStatus = "expiring_soon";
      else if (d.currentStock === 0) derivedStatus = "out_of_stock";
      else if (d.currentStock <= (d.reorderLevel || 0)) derivedStatus = "low_stock";

      return {
        id: d.id,
        drugCode: d.drugCode,
        name: d.name,
        genericName: d.genericName,
        brandName: d.brandName,
        category: d.category,
        manufacturer: d.manufacturer,
        unit: d.unit,
        currentStock: d.currentStock,
        reorderLevel: d.reorderLevel,
        currentUnitPrice: d.currentUnitPrice,
        averageCost: d.averageCost,
        nextExpiryDate: expiryDate,
        status: derivedStatus,
        alerts: d.alerts,
        updatedAt: d.updatedAt,
      };
    });

    return NextResponse.json({
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      items: data,
    });
  } catch (error) {
    console.error("GET /api/drugs error", error);
    return NextResponse.json({ error: "Failed to list drugs" }, { status: 500 });
  }
}

// POST /api/drugs - create a new drug
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      drugCode,
      name,
      genericName,
      brandName,
      category,
      manufacturer,
      unit,
      description,
      dosageForm,
      strength,
      requiresPrescription,
      storageConditions,
      reorderLevel,
      currentUnitPrice,
      averageCost,
      initialBatch, // optional: { batchNumber, expiryDate, initialQuantity, unitCost, supplier }
    } = body || {};

    if (!drugCode || !name || !category || !unit) {
      return NextResponse.json({ error: "drugCode, name, category and unit are required" }, { status: 400 });
    }

    const created = await prisma.$transaction(async (tx: any) => {
      const drug = await tx.drug.create({
        data: {
          drugCode,
          name,
          genericName,
          brandName,
          category,
          manufacturer,
          unit,
          description,
          dosageForm,
          strength,
          requiresPrescription: requiresPrescription ?? true,
          storageConditions,
          reorderLevel: reorderLevel ?? 50,
          currentUnitPrice: currentUnitPrice ?? 0,
          averageCost: averageCost ?? 0,
        },
      });

      // Optionally create an initial batch and a movement
      if (initialBatch?.batchNumber && initialBatch?.initialQuantity > 0) {
        const batch = await tx.drugBatch.create({
          data: {
            drugId: drug.id,
            batchNumber: initialBatch.batchNumber,
            expiryDate: initialBatch.expiryDate ? new Date(initialBatch.expiryDate) : new Date(),
            manufactureDate: undefined,
            supplier: initialBatch.supplier || "Unknown",
            initialQuantity: initialBatch.initialQuantity,
            currentQuantity: initialBatch.initialQuantity,
            administeredQuantity: 0,
            unitCost: initialBatch.unitCost ?? 0,
            totalCost: (initialBatch.unitCost ?? 0) * initialBatch.initialQuantity,
            receivedBy: "system",
          },
        });

        const newStock = (drug.currentStock ?? 0) + initialBatch.initialQuantity;
        await tx.drug.update({ where: { id: drug.id }, data: { currentStock: newStock, totalPurchased: { increment: initialBatch.initialQuantity } } });

        await tx.drugMovement.create({
          data: {
            drugId: drug.id,
            drugName: drug.name,
            movementNo: `MOV-${Date.now()}`,
            movementType: "PURCHASE",
            quantity: initialBatch.initialQuantity,
            unit: drug.unit,
            stockBefore: 0,
            stockAfter: newStock,
            unitCost: initialBatch.unitCost ?? 0,
            totalValue: (initialBatch.unitCost ?? 0) * initialBatch.initialQuantity,
            reason: `Initial stock via batch ${batch.batchNumber}`,
            referenceType: "purchase",
            referenceNo: batch.batchNumber,
            performedBy: "system",
            performedById: "system",
          },
        });
      }

      return drug;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/drugs error", error);
    return NextResponse.json({ error: error?.message || "Failed to create drug" }, { status: 500 });
  }
}

