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
} from "lucide-react";

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
  const md = monthDay(event.startDate);
  return (
    <button
      type="button"
      onClick={() => navigate({ name: "event", slug: event.slug })}
      className="card-lift group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm hover:border-foreground/25 hover:shadow-lg"
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
    </button>
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
