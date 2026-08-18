import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getSessionUser, hashPassword } from "@/lib/auth";

// POST /api/auth/password — change the current user's password
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { current, next } = body;

  if (!current || !next) {
    return NextResponse.json({ error: "Current and new passwords are required." }, { status: 400 });
  }
  if (typeof next !== "string" || next.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
  }
  if (next.length > 128) {
    return NextResponse.json({ error: "Password is too long." }, { status: 400 });
  }

  const full = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!full || !full.passwordHash) {
    return NextResponse.json({ error: "Account has no password set." }, { status: 400 });
  }

  if (hashPassword(current) !== full.passwordHash) {
    return NextResponse.json({ error: "Your current password is incorrect." }, { status: 403 });
  }

  if (hashPassword(next) === full.passwordHash) {
    return NextResponse.json({ error: "Choose a password different from your current one." }, { status: 400 });
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(next) },
  });

  // invalidate all other sessions for security (keep the current one)
  const cookieToken = (await cookies()).get("blaknet_session")?.value;
  if (cookieToken) {
    await db.session.deleteMany({
      where: { userId: user.id, NOT: { token: cookieToken } },
    });
  }

  return NextResponse.json({ ok: true });
}
