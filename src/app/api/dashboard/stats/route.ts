import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/dashboard/stats — summary card for the dashboard
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const now = new Date();

  const [
    businesses,
    pendingVerifications,
    contacts,
    upcomingEvents,
    savedEvents,
    unreadNotifications,
    recentNotifications,
    recentContacts,
    subscription,
  ] = await Promise.all([
    db.business.count({ where: { ownerId: user.id } }),
    db.verificationRequest.count({
      where: { status: "PENDING", business: { ownerId: user.id } },
    }),
    db.contact.count({ where: { ownerId: user.id } }),
    db.event.count({ where: { startDate: { gte: now } } }),
    db.eventAttendee.count({ where: { userId: user.id } }),
    db.notification.count({ where: { userId: user.id, read: false } }),
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.contact.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    db.subscription.findUnique({ where: { userId: user.id } }),
  ]);

  const plan = (subscription?.plan ?? user.plan) as string;
  const planStatus = (subscription?.status ?? "FREE") as string;

  return NextResponse.json({
    businesses,
    pendingVerifications,
    contacts,
    upcomingEvents,
    savedEvents,
    unreadNotifications,
    recentNotifications: recentNotifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      read: n.read,
      createdAt: n.createdAt,
    })),
    recentContacts: recentContacts.map((c) => ({
      id: c.id,
      name: c.name,
      company: c.company,
      position: c.position,
      email: c.email,
      phone: c.phone,
      website: c.website,
      notes: c.notes,
      category: c.category,
      tags: c.tags,
      createdAt: c.createdAt,
    })),
    plan,
    planStatus,
  });
}
