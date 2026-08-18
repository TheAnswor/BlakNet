import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// POST /api/businesses/[slug]/follow — toggle follow
// NOTE: the dynamic segment is named [slug] for Next.js route consistency with
// the existing /api/businesses/[slug] route. The path value is the business ID
// (per the API contract) and is looked up by `id` below.
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to follow a business." }, { status: 401 });
  }
  const biz = await db.business.findUnique({ where: { id }, select: { id: true, name: true, ownerId: true } });
  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }
  const existing = await db.businessFollow.findUnique({
    where: { businessId_userId: { businessId: id, userId: user.id } },
  });
  if (existing) {
    await db.businessFollow.delete({ where: { id: existing.id } });
    return NextResponse.json({ following: false });
  }
  await db.businessFollow.create({ data: { businessId: id, userId: user.id } });
  // notify the business owner
  if (biz.ownerId !== user.id) {
    await db.notification.create({
      data: {
        userId: biz.ownerId,
        type: "connection",
        title: "New follower",
        message: `${user.firstName ?? user.email.split("@")[0]} started following ${biz.name}.`,
        link: "#/business/" + id,
      },
    });
  }
  return NextResponse.json({ following: true });
}
