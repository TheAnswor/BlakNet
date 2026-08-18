"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
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
import { formatDate, formatNumber, initials, timeAgo } from "@/lib/format";
import {
  Newspaper,
  Heart,
  MessageCircle,
  Eye,
  Building2,
  AlertCircle,
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
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [type, setType] = useState<string>("all");
  const [reloadKey, setReloadKey] = useState(0);

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

      {/* note */}
      <p className="text-xs italic text-muted-foreground">
        Post moderation tools coming soon.
      </p>

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
            <PostCard key={p.id} post={p} delayMs={i * 35} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, delayMs }: { post: Post; delayMs: number }) {
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
