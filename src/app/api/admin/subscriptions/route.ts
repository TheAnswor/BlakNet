import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { qs } from "@/lib/api";

// GET /api/admin/subscriptions — list subscriptions + summary
export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(10, parseInt(url.searchParams.get("pageSize") || "20", 10)));

  const where = { ...(status ? { status } : {}) };
  const [total, items, byPlan, byStatus] = await Promise.all([
    db.subscription.count({ where }),
    db.subscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    }),
    db.subscription.groupBy({ by: ["plan"], _count: { plan: true } }),
    db.subscription.groupBy({ by: ["status"], _count: { status: true } }),
  ]);

  const planCounts = Object.fromEntries(byPlan.map((p) => [p.plan, p._count.plan]));
  const statusCounts = Object.fromEntries(byStatus.map((s) => [s.status, s._count.status]));

  return NextResponse.json({
    total,
    page,
    pageSize,
    pages: Math.ceil(total / pageSize),
    summary: { byPlan: planCounts, byStatus: statusCounts },
    items: items.map((s) => ({
      id: s.id,
      plan: s.plan,
      status: s.status,
      provider: s.provider,
      startDate: s.startDate,
      endDate: s.endDate,
      createdAt: s.createdAt,
      user: s.user,
    })),
  });
}

export { qs };
