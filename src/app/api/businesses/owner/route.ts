import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const items = await db.business.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      industry: { select: { id: true, name: true, slug: true, icon: true } },
      services: true,
      products: true,
      _count: { select: { reviews: true } },
    },
  });
  return NextResponse.json({ items });
}
