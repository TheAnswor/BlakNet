"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/blaknet/section";
import { Pill } from "@/components/blaknet/badges";
import { LogoMark } from "@/components/blaknet/logo";
import { useToast } from "@/hooks/use-toast";
import {
  Settings as SettingsIcon,
  ShieldCheck,
  ArrowRight,
  Globe,
  Mail,
  Bell,
  Crown,
  Sparkles,
  Check,
} from "lucide-react";

type LoadState =
  | { kind: "loading" }
  | { kind: "forbidden" }
  | { kind: "ready" };

interface FlagDef {
  key: string;
  label: string;
  description: string;
  default: boolean;
}

const FEATURE_FLAGS: FlagDef[] = [
  {
    key: "allow_registrations",
    label: "Allow new registrations",
    description: "New users can sign up for an account.",
    default: true,
  },
  {
    key: "allow_business_creation",
    label: "Allow business creation",
    description: "Members can publish new business profiles.",
    default: true,
  },
  {
    key: "allow_event_creation",
    label: "Allow event creation",
    description: "Members can publish new events.",
    default: true,
  },
  {
    key: "require_email_verification",
    label: "Require email verification",
    description: "New accounts must verify their email before login.",
    default: false,
  },
  {
    key: "maintenance_mode",
    label: "Maintenance mode",
    description: "Take the public site offline for maintenance.",
    default: false,
  },
  {
    key: "allow_public_directory",
    label: "Allow public directory",
    description: "Business directory is visible to anonymous visitors.",
    default: true,
  },
];

const PLATFORM_INFO: { label: string; value: string }[] = [
  { label: "Platform", value: "BlakNet" },
  { label: "Environment", value: "development" },
  { label: "Version", value: "1.0.0" },
  { label: "Region", value: "South Africa" },
  { label: "Timezone", value: "Africa/Johannesburg" },
];

const BRAND_SWATCHES: { name: string; hex: string; className: string }[] = [
  { name: "Ink", hex: "#1D2534", className: "bg-ink" },
  { name: "Cream", hex: "#F6F6DF", className: "bg-cream" },
  { name: "Sage", hex: "#717568", className: "bg-sage" },
];

export function AdminSettingsView() {
  const { navigate, authUser } = useApp();
  const { toast } = useToast();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [flags, setFlags] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(FEATURE_FLAGS.map((f) => [f.key, f.default])),
  );

  useEffect(() => {
    // No network call — this view is platform config (read-only display for MVP).
    // We simply confirm the user is an admin (the AdminShell already gates this,
    // but we duplicate the check here so the view is safe if mounted standalone).
    const t = setTimeout(() => {
      if (authUser?.role === "ADMIN" || authUser?.role === "SUPER_ADMIN") {
        setState({ kind: "ready" });
      } else {
        setState({ kind: "forbidden" });
      }
    }, 120);
    return () => clearTimeout(t);
  }, [authUser]);

  const toggleFlag = (key: string, value: boolean) => {
    setFlags((prev) => ({ ...prev, [key]: value }));
    toast({
      title: "Feature flags persistence coming soon",
      description: "Toggle state is cosmetic for this MVP preview.",
    });
  };

  if (state.kind === "loading") return <SettingsSkeleton />;
  if (state.kind === "forbidden") {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Admin access required."
        description="You need an admin account to view platform settings."
        action={
          <Button
            onClick={() => navigate({ name: "dashboard" })}
            className="bg-ink text-cream hover:bg-ink/90"
          >
            <ArrowRight className="mr-1.5 h-4 w-4" /> Back to dashboard
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-ink-grain p-6 text-cream sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 opacity-20">
          <SettingsIcon className="h-36 w-36 text-sage" />
        </div>
        <div className="relative">
          <Pill tone="sage" className="mb-3">
            <Crown className="h-3 w-3" /> Admin
          </Pill>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
            Settings
          </h1>
          <p className="mt-2 max-w-lg text-sm text-cream/70">
            Platform configuration and feature flags.
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>

        {/* PROFILE */}
        <TabsContent value="profile">
          <div
            className="card-soft animate-fade-in-up rounded-xl border border-border bg-card p-5 sm:p-6"
            style={{ animationDelay: "0ms" }}
          >
            <div className="mb-4 flex items-center gap-2">
              <Globe className="h-4 w-4 text-sage" />
              <h2 className="font-display text-lg tracking-tight">
                Platform information
              </h2>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              Core metadata about this BlakNet deployment.
            </p>
            <dl className="divide-y divide-border">
              {PLATFORM_INFO.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <dt className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    {row.label}
                  </dt>
                  <dd className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span>{row.value}</span>
                    <Check className="h-3.5 w-3.5 text-sage" />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </TabsContent>

        {/* FEATURES */}
        <TabsContent value="features">
          <div
            className="card-soft animate-fade-in-up rounded-xl border border-border bg-card p-5 sm:p-6"
            style={{ animationDelay: "0ms" }}
          >
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sage" />
              <h2 className="font-display text-lg tracking-tight">
                Feature flags
              </h2>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              Toggle platform features on or off. Cosmetic for this MVP preview.
            </p>
            <ul className="divide-y divide-border">
              {FEATURE_FLAGS.map((f) => (
                <li
                  key={f.key}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-medium text-foreground">
                      {f.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {f.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {flags[f.key] ? "On" : "Off"}
                    </span>
                    <Switch
                      checked={flags[f.key]}
                      onCheckedChange={(v) => toggleFlag(f.key, v)}
                      aria-label={f.label}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        {/* BRANDING */}
        <TabsContent value="branding">
          <div className="space-y-4">
            <div
              className="card-soft animate-fade-in-up rounded-xl border border-border bg-card p-5 sm:p-6"
              style={{ animationDelay: "0ms" }}
            >
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sage" />
                <h2 className="font-display text-lg tracking-tight">
                  Brand palette
                </h2>
              </div>
              <p className="mb-5 text-sm text-muted-foreground">
                The core BlakNet colour system.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {BRAND_SWATCHES.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
                  >
                    <div
                      className={s.className}
                      style={{ width: 44, height: 44 }}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {s.name}
                      </p>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        {s.hex}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="card-soft animate-fade-in-up rounded-xl border border-border bg-card p-5 sm:p-6"
              style={{ animationDelay: "60ms" }}
            >
              <div className="mb-4 flex items-center gap-2">
                <Bell className="h-4 w-4 text-sage" />
                <h2 className="font-display text-lg tracking-tight">
                  Typography
                </h2>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-background p-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    Display
                  </p>
                  <p className="mt-1 font-display text-3xl tracking-tight text-ink">
                    Instrument Serif
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Used for headings and large display type.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background p-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    Body
                  </p>
                  <p className="mt-1 font-sans text-base text-foreground">
                    Geist Sans
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Used for body copy and UI text.
                  </p>
                </div>
              </div>
            </div>

            <div
              className="card-soft animate-fade-in-up rounded-xl border border-border bg-card p-5 sm:p-6"
              style={{ animationDelay: "120ms" }}
            >
              <div className="mb-4 flex items-center gap-2">
                <Crown className="h-4 w-4 text-sage" />
                <h2 className="font-display text-lg tracking-tight">Logo</h2>
              </div>
              <div className="flex items-center gap-4 rounded-lg border border-border bg-background p-5">
                <LogoMark className="text-ink" size={56} />
                <div>
                  <p className="font-display text-2xl tracking-tight text-ink">
                    Blak<span className="text-sage">Net</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Built for Black Business. Built for Opportunity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Contact section */}
      <section
        className="card-soft animate-fade-in-up rounded-xl border border-border bg-card p-5 sm:p-6"
        style={{ animationDelay: "60ms" }}
      >
        <div className="mb-4 flex items-center gap-2">
          <Mail className="h-4 w-4 text-sage" />
          <h2 className="font-display text-lg tracking-tight">Contact</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <ContactRow
            icon={Mail}
            label="Support email"
            value="hello@blaknet.co.za"
            href="mailto:hello@blaknet.co.za"
          />
          <ContactRow
            icon={Sparkles}
            label="Documentation"
            value="docs.blaknet.co.za"
            href="https://docs.blaknet.co.za"
          />
          <ContactRow
            icon={ShieldCheck}
            label="Status page"
            value="status.blaknet.co.za"
            href="https://status.blaknet.co.za"
          />
        </div>
      </section>

      <p className="text-center text-[11px] text-muted-foreground/60">
        Read-only configuration for this MVP preview.
      </p>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="group flex items-start gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:border-ink/30"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink text-cream">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-foreground group-hover:text-ink">
          {value}
        </p>
      </div>
    </a>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-9 w-72 rounded-lg" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
