import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// PATCH /api/businesses/[slug]/edit — owner updates a business
// NOTE: the dynamic segment is named [slug] for Next.js route consistency with
// the existing /api/businesses/[slug] route. The path value is the business ID
// (per the API contract) and is looked up by `id` below.
export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  const biz = await db.business.findUnique({
    where: { id },
    select: { ownerId: true, slug: true },
  });
  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }
  if (biz.ownerId !== user.id) {
    return NextResponse.json({ error: "You don't have permission to edit this business." }, { status: 403 });
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
    logoUrl,
    coverUrl,
    services,
    products,
  } = body;

  // Build update object only with provided fields
  const data: Record<string, unknown> = {};
  if (name !== undefined) {
    data.name = String(name).trim() || biz.slug;
    // re-slug only if name changed and new slug is unique
    const newSlug = slugify(String(name));
    if (newSlug && newSlug !== biz.slug) {
      const clash = await db.business.findUnique({ where: { slug: newSlug } });
      if (!clash || clash.id === id) data.slug = newSlug;
    }
  }
  if (tagline !== undefined) data.tagline = tagline?.trim() || null;
  if (description !== undefined) data.description = description?.trim() || null;
  if (industryId !== undefined) data.industryId = industryId || null;
  if (province !== undefined) data.province = province?.trim() || null;
  if (city !== undefined) data.city = city?.trim() || null;
  if (address !== undefined) data.address = address?.trim() || null;
  if (website !== undefined) data.website = website?.trim() || null;
  if (email !== undefined) data.email = email?.trim() || null;
  if (phone !== undefined) data.phone = phone?.trim() || null;
  if (whatsapp !== undefined) data.whatsapp = whatsapp?.trim() || null;
  if (businessSize !== undefined) data.businessSize = businessSize || null;
  if (yearFounded !== undefined) data.yearFounded = yearFounded ? Number(yearFounded) : null;
  if (employeeCount !== undefined) data.employeeCount = employeeCount || null;
  if (annualRevenue !== undefined) data.annualRevenue = annualRevenue || null;
  if (cipcNumber !== undefined) data.cipcNumber = cipcNumber?.trim() || null;
  if (bbbeeLevel !== undefined) data.bbbeeLevel = bbbeeLevel || null;
  if (logoUrl !== undefined) {
    const v = String(logoUrl);
    if (v.length > 200000) {
      return NextResponse.json({ error: "Logo image is too large." }, { status: 400 });
    }
    data.logoUrl = v || null;
  }
  if (coverUrl !== undefined) {
    const v = String(coverUrl);
    if (v.length > 300000) {
      return NextResponse.json({ error: "Cover image is too large." }, { status: 400 });
    }
    data.coverUrl = v || null;
  }

  // recompute profile completion
  const future = {
    name: data.name ?? biz.slug,
    tagline: data.tagline,
    description: data.description,
    industryId: data.industryId,
    province: data.province,
    city: data.city,
    address: data.address,
    website: data.website,
    email: data.email,
    phone: data.phone,
    businessSize: data.businessSize,
    yearFounded: data.yearFounded,
    employeeCount: data.employeeCount,
    annualRevenue: data.annualRevenue,
    cipcNumber: data.cipcNumber,
    bbbeeLevel: data.bbbeeLevel,
    logoUrl: data.logoUrl,
  };
  const fields = Object.values(future);
  const filled = fields.filter((f) => f !== undefined && f !== null && f !== "").length;
  data.profileCompletion = Math.round((filled / fields.length) * 100);

  // services & products — replace-all if provided as arrays
  const tx: Promise<unknown>[] = [];
  if (Array.isArray(services)) {
    tx.push(
      db.businessService.deleteMany({ where: { businessId: id } }),
      db.businessService.createMany({
        data: (services as string[])
          .map((s) => String(s).trim())
          .filter(Boolean)
          .map((s) => ({ businessId: id, name: s })),
      }),
    );
  }
  if (Array.isArray(products)) {
    tx.push(
      db.businessProduct.deleteMany({ where: { businessId: id } }),
      db.businessProduct.createMany({
        data: (products as string[])
          .map((p) => String(p).trim())
          .filter(Boolean)
          .map((p) => ({ businessId: id, name: p })),
      }),
    );
  }

  await Promise.all([
    db.business.update({ where: { id }, data }),
    ...tx,
  ]);

  const refreshed = await db.business.findUnique({
    where: { id },
    include: {
      industry: { select: { id: true, name: true, slug: true, icon: true } },
      services: true,
      products: true,
    },
  });

  return NextResponse.json({ business: refreshed });
}
