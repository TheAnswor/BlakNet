import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { randomBytes } from "crypto";

const PLAN_SEATS: Record<string, number> = {
  STARTER: 1,
  VERIFIED: 3,
  INTELLIGENCE: 5,
};

// POST /api/businesses/[slug]/invite — invite a user to join a business
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  const biz = await db.business.findUnique({
    where: { slug },
    select: { id: true, name: true, ownerId: true },
  });
  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }
  if (biz.ownerId !== user.id) {
    return NextResponse.json({ error: "Only the business owner can invite users." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { email, role } = body;
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  const normalizedEmail = String(email).toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  // Check plan seat limit (members + pending invites)
  const subscription = await db.subscription.findUnique({ where: { userId: user.id } });
  const plan = user.plan;
  const seatLimit = PLAN_SEATS[plan] ?? 1;

  const [memberCount, pendingInvites] = await Promise.all([
    db.businessMember.count({ where: { businessId: biz.id } }),
    db.businessInvite.count({ where: { businessId: biz.id, status: "PENDING" } }),
  ]);
  const usedSeats = memberCount + pendingInvites;

  if (usedSeats >= seatLimit) {
    return NextResponse.json(
      {
        error: `Your ${plan} plan allows up to ${seatLimit} team member${seatLimit > 1 ? "s" : ""}. Upgrade to add more seats.`,
      },
      { status: 403 },
    );
  }

  // Check if already a member
  const existingMember = await db.businessMember.findFirst({
    where: { businessId: biz.id },
    include: { user: { select: { email: true } } },
  });
  // Find members by email — need to check all members
  const allMembers = await db.businessMember.findMany({
    where: { businessId: biz.id },
    include: { user: { select: { email: true } } },
  });
  if (allMembers.some((m) => m.user.email === normalizedEmail)) {
    return NextResponse.json({ error: "This person is already a team member." }, { status: 400 });
  }

  // Check if there's already a pending invite
  const existingInvite = await db.businessInvite.findFirst({
    where: { businessId: biz.id, email: normalizedEmail, status: "PENDING" },
  });
  if (existingInvite) {
    return NextResponse.json({ error: "An invite has already been sent to this email." }, { status: 400 });
  }

  const token = randomBytes(32).toString("hex");
  const inviteRole = role === "MANAGER" ? "MANAGER" : "STAFF";

  const invite = await db.businessInvite.create({
    data: {
      businessId: biz.id,
      email: normalizedEmail,
      role: inviteRole,
      token,
      invitedBy: user.id,
    },
  });

  // Notify in-app (for the business owner's reference)
  // In production, an email would be sent here with the invite link

  return NextResponse.json({
    invite: {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      token: invite.token,
      createdAt: invite.createdAt,
    },
  }, { status: 201 });
}
