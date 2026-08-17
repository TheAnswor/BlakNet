// BlakNet lightweight session-based auth (server-side)
// Uses HTTP-only cookie + sha256 password hashing (demo-grade; production should use bcrypt/argon2).

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createHash, randomBytes } from "crypto";
import type { AuthUser, Role, Plan } from "@/lib/types";

const COOKIE_NAME = "blaknet_session";
const SESSION_DAYS = 30;

function hashPassword(pw: string) {
  return createHash("sha256").update(pw + "::blaknet").digest("hex");
}

function newToken() {
  return randomBytes(32).toString("hex");
}

function toAuthUser(u: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  plan: string;
  profileImage: string | null;
  phone: string | null;
  bio: string | null;
}): AuthUser {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role as Role,
    plan: u.plan as Plan,
    profileImage: u.profileImage,
    phone: u.phone,
    bio: u.bio,
  };
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) return null;
  return toAuthUser(session.user);
}

export async function requireUser(): Promise<AuthUser> {
  const u = await getSessionUser();
  if (!u) throw new Error("UNAUTHENTICATED");
  return u;
}

export async function loginUser(email: string, password: string): Promise<AuthUser | null> {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.passwordHash) return null;
  if (hashPassword(password) !== user.passwordHash) return null;
  const token = newToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);
  await db.session.create({
    data: { token, userId: user.id, expiresAt },
  });
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return toAuthUser(user);
}

export async function registerUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<{ ok: boolean; error?: string; user?: AuthUser }> {
  const email = input.email.toLowerCase().trim();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "An account with this email already exists." };
  const user = await db.user.create({
    data: {
      email,
      passwordHash: hashPassword(input.password),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      role: "USER",
      plan: "STARTER",
    },
  });
  await db.subscription.create({
    data: { userId: user.id, plan: "STARTER", status: "FREE" },
  });
  await db.profile.create({ data: { userId: user.id } });
  const loggedIn = await loginUser(email, input.password);
  return { ok: true, user: loggedIn ?? toAuthUser(user) };
}

export async function logoutUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } }).catch(() => {});
  }
  (await cookies()).delete(COOKIE_NAME);
}

export async function demoLogin(): Promise<AuthUser | null> {
  return loginUser("demo@blaknet.co.za", "blaknet123");
}

export { hashPassword };
