"use client";

import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/blaknet/section";
import { LogoMark } from "@/components/blaknet/logo";
import { Pill } from "@/components/blaknet/badges";
import { STATS } from "@/lib/constants";
import {
  ArrowRight,
  ShieldCheck,
  Target,
  Heart,
  Handshake,
  Building2,
  Newspaper,
  Calendar,
  Users,
  BookOpen,
  Sparkles,
  Globe,
} from "lucide-react";

const PRINCIPLES = [
  {
    icon: ShieldCheck,
    title: "Confidence",
    body: "Trust signals and verification that put Black-owned businesses on equal footing in procurement and funding conversations.",
  },
  {
    icon: Target,
    title: "Opportunity",
    body: "A practical path from visibility to readiness — to be found, to win contracts, to access capital and markets.",
  },
  {
    icon: Heart,
    title: "Community",
    body: "A network built by and for Black entrepreneurs. Real relationships, not just listings. People you can call.",
  },
  {
    icon: Handshake,
    title: "Trust",
    body: "Verification, reviews and accountability that make every connection on BlakNet meaningful and credible.",
  },
];

const JOURNEY = [
  "Get Exposed",
  "Get Connected",
  "Get Informed",
  "Get Compliant",
  "Get Project-Ready",
  "Get Funding-Ready",
  "Get Opportunities",
];

const PILLARS = [
  {
    icon: Building2,
    title: "Directory",
    body: "Find and be found by verified Black-owned businesses across every province and industry.",
  },
  {
    icon: ShieldCheck,
    title: "Verification",
    body: "CIPC, B-BBEE and tax verification that turns your profile into a procurement-ready trust signal.",
  },
  {
    icon: Newspaper,
    title: "Newsfeed",
    body: "A professional community feed for posts, announcements, opportunities and articles.",
  },
  {
    icon: Calendar,
    title: "Events",
    body: "Discover and host networking, workshops, webinars and funding events across South Africa.",
  },
  {
    icon: Users,
    title: "Network CRM",
    body: "A lightweight, practical CRM to manage clients, suppliers, partners and prospects.",
  },
  {
    icon: BookOpen,
    title: "Resources",
    body: "Practical, no-fluff guides, templates and checklists for compliance, finance and growth.",
  },
];

export function AboutView() {
  const { navigate } = useApp();

  return (
    <div className="flex flex-col">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-ink-grain text-cream">
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
          <LogoMark className="absolute -right-16 -top-10 h-72 w-72 text-cream/10" size={288} />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-cream/15 bg-cream/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-sage">
              <Sparkles className="h-3.5 w-3.5" /> About BlakNet
            </div>
            <h1 className="font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-[4.2rem]">
              The digital infrastructure for Black-owned business.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-cream/65 sm:text-lg">
              BlakNet is the platform helping Black-owned businesses in South Africa get discovered, build real networks, and prepare for procurement, partnerships and funding — all in one place.
            </p>
            <p className="mt-8 font-display text-lg italic text-sage sm:text-xl">
              Get Exposed. Get Connected. Get Ready.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => navigate({ name: "register" })}
                className="bg-cream text-ink hover:bg-cream/90"
              >
                Join BlakNet <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate({ name: "directory" })}
                className="border-cream/20 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
              >
                Explore businesses
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== OUR WHY ===== */}
      <section className="bg-cream-grain">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionHeading
                eyebrow="Our why"
                title={<>Visibility isn't enough.</>}
                description="For too long, Black-owned businesses in South Africa have been told the answer is more visibility — be seen and the opportunities will come. They don't. Not on their own. What's needed is better access: to networks that open doors, to knowledge that builds readiness, to resources that move a business from surviving to scaling, and to opportunities that actually convert."
              />
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                BlakNet exists to fix the access problem — not just the visibility one. We're building the digital infrastructure that helps Black-owned businesses move through the full journey: from being exposed, to being connected, to being ready for whatever comes next.
              </p>
              <div className="mt-6">
                <Pill tone="sage">
                  <Globe className="h-3 w-3" /> Built for South Africa · Mobile-first
                </Pill>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {PRINCIPLES.map((p) => (
                <div
                  key={p.title}
                  className="card-lift rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-cream">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-xl tracking-tight text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== JOURNEY ===== */}
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            align="center"
            eyebrow="The journey"
            title={<>A connected path from visibility to opportunity.</>}
            description="BlakNet moves you through seven deliberate stages — each one building on the last, each one moving your business closer to procurement, partnership and funding readiness."
          />

          <div className="mt-14">
            {/* Desktop: horizontal */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute left-0 right-0 top-5 h-px bg-border" />
                <ol className="relative flex gap-2">
                  {JOURNEY.map((step, i) => (
                    <li
                      key={step}
                      className="flex flex-1 flex-col items-center text-center"
                    >
                      <div
                        className={
                          i === 0 || i === JOURNEY.length - 1
                            ? "flex h-10 w-10 items-center justify-center rounded-full bg-ink text-xs font-semibold text-cream ring-4 ring-background"
                            : "flex h-10 w-10 items-center justify-center rounded-full bg-card text-xs font-semibold text-ink ring-4 ring-background border border-border"
                        }
                      >
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div className="mt-3 text-[11px] font-medium leading-snug text-ink sm:text-xs">
                        {step}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Mobile: vertical */}
            <ol className="relative flex flex-col gap-3 lg:hidden">
              <div className="pointer-events-none absolute bottom-6 left-[18px] top-6 w-px bg-border" />
              {JOURNEY.map((step, i) => (
                <li key={step} className="relative z-10 flex items-center gap-3 text-left">
                  <div
                    className={
                      i === 0 || i === JOURNEY.length - 1
                        ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-cream ring-4 ring-background"
                        : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card text-[11px] font-semibold text-ink border border-border ring-4 ring-background"
                    }
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="flex-1 text-[11px] font-medium leading-snug text-ink sm:text-xs">
                    {step}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="bg-ink-grain text-cream">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="glass overflow-hidden rounded-2xl">
            <div className="grid grid-cols-2 sm:grid-cols-4">
              {STATS.map((s, i) => (
                <div
                  key={s.label}
                  className="relative px-4 py-10 text-center animate-fade-in-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="pointer-events-none absolute inset-x-2 top-1/2 -z-0 h-24 -translate-y-1/2 bg-sage/20 blur-3xl" />
                  <div className="relative font-display text-4xl tracking-tight text-cream sm:text-5xl">
                    {s.value}
                  </div>
                  <div className="relative mt-2 text-[11px] uppercase tracking-wider text-cream/50">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== PLATFORM PILLARS ===== */}
      <section className="bg-cream-grain">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            align="center"
            eyebrow="Built mobile-first for South African entrepreneurs"
            title={<>One platform, many tools. All on your phone.</>}
            description="From the township to the boardroom, BlakNet is designed mobile-first so every Black-owned business in South Africa can participate — wherever you are."
          />

          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-foreground/5 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className="bg-card p-6 transition-colors hover:bg-cream"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage/15 text-sage">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-xl tracking-tight text-ink">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-ink-grain px-6 py-16 text-center text-cream sm:px-12">
            <div className="pointer-events-none absolute inset-0 opacity-30">
              <LogoMark
                className="absolute -bottom-8 -right-8 h-64 w-64 text-cream/10"
                size={256}
              />
            </div>
            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-sage">
                <Sparkles className="h-3.5 w-3.5" /> Built for Black Business
              </div>
              <h2 className="mx-auto max-w-2xl font-display text-3xl leading-tight tracking-tight sm:text-4xl md:text-5xl">
                Join the network.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-cream/70">
                Create your free BlakNet profile today. Get listed, get discovered, and start building your network.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button
                  size="lg"
                  onClick={() => navigate({ name: "register" })}
                  className="bg-cream text-ink hover:bg-cream/90"
                >
                  Join BlakNet — it's free <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate({ name: "directory" })}
                  className="border-cream/20 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
                >
                  Explore businesses
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
