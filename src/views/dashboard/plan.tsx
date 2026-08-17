"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Pill } from "@/components/blaknet/badges";
import { EmptyState } from "@/components/blaknet/section";
import { PLANS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Plan, Subscription, SubscriptionStatus } from "@/lib/types";
import {
  AlertCircle,
  Check,
  X,
  Crown,
  TrendingUp,
  Receipt,
  Calendar,
  Sparkles,
} from "lucide-react";

export function PlanView() {
  const { authUser } = useApp();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await api<{ subscription: Subscription | null }>("/api/subscriptions");
        if (!cancelled) setSubscription(data.subscription ?? null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load subscription.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentPlan: Plan = authUser?.plan ?? "STARTER";
  const status: SubscriptionStatus = subscription?.status ?? (currentPlan === "STARTER" ? "FREE" : "ACTIVE");

  function upgradeTo(planName: string) {
    toast({
      title: "Yoco checkout is being prepared",
      description: "A team member will reach out to complete your upgrade.",
    });
    void planName;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-96 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load your plan"
        description={error}
      />
    );
  }

  const detailRows = [
    subscription?.startDate
      ? { label: "Started", value: formatDate(subscription.startDate) }
      : null,
    subscription?.endDate
      ? { label: "Renews", value: formatDate(subscription.endDate) }
      : null,
  ].filter((d): d is { label: string; value: string } => d !== null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">My Plan</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Manage your subscription, view billing history and upgrade to unlock more.
        </p>
      </div>

      {/* Current plan card */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl tracking-tight">{planNameLabel(currentPlan)}</h2>
              <StatusBadge status={status} />
            </div>
            <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
              {planNote(currentPlan, status)}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-ink-grain px-4 py-3 text-cream">
            <Crown className="h-5 w-5 text-sage" />
            <span className="font-display text-lg">{planPriceLabel(currentPlan)}</span>
            <span className="text-xs text-cream/60">/mo</span>
          </div>
        </div>

        {detailRows.length > 0 && (
          <div className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
            {detailRows.map((d) => (
              <div key={d.label} className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{d.label}</p>
                  <p className="text-sm font-medium">{d.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plan tiers */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-sage" />
          <h2 className="font-display text-lg tracking-tight">Available plans</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3 lg:items-stretch">
          {PLANS.map((tier) => {
            const isCurrent = tier.id === currentPlan;
            const isHigher = planRank(tier.id) > planRank(currentPlan);
            const dark = tier.highlight && !isCurrent;
            return (
              <div
                key={tier.id}
                className={
                  isCurrent
                    ? "relative flex flex-col rounded-xl border-2 border-sage bg-card p-6 shadow-sm"
                    : dark
                      ? "relative flex flex-col rounded-xl border border-cream/20 bg-ink-grain p-6 text-cream"
                      : "relative flex flex-col rounded-xl border border-border bg-card p-6"
                }
              >
                {isCurrent && (
                  <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-sage px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink">
                    <Check className="h-3 w-3" /> Current plan
                  </span>
                )}
                <h3 className={"font-display text-2xl tracking-tight " + (dark ? "text-cream" : "text-foreground")}>
                  {tier.name}
                </h3>
                <p className={"mt-1 text-sm " + (dark ? "text-cream/70" : "text-muted-foreground")}>
                  {tier.tagline}
                </p>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className={"font-display text-4xl tracking-tight " + (dark ? "text-cream" : "text-foreground")}>
                    {tier.price}
                  </span>
                  <span className={"text-xs " + (dark ? "text-cream/60" : "text-muted-foreground")}>
                    {tier.cadence}
                  </span>
                </div>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      {f.included ? (
                        <Check className={"mt-0.5 h-4 w-4 shrink-0 text-sage"} />
                      ) : (
                        <X className={dark ? "mt-0.5 h-4 w-4 shrink-0 text-cream/40" : "mt-0.5 h-4 w-4 shrink-0 text-foreground/30"} />
                      )}
                      <span
                        className={
                          f.included
                            ? (dark ? "flex-1 text-cream/90" : "flex-1 text-foreground")
                            : (dark ? "flex-1 text-cream/50" : "flex-1 text-muted-foreground")
                        }
                      >
                        {f.label}
                      </span>
                      {f.badge && (
                        <Pill tone={dark ? "sage" : "neutral"} className="ml-1">
                          {f.badge}
                        </Pill>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {isCurrent ? (
                    <Button disabled variant="outline" className="w-full">
                      <Check className="mr-1.5 h-4 w-4" /> Current plan
                    </Button>
                  ) : isHigher ? (
                    <Button
                      onClick={() => upgradeTo(tier.name)}
                      className={
                        tier.highlight
                          ? "w-full bg-cream text-ink hover:bg-cream/90"
                          : "w-full bg-ink text-cream hover:bg-ink/90"
                      }
                    >
                      <TrendingUp className="mr-1.5 h-4 w-4" /> Upgrade to {tier.name}
                    </Button>
                  ) : (
                    <Button disabled variant="outline" className="w-full">
                      Downgrade
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing history */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-sage" />
          <h2 className="font-display text-lg tracking-tight">Billing history</h2>
        </div>
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description="Your first invoice will appear here after your first paid cycle."
        />
      </div>

      {/* FAQ */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-sage" />
          <h2 className="font-display text-lg tracking-tight">Frequently asked</h2>
        </div>
        <div className="rounded-xl border border-border bg-card px-4">
          <Accordion type="single" collapsible>
            <AccordionItem value="cancel">
              <AccordionTrigger>How do I cancel?</AccordionTrigger>
              <AccordionContent>
                You can cancel anytime from this page once Yoco billing is fully wired. For now, you won't be charged — your Starter plan is free forever. Reach out to{" "}
                <a className="text-sage underline" href="mailto:hello@blaknet.co.za">
                  hello@blaknet.co.za
                </a>{" "}
                if you'd like help.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="secure">
              <AccordionTrigger>Is Yoco secure?</AccordionTrigger>
              <AccordionContent>
                Yes. Yoco is PCI-DSS Level 1 certified and processes payments securely on their own infrastructure. BlakNet never stores your card details — we only receive a confirmation token once payment is approved.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const tones: Record<SubscriptionStatus, string> = {
    FREE: "bg-foreground/5 text-foreground/70 border-foreground/15",
    ACTIVE: "bg-sage/15 text-sage border-sage/30",
    PAST_DUE: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-500",
    CANCELLED: "bg-foreground/5 text-muted-foreground border-foreground/15",
    EXPIRED: "bg-foreground/5 text-muted-foreground border-foreground/15",
  };
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium " +
        (tones[status] ?? tones.FREE)
      }
    >
      {status === "ACTIVE" && <Check className="h-3 w-3" />}
      {status === "PAST_DUE" && <AlertCircle className="h-3 w-3" />}
      <span className="uppercase tracking-wide">{status}</span>
    </span>
  );
}

function planRank(p: Plan): number {
  switch (p) {
    case "STARTER":
      return 1;
    case "VERIFIED":
      return 2;
    case "INTELLIGENCE":
      return 3;
  }
}

function planNameLabel(p: Plan): string {
  return p.charAt(0) + p.slice(1).toLowerCase();
}

function planPriceLabel(p: Plan): string {
  const tier = PLANS.find((t) => t.id === p);
  return tier?.price ?? "R0";
}

function planNote(p: Plan, status: SubscriptionStatus): string {
  if (status === "PAST_DUE")
    return "Your last payment failed — please update your billing details to avoid service interruption.";
  if (status === "CANCELLED" || status === "EXPIRED")
    return "Your subscription has ended. Reactivate to restore premium features.";
  switch (p) {
    case "STARTER":
      return "You're on the free plan. Upgrade to get verified and unlock procurement-grade features.";
    case "VERIFIED":
      return "You're verified. Unlock the Intelligence suite for live analytics and API access.";
    case "INTELLIGENCE":
      return "You're on Intelligence. Full suite unlocked.";
  }
}
