"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Calendar,
  Users,
  MapPin,
  Globe,
  AlertCircle,
  Search,
} from "lucide-react";
import type { BlakEvent } from "@/lib/types";

interface EventsResponse {
  items: BlakEvent[];
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: BlakEvent[] };

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All categories" },
  { value: "networking", label: "Networking" },
  { value: "workshop", label: "Workshop" },
  { value: "seminar", label: "Seminar" },
  { value: "conference", label: "Conference" },
  { value: "training", label: "Training" },
  { value: "webinar", label: "Webinar" },
  { value: "funding", label: "Funding" },
  { value: "competition", label: "Competition" },
  { value: "learnership", label: "Learnership" },
  { value: "meetup", label: "Meetup" },
];

function categoryTone(category: string): "sage" | "ink" | "cream" | "neutral" {
  switch (category) {
    case "funding":
    case "learnership":
      return "cream";
    case "conference":
    case "competition":
      return "ink";
    case "workshop":
    case "training":
    case "seminar":
    case "webinar":
      return "sage";
    default:
      return "neutral";
  }
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function AdminEventsView() {
  const { navigate } = useApp();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const path =
          category === "all" ? "/api/events" : `/api/events?category=${encodeURIComponent(category)}`;
        const data = await api<EventsResponse>(path);
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
  }, [category, reloadKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.kind === "ready" ? state.items : [];
    return state.kind === "ready"
      ? state.items.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            (e.description ?? "").toLowerCase().includes(q) ||
            (e.location ?? "").toLowerCase().includes(q) ||
            e.category.toLowerCase().includes(q),
        )
      : [];
  }, [state, query]);

  if (state.kind === "loading") {
    return <EventsSkeleton />;
  }
  if (state.kind === "error") {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load events."
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
          <Calendar className="h-3 w-3" /> Community
        </Pill>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Events</h1>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Manage and monitor all events on BlakNet.
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
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events…"
              className="h-9 w-full pl-8 sm:w-[260px]"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{formatNumber(filtered.length)}</span>{" "}
          {filtered.length === 1 ? "event" : "events"}
        </p>
      </div>

      {/* note */}
      <p className="text-xs italic text-muted-foreground">
        Event creation and editing coming to business owners soon.
      </p>

      {/* list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No events found."
          description="Try a different category or search term."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Event</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Location</th>
                  <th className="px-5 py-3 text-right font-medium">Attendees</th>
                  <th className="px-5 py-3 text-right font-medium">Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((e, i) => (
                  <EventRow
                    key={e.id}
                    event={e}
                    delayMs={i * 35}
                    onOpen={() => navigate({ name: "event", slug: e.slug })}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden">
            {filtered.map((e, i) => (
              <EventCard
                key={e.id}
                event={e}
                delayMs={i * 35}
                onOpen={() => navigate({ name: "event", slug: e.slug })}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EventRow({
  event,
  delayMs,
  onOpen,
}: {
  event: BlakEvent;
  delayMs: number;
  onOpen: () => void;
}) {
  const attendees = event._count?.attendees ?? 0;
  return (
    <tr className="animate-fade-in-up hover:bg-muted/30" style={{ animationDelay: `${delayMs}ms` }}>
      <td className="px-5 py-3">
        <button
          onClick={onOpen}
          className="text-left font-medium text-foreground transition-colors hover:text-sage"
        >
          {event.title}
        </button>
      </td>
      <td className="px-5 py-3">
        <Pill tone={categoryTone(event.category)}>{titleCase(event.category)}</Pill>
      </td>
      <td className="px-5 py-3 text-muted-foreground">{formatDate(event.startDate)}</td>
      <td className="px-5 py-3">
        {event.isOnline ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Globe className="h-3.5 w-3.5" /> Online
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{event.location || "—"}</span>
          </span>
        )}
      </td>
      <td className="px-5 py-3 text-right">
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {formatNumber(attendees)}
        </span>
      </td>
      <td className="px-5 py-3 text-right text-muted-foreground">
        {event.capacity ? formatNumber(event.capacity) : "—"}
      </td>
    </tr>
  );
}

function EventCard({
  event,
  delayMs,
  onOpen,
}: {
  event: BlakEvent;
  delayMs: number;
  onOpen: () => void;
}) {
  const attendees = event._count?.attendees ?? 0;
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
          {event.title}
        </button>
        <Pill tone={categoryTone(event.category)}>{titleCase(event.category)}</Pill>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3" /> {formatDate(event.startDate)}
        </span>
        {event.isOnline ? (
          <span className="inline-flex items-center gap-1">
            <Globe className="h-3 w-3" /> Online
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {event.location || "—"}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Users className="h-3 w-3" /> {formatNumber(attendees)} attending
        </span>
      </div>
    </div>
  );
}

function EventsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-9 w-32 rounded-md" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-[200px] rounded-md" />
        <Skeleton className="h-9 w-[260px] rounded-md" />
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
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
