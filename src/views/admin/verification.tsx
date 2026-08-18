"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pill } from "@/components/blaknet/badges";
import { EmptyState } from "@/components/blaknet/section";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { timeAgo, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  FileText,
  Mail,
} from "lucide-react";

type Status = "APPROVED" | "REJECTED" | "INFO_REQUESTED";

interface VerificationUser {
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface VerificationBusiness {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  ownerId: string;
}

interface VerificationItem {
  id: string;
  businessId: string;
  business: VerificationBusiness;
  user: VerificationUser;
  verificationType: string;
  notes: string | null;
  documentUrl: string | null;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  adminNotes: string | null;
}

interface VerificationResponse {
  items: VerificationItem[];
}

type LoadState =
  | { kind: "loading" }
  | { kind: "forbidden" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: VerificationItem[] };

type PillTone = "ink" | "sage" | "cream" | "neutral";

function typePill(verificationType: string): { tone: PillTone; label: string } {
  const map: Record<string, { tone: PillTone; label: string }> = {
    cipc: { tone: "ink", label: "CIPC" },
    bbbee: { tone: "sage", label: "B-BBEE" },
    tax: { tone: "cream", label: "Tax" },
    certification: { tone: "neutral", label: "Certification" },
  };
  const key = verificationType.toLowerCase();
  return map[key] ?? { tone: "neutral", label: verificationType };
}

export function AdminVerificationView() {
  const { navigate } = useApp();
  const { toast } = useToast();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [dialog, setDialog] = useState<{ item: VerificationItem; status: Status } | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api<VerificationResponse>("/api/admin/verification");
        if (!cancelled) setState({ kind: "ready", items: data.items ?? [] });
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
  }, [reloadKey]);

  const openDialog = (item: VerificationItem, status: Status) => {
    setAdminNotes("");
    setDialog({ item, status });
  };

  const closeDialog = () => {
    if (submitting) return;
    setDialog(null);
  };

  const submit = async () => {
    if (!dialog) return;
    setSubmitting(true);
    const item = dialog.item;
    const status = dialog.status;
    try {
      await api("/api/admin/verification", {
        method: "PATCH",
        json: { id: item.id, status, adminNotes: adminNotes.trim() || null },
      });
      const verb =
        status === "APPROVED" ? "Verification approved" : status === "REJECTED" ? "Verification rejected" : "Info requested";
      toast({
        title: verb,
        description: `${item.business.name} marked as ${status.toLowerCase().replace("_", " ")}.`,
      });
      setState((s) =>
        s.kind === "ready" ? { kind: "ready", items: s.items.filter((i) => i.id !== item.id) } : s,
      );
      setDialog(null);
    } catch (err) {
      const e = err as Error;
      toast({
        title: "Action failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (state.kind === "loading") {
    return <QueueSkeleton />;
  }
  if (state.kind === "forbidden") {
    return (
      <EmptyState
        icon={Shield}
        title="Admin access required."
        description="You need an admin account to view the verification queue."
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
        title="Couldn't load the queue."
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

  const items = state.items;

  return (
    <div className="space-y-6">
      {/* header + stats strip */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Pill tone="sage" className="mb-2">
            <ShieldCheck className="h-3 w-3" /> Verification
          </Pill>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Verification Queue</h1>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Review businesses that have submitted verification documents. Approve, reject, or request more information.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
          <Clock className="h-4 w-4 text-sage" />
          <span className="font-display text-2xl tracking-tight">{items.length}</span>
          <span className="text-xs text-muted-foreground">{items.length === 1 ? "pending" : "pending"}</span>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No pending verifications."
          description="All businesses are verified or rejected. Great work."
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <VerificationCard
              key={item.id}
              item={item}
              onAction={(status) => openDialog(item, status)}
              onOpenBusiness={() => navigate({ name: "business", slug: item.business.slug })}
            />
          ))}
        </div>
      )}

      {/* confirm dialog */}
      <Dialog open={!!dialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.status === "APPROVED" && "Approve verification?"}
              {dialog?.status === "REJECTED" && "Reject verification?"}
              {dialog?.status === "INFO_REQUESTED" && "Request more information?"}
            </DialogTitle>
            <DialogDescription>
              {dialog && (
                <>
                  You&apos;re about to mark{" "}
                  <span className="font-medium text-foreground">{dialog.item.business.name}</span> as{" "}
                  {dialog.status.toLowerCase().replace("_", " ")}.{" "}
                  {dialog.status === "APPROVED" && "Their profile will display a verified badge."}
                  {dialog.status === "REJECTED" && "They'll need to resubmit to be reconsidered."}
                  {dialog.status === "INFO_REQUESTED" && "We'll notify them to provide additional details."}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Admin notes <span className="text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              placeholder={
                dialog?.status === "INFO_REQUESTED"
                  ? "e.g. Please attach a clear CIPC certificate."
                  : "Internal note about this decision."
              }
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={submitting}
              className={cn(
                dialog?.status === "APPROVED" && "bg-sage text-ink hover:bg-sage/90",
                dialog?.status === "REJECTED" && "bg-destructive text-white hover:bg-destructive/90",
                dialog?.status === "INFO_REQUESTED" && "bg-ink text-cream hover:bg-ink/90",
              )}
            >
              {submitting
                ? "Saving…"
                : dialog?.status === "APPROVED"
                  ? "Approve"
                  : dialog?.status === "REJECTED"
                    ? "Reject"
                    : "Request info"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VerificationCard({
  item,
  onAction,
  onOpenBusiness,
}: {
  item: VerificationItem;
  onAction: (status: Status) => void;
  onOpenBusiness: () => void;
}) {
  const user = item.user;
  const userName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email.split("@")[0];
  const pill = typePill(item.verificationType);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* left: business + requester */}
        <div className="flex flex-1 items-start gap-3">
          <button onClick={onOpenBusiness} className="shrink-0" aria-label={`Open ${item.business.name}`}>
            {item.business.logoUrl ? (
              <img
                src={item.business.logoUrl}
                alt={item.business.name}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-ink font-display text-cream">
                {item.business.name[0]}
              </div>
            )}
          </button>
          <div className="min-w-0 flex-1">
            <button onClick={onOpenBusiness} className="group inline-flex items-center gap-1.5 text-left">
              <h3 className="font-display text-lg tracking-tight">{item.business.name}</h3>
              <ArrowRight className="h-3.5 w-3.5 text-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-ink" />
            </button>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Pill tone={pill.tone}>{pill.label}</Pill>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> Submitted {timeAgo(item.createdAt)}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-muted text-[10px] font-semibold">{initials(user)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{userName}</p>
                <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
              </div>
            </div>
            {item.notes && (
              <p className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-xs text-foreground/80">
                <span className="font-medium">Notes: </span>
                {item.notes}
              </p>
            )}
            {item.documentUrl && (
              <a
                href={item.documentUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-sage hover:underline"
              >
                <FileText className="h-3 w-3" /> View submitted document
              </a>
            )}
          </div>
        </div>

        {/* actions */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
          <Button
            size="sm"
            onClick={() => onAction("APPROVED")}
            className="bg-sage text-ink hover:bg-sage/90"
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction("REJECTED")}
            className="border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
          >
            <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onAction("INFO_REQUESTED")}>
            <Mail className="mr-1 h-3.5 w-3.5" /> Request info
          </Button>
        </div>
      </div>
    </div>
  );
}

function QueueSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-9 w-48 rounded-md" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <Skeleton className="h-14 w-32 rounded-lg" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
