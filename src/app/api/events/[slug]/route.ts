import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/events/[slug] — single event with attendee count & registration state
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await db.event.findUnique({
    where: { slug },
    include: { _count: { select: { attendees: true } } },
  });
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const user = await getSessionUser();
  let registered = false;
  if (user) {
    const attendee = await db.eventAttendee.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: user.id } },
      select: { id: true },
    });
    registered = !!attendee;
  }

  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
      slug: event.slug,
      description: event.description,
      imageUrl: event.imageUrl,
      category: event.category,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      isOnline: event.isOnline,
      onlineUrl: event.onlineUrl,
      registrationUrl: event.registrationUrl,
      capacity: event.capacity,
      _count: { attendees: event._count.attendees },
      registered,
    },
  });
}
