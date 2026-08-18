import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// DELETE /api/posts/[id] — delete a post (owner or admin)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  const post = await db.post.findUnique({ where: { id }, select: { authorId: true } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  // allow owner or admin
  if (post.authorId !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "You don't have permission to delete this post." }, { status: 403 });
  }
  await db.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
