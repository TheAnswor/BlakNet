"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Pill } from "@/components/blaknet/badges";
import { EmptyState } from "@/components/blaknet/section";
import { CONTACT_CATEGORIES } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import type { Contact } from "@/lib/types";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Globe,
  AlertCircle,
} from "lucide-react";

interface FormState {
  name: string;
  company: string;
  position: string;
  email: string;
  phone: string;
  website: string;
  category: string;
  notes: string;
  tags: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  company: "",
  position: "",
  email: "",
  phone: "",
  website: "",
  category: "Other",
  notes: "",
  tags: "",
};

export function NetworkView() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ items: Contact[] }>("/api/contacts");
      setContacts(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load contacts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (category !== "All" && c.category !== category) return false;
      if (!q) return true;
      const hay = `${c.name} ${c.company ?? ""} ${c.email ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [contacts, search, category]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(c: Contact) {
    setEditing(c);
    setForm({
      name: c.name,
      company: c.company ?? "",
      position: c.position ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      website: c.website ?? "",
      category: c.category,
      notes: c.notes ?? "",
      tags: c.tags ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        company: form.company.trim(),
        position: form.position.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        category: form.category,
        notes: form.notes.trim(),
        tags: form.tags.trim(),
      };
      if (editing) {
        await api(`/api/contacts/${editing.id}`, { method: "PATCH", json: payload });
        toast({ title: "Contact updated", description: `${payload.name} has been updated.` });
      } else {
        await api("/api/contacts", { method: "POST", json: payload });
        toast({ title: "Contact added", description: `${payload.name} is now in your network.` });
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      toast({
        title: "Couldn't save contact",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api(`/api/contacts/${deleteId}`, { method: "DELETE" });
      toast({ title: "Contact deleted" });
      setDeleteId(null);
      await load();
    } catch (err) {
      toast({
        title: "Couldn't delete contact",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">My Network</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Manage the relationships that move your business forward — clients, suppliers, partners and prospects.
          </p>
        </div>
        <Button onClick={openAdd} className="bg-ink text-cream hover:bg-ink/90">
          <Plus className="mr-1.5 h-4 w-4" /> Add contact
        </Button>
      </div>

      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company or email…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <CategoryPill label="All" active={category === "All"} onClick={() => setCategory("All")} count={contacts.length} />
          {CONTACT_CATEGORIES.map((c) => (
            <CategoryPill
              key={c}
              label={c}
              active={category === c}
              onClick={() => setCategory(c)}
              count={contacts.filter((x) => x.category === c).length}
            />
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="mt-3 h-4 w-3/4" />
              <Skeleton className="mt-4 h-8 w-full" />
              <Skeleton className="mt-3 h-8 w-full" />
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={AlertCircle}
          title="Couldn't load your contacts"
          description={error}
          action={<Button onClick={load} variant="outline">Try again</Button>}
        />
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Your network starts with one connection."
          description="Add your first contact to keep track of clients, suppliers and partners in one place."
          action={
            <Button onClick={openAdd} className="bg-ink text-cream hover:bg-ink/90">
              <Plus className="mr-1.5 h-4 w-4" /> Add contact
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No contacts match your filters."
          description="Try a different category or search term."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setCategory("All");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {contacts.length} {contacts.length === 1 ? "contact" : "contacts"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c) => (
              <ContactCard
                key={c.id}
                contact={c}
                onEdit={() => openEdit(c)}
                onDelete={() => setDeleteId(c.id)}
              />
            ))}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit contact" : "Add a contact"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update this contact's details." : "Capture the details of someone in your network."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Thabo Mokoena"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Acme Trading"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  placeholder="Founder"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="thabo@acme.co.za"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+27 82 000 0000"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://acme.co.za"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="Choose category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="enterprise, gauteng, mentor"
              />
              <p className="text-[11px] text-muted-foreground">Comma-separated.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="Context, last interaction, next steps…"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-ink text-cream hover:bg-ink/90">
                {submitting ? "Saving…" : editing ? "Save changes" : "Add contact"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this contact?</DialogTitle>
            <DialogDescription>
              This action can't be undone. The contact and all their details will be removed from your network.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryPill({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={
        active
          ? "inline-flex items-center gap-1.5 rounded-full border border-ink bg-ink px-3 py-1 text-xs font-medium text-cream"
          : "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground/70 hover:border-foreground/30 hover:text-foreground"
      }
    >
      {label}
      <span className={active ? "text-cream/60" : "text-muted-foreground"}>{count}</span>
    </button>
  );
}

function ContactCard({
  contact,
  onEdit,
  onDelete,
}: {
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const tags = contact.tags ? contact.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const roleLine = [contact.position, contact.company].filter(Boolean).join(" · ") || "—";
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink font-display text-cream">
            {contact.name[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium leading-tight">{contact.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{roleLine}</p>
          </div>
        </div>
        <Pill tone={categoryTone(contact.category)}>{contact.category}</Pill>
      </div>

      <div className="mt-4 space-y-1.5 text-sm">
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-foreground/70 hover:text-ink">
            <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{contact.email}</span>
          </a>
        )}
        {contact.phone && (
          <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-foreground/70 hover:text-ink">
            <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{contact.phone}</span>
          </a>
        )}
        {contact.website && (
          <a
            href={contact.website}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-foreground/70 hover:text-ink"
          >
            <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{contact.website.replace(/^https?:\/\//, "")}</span>
          </a>
        )}
        {!contact.email && !contact.phone && !contact.website && (
          <p className="text-xs text-muted-foreground/70">No contact details captured.</p>
        )}
      </div>

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] text-foreground/60"
            >
              {t}
            </span>
          ))}
          {tags.length > 4 && (
            <span className="inline-flex items-center rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] text-foreground/60">
              +{tags.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <p className="text-[11px] text-muted-foreground">Added {timeAgo(contact.createdAt)}</p>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

function categoryTone(category: string): "neutral" | "ink" | "sage" | "cream" {
  switch (category) {
    case "Client":
      return "sage";
    case "Supplier":
      return "ink";
    case "Partner":
    case "Investor":
      return "cream";
    default:
      return "neutral";
  }
}
