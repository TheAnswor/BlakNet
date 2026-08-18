import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// POST /api/businesses/[slug]/enquiries — create an enquiry (public, optional auth)
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const biz = await db.business.findUnique({ where: { slug }, select: { id: true, name: true, ownerId: true } });
  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const { name, email, phone, company, message, enquiryType } = body;

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Name, email and message are required." }, { status: 400 });
  }
  if (String(message).length > 2000) {
    return NextResponse.json({ error: "Message is too long (max 2000 characters)." }, { status: 400 });
  }

  const user = await getSessionUser();

  const enquiry = await db.businessEnquiry.create({
    data: {
      businessId: biz.id,
      userId: user?.id ?? null,
      name: String(name).trim().slice(0, 120),
      email: String(email).trim().slice(0, 200),
      phone: phone ? String(phone).trim().slice(0, 30) : null,
      company: company ? String(company).trim().slice(0, 120) : null,
      message: String(message).trim().slice(0, 2000),
      enquiryType: enquiryType || "general",
    },
  });

  // notify the business owner
  await db.notification.create({
    data: {
      userId: biz.ownerId,
      type: "enquiry",
      title: "New business enquiry",
      message: `${name} enquired about ${biz.name}.`,
      link: `#/dashboard-enquiries`,
    },
  });

  return NextResponse.json({ enquiry }, { status: 201 });
}
