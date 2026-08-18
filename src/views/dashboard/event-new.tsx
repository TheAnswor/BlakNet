"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/blaknet/image-upload";
import { EVENT_CATEGORIES } from "@/lib/constants";
import type { Business } from "@/lib/types";
import {
  ArrowLeft,
  CalendarPlus,
  Loader2,
  Save,
  Sparkles,
  X,
  Globe,
  MapPin,
  Video,
  Building2,
} from "lucide-react";

interface FormState {
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  isOnline: boolean;
  onlineUrl: string;
  location: string;
  registrationUrl: string;
  capacity: string;
  businessId: string;
  imageUrl: string | null;
}

const INITIAL: FormState = {
  title: "",
  description: "",
  category: "",
  startDate: "",
  endDate: "",
  isOnline: false,
  onlineUrl: "",
  location: "",
  registrationUrl: "",
  capacity: "",
  businessId: "none",
  imageUrl: null,
};

interface FieldErrors {
  title?: string;
  description?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  onlineUrl?: string;
  registrationUrl?: string;
}

export function NewEventView() {
  const { navigate } = useApp();
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  // Load user's businesses for the host selector
  useEffect(() => {
    let cancelled = false;
    api<{ items: Business[] }>("/api/businesses/owner")
      .then((d) => {
        if (cancelled) return;
        setBusinesses(d.items ?? []);
      })
      .catch(() => {
        /* silent — Select just shows "None" */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const errors = useMemo<FieldErrors>(() => {
    const e: FieldErrors = {};
    if (!form.title.trim()) e.title = "Event title is required.";
    if (!form.description.trim()) e.description = "A short description is required.";
    if (!form.category) e.category = "Please choose a category.";
    if (!form.startDate) e.startDate = "Start date & time is required.";
    if (form.endDate && form.startDate && new Date(form.endDate) < new Date(form.startDate)) {
      e.endDate = "End date must be after the start date.";
    }
    if (form.isOnline && form.onlineUrl && !/^https?:\/\/.+/i.test(form.onlineUrl)) {
      e.onlineUrl = "URL must start with http:// or https://";
    }
    if (form.registrationUrl && !/^https?:\/\/.+/i.test(form.registrationUrl)) {
      e.registrationUrl = "URL must start with http:// or https://";
    }
    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;
  const showError = (key: keyof FieldErrors) => (touched ? errors[key] : undefined);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  function handleCancel() {
    const hasContent =
      form.title.trim() ||
      form.description.trim() ||
      form.category ||
      form.startDate ||
      form.location.trim() ||
      form.onlineUrl.trim();
    if (hasContent && !window.confirm("Discard this event? Your changes will be lost.")) {
      return;
    }
    navigate({ name: "dashboard-events" });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    if (!isValid || submitting) return;

    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      startDate: form.startDate,
      isOnline: form.isOnline,
    };
    if (form.endDate) payload.endDate = form.endDate;
    if (form.isOnline && form.onlineUrl.trim()) payload.onlineUrl = form.onlineUrl.trim();
    if (!form.isOnline && form.location.trim()) payload.location = form.location.trim();
    if (form.registrationUrl.trim()) payload.registrationUrl = form.registrationUrl.trim();
    if (form.capacity.trim()) payload.capacity = Number(form.capacity);
    if (form.imageUrl) payload.imageUrl = form.imageUrl;
    if (form.businessId !== "none") payload.businessId = form.businessId;

    setSubmitting(true);
    try {
      await api("/api/events", { method: "POST", json: payload });
      toast({
        title: "Event created — it's now live on BlakNet",
        description: form.title.trim(),
      });
      navigate({ name: "dashboard-events" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not create event.";
      toast({ title: "Could not create event", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <button
            type="button"
            onClick={() => navigate({ name: "dashboard-events" })}
            className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-sage transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> My Events
          </button>
          <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
            Host an event.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Create a networking event, workshop, webinar or meetup for the BlakNet
            community.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          className="border-border bg-background hover:bg-muted"
        >
          <X className="mr-1.5 h-4 w-4" /> Cancel
        </Button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="card-soft rounded-2xl border border-border bg-card p-6 sm:p-8"
      >
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-sage" />
          Fields marked with{" "}
          <span className="font-medium text-foreground">*</span> are required.
        </div>

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="ev-title">
              Event title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ev-title"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Soweto Founders Breakfast"
              maxLength={120}
              aria-invalid={!!showError("title")}
            />
            {showError("title") && (
              <p className="text-xs text-destructive">{showError("title")}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="ev-desc">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="ev-desc"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Tell attendees what to expect, who it's for and what they'll take away."
              rows={5}
              maxLength={2000}
              aria-invalid={!!showError("description")}
            />
            <div className="flex items-center justify-between">
              {showError("description") ? (
                <p className="text-xs text-destructive">{showError("description")}</p>
              ) : (
                <span />
              )}
              <span className="text-[11px] text-muted-foreground">
                {form.description.length}/2000
              </span>
            </div>
          </div>

          {/* Category + Capacity */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ev-cat">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.category}
                onValueChange={(v) => update("category", v)}
              >
                <SelectTrigger id="ev-cat" className="w-full" aria-invalid={!!showError("category")}>
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showError("category") && (
                <p className="text-xs text-destructive">{showError("category")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ev-cap">Capacity</Label>
              <Input
                id="ev-cap"
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => update("capacity", e.target.value)}
                placeholder="120"
              />
              <p className="text-[11px] text-muted-foreground">
                Maximum attendees. Leave blank for unlimited.
              </p>
            </div>
          </div>

          {/* Start + End */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ev-start">
                Start date &amp; time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ev-start"
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
                aria-invalid={!!showError("startDate")}
              />
              {showError("startDate") && (
                <p className="text-xs text-destructive">{showError("startDate")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ev-end">End date &amp; time</Label>
              <Input
                id="ev-end"
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => update("endDate", e.target.value)}
                aria-invalid={!!showError("endDate")}
              />
              {showError("endDate") ? (
                <p className="text-xs text-destructive">{showError("endDate")}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground">Optional — only if your event has a fixed end.</p>
              )}
            </div>
          </div>

          {/* Online toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-4">
            <div className="pr-4">
              <div className="flex items-center gap-2">
                {form.isOnline ? (
                  <Video className="h-4 w-4 text-sage" />
                ) : (
                  <MapPin className="h-4 w-4 text-sage" />
                )}
                <Label htmlFor="ev-online" className="cursor-pointer text-sm font-medium">
                  Is this an online event?
                </Label>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Toggle on to host virtually — you&apos;ll add a meeting link.
              </p>
            </div>
            <Switch
              id="ev-online"
              checked={form.isOnline}
              onCheckedChange={(v) => update("isOnline", v)}
            />
          </div>

          {/* Online URL or Location */}
          {form.isOnline ? (
            <div className="space-y-2">
              <Label htmlFor="ev-online-url">Online URL</Label>
              <div className="relative">
                <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="ev-online-url"
                  value={form.onlineUrl}
                  onChange={(e) => update("onlineUrl", e.target.value)}
                  placeholder="https://meet.blaknet.co.za/..."
                  className="pl-9"
                  aria-invalid={!!showError("onlineUrl")}
                />
              </div>
              {showError("onlineUrl") && (
                <p className="text-xs text-destructive">{showError("onlineUrl")}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="ev-loc">Location</Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="ev-loc"
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                  placeholder="Sandton Convention Centre, Johannesburg"
                  className="pl-9"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Venue name and city — attendees will see this on the public event page.
              </p>
            </div>
          )}

          {/* Registration URL */}
          <div className="space-y-2">
            <Label htmlFor="ev-reg">Registration URL</Label>
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="ev-reg"
                value={form.registrationUrl}
                onChange={(e) => update("registrationUrl", e.target.value)}
                placeholder="https://your-registration-page.co.za"
                className="pl-9"
                aria-invalid={!!showError("registrationUrl")}
              />
            </div>
            {showError("registrationUrl") ? (
              <p className="text-xs text-destructive">{showError("registrationUrl")}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Optional — link to an external registration or ticketing page.
              </p>
            )}
          </div>

          {/* Host as business */}
          <div className="space-y-2">
            <Label htmlFor="ev-biz">Host as business</Label>
            <Select
              value={form.businessId}
              onValueChange={(v) => update("businessId", v)}
            >
              <SelectTrigger id="ev-biz" className="w-full">
                <SelectValue placeholder="None — personal event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None — personal event</SelectItem>
                {businesses.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    <span className="inline-flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      {b.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Attribute this event to one of your business profiles (optional).
            </p>
          </div>

          {/* Event image */}
          <div className="space-y-2">
            <Label>Event image</Label>
            <ImageUpload
              value={form.imageUrl}
              onChange={(v) => update("imageUrl", v)}
              label="Upload event banner"
              aspect="wide"
              maxMb={2.5}
            />
            <p className="text-[11px] text-muted-foreground">
              Optional banner — recommended 16:9. Used on the event card and detail page.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={submitting}
            className="border-border bg-background hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || !isValid}
            className="btn-lift bg-ink text-cream shadow-md hover:bg-ink/90"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Publishing…
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-4 w-4" /> Publish event
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Helper note */}
      <div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-card/50 p-4 text-sm text-muted-foreground">
        <CalendarPlus className="mt-0.5 h-4 w-4 text-sage" />
        <p>
          Once published, your event appears instantly on the public{" "}
          <button
            type="button"
            onClick={() => navigate({ name: "events" })}
            className="link-underline font-medium text-foreground"
          >
            Events
          </button>{" "}
          page. Attendees can register with a single click — track sign-ups from your
          dashboard.
        </p>
      </div>
    </div>
  );
}
