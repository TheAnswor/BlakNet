"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pill } from "@/components/blaknet/badges";
import { EmptyState } from "@/components/blaknet/section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, formatNumber, initials, timeAgo } from "@/lib/format";
import {
  Newspaper,
  Heart,
  MessageCircle,
  Eye,
  Building2,
  AlertCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import type { Post } from "@/lib/types";

interface PostsResponse {
  items: Post[];
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: Post[] };

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All post types" },
  { value: "text", label: "Text" },
  { value: "announcement", label: "Announcement" },
  { value: "opportunity", label: "Opportunity" },
];

function typeTone(type: string): "sage" | "ink" | "cream" | "neutral" {
  switch (type) {
    case "announcement":
      return "ink";
    case "opportunity":
      return "sage";
    case "text":
      return "neutral";
    default:
      return "neutral";
  }
}

function typeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function AdminNewsfeedView() {
  const { toast } = useToast();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [type, setType] = useState<string>("all");
  const [reloadKey, setReloadKey] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api<PostsResponse>("/api/posts");
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
  }, [reloadKey]);

  const filtered = useMemo(() => {
    if (state.kind !== "ready") return [];
    if (type === "all") return state.items;
    return state.items.filter((p) => p.postType === type);
  }, [state, type]);

  const deleteTarget =
    state.kind === "ready"
      ? state.items.find((p) => p.id === deleteId) ?? null
      : null;

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    // Optimistic removal from local state
    const removedId = deleteId;
    setState((prev) =>
      prev.kind === "ready"
        ? { kind: "ready", items: prev.items.filter((p) => p.id !== removedId) }
        : prev,
    );
    setDeleteId(null);
    try {
      await api(`/api/posts/${removedId}`, { method: "DELETE" });
      toast({ title: "Post deleted" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not delete post.";
      toast({ title: "Couldn't delete post", description: msg, variant: "destructive" });
      // Revert — refetch
      setReloadKey((k) => k + 1);
      setState({ kind: "loading" });
    } finally {
      setDeleting(false);
    }
  }

  if (state.kind === "loading") {
    return <NewsfeedSkeleton />;
  }
  if (state.kind === "error") {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load posts."
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
          <Newspaper className="h-3 w-3" /> Community
        </Pill>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Newsfeed</h1>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Monitor community posts and engagement.
        </p>
      </div>

      {/* filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-9 w-full sm:w-[200px]">
            <SelectValue placeholder="All post types" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{formatNumber(filtered.length)}</span>{" "}
          {filtered.length === 1 ? "post" : "posts"}
        </p>
      </div>

      {/* list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No posts found."
          description="Community posts will appear here once users start sharing."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((p, i) => (
            <PostCard
              key={p.id}
              post={p}
              delayMs={i * 35}
              onDelete={() => setDeleteId(p.id)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this post?</DialogTitle>
            <DialogDescription>
              This can&apos;t be undone. The post will be removed from the public
              newsfeed{deleteTarget?.title ? ` — \u201c${deleteTarget.title}\u201d` : ""}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="mr-1.5 h-4 w-4" /> Delete post
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PostCard({
  post,
  delayMs,
  onDelete,
}: {
  post: Post;
  delayMs: number;
  onDelete: () => void;
}) {
  const name =
    [post.author.firstName, post.author.lastName].filter(Boolean).join(" ") ||
    post.author.email.split("@")[0];
  const likes = post._count?.likes ?? 0;
  const comments = post._count?.comments ?? 0;
  return (
    <div
      className="animate-fade-in-up rounded-xl border border-border bg-card p-5"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-ink text-xs font-semibold text-cream">
            {initials(post.author)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-foreground">{name}</span>
            <span className="text-xs text-muted-foreground">· {post.author.email}</span>
            <Pill tone={typeTone(post.postType)}>{typeLabel(post.postType)}</Pill>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(post.createdAt)}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onDelete}
          className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label="Delete post"
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
        </Button>
      </div>

      {post.title && (
        <h3 className="mt-3 font-display text-lg tracking-tight">{post.title}</h3>
      )}
      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.content}</p>

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" /> {formatNumber(post.views)} views
        </span>
        <span className="inline-flex items-center gap-1">
          <Heart className="h-3.5 w-3.5" /> {formatNumber(likes)} likes
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" /> {formatNumber(comments)} comments
        </span>
        {post.business && (
          <span className="inline-flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" /> {post.business.name}
          </span>
        )}
        <span className="ml-auto text-[11px] text-muted-foreground/70">
          Posted {formatDate(post.createdAt)}
        </span>
      </div>
    </div>
  );
}

function NewsfeedSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-9 w-40 rounded-md" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-[200px] rounded-md" />
        <Skeleton className="h-4 w-32 rounded-md" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
