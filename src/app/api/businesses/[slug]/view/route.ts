import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// increment profile views
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await db.business.update({
    where: { slug },
    data: { views: { increment: 1 } },
  });
  return NextResponse.json({ ok: true });
}
