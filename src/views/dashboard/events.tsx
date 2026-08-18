"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill } from "@/components/blaknet/badges";
import { EmptyState } from "@/components/blaknet/section";
import { EVENT_CATEGORIES } from "@/lib/constants";
import type { BlakEvent } from "@/lib/types";
import { formatDate, formatNumber, monthDay } from "@/lib/format";
import {
  Calendar,
  Plus,
  MapPin,
  Video,
  Users,
  CalendarPlus,
  ArrowRight,
  Clock,
} from "lucide-react";

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

export function DashboardEventsView() {
  const { navigate } = useApp();
  const [items, setItems] = useState<BlakEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api<{ items: BlakEvent[] }>("/api/events?owner=1")
      .then((d) => {
        if (cancelled) return;
        setItems(d.items ?? []);
        setError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message || "Could not load your events.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function reload() {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-sage">
            <Calendar className="h-3.5 w-3.5" /> My Events
          </div>
          <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
            Manage events you&apos;re hosting on BlakNet.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Track registrations, capacity and details for the workshops, webinars
            and meetups you&apos;re hosting.
          </p>
        </div>
        <Button
          onClick={() => navigate({ name: "dashboard-event-new" })}
          className="btn-lift bg-ink text-cream shadow-md hover:bg-ink/90"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Host an event
        </Button>
      </div>

      {/* Body */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={CalendarPlus}
          title="Something went wrong."
          description={error}
          action={
            <Button variant="outline" onClick={reload}>
              Try again
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title="You haven't hosted any events yet."
          description="Create your first event — a workshop, webinar, meetup or networking session."
          action={
            <Button
              onClick={() => navigate({ name: "dashboard-event-new" })}
              className="btn-lift bg-ink text-cream shadow-md hover:bg-ink/90"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Host an event
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((e, i) => (
            <div
              key={e.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <EventRow event={e} onOpen={() => navigate({ name: "event", slug: e.slug })} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventRow({ event, onOpen }: { event: BlakEvent; onOpen: () => void }) {
  const md = monthDay(event.startDate);
  const attending = event._count?.attendees ?? 0;
  return (
    <div className="card-lift card-soft flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:p-5">
      {/* Date / image tile */}
      <button
        type="button"
        onClick={onOpen}
        className="relative flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-grain text-left sm:h-24 sm:w-28"
        aria-label={`Open ${event.title}`}
      >
        {event.imageUrl && isSvgDataUri(event.imageUrl) ? (
          <img
            src={event.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-contain p-4"
          />
        ) : (
          <span className="font-display text-3xl text-cream/30">
            {getInitials(event.title)}
          </span>
        )}
        <div className="absolute right-2 top-2 rounded-md bg-ink/85 px-2 py-1 text-center text-cream shadow-md backdrop-blur-sm">
          <div className="font-display text-base leading-none">{md.day}</div>
          <div className="text-[9px] uppercase tracking-wide text-cream/70">
            {md.month}
          </div>
        </div>
      </button>

      {/* Main */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="link-underline font-display text-lg tracking-tight text-ink hover:text-foreground"
          >
            {event.title}
          </button>
          <Pill tone="sage">{categoryLabel(event.category)}</Pill>
          {event.business ? (
            <Pill tone="neutral">{event.business.name}</Pill>
          ) : null}
        </div>

        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
          {event.description}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(event.startDate, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          {event.endDate ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Until {formatDate(event.endDate, { day: "numeric", month: "short" })}
            </span>
          ) : null}
          {event.isOnline ? (
            <span className="inline-flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5" /> Online
            </span>
          ) : event.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{event.location}</span>
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {formatNumber(attending)} attending
            {event.capacity ? ` / ${formatNumber(event.capacity)}` : ""}
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="flex shrink-0 items-center sm:pl-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpen}
          className="border-border bg-background hover:bg-muted"
        >
          View event <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
