import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/posts/[id]/comments — oldest first
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await db.comment.findMany({
    where: { postId: id },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json({
    items: items.map((c) => ({
      id: c.id,
      postId: c.postId,
      userId: c.userId,
      user: c.user,
      content: c.content,
      createdAt: c.createdAt,
    })),
  });
}

// POST /api/posts/[id]/comments — create comment (auth)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to comment." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { content } = body;
  if (!content || typeof content !== "string" || content.trim() === "") {
    return NextResponse.json({ error: "Comment content is required." }, { status: 400 });
  }

  const post = await db.post.findUnique({ where: { id }, select: { id: true } });
  if (!post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const comment = await db.comment.create({
    data: {
      postId: id,
      userId: user.id,
      content: content.trim(),
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
