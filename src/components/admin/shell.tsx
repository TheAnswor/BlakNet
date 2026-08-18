"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { LogoMark } from "@/components/blaknet/logo";
import { EmptyState } from "@/components/blaknet/section";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import type { Route } from "@/lib/types";
import {
  LayoutDashboard,
  Shield,
  Building2,
  Users,
  Calendar,
  Newspaper,
  BookOpen,
  CreditCard,
  TrendingUp,
  Clock,
  Sparkles,
  Menu,
  LogOut,
  ArrowRight,
  Star,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: Route;
  match: string[];
}

const NAV: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, route: { name: "admin" }, match: ["admin"] },
  { label: "Verification", icon: Shield, route: { name: "admin-verification" }, match: ["admin-verification"] },
  { label: "Users", icon: Users, route: { name: "admin-users" }, match: ["admin-users"] },
  { label: "Businesses", icon: Building2, route: { name: "admin-businesses" }, match: ["admin-businesses"] },
  { label: "Reviews", icon: Star, route: { name: "admin-reviews" }, match: ["admin-reviews"] },
  { label: "Subscriptions", icon: CreditCard, route: { name: "admin-subscriptions" }, match: ["admin-subscriptions"] },
  { label: "Industries", icon: Sparkles, route: { name: "admin-industries" }, match: ["admin-industries"] },
  { label: "Events", icon: Calendar, route: { name: "admin-events" }, match: ["admin-events"] },
  { label: "Newsfeed", icon: Newspaper, route: { name: "admin-newsfeed" }, match: ["admin-newsfeed"] },
  { label: "Resources", icon: BookOpen, route: { name: "admin-resources" }, match: ["admin-resources"] },
];

interface SoonItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const COMING_SOON: SoonItem[] = [
  { label: "Reports", icon: TrendingUp },
  { label: "Settings", icon: Clock },
];

function currentLabel(name: string) {
  const item = NAV.find((n) => n.match.includes(name));
  if (item) return item.label.toLowerCase();
  return name.replace(/^admin-/, "").replace(/-/g, " ");
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { route, navigate, authUser, authLoading } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const Sidebar = (
    <div className="flex h-full flex-col bg-ink text-cream">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <button onClick={() => navigate({ name: "admin" })} className="flex items-center gap-2.5">
          <LogoMark className="text-cream" size={32} />
          <span className="font-display text-2xl tracking-tight">
            Blak<span className="text-sage">Net</span>
          </span>
        </button>
      </div>
      <div className="px-5 pt-3 pb-1">
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-sage">Admin Console</span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2 scroll-elegant">
        {NAV.map((item) => {
          const active = item.match.includes(route.name);
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.route)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sage/15 text-cream"
                  : "text-cream/60 hover:bg-cream/5 hover:text-cream",
              )}
            >
              <item.icon className={cn("h-4 w-4", active && "text-sage")} />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
        <div className="px-3 pt-4 pb-1">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-cream/40">Coming soon</span>
        </div>
        {COMING_SOON.map((item) => (
          <div
            key={item.label}
            className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-cream/30"
          >
            <item.icon className="h-4 w-4" />
            <span className="flex-1 text-left">{item.label}</span>
            <span className="inline-flex items-center rounded-full border border-cream/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-cream/40">
              Soon
            </span>
          </div>
        ))}
      </nav>
      <div className="border-t border-cream/10 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage text-xs font-semibold text-ink">
            {authUser ? initials(authUser) : "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-cream">
              {authUser ? `${authUser.firstName ?? ""} ${authUser.lastName ?? ""}`.trim() : ""}
            </p>
            <p className="text-[11px] text-cream/50">Administrator</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-sage/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-sage">
            Admin
          </span>
        </div>
      </div>
    </div>
  );

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/15 border-t-ink" />
      </div>
    );
  }

  if (authUser?.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <EmptyState
          icon={Shield}
          title="Admin access required."
          description="You need an admin account to view this section."
          action={
            <Button
              onClick={() => navigate({ name: "dashboard" })}
              className="bg-ink text-cream hover:bg-ink/90"
            >
              <ArrowRight className="mr-1.5 h-4 w-4" /> Back to dashboard
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">{Sidebar}</aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 border-cream/10 bg-ink p-0">
              {Sidebar}
            </SheetContent>
          </Sheet>

          <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            <span className="font-medium text-foreground">Admin</span>
            <span className="text-foreground/30">/</span>
            <span className="capitalize">{currentLabel(route.name)}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ name: "dashboard" })}
              className="hidden sm:inline-flex"
            >
              <ArrowRight className="mr-1.5 h-3.5 w-3.5" /> Back to dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                await useApp.getState().refreshAuth();
                navigate({ name: "home" });
              }}
              className="text-muted-foreground"
            >
              <LogOut className="mr-1.5 h-4 w-4" /> Sign out
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
