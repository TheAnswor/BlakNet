"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/blaknet/section";
import { Pill } from "@/components/blaknet/badges";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import {
  Inbox,
  Mail,
  Phone,
  Building2,
  Send,
  MailOpen,
  Archive,
  Reply,
  ArrowRight,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

// ---------- types ----------
type EnquiryStatus = "new" | "read" | "responded" | "archived";

interface EnquiryBusiness {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

interface Enquiry {
  id: string;
  businessId: string;
  business: EnquiryBusiness;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
  enquiryType: string | null;
  status: EnquiryStatus;
  createdAt: string;
}

interface EnquiriesResponse {
  items: Enquiry[];
  stats: { total: number; new: number };
}

type FilterKey = "all" | EnquiryStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "read", label: "Read" },
  { key: "responded", label: "Responded" },
  { key: "archived", label: "Archived" },
];

const ENQUIRY_TYPE_LABELS: Record<string, string> = {
  general: "General",
  procurement: "Procurement",
  partnership: "Partnership",
  service: "Service",
};

export function EnquiriesView() {
  const navigate = useApp((s) => s.navigate);
  const { toast } = useToast();

  const [items, setItems] = useState<Enquiry[]>([]);
  const [stats, setStats] = useState<{ total: number; new: number }>({ total: 0, new: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<EnquiriesResponse>("/api/enquiries");
      setItems(data.items ?? []);
      setStats(data.stats ?? { total: data.items?.length ?? 0, new: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load enquiries.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((it) => it.status === filter);
  }, [items, filter]);

  const counts = useMemo(() => {
    const map: Record<FilterKey, number> = {
      all: items.length,
      new: 0,
      read: 0,
      responded: 0,
      archived: 0,
    };
    for (const it of items) {
      map[it.status] += 1;
    }
    return map;
  }, [items]);

  async function updateStatus(enquiry: Enquiry, status: EnquiryStatus, label: string) {
    if (enquiry.status === status || pendingId === enquiry.id) return;
    const prev = enquiry.status;
    // optimistic update
    setItems((cur) =>
      cur.map((it) => (it.id === enquiry.id ? { ...it, status } : it)),
    );
    setStats((s) => ({
      total: s.total,
      new: status === "new" ? s.new + 1 : prev === "new" ? Math.max(0, s.new - 1) : s.new,
    }));
    setPendingId(enquiry.id);
    try {
      await api("/api/enquiries", { method: "PATCH", json: { id: enquiry.id, status } });
      toast({ title: label });
    } catch (e) {
      // revert
      setItems((cur) =>
        cur.map((it) => (it.id === enquiry.id ? { ...it, status: prev } : it)),
      );
      setStats((s) => ({
        total: s.total,
        new: prev === "new" ? s.new + 1 : status === "new" ? Math.max(0, s.new - 1) : s.new,
      }));
      toast({
        title: "Couldn't update enquiry",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Enquiries</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Messages from people interested in your businesses.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-2">
        <StatChip
          icon={<Inbox className="h-3.5 w-3.5" />}
          label="Total"
          value={stats.total}
        />
        <StatChip
          icon={<Mail className="h-3.5 w-3.5" />}
          label="New"
          value={stats.new}
          tone={stats.new > 0 ? "sage" : "muted"}
        />
      </div>

      {/* Filter pills */}
      {!loading && !error && items.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const count = counts[f.key];
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-ink bg-ink text-cream"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                    active ? "bg-cream/15 text-cream" : "bg-foreground/5 text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Body */}
      {loading ? (
        <EnquiriesSkeleton />
      ) : error ? (
        <EmptyState
          icon={AlertCircle}
          title="Couldn't load enquiries"
          description={error}
          action={<Button onClick={load} variant="outline">Try again</Button>}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No enquiries yet."
          description="When someone enquires about your business, it'll appear here."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={`No ${filter === "all" ? "" : filter + " "}enquiries.`}
          description="Try a different filter to see more messages."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {filtered.map((enq, i) => (
            <li
              key={enq.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
            >
              <EnquiryCard
                enquiry={enq}
                pending={pendingId === enq.id}
                onNavigate={(slug) => navigate({ name: "business", slug })}
                onMarkRead={(e) => updateStatus(e, "read", "Marked as read")}
                onMarkResponded={(e) => updateStatus(e, "responded", "Marked as responded")}
                onArchive={(e) => updateStatus(e, "archived", "Enquiry archived")}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------- sub-components ----------

function StatChip({
  icon,
  label,
  value,
  tone = "muted",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "muted" | "sage";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium",
        tone === "sage"
          ? "border-sage/30 bg-sage/10 text-sage"
          : "border-border bg-card text-muted-foreground",
      )}
    >
      <span className={tone === "sage" ? "text-sage" : "text-muted-foreground/70"}>{icon}</span>
      <span className="uppercase tracking-wide">{label}</span>
      <span
        className={cn(
          "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
          tone === "sage" ? "bg-sage/20 text-sage" : "bg-foreground/5 text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function EnquiryCard({
  enquiry,
  pending,
  onNavigate,
  onMarkRead,
  onMarkResponded,
  onArchive,
}: {
  enquiry: Enquiry;
  pending: boolean;
  onNavigate: (slug: string) => void;
  onMarkRead: (e: Enquiry) => void;
  onMarkResponded: (e: Enquiry) => void;
  onArchive: (e: Enquiry) => void;
}) {
  const b = enquiry.business;
  const typeLabel = enquiry.enquiryType
    ? ENQUIRY_TYPE_LABELS[enquiry.enquiryType] ?? enquiry.enquiryType
    : null;

  return (
    <article
      className={cn(
        "card-soft rounded-xl border bg-card p-5",
        enquiry.status === "new"
          ? "border-l-2 border-l-sage border-border"
          : "border-border",
        enquiry.status === "archived" && "opacity-70",
      )}
    >
      {/* Top row — business + status + timestamp */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate(b.slug)}
          className="group flex min-w-0 items-center gap-2.5 text-left"
          title={`View ${b.name}`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-foreground/5">
            {b.logoUrl ? (
              <img src={b.logoUrl} alt={b.name} className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-4 w-4 text-muted-foreground" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground group-hover:text-ink">
              {b.name}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground group-hover:text-foreground/70">
              View business
              <ArrowRight className="h-3 w-3" />
            </span>
          </span>
        </button>

        <div className="flex items-center gap-2">
          <StatusBadge status={enquiry.status} />
          <span className="text-[11px] text-muted-foreground">{timeAgo(enquiry.createdAt)}</span>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Enquirer details */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{enquiry.name}</p>
            {enquiry.company && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" />
                {enquiry.company}
              </span>
            )}
            {typeLabel && <Pill tone="sage">{typeLabel}</Pill>}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <a
              href={`mailto:${enquiry.email}`}
              className="link-underline inline-flex items-center gap-1 text-foreground/80 hover:text-ink"
            >
              <Mail className="h-3.5 w-3.5" />
              {enquiry.email}
            </a>
            {enquiry.phone && (
              <a
                href={`tel:${enquiry.phone.replace(/[^0-9+]/g, "")}`}
                className="link-underline inline-flex items-center gap-1 text-foreground/80 hover:text-ink"
              >
                <Phone className="h-3.5 w-3.5" />
                {enquiry.phone}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Message */}
      <div className="mt-3 rounded-lg border border-border bg-background/60 p-3.5">
        <p className="text-sm leading-relaxed text-foreground/80">{enquiry.message}</p>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {enquiry.status === "new" && (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => onMarkRead(enquiry)}
            className="border-border bg-background hover:bg-muted"
          >
            {pending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <MailOpen className="mr-1.5 h-3.5 w-3.5" />}
            Mark as read
          </Button>
        )}
        {enquiry.status !== "responded" && enquiry.status !== "archived" && (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => onMarkResponded(enquiry)}
            className="border-border bg-background hover:bg-muted"
          >
            {pending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Reply className="mr-1.5 h-3.5 w-3.5" />}
            Mark responded
          </Button>
        )}
        <a
          href={`mailto:${enquiry.email}?subject=${encodeURIComponent(`Re: your enquiry about ${b.name}`)}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-sage/30 bg-sage/10 px-3 text-xs font-medium text-sage transition-colors hover:bg-sage/20"
        >
          <Send className="h-3.5 w-3.5" />
          Reply by email
        </a>
        {enquiry.status !== "archived" && (
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => onArchive(enquiry)}
            className="ml-auto text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {pending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Archive className="mr-1.5 h-3.5 w-3.5" />}
            Archive
          </Button>
        )}
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: EnquiryStatus }) {
  switch (status) {
    case "new":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-sage/30 bg-sage/12 px-2 py-0.5 text-[11px] font-medium text-sage">
          <span className="h-1.5 w-1.5 rounded-full bg-sage" />
          New
        </span>
      );
    case "read":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-foreground/5 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          Read
        </span>
      );
    case "responded":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-foreground/20 bg-foreground/5 px-2 py-0.5 text-[11px] font-medium text-foreground">
          Responded
        </span>
      );
    case "archived":
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          Archived
        </span>
      );
  }
}

// ---------- skeleton ----------

function EnquiriesSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="card-soft rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-9 w-9 rounded-md" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Separator className="my-4" />
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="mt-3 h-20 w-full rounded-lg" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}
