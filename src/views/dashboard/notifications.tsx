"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/blaknet/section";
import { timeAgo } from "@/lib/format";
import type { Notification } from "@/lib/types";
import {
  Bell,
  CheckCheck,
  AlertCircle,
  ShieldCheck,
  Star,
  Users,
  Calendar,
  MessageCircle,
  CreditCard,
  Mail,
  Sparkles,
  Check,
} from "lucide-react";

export function NotificationsView() {
  const { toast } = useToast();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ items: Notification[] }>("/api/notifications");
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const unread = items.filter((n) => !n.read).length;

  async function markAll() {
    setMarkingAll(true);
    try {
      await api("/api/notifications/read", { method: "POST" });
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      toast({ title: "All caught up", description: "Marked all notifications as read." });
    } catch (e) {
      toast({
        title: "Couldn't mark all as read",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setMarkingAll(false);
    }
  }

  async function markOne(n: Notification) {
    if (n.read) return;
    // optimistic
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    try {
      await api("/api/notifications/read", { method: "POST", json: { id: n.id } });
    } catch {
      // revert on failure
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: false } : x)));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Notifications</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Reviews, verifications, connections and updates — all in one place.
          </p>
        </div>
        <Button
          onClick={markAll}
          disabled={markingAll || unread === 0}
          variant="outline"
          size="sm"
        >
          <CheckCheck className="mr-1.5 h-4 w-4" />
          {markingAll ? "Marking…" : "Mark all as read"}
          {unread > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-sage px-1.5 text-[10px] font-semibold text-ink">
              {unread}
            </span>
          )}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={AlertCircle}
          title="Couldn't load notifications"
          description={error}
          action={<Button onClick={load} variant="outline">Try again</Button>}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={CheckCheck}
          title="You're all caught up."
          description="No notifications right now."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => markOne(n)}
                  className={
                    n.read
                      ? "flex w-full items-start gap-3 px-4 py-4 text-left sm:px-5"
                      : "flex w-full items-start gap-3 bg-sage/[0.04] px-4 py-4 text-left transition-colors hover:bg-sage/[0.08] sm:px-5"
                  }
                >
                  <span
                    className={
                      n.read
                        ? "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                        : "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage/15 text-sage"
                    }
                  >
                    <NotificationIcon type={n.type} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      {!n.read && (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-sage"
                          aria-label="unread"
                        />
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-[11px] text-foreground/40">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function NotificationIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case "verification":
      return <ShieldCheck className={className} />;
    case "review":
      return <Star className={className} />;
    case "connection":
      return <Users className={className} />;
    case "event":
      return <Calendar className={className} />;
    case "comment":
      return <MessageCircle className={className} />;
    case "post":
      return <Bell className={className} />;
    case "subscription":
      return <CreditCard className={className} />;
    case "enquiry":
      return <Mail className={className} />;
    case "announcement":
      return <Sparkles className={className} />;
    default:
      return <Bell className={className} />;
  }
}
