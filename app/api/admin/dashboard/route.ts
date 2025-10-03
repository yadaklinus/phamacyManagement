// app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/prisma/generated/database";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Get current date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Parallel data fetching for better performance
    const [
      totalStudents,
      activePhysicians,
      pendingPrescriptions,
      lowStockProducts,
      todayConsultations,
      todayDispensals,
      expiringDrugs,
      recentActivities,
      dailyConsultations,
      topPrescribedDrugs,
      diseaseDistribution,
      departmentVisits,
      queueCount,
      recentStudents,
      recentConsultations,
    ] = await Promise.all([
      // Total Students
      prisma.student.count({ where: { isDeleted: false, isActive: true } }),

      // Active Physicians
      prisma.physician.count({ where: { isDeleted: false, isActive: true } }),

      // Pending Prescriptions
      prisma.prescription.count({
        where: { isDeleted: false, status: "pending" },
      }),

      // Low Stock Products (below reorder level)
      prisma.product.findMany({
        where: {
          isDeleted: false,
          quantity: { lte: prisma.product.fields.reorderLevel },
          reorderLevel: { not: null },
        },
        select: {
          id: true,
          name: true,
          quantity: true,
          reorderLevel: true,
          unit: true,
        },
        take: 10,
      }),

      // Today's Consultations
      prisma.consultation.count({
        where: {
          isDeleted: false,
          createdAt: { gte: today },
        },
      }),

      // Today's Drug Dispensals
      prisma.drugDispensal.count({
        where: {
          isDeleted: false,
          createdAt: { gte: today },
        },
      }),

      // Drugs expiring in 30 days
      prisma.product.findMany({
        where: {
          isDeleted: false,
          expiryDate: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
        select: {
          id: true,
          name: true,
          expiryDate: true,
          quantity: true,
          batchNumber: true,
        },
        take: 10,
      }),

      // Recent Activities (mix of consultations, prescriptions, dispensals)
      prisma.consultation.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          consultationNo: true,
          createdAt: true,
          status: true,
          student: { select: { firstName: true, lastName: true } },
          physician: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // Daily Consultations (last 7 days)
      prisma.$queryRaw`
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as count
        FROM Consultation
        WHERE isDeleted = 0 
          AND createdAt >= ${sevenDaysAgo.toISOString()}
        GROUP BY DATE(createdAt)
        ORDER BY date ASC
      `,

      // Top 10 Prescribed Drugs
      prisma.$queryRaw`
        SELECT 
          pi.drugName as name,
          COUNT(*) as prescriptionCount,
          SUM(pi.quantityDispensed) as totalDispensed
        FROM PrescriptionItem pi
        INNER JOIN Prescription p ON pi.prescriptionId = p.prescriptionNo
        WHERE pi.isDeleted = 0 AND p.isDeleted = 0
        GROUP BY pi.drugName
        ORDER BY prescriptionCount DESC
        LIMIT 10
      `,

      // Disease Distribution (from diagnosis)
      prisma.$queryRaw`
        SELECT 
          diagnosis,
          COUNT(*) as count
        FROM Consultation
        WHERE isDeleted = 0 
          AND diagnosis IS NOT NULL 
          AND diagnosis != ''
        GROUP BY diagnosis
        ORDER BY count DESC
        LIMIT 10
      `,

      // Department-wise visits
      prisma.$queryRaw`
        SELECT 
          s.department,
          COUNT(c.id) as visitCount
        FROM Student s
        LEFT JOIN Consultation c ON s.id = c.studentId AND c.isDeleted = 0
        WHERE s.isDeleted = 0
        GROUP BY s.department
        ORDER BY visitCount DESC
        LIMIT 10
      `,

      // Current Queue Count
      prisma.queue.count({
        where: {
          isDeleted: false,
          status: { in: ["waiting", "called"] },
        },
      }),

      // Recent Students (last 5)
      prisma.student.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          matricNumber: true,
          firstName: true,
          lastName: true,
          department: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // Recent Consultations with details
      prisma.consultation.findMany({
        where: { isDeleted: false },
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
              matricNumber: true,
              department: true,
            },
          },
          physician: {
            select: {
              firstName: true,
              lastName: true,
              specialization: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    // Format the response
    const dashboard = {
      metrics: {
        totalStudents,
        activePhysicians,
        pendingPrescriptions,
        lowStockCount: lowStockProducts.length,
        todayConsultations,
        todayDispensals,
        expiringDrugsCount: expiringDrugs.length,
        queueCount,
      },
      alerts: {
        lowStock: lowStockProducts.map((p:any) => ({
          id: p.id,
          name: p.name,
          quantity: p.quantity,
          reorderLevel: p.reorderLevel,
          unit: p.unit,
          severity: "high",
        })),
        expiringDrugs: expiringDrugs.map((d:any) => ({
          id: d.id,
          name: d.name,
          expiryDate: d.expiryDate,
          quantity: d.quantity,
          batchNumber: d.batchNumber,
          daysUntilExpiry: Math.ceil(
            (new Date(d.expiryDate!).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          ),
          severity:
            Math.ceil(
              (new Date(d.expiryDate!).getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24)
            ) <= 7
              ? "high"
              : "medium",
        })),
      },
      charts: {
        dailyConsultations: (dailyConsultations as any[]).map((d) => ({
          date: new Date(d.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          count: Number(d.count),
        })),
        topPrescribedDrugs: (topPrescribedDrugs as any[]).map((d) => ({
          name: d.name,
          count: Number(d.prescriptionCount),
          dispensed: Number(d.totalDispensed || 0),
        })),
        diseaseDistribution: (diseaseDistribution as any[]).map(
          (d, index) => ({
            name: d.diagnosis,
            value: Number(d.count),
            color: [
              "#3b82f6",
              "#10b981",
              "#f59e0b",
              "#ef4444",
              "#8b5cf6",
              "#ec4899",
              "#14b8a6",
              "#f97316",
              "#06b6d4",
              "#84cc16",
            ][index % 10],
          })
        ),
        departmentVisits: (departmentVisits as any[]).map((d) => ({
          department: d.department,
          visits: Number(d.visitCount),
        })),
      },
      recentActivities: recentActivities.map((activity:any) => ({
        id: activity.id,
        type: "consultation",
        title: `Consultation ${activity.consultationNo}`,
        description: `${activity.student.firstName} ${activity.student.lastName} consulted with Dr. ${activity.physician.firstName} ${activity.physician.lastName}`,
        timestamp: activity.createdAt,
        status: activity.status,
      })),
      recentStudents,
      recentConsultations: recentConsultations.map((c:any) => ({
        id: c.id,
        consultationNo: c.consultationNo,
        student: `${c.student.firstName} ${c.student.lastName}`,
        studentMatric: c.student.matricNumber,
        department: c.student.department,
        physician: `Dr. ${c.physician.firstName} ${c.physician.lastName}`,
        specialization: c.physician.specialization,
        diagnosis: c.diagnosis,
        status: c.status,
        priority: c.priority,
        createdAt: c.createdAt,
      })),
    };

    return NextResponse.json(dashboard, { status: 200 });
  } catch (error) {
    console.error("Admin Dashboard Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data", details: error },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}