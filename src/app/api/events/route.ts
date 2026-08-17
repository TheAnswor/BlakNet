import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/events — list events (optional category & upcoming filters)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") || "";
  const upcoming = url.searchParams.get("upcoming") === "1";
  const now = new Date();

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (upcoming) where.startDate = { gte: now };

  const items = await db.event.findMany({
    where,
    orderBy: { startDate: "asc" },
    include: {
      _count: { select: { attendees: true } },
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
      _count: { attendees: e._count.attendees },
    })),
  });
}
