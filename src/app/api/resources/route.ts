import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/resources — list published resources with optional filters
export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") || "";
  const type = url.searchParams.get("type") || "";
  const featured = url.searchParams.get("featured") === "1";

  const where: Record<string, unknown> = { published: true };
  if (category) where.category = category;
  if (type) where.resourceType = type;
  if (featured) where.featured = true;

  const items = await db.resource.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    items: items.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      description: r.description,
      content: r.content,
      category: r.category,
      resourceType: r.resourceType,
      imageUrl: r.imageUrl,
      author: r.author,
      readMinutes: r.readMinutes,
      featured: r.featured,
      createdAt: r.createdAt,
    })),
  });
}
