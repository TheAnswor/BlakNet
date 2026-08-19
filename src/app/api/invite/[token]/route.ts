import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, registerUser, loginUser } from "@/lib/auth";

// GET /api/invite/[token] — validate an invite token
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await db.businessInvite.findUnique({
    where: { token },
    include: {
      business: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!invite) {
    return NextResponse.json({ error: "Invalid invite token" }, { status: 404 });
  }
  if (invite.status === "ACCEPTED") {
    return NextResponse.json({ error: "This invite has already been accepted." }, { status: 400 });
  }
  if (invite.status === "REVOKED") {
    return NextResponse.json({ error: "This invite has been revoked." }, { status: 400 });
  }

  // Check if the invited email already has an account
  const existingUser = await db.user.findUnique({ where: { email: invite.email } });
  const hasAccount = !!existingUser;

  return NextResponse.json({
    invite: {
      email: invite.email,
      role: invite.role,
      business: invite.business,
      hasAccount,
    },
  });
}

// POST /api/invite/[token] — accept the invite (register or just link existing account)
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await db.businessInvite.findUnique({
    where: { token },
    include: {
      business: { select: { id: true, name: true, slug: true, ownerId: true } },
    },
  });
  if (!invite) {
    return NextResponse.json({ error: "Invalid invite token" }, { status: 404 });
  }
  if (invite.status !== "PENDING") {
    return NextResponse.json({ error: "This invite is no longer valid." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { firstName, lastName, password } = body;

  // Check if the user already exists with this email
  let user = await db.user.findUnique({ where: { email: invite.email } });

  if (!user) {
    // New user — must register
    if (!firstName || !password) {
      return NextResponse.json({ error: "First name and password are required to create your account." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    const result = await registerUser({
      email: invite.email,
      password,
      firstName: String(firstName).trim(),
      lastName: lastName ? String(lastName).trim() : undefined,
    });
    if (!result.ok || !result.user) {
      return NextResponse.json({ error: result.error ?? "Could not create account." }, { status: 400 });
    }
    user = result.user;
    // Log them in
    await loginUser(invite.email, password);
  } else {
    // Existing user — just verify they're logged in (or log them in)
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.id !== user.id) {
      // They need to log in first
      return NextResponse.json({
        error: "Please log in with " + invite.email + " to accept this invite.",
        needLogin: true,
      }, { status: 401 });
    }
  }

  // Add as business member
  await db.businessMember.create({
    data: {
      businessId: invite.business.id,
      userId: user.id,
      role: invite.role,
    },
  });

  // Mark invite as accepted
  await db.businessInvite.update({
    where: { id: invite.id },
    data: {
      status: "ACCEPTED",
      acceptedBy: user.id,
      acceptedAt: new Date(),
    },
  });

  // Notify the business owner
  await db.notification.create({
    data: {
      userId: invite.business.ownerId,
      type: "connection",
      title: "Invite accepted",
      message: `${user.firstName ?? user.email} accepted your invitation to join ${invite.business.name}.`,
      link: `#/dashboard-businesses`,
    },
  });

  return NextResponse.json({
    ok: true,
    businessSlug: invite.business.slug,
    businessName: invite.business.name,
  });
}
