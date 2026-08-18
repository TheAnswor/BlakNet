"use client";

import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  PROVINCES,
  BUSINESS_SIZES,
  EMPLOYEE_RANGES,
  REVENUE_RANGES,
  BBBEE_LEVELS,
} from "@/lib/constants";
import { EmptyState } from "@/components/blaknet/section";
import { ImageUpload } from "@/components/blaknet/image-upload";
import { VerifiedBadge, BBBEEBadge, Pill } from "@/components/blaknet/badges";
import type { Business, Industry, VerificationStatus } from "@/lib/types";
import { formatDate, formatNumber, provinceCity, verificationLabel } from "@/lib/format";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Eye,
  Globe,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  Pencil,
  Sparkles,
  AlertCircle,
  Briefcase,
  Package,
  X,
  Plus,
  Save,
  Loader2,
} from "lucide-react";

const VERIFICATION_TYPES = [
  { value: "CIPC", label: "CIPC registration" },
  { value: "B-BBEE", label: "B-BBEE certificate" },
  { value: "TAX", label: "Tax clearance" },
  { value: "CERTIFICATION", label: "Industry certification" },
];

const SERVICE_SUGGESTIONS = ["Accounting", "Consulting", "Design", "Logistics"];
const PRODUCT_SUGGESTIONS = ["Report", "Template", "Kit", "Subscription"];

// ---------- edit form ----------
interface EditFormState {
  name: string;
  tagline: string;
  description: string;
  industryId: string;
  province: string;
  city: string;
  address: string;
  website: string;
  email: string;
  phone: string;
  whatsapp: string;
  businessSize: string;
  yearFounded: string;
  employeeCount: string;
  annualRevenue: string;
  cipcNumber: string;
  bbbeeLevel: string;
  logoUrl: string | null;
  coverUrl: string | null;
  services: string[];
  products: string[];
}

function editFormFromBusiness(b: Business): EditFormState {
  return {
    name: b.name ?? "",
    tagline: b.tagline ?? "",
    description: b.description ?? "",
    industryId: b.industryId ?? "",
    province: b.province ?? "",
    city: b.city ?? "",
    address: b.address ?? "",
    website: b.website ?? "",
    email: b.email ?? "",
    phone: b.phone ?? "",
    whatsapp: b.whatsapp ?? "",
    businessSize: b.businessSize ?? "",
    yearFounded: b.yearFounded != null ? String(b.yearFounded) : "",
    employeeCount: b.employeeCount ?? "",
    annualRevenue: b.annualRevenue ?? "",
    cipcNumber: b.cipcNumber ?? "",
    bbbeeLevel: b.bbbeeLevel ?? "",
    logoUrl: b.logoUrl ?? null,
    coverUrl: b.coverUrl ?? null,
    services: (b.services ?? []).map((s) => s.name),
    products: (b.products ?? []).map((p) => p.name),
  };
}

function buildEditPayload(form: EditFormState) {
  return {
    name: form.name.trim(),
    tagline: form.tagline.trim() || undefined,
    description: form.description.trim() || undefined,
    industryId: form.industryId || undefined,
    province: form.province || undefined,
    city: form.city.trim() || undefined,
    address: form.address.trim() || undefined,
    website: form.website.trim() || undefined,
    email: form.email.trim() || undefined,
    phone: form.phone.trim() || undefined,
    whatsapp: form.whatsapp.trim() || undefined,
    businessSize: form.businessSize || undefined,
    yearFounded: form.yearFounded ? Number(form.yearFounded) : undefined,
    employeeCount: form.employeeCount || undefined,
    annualRevenue: form.annualRevenue || undefined,
    cipcNumber: form.cipcNumber.trim() || undefined,
    bbbeeLevel: form.bbbeeLevel || undefined,
    logoUrl: form.logoUrl,
    coverUrl: form.coverUrl,
    services: form.services,
    products: form.products,
  };
}

// Best-effort local merge of edited fields back onto the business object
// (used only if the PATCH response doesn't include a fresh business payload).
function editBusinessMerge(form: EditFormState): Partial<Business> {
  return {
    name: form.name.trim(),
    tagline: form.tagline.trim() || null,
    description: form.description.trim() || null,
    industryId: form.industryId || null,
    province: form.province || null,
    city: form.city.trim() || null,
    address: form.address.trim() || null,
    website: form.website.trim() || null,
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    whatsapp: form.whatsapp.trim() || null,
    businessSize: form.businessSize || null,
    yearFounded: form.yearFounded ? Number(form.yearFounded) : null,
    employeeCount: form.employeeCount || null,
    annualRevenue: form.annualRevenue || null,
    cipcNumber: form.cipcNumber.trim() || null,
    bbbeeLevel: form.bbbeeLevel || null,
    logoUrl: form.logoUrl,
    coverUrl: form.coverUrl,
    services: form.services.map((name, i) => ({ id: `local-${i}-${name}`, name })),
    products: form.products.map((name, i) => ({ id: `local-${i}-${name}`, name })),
  };
}

export function BusinessDetailView() {
  const route = useApp((s) => s.route);
  if (route.name !== "dashboard-business") return null;
  // `key` ensures the inner component fully remounts on id change → all
  // state (loading, notFound, verify form) resets cleanly between businesses.
  return <BusinessDetail key={route.id} id={route.id} />;
}

function BusinessDetail({ id }: { id: string }) {
  const navigate = useApp((s) => s.navigate);
  const { toast } = useToast();

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showVerifyForm, setShowVerifyForm] = useState(false);

  // edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [saving, setSaving] = useState(false);

  // verification form state
  const [verificationType, setVerificationType] = useState("CIPC");
  const [documentUrl, setDocumentUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load industries (for the edit dialog's industry Select).
  useEffect(() => {
    let cancelled = false;
    api<{ industries: Industry[] }>("/api/industries")
      .then((d) => {
        if (cancelled) return;
        setIndustries(d.industries ?? []);
      })
      .catch(() => {
        /* silent — Select just stays empty */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<{ items: Business[] }>("/api/businesses/owner")
      .then((d) => {
        if (cancelled) return;
        const found = (d.items ?? []).find((b) => b.id === id);
        if (found) setBusiness(found);
        else setNotFound(true);
      })
      .catch(() => {
        if (cancelled) return;
        setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const refetch = () => {
    api<{ items: Business[] }>("/api/businesses/owner")
      .then((d) => {
        const found = (d.items ?? []).find((b) => b.id === id);
        if (found) setBusiness(found);
      })
      .catch(() => {
        /* silent */
      });
  };

  const openEdit = () => {
    if (!business) return;
    setEditForm(editFormFromBusiness(business));
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!business || !editForm) return;
    if (!editForm.name.trim()) {
      toast({ title: "Business name is required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = buildEditPayload(editForm);
      const res = await api<{ business: Business }>(
        `/api/businesses/${encodeURIComponent(business.id)}/edit`,
        { method: "PATCH", json: payload },
      );
      setBusiness(res.business ?? { ...business, ...editBusinessMerge(editForm) });
      setEditOpen(false);
      setEditForm(null);
      toast({ title: "Business updated", description: "Your changes are live." });
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save changes.";
      toast({
        title: "Couldn't save changes",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleVerifySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setSubmitting(true);
    try {
      await api("/api/verification", {
        method: "POST",
        json: {
          businessId: business.id,
          verificationType,
          notes: notes.trim() || undefined,
          documentUrl: documentUrl.trim() || undefined,
        },
      });
      toast({
        title: "Verification submitted",
        description: "We'll review within 2 business days.",
      });
      setShowVerifyForm(false);
      setNotes("");
      setDocumentUrl("");
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not submit verification.";
      toast({
        title: "Couldn't submit verification",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40 rounded-md" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="lg:col-span-2 h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (notFound || !business) {
    return (
      <EmptyState
        icon={Building2}
        title="Business not found"
        description="This business doesn't exist, or you don't have access to manage it."
        action={
          <Button onClick={() => navigate({ name: "dashboard-businesses" })} className="bg-ink text-cream hover:bg-ink/90">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to my businesses
          </Button>
        }
      />
    );
  }

  const status = business.verificationStatus;
  const isVerified = status === "VERIFIED";
  const isPending = status === "PENDING";

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate({ name: "dashboard-businesses" })}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to my businesses
      </button>

      {/* Header card */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {business.logoUrl ? (
            <img
              src={business.logoUrl}
              alt={business.name}
              className="h-16 w-16 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-ink font-display text-2xl text-cream">
              {business.name[0]?.toUpperCase() ?? "?"}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">
                {business.name}
              </h1>
              <VerifiedBadge status={status} size="md" />
              <BBBEEBadge level={business.bbbeeLevel} />
              {business.featured && <Pill tone="cream">Featured</Pill>}
            </div>

            {business.tagline && (
              <p className="mt-1 text-sm text-muted-foreground">{business.tagline}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {provinceCity(business)}
              </span>
              {business.industry && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> {business.industry.name}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3 w-3" /> {formatNumber(business.views)} views
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Added {formatDate(business.createdAt, { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>

            {/* Profile completion */}
            <div className="mt-4 flex items-center gap-3">
              <div className="h-1.5 w-40 max-w-full">
                <Progress value={business.profileCompletion} className="h-1.5" />
              </div>
              <span className="text-[11px] text-muted-foreground">
                {business.profileCompletion}% complete
              </span>
              {business.profileCompletion < 100 && (
                <span className="hidden text-[11px] text-foreground/40 sm:inline">
                  · add more detail to reach 100%
                </span>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => navigate({ name: "business", slug: business.slug })}
            className="bg-ink text-cream hover:bg-ink/90"
          >
            View public profile <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={openEdit}>
            <Pencil className="mr-1.5 h-4 w-4" /> Edit details
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              navigate({ name: "dashboard-business-analytics", id: business.id })
            }
            className="border-sage/30 bg-sage/10 text-sage hover:bg-sage/20 hover:text-sage"
          >
            <BarChart3 className="mr-1.5 h-4 w-4" /> Analytics
          </Button>
          {!isVerified && !isPending && (
            <Button
              variant="outline"
              onClick={() => setShowVerifyForm((v) => !v)}
              className="border-sage/30 bg-sage/10 text-sage hover:bg-sage/20 hover:text-sage"
            >
              <ShieldCheck className="mr-1.5 h-4 w-4" /> Submit for verification
            </Button>
          )}
        </div>
      </div>

      {/* Verification inline form */}
      {showVerifyForm && !isVerified && !isPending && (
        <div className="rounded-2xl border border-sage/30 bg-sage/5 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl tracking-tight text-ink">Request verification</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose the verification type you want to submit. We'll review within 2 business days.
              </p>
            </div>
            <button
              onClick={() => setShowVerifyForm(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
              aria-label="Close form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleVerifySubmit} className="mt-5 space-y-5">
            <div className="space-y-1.5">
              <Label>Verification type</Label>
              <Select value={verificationType} onValueChange={setVerificationType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VERIFICATION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="documentUrl">Document URL (optional)</Label>
              <Input
                id="documentUrl"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                placeholder="File upload coming soon — paste a link for now"
                inputMode="url"
              />
              <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <AlertCircle className="h-3 w-3" /> File uploads arrive shortly — paste a public link to your document for now.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Anything you'd like the reviewer to know — registration numbers, references, etc."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowVerifyForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-ink text-cream hover:bg-ink/90">
                {submitting ? "Submitting…" : "Submit request"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Body */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <StatusCard status={status} onVerifyClick={() => setShowVerifyForm(true)} />

          {/* Services & products card */}
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-display text-lg tracking-tight">Services & products</h2>
              <p className="text-sm text-muted-foreground">What your business offers.</p>
            </div>
            <div className="space-y-5 p-5">
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <Briefcase className="h-3 w-3" /> Services
                </div>
                {(business.services ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No services listed yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {(business.services ?? []).map((s) => (
                      <Pill key={s.id}>{s.name}</Pill>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <Package className="h-3 w-3" /> Products
                </div>
                {(business.products ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No products listed yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {(business.products ?? []).map((p) => (
                      <Pill key={p.id} tone="sage">
                        {p.name}
                      </Pill>
                    ))}
                  </div>
                )}
              </div>

              <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Pencil className="h-3 w-3" /> Use "Edit details" above to update services & products.
              </p>
            </div>
          </div>

          {/* About */}
          {business.description && (
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h2 className="font-display text-lg tracking-tight">About</h2>
              </div>
              <div className="p-5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                  {business.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {/* Trust signals */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-lg tracking-tight">Trust signals</h2>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verification
                </span>
                <span className="font-medium">{verificationLabel(status)}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5" /> B-BBEE level
                </span>
                <span className="font-medium">{business.bbbeeLevel ?? "—"}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" /> Profile completion
                </span>
                <span className="font-medium">{business.profileCompletion}%</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" /> Profile views
                </span>
                <span className="font-medium">{formatNumber(business.views)}</span>
              </li>
            </ul>
          </div>

          {/* Contact info */}
          <ContactCard business={business} />
        </div>
      </div>

      {editForm && (
        <EditBusinessDialog
          open={editOpen}
          onOpenChange={(o) => {
            setEditOpen(o);
            if (!o && !saving) setEditForm(null);
          }}
          form={editForm}
          setForm={setEditForm}
          industries={industries}
          saving={saving}
          onCancel={() => {
            setEditOpen(false);
            if (!saving) setEditForm(null);
          }}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}

function StatusCard({
  status,
  onVerifyClick,
}: {
  status: VerificationStatus;
  onVerifyClick: () => void;
}) {
  if (status === "VERIFIED") {
    return (
      <div className="rounded-xl border border-sage/30 bg-sage/10 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage/20 text-sage">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg tracking-tight text-ink">Verified</h3>
              <VerifiedBadge status="VERIFIED" size="md" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              This business carries the BlakNet verified badge on its public profile — a signal of trust for buyers and partners.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "PENDING") {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg tracking-tight text-ink">Verification in review</h3>
              <VerifiedBadge status="PENDING" size="md" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Your verification request is being reviewed. We typically respond within 2 business days.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "REJECTED") {
    return (
      <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg tracking-tight text-ink">Verification rejected</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your last request was rejected. You can submit a new request with updated documents below.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={onVerifyClick}
              className="mt-3 border-sage/30 bg-sage/10 text-sage hover:bg-sage/20 hover:text-sage"
            >
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Submit again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // NOT_VERIFIED
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink/5 text-foreground/60">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg tracking-tight text-ink">Not verified yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit your CIPC, B-BBEE, tax or industry certification to earn the verified badge and unlock priority placement in the directory.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={onVerifyClick}
            className="mt-3 border-sage/30 bg-sage/10 text-sage hover:bg-sage/20 hover:text-sage"
          >
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Request verification
          </Button>
        </div>
      </div>
    </div>
  );
}

function ContactCard({ business }: { business: Business }) {
  const rows: Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | null;
    href?: string;
  }> = [
    { icon: Globe, label: "Website", value: business.website, href: business.website ?? undefined },
    { icon: Mail, label: "Email", value: business.email, href: business.email ? `mailto:${business.email}` : undefined },
    { icon: Phone, label: "Phone", value: business.phone, href: business.phone ? `tel:${business.phone.replace(/\s/g, "")}` : undefined },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: business.whatsapp,
      href: business.whatsapp ? `https://wa.me/${business.whatsapp.replace(/\D/g, "")}` : undefined,
    },
    { icon: MapPin, label: "Address", value: business.address },
  ];

  const visible = rows.filter((r) => r.value);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-display text-lg tracking-tight">Contact</h2>
      {visible.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No contact details yet. Use “Edit details” above to add them.
        </p>
      ) : (
        <ul className="mt-3 space-y-3 text-sm">
          {visible.map((r) => (
            <li key={r.label} className="flex items-start gap-2.5">
              <r.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {r.label}
                </p>
                {r.href ? (
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noreferrer"
                    className="break-words text-sm text-ink hover:underline"
                  >
                    {r.value}
                  </a>
                ) : (
                  <p className="break-words text-sm text-ink">{r.value}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------- edit dialog ----------

function EditBusinessDialog({
  open,
  onOpenChange,
  form,
  setForm,
  industries,
  saving,
  onCancel,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: EditFormState;
  setForm: React.Dispatch<React.SetStateAction<EditFormState | null>>;
  industries: Industry[];
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  const update = <K extends keyof EditFormState>(key: K, value: EditFormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit business</DialogTitle>
          <DialogDescription>
            Update your business profile. Changes go live immediately after saving.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
            <TabsTrigger value="services" className="flex-1">Services &amp; Products</TabsTrigger>
          </TabsList>

          {/* ---------- Details tab ---------- */}
          <TabsContent value="details" className="space-y-4 pt-2">
            {/* Brand images */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="mb-3">
                <p className="text-sm font-medium">Brand images</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  A logo helps your business stand out in the directory.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="space-y-1.5">
                  <Label>Logo</Label>
                  <ImageUpload
                    value={form.logoUrl}
                    onChange={(v) => update("logoUrl", v)}
                    aspect="square"
                    label="Upload logo"
                  />
                </div>
                <div className="space-y-1.5 sm:flex-1">
                  <Label>Cover</Label>
                  <ImageUpload
                    value={form.coverUrl}
                    onChange={(v) => update("coverUrl", v)}
                    aspect="wide"
                    label="Upload cover"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-name">
                Business name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Langa & Sons Construction"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-tagline">Tagline</Label>
              <Input
                id="edit-tagline"
                value={form.tagline}
                onChange={(e) => update("tagline", e.target.value)}
                placeholder="A one-line pitch that sets you apart"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-description">About / Description</Label>
              <Textarea
                id="edit-description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={4}
                placeholder="Tell customers your story, what you do and what makes you different."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Industry</Label>
                <Select
                  value={form.industryId}
                  onValueChange={(v) => update("industryId", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Province</Label>
                <Select
                  value={form.province}
                  onValueChange={(v) => update("province", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a province" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="e.g. Johannesburg"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Street, suburb, postal code"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  value={form.website}
                  onChange={(e) => update("website", e.target.value)}
                  placeholder="https://yourbusiness.co.za"
                  inputMode="url"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-email">Business email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="hello@yourbusiness.co.za"
                  inputMode="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+27 11 555 0123"
                  inputMode="tel"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-whatsapp">WhatsApp</Label>
                <Input
                  id="edit-whatsapp"
                  value={form.whatsapp}
                  onChange={(e) => update("whatsapp", e.target.value)}
                  placeholder="+27 82 555 0123"
                  inputMode="tel"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Business size</Label>
                <Select
                  value={form.businessSize}
                  onValueChange={(v) => update("businessSize", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a size band" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_SIZES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-yearFounded">Year founded</Label>
                <Input
                  id="edit-yearFounded"
                  type="number"
                  inputMode="numeric"
                  min={1900}
                  max={new Date().getFullYear()}
                  value={form.yearFounded}
                  onChange={(e) => update("yearFounded", e.target.value)}
                  placeholder="e.g. 2019"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Employees</Label>
                <Select
                  value={form.employeeCount}
                  onValueChange={(v) => update("employeeCount", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select employee range" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_RANGES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Annual revenue</Label>
                <Select
                  value={form.annualRevenue}
                  onValueChange={(v) => update("annualRevenue", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select revenue band" />
                  </SelectTrigger>
                  <SelectContent>
                    {REVENUE_RANGES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-cipc">CIPC registration number</Label>
                <Input
                  id="edit-cipc"
                  value={form.cipcNumber}
                  onChange={(e) => update("cipcNumber", e.target.value)}
                  placeholder="e.g. 2019/123456/07"
                />
              </div>

              <div className="space-y-1.5">
                <Label>B-BBEE level</Label>
                <Select
                  value={form.bbbeeLevel}
                  onValueChange={(v) => update("bbbeeLevel", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a level" />
                  </SelectTrigger>
                  <SelectContent>
                    {BBBEE_LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* ---------- Services & Products tab ---------- */}
          <TabsContent value="services" className="space-y-6 pt-2">
            <EditTagInput
              label="Services"
              icon={Briefcase}
              placeholder="Add a service, e.g. 'Bricklaying'"
              values={form.services}
              onChange={(vals) => update("services", vals)}
              suggestions={SERVICE_SUGGESTIONS}
            />

            <Separator />

            <EditTagInput
              label="Products"
              icon={Package}
              placeholder="Add a product, e.g. 'Custom furniture'"
              values={form.products}
              onChange={(vals) => update("products", vals)}
              suggestions={PRODUCT_SUGGESTIONS}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={saving || !form.name.trim()}
            className="bg-ink text-cream hover:bg-ink/90"
          >
            {saving ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-4 w-4" /> Save changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditTagInput({
  label,
  icon: Icon,
  placeholder,
  values,
  onChange,
  suggestions,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  values: string[];
  onChange: (vals: string[]) => void;
  suggestions: string[];
}) {
  const [input, setInput] = useState("");

  const add = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (values.some((x) => x.toLowerCase() === v.toLowerCase())) {
      setInput("");
      return;
    }
    onChange([...values, v]);
    setInput("");
  };

  const remove = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
    } else if (e.key === "Backspace" && !input && values.length) {
      remove(values.length - 1);
    }
  };

  const remainingSuggestions = suggestions.filter(
    (s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div className="space-y-2">
      <Label className="inline-flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" /> {label}
      </Label>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => add(input)}
          disabled={!input.trim()}
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add
        </Button>
      </div>

      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v, i) => (
            <span
              key={`${v}-${i}`}
              className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-ink/5 py-1 pl-3 pr-1.5 text-xs font-medium text-ink"
            >
              {v}
              <button
                type="button"
                onClick={() => remove(i)}
                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-foreground/50 hover:bg-foreground/10 hover:text-foreground"
                aria-label={`Remove ${v}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {remainingSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3 w-3 text-sage" /> Suggested
          </span>
          {remainingSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex items-center gap-1 rounded-full border border-sage/30 bg-sage/10 px-2.5 py-1 text-[11px] font-medium text-sage hover:bg-sage/20"
            >
              <Plus className="h-2.5 w-2.5" /> {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
