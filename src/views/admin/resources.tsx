"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill } from "@/components/blaknet/badges";
import { EmptyState } from "@/components/blaknet/section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatNumber } from "@/lib/format";
import {
  BookOpen,
  Clock,
  Star,
  User,
  AlertCircle,
} from "lucide-react";
import type { Resource } from "@/lib/types";

interface ResourcesResponse {
  items: Resource[];
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: Resource[] };

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All categories" },
  { value: "starting", label: "Starting" },
  { value: "compliance", label: "Compliance" },
  { value: "bbbee", label: "B-BBEE" },
  { value: "finance", label: "Finance" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "operations", label: "Operations" },
  { value: "hr", label: "HR" },
  { value: "legal", label: "Legal" },
  { value: "procurement", label: "Procurement" },
  { value: "funding", label: "Funding" },
  { value: "strategy", label: "Strategy" },
  { value: "technology", label: "Technology" },
];

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "article", label: "Article" },
  { value: "guide", label: "Guide" },
  { value: "template", label: "Template" },
  { value: "checklist", label: "Checklist" },
  { value: "video", label: "Video" },
  { value: "workshop", label: "Workshop" },
];

function typeTone(type: string): "sage" | "ink" | "cream" | "neutral" {
  switch (type) {
    case "guide":
    case "template":
      return "sage";
    case "checklist":
      return "cream";
    case "video":
    case "workshop":
      return "ink";
    default:
      return "neutral";
  }
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function AdminResourcesView() {
  const { navigate } = useApp();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [category, setCategory] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api<ResourcesResponse>("/api/resources");
        if (!cancelled) setState({ kind: "ready", items: data.items ?? [] });
      } catch (err) {
        if (cancelled) return;
        const e = err as Error;
        setState({ kind: "error", message: e.message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const filtered = useMemo(() => {
    if (state.kind !== "ready") return [];
    return state.items.filter((r) => {
      const okCat = category === "all" || r.category === category;
      const okType = type === "all" || r.resourceType === type;
      return okCat && okType;
    });
  }, [state, category, type]);

  if (state.kind === "loading") {
    return <ResourcesSkeleton />;
  }
  if (state.kind === "error") {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load resources."
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

  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <Pill tone="sage" className="mb-2">
          <BookOpen className="h-3 w-3" /> Knowledge
        </Pill>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Resources</h1>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Manage knowledge base resources.
        </p>
      </div>

      {/* filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-9 w-full sm:w-[200px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-9 w-full sm:w-[180px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{formatNumber(filtered.length)}</span>{" "}
          {filtered.length === 1 ? "resource" : "resources"}
        </p>
      </div>

      {/* note */}
      <p className="text-xs italic text-muted-foreground">
        Resource creation coming soon.
      </p>

      {/* list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No resources found."
          description="Try a different filter, or check back once resources are seeded."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Resource</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Author</th>
                  <th className="px-5 py-3 text-right font-medium">Read</th>
                  <th className="px-5 py-3 font-medium">Published</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r, i) => (
                  <ResourceRow
                    key={r.id}
                    resource={r}
                    delayMs={i * 30}
                    onOpen={() => navigate({ name: "resource", slug: r.slug })}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden">
            {filtered.map((r, i) => (
              <ResourceCard
                key={r.id}
                resource={r}
                delayMs={i * 30}
                onOpen={() => navigate({ name: "resource", slug: r.slug })}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ResourceRow({
  resource,
  delayMs,
  onOpen,
}: {
  resource: Resource;
  delayMs: number;
  onOpen: () => void;
}) {
  return (
    <tr className="animate-fade-in-up hover:bg-muted/30" style={{ animationDelay: `${delayMs}ms` }}>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpen}
            className="text-left font-medium text-foreground transition-colors hover:text-sage"
          >
            {resource.title}
          </button>
          {resource.featured && (
            <Star className="h-3.5 w-3.5 fill-sage text-sage" aria-label="Featured" />
          )}
        </div>
      </td>
      <td className="px-5 py-3">
        <Pill tone={typeTone(resource.resourceType)}>{titleCase(resource.resourceType)}</Pill>
      </td>
      <td className="px-5 py-3">
        <Pill tone="neutral">{titleCase(resource.category)}</Pill>
      </td>
      <td className="px-5 py-3 text-muted-foreground">
        {resource.author ? (
          <span className="inline-flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {resource.author}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="px-5 py-3 text-right text-muted-foreground">
        {resource.readMinutes ? (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {resource.readMinutes}m
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="px-5 py-3 text-muted-foreground">{formatDate(resource.createdAt)}</td>
    </tr>
  );
}

function ResourceCard({
  resource,
  delayMs,
  onOpen,
}: {
  resource: Resource;
  delayMs: number;
  onOpen: () => void;
}) {
  return (
    <div
      className="animate-fade-in-up rounded-xl border border-border bg-card p-4"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={onOpen}
          className="text-left font-display text-lg tracking-tight hover:text-sage"
        >
          {resource.title}
        </button>
        {resource.featured && (
          <Star className="mt-1 h-4 w-4 shrink-0 fill-sage text-sage" aria-label="Featured" />
        )}
      </div>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{resource.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Pill tone={typeTone(resource.resourceType)}>{titleCase(resource.resourceType)}</Pill>
        <Pill tone="neutral">{titleCase(resource.category)}</Pill>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
        {resource.author && (
          <span className="inline-flex items-center gap-1">
            <User className="h-3 w-3" /> {resource.author}
          </span>
        )}
        {resource.readMinutes ? (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {resource.readMinutes} min read
          </span>
        ) : null}
        <span className="ml-auto">{formatDate(resource.createdAt)}</span>
      </div>
    </div>
  );
}

function ResourcesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-9 w-40 rounded-md" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-[200px] rounded-md" />
        <Skeleton className="h-9 w-[180px] rounded-md" />
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-0"
          >
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-48 rounded-md" />
              <Skeleton className="h-3 w-32 rounded-md" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
