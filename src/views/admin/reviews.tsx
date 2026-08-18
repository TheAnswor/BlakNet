"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { api, qs } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill } from "@/components/blaknet/badges";
import { EmptyState } from "@/components/blaknet/section";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { timeAgo, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Star,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

interface ReviewBusiness {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

interface AdminReview {
  id: string;
  businessId: string;
  business: ReviewBusiness;
  reviewerName: string;
  reviewerCompany: string | null;
  rating: number;
  review: string;
  verificationStatus: ReviewStatus;
  createdAt: string;
}

interface ReviewsResponse {
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  items: AdminReview[];
}

type LoadState =
  | { kind: "loading" }
  | { kind: "forbidden" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: ReviewsResponse };

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${rating} stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < Math.round(rating) ? "fill-sage text-sage" : "fill-transparent text-muted-foreground/30",
          )}
        />
      ))}
    </span>
  );
}

function statusTone(status: ReviewStatus): "ink" | "sage" | "cream" | "neutral" {
  switch (status) {
    case "APPROVED":
      return "sage";
    case "REJECTED":
      return "neutral";
    default:
      return "cream";
  }
}

function statusLabel(status: ReviewStatus): string {
  switch (status) {
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    default:
      return "Pending";
  }
}

export function AdminReviewsView() {
  const { navigate } = useApp();
  const { toast } = useToast();
  const [status, setStatus] = useState<ReviewStatus>("PENDING");
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const path = `/api/admin/reviews${qs({ status, page })}`;
        const data = await api<ReviewsResponse>(path);
        if (!cancelled) setState({ kind: "ready", data });
      } catch (err) {
        if (cancelled) return;
        const e = err as Error & { status?: number };
        if (e.status === 403) setState({ kind: "forbidden" });
        else setState({ kind: "error", message: e.message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, page, reloadKey]);

  const onStatusChange = (next: ReviewStatus) => {
    setStatus(next);
    setPage(1);
    setState({ kind: "loading" });
  };

  const actOnReview = async (review: AdminReview, next: ReviewStatus) => {
    setActioningId(review.id);
    const prev = review.verificationStatus;
    // optimistic: remove from list (for pending view)
    setState((s) => {
      if (s.kind !== "ready") return s;
      return {
        kind: "ready",
        data: {
          ...s.data,
          items: s.data.items.filter((r) => r.id !== review.id),
          total: Math.max(0, s.data.total - 1),
        },
      };
    });
    try {
      await api("/api/admin/reviews", {
        method: "PATCH",
        json: { id: review.id, status: next },
      });
      toast({
        title: next === "APPROVED" ? "Review approved" : "Review rejected",
        description: `${review.reviewerName}'s review of ${review.business.name} was marked ${next.toLowerCase()}.`,
      });
    } catch (err) {
      // restore
      setState((s) => {
        if (s.kind !== "ready") return s;
        const items = [...s.data.items];
        // re-insert at original position if possible
        items.unshift({ ...review, verificationStatus: prev });
        return {
          kind: "ready",
          data: { ...s.data, items, total: s.data.total + 1 },
        };
      });
      const e = err as Error;
      toast({
        title: "Action failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setActioningId(null);
    }
  };

  if (state.kind === "loading") {
    return <ReviewsSkeleton />;
  }
  if (state.kind === "forbidden") {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Admin access required."
        description="You need an admin account to moderate reviews."
        action={
          <Button
            onClick={() => navigate({ name: "dashboard" })}
            className="bg-ink text-cream hover:bg-ink/90"
          >
            <ArrowRight className="mr-1.5 h-4 w-4" /> Back to dashboard
          </Button>
        }
      />
    );
  }
  if (state.kind === "error") {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load reviews."
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

  const { data } = state;
  const items = data.items;

  const emptyByStatus: Record<ReviewStatus, { title: string; description: string }> = {
    PENDING: {
      title: "No reviews awaiting moderation.",
      description: "You're all caught up — no pending reviews to moderate.",
    },
    APPROVED: {
      title: "No approved reviews.",
      description: "Approved reviews will be listed here.",
    },
    REJECTED: {
      title: "No rejected reviews.",
      description: "Rejected reviews will be listed here.",
    },
  };

  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <Pill tone="sage" className="mb-2">
          <Star className="h-3 w-3" /> Moderation
        </Pill>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Reviews</h1>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Moderate business reviews. Approve, reject, or review submitted reviews.
        </p>
      </div>

      {/* status tabs */}
      <Tabs value={status} onValueChange={(v) => onStatusChange(v as ReviewStatus)}>
        <TabsList>
          <TabsTrigger value="PENDING" className="gap-1.5">
            Pending
          </TabsTrigger>
          <TabsTrigger value="APPROVED" className="gap-1.5">
            Approved
          </TabsTrigger>
          <TabsTrigger value="REJECTED" className="gap-1.5">
            Rejected
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {items.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={emptyByStatus[status].title}
          description={emptyByStatus[status].description}
        />
      ) : (
        <div className="space-y-4">
          {items.map((r, i) => (
            <ReviewCard
              key={r.id}
              review={r}
              showActions={status === "PENDING"}
              actioning={actioningId === r.id}
              onApprove={() => actOnReview(r, "APPROVED")}
              onReject={() => actOnReview(r, "REJECTED")}
              onOpenBusiness={() => navigate({ name: "business", slug: r.business.slug })}
              delayMs={i * 40}
            />
          ))}
        </div>
      )}

      {/* pagination */}
      {items.length > 0 && data.pages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Page {data.page} of {data.pages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={data.page <= 1}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={data.page >= data.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewCard({
  review,
  showActions,
  actioning,
  onApprove,
  onReject,
  onOpenBusiness,
  delayMs,
}: {
  review: AdminReview;
  showActions: boolean;
  actioning: boolean;
  onApprove: () => void;
  onReject: () => void;
  onOpenBusiness: () => void;
  delayMs: number;
}) {
  return (
    <div
      className="animate-fade-in-up rounded-xl border border-border bg-card p-5"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <button onClick={onOpenBusiness} className="group inline-flex items-center gap-1.5 text-left">
            <h3 className="font-display text-lg tracking-tight">{review.business.name}</h3>
            <ArrowRight className="h-3.5 w-3.5 text-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-ink" />
          </button>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">{review.reviewerName}</p>
              {review.reviewerCompany && (
                <p className="text-xs text-muted-foreground">{review.reviewerCompany}</p>
              )}
            </div>
            <Stars rating={review.rating} />
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              {timeAgo(review.createdAt)}
            </span>
          </div>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
            {review.review}
          </p>

          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            Submitted {formatDate(review.createdAt)}
          </div>
        </div>

        {/* actions */}
        {showActions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
            <Button
              size="sm"
              onClick={onApprove}
              disabled={actioning}
              className="bg-sage text-ink hover:bg-sage/90"
            >
              {actioning ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              )}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              disabled={actioning}
              className="border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
            >
              <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
            </Button>
          </div>
        ) : (
          <div className="shrink-0">
            <Pill tone={statusTone(review.verificationStatus)}>
              {statusLabel(review.verificationStatus)}
            </Pill>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-9 w-40 rounded-md" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>
      <Skeleton className="h-9 w-72 rounded-lg" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
