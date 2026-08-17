"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { api, qs } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { SectionHeading, EmptyState } from "@/components/blaknet/section";
import { BusinessCard, BusinessCardSkeleton } from "@/components/blaknet/business-card";
import { PROVINCES, BUSINESS_SIZES, BBBEE_LEVELS } from "@/lib/constants";
import type { Business, Industry } from "@/lib/types";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  X,
  Frown,
  ArrowRight,
  ArrowLeft,
  Building2,
} from "lucide-react";

// ---------- types ----------
type SortKey = "relevance" | "newest" | "viewed" | "verified";

interface DirectoryItem extends Business {
  rating: number;
  reviewCount: number;
}

interface DirectoryResponse {
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  items: DirectoryItem[];
}

interface IndustryWithCount extends Industry {
  count: number;
}

interface FiltersState {
  q: string;
  industry: string[];
  province: string[];
  size: string[];
  bbbee: string[];
  verified: boolean;
}

const EMPTY_FILTERS: FiltersState = {
  q: "",
  industry: [],
  province: [],
  size: [],
  bbbee: [],
  verified: false,
};

const SORTS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "viewed", label: "Most viewed" },
  { value: "verified", label: "Verified first" },
];

const PAGE_SIZE = 12;
const SEARCH_KEY = "blaknet:directory-search";

export function DirectoryView() {
  const { navigate } = useApp();

  // industries list (with counts) for filter sidebar
  const [industries, setIndustries] = useState<IndustryWithCount[]>([]);

  // search prefill (read once via lazy initializer; pulled from sessionStorage set by home hero / header)
  const [initialSearch] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const stored = window.sessionStorage.getItem(SEARCH_KEY);
    if (stored) {
      window.sessionStorage.removeItem(SEARCH_KEY);
      return stored;
    }
    return "";
  });

  // filters + sort + page
  const [filters, setFilters] = useState<FiltersState>(() =>
    initialSearch ? { ...EMPTY_FILTERS, q: initialSearch } : EMPTY_FILTERS,
  );
  const [qInput, setQInput] = useState(initialSearch);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [page, setPage] = useState(1);

  // results
  const [data, setData] = useState<DirectoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // ---------- fetch industries (once) ----------
  useEffect(() => {
    api<{ industries: IndustryWithCount[] }>("/api/industries")
      .then((d) => setIndustries(d.industries ?? []))
      .catch(() => setIndustries([]));
  }, []);

  // ---------- debounce q → filters.q (+ reset page) ----------
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => (f.q === qInput ? f : { ...f, q: qInput }));
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [qInput]);

  // ---------- fetch results ----------
  useEffect(() => {
    let cancelled = false;
    // setLoading(true) at the start of a fetch cycle to drive skeleton UI.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const path = `/api/businesses${qs({
      q: filters.q || undefined,
      industry: filters.industry,
      province: filters.province,
      size: filters.size,
      bbbee: filters.bbbee,
      verified: filters.verified ? "1" : undefined,
      sort,
      page,
      pageSize: PAGE_SIZE,
    })}`;
    api<DirectoryResponse>(path)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters, sort, page]);

  // ---------- handlers (event-driven → setState allowed here) ----------
  const toggleArrayFilter = (key: "industry" | "province" | "size" | "bbbee", value: string) => {
    setFilters((f) => {
      const arr = f[key];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...f, [key]: next };
    });
    setPage(1);
  };

  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setQInput("");
    setPage(1);
  };

  // ---------- active filter chips ----------
  const industryLookup = useMemo(() => {
    const m = new Map<string, IndustryWithCount>();
    industries.forEach((i) => m.set(i.slug, i));
    return m;
  }, [industries]);

  const sizeLookup = useMemo(() => {
    const m = new Map<string, string>();
    BUSINESS_SIZES.forEach((s) => m.set(s.value, s.label));
    return m;
  }, []);

  const activeChips: { label: string; onRemove: () => void }[] = [];
  if (filters.q) {
    activeChips.push({
      label: `“${filters.q}”`,
      onRemove: () => {
        setQInput("");
        setFilters((f) => ({ ...f, q: "" }));
        setPage(1);
      },
    });
  }
  filters.industry.forEach((slug) => {
    const i = industryLookup.get(slug);
    if (!i) return;
    activeChips.push({
      label: i.name,
      onRemove: () => toggleArrayFilter("industry", slug),
    });
  });
  filters.province.forEach((p) =>
    activeChips.push({
      label: p,
      onRemove: () => toggleArrayFilter("province", p),
    }),
  );
  filters.size.forEach((s) =>
    activeChips.push({
      label: sizeLookup.get(s) ?? s,
      onRemove: () => toggleArrayFilter("size", s),
    }),
  );
  filters.bbbee.forEach((b) =>
    activeChips.push({
      label: b,
      onRemove: () => toggleArrayFilter("bbbee", b),
    }),
  );
  if (filters.verified) {
    activeChips.push({
      label: "Verified only",
      onRemove: () => { setFilters((f) => ({ ...f, verified: false })); setPage(1); },
    });
  }

  const hasFilters = activeChips.length > 0;
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 0;
  const items = data?.items ?? [];
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  // ---------- sidebar contents (reused for desktop + mobile sheet) ----------
  const sidebar = (
    <div className="flex flex-col gap-6">
      <FilterSection title="Industry">
        {industries.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {industries.map((i) => (
              <FilterCheckbox
                key={i.id}
                label={i.name}
                count={i.count}
                checked={filters.industry.includes(i.slug)}
                onToggle={() => toggleArrayFilter("industry", i.slug)}
              />
            ))}
          </div>
        )}
      </FilterSection>

      <FilterSection title="Province">
        <div className="space-y-2">
          {PROVINCES.map((p) => (
            <FilterCheckbox
              key={p}
              label={p}
              checked={filters.province.includes(p)}
              onToggle={() => toggleArrayFilter("province", p)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Business Size">
        <div className="space-y-2">
          {BUSINESS_SIZES.map((s) => (
            <FilterCheckbox
              key={s.value}
              label={s.label}
              checked={filters.size.includes(s.value)}
              onToggle={() => toggleArrayFilter("size", s.value)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="B-BBEE Level">
        <div className="space-y-2">
          {BBBEE_LEVELS.map((l) => (
            <FilterCheckbox
              key={l}
              label={l}
              checked={filters.bbbee.includes(l)}
              onToggle={() => toggleArrayFilter("bbbee", l)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Trust">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
          <div className="flex flex-col">
            <span className="text-sm font-medium">Verified only</span>
            <span className="text-[11px] text-muted-foreground">Show CIPC-verified businesses</span>
          </div>
          <Switch
            checked={filters.verified}
            onCheckedChange={(c) => { setFilters((f) => ({ ...f, verified: c })); setPage(1); }}
          />
        </div>
      </FilterSection>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="justify-start text-muted-foreground">
          <X className="mr-1.5 h-3.5 w-3.5" /> Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col">
      {/* ===== HEADER BAND ===== */}
      <section className="bg-cream-grain">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeading
            eyebrow="Business Directory"
            title={<>Find Black-owned businesses ready to work.</>}
            description="Search and filter verified, Black-owned businesses across South Africa by industry, province, B-BBEE level and verification status."
          />
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1">
              <Building2 className="h-3.5 w-3.5 text-sage" />
              {loading ? "Loading…" : `${formatCount(total)} businesses`}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1">
              <MapPin className="h-3.5 w-3.5 text-sage" /> {PROVINCES.length} provinces
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1">
              <SlidersHorizontal className="h-3.5 w-3.5 text-sage" /> {industries.length || "—"} industries
            </span>
          </div>
        </div>
      </section>

      {/* ===== BODY ===== */}
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            {/* ===== SIDEBAR (desktop) ===== */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto scroll-elegant pr-2">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-xl tracking-tight">Filters</h2>
                  {hasFilters && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-[11px] font-medium uppercase tracking-wider text-sage hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <Separator className="mb-5" />
                {sidebar}
              </div>
            </aside>

            {/* ===== RESULTS COLUMN ===== */}
            <div className="flex flex-col gap-5">
              {/* search + sort row */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={qInput}
                    onChange={(e) => setQInput(e.target.value)}
                    placeholder="Search businesses, services, products…"
                    className="h-11 rounded-full border-border bg-card pl-10 pr-9 text-sm focus-visible:border-sage focus-visible:ring-sage/30"
                  />
                  {qInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setQInput("");
                        setFilters((f) => ({ ...f, q: "" }));
                        setPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* mobile filter trigger */}
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="h-11 sm:hidden" type="button">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                      {activeChips.length > 0 && (
                        <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[10px] font-semibold text-cream">
                          {activeChips.length}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] overflow-y-auto border-border bg-background p-0">
                    <SheetTitle className="sr-only">Filters</SheetTitle>
                    <div className="flex h-16 items-center justify-between border-b border-border px-5">
                      <span className="font-display text-lg tracking-tight">Filters</span>
                      {hasFilters && (
                        <button
                          type="button"
                          onClick={clearAll}
                          className="text-[11px] font-medium uppercase tracking-wider text-sage hover:underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="p-5">{sidebar}</div>
                  </SheetContent>
                </Sheet>

                {/* sort */}
                <div className="flex items-center gap-2">
                  <span className="hidden text-xs uppercase tracking-wider text-muted-foreground sm:inline">
                    Sort
                  </span>
                  <Select value={sort} onValueChange={(v) => { setSort(v as SortKey); setPage(1); }}>
                    <SelectTrigger className="h-11 w-[160px] rounded-full border-border bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORTS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* active filter chips */}
              {hasFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  {activeChips.map((c, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={c.onRemove}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground/80 transition-colors hover:border-foreground/30"
                    >
                      {c.label}
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs font-medium text-sage hover:underline"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* result count line */}
              <div className="flex items-center justify-between border-b border-border pb-3 text-sm text-muted-foreground">
                <span>
                  {loading
                    ? "Searching…"
                    : total === 0
                      ? "No matches"
                      : `Showing ${rangeStart}–${rangeEnd} of ${formatCount(total)}`}
                </span>
                <span className="hidden text-xs sm:inline">Page {page} of {Math.max(pages, 1)}</span>
              </div>

              {/* grid */}
              {loading ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <BusinessCardSkeleton key={i} />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <EmptyState
                  icon={Frown}
                  title="No businesses found"
                  description="Try adjusting your search terms or removing some filters to see more results."
                  action={
                    <Button variant="outline" onClick={clearAll}>
                      <X className="mr-1.5 h-4 w-4" /> Clear filters
                    </Button>
                  }
                />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((b) => (
                    <BusinessCard
                      key={b.id}
                      business={b}
                      onNavigate={(slug) => navigate({ name: "business", slug })}
                    />
                  ))}
                </div>
              )}

              {/* pagination */}
              {!loading && pages > 1 && (
                <div className="flex flex-col items-center gap-4 border-t border-border pt-6 sm:flex-row sm:justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ArrowLeft className="mr-1.5 h-4 w-4" /> Previous
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Page <span className="font-medium text-foreground">{page}</span> of{" "}
                    <span className="font-medium text-foreground">{pages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page >= pages}
                  >
                    Next <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------- helpers ----------

function formatCount(n: number) {
  return new Intl.NumberFormat("en-ZA").format(n);
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function FilterCheckbox({
  label,
  count,
  checked,
  onToggle,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 text-sm transition-colors hover:bg-muted/60">
      <Checkbox checked={checked} onCheckedChange={onToggle} />
      <span className="flex-1 text-foreground/80">{label}</span>
      {typeof count === "number" && (
        <span className="text-[11px] text-muted-foreground">{count}</span>
      )}
    </label>
  );
}
