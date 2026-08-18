import { NextResponse } from "next/server";
import { demoLogin } from "@/lib/auth";

export async function POST() {
  const user = await demoLogin();
  if (!user) {
    return NextResponse.json({ error: "Demo account unavailable." }, { status: 400 });
  }
  return NextResponse.json({ user });
}
