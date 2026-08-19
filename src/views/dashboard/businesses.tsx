"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/blaknet/section";
import { VerifiedBadge, BBBEEBadge, Pill } from "@/components/blaknet/badges";
import type { Business } from "@/lib/types";
import { formatNumber, provinceCity, verificationLabel } from "@/lib/format";
import {
  Building2,
  Plus,
  ArrowRight,
  Eye,
  Pencil,
  Clock,
  MapPin,
} from "lucide-react";

export function MyBusinessesView() {
  const { navigate } = useApp();
  const [items, setItems] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ items: Business[] }>("/api/businesses/owner")
      .then((d) => {
        if (cancelled) return;
        setItems(d.items ?? []);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message || "Could not load your businesses.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="space-y-6">
        {/* Page heading */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-sage">
            <Building2 className="h-3.5 w-3.5" /> My Businesses
          </div>
          <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
            Your business portfolio.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Manage the profiles that represent your ventures on BlakNet. Track views,
            profile completion and verification status in one place.
          </p>
        </div>
        <Button
          onClick={() => navigate({ name: "dashboard-business-new" })}
          className="bg-ink text-cream hover:bg-ink/90"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add a business
        </Button>
      </div>

      {/* Body */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={Building2}
          title="Something went wrong."
          description={error}
          action={
            <Button
              variant="outline"
              onClick={() => navigate({ name: "dashboard-businesses" })}
            >
              Try again
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="You haven't added a business yet."
          description="Create your free business profile to get discovered, collect reviews and start building your network. It takes less than 5 minutes."
          action={
            <Button
              onClick={() => navigate({ name: "dashboard-business-new" })}
              className="bg-ink text-cream hover:bg-ink/90"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add your business
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((b) => (
            <BusinessRow
              key={b.id}
              b={b}
              onEdit={() => navigate({ name: "dashboard-business", id: b.id })}
              onView={() => navigate({ name: "business", slug: b.slug })}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

function BusinessRow({
  b,
  onEdit,
  onView,
}: {
  b: Business;
  onEdit: () => void;
  onView: () => void;
}) {
  return (
    <div className="card-lift group flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:p-5">
      {/* logo */}
      <div className="flex items-start gap-4 sm:flex-1">
        {b.logoUrl ? (
          <img
            src={b.logoUrl}
            alt={b.name}
            className="h-14 w-14 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-ink font-display text-xl text-cream">
            {b.name[0]?.toUpperCase() ?? "?"}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-display text-lg tracking-tight text-ink">
              {b.name}
            </h3>
            <VerifiedBadge status={b.verificationStatus} />
            <BBBEEBadge level={b.bbbeeLevel} />
            {b.featured && <Pill tone="cream">Featured</Pill>}
          </div>

          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
            {b.tagline || b.industry?.name || "No tagline yet"}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {provinceCity(b)}
            </span>
            {b.industry && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {b.industry.name}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatNumber(b.views)} views
            </span>
            {b.verificationStatus === "NOT_VERIFIED" && (
              <span className="inline-flex items-center gap-1 text-foreground/40">
                <Clock className="h-3 w-3" /> {verificationLabel(b.verificationStatus)}
              </span>
            )}
          </div>

          {/* Profile completion */}
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 w-32 max-w-full">
              <Progress value={b.profileCompletion} className="h-1.5" />
            </div>
            <span className="text-[11px] text-muted-foreground">
              {b.profileCompletion}% complete
            </span>
            {b.profileCompletion < 80 && (
              <span className="hidden text-[11px] text-foreground/40 sm:inline">
                · add more detail to boost discovery
              </span>
            )}
          </div>
        </div>
      </div>

      {/* actions */}
      <div className="flex shrink-0 items-center gap-2 sm:pl-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="border-border bg-background hover:bg-muted"
        >
          <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
        </Button>
        <Button
          size="sm"
          onClick={onView}
          className="bg-ink text-cream hover:bg-ink/90"
        >
          View profile <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}


