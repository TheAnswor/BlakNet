"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/blaknet/section";
import { Pill, VerifiedBadge } from "@/components/blaknet/badges";
import { StarRating } from "@/components/blaknet/star-rating";
import {
  EnquiryTrendChart,
  GrowthBarChart,
} from "@/components/blaknet/charts";
import { formatNumber, initials, timeAgo } from "@/lib/format";
import type { Plan, VerificationStatus } from "@/lib/types";
import {
  ArrowLeft,
  Eye,
  Activity,
  Star,
  Inbox,
  TrendingUp,
  BarChart3,
  Users,
  Sparkles,
  Crown,
  AlertCircle,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";

// ---------- types ----------
interface AnalyticsBusiness {
  id: string;
  name: string;
  slug: string;
  verificationStatus: VerificationStatus;
  plan: Plan;
  createdAt: string;
}

interface AnalyticsSummary {
  views: number;
  profileCompletion: number;
  totalReviews: number;
  totalFollowers: number;
  totalEnquiries: number;
  postsCount: number;
  eventsCount: number;
  avgRating: number;
}

interface AnalyticsGrowth {
  newEnquiries30d: number;
  newEnquiries7d: number;
  newFollowers30d: number;
  newReviews30d: number;
}

interface TrendPoint {
  date: string;
  count: number;
}

interface RecentEnquiry {
  id: string;
  name: string;
  company: string | null;
  enquiryType: string | null;
  status: string;
  createdAt: string;
}

interface RecentFollower {
  id: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

interface RecentReview {
  id: string;
  reviewerName: string;
  reviewerCompany: string | null;
  rating: number;
  review: string;
  createdAt: string;
}

interface AnalyticsData {
  business: AnalyticsBusiness;
  summary: AnalyticsSummary;
  growth: AnalyticsGrowth;
  trend: TrendPoint[];
  recentEnquiries: RecentEnquiry[];
  recentFollowers: RecentFollower[];
  recentReviews: RecentReview[];
}

type LoadState =
  | { kind: "loading" }
  | { kind: "not-found" }
  | { kind: "forbidden" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: AnalyticsData };

const ENQUIRY_TYPE_LABELS: Record<string, string> = {
  general: "General",
  procurement: "Procurement",
  partnership: "Partnership",
  service: "Service",
};

const STATUS_TONES: Record<string, "sage" | "neutral" | "ink" | "cream"> = {
  new: "ink",
  read: "neutral",
  responded: "sage",
  archived: "neutral",
};

const SUMMARY_CARDS: {
  key: keyof AnalyticsSummary;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  format?: (n: number) => string;
}[] = [
  { key: "views", label: "Profile views", icon: Eye, format: formatNumber },
  {
    key: "profileCompletion",
    label: "Profile completion",
    icon: Activity,
    format: (n) => `${n}%`,
  },
  {
    key: "avgRating",
    label: "Avg rating",
    icon: Star,
    format: (n) => (n > 0 ? n.toFixed(1) : "—"),
  },
  {
    key: "totalEnquiries",
    label: "Total enquiries",
    icon: Inbox,
    format: formatNumber,
  },
];

const GROWTH_CARDS: {
  key: keyof AnalyticsGrowth;
  label: string;
  window: string;
}[] = [
  { key: "newEnquiries7d", label: "New enquiries", window: "last 7 days" },
  { key: "newEnquiries30d", label: "New enquiries", window: "last 30 days" },
  { key: "newFollowers30d", label: "New followers", window: "last 30 days" },
  { key: "newReviews30d", label: "New reviews", window: "last 30 days" },
];

export function BusinessAnalyticsView() {
  const route = useApp((s) => s.route);
  if (route.name !== "dashboard-business-analytics") return null;
  // remount on id change so all state resets cleanly
  return <BusinessAnalytics key={route.id} id={route.id} />;
}

function BusinessAnalytics({ id }: { id: string }) {
  const navigate = useApp((s) => s.navigate);
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // resolve slug from the owner list
        const ownerList = await api<{ items: { id: string; slug: string }[] }>(
          "/api/businesses/owner",
        );
        const mine = (ownerList.items ?? []).find((b) => b.id === id);
        if (!mine) {
          if (!cancelled) setState({ kind: "not-found" });
          return;
        }
        const data = await api<AnalyticsData>(
          `/api/businesses/${encodeURIComponent(mine.slug)}/analytics`,
        );
        if (!cancelled) setState({ kind: "ready", data });
      } catch (err) {
        if (cancelled) return;
        const e = err as Error & { status?: number };
        if (e.status === 403) setState({ kind: "forbidden" });
        else if (e.status === 404) setState({ kind: "not-found" });
        else setState({ kind: "error", message: e.message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.kind === "loading") return <AnalyticsSkeleton />;
  if (state.kind === "not-found") {
    return (
      <EmptyState
        icon={BarChart3}
        title="Business not found"
        description="This business doesn't exist, or you don't have access to its analytics."
        action={
          <Button
            onClick={() => navigate({ name: "dashboard-businesses" })}
            className="bg-ink text-cream hover:bg-ink/90"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to my businesses
          </Button>
        }
      />
    );
  }
  if (state.kind === "forbidden") {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="You don't have access to these analytics."
        description="Only the business owner (and admins) can view performance dashboards."
        action={
          <Button
            onClick={() => navigate({ name: "dashboard-business", id })}
            className="bg-ink text-cream hover:bg-ink/90"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to business
          </Button>
        }
      />
    );
  }
  if (state.kind === "error") {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load analytics."
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
  const isIntelligence = data.business.plan === "INTELLIGENCE";

  return (
    <div className="space-y-8">
      {/* Back + heading */}
      <div>
        <button
          onClick={() => navigate({ name: "dashboard-business", id })}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {data.business.name}
        </button>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
            {data.business.name}
            <span className="ml-2 text-muted-foreground">Analytics</span>
          </h1>
          <VerifiedBadge status={data.business.verificationStatus} size="md" />
        </div>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Live performance dashboard for your business on BlakNet. Track views,
          enquiries, followers and reviews in one place.
        </p>
      </div>

      {/* Intelligence upsell banner */}
      {!isIntelligence && (
        <div className="flex flex-col gap-3 rounded-xl border border-sage/30 bg-sage/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink text-cream">
              <Crown className="h-4 w-4 text-sage" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">
                Analytics is an Intelligence plan feature.
              </p>
              <p className="text-xs text-muted-foreground">
                Upgrade to unlock live performance dashboards.
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate({ name: "dashboard-plan" })}
            className="bg-ink text-cream hover:bg-ink/90"
            size="sm"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Upgrade plan
          </Button>
        </div>
      )}

      {/* Summary stat cards */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-sage" />
          <h2 className="font-display text-lg tracking-tight">Performance</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {SUMMARY_CARDS.map((c, i) => {
            const Icon = c.icon;
            const raw = data.summary[c.key];
            const value = c.format ? c.format(raw) : formatNumber(raw);
            return (
              <div
                key={c.key}
                className="card-soft animate-fade-in-up rounded-xl border border-border bg-card p-5"
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-cream">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-4 font-display text-3xl tracking-tight text-ink">
                  {value}
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  {c.label}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Growth */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-sage" />
          <h2 className="font-display text-lg tracking-tight">Growth</h2>
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
              <p className="mt-1 text-xs text-muted-foreground">{g.window}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Growth — last 30 days (bar chart) */}
      <section className="card-soft animate-fade-in-up rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-sage" />
            <h2 className="font-display text-lg tracking-tight">
              Growth — last 30 days
            </h2>
          </div>
          <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
            New activity
          </span>
        </div>
        <GrowthBarChart
          data={[
            { name: "Enquiries 7d", value: data.growth.newEnquiries7d },
            { name: "Enquiries 30d", value: data.growth.newEnquiries30d },
            { name: "Followers 30d", value: data.growth.newFollowers30d },
            { name: "Reviews 30d", value: data.growth.newReviews30d },
          ]}
        />
      </section>

      {/* Enquiry trend chart (recharts Area) */}
      <section className="card-soft animate-fade-in-up rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-sage" />
            <h2 className="font-display text-lg tracking-tight">
              Enquiries — last 30 days
            </h2>
          </div>
          <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
            {formatNumber(data.trend.reduce((s, p) => s + p.count, 0))} total
          </span>
        </div>
        <EnquiryTrendChart data={data.trend} />
      </section>

      {/* Recent activity (enquiries + followers) */}
      <section className="grid gap-6 lg:grid-cols-2">
        <RecentEnquiriesCard enquiries={data.recentEnquiries} />
        <RecentFollowersCard followers={data.recentFollowers} />
      </section>

      {/* Recent reviews */}
      <RecentReviewsCard reviews={data.recentReviews} />

      <p className="text-center text-[11px] text-muted-foreground/60">
        Snapshot generated {timeAgo(new Date())}.
      </p>
    </div>
  );
}

// ---------- recent enquiries ----------
function RecentEnquiriesCard({ enquiries }: { enquiries: RecentEnquiry[] }) {
  return (
    <div className="card-soft animate-fade-in-up rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-sage" />
          <h3 className="font-display text-base tracking-tight">
            Recent enquiries
          </h3>
        </div>
        <span className="text-[11px] text-muted-foreground">Last 5</span>
      </div>
      {enquiries.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">
          No enquiries yet.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {enquiries.map((e) => {
            const typeLabel = e.enquiryType
              ? ENQUIRY_TYPE_LABELS[e.enquiryType] ?? e.enquiryType
              : "General";
            const tone = STATUS_TONES[e.status] ?? "neutral";
            return (
              <li
                key={e.id}
                className="flex flex-col gap-1.5 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {e.name}
                    {e.company && (
                      <span className="ml-1 text-muted-foreground">
                        · {e.company}
                      </span>
                    )}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Pill tone="neutral">{typeLabel}</Pill>
                    <Pill tone={tone} className="capitalize">
                      {e.status}
                    </Pill>
                  </div>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {timeAgo(e.createdAt)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------- recent followers ----------
function RecentFollowersCard({ followers }: { followers: RecentFollower[] }) {
  return (
    <div className="card-soft animate-fade-in-up rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-sage" />
          <h3 className="font-display text-base tracking-tight">
            Recent followers
          </h3>
        </div>
        <span className="text-[11px] text-muted-foreground">Last 5</span>
      </div>
      {followers.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">
          No followers yet.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {followers.map((f) => {
            const name =
              [f.user.firstName, f.user.lastName].filter(Boolean).join(" ") ||
              f.user.email.split("@")[0];
            return (
              <li key={f.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-ink text-[11px] font-semibold text-cream">
                    {initials(f.user)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {name}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {f.user.email}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {timeAgo(f.createdAt)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------- recent reviews ----------
function RecentReviewsCard({ reviews }: { reviews: RecentReview[] }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-sage" />
        <h2 className="font-display text-lg tracking-tight">Recent reviews</h2>
      </div>
      <div className="card-soft rounded-xl border border-border bg-card">
        {reviews.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No reviews yet.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {reviews.map((r, i) => (
              <li
                key={r.id}
                className="animate-fade-in-up px-5 py-4"
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {r.reviewerName}
                    </span>
                    {r.reviewerCompany && (
                      <span className="text-xs text-muted-foreground">
                        · {r.reviewerCompany}
                      </span>
                    )}
                  </div>
                  <StarRating rating={r.rating} showValue />
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                  {r.review}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/80">
                  {timeAgo(r.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ---------- skeleton ----------
function AnalyticsSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-4 w-40 rounded-md" />
        <Skeleton className="mt-3 h-9 w-72 rounded-md" />
        <Skeleton className="mt-2 h-4 w-full max-w-md rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-56 rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
