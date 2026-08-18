import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import type { Plan } from "@/lib/types";

const VALID_PLANS = new Set(["STARTER", "VERIFIED", "INTELLIGENCE"]);
const PLAN_PRICES: Record<string, number> = {
  STARTER: 0,
  VERIFIED: 24900, // cents (R249.00)
  INTELLIGENCE: 89500, // cents (R895.00)
};

// POST /api/subscriptions/upgrade — activate/upgrade a subscription
// In production this would be called by a Yoco webhook after payment confirmation.
// For MVP, we simulate the payment success and activate immediately.
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { plan, paymentReference } = body;

  if (!VALID_PLANS.has(plan)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const targetPlan = plan as Plan;
  const now = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30); // 30-day billing cycle

  // upsert subscription
  const subscription = await db.subscription.upsert({
    where: { userId: user.id },
    update: {
      plan: targetPlan,
      status: targetPlan === "STARTER" ? "FREE" : "ACTIVE",
      provider: targetPlan === "STARTER" ? null : "yoco",
      providerSubscriptionId: paymentReference || `yoco_sim_${Date.now()}`,
      startDate: now,
      endDate: targetPlan === "STARTER" ? null : endDate,
    },
    create: {
      userId: user.id,
      plan: targetPlan,
      status: targetPlan === "STARTER" ? "FREE" : "ACTIVE",
      provider: targetPlan === "STARTER" ? null : "yoco",
      providerSubscriptionId: paymentReference || `yoco_sim_${Date.now()}`,
      startDate: now,
      endDate: targetPlan === "STARTER" ? null : endDate,
    },
  });

  // update the user's plan field too
  await db.user.update({
    where: { id: user.id },
    data: { plan: targetPlan },
  });

  // create a notification
  await db.notification.create({
    data: {
      userId: user.id,
      type: "subscription",
      title: targetPlan === "STARTER" ? "Plan changed to Starter" : `Welcome to ${targetPlan}!`,
      message:
        targetPlan === "STARTER"
          ? "Your plan has been changed to Starter. Premium features will expire at the end of your current cycle."
          : `Your ${targetPlan} subscription is now active. Enjoy premium features for the next 30 days.`,
      link: `#/dashboard-plan`,
    },
  });

  return NextResponse.json({
    subscription: {
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      provider: subscription.provider,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
    },
    user: { plan: targetPlan },
  });
}
