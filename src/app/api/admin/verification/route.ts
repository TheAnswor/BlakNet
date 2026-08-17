import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);
const VALID_STATUSES = new Set(["APPROVED", "REJECTED", "INFO_REQUESTED"]);

// GET /api/admin/verification — list pending verification requests
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!ADMIN_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const items = await db.verificationRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      business: { select: { id: true, name: true, slug: true, logoUrl: true, ownerId: true } },
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  return NextResponse.json({ items });
}

// PATCH /api/admin/verification — approve/reject/info request
export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!ADMIN_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { id, status, adminNotes } = body;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Request id is required." }, { status: 400 });
  }
  if (!status || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const existing = await db.verificationRequest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Verification request not found." }, { status: 404 });
  }

  const updated = await db.verificationRequest.update({
    where: { id },
    data: {
      status,
      adminNotes: adminNotes ?? existing.adminNotes,
      reviewedAt: new Date(),
    },
    include: {
      business: { select: { id: true, name: true, slug: true, logoUrl: true, ownerId: true } },
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  if (status === "APPROVED") {
    await db.business.update({
      where: { id: existing.businessId },
      data: { verificationStatus: "VERIFIED" },
    });
  } else if (status === "REJECTED") {
    await db.business.update({
      where: { id: existing.businessId },
      data: { verificationStatus: "REJECTED" },
    });
  }

  return NextResponse.json({ request: updated });
}
