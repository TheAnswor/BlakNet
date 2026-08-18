"use client";

import { useApp } from "@/lib/store";
import { Logo } from "@/components/blaknet/logo";
import { Mail, MapPin, Linkedin, Twitter, Instagram } from "lucide-react";

const COLS: { title: string; links: { label: string; route: Parameters<ReturnType<typeof useApp.getState>["navigate"]>[0] }[] }[] = [
  {
    title: "Platform",
    links: [
      { label: "Directory", route: { name: "directory" } },
      { label: "Newsfeed", route: { name: "newsfeed" } },
      { label: "Events", route: { name: "events" } },
      { label: "Resources", route: { name: "resources" } },
      { label: "Pricing", route: { name: "pricing" } },
    ],
  },
  {
    title: "Business",
    links: [
      { label: "Add your business", route: { name: "register" } },
      { label: "Get Verified", route: { name: "pricing" } },
      { label: "About BlakNet", route: { name: "about" } },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", route: { name: "login" } },
      { label: "Join BlakNet", route: { name: "register" } },
      { label: "Dashboard", route: { name: "dashboard" } },
    ],
  },
];

export function PublicFooter() {
  const navigate = useApp((s) => s.navigate);
  return (
    <footer className="mt-auto bg-ink-grain text-cream/80">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo textClassName="text-cream" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/60">
              The digital infrastructure connecting Black-owned businesses to one another and to the wider opportunity ecosystem.
            </p>
            <div className="mt-5 flex gap-3">
              {[Linkedin, Twitter, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/15 text-cream/70 transition-colors hover:border-cream/40 hover:text-cream"
                  aria-label="social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/50">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <button
                      type="button"
                      onClick={() => navigate(l.route)}
                      className="link-underline text-sm text-cream/75 hover:text-cream"
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-cream/10 pt-6 text-xs text-cream/45 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>© {new Date().getFullYear()} BlakNet. All rights reserved.</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Johannesburg, South Africa
            </span>
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3 w-3" /> hello@blaknet.co.za
            </span>
          </div>
          <span className="font-display text-base italic text-cream/60">
            Get Exposed. Get Connected. Get Ready.
          </span>
        </div>
      </div>
    </footer>
  );
}
