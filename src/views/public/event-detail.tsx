"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill } from "@/components/blaknet/badges";
import { EmptyState } from "@/components/blaknet/section";
import { EVENT_CATEGORIES } from "@/lib/constants";
import type { BlakEvent } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/format";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  Globe,
  CheckCircle2,
  Share2,
  Frown,
} from "lucide-react";

function categoryLabel(value: string): string {
  return EVENT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value?: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 border-t border-border py-3 first:border-t-0 first:pt-0">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foreground/5 text-foreground/70">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className="bg-ink-grain text-cream">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Skeleton className="h-5 w-24 rounded-full bg-cream/10" />
        <Skeleton className="mt-5 h-12 w-3/4 rounded-md bg-cream/10" />
        <Skeleton className="mt-6 h-4 w-1/2 bg-cream/10" />
        <Skeleton className="mt-8 h-10 w-64 rounded-md bg-cream/10" />
      </div>
    </div>
  );
}

export function EventDetailView() {
  const { route, navigate, authUser } = useApp();
  const { toast } = useToast();
  const slug = route.name === "event" ? route.slug : "";

  const [event, setEvent] = useState<BlakEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [registering, setRegistering] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = () => {
    setNotFound(false);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const d = await api<{ event: BlakEvent }>(`/api/events/${encodeURIComponent(slug)}`);
        if (!cancelled) {
          setEvent(d.event);
          setRegistered(d.event.registered ?? false);
          setAttendeeCount(d.event._count?.attendees ?? 0);
          setNotFound(false);
          setError(null);
        }
      } catch (err) {
        if (cancelled) return;
        const e = err as Error & { status?: number };
        if (e?.status === 404) setNotFound(true);
        else setError(e?.message ?? "Could not load this event.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, reloadKey]);

  async function toggleRegister() {
    if (!authUser) {
      toast({ title: "Log in to register", description: "Sign in to attend this event." });
      navigate({ name: "login" });
      return;
    }
    if (!event) return;
    setRegistering(true);
    const prev = registered;
    setRegistered(!prev);
    setAttendeeCount((c) => Math.max(0, c + (prev ? -1 : 1)));
    try {
      const res = await api<{ registered: boolean }>(
        `/api/events/${encodeURIComponent(event.slug)}/register`,
        { method: "POST" },
      );
      setRegistered(res.registered);
      setAttendeeCount((c) =>
        Math.max(0, c + (res.registered ? 1 : -1) - (prev ? -1 : 1)),
      );
      toast({
        title: res.registered ? "You're registered" : "Registration cancelled",
        description: res.registered
          ? "We'll see you there. Add it to your calendar."
          : "Your registration has been removed.",
      });
    } catch (err) {
      setRegistered(prev);
      setAttendeeCount((c) => Math.max(0, c + (prev ? -1 : 1)));
      const message = err instanceof Error ? err.message : "Could not update registration.";
      toast({ title: "Couldn't register", description: message });
    } finally {
      setRegistering(false);
    }
  }

  function share() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.hash}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        () => toast({ title: "Link copied", description: "Share this event with your network." }),
        () => toast({ title: "Couldn't copy", description: "Copy the URL from your browser." }),
      );
    }
  }

  if (loading) return <HeroSkeleton />;

  if (notFound)
    return (
      <section className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <EmptyState
            icon={Frown}
            title="Event not found"
            description="This event may have been removed or never existed."
            action={
              <Button variant="outline" onClick={() => navigate({ name: "events" })}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to events
              </Button>
            }
          />
        </div>
      </section>
    );

  if (error || !event)
    return (
      <section className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <EmptyState
            icon={Frown}
            title="Couldn't load this event"
            description={error ?? "Please try again."}
            action={
              <Button variant="outline" onClick={reload}>
                Try again
              </Button>
            }
          />
        </div>
      </section>
    );

  const dateStr = formatDate(event.startDate);
  const timeStr = new Date(event.startDate).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endStr =
    event.endDate &&
    new Date(event.endDate).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="bg-ink-grain text-cream">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <button
            type="button"
            onClick={() => navigate({ name: "events" })}
            className="inline-flex items-center gap-1.5 text-sm text-cream/70 transition-colors hover:text-cream"
          >
            <ArrowLeft className="h-4 w-4" />
            All events
          </button>

          <div className="mt-6">
            <Pill tone="sage" className="bg-sage/20 text-sage border-sage/30">
              {categoryLabel(event.category)}
            </Pill>
            <h1 className="mt-4 font-display text-3xl leading-tight tracking-tight sm:text-4xl md:text-5xl">
              {event.title}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-cream/80">
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 text-sage" />
                {dateStr}
                {endStr && endStr !== dateStr ? ` – ${endStr}` : ""}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-sage" />
                {timeStr}
              </span>
              {event.isOnline ? (
                <span className="inline-flex items-center gap-2">
                  <Video className="h-4 w-4 text-sage" />
                  Online
                </span>
              ) : (
                event.location && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-sage" />
                    {event.location}
                  </span>
                )
              )}
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-sage" />
                {formatNumber(attendeeCount)} attending
              </span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                onClick={toggleRegister}
                disabled={registering}
                className={
                  registered
                    ? "bg-sage text-cream hover:bg-sage/90"
                    : "bg-cream text-ink hover:bg-cream/90"
                }
              >
                {registered ? (
                  <>
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    You're registered
                  </>
                ) : (
                  <>
                    Register <ArrowRight className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={toggleRegister}
                disabled={registering}
                className="border-cream/20 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
              >
                I'm interested
              </Button>
              {event.registrationUrl && (
                <Button
                  variant="outline"
                  asChild
                  className="border-cream/20 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
                >
                  <a href={event.registrationUrl} target="_blank" rel="noreferrer">
                    <Globe className="mr-1.5 h-4 w-4" />
                    Register on organiser site
                  </a>
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={share}
                className="text-cream/80 hover:bg-cream/10 hover:text-cream"
              >
                <Share2 className="mr-1.5 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            {/* LEFT: description */}
            <div className="min-w-0">
              <h2 className="font-display text-2xl tracking-tight">About this event</h2>
              <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
                {event.description}
              </p>
            </div>

            {/* RIGHT: details sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display text-lg tracking-tight">Event details</h3>
                <dl className="mt-2">
                  <DetailRow icon={Calendar} label="Date" value={dateStr} />
                  <DetailRow icon={Clock} label="Time" value={timeStr} />
                  {event.isOnline ? (
                    <DetailRow
                      icon={Video}
                      label="Location"
                      value={
                        event.onlineUrl ? (
                          <a
                            href={event.onlineUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="link-underline text-ink"
                          >
                            Join online
                          </a>
                        ) : (
                          "Online event"
                        )
                      }
                    />
                  ) : (
                    <DetailRow icon={MapPin} label="Location" value={event.location ?? undefined} />
                  )}
                  <DetailRow
                    icon={Users}
                    label="Attendees"
                    value={`${formatNumber(attendeeCount)}${
                      event.capacity ? ` / ${formatNumber(event.capacity)}` : ""
                    }`}
                  />
                  {event.capacity && (
                    <DetailRow
                      icon={Globe}
                      label="Capacity"
                      value={`${formatNumber(event.capacity)} seats`}
                    />
                  )}
                </dl>

                <div className="mt-5 border-t border-border pt-5">
                  <Button
                    onClick={toggleRegister}
                    disabled={registering}
                    className={
                      "w-full " +
                      (registered
                        ? "bg-sage text-cream hover:bg-sage/90"
                        : "bg-ink text-cream hover:bg-ink/90")
                    }
                  >
                    {registered ? "Cancel registration" : "Register to attend"}
                  </Button>
                  {event.registrationUrl && (
                    <Button
                      variant="outline"
                      asChild
                      className="mt-2 w-full"
                    >
                      <a href={event.registrationUrl} target="_blank" rel="noreferrer">
                        <Globe className="mr-1.5 h-4 w-4" />
                        Organiser site
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
