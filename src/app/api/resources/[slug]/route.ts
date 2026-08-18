import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/resources/[slug] — single published resource
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = await db.resource.findUnique({ where: { slug } });
  if (!resource) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }
  return NextResponse.json({ resource });
}
