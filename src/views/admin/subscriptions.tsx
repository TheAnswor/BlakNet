"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { api, qs } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pill } from "@/components/blaknet/badges";
import { EmptyState } from "@/components/blaknet/section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatNumber, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Plan, SubscriptionStatus } from "@/lib/types";
import {
  CreditCard,
  Crown,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Calendar,
} from "lucide-react";

interface SubscriptionUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface AdminSubscription {
  id: string;
  plan: Plan;
  status: SubscriptionStatus;
  provider: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  user: SubscriptionUser;
}

interface SubscriptionsResponse {
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  summary: {
    byPlan: Record<string, number>;
    byStatus: Record<string, number>;
  };
  items: AdminSubscription[];
}

type LoadState =
  | { kind: "loading" }
  | { kind: "forbidden" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: SubscriptionsResponse };

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "FREE", label: "Free" },
  { value: "PAST_DUE", label: "Past due" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "EXPIRED", label: "Expired" },
];

function planTone(plan: Plan): "ink" | "sage" | "neutral" {
  switch (plan) {
    case "INTELLIGENCE":
      return "ink";
    case "VERIFIED":
      return "sage";
    default:
      return "neutral";
  }
}

function planLabel(plan: Plan): string {
  switch (plan) {
    case "INTELLIGENCE":
      return "Intelligence";
    case "VERIFIED":
      return "Verified";
    case "STARTER":
      return "Starter";
    default:
      return plan;
  }
}

function statusTone(status: SubscriptionStatus): "ink" | "sage" | "cream" | "neutral" {
  switch (status) {
    case "ACTIVE":
      return "sage";
    case "FREE":
      return "neutral";
    case "PAST_DUE":
      return "cream";
    case "CANCELLED":
    case "EXPIRED":
      return "neutral";
    default:
      return "neutral";
  }
}

function statusLabel(status: SubscriptionStatus): string {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "FREE":
      return "Free";
    case "PAST_DUE":
      return "Past due";
    case "CANCELLED":
      return "Cancelled";
    case "EXPIRED":
      return "Expired";
    default:
      return status;
  }
}

export function AdminSubscriptionsView() {
  const { navigate } = useApp();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [status, setStatus] = useState<"" | SubscriptionStatus>("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const path = `/api/admin/subscriptions${qs({
          status,
          page,
          pageSize: PAGE_SIZE,
        })}`;
        const data = await api<SubscriptionsResponse>(path);
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
  }, [status, page, reloadKey]);

  const onStatusChange = (value: string) => {
    setStatus((value === "all" ? "" : value) as typeof status);
    setPage(1);
    setState({ kind: "loading" });
  };

  if (state.kind === "loading") {
    return <SubscriptionsSkeleton />;
  }
  if (state.kind === "forbidden") {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Admin access required."
        description="You need an admin account to view subscriptions."
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
        title="Couldn't load subscriptions."
        description={state.message}
        action={
          <Button
            variant="outline"
            onClick={() => {
              setState({ kind: "loading" });
              setReloadKey((k) => k + 1);
            }}
          >
            Try again
          </Button>
        }
      />
    );
  }

  const { data } = state;
  const items = data.items;
  const byPlan = data.summary.byPlan;
  const byStatus = data.summary.byStatus;
  const totalActive = (byStatus["ACTIVE"] ?? 0) + (byStatus["PAST_DUE"] ?? 0);
  const verifiedCount = byPlan["VERIFIED"] ?? 0;
  const intelligenceCount = byPlan["INTELLIGENCE"] ?? 0;

  const start = (data.page - 1) * data.pageSize;
  const end = Math.min(start + items.length, data.total);

  const summaryCards = [
    {
      label: "Total active",
      value: totalActive,
      subtitle: "Active + past due subscriptions",
      icon: CreditCard,
      tone: "ink" as const,
    },
    {
      label: "Verified plan",
      value: verifiedCount,
      subtitle: "Verified subscriptions",
      icon: Crown,
      tone: "sage" as const,
    },
    {
      label: "Intelligence plan",
      value: intelligenceCount,
      subtitle: "Intelligence subscriptions",
      icon: TrendingUp,
      tone: "ink" as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <Pill tone="sage" className="mb-2">
          <CreditCard className="h-3 w-3" /> Revenue
        </Pill>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Subscriptions</h1>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Monitor plan subscriptions and revenue across BlakNet.
        </p>
      </div>

      {/* summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map((c, i) => (
          <SummaryCard
            key={c.label}
            icon={c.icon}
            value={c.value}
            label={c.label}
            subtitle={c.subtitle}
            tone={c.tone}
            delayMs={i * 60}
          />
        ))}
      </div>

      {/* filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={status || "all"} onValueChange={onStatusChange}>
          <SelectTrigger className="h-9 w-full sm:w-[200px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {data.total === 0
            ? "No subscriptions found."
            : `Showing ${start + 1}–${end} of ${formatNumber(data.total)} subscriptions`}
        </p>
      </div>

      {/* list */}
      {items.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No subscriptions found."
          description="Subscriptions will appear here once users upgrade their plans."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Provider</th>
                  <th className="px-5 py-3 font-medium">Started</th>
                  <th className="px-5 py-3 font-medium">Renews</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((s, i) => (
                  <SubscriptionRow key={s.id} sub={s} delayMs={i * 40} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden">
            {items.map((s, i) => (
              <SubscriptionCard key={s.id} sub={s} delayMs={i * 40} />
            ))}
          </div>

          {/* pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Page {data.page} of {data.pages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={data.page <= 1}
                >
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={data.page >= data.pages}
                >
                  Next <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  value,
  label,
  subtitle,
  tone,
  delayMs,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  subtitle: string;
  tone: "ink" | "sage";
  delayMs: number;
}) {
  return (
    <div
      className="animate-fade-in-up rounded-xl border border-border bg-card p-5"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          tone === "sage" ? "bg-sage/15 text-sage" : "bg-ink text-cream",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 font-display text-3xl tracking-tight">{formatNumber(value)}</div>
      <div className="text-sm font-medium">{label}</div>
      <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
    </div>
  );
}

function SubscriptionRow({ sub, delayMs }: { sub: AdminSubscription; delayMs: number }) {
  const name =
    [sub.user.firstName, sub.user.lastName].filter(Boolean).join(" ") ||
    sub.user.email.split("@")[0];
  return (
    <tr className="animate-fade-in-up hover:bg-muted/30" style={{ animationDelay: `${delayMs}ms` }}>
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-ink text-[11px] font-semibold text-cream">
              {initials(sub.user)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{sub.user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3">
        <Pill tone={planTone(sub.plan)}>{planLabel(sub.plan)}</Pill>
      </td>
      <td className="px-5 py-3">
        <Pill tone={statusTone(sub.status)}>{statusLabel(sub.status)}</Pill>
      </td>
      <td className="px-5 py-3">
        {sub.provider ? (
          <span className="font-mono text-xs">{sub.provider}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-5 py-3 text-muted-foreground">
        {sub.startDate ? formatDate(sub.startDate) : "—"}
      </td>
      <td className="px-5 py-3 text-muted-foreground">
        {sub.endDate ? formatDate(sub.endDate) : "—"}
      </td>
    </tr>
  );
}

function SubscriptionCard({ sub, delayMs }: { sub: AdminSubscription; delayMs: number }) {
  const name =
    [sub.user.firstName, sub.user.lastName].filter(Boolean).join(" ") ||
    sub.user.email.split("@")[0];
  return (
    <div
      className="animate-fade-in-up rounded-xl border border-border bg-card p-4"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-ink text-xs font-semibold text-cream">
            {initials(sub.user)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{sub.user.email}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Pill tone={planTone(sub.plan)}>{planLabel(sub.plan)}</Pill>
        <Pill tone={statusTone(sub.status)}>{statusLabel(sub.status)}</Pill>
        {sub.provider && <Pill tone="neutral">{sub.provider}</Pill>}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" /> Started {sub.startDate ? formatDate(sub.startDate) : "—"}
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" /> Renews {sub.endDate ? formatDate(sub.endDate) : "—"}
        </div>
      </div>
    </div>
  );
}

function SubscriptionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-9 w-40 rounded-md" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-[200px] rounded-md" />
        <Skeleton className="h-4 w-48 rounded-md" />
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-0">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-40 rounded-md" />
              <Skeleton className="h-3 w-60 rounded-md" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
