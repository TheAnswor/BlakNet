import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/contacts — list user's CRM contacts
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const items = await db.contact.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    items: items.map((c) => ({
      id: c.id,
      name: c.name,
      company: c.company,
      position: c.position,
      email: c.email,
      phone: c.phone,
      website: c.website,
      notes: c.notes,
      category: c.category,
      tags: c.tags,
      createdAt: c.createdAt,
    })),
  });
}

// POST /api/contacts — create contact (auth)
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { name, company, position, email, phone, website, notes, category, tags } = body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "Contact name is required." }, { status: 400 });
  }

  const contact = await db.contact.create({
    data: {
      ownerId: user.id,
      name: name.trim(),
      company: company || null,
      position: position || null,
      email: email || null,
      phone: phone || null,
      website: website || null,
      notes: notes || null,
      category: category || "Other",
      tags: tags || null,
    },
  });

  return NextResponse.json({ contact }, { status: 201 });
}
