import { getSessionUser } from "@/lib/auth";
import { NextResponse } from "next/server";

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  }
  if (!ADMIN_ROLES.has(user.role)) {
    return { user: null, error: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }
  return { user, error: null };
}
