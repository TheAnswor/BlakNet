"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Pill } from "@/components/blaknet/badges";
import { EmptyState } from "@/components/blaknet/section";
import type { Business, Notification, Contact } from "@/lib/types";
import { timeAgo, initials } from "@/lib/format";
import {
  Building2,
  Users,
  Calendar,
  Bell,
  Plus,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  businesses: number;
  pendingVerifications: number;
  contacts: number;
  upcomingEvents: number;
  savedEvents: number;
  unreadNotifications: number;
  recentNotifications: Notification[];
  recentContacts: Contact[];
  plan: string;
  planStatus: string;
}

export function OverviewView() {
  const { authUser, navigate } = useApp();
  const [stats, setStats] = useState<Stats | null>(null);
  const [biz, setBiz] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<Stats>("/api/dashboard/stats").catch(() => null),
      api<{ items: Business[] }>("/api/businesses/owner").catch(() => ({ items: [] })),
    ]).then(([s, b]) => {
      if (s) setStats(s);
      setBiz(b?.items ?? []);
      setLoading(false);
    });
  }, []);

  const firstName = authUser?.firstName ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { label: "My Businesses", value: stats?.businesses ?? 0, icon: Building2, route: "dashboard-businesses" as const },
    { label: "Network Contacts", value: stats?.contacts ?? 0, icon: Users, route: "dashboard-network" as const },
    { label: "Upcoming Events", value: stats?.upcomingEvents ?? 0, icon: Calendar, route: "dashboard-events" as const },
    { label: "Notifications", value: stats?.unreadNotifications ?? 0, icon: Bell, route: "dashboard-notifications" as const },
  ];

  return (
    <div className="space-y-6">
      {/* greeting */}
      <div className="relative overflow-hidden rounded-2xl bg-ink-grain p-6 text-cream sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 opacity-20">
          <Sparkles className="h-40 w-40 text-sage" />
        </div>
        <div className="relative">
          <p className="text-sm text-cream/60">{greeting},</p>
          <h1 className="mt-1 font-display text-3xl tracking-tight sm:text-4xl">
            {firstName}.
          </h1>
          <p className="mt-2 max-w-lg text-sm text-cream/70">
            Here's what's happening with your BlakNet presence today.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => navigate({ name: "dashboard-business-new" })}
              className="btn-lift bg-cream text-ink shadow-lg hover:bg-cream/90"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add a business
            </Button>
            {biz.length > 0 && (
              <Button
                size="sm"
                onClick={() => navigate({ name: "dashboard-businesses" })}
                className="btn-lift border border-cream/20 bg-transparent text-cream/80 hover:bg-cream/10 hover:text-cream"
              >
                Manage businesses <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <button
            key={c.label}
            onClick={() => navigate({ name: c.route })}
            style={{ animationDelay: `${i * 60}ms` }}
            className="card-lift animate-fade-in-up group rounded-xl border border-border bg-card p-5 text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-cream shadow-sm">
                <c.icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-foreground/25 transition-all group-hover:translate-x-0.5 group-hover:text-ink" />
            </div>
            <div className="mt-4 font-display text-3xl tracking-tight">{c.value}</div>
            <div className="text-sm text-muted-foreground">{c.label}</div>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* my businesses */}
        <div className="lg:col-span-2">
          <div className="card-soft rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-display text-lg tracking-tight">My Businesses</h2>
              {biz.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => navigate({ name: "dashboard-business-new" })} className="btn-lift">
                  <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
              )}
            </div>
            <div className="p-5">
              {biz.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="You haven't added a business yet."
                  description="Create your free business profile to get discovered, collect reviews and start building your network."
                  action={
                    <Button onClick={() => navigate({ name: "dashboard-business-new" })} className="btn-lift bg-ink text-cream hover:bg-ink/90">
                      <Plus className="mr-1.5 h-4 w-4" /> Add your business
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {biz.map((b) => (
                    <BusinessRow key={b.id} b={b} onOpen={() => navigate({ name: "dashboard-business", id: b.id })} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* plan card */}
        <div className="space-y-6">
          <div className="card-soft rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg tracking-tight">Subscription</h2>
              <Pill tone={authUser?.plan === "STARTER" ? "neutral" : "sage"}>
                {authUser?.plan ?? "STARTER"}
              </Pill>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {authUser?.plan === "STARTER"
                ? "You're on the free plan. Upgrade to get verified and unlock procurement-grade features."
                : authUser?.plan === "VERIFIED"
                  ? "You're verified. Unlock the Intelligence suite for live analytics and API access."
                  : "You're on Intelligence. Full suite unlocked."}
            </p>
            <div className="mt-4">
              <Button
                onClick={() => navigate({ name: "dashboard-plan" })}
                className="btn-lift w-full bg-ink text-cream hover:bg-ink/90"
              >
                <TrendingUp className="mr-1.5 h-4 w-4" /> {authUser?.plan === "INTELLIGENCE" ? "Manage plan" : "Upgrade plan"}
              </Button>
            </div>
          </div>

          {/* recent notifications */}
          <div className="card-soft rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-display text-lg tracking-tight">Recent Activity</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate({ name: "dashboard-notifications" })}>
                View all
              </Button>
            </div>
            <div className="divide-y divide-border">
              {(stats?.recentNotifications ?? []).length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                  You're all caught up.
                </div>
              ) : (
                (stats?.recentNotifications ?? []).slice(0, 5).map((n) => (
                  <div key={n.id} className="flex items-start gap-3 px-5 py-3">
                    <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", n.read ? "bg-muted text-muted-foreground" : "bg-sage/15 text-sage")}>
                      <Bell className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight">{n.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                      <p className="mt-1 text-[11px] text-foreground/40">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BusinessRow({ b, onOpen }: { b: Business; onOpen: () => void }) {
  const verified = b.verificationStatus === "VERIFIED";
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-4 rounded-lg border border-border bg-background p-3.5 text-left transition-all hover:border-foreground/20 hover:bg-muted/40 hover:shadow-sm"
    >
      {b.logoUrl ? (
         
        <img src={b.logoUrl} alt={b.name} className="h-12 w-12 rounded-lg object-cover" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-ink font-display text-cream">
          {b.name[0]}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{b.name}</p>
          {verified ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sage">
              <ShieldCheck className="h-3 w-3" /> Verified
            </span>
          ) : b.verificationStatus === "PENDING" ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <Clock className="h-3 w-3" /> Pending
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/40">
              Not verified
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">{b.tagline || b.industry?.name || "—"}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex-1 max-w-[120px]">
            <Progress value={b.profileCompletion} className="h-1.5" />
          </div>
          <span className="text-[11px] text-muted-foreground">{b.profileCompletion}% complete</span>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-foreground/30" />
    </button>
  );
}
