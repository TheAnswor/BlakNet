"use client";

import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";

import {
  BookOpen,
  ShieldCheck,
  CreditCard,
  Mail,
  ArrowRight,
  LifeBuoy,
  HelpCircle,
} from "lucide-react";
import type { Route } from "@/lib/types";

interface HelpCard {
  title: string;
  description: string;
  cta: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

const POPULAR_ARTICLES = [
  "How to verify your business on BlakNet",
  "Writing a business profile that converts",
  "Collecting and responding to reviews",
  "Understanding B-BBEE for procurement",
  "Getting the most out of your network",
];

export function HelpView() {
  const { navigate } = useApp();

  const cards: HelpCard[] = [
    {
      title: "Getting started",
      description: "Set up your profile, add your first business and start getting found.",
      cta: "Open resources",
      icon: BookOpen,
      onClick: () => navigate({ name: "resources" } as Route),
    },
    {
      title: "Verification",
      description: "Submit your CIPC documents and earn the verified badge that wins contracts.",
      cta: "Manage businesses",
      icon: ShieldCheck,
      onClick: () => navigate({ name: "dashboard-businesses" } as Route),
    },
    {
      title: "Subscriptions & billing",
      description: "Plans, payment methods, invoices and upgrading or downgrading.",
      cta: "Open My Plan",
      icon: CreditCard,
      onClick: () => navigate({ name: "dashboard-plan" } as Route),
    },
    {
      title: "Contact support",
      description: "Can't find what you need? Email the team and we'll get back to you.",
      cta: "Email support",
      icon: Mail,
      onClick: () => {
        window.location.href = "mailto:hello@blaknet.co.za";
      },
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Help &amp; Support</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Find answers, learn the platform and reach the BlakNet team when you need a hand.
        </p>
      </div>

      {/* Help cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.title}
            className="flex flex-col rounded-xl border border-border bg-card p-6"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-cream">
              <c.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display text-lg tracking-tight">{c.title}</h3>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{c.description}</p>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={c.onClick}
                className="w-full justify-between"
              >
                {c.cta}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Popular articles */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-sage" />
            <h2 className="font-display text-lg tracking-tight">Popular articles</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ name: "resources" } as Route)}
            className="text-muted-foreground"
          >
            Browse all
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
        <ul className="divide-y divide-border">
          {POPULAR_ARTICLES.map((a, i) => (
            <li key={i}>
              <button
                onClick={() => navigate({ name: "resources" } as Route)}
                className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left text-sm transition-colors hover:bg-muted/40"
              >
                <span className="flex items-center gap-3">
                  <span className="font-display text-sage">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-medium">{a}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-foreground/30" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Contact band */}
      <div className="relative overflow-hidden rounded-xl bg-ink-grain p-6 text-cream sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 opacity-20">
          <LifeBuoy className="h-32 w-32 text-sage" />
        </div>
        <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl tracking-tight sm:text-3xl">Still stuck?</h2>
            <p className="mt-1 max-w-md text-sm text-cream/70">
              Email the BlakNet team and we'll get you unblocked within one business day.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                window.location.href = "mailto:hello@blaknet.co.za";
              }}
              className="bg-cream text-ink hover:bg-cream/90"
            >
              <Mail className="mr-1.5 h-4 w-4" /> hello@blaknet.co.za
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ name: "dashboard-network" } as Route)}
              className="border-cream/20 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
            >
              Visit your network
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
