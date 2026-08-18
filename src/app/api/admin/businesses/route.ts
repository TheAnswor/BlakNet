import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { qs } from "@/lib/api";

// GET /api/admin/businesses — list all businesses with search + filter
export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const verification = url.searchParams.get("verification") || "";
  const featured = url.searchParams.get("featured");
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(10, parseInt(url.searchParams.get("pageSize") || "20", 10)));

  const where = {
    AND: [
      ...(verification ? [{ verificationStatus: verification }] : []),
      ...(featured === "1" ? [{ featured: true }] : featured === "0" ? [{ featured: false }] : []),
      ...(q
        ? [
            {
              OR: [
                { name: { contains: q } },
                { tagline: { contains: q } },
                { city: { contains: q } },
                { province: { contains: q } },
              ],
            },
          ]
        : []),
    ],
  };

  const [total, items] = await Promise.all([
    db.business.count({ where }),
    db.business.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        industry: { select: { id: true, name: true, slug: true } },
        owner: { select: { id: true, email: true, firstName: true, lastName: true } },
        _count: { select: { reviews: true, follows: true } },
      },
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pageSize,
    pages: Math.ceil(total / pageSize),
    items: items.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      tagline: b.tagline,
      industry: b.industry,
      province: b.province,
      city: b.city,
      logoUrl: b.logoUrl,
      verificationStatus: b.verificationStatus,
      featured: b.featured,
      views: b.views,
      createdAt: b.createdAt,
      owner: b.owner,
      reviewCount: b._count.reviews,
      followerCount: b._count.follows,
    })),
  });
}

// PATCH /api/admin/businesses — update a business (featured toggle, verification override)
export async function PATCH(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const { id, featured, verificationStatus } = body;
  if (!id) {
    return NextResponse.json({ error: "Business id is required." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof featured === "boolean") data.featured = featured;
  if (typeof verificationStatus === "string") data.verificationStatus = verificationStatus;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  const biz = await db.business.update({ where: { id }, data });
  return NextResponse.json({ business: biz });
}

export { qs };
