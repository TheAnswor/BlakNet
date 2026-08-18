import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/enquiries — list enquiries for the current user's businesses
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ items: [] });
  }
  // find all businesses owned by the user
  const businesses = await db.business.findMany({
    where: { ownerId: user.id },
    select: { id: true },
  });
  const businessIds = businesses.map((b) => b.id);
  if (businessIds.length === 0) {
    return NextResponse.json({ items: [], stats: { total: 0, new: 0 } });
  }

  const [items, total, newCount] = await Promise.all([
    db.businessEnquiry.findMany({
      where: { businessId: { in: businessIds } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        business: { select: { id: true, name: true, slug: true, logoUrl: true } },
      },
    }),
    db.businessEnquiry.count({ where: { businessId: { in: businessIds } } }),
    db.businessEnquiry.count({ where: { businessId: { in: businessIds }, status: "new" } }),
  ]);

  return NextResponse.json({
    items: items.map((e) => ({
      id: e.id,
      businessId: e.businessId,
      business: e.business,
      name: e.name,
      email: e.email,
      phone: e.phone,
      company: e.company,
      message: e.message,
      enquiryType: e.enquiryType,
      status: e.status,
      createdAt: e.createdAt,
    })),
    stats: { total, new: newCount },
  });
}

// PATCH /api/enquiries — update enquiry status (mark read/responded/archived)
export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { id, status } = body;
  if (!id || !status || !["new", "read", "responded", "archived"].includes(status)) {
    return NextResponse.json({ error: "Valid id and status required." }, { status: 400 });
  }

  // verify ownership
  const enquiry = await db.businessEnquiry.findUnique({
    where: { id },
    include: { business: { select: { ownerId: true } } },
  });
  if (!enquiry) {
    return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
  }
  if (enquiry.business.ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await db.businessEnquiry.update({ where: { id }, data: { status } });
  return NextResponse.json({ enquiry: updated });
}
