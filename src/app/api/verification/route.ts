import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// POST /api/verification — submit a business verification request (owner only)
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { businessId, verificationType, notes, documentUrl } = body;
  if (!businessId || typeof businessId !== "string") {
    return NextResponse.json({ error: "businessId is required." }, { status: 400 });
  }
  if (!verificationType || typeof verificationType !== "string") {
    return NextResponse.json({ error: "verificationType is required." }, { status: 400 });
  }

  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { id: true, ownerId: true },
  });
  if (!business) {
    return NextResponse.json({ error: "Business not found." }, { status: 404 });
  }
  if (business.ownerId !== user.id) {
    return NextResponse.json({ error: "You can only request verification for your own business." }, { status: 403 });
  }

  const request = await db.verificationRequest.create({
    data: {
      businessId: business.id,
      userId: user.id,
      verificationType,
      documentUrl: documentUrl || null,
      notes: notes || null,
      status: "PENDING",
    },
  });

  await db.business.update({
    where: { id: business.id },
    data: { verificationStatus: "PENDING" },
  });

  return NextResponse.json({ request }, { status: 201 });
}
