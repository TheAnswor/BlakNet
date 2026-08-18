"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { api, qs } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { VerifiedBadge } from "@/components/blaknet/badges";
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
import { cn } from "@/lib/utils";
import type { VerificationStatus } from "@/lib/types";
import {
  Building2,
  Search,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Star,
  Eye,
  Users as UsersIcon,
  Mail,
  MapPin,
  Loader2,
  Sparkles,
} from "lucide-react";

interface AdminBusinessIndustry {
  id: string;
  name: string;
  slug: string;
}

interface AdminBusinessOwner {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface AdminBusiness {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  industry: AdminBusinessIndustry | null;
  province: string | null;
  city: string | null;
  logoUrl: string | null;
  verificationStatus: VerificationStatus;
  featured: boolean;
  views: number;
  createdAt: string;
  owner: AdminBusinessOwner;
  reviewCount: number;
  followerCount: number;
}

interface BusinessesResponse {
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  items: AdminBusiness[];
}

interface Filters {
  q: string;
  verification: "" | VerificationStatus;
  featured: "" | "1" | "0";
  page: number;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "forbidden" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: BusinessesResponse };

const PAGE_SIZE = 20;

const VERIFICATION_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All verifications" },
  { value: "VERIFIED", label: "Verified" },
  { value: "PENDING", label: "Pending" },
  { value: "NOT_VERIFIED", label: "Not verified" },
  { value: "REJECTED", label: "Rejected" },
];

const FEATURED_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All businesses" },
  { value: "1", label: "Featured only" },
  { value: "0", label: "Not featured" },
];

const VERIFY_SELECT_OPTIONS: VerificationStatus[] = [
  "VERIFIED",
  "NOT_VERIFIED",
  "REJECTED",
];

function verifyLabel(status: VerificationStatus): string {
  switch (status) {
    case "VERIFIED":
      return "Verified";
    case "PENDING":
      return "Pending";
    case "REJECTED":
      return "Rejected";
    default:
      return "Not verified";
  }
}

export function AdminBusinessesView() {
  const { navigate } = useApp();
  const { toast } = useToast();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [filters, setFilters] = useState<Filters>({
    q: "",
    verification: "",
    featured: "",
    page: 1,
  });
  const [qInput, setQInput] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [verifyChangingId, setVerifyChangingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const path = `/api/admin/businesses${qs({
          q: filters.q,
          verification: filters.verification,
          featured: filters.featured,
          page: filters.page,
          pageSize: PAGE_SIZE,
        })}`;
        const data = await api<BusinessesResponse>(path);
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
  }, [filters, reloadKey]);

  const onSearchChange = (value: string) => {
    setQInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters((f) => ({ ...f, q: value, page: 1 }));
    }, 300);
  };

  const onVerificationChange = (value: string) => {
    const verification = (value === "all" ? "" : value) as Filters["verification"];
    setFilters((f) => ({ ...f, verification, page: 1 }));
  };

  const onFeaturedChange = (value: string) => {
    const featured = (value === "all" ? "" : value) as Filters["featured"];
    setFilters((f) => ({ ...f, featured, page: 1 }));
  };

  const goToPage = (p: number) => {
    setFilters((f) => ({ ...f, page: Math.max(1, p) }));
  };

  const toggleFeatured = async (biz: AdminBusiness) => {
    const next = !biz.featured;
    setTogglingId(biz.id);
    // optimistic update
    setState((s) =>
      s.kind === "ready"
        ? {
            kind: "ready",
            data: {
              ...s.data,
              items: s.data.items.map((b) =>
                b.id === biz.id ? { ...b, featured: next } : b,
              ),
            },
          }
        : s,
    );
    try {
      await api("/api/admin/businesses", {
        method: "PATCH",
        json: { id: biz.id, featured: next },
      });
      toast({
        title: next ? "Featured" : "Unfeatured",
        description: `${biz.name} ${next ? "is now featured." : "is no longer featured."}`,
      });
    } catch (err) {
      // revert
      setState((s) =>
        s.kind === "ready"
          ? {
              kind: "ready",
              data: {
                ...s.data,
                items: s.data.items.map((b) =>
                  b.id === biz.id ? { ...b, featured: biz.featured } : b,
                ),
              },
            }
          : s,
      );
      const e = err as Error;
      toast({
        title: "Update failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const changeVerification = async (biz: AdminBusiness, status: VerificationStatus) => {
    if (biz.verificationStatus === status) return;
    setVerifyChangingId(biz.id);
    const prev = biz.verificationStatus;
    // optimistic update
    setState((s) =>
      s.kind === "ready"
        ? {
            kind: "ready",
            data: {
              ...s.data,
              items: s.data.items.map((b) =>
                b.id === biz.id ? { ...b, verificationStatus: status } : b,
              ),
            },
          }
        : s,
    );
    try {
      await api("/api/admin/businesses", {
        method: "PATCH",
        json: { id: biz.id, verificationStatus: status },
      });
      toast({
        title: "Verification updated",
        description: `${biz.name} marked as ${verifyLabel(status).toLowerCase()}.`,
      });
    } catch (err) {
      // revert
      setState((s) =>
        s.kind === "ready"
          ? {
              kind: "ready",
              data: {
                ...s.data,
                items: s.data.items.map((b) =>
                  b.id === biz.id ? { ...b, verificationStatus: prev } : b,
                ),
              },
            }
          : s,
      );
      const e = err as Error;
      toast({
        title: "Update failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setVerifyChangingId(null);
    }
  };

  if (state.kind === "loading") {
    return <BusinessesSkeleton />;
  }
  if (state.kind === "forbidden") {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Admin access required."
        description="You need an admin account to manage businesses."
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
        title="Couldn't load businesses."
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
  const start = (data.page - 1) * data.pageSize;
  const end = Math.min(start + items.length, data.total);

  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <Pill tone="sage" className="mb-2">
          <Building2 className="h-3 w-3" /> Directory
        </Pill>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Businesses</h1>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Manage all businesses on BlakNet. Toggle featured, override verification, and review performance.
        </p>
      </div>

      {/* filter bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={qInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, tagline or location…"
            className="pl-9"
          />
        </div>
        <Select
          value={filters.verification || "all"}
          onValueChange={onVerificationChange}
        >
          <SelectTrigger className="h-9 w-full lg:w-[180px]">
            <SelectValue placeholder="All verifications" />
          </SelectTrigger>
          <SelectContent>
            {VERIFICATION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.featured || "all"} onValueChange={onFeaturedChange}>
          <SelectTrigger className="h-9 w-full lg:w-[160px]">
            <SelectValue placeholder="All businesses" />
          </SelectTrigger>
          <SelectContent>
            {FEATURED_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        {data.total === 0
          ? "No businesses found."
          : `Showing ${start + 1}–${end} of ${formatNumber(data.total)} businesses`}
      </p>

      {/* list */}
      {items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No businesses found."
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="space-y-4">
          {items.map((b, i) => (
            <BusinessRow
              key={b.id}
              business={b}
              delayMs={i * 40}
              toggling={togglingId === b.id}
              verifyChanging={verifyChangingId === b.id}
              onToggleFeatured={() => toggleFeatured(b)}
              onChangeVerification={(status) => changeVerification(b, status)}
              onOpen={() => navigate({ name: "business", slug: b.slug })}
            />
          ))}
        </div>
      )}

      {/* pagination */}
      {items.length > 0 && data.pages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Page {data.page} of {data.pages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(data.page - 1)}
              disabled={data.page <= 1}
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(data.page + 1)}
              disabled={data.page >= data.pages}
            >
              Next <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function BusinessRow({
  business,
  delayMs,
  toggling,
  verifyChanging,
  onToggleFeatured,
  onChangeVerification,
  onOpen,
}: {
  business: AdminBusiness;
  delayMs: number;
  toggling: boolean;
  verifyChanging: boolean;
  onToggleFeatured: () => void;
  onChangeVerification: (status: VerificationStatus) => void;
  onOpen: () => void;
}) {
  const ownerName =
    [business.owner.firstName, business.owner.lastName].filter(Boolean).join(" ") ||
    business.owner.email.split("@")[0];
  const location = [business.city, business.province].filter(Boolean).join(", ");

  return (
    <div
      className="animate-fade-in-up rounded-xl border border-border bg-card p-5"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* left: identity */}
        <div className="flex flex-1 items-start gap-3">
          <button onClick={onOpen} className="shrink-0" aria-label={`Open ${business.name}`}>
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-ink font-display text-cream">
                {business.name[0]}
              </div>
            )}
          </button>
          <div className="min-w-0 flex-1">
            <button onClick={onOpen} className="group inline-flex items-center gap-1.5 text-left">
              <h3 className="font-display text-lg tracking-tight">{business.name}</h3>
              <ArrowRight className="h-3.5 w-3.5 text-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-ink" />
            </button>
            {business.tagline && (
              <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{business.tagline}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {business.industry && <Pill tone="neutral">{business.industry.name}</Pill>}
              <VerifiedBadge status={business.verificationStatus} />
              {business.featured && (
                <Pill tone="sage">
                  <Sparkles className="h-3 w-3" /> Featured
                </Pill>
              )}
              {location && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {location}
                </span>
              )}
            </div>
            {/* owner + metrics */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3 w-3" /> {ownerName} · {business.owner.email}
              </span>
              <span className="inline-flex items-center gap-1">
                <Star className="h-3 w-3" /> {formatNumber(business.reviewCount)} reviews
              </span>
              <span className="inline-flex items-center gap-1">
                <UsersIcon className="h-3 w-3" /> {formatNumber(business.followerCount)} followers
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3 w-3" /> {formatNumber(business.views)} views
              </span>
              <span className="text-muted-foreground">Added {formatDate(business.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* right: controls */}
        <div className="flex shrink-0 flex-col gap-3 lg:items-end">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Featured</span>
              <Switch
                checked={business.featured}
                onCheckedChange={onToggleFeatured}
                disabled={toggling}
                aria-label="Toggle featured"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Verification</span>
            <Select
              value={business.verificationStatus}
              onValueChange={(v) => onChangeVerification(v as VerificationStatus)}
              disabled={verifyChanging}
            >
              <SelectTrigger className="h-8 w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VERIFY_SELECT_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {verifyLabel(opt)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {verifyChanging && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </div>
        </div>
      </div>
    </div>
  );
}

function BusinessesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-9 w-40 rounded-md" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 w-[180px] rounded-md" />
        <Skeleton className="h-9 w-[160px] rounded-md" />
      </div>
      <Skeleton className="h-4 w-48 rounded-md" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className={cn("h-40 rounded-xl")} />
        ))}
      </div>
    </div>
  );
}
