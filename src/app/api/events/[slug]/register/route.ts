import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// POST /api/events/[slug]/register — toggle attendance (auth)
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to register." }, { status: 401 });
  }

  const event = await db.event.findUnique({ where: { slug }, select: { id: true } });
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const existing = await db.eventAttendee.findUnique({
    where: { eventId_userId: { eventId: event.id, userId: user.id } },
  });

  if (existing) {
    await db.eventAttendee.delete({ where: { id: existing.id } });
    return NextResponse.json({ registered: false });
  }

  await db.eventAttendee.create({
    data: { eventId: event.id, userId: user.id, status: "REGISTERED" },
  });
  return NextResponse.json({ registered: true });
}
