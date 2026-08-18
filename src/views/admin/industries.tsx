"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill } from "@/components/blaknet/badges";
import { EmptyState } from "@/components/blaknet/section";
import { formatNumber } from "@/lib/format";
import {
  Sparkles,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Building2,
} from "lucide-react";

interface AdminSubIndustry {
  id: string;
  name: string;
  slug: string;
}

interface AdminIndustry {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  businessCount: number;
  subIndustries: AdminSubIndustry[];
}

interface IndustriesResponse {
  items: AdminIndustry[];
}

type LoadState =
  | { kind: "loading" }
  | { kind: "forbidden" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: AdminIndustry[] };

export function AdminIndustriesView() {
  const { navigate } = useApp();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api<IndustriesResponse>("/api/admin/industries");
        if (!cancelled) setState({ kind: "ready", items: data.items ?? [] });
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
  }, [reloadKey]);

  if (state.kind === "loading") {
    return <IndustriesSkeleton />;
  }
  if (state.kind === "forbidden") {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Admin access required."
        description="You need an admin account to manage industries."
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
        title="Couldn't load industries."
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

  const items = state.items;
  const totalBusinesses = items.reduce((sum, i) => sum + i.businessCount, 0);

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Pill tone="sage" className="mb-2">
            <Sparkles className="h-3 w-3" /> Categories
          </Pill>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Industries</h1>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Manage industry categories and sub-industries on BlakNet.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
          <Building2 className="h-4 w-4 text-sage" />
          <span className="font-display text-2xl tracking-tight">
            {formatNumber(totalBusinesses)}
          </span>
          <span className="text-xs text-muted-foreground">businesses</span>
        </div>
      </div>

      {/* summary row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">{formatNumber(items.length)}</span> industries
        </span>
        <span className="text-foreground/30">·</span>
        <span>
          <span className="font-medium text-foreground">
            {formatNumber(items.reduce((s, i) => s + i.subIndustries.length, 0))}
          </span>{" "}
          sub-industries
        </span>
        <span className="text-foreground/30">·</span>
        <span className="italic">Editing industries is coming soon.</span>
      </div>

      {/* grid */}
      {items.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No industries yet."
          description="Industries will appear here once seeded in the database."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((ind, i) => (
            <IndustryCard key={ind.id} industry={ind} delayMs={i * 40} />
          ))}
        </div>
      )}
    </div>
  );
}

function IndustryCard({
  industry,
  delayMs,
}: {
  industry: AdminIndustry;
  delayMs: number;
}) {
  return (
    <div
      className="animate-fade-in-up flex flex-col rounded-xl border border-border bg-card p-5"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl tracking-tight">{industry.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">/{industry.slug}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink text-cream">
          <Sparkles className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-display text-3xl tracking-tight">
          {formatNumber(industry.businessCount)}
        </span>
        <span className="text-xs text-muted-foreground">
          {industry.businessCount === 1 ? "business" : "businesses"}
        </span>
      </div>

      {industry.subIndustries.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Sub-industries
          </p>
          <div className="flex flex-wrap gap-1.5">
            {industry.subIndustries.map((s) => (
              <Pill key={s.id} tone="neutral">
                {s.name}
              </Pill>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs italic text-muted-foreground">No sub-industries.</p>
      )}
    </div>
  );
}

function IndustriesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-9 w-40 rounded-md" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>
      <Skeleton className="h-4 w-72 rounded-md" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
