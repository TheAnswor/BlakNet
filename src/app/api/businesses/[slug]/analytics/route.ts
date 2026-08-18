import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/businesses/[slug]/analytics — per-business analytics for the owner
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  const biz = await db.business.findUnique({
    where: { slug },
    select: { id: true, ownerId: true, name: true, verificationStatus: true, plan: true, createdAt: true, views: true, profileCompletion: true },
  });
  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }
  if (biz.ownerId !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    totalReviews,
    totalFollowers,
    totalEnquiries,
    newEnquiries30d,
    newEnquiries7d,
    newFollowers30d,
    newReviews30d,
    avgRating,
    recentEnquiries,
    recentFollowers,
    recentReviews,
    postsCount,
    eventsCount,
  ] = await Promise.all([
    db.businessReview.count({ where: { businessId: biz.id, verificationStatus: "APPROVED" } }),
    db.businessFollow.count({ where: { businessId: biz.id } }),
    db.businessEnquiry.count({ where: { businessId: biz.id } }),
    db.businessEnquiry.count({ where: { businessId: biz.id, createdAt: { gte: thirtyDaysAgo } } }),
    db.businessEnquiry.count({ where: { businessId: biz.id, createdAt: { gte: sevenDaysAgo } } }),
    db.businessFollow.count({ where: { businessId: biz.id, createdAt: { gte: thirtyDaysAgo } } }),
    db.businessReview.count({ where: { businessId: biz.id, createdAt: { gte: thirtyDaysAgo }, verificationStatus: "APPROVED" } }),
    db.businessReview.aggregate({
      where: { businessId: biz.id, verificationStatus: "APPROVED" },
      _avg: { rating: true },
    }),
    db.businessEnquiry.findMany({
      where: { businessId: biz.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, company: true, enquiryType: true, status: true, createdAt: true },
    }),
    db.businessFollow.findMany({
      where: { businessId: biz.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    }),
    db.businessReview.findMany({
      where: { businessId: biz.id, verificationStatus: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, reviewerName: true, reviewerCompany: true, rating: true, review: true, createdAt: true },
    }),
    db.post.count({ where: { businessId: biz.id } }),
    db.event.count({ where: { businessId: biz.id } }),
  ]);

  // Build a simple 30-day enquiry trend (count per day)
  const enquiryTrend: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    // We'll fetch counts in a batch below
    enquiryTrend.push({ date: day.toISOString().slice(0, 10), count: 0 });
  }

  // Batch query: enquiries per day for last 30 days
  const enquiriesLast30 = await db.businessEnquiry.findMany({
    where: { businessId: biz.id, createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
  });
  const enquiryByDay = new Map<string, number>();
  for (const e of enquiriesLast30) {
    const d = e.createdAt.toISOString().slice(0, 10);
    enquiryByDay.set(d, (enquiryByDay.get(d) ?? 0) + 1);
  }
  const trend = enquiryTrend.map((t) => ({ ...t, count: enquiryByDay.get(t.date) ?? 0 }));

  return NextResponse.json({
    business: {
      id: biz.id,
      name: biz.name,
      slug,
      verificationStatus: biz.verificationStatus,
      plan: user.plan,
      createdAt: biz.createdAt,
    },
    summary: {
      views: biz.views,
      profileCompletion: biz.profileCompletion,
      totalReviews,
      totalFollowers,
      totalEnquiries,
      postsCount,
      eventsCount,
      avgRating: avgRating._avg.rating ?? 0,
    },
    growth: {
      newEnquiries30d,
      newEnquiries7d,
      newFollowers30d,
      newReviews30d,
    },
    trend, // 30-day enquiry trend
    recentEnquiries,
    recentFollowers: recentFollowers.map((f) => ({
      id: f.id,
      createdAt: f.createdAt,
      user: f.user,
    })),
    recentReviews,
  });
}
