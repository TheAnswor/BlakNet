import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// POST /api/notifications/read — mark single (body.id) or all read
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : null;

  if (id) {
    const notif = await db.notification.findUnique({ where: { id }, select: { id: true, userId: true } });
    if (!notif) {
      return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    }
    if (notif.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    await db.notification.update({ where: { id }, data: { read: true } });
    return NextResponse.json({ ok: true });
  }

  await db.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  return NextResponse.json({ ok: true });
}
