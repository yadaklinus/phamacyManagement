// app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

export async function GET(_req: NextRequest) {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalDrugs,
      totalStudents,
      activePhysicians,
      lowStockDrugs,
      expiringBatches,
      todayConsultations,
      todayAdministrations,
      recentMovements,
      recentAdministrations,
      unresolvedAlerts,
      dailyAdministrations,
      topAdministeredDrugs,
    ] = await Promise.all([
      prisma.drug.count({ where: { isActive: true } }),
      prisma.student.count({ where: { isActive: true } }),
      prisma.physician.count({ where: { isActive: true } }),
      prisma.drug.findMany({
        where: { isActive: true, currentStock: { lte: prisma.drug.fields.reorderLevel as any } },
        select: { id: true, name: true, drugCode: true, currentStock: true, reorderLevel: true, unit: true },
        take: 10,
      }),
      prisma.drugBatch.findMany({
        where: { expiryDate: { gt: now, lte: thirtyDaysFromNow } },
        select: { id: true, batchNumber: true, expiryDate: true, currentQuantity: true, drug: { select: { id: true, name: true } } },
        orderBy: { expiryDate: "asc" },
        take: 10,
      }),
      prisma.consultation.count({ where: { createdAt: { gte: today } } }),
      prisma.drugRecord.count({ where: { administeredAt: { gte: today } } }),
      prisma.drugMovement.findMany({ orderBy: { performedAt: "desc" }, take: 20 }),
      prisma.drugRecord.findMany({
        orderBy: { administeredAt: "desc" },
        take: 10,
        include: { student: { select: { name: true, matricNumber: true } }, physician: { select: { name: true } } },
      }),
      prisma.alert.findMany({ where: { isResolved: false }, orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.$queryRawUnsafe<any[]>(
        `SELECT DATE_TRUNC('day', "administeredAt") AS date, COUNT(*)::int AS count
         FROM "DrugRecord"
         WHERE "administeredAt" >= $1
         GROUP BY DATE_TRUNC('day', "administeredAt")
         ORDER BY date ASC`,
        sevenDaysAgo
      ),
      prisma.$queryRawUnsafe<any[]>(
        `SELECT "drugName" AS name, COUNT(*)::int AS count, SUM("quantity")::int AS total
         FROM "DrugRecord"
         GROUP BY "drugName"
         ORDER BY count DESC
         LIMIT 10`
      ),
    ]);

    const dashboard = {
      metrics: {
        totalDrugs,
        totalStudents,
        activePhysicians,
        todayConsultations,
        todayAdministrations,
        lowStockCount: lowStockDrugs.length,
        expiringSoonCount: expiringBatches.length,
      },
      alerts: {
        lowStock: lowStockDrugs.map((d: any) => ({
          id: d.id,
          name: d.name,
          drugCode: d.drugCode,
          quantity: d.currentStock,
          reorderLevel: d.reorderLevel,
          unit: d.unit,
          severity: "high",
        })),
        expiringBatches: expiringBatches.map((b: any) => ({
          id: b.id,
          drugId: b.drug.id,
          drugName: b.drug.name,
          batchNumber: b.batchNumber,
          expiryDate: b.expiryDate,
          currentQuantity: b.currentQuantity,
          daysUntilExpiry: Math.ceil((new Date(b.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          severity: "medium",
        })),
        systemAlerts: unresolvedAlerts,
      },
      liveMovements: recentMovements.map((m: any) => ({
        id: m.id,
        movementNo: m.movementNo,
        drugId: m.drugId,
        drugName: m.drugName,
        type: m.movementType,
        quantity: m.quantity,
        unit: m.unit,
        stockBefore: m.stockBefore,
        stockAfter: m.stockAfter,
        performedBy: m.performedBy,
        performedAt: m.performedAt,
        reason: m.reason,
      })),
      recentAdministrations: recentAdministrations.map((r: any) => ({
        id: r.id,
        recordNo: r.recordNo,
        drugId: r.drugId,
        drugName: r.drugName,
        quantity: r.quantity,
        unit: r.unit,
        student: { name: r.student?.name || null, matricNumber: r.student?.matricNumber || null },
        physicianName: r.physicianName || r.physician?.name || null,
        administeredAt: r.administeredAt,
      })),
      charts: {
        dailyAdministrations: dailyAdministrations.map((d: any) => ({
          date: d.date,
          count: Number(d.count),
        })),
        topAdministeredDrugs: topAdministeredDrugs.map((t: any) => ({
          name: t.name,
          count: Number(t.count),
          total: Number(t.total || 0),
        })),
      },
      quickActions: [
        { key: "review_low_stock", label: "Review Low Stock", count: lowStockDrugs.length },
        { key: "check_expiring", label: "Check Expiring Batches", count: expiringBatches.length },
        { key: "view_alerts", label: "View Alerts", count: unresolvedAlerts.length },
      ],
    };

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error("Admin Dashboard Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}