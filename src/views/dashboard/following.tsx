"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/blaknet/section";
import { VerifiedBadge, BBBEEBadge } from "@/components/blaknet/badges";
import type { Business } from "@/lib/types";
import { formatDate, provinceCity } from "@/lib/format";
import {
  Heart,
  MapPin,
  Building2,
  ArrowRight,
  AlertCircle,
  CalendarHeart,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Followed items extend Business with the date the user started following.
type FollowedBusiness = Business & { followedAt?: string | null };

export function FollowingView() {
  const navigate = useApp((s) => s.navigate);
  const [items, setItems] = useState<FollowedBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ items: FollowedBusiness[] }>("/api/businesses/followed");
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load followed businesses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-sage">
            <Heart className="h-3.5 w-3.5" /> Following
          </div>
          <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
            Following
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Businesses you’re tracking on BlakNet.
          </p>
        </div>
        {!loading && items.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "business" : "businesses"}
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <FollowingCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/25 bg-destructive/5 px-6 py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </div>
          <h3 className="font-display text-xl tracking-tight text-ink">
            Could not load followed businesses
          </h3>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-5" onClick={load}>
            Try again
          </Button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon={Heart}
          title="You’re not following any businesses yet."
          description="Follow businesses to track their updates, events and announcements."
          action={
            <Button
              className="bg-ink text-cream hover:bg-ink/90"
              onClick={() => navigate({ name: "directory" })}
            >
              Explore the directory <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          }
        />
      )}

      {/* Grid */}
      {!loading && !error && items.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((b, i) => (
            <FollowedCard
              key={b.id}
              business={b}
              index={i}
              onView={() => navigate({ name: "business", slug: b.slug })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FollowedCard({
  business,
  index,
  onView,
}: {
  business: FollowedBusiness;
  index: number;
  onView: () => void;
}) {
  const followedAt = business.followedAt
    ? formatDate(business.followedAt, { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div
      className={cn(
        "card-lift animate-fade-in-up flex flex-col overflow-hidden rounded-xl border border-border bg-card",
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      {/* Top strip with logo */}
      <div className="relative h-20 w-full bg-ink-grain">
        <div className="absolute left-4 bottom-0 translate-y-1/2">
          {business.logoUrl ? (
            <img
              src={business.logoUrl}
              alt={business.name}
              className="h-14 w-14 rounded-lg border-2 border-card object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-card bg-ink font-display text-xl text-cream">
              {business.name[0]?.toUpperCase() ?? "?"}
            </div>
          )}
        </div>
        {business.verificationStatus === "VERIFIED" && (
          <div className="absolute right-3 top-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-sage/15 px-2 py-0.5 text-[11px] font-medium text-cream backdrop-blur-sm">
              <VerifiedBadge status="VERIFIED" />
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-9">
        <h3 className="font-display text-lg leading-tight tracking-tight text-ink">
          {business.name}
        </h3>
        {business.tagline && (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{business.tagline}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-foreground/60">
          {business.industry?.name && (
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {business.industry.name}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {provinceCity(business)}
          </span>
        </div>

        {business.bbbeeLevel && (
          <div className="mt-2">
            <BBBEEBadge level={business.bbbeeLevel} />
          </div>
        )}

        {followedAt && (
          <p className="mt-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <CalendarHeart className="h-3 w-3" />
            Following since {followedAt}
          </p>
        )}

        <div className="mt-4 flex items-center justify-end border-t border-border pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
            className="btn-lift"
          >
            View profile <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function FollowingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Skeleton className="h-20 w-full" />
      <div className="space-y-3 px-4 pb-4 pt-9">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}
