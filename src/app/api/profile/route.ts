import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/profile — fetch the current user's profile + profile record
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  const profile = await db.profile.findUnique({ where: { userId: user.id } });
  return NextResponse.json({
    user,
    profile: profile
      ? {
          headline: profile.headline,
          location: profile.location,
          website: profile.website,
          linkedin: profile.linkedin,
        }
      : null,
  });
}

// PATCH /api/profile — update the current user's profile
export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { firstName, lastName, phone, bio, profileImage, headline, location, website, linkedin } = body;

  // validate
  const updates: Record<string, unknown> = {};
  if (firstName !== undefined) {
    const v = String(firstName).trim();
    if (v.length < 1 || v.length > 60) {
      return NextResponse.json({ error: "First name must be 1–60 characters." }, { status: 400 });
    }
    updates.firstName = v;
  }
  if (lastName !== undefined) {
    updates.lastName = String(lastName).trim().slice(0, 60) || null;
  }
  if (phone !== undefined) {
    updates.phone = String(phone).trim().slice(0, 30) || null;
  }
  if (bio !== undefined) {
    updates.bio = String(bio).trim().slice(0, 500) || null;
  }
  if (profileImage !== undefined) {
    // accept data-uri or URL; cap length to avoid storing huge blobs in the wrong field
    const v = String(profileImage);
    if (v.length > 200000) {
      return NextResponse.json({ error: "Profile image is too large." }, { status: 400 });
    }
    updates.profileImage = v || null;
  }

  const profileUpdates: Record<string, unknown> = {};
  if (headline !== undefined) profileUpdates.headline = String(headline).trim().slice(0, 120) || null;
  if (location !== undefined) profileUpdates.location = String(location).trim().slice(0, 120) || null;
  if (website !== undefined) profileUpdates.website = String(website).trim().slice(0, 200) || null;
  if (linkedin !== undefined) profileUpdates.linkedin = String(linkedin).trim().slice(0, 200) || null;

  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: updates }),
    db.profile.upsert({
      where: { userId: user.id },
      update: profileUpdates,
      create: { userId: user.id, ...profileUpdates },
    }),
  ]);

  const refreshed = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true, email: true, firstName: true, lastName: true, role: true, plan: true,
      profileImage: true, phone: true, bio: true,
    },
  });
  const profile = await db.profile.findUnique({ where: { userId: user.id } });

  return NextResponse.json({
    user: refreshed,
    profile: profile
      ? {
          headline: profile.headline,
          location: profile.location,
          website: profile.website,
          linkedin: profile.linkedin,
        }
      : null,
  });
}
