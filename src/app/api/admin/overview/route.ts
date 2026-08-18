import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

// GET /api/admin/overview — admin dashboard summary
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!ADMIN_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const [
    users,
    businesses,
    verifiedBusinesses,
    pendingVerifications,
    activeSubscriptions,
    posts,
    events,
    recentRegistrations,
  ] = await Promise.all([
    db.user.count(),
    db.business.count(),
    db.business.count({ where: { verificationStatus: "VERIFIED" } }),
    db.verificationRequest.count({ where: { status: "PENDING" } }),
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.post.count(),
    db.event.count(),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    users,
    businesses,
    verifiedBusinesses,
    pendingVerifications,
    activeSubscriptions,
    posts,
    events,
    recentRegistrations,
  });
}
