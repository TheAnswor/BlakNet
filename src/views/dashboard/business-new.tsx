"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  PROVINCES,
  BUSINESS_SIZES,
  EMPLOYEE_RANGES,
  REVENUE_RANGES,
  BBBEE_LEVELS,
} from "@/lib/constants";
import type { Industry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/blaknet/image-upload";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  X,
  Sparkles,
  AlertCircle,
  Building2,
  FileText,
  Globe,
  Briefcase,
  Package,
  Calendar,
  Users,
  CreditCard,
  ShieldCheck,
} from "lucide-react";

const DRAFT_KEY = "blaknet:draft-business";

interface FormState {
  name: string;
  tagline: string;
  industryId: string;
  province: string;
  city: string;
  description: string;
  businessSize: string;
  yearFounded: string;
  employeeCount: string;
  annualRevenue: string;
  cipcNumber: string;
  bbbeeLevel: string;
  website: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  logoUrl: string;
  coverUrl: string;
  services: string[];
  products: string[];
}

const INITIAL: FormState = {
  name: "",
  tagline: "",
  industryId: "",
  province: "",
  city: "",
  description: "",
  businessSize: "",
  yearFounded: "",
  employeeCount: "",
  annualRevenue: "",
  cipcNumber: "",
  bbbeeLevel: "",
  website: "",
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  logoUrl: "",
  coverUrl: "",
  services: [],
  products: [],
};

const STEPS = [
  { id: 1, label: "Basics" },
  { id: 2, label: "Details" },
  { id: 3, label: "Contact" },
  { id: 4, label: "Services & Products" },
] as const;

const SERVICE_SUGGESTIONS = ["Accounting", "Consulting", "Design", "Logistics"];
const PRODUCT_SUGGESTIONS = ["Report", "Template", "Kit", "Subscription"];

export function NewBusinessView() {
  const { navigate } = useApp();
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>(() => {
    if (typeof window === "undefined") return INITIAL;
    try {
      const raw = window.sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<FormState>;
        return { ...INITIAL, ...parsed, services: parsed.services ?? [], products: parsed.products ?? [] };
      }
    } catch {
      /* ignore malformed draft */
    }
    return INITIAL;
  });
  const [step, setStep] = useState(1);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  // Load industries
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

  // Persist draft
  useEffect(() => {
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      /* quota / private mode */
    }
  }, [form]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Per-step validation
  const stepErrors = useMemo<Partial<Record<keyof FormState, string>>>(() => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (step === 1) {
      if (!form.name.trim()) errs.name = "Business name is required.";
      if (!form.province) errs.province = "Province is required.";
      if (!form.city.trim()) errs.city = "City is required.";
    }
    if (step === 3) {
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errs.email = "Enter a valid email address.";
      }
      if (form.website && !/^https?:\/\/.+\..+/.test(form.website)) {
        errs.website = "Website must start with http:// or https://";
      }
    }
    return errs;
  }, [step, form]);

  const stepValid = Object.keys(stepErrors).length === 0;
  const showError = (key: keyof FormState) => (touched ? stepErrors[key] : undefined);

  const goNext = () => {
    setTouched(true);
    if (!stepValid) return;
    setTouched(false);
    setStep((s) => Math.min(4, s + 1));
  };

  const goBack = () => {
    setTouched(false);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleCancel = () => {
    if (window.confirm("Discard this draft? Your progress will be lost.")) {
      try {
        window.sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      navigate({ name: "dashboard-businesses" });
    }
  };

  const handleSubmit = async () => {
    setTouched(true);
    if (!stepValid) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        tagline: form.tagline.trim() || undefined,
        description: form.description.trim() || undefined,
        industryId: form.industryId || undefined,
        province: form.province,
        city: form.city.trim(),
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
        logoUrl: form.logoUrl || undefined,
        coverUrl: form.coverUrl || undefined,
        services: form.services,
        products: form.products,
      };
      const res = await api<{ business: { id: string } }>("/api/businesses", {
        method: "POST",
        json: payload,
      });
      try {
        window.sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      toast({
        title: "Business created",
        description: "Your profile is live on BlakNet. Time to complete verification.",
      });
      navigate({ name: "dashboard-business", id: res.business.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not create business.";
      toast({
        title: "Couldn't create business",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-sage">
            <Sparkles className="h-3.5 w-3.5" /> New Business
          </div>
          <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
            Add a business to BlakNet.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Build your procurement-ready profile in four short steps. You can edit anything later.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleCancel} className="text-muted-foreground">
          Cancel
        </Button>
      </div>

      {/* Stepper */}
      <Stepper currentStep={step} onStepClick={(s) => setStep(s)} />

      {/* Form card */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        {step === 1 && (
          <div className="space-y-5">
            <StepHeader
              icon={Building2}
              title="The basics"
              description="Start with the essentials. You can refine everything later."
            />
            <Separator />

            {/* Brand images */}
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Brand images
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                A logo helps your business stand out in the directory.
              </p>
              <div className="mt-3 flex flex-wrap items-start gap-6">
                <div className="space-y-1.5">
                  <Label>Logo</Label>
                  <ImageUpload
                    value={form.logoUrl || null}
                    onChange={(v) => update("logoUrl", v || "")}
                    label="Upload logo"
                    aspect="square"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Cover</Label>
                  <ImageUpload
                    value={form.coverUrl || null}
                    onChange={(v) => update("coverUrl", v || "")}
                    label="Upload cover"
                    aspect="wide"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">
                Business name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Langa & Sons Construction"
                aria-invalid={!!showError("name")}
              />
              {showError("name") && <FieldError message={showError("name")!} />}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={form.tagline}
                onChange={(e) => update("tagline", e.target.value)}
                placeholder="A one-line pitch that sets you apart"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
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
                <Label>
                  Province <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.province}
                  onValueChange={(v) => update("province", v)}
                >
                  <SelectTrigger className="w-full" aria-invalid={!!showError("province")}>
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
                {showError("province") && <FieldError message={showError("province")!} />}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="city">
                City <span className="text-destructive">*</span>
              </Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                placeholder="e.g. Johannesburg"
                aria-invalid={!!showError("city")}
              />
              {showError("city") && <FieldError message={showError("city")!} />}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <StepHeader
              icon={FileText}
              title="Business details"
              description="Tell buyers about your size, history and compliance posture."
            />
            <Separator />

            <div className="space-y-1.5">
              <Label htmlFor="description">About / Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={5}
                placeholder="Tell customers your story, what you do and what makes you different."
              />
              <p className="text-[11px] text-muted-foreground">
                Tip: a 2–3 paragraph description boosts discovery and verification odds.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
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
                <Label htmlFor="yearFounded">Year founded</Label>
                <Input
                  id="yearFounded"
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
                <Label htmlFor="cipcNumber">CIPC registration number</Label>
                <Input
                  id="cipcNumber"
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
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <StepHeader
              icon={Globe}
              title="Contact details"
              description="How customers, partners and procurement teams can reach you."
            />
            <Separator />

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={form.website}
                  onChange={(e) => update("website", e.target.value)}
                  placeholder="https://yourbusiness.co.za"
                  inputMode="url"
                  aria-invalid={!!showError("website")}
                />
                {showError("website") && <FieldError message={showError("website")!} />}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Business email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="hello@yourbusiness.co.za"
                  inputMode="email"
                  aria-invalid={!!showError("email")}
                />
                {showError("email") && <FieldError message={showError("email")!} />}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+27 11 555 0123"
                  inputMode="tel"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={form.whatsapp}
                  onChange={(e) => update("whatsapp", e.target.value)}
                  placeholder="+27 82 555 0123"
                  inputMode="tel"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Business address</Label>
              <Textarea
                id="address"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                rows={2}
                placeholder="Street, suburb, postal code"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <StepHeader
              icon={Briefcase}
              title="Services & products"
              description="Tag what you offer so you appear in the right searches."
            />
            <Separator />

            <TagInput
              label="Services"
              icon={Briefcase}
              placeholder="Add a service, e.g. 'Bricklaying'"
              values={form.services}
              onChange={(vals) => update("services", vals)}
              suggestions={SERVICE_SUGGESTIONS}
            />

            <TagInput
              label="Products"
              icon={Package}
              placeholder="Add a product, e.g. 'Custom furniture'"
              values={form.products}
              onChange={(vals) => update("products", vals)}
              suggestions={PRODUCT_SUGGESTIONS}
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={step === 1 || submitting}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
        <div className="text-xs text-muted-foreground">Step {step} of 4</div>
        {step < 4 ? (
          <Button
            onClick={goNext}
            disabled={submitting}
            className="bg-ink text-cream hover:bg-ink/90"
          >
            Continue <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-ink text-cream hover:bg-ink/90"
          >
            {submitting ? "Creating…" : "Create business"}
            {!submitting && <Check className="ml-1.5 h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Trust strip */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-xl border border-border bg-cream-grain px-5 py-4 text-[11px] text-foreground/70">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-sage" /> Verification unlocks the badge
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-sage" /> Public profile goes live instantly
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-sage" /> Join 2 400+ Black-owned businesses
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-sage" /> Draft auto-saves as you type
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5 text-sage" /> Free forever plan, no card needed
        </span>
      </div>
    </div>
  );
}

// ---------- sub-components ----------

function Stepper({
  currentStep,
  onStepClick,
}: {
  currentStep: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {STEPS.map((s, i) => {
        const completed = currentStep > s.id;
        const active = currentStep === s.id;
        const clickable = completed;
        return (
          <li key={s.id} className="flex flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(s.id)}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors",
                active && "border-ink bg-ink text-cream",
                completed && !active && "border-sage/30 bg-sage/15 text-sage hover:bg-sage/25",
                !active && !completed && "border-border bg-card text-muted-foreground",
                !clickable && "cursor-default",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  active && "bg-cream text-ink",
                  completed && !active && "bg-sage text-ink",
                  !active && !completed && "bg-muted text-muted-foreground",
                )}
              >
                {completed ? <Check className="h-3.5 w-3.5" /> : s.id}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "hidden h-px w-4 shrink-0 sm:block",
                  completed ? "bg-sage/40" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function StepHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink text-cream">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h2 className="font-display text-xl tracking-tight text-ink">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <p className="mt-1 inline-flex items-center gap-1 text-xs text-destructive">
      <AlertCircle className="h-3 w-3" /> {message}
    </p>
  );
}

function TagInput({
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
