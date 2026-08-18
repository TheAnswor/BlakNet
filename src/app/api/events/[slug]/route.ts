import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET /api/events/[slug] — single event with attendee count & registration state
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await db.event.findUnique({
    where: { slug },
    include: {
      _count: { select: { attendees: true } },
      organizer: { select: { id: true, firstName: true, lastName: true } },
      business: { select: { id: true, name: true, slug: true, logoUrl: true } },
    },
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
      organizer: event.organizer,
      business: event.business,
      isOwner: user?.id === event.organizerId,
      _count: { attendees: event._count.attendees },
      registered,
    },
  });
}

// PATCH /api/events/[slug] — update an event (organizer or admin only)
export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  const event = await db.event.findUnique({ where: { slug }, select: { id: true, organizerId: true, slug: true } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  if (event.organizerId !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "You don't have permission to edit this event." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    title,
    description,
    category,
    startDate,
    endDate,
    location,
    isOnline,
    onlineUrl,
    registrationUrl,
    capacity,
    imageUrl,
  } = body;

  const data: Record<string, unknown> = {};
  if (title !== undefined) {
    data.title = String(title).trim();
    const newSlug = slugify(String(title));
    if (newSlug && newSlug !== event.slug) {
      const clash = await db.event.findUnique({ where: { slug: newSlug } });
      if (!clash || clash.id === event.id) data.slug = newSlug;
    }
  }
  if (description !== undefined) data.description = String(description).trim();
  if (category !== undefined) data.category = String(category);
  if (startDate !== undefined) data.startDate = new Date(startDate);
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
  if (location !== undefined) data.location = location?.trim() || null;
  if (isOnline !== undefined) data.isOnline = !!isOnline;
  if (onlineUrl !== undefined) data.onlineUrl = onlineUrl?.trim() || null;
  if (registrationUrl !== undefined) data.registrationUrl = registrationUrl?.trim() || null;
  if (capacity !== undefined) data.capacity = capacity ? Number(capacity) : null;
  if (imageUrl !== undefined) data.imageUrl = imageUrl || null;

  const updated = await db.event.update({ where: { id: event.id }, data });
  return NextResponse.json({ event: updated });
}

// DELETE /api/events/[slug] — delete an event (organizer or admin only)
export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  const event = await db.event.findUnique({ where: { slug }, select: { id: true, organizerId: true } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  if (event.organizerId !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "You don't have permission to delete this event." }, { status: 403 });
  }
  await db.event.delete({ where: { id: event.id } });
  return NextResponse.json({ ok: true });
}
