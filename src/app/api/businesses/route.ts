import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { qs } from "@/lib/api";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET /api/businesses  — public directory with filters
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const industry = url.searchParams.getAll("industry");
  const province = url.searchParams.getAll("province");
  const city = url.searchParams.get("city") || "";
  const size = url.searchParams.getAll("size");
  const bbbee = url.searchParams.getAll("bbbee");
  const verifiedOnly = url.searchParams.get("verified") === "1";
  const featuredOnly = url.searchParams.get("featured") === "1";
  const sort = url.searchParams.get("sort") || "relevance";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const pageSize = Math.min(48, Math.max(6, parseInt(url.searchParams.get("pageSize") || "12", 10)));

  const where = {
    AND: [
      ...(industry.length ? [{ industry: { slug: { in: industry } } }] : []),
      ...(province.length ? [{ province: { in: province } }] : []),
      ...(city ? [{ city: { contains: city } }] : []),
      ...(size.length ? [{ businessSize: { in: size } }] : []),
      ...(bbbee.length ? [{ bbbeeLevel: { in: bbbee } }] : []),
      ...(verifiedOnly ? [{ verificationStatus: "VERIFIED" }] : []),
      ...(featuredOnly ? [{ featured: true }] : []),
      ...(q
        ? [
            {
              OR: [
                { name: { contains: q } },
                { tagline: { contains: q } },
                { description: { contains: q } },
                { city: { contains: q } },
                { services: { some: { name: { contains: q } } } },
                { products: { some: { name: { contains: q } } } },
              ],
            },
          ]
        : []),
    ],
  };

  const orderBy =
    sort === "newest"
      ? { createdAt: "desc" as const }
      : sort === "viewed"
        ? { views: "desc" as const }
        : sort === "verified"
          ? [{ verificationStatus: "desc" as const }, { views: "desc" as const }]
          : [{ featured: "desc" as const }, { views: "desc" as const }];

  const [total, items] = await Promise.all([
    db.business.count({ where }),
    db.business.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        industry: { select: { id: true, name: true, slug: true, icon: true } },
        services: true,
        products: true,
        _count: { select: { reviews: true } },
      },
    }),
  ]);

  const reviewsAgg = await db.businessReview.groupBy({
    by: ["businessId"],
    where: { businessId: { in: items.map((i) => i.id) }, verificationStatus: "APPROVED" },
    _avg: { rating: true },
  });
  const ratingMap = new Map(reviewsAgg.map((r) => [r.businessId, r._avg.rating ?? 0]));

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
      description: b.description,
      industry: b.industry,
      province: b.province,
      city: b.city,
      logoUrl: b.logoUrl,
      verificationStatus: b.verificationStatus,
      featured: b.featured,
      views: b.views,
      bbbeeLevel: b.bbbeeLevel,
      businessSize: b.businessSize,
      yearFounded: b.yearFounded,
      services: b.services,
      products: b.products,
      rating: ratingMap.get(b.id) ?? 0,
      reviewCount: b._count.reviews,
    })),
  });
}

// POST /api/businesses — create business (auth)
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const {
    name,
    tagline,
    description,
    industryId,
    province,
    city,
    address,
    website,
    email,
    phone,
    whatsapp,
    businessSize,
    yearFounded,
    employeeCount,
    annualRevenue,
    cipcNumber,
    bbbeeLevel,
    services = [],
    products = [],
  } = body;

  if (!name || !province || !city) {
    return NextResponse.json({ error: "Business name, province and city are required." }, { status: 400 });
  }

  // unique slug
  let slug = slugify(name);
  const exists = await db.business.findUnique({ where: { slug } });
  if (exists) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  // profile completion score
  const fields = [name, tagline, description, industryId, province, city, address, website, email, phone, businessSize, yearFounded, employeeCount, annualRevenue, cipcNumber, bbbeeLevel];
  const filled = fields.filter((f) => f !== undefined && f !== null && f !== "").length;
  const completion = Math.round((filled / fields.length) * 100);

  const biz = await db.business.create({
    data: {
      ownerId: user.id,
      name,
      slug,
      tagline: tagline || null,
      description: description || null,
      industryId: industryId || null,
      province,
      city,
      address: address || null,
      website: website || null,
      email: email || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
      businessSize: businessSize || null,
      yearFounded: yearFounded ? Number(yearFounded) : null,
      employeeCount: employeeCount || null,
      annualRevenue: annualRevenue || null,
      cipcNumber: cipcNumber || null,
      bbbeeLevel: bbbeeLevel || null,
      verificationStatus: "NOT_VERIFIED",
      profileCompletion: completion,
      services: services.length ? { create: (services as string[]).map((s) => ({ name: s })) } : undefined,
      products: products.length ? { create: (products as string[]).map((p) => ({ name: p })) } : undefined,
    },
    include: { services: true, products: true, industry: true },
  });

  // bump owner role
  if (user.role === "USER") {
    await db.user.update({ where: { id: user.id }, data: { role: "BUSINESS_OWNER" } });
  }
  await db.businessMember.create({ data: { businessId: biz.id, userId: user.id, role: "OWNER" } });

  return NextResponse.json({ business: biz }, { status: 201 });
}

// re-export qs for type reuse
export { qs };
