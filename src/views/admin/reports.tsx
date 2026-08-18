"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pill } from "@/components/blaknet/badges";
import { EmptyState } from "@/components/blaknet/section";
import { formatDate, formatNumber, initials, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Plan, VerificationStatus } from "@/lib/types";
import {
  Users,
  Building2,
  ShieldCheck,
  Calendar,
  Newspaper,
  BookOpen,
  Inbox,
  CreditCard,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  Eye,
  Heart,
  Sparkles,
  BarChart3,
} from "lucide-react";

interface TopBusiness {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  views?: number;
  followerCount?: number;
  industry: string | null;
}

interface RecentRegistration {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  plan: Plan;
}

interface ReportsData {
  summary: {
    totalUsers: number;
    totalBusinesses: number;
    verifiedBusinesses: number;
    totalEvents: number;
    totalPosts: number;
    totalResources: number;
    totalEnquiries: number;
    activeSubscriptions: number;
  };
  growth: {
    newUsers30d: number;
    newBusinesses30d: number;
    newPosts30d: number;
    newEnquiries30d: number;
  };
  topBusinessesByViews: TopBusiness[];
  topBusinessesByFollowers: TopBusiness[];
  planDistribution: Partial<Record<Plan, number>>;
  verificationDistribution: Partial<Record<VerificationStatus, number>>;
  recentRegistrations: RecentRegistration[];
}

type LoadState =
  | { kind: "loading" }
  | { kind: "forbidden" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: ReportsData };

const SUMMARY_CARDS: {
  key: keyof ReportsData["summary"];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "totalUsers", label: "Total users", icon: Users },
  { key: "totalBusinesses", label: "Total businesses", icon: Building2 },
  { key: "verifiedBusinesses", label: "Verified businesses", icon: ShieldCheck },
  { key: "totalEvents", label: "Total events", icon: Calendar },
  { key: "totalPosts", label: "Total posts", icon: Newspaper },
  { key: "totalResources", label: "Resources", icon: BookOpen },
  { key: "totalEnquiries", label: "Enquiries", icon: Inbox },
  { key: "activeSubscriptions", label: "Active subscriptions", icon: CreditCard },
];

const GROWTH_CARDS: {
  key: keyof ReportsData["growth"];
  label: string;
}[] = [
  { key: "newUsers30d", label: "New users" },
  { key: "newBusinesses30d", label: "New businesses" },
  { key: "newPosts30d", label: "New posts" },
  { key: "newEnquiries30d", label: "New enquiries" },
];

const PLAN_LABELS: { value: Plan; label: string }[] = [
  { value: "STARTER", label: "Starter" },
  { value: "VERIFIED", label: "Verified" },
  { value: "INTELLIGENCE", label: "Intelligence" },
];

const VERIFICATION_LABELS: {
  value: VerificationStatus;
  label: string;
  tone: "sage" | "neutral" | "ink" | "cream";
}[] = [
  { value: "VERIFIED", label: "Verified", tone: "sage" },
  { value: "NOT_VERIFIED", label: "Not verified", tone: "neutral" },
  { value: "PENDING", label: "Pending", tone: "ink" },
  { value: "REJECTED", label: "Rejected", tone: "cream" },
];

function planTone(plan: Plan): "neutral" | "ink" | "sage" | "cream" {
  switch (plan) {
    case "VERIFIED":
      return "sage";
    case "INTELLIGENCE":
      return "ink";
    case "STARTER":
    default:
      return "neutral";
  }
}

function planLabel(plan: Plan): string {
  return plan.charAt(0) + plan.slice(1).toLowerCase();
}

export function AdminReportsView() {
  const { navigate } = useApp();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api<ReportsData>("/api/admin/reports");
        if (!cancelled) setState({ kind: "ready", data });
      } catch (err) {
        if (cancelled) return;
        const e = err as Error & { status?: number };
        if (e.status === 403) setState({ kind: "forbidden" });
        else setState({ kind: "error", message: e.message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading") return <ReportsSkeleton />;
  if (state.kind === "forbidden") {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Admin access required."
        description="You need an admin account to view platform reports."
        action={
          <Button
            onClick={() => navigate({ name: "dashboard" })}
            className="bg-ink text-cream hover:bg-ink/90"
          >
            <ArrowRight className="mr-1.5 h-4 w-4" /> Back to dashboard
          </Button>
        }
      />
    );
  }
  if (state.kind === "error") {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load reports."
        description={state.message}
        action={
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try again
          </Button>
        }
      />
    );
  }

  const { data } = state;
  const planTotal = PLAN_LABELS.reduce(
    (n, p) => n + (data.planDistribution[p.value] ?? 0),
    0,
  );
  const verificationTotal = VERIFICATION_LABELS.reduce(
    (n, v) => n + (data.verificationDistribution[v.value] ?? 0),
    0,
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-ink-grain p-6 text-cream sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 opacity-20">
          <BarChart3 className="h-40 w-40 text-sage" />
        </div>
        <div className="relative">
          <Pill tone="sage" className="mb-3">
            <TrendingUp className="h-3 w-3" /> Analytics
          </Pill>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Reports</h1>
          <p className="mt-2 max-w-lg text-sm text-cream/70">
            Platform analytics and growth insights.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-sage" />
          <h2 className="font-display text-lg tracking-tight">Platform totals</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {SUMMARY_CARDS.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={c.key}
                className="card-soft animate-fade-in-up rounded-xl border border-border bg-card p-5"
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-cream">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-4 font-display text-3xl tracking-tight">
                  {formatNumber(data.summary[c.key])}
                </div>
                <div className="text-sm font-medium">{c.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Growth section */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-sage" />
            <h2 className="font-display text-lg tracking-tight">Growth</h2>
          </div>
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Last 30 days
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {GROWTH_CARDS.map((g, i) => (
            <div
              key={g.key}
              className="card-soft animate-fade-in-up rounded-xl border border-border bg-card p-5"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  {g.label}
                </span>
                <TrendingUp className="h-4 w-4 text-sage" />
              </div>
              <div className="mt-3 font-display text-3xl tracking-tight text-sage">
                +{formatNumber(data.growth[g.key])}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">New in last 30 days</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top businesses */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-sage" />
          <h2 className="font-display text-lg tracking-tight">Top businesses</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <TopBusinessesCard
            title="Most viewed"
            tone="views"
            businesses={data.topBusinessesByViews}
            onOpen={(slug) => navigate({ name: "business", slug })}
            delayMs={0}
          />
          <TopBusinessesCard
            title="Most followed"
            tone="followers"
            businesses={data.topBusinessesByFollowers}
            onOpen={(slug) => navigate({ name: "business", slug })}
            delayMs={60}
          />
        </div>
      </section>

      {/* Distribution */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-sage" />
          <h2 className="font-display text-lg tracking-tight">Distribution</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <DistributionCard
            title="Plan distribution"
            rows={PLAN_LABELS.map((p) => ({
              label: p.label,
              value: data.planDistribution[p.value] ?? 0,
            }))}
            total={planTotal}
            delayMs={0}
          />
          <DistributionCard
            title="Verification distribution"
            rows={VERIFICATION_LABELS.map((v) => ({
              label: v.label,
              value: data.verificationDistribution[v.value] ?? 0,
            }))}
            total={verificationTotal}
            delayMs={60}
          />
        </div>
      </section>

      {/* Recent registrations */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-sage" />
          <h2 className="font-display text-lg tracking-tight">Recent registrations</h2>
        </div>
        <div className="card-soft rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <span className="text-sm font-medium">Newest members</span>
            <span className="text-xs text-muted-foreground">Last 8 sign-ups</span>
          </div>
          {data.recentRegistrations.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              No members yet.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.recentRegistrations.map((u, i) => {
                const name =
                  [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                  u.email.split("@")[0];
                return (
                  <div
                    key={u.id}
                    className="animate-fade-in-up flex items-center gap-3 px-5 py-3"
                    style={{ animationDelay: `${i * 35}ms` }}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-ink text-[11px] font-semibold text-cream">
                        {initials({
                          firstName: u.firstName,
                          lastName: u.lastName,
                          email: u.email,
                        })}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{name}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <Pill tone={planTone(u.plan)}>{planLabel(u.plan)}</Pill>
                    <p className="hidden text-[11px] text-muted-foreground/80 sm:block">
                      {timeAgo(u.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <p className="text-center text-[11px] text-muted-foreground/60">
        Snapshot generated {formatDate(new Date(), { day: "numeric", month: "long", year: "numeric" })}.
      </p>
    </div>
  );
}

function TopBusinessesCard({
  title,
  tone,
  businesses,
  onOpen,
  delayMs,
}: {
  title: string;
  tone: "views" | "followers";
  businesses: TopBusiness[];
  onOpen: (slug: string) => void;
  delayMs: number;
}) {
  const Icon = tone === "views" ? Eye : Heart;
  return (
    <div
      className="card-soft animate-fade-in-up rounded-xl border border-border bg-card p-5"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base tracking-tight">{title}</h3>
        <span className="text-[11px] text-muted-foreground">Top 5</span>
      </div>
      {businesses.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No businesses yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {businesses.map((b) => {
            const metric = tone === "views" ? b.views ?? 0 : b.followerCount ?? 0;
            return (
              <li key={b.id} className="flex items-center gap-3 py-2.5">
                <Avatar className="h-9 w-9 shrink-0">
                  {b.logoUrl ? (
                    <img
                      src={b.logoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-ink text-[11px] font-semibold text-cream">
                      {b.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <button
                  type="button"
                  onClick={() => onOpen(b.slug)}
                  className="link-underline min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-sm font-medium text-foreground">
                    {b.name}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {b.industry ?? "Uncategorised"}
                  </span>
                </button>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-foreground/5 px-2.5 py-1 text-[11px] font-medium text-foreground/70">
                  <Icon className="h-3 w-3 text-sage" />
                  {formatNumber(metric)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DistributionCard({
  title,
  rows,
  total,
  delayMs,
}: {
  title: string;
  rows: { label: string; value: number }[];
  total: number;
  delayMs: number;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div
      className="card-soft animate-fade-in-up rounded-xl border border-border bg-card p-5"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base tracking-tight">{title}</h3>
        <span className="text-[11px] text-muted-foreground">
          {formatNumber(total)} total
        </span>
      </div>
      <div className="space-y-4">
        {rows.map((r) => {
          const pct = total > 0 ? (r.value / total) * 100 : 0;
          const widthPct = max > 0 ? (r.value / max) * 100 : 0;
          return (
            <div key={r.label}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{r.label}</span>
                <span className="text-muted-foreground">
                  {formatNumber(r.value)}{" "}
                  <span className="text-muted-foreground/70">({pct.toFixed(0)}%)</span>
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-500",
                    "bg-sage",
                  )}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-32 rounded-2xl" />
      <div>
        <Skeleton className="mb-3 h-5 w-40" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="mb-3 h-5 w-32" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
