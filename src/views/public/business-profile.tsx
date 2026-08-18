"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/blaknet/section";
import { VerifiedBadge, BBBEEBadge, Pill } from "@/components/blaknet/badges";
import { StarRating } from "@/components/blaknet/star-rating";
import { FollowButton } from "@/components/blaknet/follow-button";
import { cn } from "@/lib/utils";
import type { Business, BusinessReview } from "@/lib/types";
import { formatNumber, provinceCity, timeAgo } from "@/lib/format";
import {
  Globe,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Eye,
  ShieldCheck,
  Building2,
  Calendar,
  Star,
  Plus,
  Share2,
  ExternalLink,
  Frown,
  ArrowLeft,
  CheckCircle2,
  Users,
  Banknote,
  FileText,
  Award,
} from "lucide-react";

// ---------- types ----------
type ProfileBusiness = Business & {
  rating: number;
  reviewCount: number;
  postCount: number;
  eventCount: number;
  isOwner: boolean;
};

interface ProfileResponse {
  business: ProfileBusiness;
}

interface ReviewPayload {
  review: BusinessReview;
}

const SEARCH_KEY = "blaknet:directory-search";

export function BusinessProfileView() {
  const route = useApp((s) => s.route);
  if (route.name !== "business") return null;
  // `key` ensures the inner component fully remounts on slug change → all
  // state (loading, notFound, reviews, form) resets cleanly between profiles.
  return <BusinessProfile key={route.slug} slug={route.slug} />;
}

function BusinessProfile({ slug }: { slug: string }) {
  const navigate = useApp((s) => s.navigate);
  const authUser = useApp((s) => s.authUser);
  const { toast } = useToast();

  const [business, setBusiness] = useState<ProfileBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewCompany, setReviewCompany] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [localReviews, setLocalReviews] = useState<BusinessReview[] | null>(null);

  // ---------- fetch business + fire view increment ----------
  useEffect(() => {
    let cancelled = false;
    api<ProfileResponse>(`/api/businesses/${encodeURIComponent(slug)}`)
      .then((d) => {
        if (cancelled) return;
        setBusiness(d.business);
        // fire-and-forget view increment
        fetch(`/api/businesses/${encodeURIComponent(slug)}/view`, {
          method: "POST",
        }).catch(() => {
          /* noop */
        });
      })
      .catch((err: Error & { status?: number }) => {
        if (cancelled) return;
        if (err.status === 404 || err.status === 400) {
          setNotFound(true);
        } else {
          setNotFound(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // ---------- handlers ----------
  const reviews: BusinessReview[] = useMemo(() => {
    if (localReviews) return localReviews;
    return business?.reviews ?? [];
  }, [business, localReviews]);

  const submitReview = async () => {
    if (!reviewText.trim()) {
      toast({ title: "Review text is required", description: "Please share a few words about your experience." });
      return;
    }
    setSubmittingReview(true);
    try {
      const data = await api<ReviewPayload>(
        `/api/businesses/${encodeURIComponent(slug)}/reviews`,
        { method: "POST", json: { rating: reviewRating, review: reviewText.trim(), reviewerCompany: reviewCompany.trim() || undefined } },
      );
      setLocalReviews((prev) => [data.review, ...(prev ?? business?.reviews ?? [])]);
      setReviewText("");
      setReviewCompany("");
      setReviewRating(5);
      setShowReviewForm(false);
      toast({ title: "Review posted", description: "Thanks for sharing your experience." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not submit review.";
      toast({ title: "Could not submit review", description: msg });
    } finally {
      setSubmittingReview(false);
    }
  };

  const shareProfile = async () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/#/business/${slug}` : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: business?.name ?? "BlakNet business", url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied", description: "Share this business with your network." });
      }
    } catch {
      /* user dismissed share — noop */
    }
  };

  const searchByTag = (term: string) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(SEARCH_KEY, term);
    }
    navigate({ name: "directory" });
  };

  // ---------- not found ----------
  if (notFound && !loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <EmptyState
          icon={Frown}
          title="Business not found"
          description="The business you're looking for may have been removed or the link is incorrect."
          action={
            <Button variant="outline" onClick={() => navigate({ name: "directory" })}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to directory
            </Button>
          }
        />
      </div>
    );
  }

  // ---------- loading skeleton ----------
  if (loading || !business) {
    return <ProfileSkeleton />;
  }

  const b = business;
  const yearFounded = b.yearFounded;
  const yearsInBusiness = yearFounded ? Math.max(0, new Date().getFullYear() - yearFounded) : null;
  const websiteHref = b.website ? (b.website.startsWith("http") ? b.website : `https://${b.website}`) : null;
  const whatsappHref = b.whatsapp ? `https://wa.me/${b.whatsapp.replace(/[^0-9]/g, "")}` : null;

  return (
    <div className="flex flex-col">
      {/* ===== HEADER BAND ===== */}
      <section className="bg-ink-grain text-cream">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <button
            type="button"
            onClick={() => navigate({ name: "directory" })}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-cream/60 transition-colors hover:text-cream"
          >
            <ArrowLeft className="h-4 w-4" /> Directory
          </button>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              {/* logo */}
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-cream/15 bg-cream/5">
                {b.logoUrl ? (
                  <img src={b.logoUrl} alt={b.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display text-3xl text-cream">
                    {b.name[0]}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h1 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl md:text-[2.6rem]">
                  {b.name}
                </h1>
                {b.tagline && (
                  <p className="mt-1.5 max-w-xl text-cream/70 sm:text-lg">{b.tagline}</p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {b.verificationStatus === "VERIFIED" && <VerifiedBadge status="VERIFIED" size="md" />}
                  {b.verificationStatus === "PENDING" && <VerifiedBadge status="PENDING" size="md" />}
                  {b.bbbeeLevel && <BBBEEBadge level={b.bbbeeLevel} />}
                  {b.featured && <Pill tone="cream">Featured</Pill>}
                  {b.industry?.name && (
                    <Pill tone="cream">
                      <Building2 className="h-3 w-3" />
                      {b.industry.name}
                    </Pill>
                  )}
                  {(b.city || b.province) && (
                    <Pill tone="cream">
                      <MapPin className="h-3 w-3" />
                      {provinceCity(b)}
                    </Pill>
                  )}
                </div>
              </div>
            </div>

            {/* CTA stack (desktop) */}
            <div className="flex flex-col gap-2 lg:items-end">
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {websiteHref && (
                  <Button asChild className="btn-lift h-10 bg-cream px-4 text-ink shadow-lg hover:bg-cream/90">
                    <a href={websiteHref} target="_blank" rel="noreferrer noopener">
                      <Globe className="h-4 w-4" /> Website
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </Button>
                )}
                {b.email && (
                  <Button asChild variant="outline" className="h-10 border-cream/25 bg-transparent px-4 text-cream hover:bg-cream/10 hover:text-cream">
                    <a href={`mailto:${b.email}`}>
                      <Mail className="h-4 w-4" /> Email
                    </a>
                  </Button>
                )}
                {whatsappHref && (
                  <Button asChild className={cn(
                    "btn-lift h-10 px-4",
                    websiteHref
                      ? "border border-sage/40 bg-sage/10 text-cream hover:bg-sage/20"
                      : "bg-sage text-cream shadow-lg hover:bg-sage/90",
                  )}>
                    <a href={whatsappHref} target="_blank" rel="noreferrer noopener">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  </Button>
                )}
                {b.isOwner ? (
                  <span className="inline-flex h-10 items-center gap-1.5 rounded-md border border-cream/20 bg-cream/5 px-4 text-sm font-medium text-cream/80">
                    <Building2 className="h-4 w-4" /> Your business
                  </span>
                ) : (
                  <FollowButton
                    businessId={b.id}
                    businessName={b.name}
                    initialFollowing={b.following ?? false}
                    followerCount={b.followerCount ?? 0}
                    tone="onDark"
                  />
                )}
                <Button variant="ghost" onClick={shareProfile} className="h-10 px-4 text-cream/70 hover:bg-cream/10 hover:text-cream">
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROFILE COMPLETION BAR (owner only) ===== */}
      {b.isOwner && (
        <section className="border-b border-border bg-cream-grain">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">
                    Your profile is {b.profileCompletion}% complete
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {b.profileCompletion >= 80 ? "Looking great!" : "Add more details to rank higher in search."}
                  </span>
                </div>
                <Progress value={b.profileCompletion} className="mt-2 h-1.5" />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate({ name: "dashboard-business", id: b.id })}
              >
                Edit business
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ===== BODY ===== */}
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-2 sm:px-6 sm:pt-4 lg:px-8 lg:pb-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            {/* ===== MAIN COLUMN ===== */}
            <div className="flex flex-col gap-6">
              {/* About — first content card, overlaps the dark header for a layered "rising out of the dark" effect */}
              <Card className="-mt-4 sm:-mt-8 relative z-10 shadow-xl">
                <CardTitle>About</CardTitle>
                <Separator className="mb-4" />
                {b.description ? (
                  <div className="space-y-3 text-sm leading-relaxed text-foreground/80">
                    {b.description.split(/\n{2,}|\r\n{2,}/).map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    This business hasn't added a description yet.
                  </p>
                )}
              </Card>

              {/* Services & Products — single card with two clearly-titled subsections; pills are clickable (navigate to directory search) */}
              {((b.services && b.services.length > 0) || (b.products && b.products.length > 0)) && (
                <Card>
                  <CardTitle>Services & Products</CardTitle>
                  <Separator className="mb-4" />

                  {b.services && b.services.length > 0 && (
                    <div className={b.products && b.products.length > 0 ? "mb-6" : ""}>
                      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Services
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {b.services.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => searchByTag(s.name)}
                            className="transition-transform hover:-translate-y-0.5"
                          >
                            <Pill
                              tone="neutral"
                              className="cursor-pointer transition-colors hover:bg-ink hover:text-cream hover:border-ink"
                            >
                              {s.name}
                            </Pill>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {b.products && b.products.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Products
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {b.products.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => searchByTag(p.name)}
                            className="transition-transform hover:-translate-y-0.5"
                          >
                            <Pill
                              tone="sage"
                              className="cursor-pointer transition-colors hover:bg-ink hover:text-cream hover:border-ink"
                            >
                              {p.name}
                            </Pill>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* Reviews */}
              <Card>
                {/* Header: rating summary + Leave-a-review CTA */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="font-display text-4xl leading-none text-ink">
                      {b.rating > 0 ? b.rating.toFixed(1) : "—"}
                    </div>
                    <div className="flex flex-col">
                      <span className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Reviews
                      </span>
                      <StarRating rating={b.rating} showValue={false} />
                      <span className="mt-0.5 text-xs text-muted-foreground">
                        ({formatNumber(b.reviewCount)} {b.reviewCount === 1 ? "review" : "reviews"})
                      </span>
                    </div>
                  </div>
                  {!showReviewForm && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!authUser) {
                          navigate({ name: "login" });
                          return;
                        }
                        setShowReviewForm(true);
                      }}
                    >
                      <Plus className="h-4 w-4" /> Leave a review
                    </Button>
                  )}
                </div>
                <Separator className="mb-4 mt-4" />

                {/* inline review form */}
                {showReviewForm && (
                  <div className="mb-5 rounded-lg border border-border bg-cream-grain/40 p-4">
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <label className="text-sm font-medium">Your rating</label>
                      <Select value={String(reviewRating)} onValueChange={(v) => setReviewRating(Number(v))}>
                        <SelectTrigger className="h-9 w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[5, 4, 3, 2, 1].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n} {n === 1 ? "star" : "stars"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center">
                        <StarRating rating={reviewRating} />
                      </div>
                    </div>
                    <Textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your experience working with this business…"
                      className="min-h-24"
                    />
                    <div className="mt-2">
                      <Input
                        value={reviewCompany}
                        onChange={(e) => setReviewCompany(e.target.value)}
                        placeholder="Your company (optional)"
                        className="h-9"
                      />
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button onClick={submitReview} disabled={submittingReview} size="sm">
                        {submittingReview ? "Posting…" : "Post review"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowReviewForm(false)}
                        disabled={submittingReview}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* review list */}
                {reviews.length === 0 ? (
                  <EmptyState
                    title="No reviews yet"
                    description="Be the first to share your experience with this business."
                    className="border-transparent bg-transparent py-8"
                  />
                ) : (
                  <ul className="flex flex-col gap-4">
                    {reviews.slice(0, 12).map((r) => (
                      <li
                        key={r.id}
                        className="rounded-lg border border-border border-l-2 border-l-sage bg-card/60 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{r.reviewerName}</p>
                            {r.reviewerCompany && (
                              <p className="text-xs text-muted-foreground">{r.reviewerCompany}</p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
                        </div>
                        <div className="mt-2">
                          <StarRating rating={r.rating} size={12} />
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-foreground/80">{r.review}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            {/* ===== SIDEBAR ===== */}
            <aside className="flex flex-col gap-6">
              <div className="sticky top-24 flex flex-col gap-6">
                {/* Business Information */}
                <Card>
                  <CardTitle>Business Information</CardTitle>
                  <Separator className="mb-4" />
                  <dl className="flex flex-col gap-3 text-sm">
                    <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Year founded" value={yearFounded != null ? String(yearFounded) : null} />
                    <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="Business size" value={sizeLabel(b.businessSize)} />
                    <InfoRow icon={<Users className="h-3.5 w-3.5" />} label="Employees" value={b.employeeCount} />
                    <InfoRow icon={<Banknote className="h-3.5 w-3.5" />} label="Annual revenue" value={b.annualRevenue} />
                    <InfoRow icon={<FileText className="h-3.5 w-3.5" />} label="CIPC number" value={b.cipcNumber} />
                    <InfoRow icon={<Award className="h-3.5 w-3.5" />} label="B-BBEE level" value={b.bbbeeLevel} />
                  </dl>
                </Card>

                {/* Contact */}
                <Card>
                  <CardTitle>Contact</CardTitle>
                  <Separator className="mb-4" />
                  <ul className="flex flex-col gap-2.5 text-sm">
                    {websiteHref && (
                      <ContactRow icon={<Globe className="h-4 w-4" />} label="Website">
                        <a
                          href={websiteHref}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="link-underline inline-flex items-center gap-1 text-foreground/80 hover:text-ink"
                        >
                          {prettyDomain(websiteHref)}
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </a>
                      </ContactRow>
                    )}
                    {b.email && (
                      <ContactRow icon={<Mail className="h-4 w-4" />} label="Email">
                        <a href={`mailto:${b.email}`} className="link-underline text-foreground/80 hover:text-ink">
                          {b.email}
                        </a>
                      </ContactRow>
                    )}
                    {b.phone && (
                      <ContactRow icon={<Phone className="h-4 w-4" />} label="Phone">
                        <a href={`tel:${b.phone.replace(/[^0-9+]/g, "")}`} className="link-underline text-foreground/80 hover:text-ink">
                          {b.phone}
                        </a>
                      </ContactRow>
                    )}
                    {b.address && (
                      <ContactRow icon={<MapPin className="h-4 w-4" />} label="Address">
                        <span className="text-foreground/80">{b.address}</span>
                      </ContactRow>
                    )}
                    {whatsappHref && (
                      <li className="pt-1">
                        <Button asChild size="sm" className="w-full bg-sage text-cream hover:bg-sage/90">
                          <a href={whatsappHref} target="_blank" rel="noreferrer noopener">
                            <MessageCircle className="h-4 w-4" /> Message on WhatsApp
                          </a>
                        </Button>
                      </li>
                    )}
                  </ul>
                </Card>

                {/* Trust signals */}
                <Card>
                  <CardTitle>Trust Signals</CardTitle>
                  <Separator className="mb-4" />
                  <ul className="flex flex-col gap-3 text-sm">
                    <TrustRow
                      icon={<ShieldCheck className="h-4 w-4 text-sage" />}
                      label="Verification"
                      value={<VerifiedBadge status={b.verificationStatus} size="sm" />}
                    />
                    {b.bbbeeLevel && (
                      <TrustRow
                        icon={<CheckCircle2 className="h-4 w-4 text-sage" />}
                        label="B-BBEE"
                        value={<BBBEEBadge level={b.bbbeeLevel} />}
                      />
                    )}
                    {yearsInBusiness != null && yearsInBusiness > 0 && (
                      <TrustRow
                        icon={<Calendar className="h-4 w-4 text-sage" />}
                        label="Years in business"
                        value={<span className="text-foreground/80">{yearsInBusiness}+ year{yearsInBusiness === 1 ? "" : "s"}</span>}
                      />
                    )}
                    <TrustRow
                      icon={<Eye className="h-4 w-4 text-sage" />}
                      label="Profile views"
                      value={<span className="text-foreground/80">{formatNumber(b.views)}</span>}
                    />
                    <TrustRow
                      icon={<Star className="h-4 w-4 text-sage" />}
                      label="Reviews"
                      value={<span className="text-foreground/80">{formatNumber(b.reviewCount)}</span>}
                    />
                  </ul>
                </Card>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------- sub-components ----------

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-6", className)}>{children}</div>
  );
}

function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`font-display text-xl tracking-tight ${className ?? ""}`}>{children}</h2>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string | null; icon?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon && <span className="text-foreground/40">{icon}</span>}
        {label}
      </dt>
      <dd className="text-right text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-foreground/5 text-foreground/40">
        {icon}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <div className="truncate text-sm font-semibold text-foreground">{children}</div>
      </div>
    </li>
  );
}

function TrustRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <div className="text-right">{value}</div>
    </li>
  );
}

// ---------- skeleton ----------

function ProfileSkeleton() {
  return (
    <div className="flex flex-col">
      <section className="bg-ink-grain text-cream">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-6 h-4 w-24 animate-pulse rounded bg-cream/20" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <Skeleton className="h-20 w-20 rounded-xl bg-cream/15" />
              <div className="space-y-3">
                <Skeleton className="h-9 w-72 rounded bg-cream/15" />
                <Skeleton className="h-5 w-96 rounded bg-cream/15" />
                <div className="flex gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-20 rounded-full bg-cream/15" />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28 rounded bg-cream/15" />
              <Skeleton className="h-9 w-28 rounded bg-cream/15" />
            </div>
          </div>
        </div>
      </section>
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-6">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <div className="flex flex-col gap-6">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <Skeleton className="mb-4 h-6 w-40" />
      <div className="space-y-2.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

// ---------- helpers ----------

function sizeLabel(size: string | null): string | null {
  if (!size) return null;
  const found = (
    [
      { value: "micro", label: "Micro (1–10)" },
      { value: "small", label: "Small (11–50)" },
      { value: "medium", label: "Medium (51–200)" },
      { value: "large", label: "Large (200+)" },
    ] as const
  ).find((s) => s.value === size);
  return found ? found.label : size.charAt(0).toUpperCase() + size.slice(1);
}

function prettyDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
