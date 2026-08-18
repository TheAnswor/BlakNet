import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { qs } from "@/lib/api";

// GET /api/admin/reviews — list reviews for moderation
export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "PENDING";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(10, parseInt(url.searchParams.get("pageSize") || "20", 10)));

  const where = { verificationStatus: status };
  const [total, items] = await Promise.all([
    db.businessReview.count({ where }),
    db.businessReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        business: { select: { id: true, name: true, slug: true, logoUrl: true } },
      },
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pageSize,
    pages: Math.ceil(total / pageSize),
    items: items.map((r) => ({
      id: r.id,
      businessId: r.businessId,
      business: r.business,
      reviewerName: r.reviewerName,
      reviewerCompany: r.reviewerCompany,
      rating: r.rating,
      review: r.review,
      verificationStatus: r.verificationStatus,
      createdAt: r.createdAt,
    })),
  });
}

// PATCH /api/admin/reviews — approve/reject a review
export async function PATCH(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const { id, status } = body;
  if (!id || !status || !["APPROVED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Valid id and status (APPROVED/REJECTED) required." }, { status: 400 });
  }

  const review = await db.businessReview.update({
    where: { id },
    data: { verificationStatus: status },
  });
  return NextResponse.json({ review });
}

export { qs };
