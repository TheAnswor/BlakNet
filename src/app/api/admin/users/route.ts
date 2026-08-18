import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { qs } from "@/lib/api";

// GET /api/admin/users — list users with search + pagination
export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const role = url.searchParams.get("role") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(10, parseInt(url.searchParams.get("pageSize") || "20", 10)));

  const where = {
    AND: [
      ...(role ? [{ role }] : []),
      ...(q
        ? [
            {
              OR: [
                { email: { contains: q } },
                { firstName: { contains: q } },
                { lastName: { contains: q } },
              ],
            },
          ]
        : []),
    ],
  };

  const [total, items] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        plan: true,
        phone: true,
        createdAt: true,
      },
    }),
  ]);

  // business counts per user
  const userIds = items.map((i) => i.id);
  const bizCounts = await db.business.groupBy({
    by: ["ownerId"],
    where: { ownerId: { in: userIds } },
    _count: { ownerId: true },
  });
  const countMap = new Map(bizCounts.map((b) => [b.ownerId, b._count.ownerId]));

  return NextResponse.json({
    total,
    page,
    pageSize,
    pages: Math.ceil(total / pageSize),
    items: items.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      plan: u.plan,
      phone: u.phone,
      createdAt: u.createdAt,
      businessCount: countMap.get(u.id) ?? 0,
    })),
  });
}

export { qs };
