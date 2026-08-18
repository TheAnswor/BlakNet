"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill } from "@/components/blaknet/badges";
import { SectionHeading, EmptyState } from "@/components/blaknet/section";
import type { AuthUser, Comment, Post } from "@/lib/types";
import { initials, timeAgo, formatNumber } from "@/lib/format";
import {
  Heart,
  MessageCircle,
  Share2,
  Megaphone,
  Briefcase,
  Newspaper,
  Image as ImageIcon,
  ArrowRight,
  Sparkles,
} from "lucide-react";

type PostType = "text" | "announcement" | "opportunity" | "image" | "article";

interface NewPostPayload {
  post: Post;
}

interface NewCommentPayload {
  comment: Comment;
}

const POST_TYPE_META: Record<
  PostType,
  { label: string; tone: "neutral" | "ink" | "sage" | "cream"; icon: typeof Megaphone }
> = {
  text: { label: "Text", tone: "neutral", icon: Newspaper },
  announcement: { label: "Announcement", tone: "sage", icon: Megaphone },
  opportunity: { label: "Opportunity", tone: "ink", icon: Briefcase },
  image: { label: "Image", tone: "cream", icon: ImageIcon },
  article: { label: "Article", tone: "neutral", icon: Newspaper },
};

function PostTypePill({ type }: { type: string }) {
  const meta = POST_TYPE_META[(type as PostType) ?? "text"] ?? POST_TYPE_META.text;
  const Icon = meta.icon;
  return (
    <Pill tone={meta.tone}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </Pill>
  );
}

interface AvatarUser {
  firstName: string | null;
  lastName: string | null;
  email: string;
}

function Avatar({ user, size = 36 }: { user: AvatarUser | null; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-ink font-display text-cream"
      style={{ width: size, height: size, fontSize: Math.max(11, Math.floor(size * 0.36)) }}
      aria-hidden
    >
      {initials(user)}
    </div>
  );
}

function ComposerCard({
  authUser,
  onCreated,
}: {
  authUser: AuthUser | null;
  onCreated: (p: Post) => void;
}) {
  const { toast } = useToast();
  const { navigate } = useApp();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [postType, setPostType] = useState<PostType>("text");
  const [submitting, setSubmitting] = useState(false);

  if (!authUser) {
    return (
      <section className="border border-border bg-card rounded-xl p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl tracking-tight">Sign in to post</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Join the conversation. Share announcements, opportunities and stories from your business.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" onClick={() => navigate({ name: "login" })}>
              Log in
            </Button>
            <Button className="bg-ink text-cream hover:bg-ink/90" onClick={() => navigate({ name: "register" })}>
              Join BlakNet
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const showTitle = postType !== "text";

  async function submit() {
    const trimmed = content.trim();
    if (!trimmed) {
      toast({ title: "Write something first", description: "Your post needs some content." });
      return;
    }
    if (showTitle && !title.trim()) {
      toast({ title: "Add a title", description: "Announcements and opportunities need a title." });
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        content: trimmed,
        postType,
        businessId: undefined,
      };
      if (showTitle) payload.title = title.trim();
      const data = await api<NewPostPayload>("/api/posts", {
        method: "POST",
        json: payload,
      });
      onCreated(data.post);
      setContent("");
      setTitle("");
      setPostType("text");
      toast({ title: "Posted", description: "Your post is live on the feed." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not post. Try again.";
      toast({ title: "Couldn't post", description: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="composer"
      className="card-soft border border-border bg-card rounded-xl p-5 scroll-mt-24"
    >
      <div className="flex items-start gap-3">
        <Avatar user={authUser} />
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share an update, an opportunity, or an announcement for the community…"
          className="min-h-[72px] resize-none border-0 bg-transparent px-0 pt-1.5 focus-visible:ring-0 text-[15px]"
        />
      </div>

      {showTitle && (
        <div className="mt-3 pl-12">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={postType === "announcement" ? "Announcement headline" : "Opportunity title"}
            className="bg-background"
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Type:</span>
          {(["text", "announcement", "opportunity"] as const).map((t) => {
            const meta = POST_TYPE_META[t];
            const Icon = meta.icon;
            const active = postType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setPostType(t)}
                className={
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all " +
                  (active
                    ? "border-ink bg-ink text-cream shadow-sm"
                    : "border-border bg-background text-foreground/65 hover:border-foreground/30 hover:bg-muted hover:text-foreground")
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {meta.label}
              </button>
            );
          })}
        </div>
        <Button
          onClick={submit}
          disabled={submitting || !content.trim()}
          className="btn-lift bg-ink text-cream shadow-md shadow-ink/15 hover:bg-ink/90 disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0"
        >
          {submitting ? "Posting…" : "Post"}
        </Button>
      </div>
    </section>
  );
}

function PostCard({ post, authUser }: { post: Post; authUser: AuthUser | null }) {
  const { navigate } = useApp();
  const { toast } = useToast();
  const [liked, setLiked] = useState<boolean>(post.liked ?? false);
  const [likeCount, setLikeCount] = useState<number>(post._count?.likes ?? 0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);

  const authorName =
    [post.author?.firstName, post.author?.lastName].filter(Boolean).join(" ") ||
    post.author?.email?.split("@")[0] ||
    "Member";

  function requireAuth(): boolean {
    if (!authUser) {
      toast({ title: "Log in to interact", description: "Sign in to like, comment and share." });
      return false;
    }
    return true;
  }

  async function toggleLike() {
    if (!requireAuth()) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));
    setLikeBusy(true);
    try {
      const res = await api<{ liked: boolean }>(`/api/posts/${post.id}/like`, { method: "POST" });
      setLiked(res.liked);
      setLikeCount((c) => Math.max(0, c + (res.liked ? 1 : -1) - (next ? 1 : -1)));
    } catch {
      // revert optimistically
      setLiked(!next);
      setLikeCount((c) => Math.max(0, c + (next ? -1 : 1)));
      toast({ title: "Couldn't update like", description: "Please try again." });
    } finally {
      setLikeBusy(false);
    }
  }

  async function loadComments() {
    if (commentsOpen) {
      setCommentsOpen(false);
      return;
    }
    setCommentsOpen(true);
    setCommentsLoading(true);
    try {
      const data = await api<{ items: Comment[] }>(`/api/posts/${post.id}/comments`);
      setComments(data.items ?? []);
    } catch {
      toast({ title: "Couldn't load comments", description: "Please try again." });
    } finally {
      setCommentsLoading(false);
    }
  }

  async function submitComment() {
    if (!requireAuth()) return;
    const trimmed = commentText.trim();
    if (!trimmed) return;
    setCommentSubmitting(true);
    try {
      const data = await api<NewCommentPayload>(`/api/posts/${post.id}/comments`, {
        method: "POST",
        json: { content: trimmed },
      });
      setComments((cs) => [data.comment, ...cs]);
      setCommentText("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't add comment.";
      toast({ title: "Couldn't comment", description: message });
    } finally {
      setCommentSubmitting(false);
    }
  }

  function share() {
    const url = `${window.location.origin}/#/newsfeed`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        () => toast({ title: "Link copied", description: "Share this post with your network." }),
        () => toast({ title: "Couldn't copy", description: "Copy the URL from your browser." }),
      );
    } else {
      toast({ title: "Couldn't copy", description: "Your browser blocked clipboard access." });
    }
  }

  return (
    <article className="border border-border bg-card rounded-xl p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar user={post.author} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-medium text-foreground">{authorName}</span>
              {post.business && (
                <>
                  <span className="text-foreground/40">·</span>
                  <button
                    type="button"
                    onClick={() => navigate({ name: "business", slug: post.business!.slug })}
                    className="link-underline text-sm text-foreground/80"
                  >
                    {post.business.name}
                  </button>
                </>
              )}
            </div>
            <div className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</div>
          </div>
        </div>
        <PostTypePill type={post.postType} />
      </header>

      {post.title && (
        <h3 className="mt-4 font-display text-lg tracking-tight">{post.title}</h3>
      )}

      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
        {post.content}
      </p>

      {post.imageUrl && (
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <img src={post.imageUrl} alt="" className="max-h-[520px] w-full object-cover" />
        </div>
      )}

      <footer className="mt-4 flex items-center gap-1 border-t border-border pt-3">
        <button
          type="button"
          onClick={toggleLike}
          disabled={likeBusy}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-muted disabled:opacity-50"
        >
          <Heart
            className={"h-4 w-4 " + (liked ? "fill-destructive text-destructive" : "")}
          />
          {formatNumber(likeCount)}
        </button>
        <button
          type="button"
          onClick={loadComments}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-muted"
        >
          <MessageCircle className="h-4 w-4" />
          {formatNumber(post._count?.comments ?? 0)}
        </button>
        <button
          type="button"
          onClick={share}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-muted"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </footer>

      {commentsOpen && (
        <div className="mt-3 border-t border-border pt-3">
          {authUser ? (
            <div className="mb-3 flex items-start gap-2">
              <Avatar user={authUser} size={28} />
              <div className="flex-1">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment…"
                  className="min-h-[64px]"
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    onClick={submitComment}
                    disabled={commentSubmitting || !commentText.trim()}
                    className="bg-ink text-cream hover:bg-ink/90"
                  >
                    {commentSubmitting ? "Posting…" : "Comment"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-3 rounded-lg border border-dashed border-border bg-background/50 px-4 py-3 text-sm text-muted-foreground">
              <button
                type="button"
                onClick={() => navigate({ name: "login" })}
                className="link-underline font-medium text-foreground"
              >
                Log in
              </button>{" "}
              to join the conversation.
            </div>
          )}

          {commentsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">No comments yet — be the first.</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-2">
                  <Avatar user={{ ...c.user, email: "" }} size={28} />
                  <div className="flex-1 rounded-lg bg-background/60 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {[c.user?.firstName, c.user?.lastName].filter(Boolean).join(" ") || "Member"}
                      </span>
                      <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{c.content}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}

function FeedSkeletons() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border border-border bg-card rounded-xl p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <div className="mt-4 flex gap-3">
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendingSidebar({
  filter,
  setFilter,
}: {
  filter: PostType | "all";
  setFilter: (f: PostType | "all") => void;
}) {
  const chips: { value: PostType | "all"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "text", label: "Text" },
    { value: "announcement", label: "Announcements" },
    { value: "opportunity", label: "Opportunities" },
  ];
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-24 space-y-5">
        <div className="border border-border bg-card rounded-xl p-5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-sage">
            <Sparkles className="h-3.5 w-3.5" />
            Trending types
          </div>
          <h3 className="mt-2 font-display text-lg tracking-tight">Filter the feed</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((c) => {
              const active = filter === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setFilter(c.value)}
                  className={
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                    (active
                      ? "border-ink bg-ink text-cream"
                      : "border-border bg-background text-foreground/70 hover:bg-muted")
                  }
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border border-border bg-card rounded-xl p-5">
          <h3 className="font-display text-lg tracking-tight">Community guidelines</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• Be professional and respectful.</li>
            <li>• Share real opportunities, not spam.</li>
            <li>• Cite sources when posting news.</li>
            <li>• Promote other Black businesses.</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}

export function NewsfeedView() {
  const { authUser, navigate } = useApp();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<PostType | "all">("all");
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await api<{ items: Post[] }>("/api/posts");
        if (!cancelled) {
          setPosts(d.items ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load the feed.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function prepend(post: Post) {
    setPosts((p) => [post, ...p]);
  }

  const filtered = filter === "all" ? posts : posts.filter((p) => p.postType === filter);

  return (
    <div className="flex flex-col">
      {/* HEADER */}
      <section className="bg-cream-grain">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <SectionHeading
            eyebrow="The Hustle Feed"
            title="Where Black businesses connect."
            description="Posts, opportunities and announcements from the BlakNet community."
          />
        </div>
      </section>

      {/* BODY */}
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="flex gap-8">
            <div className="min-w-0 flex-1 space-y-5">
              <ComposerCard authUser={authUser} onCreated={prepend} />

              {loading ? (
                <FeedSkeletons />
              ) : error ? (
                <EmptyState
                  icon={Newspaper}
                  title="Couldn't load the feed"
                  description={error}
                  action={
                    <Button variant="outline" onClick={reload}>
                      Try again
                    </Button>
                  }
                />
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon={Newspaper}
                  title="No posts yet"
                  description={
                    posts.length === 0
                      ? "Be the first to share something with the BlakNet community."
                      : "No posts match this filter yet."
                  }
                  action={
                    posts.length === 0 ? (
                      authUser ? (
                        <Button
                          className="bg-ink text-cream hover:bg-ink/90"
                          onClick={() => {
                            const el = document.getElementById("composer");
                            el?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                        >
                          Be the first to post <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Button>
                      ) : (
                        <Button className="bg-ink text-cream hover:bg-ink/90" onClick={() => navigate({ name: "login" })}>
                          Log in to post <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Button>
                      )
                    ) : undefined
                  }
                />
              ) : (
                <div className="space-y-5">
                  {filtered.map((p) => (
                    <PostCard key={p.id} post={p} authUser={authUser} />
                  ))}
                </div>
              )}
            </div>

            <TrendingSidebar filter={filter} setFilter={setFilter} />
          </div>
        </div>
      </section>
    </div>
  );
}
