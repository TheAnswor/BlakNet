import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/businesses/[slug]/members — list team members + pending invites
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  const biz = await db.business.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });
  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }
  if (biz.ownerId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the business owner can view team members." }, { status: 403 });
  }

  const [members, invites] = await Promise.all([
    db.businessMember.findMany({
      where: { businessId: biz.id },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, profileImage: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.businessInvite.findMany({
      where: { businessId: biz.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      role: m.role,
      user: m.user,
      isOwner: m.role === "OWNER",
      createdAt: m.createdAt,
    })),
    invites: invites.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      status: i.status,
      createdAt: i.createdAt,
    })),
  });
}

// DELETE /api/businesses/[slug]/members — remove a team member
export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  const biz = await db.business.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });
  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }
  if (biz.ownerId !== user.id) {
    return NextResponse.json({ error: "Only the business owner can remove members." }, { status: 403 });
  }

  const url = new URL(req.url);
  const memberId = url.searchParams.get("memberId");
  const inviteId = url.searchParams.get("inviteId");

  if (memberId) {
    const member = await db.businessMember.findUnique({ where: { id: memberId } });
    if (!member || member.businessId !== biz.id) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    if (member.role === "OWNER") {
      return NextResponse.json({ error: "Cannot remove the business owner." }, { status: 403 });
    }
    await db.businessMember.delete({ where: { id: memberId } });
    return NextResponse.json({ ok: true });
  }

  if (inviteId) {
    await db.businessInvite.update({
      where: { id: inviteId },
      data: { status: "REVOKED" },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "memberId or inviteId required." }, { status: 400 });
}
