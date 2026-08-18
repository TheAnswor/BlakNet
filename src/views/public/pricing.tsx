"use client";

import { useApp } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/blaknet/section";
import { Pill } from "@/components/blaknet/badges";
import { PLANS, type PlanTier } from "@/lib/constants";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Check, Sparkles, ArrowRight, ShieldCheck, Building2 } from "lucide-react";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can downgrade or cancel your subscription at any time from your dashboard. You keep access until the end of your current billing cycle, then your plan reverts to Starter.",
  },
  {
    q: "What is BlakNet verification?",
    a: "Verification is our trust signal for procurement-ready businesses. Verified businesses submit CIPC registration documents, a B-BBEE certificate (where applicable), and tax compliance proof. Once approved, your profile shows a verified badge, gets priority search ranking and unlocks WhatsApp enquiries.",
  },
  {
    q: "Do you support Yoco payments?",
    a: "Yoco integration is in active development. For now you can express intent to upgrade and we will contact you to confirm subscription activation manually. Paid plans will be billed through Yoco once the integration is live.",
  },
];

export function PricingView() {
  const { navigate, authUser } = useApp();
  const { toast } = useToast();

  const handleCta = (plan: PlanTier) => {
    if (!authUser) {
      navigate({ name: "register" });
      return;
    }
    if (plan.id === "STARTER") {
      if (authUser.plan === "STARTER") {
        toast({
          title: "Current plan",
          description: "You're already on the Starter plan.",
        });
        return;
      }
      toast({
        title: "Starter plan",
        description: "You can downgrade from your dashboard's plan settings.",
      });
      return;
    }
    toast({
      title: "Upgrade flow coming soon",
      description: "Yoco integration in progress — we'll contact you to confirm.",
    });
  };

  return (
    <div className="flex flex-col">
      {/* ===== HEADER ===== */}
      <section className="relative overflow-hidden bg-cream-grain">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-sage/15 blur-[90px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <SectionHeading
            align="center"
            eyebrow="Pricing"
            title="Plans that grow with your business."
            description="Start free. Upgrade when you're ready for verification, intelligence and procurement-grade features."
          />
          <div className="mt-6 flex items-center justify-center">
            <Pill tone="sage">
              <Sparkles className="h-3 w-3" /> Free forever plan · No card required
            </Pill>
          </div>
        </div>
      </section>

      {/* ===== PLAN CARDS ===== */}
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3 max-w-6xl mx-auto lg:items-stretch">
            {PLANS.map((plan) => {
              const isHighlight = plan.highlight;
              const isCurrent = authUser?.plan === plan.id;
              const isCurrentStarter = plan.id === "STARTER" && isCurrent;
              const includedFeatures = plan.features.filter((f) => f.included);

              return (
                <div
                  key={plan.id}
                  className={
                    isHighlight
                      ? "card-lift relative flex flex-col overflow-hidden rounded-2xl bg-ink-grain text-cream ring-2 ring-sage shadow-2xl shadow-ink/30 lg:scale-[1.04]"
                      : "card-lift relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm"
                  }
                >
                  {isHighlight && (
                    <>
                      <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-64 -translate-x-1/2 rounded-full bg-sage/25 blur-[60px]" />
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-sage px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink shadow-md">
                          <Sparkles className="h-3 w-3" /> Most popular
                        </span>
                      </div>
                    </>
                  )}

                  <div className="relative flex h-full flex-col p-6 sm:p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h3
                        className={
                          isHighlight
                            ? "font-display text-2xl tracking-tight text-cream"
                            : "font-display text-2xl tracking-tight text-ink"
                        }
                      >
                        {plan.name}
                      </h3>
                      {isCurrent && (
                        <Pill tone={isHighlight ? "cream" : "sage"} className="shrink-0">
                          Current
                        </Pill>
                      )}
                    </div>
                    <p
                      className={
                        isHighlight
                          ? "mt-1 text-sm text-cream/60"
                          : "mt-1 text-sm text-muted-foreground"
                      }
                    >
                      {plan.tagline}
                    </p>

                    {/* Price */}
                    <div className="mt-6 flex items-baseline gap-1.5">
                      <span
                        className={
                          isHighlight
                            ? "font-display text-5xl tracking-tight text-cream"
                            : "font-display text-5xl tracking-tight text-ink"
                        }
                      >
                        {plan.price}
                      </span>
                      <span
                        className={
                          isHighlight
                            ? "text-xs text-cream/50"
                            : "text-xs text-muted-foreground"
                        }
                      >
                        {plan.cadence}
                      </span>
                    </div>

                    {/* CTA */}
                    <div className="mt-6">
                      <Button
                        type="button"
                        disabled={isCurrentStarter}
                        onClick={() => handleCta(plan)}
                        className={
                          isHighlight
                            ? "btn-lift w-full bg-cream text-ink shadow-lg shadow-cream/10 hover:bg-white hover:shadow-cream/20"
                            : "btn-lift w-full bg-ink text-cream shadow-md shadow-ink/15 hover:bg-ink/90"
                        }
                      >
                        {isCurrentStarter ? "Current plan" : plan.cta}
                        {!isCurrentStarter && (
                          <ArrowRight className="ml-1.5 h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Divider */}
                    <div
                      className={
                        isHighlight
                          ? "my-6 h-px bg-cream/15"
                          : "my-6 h-px bg-border"
                      }
                    />

                    {/* Features — only show included ones (reduces noise) */}
                    <ul className="flex flex-1 flex-col gap-3">
                      <li
                        className={
                          isHighlight
                            ? "mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-cream/45"
                            : "mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground"
                        }
                      >
                        What's included
                      </li>
                      {includedFeatures.map((f) => (
                        <li key={f.label} className="flex items-start gap-2.5">
                          <span
                            className={
                              isHighlight
                                ? "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sage/20"
                                : "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sage/15"
                            }
                          >
                            <Check className="h-3 w-3 text-sage" />
                          </span>
                          <span className="flex-1 text-sm leading-relaxed text-foreground/80">
                            {f.label}
                          </span>
                          {f.badge && (
                            <span
                              className={
                                f.badge === "Soon"
                                  ? "shrink-0 rounded-full border border-muted-foreground/30 bg-muted-foreground/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                                  : isHighlight
                                    ? "shrink-0 rounded-full bg-sage/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sage"
                                    : "shrink-0 rounded-full bg-sage/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sage"
                              }
                            >
                              {f.badge}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== FAQ / COMPARE ===== */}
      <section className="bg-cream-grain">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            align="center"
            eyebrow="Compare in detail"
            title="Questions, answered."
            description="Everything you need to know about plans, billing and verification."
          />
          <Accordion type="single" collapsible className="mt-10 w-full">
            {FAQS.map((f) => (
              <AccordionItem key={f.q} value={f.q} className="rounded-xl border border-border bg-card px-5 mb-3 shadow-sm">
                <AccordionTrigger className="font-display text-lg text-ink hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-[15px] leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ===== ENTERPRISE BAND ===== */}
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-border bg-card px-6 py-8 text-center shadow-sm sm:flex-row sm:text-left">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-cream shadow-md">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-xl tracking-tight text-ink">
                  Need enterprise or API access?
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Custom onboarding, dedicated support and integration support.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                toast({
                  title: "Talk to us",
                  description: "Email hello@blaknet.co.za — we'll be in touch.",
                })
              }
              className="btn-lift shrink-0 border-ink/20 bg-transparent text-ink hover:bg-ink/5"
            >
              <ShieldCheck className="mr-1.5 h-4 w-4" /> Talk to us
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
