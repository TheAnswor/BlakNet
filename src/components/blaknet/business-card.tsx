import { cn } from "@/lib/utils";
import type { Business } from "@/lib/types";
import { VerifiedBadge, BBBEEBadge, Pill } from "./badges";
import { StarRating } from "./star-rating";
import { provinceCity } from "@/lib/format";
import { MapPin, Eye, ArrowUpRight } from "lucide-react";

export function BusinessCard({
  business,
  onNavigate,
  className,
}: {
  business: Business & { rating?: number; reviewCount?: number };
  onNavigate?: (slug: string) => void;
  className?: string;
}) {
  const b = business as Business & { rating?: number; reviewCount?: number };
  return (
    <button
      type="button"
      onClick={() => onNavigate?.(b.slug)}
      className={cn(
        "card-lift group relative flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left",
        className,
      )}
    >
      {/* top strip */}
      <div className="relative h-24 w-full bg-ink-grain">
        <div className="absolute left-4 bottom-0 translate-y-1/2">
          {b.logoUrl ? (
             
            <img
              src={b.logoUrl}
              alt={b.name}
              className="h-14 w-14 rounded-lg border-2 border-card object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-card bg-ink font-display text-xl text-cream">
              {b.name[0]}
            </div>
          )}
        </div>
        <div className="absolute right-3 top-3 flex flex-wrap gap-1.5 justify-end">
          {b.featured && <Pill tone="cream">Featured</Pill>}
          {b.verificationStatus === "VERIFIED" && (
            <Pill tone="cream">
              <VerifiedBadge status="VERIFIED" />
            </Pill>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-9">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg leading-tight tracking-tight">{b.name}</h3>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-foreground/30 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
        </div>
        {b.tagline && (
          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{b.tagline}</p>
        )}

        <div className="mt-2 flex items-center gap-2 text-[12px] text-foreground/60">
          <span className="font-medium text-foreground/80">
            {b.industry?.name ?? "—"}
          </span>
          <span className="text-foreground/20">·</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {provinceCity(b)}
          </span>
        </div>

        {b.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-foreground/70">
            {b.description}
          </p>
        )}

        {b.services && b.services.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {b.services.slice(0, 3).map((s) => (
              <Pill key={s.id} tone="neutral">
                {s.name}
              </Pill>
            ))}
            {b.services.length > 3 && (
              <Pill tone="neutral">+{b.services.length - 3}</Pill>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <StarRating
            rating={b.rating ?? 0}
            count={b.reviewCount}
            showValue
          />
          <span className="inline-flex items-center gap-1 text-[11px] text-foreground/40">
            <Eye className="h-3 w-3" />
            {b.views.toLocaleString("en-ZA")}
          </span>
        </div>

        {b.bbbeeLevel && (
          <div className="mt-2">
            <BBBEEBadge level={b.bbbeeLevel} />
          </div>
        )}
      </div>
    </button>
  );
}

export function BusinessCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div className="h-24 w-full animate-pulse bg-muted" />
      <div className="space-y-3 px-4 pb-4 pt-9">
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-12 w-full animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
