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
import { Skeleton } from "@/components/ui/skeleton";
import { Pill } from "@/components/blaknet/badges";
import { EmptyState } from "@/components/blaknet/section";
import { ImageUpload } from "@/components/blaknet/image-upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { BlakEvent } from "@/lib/types";
import { formatDate, formatNumber, monthDay } from "@/lib/format";
import {
  Calendar,
  Plus,
  MapPin,
  Video,
  Users,
  CalendarPlus,
  ArrowRight,
  Clock,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Globe,
} from "lucide-react";

function categoryLabel(value: string): string {
  return EVENT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function isSvgDataUri(url: string): boolean {
  return url.startsWith("data:image/svg");
}

function getInitials(title: string): string {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function DashboardEventsView() {
  const { navigate } = useApp();
  const { toast } = useToast();
  const [items, setItems] = useState<BlakEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState<BlakEvent | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editNonce, setEditNonce] = useState(0);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<{ items: BlakEvent[] }>("/api/events?owner=1")
      .then((d) => {
        if (cancelled) return;
        setItems(d.items ?? []);
        setError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message || "Could not load your events.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function reload() {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }

  function openEdit(e: BlakEvent) {
    setEditing(e);
    setEditNonce((n) => n + 1);
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
  }

  async function handleEditSubmit(payload: Record<string, unknown>) {
    if (!editing) return;
    setSubmitting(true);
    try {
      const res = await api<{ event: BlakEvent }>(
        `/api/events/${editing.slug}`,
        { method: "PATCH", json: payload },
      );
      toast({ title: "Event updated", description: res.event.title });
      closeEdit();
      reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not update event.";
      toast({ title: "Could not update event", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteSlug) return;
    const slug = deleteSlug;
    setDeleting(true);
    // Optimistic removal
    setItems((prev) => prev.filter((e) => e.slug !== slug));
    setDeleteSlug(null);
    try {
      await api(`/api/events/${slug}`, { method: "DELETE" });
      toast({ title: "Event deleted" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not delete event.";
      toast({ title: "Could not delete event", description: msg, variant: "destructive" });
      reload();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-sage">
            <Calendar className="h-3.5 w-3.5" /> My Events
          </div>
          <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
            Manage events you&apos;re hosting on BlakNet.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Track registrations, capacity and details for the workshops, webinars
            and meetups you&apos;re hosting.
          </p>
        </div>
        <Button
          onClick={() => navigate({ name: "dashboard-event-new" })}
          className="btn-lift bg-ink text-cream shadow-md hover:bg-ink/90"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Host an event
        </Button>
      </div>

      {/* Body */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={CalendarPlus}
          title="Something went wrong."
          description={error}
          action={
            <Button variant="outline" onClick={reload}>
              Try again
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title="You haven't hosted any events yet."
          description="Create your first event — a workshop, webinar, meetup or networking session."
          action={
            <Button
              onClick={() => navigate({ name: "dashboard-event-new" })}
              className="btn-lift bg-ink text-cream shadow-md hover:bg-ink/90"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Host an event
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((e, i) => (
            <div
              key={e.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <EventRow
                event={e}
                onOpen={() => navigate({ name: "event", slug: e.slug })}
                onEdit={() => openEdit(e)}
                onDelete={() => setDeleteSlug(e.slug)}
              />
            </div>
          ))}
        </div>
      )}

      <EditEventDialog
        key={editNonce}
        open={editOpen}
        event={editing}
        onClose={closeEdit}
        onSubmit={handleEditSubmit}
        submitting={submitting}
      />

      <Dialog
        open={!!deleteSlug}
        onOpenChange={(o) => !o && setDeleteSlug(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this event?</DialogTitle>
            <DialogDescription>
              This can&apos;t be undone. The event will be removed from BlakNet and
              attendees will no longer be able to access it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteSlug(null)}
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
                  <Trash2 className="mr-1.5 h-4 w-4" /> Delete event
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EventRow({
  event,
  onOpen,
  onEdit,
  onDelete,
}: {
  event: BlakEvent;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const md = monthDay(event.startDate);
  const attending = event._count?.attendees ?? 0;
  return (
    <div className="card-lift card-soft group flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:p-5">
      {/* Date / image tile */}
      <button
        type="button"
        onClick={onOpen}
        className="relative flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-grain text-left sm:h-24 sm:w-28"
        aria-label={`Open ${event.title}`}
      >
        {event.imageUrl && isSvgDataUri(event.imageUrl) ? (
          <img
            src={event.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-contain p-4"
          />
        ) : (
          <span className="font-display text-3xl text-cream/30">
            {getInitials(event.title)}
          </span>
        )}
        <div className="absolute right-2 top-2 rounded-md bg-ink/85 px-2 py-1 text-center text-cream shadow-md backdrop-blur-sm">
          <div className="font-display text-base leading-none">{md.day}</div>
          <div className="text-[9px] uppercase tracking-wide text-cream/70">
            {md.month}
          </div>
        </div>
      </button>

      {/* Main */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="link-underline font-display text-lg tracking-tight text-ink hover:text-foreground"
          >
            {event.title}
          </button>
          <Pill tone="sage">{categoryLabel(event.category)}</Pill>
          {event.business ? (
            <Pill tone="neutral">{event.business.name}</Pill>
          ) : null}
        </div>

        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
          {event.description}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(event.startDate, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          {event.endDate ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Until {formatDate(event.endDate, { day: "numeric", month: "short" })}
            </span>
          ) : null}
          {event.isOnline ? (
            <span className="inline-flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5" /> Online
            </span>
          ) : event.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{event.location}</span>
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {formatNumber(attending)} attending
            {event.capacity ? ` / ${formatNumber(event.capacity)}` : ""}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:pl-2 sm:opacity-0 sm:transition-opacity sm:duration-200 sm:group-hover:opacity-100">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpen}
          className="border-border bg-background hover:bg-muted"
        >
          View event <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="border-border bg-background hover:bg-muted"
            aria-label="Edit event"
          >
            <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete event"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- Edit Event dialog ----------

interface EditFormState {
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
  imageUrl: string | null;
}

const EMPTY_EDIT_FORM: EditFormState = {
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
  imageUrl: null,
};

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EditEventDialog({
  open,
  event,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  event: BlakEvent | null;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
}) {
  // The parent passes a `key={editNonce}` that bumps on every open, so this
  // component remounts with fresh state whenever a new edit session starts.
  const [form, setForm] = useState<EditFormState>(() =>
    event
      ? {
          title: event.title,
          description: event.description,
          category: event.category,
          startDate: toDatetimeLocal(event.startDate),
          endDate: toDatetimeLocal(event.endDate),
          isOnline: event.isOnline,
          onlineUrl: event.onlineUrl ?? "",
          location: event.location ?? "",
          registrationUrl: event.registrationUrl ?? "",
          capacity: event.capacity != null ? String(event.capacity) : "",
          imageUrl: event.imageUrl,
        }
      : EMPTY_EDIT_FORM,
  );
  const [touched, setTouched] = useState(false);

  const update = <K extends keyof EditFormState>(key: K, value: EditFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
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
  const showError = (key: string) => (touched ? errors[key] : undefined);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
    payload.endDate = form.endDate || null;
    if (form.isOnline) payload.onlineUrl = form.onlineUrl.trim();
    payload.location = form.isOnline ? null : form.location.trim();
    payload.registrationUrl = form.registrationUrl.trim();
    payload.capacity = form.capacity.trim() ? Number(form.capacity) : null;
    payload.imageUrl = form.imageUrl;
    void onSubmit(payload);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit event</DialogTitle>
          <DialogDescription>
            Update the details of your event. Changes are reflected on the public
            event page immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="ed-title">Event title</Label>
            <Input
              id="ed-title"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              maxLength={120}
              aria-invalid={!!showError("title")}
            />
            {showError("title") && (
              <p className="text-xs text-destructive">{showError("title")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ed-desc">Description</Label>
            <Textarea
              id="ed-desc"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={4}
              maxLength={2000}
              aria-invalid={!!showError("description")}
            />
            {showError("description") && (
              <p className="text-xs text-destructive">{showError("description")}</p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ed-cat">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => update("category", v)}
              >
                <SelectTrigger id="ed-cat" className="w-full" aria-invalid={!!showError("category")}>
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
              <Label htmlFor="ed-cap">Capacity</Label>
              <Input
                id="ed-cap"
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => update("capacity", e.target.value)}
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ed-start">Start date &amp; time</Label>
              <Input
                id="ed-start"
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
              <Label htmlFor="ed-end">End date &amp; time</Label>
              <Input
                id="ed-end"
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => update("endDate", e.target.value)}
                aria-invalid={!!showError("endDate")}
              />
              {showError("endDate") && (
                <p className="text-xs text-destructive">{showError("endDate")}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="ed-online" className="cursor-pointer text-sm font-medium">
                <span className="inline-flex items-center gap-2">
                  {form.isOnline ? (
                    <Video className="h-4 w-4 text-sage" />
                  ) : (
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  )}
                  Online event
                </span>
              </Label>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors",
                    form.isOnline ? "text-sage" : "text-muted-foreground",
                  )}
                >
                  {form.isOnline ? "Online" : "In-person"}
                </span>
                <Switch
                  id="ed-online"
                  checked={form.isOnline}
                  onCheckedChange={(v) => update("isOnline", v)}
                />
              </div>
            </div>
          </div>

          {form.isOnline ? (
            <div className="space-y-2 animate-fade-in-up">
              <Label htmlFor="ed-online-url">Online URL</Label>
              <div className="relative">
                <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="ed-online-url"
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
            <div className="space-y-2 animate-fade-in-up">
              <Label htmlFor="ed-loc">Location</Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="ed-loc"
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                  placeholder="Sandton Convention Centre, Johannesburg"
                  className="pl-9"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="ed-reg">Registration URL</Label>
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="ed-reg"
                value={form.registrationUrl}
                onChange={(e) => update("registrationUrl", e.target.value)}
                placeholder="https://your-registration-page.co.za"
                className="pl-9"
                aria-invalid={!!showError("registrationUrl")}
              />
            </div>
            {showError("registrationUrl") && (
              <p className="text-xs text-destructive">{showError("registrationUrl")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Event image</Label>
            <ImageUpload
              value={form.imageUrl}
              onChange={(v) => update("imageUrl", v)}
              label="Upload event banner"
              aspect="wide"
              maxMb={2.5}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !isValid}
              className="btn-lift bg-ink text-cream shadow-md shadow-ink/15 hover:bg-ink/90 disabled:opacity-40 disabled:shadow-none"
            >
              {submitting ? (
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
