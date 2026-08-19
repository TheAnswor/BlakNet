"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Pill, VerifiedBadge } from "@/components/blaknet/badges";
import { EmptyState } from "@/components/blaknet/section";
import { formatNumber, provinceCity } from "@/lib/format";
import type { Business } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Users,
  UserPlus,
  Building2,
  UserCheck,
  ArrowRight,
  Sparkles,
  AlertCircle,
  MapPin,
} from "lucide-react";

// Followed businesses include the date the user started following.
type FollowedBusiness = Business & { followedAt?: string | null };

type NetworkTab = "following" | "followers";

export function NetworkView() {
  const { navigate } = useApp();
  const [tab, setTab] = useState<NetworkTab>("following");

  // Following state
  const [following, setFollowing] = useState<FollowedBusiness[]>([]);
  const [followingLoading, setFollowingLoading] = useState(true);
  const [followingError, setFollowingError] = useState<string | null>(null);

  // Followers state (user's own businesses + follower counts)
  const [owned, setOwned] = useState<Business[]>([]);
  const [ownedLoading, setOwnedLoading] = useState(true);
  const [ownedError, setOwnedError] = useState<string | null>(null);

  async function loadFollowing() {
    setFollowingLoading(true);
    setFollowingError(null);
    try {
      const data = await api<{ items: FollowedBusiness[] }>(
        "/api/businesses/followed",
      );
      setFollowing(data.items ?? []);
    } catch (e) {
      setFollowingError(
        e instanceof Error ? e.message : "Could not load who you're following.",
      );
    } finally {
      setFollowingLoading(false);
    }
  }

  async function loadOwned() {
    setOwnedLoading(true);
    setOwnedError(null);
    try {
      const data = await api<{ items: Business[] }>("/api/businesses/owner");
      setOwned(data.items ?? []);
    } catch (e) {
      setOwnedError(
        e instanceof Error ? e.message : "Could not load your businesses.",
      );
    } finally {
      setOwnedLoading(false);
    }
  }

  useEffect(() => {
    loadFollowing();
    loadOwned();
  }, []);

  const totalFollowers = owned.reduce(
    (sum, b) => sum + (b.followerCount ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="max-w-2xl">
        <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-sage">
          <Users className="h-3.5 w-3.5" /> My Network
        </div>
        <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
          My Network
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          People and businesses you follow, and those following you.
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as NetworkTab)}
        className="gap-4"
      >
        <TabsList>
          <TabsTrigger value="following" className="gap-1.5">
            <UserCheck className="h-3.5 w-3.5" />
            Following
            {!followingLoading && following.length > 0 && (
              <span className="ml-1 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] font-medium text-foreground/70">
                {following.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="followers" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Followers
            {!ownedLoading && totalFollowers > 0 && (
              <span className="ml-1 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] font-medium text-foreground/70">
                {formatNumber(totalFollowers)}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Following tab */}
        <TabsContent value="following" className="mt-2 outline-none">
          <FollowingPanel
            items={following}
            loading={followingLoading}
            error={followingError}
            onRetry={loadFollowing}
            onOpen={(slug) => navigate({ name: "business", slug })}
            onExplore={() => navigate({ name: "directory" })}
          />
        </TabsContent>

        {/* Followers tab */}
        <TabsContent value="followers" className="mt-2 outline-none">
          <FollowersPanel
            items={owned}
            loading={ownedLoading}
            error={ownedError}
            totalFollowers={totalFollowers}
            onRetry={loadOwned}
            onOpenBusiness={(slug) => navigate({ name: "business", slug })}
            onAddBusiness={() => navigate({ name: "dashboard-business-new" })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =================== Following panel ===================

function FollowingPanel({
  items,
  loading,
  error,
  onRetry,
  onOpen,
  onExplore,
}: {
  items: FollowedBusiness[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpen: (slug: string) => void;
  onExplore: () => void;
}) {
  const comingSoonNote = (
    <p className="mx-auto flex max-w-md items-center justify-center gap-1.5 text-center text-[12px] text-muted-foreground">
      <Sparkles className="h-3 w-3 text-sage" />
      User-to-user following is coming soon — for now, follow businesses to stay updated.
    </p>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <NetworkCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load who you're following"
        description={error}
        action={
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-5">
        <EmptyState
          icon={Users}
          title="You're not following any businesses yet."
          description="Follow businesses to see their updates in your feed."
          action={
            <Button
              className="btn-lift bg-ink text-cream hover:bg-ink/90"
              onClick={onExplore}
            >
              Explore the directory
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          }
        />
        {comingSoonNote}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Following{" "}
        <span className="font-medium text-foreground/80">{items.length}</span>{" "}
        {items.length === 1 ? "business" : "businesses"}
      </p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((b, i) => (
          <FollowingCard
            key={b.id}
            business={b}
            index={i}
            onOpen={() => onOpen(b.slug)}
          />
        ))}
      </div>
      {comingSoonNote}
    </div>
  );
}

function FollowingCard({
  business,
  index,
  onOpen,
}: {
  business: FollowedBusiness;
  index: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "card-lift animate-fade-in-up group flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left",
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
            <Pill tone="cream">
              <VerifiedBadge status="VERIFIED" />
            </Pill>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-9">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg leading-tight tracking-tight text-ink">
            {business.name}
          </h3>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-foreground/30 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
        </div>
        {business.tagline ? (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
            {business.tagline}
          </p>
        ) : (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground/60">
            No tagline yet.
          </p>
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

        <div className="mt-4 flex items-center justify-end border-t border-border pt-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sage">
            <UserCheck className="h-3 w-3" />
            Following
          </span>
        </div>
      </div>
    </button>
  );
}

// =================== Followers panel ===================

function FollowersPanel({
  items,
  loading,
  error,
  totalFollowers,
  onRetry,
  onOpenBusiness,
  onAddBusiness,
}: {
  items: Business[];
  loading: boolean;
  error: string | null;
  totalFollowers: number;
  onRetry: () => void;
  onOpenBusiness: (slug: string) => void;
  onAddBusiness: () => void;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-48" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <NetworkCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load your followers"
        description={error}
        action={
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No followers yet."
        description="Create a business page to start building your following."
        action={
          <Button
            className="btn-lift bg-ink text-cream hover:bg-ink/90"
            onClick={onAddBusiness}
          >
            <UserPlus className="mr-1.5 h-4 w-4" /> Add a business
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground/80">
          {formatNumber(totalFollowers)}
        </span>{" "}
        {totalFollowers === 1 ? "person follows" : "people follow"} your{" "}
        {items.length === 1 ? "business" : "businesses"}
      </p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((b, i) => (
          <FollowerCard
            key={b.id}
            business={b}
            index={i}
            onOpen={() => onOpenBusiness(b.slug)}
          />
        ))}
      </div>
    </div>
  );
}

function FollowerCard({
  business,
  index,
  onOpen,
}: {
  business: Business;
  index: number;
  onOpen: () => void;
}) {
  const count = business.followerCount ?? 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="card-lift animate-fade-in-up group flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left"
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
            <Pill tone="cream">
              <VerifiedBadge status="VERIFIED" />
            </Pill>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-9">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg leading-tight tracking-tight text-ink">
            {business.name}
          </h3>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-foreground/30 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
        </div>
        {business.tagline ? (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
            {business.tagline}
          </p>
        ) : (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground/60">
            No tagline yet.
          </p>
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

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground/80">
            <Users className="h-3.5 w-3.5 text-sage" />
            {formatNumber(count)} {count === 1 ? "follower" : "followers"}
          </span>
          <span className="text-[11px] text-muted-foreground transition-colors group-hover:text-ink">
            View profile
          </span>
        </div>
      </div>
    </button>
  );
}

// =================== Shared skeleton ===================

function NetworkCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Skeleton className="h-20 w-full" />
      <div className="space-y-3 px-4 pb-4 pt-9">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>
    </div>
  );
}
