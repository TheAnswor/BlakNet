import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const items = await db.business.findMany({
    where: { featured: true },
    orderBy: [{ verificationStatus: "desc" }, { views: "desc" }],
    take: 6,
    include: {
      industry: { select: { id: true, name: true, slug: true, icon: true } },
      services: true,
    },
  });
  const reviewsAgg = await db.businessReview.groupBy({
    by: ["businessId"],
    where: { businessId: { in: items.map((i) => i.id) }, verificationStatus: "APPROVED" },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const ratingMap = new Map(reviewsAgg.map((r) => [r.businessId, { avg: r._avg.rating ?? 0, count: r._count.rating }]));
  return NextResponse.json({
    items: items.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      tagline: b.tagline,
      industry: b.industry,
      province: b.province,
      city: b.city,
      logoUrl: b.logoUrl,
      verificationStatus: b.verificationStatus,
      featured: b.featured,
      views: b.views,
      bbbeeLevel: b.bbbeeLevel,
      services: b.services,
      rating: ratingMap.get(b.id)?.avg ?? 0,
      reviewCount: ratingMap.get(b.id)?.count ?? 0,
    })),
  });
}
