"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { LogoMark } from "@/components/blaknet/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Building2,
  Users,
  Newspaper,
  Calendar,
  BookOpen,
  Bell,
  CreditCard,
  LifeBuoy,
  Settings,
  Menu,
  LogOut,
  ExternalLink,
  Shield,
  Heart,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import type { Route } from "@/lib/types";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: Route;
  match: string[];
}

const NAV: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, route: { name: "dashboard" }, match: ["dashboard"] },
  { label: "My Businesses", icon: Building2, route: { name: "dashboard-businesses" }, match: ["dashboard-businesses", "dashboard-business-new", "dashboard-business"] },
  { label: "My Network", icon: Users, route: { name: "dashboard-network" }, match: ["dashboard-network"] },
  { label: "Following", icon: Heart, route: { name: "dashboard-following" }, match: ["dashboard-following"] },
  { label: "Enquiries", icon: Inbox, route: { name: "dashboard-enquiries" }, match: ["dashboard-enquiries"] },
  { label: "Newsfeed", icon: Newspaper, route: { name: "dashboard-newsfeed" }, match: ["dashboard-newsfeed"] },
  { label: "Events", icon: Calendar, route: { name: "dashboard-events" }, match: ["dashboard-events"] },
  { label: "Resources", icon: BookOpen, route: { name: "dashboard-resources" }, match: ["dashboard-resources"] },
  { label: "Notifications", icon: Bell, route: { name: "dashboard-notifications" }, match: ["dashboard-notifications"] },
  { label: "My Plan", icon: CreditCard, route: { name: "dashboard-plan" }, match: ["dashboard-plan"] },
  { label: "Help", icon: LifeBuoy, route: { name: "dashboard-help" }, match: ["dashboard-help"] },
  { label: "Settings", icon: Settings, route: { name: "dashboard-settings" }, match: ["dashboard-settings"] },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { route, navigate, authUser } = useApp();
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!authUser) return;
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setUnread((d.items ?? []).filter((n: { read: boolean }) => !n.read).length))
      .catch(() => {});
  }, [authUser, route.name]);

  const Sidebar = (
    <div className="flex h-full flex-col bg-ink text-cream">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <button onClick={() => navigate({ name: "home" })} className="flex items-center gap-2.5">
          <LogoMark className="text-cream" size={32} />
          <span className="font-display text-2xl tracking-tight">
            Blak<span className="text-sage">Net</span>
          </span>
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-4 scroll-elegant overflow-y-auto">
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
              {item.label === "Notifications" && unread > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-sage px-1.5 text-[10px] font-semibold text-ink">
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-cream/10 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sage text-xs font-semibold text-ink">
            {authUser ? initials(authUser) : "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-cream">
              {authUser ? `${authUser.firstName} ${authUser.lastName}` : ""}
            </p>
            <p className="text-[11px] text-cream/50">{authUser?.plan ?? "STARTER"} plan</p>
          </div>
        </div>
        <button
          onClick={() => navigate({ name: "home" })}
          className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-cream/50 hover:bg-cream/5 hover:text-cream"
        >
          <ExternalLink className="h-3.5 w-3.5" /> View public site
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">{Sidebar}</aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 border-cream/10 bg-ink p-0">
              {Sidebar}
            </SheetContent>
          </Sheet>

          <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            <span className="font-medium text-foreground">Dashboard</span>
            <span className="text-foreground/30">/</span>
            <span className="capitalize">{currentLabel(route.name)}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => navigate({ name: "dashboard-notifications" })}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground/70 hover:border-foreground/30 hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-sage px-1 text-[10px] font-semibold text-ink">
                  {unread}
                </span>
              )}
            </button>
            {authUser?.role === "ADMIN" && (
              <Button variant="outline" size="sm" onClick={() => navigate({ name: "admin" })} className="hidden sm:inline-flex">
                <Shield className="mr-1.5 h-3.5 w-3.5" /> Admin
              </Button>
            )}
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

function currentLabel(name: string) {
  const item = NAV.find((n) => n.match.includes(name));
  if (item) return item.label.toLowerCase();
  if (name === "dashboard-business-new") return "new business";
  if (name === "dashboard-business") return "business detail";
  return name.replace("dashboard-", "").replace(/-/g, " ");
}
