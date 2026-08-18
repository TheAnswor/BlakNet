import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/businesses/[slug] — public profile
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const biz = await db.business.findUnique({
    where: { slug },
    include: {
      industry: { select: { id: true, name: true, slug: true, icon: true } },
      services: true,
      products: true,
      reviews: {
        where: { verificationStatus: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 12,
      },
      _count: { select: { reviews: true, posts: true, events: true } },
    },
  });
  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }
  const reviewsAgg = await db.businessReview.aggregate({
    where: { businessId: biz.id, verificationStatus: "APPROVED" },
    _avg: { rating: true },
  });
  const followerCount = await db.businessFollow.count({ where: { businessId: biz.id } });
  const user = await getSessionUser();
  const following = user
    ? !!(await db.businessFollow.findUnique({
        where: { businessId_userId: { businessId: biz.id, userId: user.id } },
      }))
    : false;
  const isOwner = user?.id === biz.ownerId;

  return NextResponse.json({
    business: {
      id: biz.id,
      name: biz.name,
      slug: biz.slug,
      tagline: biz.tagline,
      description: biz.description,
      industry: biz.industry,
      province: biz.province,
      city: biz.city,
      address: biz.address,
      website: biz.website,
      email: biz.email,
      phone: biz.phone,
      whatsapp: biz.whatsapp,
      businessSize: biz.businessSize,
      yearFounded: biz.yearFounded,
      employeeCount: biz.employeeCount,
      annualRevenue: biz.annualRevenue,
      cipcNumber: biz.cipcNumber,
      bbbeeLevel: biz.bbbeeLevel,
      logoUrl: biz.logoUrl,
      coverUrl: biz.coverUrl,
      verificationStatus: biz.verificationStatus,
      featured: biz.featured,
      views: biz.views,
      profileCompletion: biz.profileCompletion,
      services: biz.services,
      products: biz.products,
      reviews: biz.reviews,
      reviewCount: biz._count.reviews,
      rating: reviewsAgg._avg.rating ?? 0,
      postCount: biz._count.posts,
      eventCount: biz._count.events,
      followerCount: biz._count.follows,
      isOwner,
      following,
    },
  });
}
