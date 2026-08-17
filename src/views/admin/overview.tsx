"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pill } from "@/components/blaknet/badges";
import { EmptyState } from "@/components/blaknet/section";
import { timeAgo, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Users,
  Building2,
  ShieldCheck,
  Clock,
  CreditCard,
  Newspaper,
  Calendar,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface RecentRegistration {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
}

interface OverviewStats {
  users: number;
  businesses: number;
  verifiedBusinesses: number;
  pendingVerifications: number;
  activeSubscriptions: number;
  posts: number;
  events: number;
  recentRegistrations: RecentRegistration[];
}

type LoadState =
  | { kind: "loading" }
  | { kind: "forbidden" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: OverviewStats };

export function AdminOverviewView() {
  const { navigate } = useApp();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api<OverviewStats>("/api/admin/overview");
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

  if (state.kind === "loading") {
    return <OverviewSkeleton />;
  }
  if (state.kind === "forbidden") {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Admin access required."
        description="You need an admin account to view this section."
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
        title="Couldn't load overview."
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

  const cards = [
    { label: "Total users", value: data.users, icon: Users, subtitle: "Registered members" },
    { label: "Total businesses", value: data.businesses, icon: Building2, subtitle: "Listed on BlakNet" },
    { label: "Verified businesses", value: data.verifiedBusinesses, icon: ShieldCheck, subtitle: "CIPC / B-BBEE verified", accent: true },
    { label: "Pending verifications", value: data.pendingVerifications, icon: Clock, subtitle: "Awaiting review", warn: true },
    { label: "Active subscriptions", value: data.activeSubscriptions, icon: CreditCard, subtitle: "Verified + Intelligence" },
    { label: "Newsfeed posts", value: data.posts, icon: Newspaper, subtitle: "Community posts" },
  ];

  return (
    <div className="space-y-6">
      {/* header greeting */}
      <div className="relative overflow-hidden rounded-2xl bg-ink-grain p-6 text-cream sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 opacity-20">
          <Sparkles className="h-40 w-40 text-sage" />
        </div>
        <div className="relative">
          <Pill tone="sage" className="mb-3">
            <ShieldCheck className="h-3 w-3" /> Admin
          </Pill>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Platform overview.</h1>
          <p className="mt-2 max-w-lg text-sm text-cream/70">
            A snapshot of BlakNet&apos;s network — businesses, members, verifications and revenue.
          </p>
        </div>
      </div>

      {/* stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const showWarn = c.warn && c.value > 0;
          return (
            <div key={c.label} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    showWarn || c.accent ? "bg-sage/15 text-sage" : "bg-ink text-cream",
                  )}
                >
                  <c.icon className="h-5 w-5" />
                </div>
                {c.accent && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-sage">
                    <ShieldCheck className="h-3 w-3" /> verified
                  </span>
                )}
                {showWarn && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-sage">
                    <Clock className="h-3 w-3" /> review
                  </span>
                )}
              </div>
              <div className="mt-4 font-display text-3xl tracking-tight">{c.value}</div>
              <div className="text-sm font-medium">{c.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{c.subtitle}</div>
            </div>
          );
        })}
      </div>

      {/* pending callout + events mini-card */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {data.pendingVerifications > 0 ? (
            <div className="flex flex-col gap-4 rounded-xl border border-sage/30 bg-sage/5 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage/15 text-sage">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-xl tracking-tight">
                    {data.pendingVerifications}{" "}
                    {data.pendingVerifications === 1 ? "business" : "businesses"} awaiting verification
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Review submitted documents and approve verified businesses.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate({ name: "admin-verification" })}
                className="bg-ink text-cream hover:bg-ink/90"
              >
                Review queue <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage/15 text-sage">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-lg tracking-tight">All caught up.</p>
                <p className="mt-0.5 text-sm text-muted-foreground">No pending verifications.</p>
              </div>
            </div>
          )}
        </div>

        {/* events mini-card */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-cream">
              <Calendar className="h-5 w-5" />
            </div>
            <Pill tone="neutral">All events</Pill>
          </div>
          <div className="mt-4 font-display text-3xl tracking-tight">{data.events}</div>
          <div className="text-sm font-medium">Total events</div>
          <div className="mt-1 text-xs text-muted-foreground">Community + partner events</div>
        </div>
      </div>

      {/* recent registrations */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-lg tracking-tight">Recent registrations</h2>
          <span className="text-xs text-muted-foreground">Newest 8 members</span>
        </div>
        <div className="divide-y divide-border">
          {data.recentRegistrations.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">No members yet.</div>
          ) : (
            data.recentRegistrations.map((u) => {
              const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email.split("@")[0];
              return (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-ink text-[11px] font-semibold text-cream">
                      {initials(u)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <p className="text-[11px] text-foreground/40">{timeAgo(u.createdAt)}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
