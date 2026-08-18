"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/blaknet/section";
import { BusinessCard } from "@/components/blaknet/business-card";
import { Pill } from "@/components/blaknet/badges";
import { LogoMark } from "@/components/blaknet/logo";
import { api } from "@/lib/api";
import type { Business } from "@/lib/types";
import { STATS } from "@/lib/constants";
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Network,
  Rocket,
  TrendingUp,
  Building2,
  Calendar,
  Newspaper,
  BookOpen,
  Users,
  Sparkles,
  Quote,
} from "lucide-react";

interface FeaturedItem extends Business {
  rating: number;
  reviewCount: number;
}

export function HomeView() {
  const { navigate } = useApp();
  const [featured, setFeatured] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    api<{ items: FeaturedItem[] }>("/api/businesses?featured=1&pageSize=6")
      .then((d) => setFeatured(d.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-ink-grain text-cream">
        {/* atmospheric gradient glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-10%] h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-sage/20 blur-[120px]" />
          <div className="absolute right-[10%] top-[20%] h-[280px] w-[280px] rounded-full bg-sage/10 blur-[90px]" />
        </div>
        {/* decorative network nodes */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.55]">
          <svg className="absolute -right-20 -top-20 h-[460px] w-[460px]" viewBox="0 0 200 200" fill="none">
            <g stroke="#717568" strokeWidth="0.6" opacity="0.5">
              {Array.from({ length: 14 }).map((_, i) => {
                const a = (i / 14) * Math.PI * 2;
                const x = 100 + Math.cos(a) * 70;
                const y = 100 + Math.sin(a) * 70;
                return <line key={i} x1="100" y1="100" x2={x} y2={y} />;
              })}
            </g>
            {Array.from({ length: 14 }).map((_, i) => {
              const a = (i / 14) * Math.PI * 2;
              const x = 100 + Math.cos(a) * 70;
              const y = 100 + Math.sin(a) * 70;
              return <circle key={i} cx={x} cy={y} r="2.4" fill="#717568" />;
            })}
            <circle cx="100" cy="100" r="6" fill="#F6F6DF" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cream/15 bg-cream/5 px-3 py-1 text-[12px] text-cream/80 backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sage" />
              </span>
              The Black Business Ecosystem · South Africa
            </div>
            <h1 className="font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-[4.4rem]">
              Built for Black Business.
              <br />
              <span className="text-sage">Built for Opportunity.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-cream/55 sm:text-lg">
              BlakNet is the platform helping Black-owned businesses get discovered, connected and opportunity-ready.
              Build your profile. Discover and host events. Connect with entrepreneurs. Access practical resources.
            </p>

            {/* search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (q.trim()) sessionStorage.setItem("blaknet:directory-search", q.trim());
                navigate({ name: "directory" });
              }}
              className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-full border border-cream/15 bg-cream/5 p-1.5 backdrop-blur"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/40" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search businesses, services, products…"
                  className="h-11 w-full bg-transparent pl-10 pr-3 text-sm text-cream placeholder:text-cream/40 focus:outline-none"
                />
              </div>
              <Button
                type="submit"
                className="btn-lift h-11 rounded-full bg-cream px-5 text-ink shadow-lg shadow-cream/10 hover:bg-white hover:shadow-cream/20"
              >
                Search
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => navigate({ name: "register" })}
                className="btn-lift bg-sage text-cream shadow-lg shadow-sage/20 hover:bg-sage/85 hover:shadow-sage/30"
              >
                Join BlakNet <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate({ name: "directory" })}
                className="btn-lift border-cream/25 bg-cream/5 text-cream backdrop-blur hover:bg-cream/15 hover:text-cream"
              >
                Explore Businesses
              </Button>
            </div>

            <p className="mt-6 font-display text-lg italic text-sage">
              Get Exposed. Get Connected. Get Ready.
            </p>
          </div>

          {/* stats strip — glassmorphism */}
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl glass sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-ink/30 px-4 py-6 text-center backdrop-blur">
                <div className="font-display text-3xl tracking-tight text-cream sm:text-4xl">{s.value}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-cream/45">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== JOURNEY: Exposed → Connected → Ready ===== */}
      <section className="border-b border-border bg-cream-grain">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            align="center"
            eyebrow="The BlakNet journey"
            title={<>From visibility to opportunity, in one place.</>}
            description="Black businesses don't just need more visibility — they need better access to networks, knowledge, resources and opportunities. BlakNet moves you through the full journey."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: Search,
                title: "Get Exposed",
                body: "A verified business profile, directory listing and reviews so the right people find you first.",
                tone: "sage",
              },
              {
                step: "02",
                icon: Network,
                title: "Get Connected",
                body: "A professional newsfeed, events and a lightweight CRM to build a real, opportunity-grade network.",
                tone: "ink",
              },
              {
                step: "03",
                icon: Rocket,
                title: "Get Ready",
                body: "Resources, verification and trust signals that prepare your business for procurement and funding.",
                tone: "sage",
              },
            ].map((c, i) => (
              <div
                key={c.step}
                className="card-lift group relative overflow-hidden rounded-xl border border-border bg-card p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-4xl text-foreground/10 transition-colors group-hover:text-sage/30">{c.step}</span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-cream shadow-md transition-transform group-hover:scale-110">
                    <c.icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-7 font-display text-2xl tracking-tight">{c.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                {i < 2 && (
                  <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 rotate-0 text-foreground/20 md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED BUSINESSES ===== */}
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Featured businesses"
              title={<>Meet the businesses building BlakNet.</>}
              description="Verified, Black-owned businesses across South Africa — from cloud systems to civils, accounting to agriculture."
            />
            <Button variant="outline" onClick={() => navigate({ name: "directory" })} className="btn-lift self-start sm:self-end">
              Browse the directory <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />
                ))
              : featured.map((b, i) => (
                  <div key={b.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <BusinessCard
                      business={b}
                      onNavigate={(slug) => navigate({ name: "business", slug })}
                    />
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* ===== CAPABILITIES ===== */}
      <section className="bg-ink-grain text-cream">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            tone="cream"
            eyebrow="One platform, many tools"
            title={<>Everything a Black-owned business needs to grow.</>}
            description="BlakNet combines discovery, community, events, a CRM, resources and verification — designed mobile-first for South African entrepreneurs."
          />
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-cream/10 bg-cream/10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Building2, title: "Business Directory", desc: "Search and filter Black-owned businesses by industry, province, B-BBEE level and verification status." },
              { icon: ShieldCheck, title: "Verification", desc: "Submit CIPC, B-BBEE and tax verification. Display trust signals that win procurement contracts." },
              { icon: Newspaper, title: "Newsfeed", desc: "A professional business community for posts, announcements, opportunities and articles." },
              { icon: Calendar, title: "Events", desc: "Discover and host networking, workshops, webinars and funding events across the country." },
              { icon: Users, title: "Network CRM", desc: "A lightweight, practical CRM to manage clients, suppliers, partners and prospects." },
              { icon: BookOpen, title: "Resources", desc: "Practical, no-fluff guides, templates and checklists for compliance, finance and growth." },
            ].map((c) => (
              <div key={c.title} className="group bg-ink/40 p-7 backdrop-blur transition-all hover:bg-ink/55 hover:shadow-lg">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage/15 text-sage transition-transform group-hover:scale-110">
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-xl tracking-tight text-cream">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/65">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIAL ===== */}
      <section className="bg-cream-grain">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <Quote className="mx-auto h-10 w-10 text-sage" />
          <p className="mt-6 font-display text-2xl leading-snug tracking-tight text-ink sm:text-3xl">
            “BlakNet is where I get discovered, where I build my network, and where I prove my business is ready.
            It's the digital infrastructure we've been waiting for.”
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink font-display text-base text-cream ring-4 ring-sage/15">
              T
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold">Thandiwe Mokoena</div>
              <div className="text-xs text-muted-foreground">Founder, Lwazi Cloud Systems · Verified member</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-ink-grain px-6 py-16 text-center text-cream shadow-2xl shadow-ink/20 sm:px-12">
            {/* glow accents */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-20 left-1/2 h-72 w-96 -translate-x-1/2 rounded-full bg-sage/20 blur-[100px]" />
            </div>
            <div className="pointer-events-none absolute inset-0 opacity-30">
              <LogoMark className="absolute -bottom-8 -right-8 h-64 w-64 text-cream/10" size={256} />
            </div>
            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-sage">
                <Sparkles className="h-3.5 w-3.5" /> Built for Black Business
              </div>
              <h2 className="mx-auto max-w-2xl font-display text-3xl leading-tight tracking-tight sm:text-4xl md:text-5xl">
                Ready to get exposed, connected and ready?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-cream/60">
                Create your free BlakNet profile in minutes. Get listed, get discovered, and start building your network.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button
                  size="lg"
                  onClick={() => navigate({ name: "register" })}
                  className="btn-lift bg-cream text-ink shadow-lg shadow-cream/10 hover:bg-white hover:shadow-cream/20"
                >
                  Join BlakNet — it's free <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate({ name: "pricing" })}
                  className="btn-lift border-cream/25 bg-cream/5 text-cream backdrop-blur hover:bg-cream/15 hover:text-cream"
                >
                  View plans
                </Button>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-cream/50">
                <span className="inline-flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Free forever plan</span>
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Verification available</span>
                <span className="inline-flex items-center gap-1.5"><Network className="h-3.5 w-3.5" /> Real community</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
