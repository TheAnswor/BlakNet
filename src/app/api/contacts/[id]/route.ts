import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// PATCH /api/contacts/[id] — update contact (owner only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const existing = await db.contact.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Contact not found." }, { status: 404 });
  }
  if (existing.ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, company, position, email, phone, website, notes, category, tags } = body;

  const contact = await db.contact.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(company !== undefined ? { company: company || null } : {}),
      ...(position !== undefined ? { position: position || null } : {}),
      ...(email !== undefined ? { email: email || null } : {}),
      ...(phone !== undefined ? { phone: phone || null } : {}),
      ...(website !== undefined ? { website: website || null } : {}),
      ...(notes !== undefined ? { notes: notes || null } : {}),
      ...(category !== undefined ? { category: category || "Other" } : {}),
      ...(tags !== undefined ? { tags: tags || null } : {}),
    },
  });

  return NextResponse.json({ contact });
}

// DELETE /api/contacts/[id] — delete contact (owner only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const existing = await db.contact.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Contact not found." }, { status: 404 });
  }
  if (existing.ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  await db.contact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
