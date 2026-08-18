"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Pill } from "@/components/blaknet/badges";
import { SectionHeading, EmptyState } from "@/components/blaknet/section";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { RESOURCE_CATEGORIES, RESOURCE_TYPES } from "@/lib/constants";
import type { Resource } from "@/lib/types";
import {
  FileText,
  BookOpen,
  LayoutTemplate,
  CheckSquare,
  PlayCircle,
  Users,
  ArrowRight,
  ChevronDown,
  Filter,
  Frown,
  Sparkles,
  Clock,
} from "lucide-react";

const TYPE_ICONS: Record<string, typeof FileText> = {
  article: FileText,
  guide: BookOpen,
  template: LayoutTemplate,
  checklist: CheckSquare,
  video: PlayCircle,
  workshop: Users,
};

function TypeIcon({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const Icon = TYPE_ICONS[type] ?? FileText;
  return <Icon className={className} />;
}

function typeLabel(value: string): string {
  return RESOURCE_TYPES.find((t) => t.value === value)?.label ?? value;
}

function categoryLabel(value: string): string {
  return RESOURCE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function ResourceCard({ resource }: { resource: Resource }) {
  const { navigate } = useApp();
  return (
    <button
      type="button"
      onClick={() => navigate({ name: "resource", slug: resource.slug })}
      className="card-lift group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left hover:border-foreground/25 hover:shadow-lg"
    >
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage/12 text-sage">
            <TypeIcon type={resource.resourceType} className="h-5 w-5" />
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Pill tone="sage">{typeLabel(resource.resourceType)}</Pill>
            <Pill tone="neutral">{categoryLabel(resource.category)}</Pill>
          </div>
          {resource.featured && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-cream px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ink">
              <Sparkles className="h-3 w-3" /> Featured
            </span>
          )}
        </div>
        <h3 className="mt-3 line-clamp-2 font-display text-lg leading-snug tracking-tight">
          {resource.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{resource.description}</p>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            {resource.author ? <span className="line-clamp-1">{resource.author}</span> : "BlakNet"}
            {resource.readMinutes != null && (
              <>
                <span className="text-foreground/30">·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {resource.readMinutes} min
                </span>
              </>
            )}
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-foreground/70 transition-colors group-hover:text-ink">
            Read <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </button>
  );
}

function GridSkeletons() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
          <Skeleton className="aspect-[16/7] w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface Filters {
  categories: string[];
  types: string[];
  featured: boolean;
}

function FilterSidebar({
  filters,
  setFilters,
  onClear,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  onClear: () => void;
}) {
  function toggleCategory(value: string) {
    setFilters({
      ...filters,
      categories: filters.categories.includes(value)
        ? filters.categories.filter((c) => c !== value)
        : [...filters.categories, value],
    });
  }
  function toggleType(value: string) {
    setFilters({
      ...filters,
      types: filters.types.includes(value)
        ? filters.types.filter((t) => t !== value)
        : [...filters.types, value],
    });
  }

  const activeCount =
    filters.categories.length + filters.types.length + (filters.featured ? 1 : 0);

  return (
    <div className="card-soft rounded-xl border border-border bg-card p-5 lg:sticky lg:top-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-sage">
          <Filter className="h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-ink px-1.5 text-[10px] text-cream">{activeCount}</span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear all
          </button>
        )}
      </div>

      <Separator className="mt-4" />

      {/* CATEGORY group */}
      <div className="mt-4">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Category
        </h3>
        <div className="space-y-1">
          {RESOURCE_CATEGORIES.map((c) => {
            const checked = filters.categories.includes(c.value);
            return (
              <label
                key={c.value}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/60",
                  checked && "bg-sage/[0.08]",
                )}
              >
                <Checkbox checked={checked} onCheckedChange={() => toggleCategory(c.value)} />
                <span
                  className={cn(
                    "text-foreground/80",
                    checked && "font-semibold text-foreground",
                  )}
                >
                  {c.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <Separator className="mt-4" />

      {/* TYPE group */}
      <div className="mt-4">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Type
        </h3>
        <div className="space-y-1">
          {RESOURCE_TYPES.map((t) => {
            const checked = filters.types.includes(t.value);
            return (
              <label
                key={t.value}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/60",
                  checked && "bg-sage/[0.08]",
                )}
              >
                <Checkbox checked={checked} onCheckedChange={() => toggleType(t.value)} />
                <span
                  className={cn(
                    "text-foreground/80",
                    checked && "font-semibold text-foreground",
                  )}
                >
                  {t.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <Separator className="mt-4" />

      <div className="mt-4">
        <label
          className={cn(
            "flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/60",
            filters.featured && "bg-sage/[0.08]",
          )}
        >
          <Checkbox
            checked={filters.featured}
            onCheckedChange={(v) => setFilters({ ...filters, featured: v === true })}
          />
          <span
            className={cn(
              "text-foreground/80",
              filters.featured && "font-semibold text-foreground",
            )}
          >
            Featured only
          </span>
        </label>
      </div>
    </div>
  );
}

function MobileFilterPanel({
  filters,
  setFilters,
  onClear,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const activeCount =
    filters.categories.length + filters.types.length + (filters.featured ? 1 : 0);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-6 lg:hidden">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="mr-1.5 h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <span className="ml-1.5 rounded-full bg-ink px-1.5 text-[10px] text-cream">
                {activeCount}
              </span>
            )}
            <ChevronDown
              className={"ml-1.5 h-4 w-4 transition-transform " + (open ? "rotate-180" : "")}
            />
          </Button>
        </CollapsibleTrigger>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        )}
      </div>
      <CollapsibleContent className="mt-3">
        <FilterSidebar filters={filters} setFilters={setFilters} onClear={onClear} />
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ResourcesView() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ categories: [], types: [], featured: false });
  const [reloadKey, setReloadKey] = useState(0);

  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await api<{ items: Resource[] }>("/api/resources");
        if (!cancelled) {
          setResources(d.items ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load resources.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      if (filters.featured && !r.featured) return false;
      if (filters.categories.length && !filters.categories.includes(r.category)) return false;
      if (filters.types.length && !filters.types.includes(r.resourceType)) return false;
      return true;
    });
  }, [resources, filters]);

  const clearFilters = () =>
    setFilters({ categories: [], types: [], featured: false });

  return (
    <div className="flex flex-col">
      {/* HEADER */}
      <section className="bg-cream-grain">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <SectionHeading
            eyebrow="Resources"
            title="Practical resources for Black-owned businesses."
            description="Guides, templates, checklists and workshops — practical, no-fluff, built for South African entrepreneurs."
          />
        </div>
      </section>

      {/* BODY */}
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <MobileFilterPanel
            filters={filters}
            setFilters={setFilters}
            onClear={clearFilters}
          />

          <div className="flex gap-8">
            <aside className="hidden w-64 shrink-0 lg:block">
              <FilterSidebar
                filters={filters}
                setFilters={setFilters}
                onClear={clearFilters}
              />
            </aside>

            <div className="min-w-0 flex-1">
              {loading ? (
                <GridSkeletons />
              ) : error ? (
                <EmptyState
                  icon={Frown}
                  title="Couldn't load resources"
                  description={error}
                  action={
                    <Button variant="outline" onClick={reload}>
                      Try again
                    </Button>
                  }
                />
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon={Frown}
                  title="No resources match your filters."
                  description="Try clearing some filters, or explore other categories."
                  action={
                    (filters.categories.length > 0 ||
                      filters.types.length > 0 ||
                      filters.featured) && (
                      <Button variant="outline" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    )
                  }
                />
              ) : (
                <>
                  <div className="mb-5 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {filtered.length} resource{filtered.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((r, i) => (
                      <div
                        key={r.id}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <ResourceCard resource={r} />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
