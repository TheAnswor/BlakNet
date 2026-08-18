"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Pill } from "@/components/blaknet/badges";
import { EmptyState } from "@/components/blaknet/section";
import { RESOURCE_CATEGORIES, RESOURCE_TYPES } from "@/lib/constants";
import type { Resource } from "@/lib/types";
import { formatDate } from "@/lib/format";
import {
  ArrowLeft,
  ArrowRight,
  Share2,
  Clock,
  Frown,
  FileText,
  BookOpen,
  Download,
  CheckCircle2,
  PlayCircle,
  Users,
  Sparkles,
} from "lucide-react";

const TYPE_ICONS: Record<string, typeof FileText> = {
  article: FileText,
  guide: BookOpen,
  template: Download,
  checklist: CheckCircle2,
  video: PlayCircle,
  workshop: Users,
};

function TypeIcon({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const Icon = TYPE_ICONS[type] ?? FileText;
  return <Icon className={className} />;
}

function typeLabel(value: string): string {
  return RESOURCE_TYPES.find((t) => t.value === value)?.label ?? value;
}

function categoryLabel(value: string): string {
  return RESOURCE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 border-t border-border py-2.5 first:border-t-0 first:pt-0">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="text-right text-sm text-foreground">{value}</dd>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-5 w-48" />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <Skeleton className="h-10 w-3/4" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export function ResourceDetailView() {
  const { route, navigate } = useApp();
  const { toast } = useToast();
  const slug = route.name === "resource" ? route.slug : "";

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = () => {
    setNotFound(false);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const d = await api<{ resource: Resource }>(`/api/resources/${encodeURIComponent(slug)}`);
        if (!cancelled) {
          setResource(d.resource);
          setNotFound(false);
          setError(null);
        }
      } catch (err) {
        if (cancelled) return;
        const e = err as Error & { status?: number };
        if (e?.status === 404) setNotFound(true);
        else setError(e?.message ?? "Could not load this resource.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, reloadKey]);

  function share() {
    if (typeof window === "undefined" || !resource) return;
    const url = `${window.location.origin}${window.location.hash}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        () => toast({ title: "Link copied", description: "Share this resource with your network." }),
        () => toast({ title: "Couldn't copy", description: "Copy the URL from your browser." }),
      );
    } else {
      toast({ title: "Couldn't copy", description: "Your browser blocked clipboard access." });
    }
  }

  if (loading) return <ContentSkeleton />;

  if (notFound)
    return (
      <section className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <EmptyState
            icon={Frown}
            title="Resource not found"
            description="This resource may have been moved or unpublished."
            action={
              <Button variant="outline" onClick={() => navigate({ name: "resources" })}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to resources
              </Button>
            }
          />
        </div>
      </section>
    );

  if (error || !resource)
    return (
      <section className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <EmptyState
            icon={Frown}
            title="Couldn't load this resource"
            description={error ?? "Please try again."}
            action={
              <Button variant="outline" onClick={reload}>
                Try again
              </Button>
            }
          />
        </div>
      </section>
    );

  return (
    <div className="flex flex-col bg-background">
      {/* BREADCRUMB */}
      <section className="border-b border-border bg-cream-grain">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <button onClick={() => navigate({ name: "home" })} className="link-underline">
                    Home
                  </button>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <button onClick={() => navigate({ name: "resources" })} className="link-underline">
                    Resources
                  </button>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1">{resource.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </section>

      {/* BODY */}
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            {/* LEFT: content */}
            <article className="min-w-0">
              <div className="flex items-center gap-2">
                <Pill tone="sage">{typeLabel(resource.resourceType)}</Pill>
                <Pill tone="neutral">{categoryLabel(resource.category)}</Pill>
                {resource.featured && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-sage/30 bg-sage/10 px-2.5 py-1 text-[11px] font-medium text-sage">
                    <Sparkles className="h-3 w-3" /> Featured
                  </span>
                )}
              </div>
              <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
                {resource.title}
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                {resource.description}
              </p>

              <div className="mt-8 max-w-prose">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
                  {resource.content}
                </p>
              </div>

              <div className="mt-10 border-t border-border pt-6">
                <Button variant="outline" onClick={() => navigate({ name: "resources" })}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back to resources
                </Button>
              </div>
            </article>

            {/* RIGHT: sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink text-cream">
                    <TypeIcon type={resource.resourceType} className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg tracking-tight">About this resource</h3>
                    <p className="text-xs text-muted-foreground">{typeLabel(resource.resourceType)}</p>
                  </div>
                </div>

                <dl className="mt-4">
                  <DetailRow label="Type" value={typeLabel(resource.resourceType)} />
                  <DetailRow label="Category" value={categoryLabel(resource.category)} />
                  <DetailRow label="Author" value={resource.author ?? "BlakNet editorial"} />
                  {resource.readMinutes != null && (
                    <DetailRow
                      label="Read time"
                      value={
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {resource.readMinutes} min
                        </span>
                      }
                    />
                  )}
                  <DetailRow
                    label="Published"
                    value={formatDate(resource.createdAt, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  />
                </dl>

                <div className="mt-5 space-y-2 border-t border-border pt-5">
                  <Button
                    onClick={() => navigate({ name: "resources" })}
                    className="w-full bg-ink text-cream hover:bg-ink/90"
                  >
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    Back to resources
                  </Button>
                  <Button variant="outline" onClick={share} className="w-full">
                    <Share2 className="mr-1.5 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-dashed border-border bg-card/50 p-5">
                <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-sage">
                  <Sparkles className="h-3.5 w-3.5" />
                  Looking for more?
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Browse the full library of guides, templates and checklists for Black-owned businesses.
                </p>
                <Button
                  variant="link"
                  className="mt-2 h-auto p-0 text-ink"
                  onClick={() => navigate({ name: "resources" })}
                >
                  Explore resources <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
