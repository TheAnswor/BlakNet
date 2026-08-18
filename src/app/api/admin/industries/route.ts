import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

// GET /api/admin/industries — list industries with business counts + sub-industries
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const industries = await db.industry.findMany({
    orderBy: { name: "asc" },
    include: {
      subIndustries: true,
      _count: { select: { businesses: true } },
    },
  });

  return NextResponse.json({
    items: industries.map((i) => ({
      id: i.id,
      name: i.name,
      slug: i.slug,
      icon: i.icon,
      businessCount: i._count.businesses,
      subIndustries: i.subIndustries.map((s) => ({ id: s.id, name: s.name, slug: s.slug })),
    })),
  });
}
