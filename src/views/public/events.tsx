"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { api, qs } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Pill } from "@/components/blaknet/badges";
import { SectionHeading, EmptyState } from "@/components/blaknet/section";
import { EVENT_CATEGORIES } from "@/lib/constants";
import type { BlakEvent } from "@/lib/types";
import { formatDate, formatNumber, monthDay } from "@/lib/format";
import {
  Calendar,
  MapPin,
  Video,
  Users,
  Frown,
  Briefcase,
  Network,
  GraduationCap,
  Megaphone,
  Trophy,
  Presentation,
  HandCoins,
  Coffee,
  Filter,
  X,
  Share2,
  Link as LinkIcon,
  Mail,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const CATEGORY_ICONS: Record<string, typeof Network> = {
  networking: Network,
  workshop: GraduationCap,
  seminar: Presentation,
  conference: Briefcase,
  training: GraduationCap,
  webinar: Video,
  funding: HandCoins,
  competition: Trophy,
  learnership: GraduationCap,
  meetup: Coffee,
};

function CategoryIcon({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const Icon = CATEGORY_ICONS[category] ?? Megaphone;
  return <Icon className={className} />;
}

function categoryLabel(value: string): string {
  return EVENT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function isSvgDataUri(url: string): boolean {
  return url.startsWith("data:image/svg");
}

function getInitials(title: string): string {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ---------- Day filter ----------
type DayFilter =
  | "any"
  | "soon"
  | "today"
  | "tomorrow"
  | "this-week"
  | "weekend"
  | "next-week";

const DAY_OPTIONS: { value: DayFilter; label: string }[] = [
  { value: "any", label: "Any day" },
  { value: "soon", label: "Starting soon" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "this-week", label: "This week" },
  { value: "weekend", label: "This weekend" },
  { value: "next-week", label: "Next week" },
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function matchesDay(eventStart: string, filter: DayFilter): boolean {
  if (filter === "any") return true;
  const start = new Date(eventStart);
  const now = new Date();
  const today = startOfDay(now);
  const eventDay = startOfDay(start);

  if (filter === "today") {
    return eventDay.getTime() === today.getTime();
  }
  if (filter === "tomorrow") {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return eventDay.getTime() === tomorrow.getTime();
  }
  if (filter === "soon") {
    const diff = start.getTime() - now.getTime();
    return diff >= 0 && diff <= 24 * 60 * 60 * 1000;
  }
  if (filter === "this-week") {
    // current ISO week (Mon–Sun)
    const dayOfWeek = (today.getDay() + 6) % 7; // 0 = Mon
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return eventDay >= monday && eventDay <= sunday;
  }
  if (filter === "weekend") {
    const dow = eventDay.getDay();
    return dow === 0 || dow === 6; // Sat or Sun
  }
  if (filter === "next-week") {
    const dayOfWeek = (today.getDay() + 6) % 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() - dayOfWeek + 7);
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);
    nextSunday.setHours(23, 59, 59, 999);
    return eventDay >= nextMonday && eventDay <= nextSunday;
  }
  return true;
}

// ---------- Size filter ----------
type SizeFilter = "any" | "1-9" | "10-20" | "20-50" | "50-100" | "100+";

const SIZE_OPTIONS: { value: SizeFilter; label: string }[] = [
  { value: "any", label: "Any size" },
  { value: "1-9", label: "1-9 attendees" },
  { value: "10-20", label: "10-20 attendees" },
  { value: "20-50", label: "20-50 attendees" },
  { value: "50-100", label: "50-100 attendees" },
  { value: "100+", label: "100+ attendees" },
];

function matchesSize(attendees: number, filter: SizeFilter): boolean {
  switch (filter) {
    case "any":
      return true;
    case "1-9":
      return attendees >= 1 && attendees <= 9;
    case "10-20":
      return attendees >= 10 && attendees <= 20;
    case "20-50":
      return attendees > 20 && attendees <= 50;
    case "50-100":
      return attendees > 50 && attendees <= 100;
    case "100+":
      return attendees > 100;
  }
  return true;
}

// ---------- Type filter ----------
type TypeFilter = "any" | "online" | "in-person";

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "any", label: "Any type" },
  { value: "online", label: "Online" },
  { value: "in-person", label: "In-person" },
];

function matchesType(isOnline: boolean, filter: TypeFilter): boolean {
  if (filter === "any") return true;
  if (filter === "online") return isOnline === true;
  if (filter === "in-person") return isOnline === false;
  return true;
}

function EventCard({ event }: { event: BlakEvent }) {
  const { navigate } = useApp();
  const { toast } = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const md = monthDay(event.startDate);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/#/events/${encodeURIComponent(event.slug)}`
    : `/#/events/${encodeURIComponent(event.slug)}`;
  const shareText = `Check out this event: ${event.title} on BlakNet`;

  function handleCopy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        toast({ title: "Link copied", description: "Paste it anywhere to share this event." });
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        toast({ title: "Could not copy", variant: "destructive" });
      });
    }
  }

  function closeDialog() {
    setShareOpen(false);
  }

  function shareToSocial(url: string) {
    closeDialog();
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function shareToInstagram() {
    // Instagram doesn't support URL-based sharing — copy link first, then open app
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast({ title: "Link copied", description: "Paste it into your Instagram post or story." });
      }).catch(() => {});
    }
    closeDialog();
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  }

  function shareToEmail() {
    closeDialog();
    window.location.href = `mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`;
  }

  const shareOptions = [
    {
      label: "Copy link",
      icon: copied ? Check : LinkIcon,
      onClick: () => { handleCopy(); },
      tone: "ink" as const,
    },
    {
      label: "Facebook",
      icon: FacebookIcon,
      onClick: () => shareToSocial(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`),
      tone: "neutral" as const,
    },
    {
      label: "Instagram",
      icon: InstagramIcon,
      onClick: shareToInstagram,
      tone: "neutral" as const,
    },
    {
      label: "LinkedIn",
      icon: LinkedinIcon,
      onClick: () => shareToSocial(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`),
      tone: "neutral" as const,
    },
    {
      label: "X.com",
      icon: XIcon,
      onClick: () => shareToSocial(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`),
      tone: "neutral" as const,
    },
    {
      label: "Email",
      icon: Mail,
      onClick: shareToEmail,
      tone: "neutral" as const,
    },
  ];

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate({ name: "event", slug: event.slug })}
        onKeyDown={(e) => { if (e.key === "Enter") navigate({ name: "event", slug: event.slug }); }}
        className="card-lift group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm hover:border-foreground/25 hover:shadow-lg"
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-ink-grain">
          {event.imageUrl && isSvgDataUri(event.imageUrl) ? (
            <img
              src={event.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-contain p-8"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-5xl text-cream/30">
                {getInitials(event.title)}
              </span>
            </div>
          )}
          {/* Category icon overlay */}
          <div className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg bg-ink/40 text-cream backdrop-blur-sm">
            <CategoryIcon category={event.category} className="h-5 w-5" />
          </div>
          {/* Date badge */}
          <div className="absolute right-3 top-3 rounded-lg bg-ink/85 px-2 py-1.5 text-center text-cream shadow-md backdrop-blur-sm">
            <div className="font-display text-lg leading-none">{md.day}</div>
            <div className="text-[10px] uppercase tracking-wide text-cream/70">
              {md.month}
            </div>
          </div>
          {/* Share button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShareOpen(true); }}
            className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-ink/90 text-cream shadow-lg ring-1 ring-cream/10 backdrop-blur-sm transition-colors hover:bg-ink hover:ring-cream/30"
            aria-label="Share event"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <Pill tone="sage" className="self-start">
            {categoryLabel(event.category)}
          </Pill>
          <h3 className="mt-2 line-clamp-2 font-medium text-base leading-snug tracking-tight">
            {event.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{event.description}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-3 text-xs text-foreground/70">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(event.startDate, { day: "numeric", month: "short" })}
            </span>
            {event.isOnline ? (
              <span className="inline-flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5" />
                Online
              </span>
            ) : (
              event.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="line-clamp-1">{event.location}</span>
                </span>
              )
            )}
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {formatNumber(event._count?.attendees ?? 0)} attending
            </span>
          </div>
        </div>
      </div>

      {/* Share dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Share this event</DialogTitle>
            <DialogDescription className="line-clamp-1">
              {event.title}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-2">
            {shareOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => { opt.onClick(); }}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:border-foreground/25 hover:bg-muted hover:shadow-sm"
                >
                  <span className={
                    "flex h-11 w-11 items-center justify-center rounded-full " +
                    (opt.tone === "ink" ? "bg-ink text-cream" : "bg-foreground/5 text-foreground/70")
                  }>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium text-foreground/80">{opt.label}</span>
                </button>
              );
            })}
          </div>
          {/* Link preview */}
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
            <LinkIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-xs text-muted-foreground">{shareUrl}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="ml-auto shrink-0 text-xs font-medium text-sage hover:underline"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Inline social media SVG icons (lucide doesn't include brand icons)
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function GridSkeletons() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
          <Skeleton className="aspect-[16/9] w-full rounded-none" />
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

export function EventsView() {
  const [active, setActive] = useState<string>("all");
  const [dayFilter, setDayFilter] = useState<DayFilter>("any");
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>("any");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("any");
  const [events, setEvents] = useState<BlakEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const path = `/api/events${qs({ category: active !== "all" ? active : null })}`;
        const d = await api<{ items: BlakEvent[] }>(path);
        if (!cancelled) {
          setEvents(d.items ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load events.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active]);

  function reload() {
    setLoading(true);
    setError(null);
    let cancelled = false;
    (async () => {
      try {
        const path = `/api/events${qs({ category: active !== "all" ? active : null })}`;
        const d = await api<{ items: BlakEvent[] }>(path);
        if (!cancelled) {
          setEvents(d.items ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load events.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }

  function toggleCategory(value: string) {
    setActive((cur) => (cur === value ? "all" : value));
  }

  const hasFilters =
    dayFilter !== "any" || sizeFilter !== "any" || typeFilter !== "any";

  const clearFilters = () => {
    setDayFilter("any");
    setSizeFilter("any");
    setTypeFilter("any");
  };

  const filtered = useMemo(() => {
    if (!hasFilters) return events;
    return events.filter((e) => {
      const dayOk = matchesDay(e.startDate, dayFilter);
      const sizeOk = matchesSize(e._count?.attendees ?? 0, sizeFilter);
      const typeOk = matchesType(e.isOnline, typeFilter);
      return dayOk && sizeOk && typeOk;
    });
  }, [events, dayFilter, sizeFilter, typeFilter, hasFilters]);

  return (
    <div className="flex flex-col">
      {/* HEADER */}
      <section className="bg-cream-grain">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <SectionHeading
            eyebrow="Events"
            title="Discover business events across South Africa."
            description="Networking, workshops, funding, training and more — find the rooms where Black business gets done."
          />
        </div>
      </section>

      {/* BODY */}
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          {/* CATEGORY FILTER */}
          <div className="scroll-elegant -mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
            <button
              type="button"
              onClick={() => setActive("all")}
              className={
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors " +
                (active === "all"
                  ? "border-ink bg-ink text-cream"
                  : "border-border bg-card text-foreground/70 hover:border-foreground/30 hover:bg-muted")
              }
            >
              All events
            </button>
            {EVENT_CATEGORIES.map((c) => {
              const isActive = active === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => toggleCategory(c.value)}
                  className={
                    "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors " +
                    (isActive
                      ? "border-ink bg-ink text-cream"
                      : "border-border bg-card text-foreground/70 hover:border-foreground/30 hover:bg-muted")
                  }
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* FILTER BAR — Day / Size / Type */}
          <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-border pb-6">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <Filter className="h-3.5 w-3.5" /> Filters:
            </span>
            <Select
              value={dayFilter}
              onValueChange={(v) => setDayFilter(v as DayFilter)}
            >
              <SelectTrigger className="h-9 w-auto min-w-[140px] gap-1.5 border-border bg-card text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sizeFilter}
              onValueChange={(v) => setSizeFilter(v as SizeFilter)}
            >
              <SelectTrigger className="h-9 w-auto min-w-[160px] gap-1.5 border-border bg-card text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIZE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as TypeFilter)}
            >
              <SelectTrigger className="h-9 w-auto min-w-[140px] gap-1.5 border-border bg-card text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="h-9 gap-1.5 border-border text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
            {hasFilters && (
              <span className="ml-auto text-[11px] text-muted-foreground">
                Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
                <span className="font-medium text-foreground">{events.length}</span>
              </span>
            )}
          </div>

          {loading ? (
            <GridSkeletons />
          ) : error ? (
            <EmptyState
              icon={Frown}
              title="Couldn't load events"
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
              title="No upcoming events match your filters."
              description="Try clearing filters, or check back soon — new events are added weekly."
              action={
                hasFilters || active !== "all" ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActive("all");
                      clearFilters();
                    }}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((e, i) => (
                <div
                  key={e.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <EventCard event={e} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
