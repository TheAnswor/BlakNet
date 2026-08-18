import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/businesses/followed — list businesses the current user follows
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ items: [] });
  }
  const follows = await db.businessFollow.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      business: {
        select: {
          id: true, name: true, slug: true, tagline: true, logoUrl: true,
          verificationStatus: true, bbbeeLevel: true, province: true, city: true,
          industry: { select: { id: true, name: true, slug: true, icon: true } },
        },
      },
    },
  });
  return NextResponse.json({
    items: follows.map((f) => ({
      id: f.business.id,
      name: f.business.name,
      slug: f.business.slug,
      tagline: f.business.tagline,
      logoUrl: f.business.logoUrl,
      verificationStatus: f.business.verificationStatus,
      bbbeeLevel: f.business.bbbeeLevel,
      province: f.business.province,
      city: f.business.city,
      industry: f.business.industry,
      followedAt: f.createdAt,
    })),
  });
}
