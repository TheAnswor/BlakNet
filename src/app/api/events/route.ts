import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET /api/events — list events (optional category & upcoming & owner filters)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") || "";
  const upcoming = url.searchParams.get("upcoming") === "1";
  const ownerOnly = url.searchParams.get("owner") === "1";
  const now = new Date();

  const user = await getSessionUser();

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (upcoming) where.startDate = { gte: now };
  if (ownerOnly && user) where.organizerId = user.id;

  const items = await db.event.findMany({
    where,
    orderBy: { startDate: "asc" },
    include: {
      _count: { select: { attendees: true } },
      organizer: { select: { id: true, firstName: true, lastName: true } },
      business: { select: { id: true, name: true, slug: true, logoUrl: true } },
    },
  });

  return NextResponse.json({
    items: items.map((e) => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      description: e.description,
      imageUrl: e.imageUrl,
      category: e.category,
      startDate: e.startDate,
      endDate: e.endDate,
      location: e.location,
      isOnline: e.isOnline,
      onlineUrl: e.onlineUrl,
      registrationUrl: e.registrationUrl,
      capacity: e.capacity,
      organizer: e.organizer,
      business: e.business,
      _count: { attendees: e._count.attendees },
    })),
  });
}

// POST /api/events — create an event (auth required)
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to create an event." }, { status: 401 });
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
    businessId,
  } = body;

  if (!title || !description || !category || !startDate) {
    return NextResponse.json(
      { error: "Title, description, category and start date are required." },
      { status: 400 },
    );
  }

  // unique slug
  let slug = slugify(title);
  const exists = await db.event.findUnique({ where: { slug } });
  if (exists) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  // validate businessId if provided (must be owned by user)
  if (businessId) {
    const biz = await db.business.findUnique({ where: { id: businessId }, select: { ownerId: true } });
    if (!biz || biz.ownerId !== user.id) {
      return NextResponse.json({ error: "Invalid business." }, { status: 403 });
    }
  }

  const event = await db.event.create({
    data: {
      organizerId: user.id,
      businessId: businessId || null,
      title: String(title).trim(),
      slug,
      description: String(description).trim(),
      imageUrl: imageUrl || null,
      category: String(category),
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      location: location?.trim() || null,
      isOnline: !!isOnline,
      onlineUrl: onlineUrl?.trim() || null,
      registrationUrl: registrationUrl?.trim() || null,
      capacity: capacity ? Number(capacity) : null,
    },
  });

  return NextResponse.json({ event }, { status: 201 });
}
