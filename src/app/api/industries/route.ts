import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const industries = await db.industry.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { businesses: true } } },
  });
  return NextResponse.json({
    industries: industries.map((i) => ({
      id: i.id,
      name: i.name,
      slug: i.slug,
      icon: i.icon,
      count: i._count.businesses,
    })),
  });
}
