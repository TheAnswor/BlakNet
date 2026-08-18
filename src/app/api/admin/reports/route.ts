import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

// GET /api/admin/reports — platform analytics for the admin Reports view
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    totalUsers,
    totalBusinesses,
    verifiedBusinesses,
    totalEvents,
    totalPosts,
    totalResources,
    totalEnquiries,
    activeSubscriptions,
    // growth: new users in last 30 days vs previous 30
    newUsers30d,
    newBusinesses30d,
    newPosts30d,
    newEnquiries30d,
    // top businesses by views
    topBusinessesByViews,
    topBusinessesByFollowers,
    // plan distribution
    planDistribution,
    // verification distribution
    verificationDistribution,
    // recent activity (last 10 events across platform)
    recentRegistrations,
  ] = await Promise.all([
    db.user.count(),
    db.business.count(),
    db.business.count({ where: { verificationStatus: "VERIFIED" } }),
    db.event.count(),
    db.post.count(),
    db.resource.count(),
    db.businessEnquiry.count(),
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.business.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.post.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.businessEnquiry.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.business.findMany({
      orderBy: { views: "desc" },
      take: 5,
      select: { id: true, name: true, slug: true, logoUrl: true, views: true, industry: { select: { name: true } } },
    }),
    db.businessFollow.groupBy({
      by: ["businessId"],
      _count: { businessId: true },
      orderBy: { _count: { businessId: "desc" } },
      take: 5,
    }),
    db.subscription.groupBy({ by: ["plan"], _count: { plan: true } }),
    db.business.groupBy({ by: ["verificationStatus"], _count: { verificationStatus: true } }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, email: true, firstName: true, lastName: true, createdAt: true, plan: true },
    }),
  ]);

  // resolve top-by-followers business names
  const topFollowerBizIds = topBusinessesByFollowers.map((t) => t.businessId);
  const followerBizNames = topFollowerBizIds.length
    ? await db.business.findMany({
        where: { id: { in: topFollowerBizIds } },
        select: { id: true, name: true, slug: true, logoUrl: true, industry: { select: { name: true } } },
      })
    : [];
  const followerNameMap = new Map(followerBizNames.map((b) => [b.id, b]));
  const topBusinessesByFollowersNamed = topBusinessesByFollowers.map((t) => ({
    ...followerNameMap.get(t.businessId),
    followerCount: t._count.businessId,
  }));

  return NextResponse.json({
    summary: {
      totalUsers,
      totalBusinesses,
      verifiedBusinesses,
      totalEvents,
      totalPosts,
      totalResources,
      totalEnquiries,
      activeSubscriptions,
    },
    growth: {
      newUsers30d,
      newBusinesses30d,
      newPosts30d,
      newEnquiries30d,
    },
    topBusinessesByViews: topBusinessesByViews.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logoUrl: b.logoUrl,
      views: b.views,
      industry: b.industry?.name ?? null,
    })),
    topBusinessesByFollowers: topBusinessesByFollowersNamed.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logoUrl: b.logoUrl,
      followerCount: b.followerCount,
      industry: b.industry?.name ?? null,
    })),
    planDistribution: Object.fromEntries(
      planDistribution.map((p) => [p.plan, p._count.plan]),
    ),
    verificationDistribution: Object.fromEntries(
      verificationDistribution.map((v) => [v.verificationStatus, v._count.verificationStatus]),
    ),
    recentRegistrations,
  });
}
