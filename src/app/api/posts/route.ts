import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/posts — newest first, with author/business/_count
export async function GET() {
  const items = await db.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      author: { select: { id: true, firstName: true, lastName: true, email: true } },
      business: { select: { id: true, name: true, slug: true, logoUrl: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  return NextResponse.json({
    items: items.map((p) => ({
      id: p.id,
      authorId: p.authorId,
      author: p.author,
      businessId: p.businessId,
      business: p.business,
      content: p.content,
      imageUrl: p.imageUrl,
      postType: p.postType,
      title: p.title,
      views: p.views,
      createdAt: p.createdAt,
      _count: { likes: p._count.likes, comments: p._count.comments },
    })),
  });
}

// POST /api/posts — create post (auth)
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to post." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { content, postType, title, businessId, imageUrl } = body;

  if (!content || typeof content !== "string" || content.trim() === "") {
    return NextResponse.json({ error: "Content is required." }, { status: 400 });
  }

  // verify business ownership if businessId provided
  if (businessId) {
    const biz = await db.business.findUnique({ where: { id: businessId }, select: { ownerId: true } });
    if (!biz) {
      return NextResponse.json({ error: "Business not found." }, { status: 404 });
    }
    if (biz.ownerId !== user.id) {
      return NextResponse.json({ error: "You can only post for your own business." }, { status: 403 });
    }
  }

  const post = await db.post.create({
    data: {
      authorId: user.id,
      businessId: businessId || null,
      content: content.trim(),
      postType: postType || "text",
      title: title || null,
      imageUrl: imageUrl || null,
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, email: true } },
      business: { select: { id: true, name: true, slug: true, logoUrl: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}
