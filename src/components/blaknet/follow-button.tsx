"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  businessId: string;
  initialFollowing: boolean;
  followerCount: number;
  onChange?: (following: boolean, count: number) => void;
  businessName?: string;
  /**
   * "default" = light surface (border-border / bg-ink solid when following).
   * "onDark" = dark hero band (cream-tinted outline / cream solid when following).
   */
  tone?: "default" | "onDark";
}

export function FollowButton({
  businessId,
  initialFollowing,
  followerCount,
  onChange,
  businessName,
  tone = "default",
}: FollowButtonProps) {
  const { authUser, navigate } = useApp();
  const { toast } = useToast();

  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(followerCount);
  const [loading, setLoading] = useState(false);

  const onDark = tone === "onDark";

  const outlineClass = onDark
    ? "border-cream/25 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
    : "border-border";
  const solidClass = onDark
    ? "bg-cream text-ink hover:bg-cream/90"
    : "bg-ink text-cream hover:bg-ink/90";
  const countClass = onDark
    ? "border-cream/15 bg-cream/5 text-cream/80"
    : "border-border bg-card text-muted-foreground";

  // Not signed in → prompt to log in.
  if (!authUser) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className={cn("btn-lift h-9", outlineClass)}
          onClick={() => {
            toast({ title: "Sign in to follow businesses" });
            navigate({ name: "login" });
          }}
        >
          <Heart className="h-4 w-4" /> Follow
        </Button>
        <FollowerCount count={count} className={countClass} />
      </div>
    );
  }

  const handleToggle = async () => {
    if (loading) return;
    const wasFollowing = following;
    const prevCount = count;
    // optimistic flip
    const next = !wasFollowing;
    setFollowing(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    setLoading(true);
    try {
      const res = await api<{ following: boolean }>(
        `/api/businesses/${encodeURIComponent(businessId)}/follow`,
        { method: "POST" },
      );
      // Reconcile with the server's authoritative state. If the optimistic flip
      // was wrong, undo the count delta; otherwise keep it.
      const delta = res.following === next ? 0 : res.following ? 1 : -1;
      const serverCount = Math.max(0, prevCount + delta);
      setFollowing(res.following);
      setCount(serverCount);
      onChange?.(res.following, serverCount);
      if (res.following) {
        toast({
          title: "You're now following this business",
          description: businessName ? `Following ${businessName}.` : undefined,
        });
      } else {
        toast({ title: "Unfollowed" });
      }
    } catch (err) {
      // revert optimistic update
      setFollowing(wasFollowing);
      setCount(prevCount);
      const message = err instanceof Error ? err.message : "Could not update follow status.";
      toast({
        title: "Could not update follow status",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {following ? (
        <Button
          onClick={handleToggle}
          disabled={loading}
          className={cn("btn-lift h-9", solidClass, loading && "opacity-80")}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={cn("h-4 w-4", onDark ? "fill-ink" : "fill-cream")} />
          )}
          Following
        </Button>
      ) : (
        <Button
          variant="outline"
          onClick={handleToggle}
          disabled={loading}
          className={cn("btn-lift h-9", outlineClass)}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className="h-4 w-4" />
          )}
          Follow
        </Button>
      )}
      <FollowerCount count={count} className={countClass} />
    </div>
  );
}

function FollowerCount({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-9 items-center gap-1 rounded-md border px-2.5 text-xs font-medium",
        className,
      )}
    >
      <Users className="h-3.5 w-3.5" />
      {count}
    </span>
  );
}
