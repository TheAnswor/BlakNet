import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// POST /api/businesses/[slug]/reviews — create review (auth)
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to leave a review." }, { status: 401 });
  }
  const biz = await db.business.findUnique({ where: { slug } });
  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const { rating, review, reviewerName, reviewerCompany } = body;
  if (!rating || !review) {
    return NextResponse.json({ error: "Rating and review are required." }, { status: 400 });
  }
  const created = await db.businessReview.create({
    data: {
      businessId: biz.id,
      reviewerId: user.id,
      reviewerName: reviewerName || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email,
      reviewerCompany: reviewerCompany || null,
      rating: Math.max(1, Math.min(5, Number(rating))),
      review,
      verificationStatus: "APPROVED",
    },
  });
  return NextResponse.json({ review: created }, { status: 201 });
}
